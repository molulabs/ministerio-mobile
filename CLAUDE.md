@AGENTS.md

## Project context

Offline-first Android app (iOS later) for the livestock/producer census of the Ministerio de Producción (Jujuy). Field enumerators (`ROLE_ENUMERATOR`) work a full day without signal; data is sent when connectivity returns.

- Plan: https://claude.ai/artifact/7Wky6z823sxr2X6eubfEPH — read it before starting a new phase.
- Sibling repos in `../`: `api/` (Symfony, JWT via `/api/login` + `/api/refresh`), `app/` (web, React + Formik/Yup), `infra/` (Docker Compose + nginx).
- Mobile API lives under `/api/mobile/` (`GET catalogs` with ETag, idempotent `PUT census-submissions/{uuid}`).
- A census is of one farm of its producer, and the API decides which one when it accepts the submission (`schemaVersion` 2). It never asks the phone. The farm data (RENSPA, coordinates, whether the producer lives there) goes in `productionUnit`. The census form needs an "Es otra finca del productor" checkbox, sent as `newFarm: true`. Whatever the API cannot tell apart is flagged for review on the web. A 409 is never retried: the census stays as `anomaly` on the phone (see Census outbox). Rules: `../api/CLAUDE.md` → Farms.

## Core rules (from the plan)

- SQLite is the only source of truth on the device. Screens read/write SQLite through repositories; only the sync engine talks to the API (except login). No Redux, RTK Query or TanStack Query.
- Never lose field data: never delete unsent census rows on logout, token failure or migration.
- Each census is sent only with its own user's token.
- Census rules never go into the design system (`@molulabs/ds`).
- The app will be forked as a base for other apps: the fork removes everything about censuses (`features/census/`, its tables and its sync) and adds its own home tab. Keep the census inside `features/census/` so it comes out whole.

## Folder structure

- Everything about the census lives in `features/census/` (a fork removes it whole): `census.repository.ts` (the only door to the `censuses` table), `list/` (the Censos tab) and `form/` (the wizard, one folder per step under `form/steps/`, named as in the web so each web change has its twin file).
- The GPS is device access: `infrastructure/location/` (`currentLocation`, `useGpsPosition`), used by the map and the census form. Coordinate formatting: `shared/utilities/coordinates.ts`.
- Names: screens `*.screen.tsx`, components `Component.tsx`, logic camelCase with its role (`census.repository.ts`, `outbox.sender.ts`).

## Navigation

- React Navigation 7 in `src/app/navigation/`: `RootStack` (native stack) shows `Login` when signed out and `Main` (bottom tabs: Censos · Mapa · Perfil) when signed in. The app opens on Censos, and Android's back button returns there from any tab (`backBehavior="initialRoute"`). There is no home tab (decided 2026-11-13): the warning that the offline data was never downloaded is on Censos. The session decides which screens exist, so the back button never crosses between them; nobody calls `navigate` to sign in or out.
- Route names and params are typed in `routes.ts` (global `ReactNavigation.RootParamList`).
- Screens live in their feature; `src/app/navigation/` wires them and passes what crosses features as props (e.g. the profile tab gets the session user).
- The tab bar and the top bar are the design system's (`AppTabBar.tsx`, icons in `TAB_ICONS`). The Censos tab shows the user's unsent censuses as a badge. The top bar's second line says why the phone cannot send, and only then: "Sin conexión" (no signal) or "Sesión sin conexión" (offline sign-in).
- Signing out with unsent censuses asks first (Perfil): they stay on the phone, but only their owner can send them.

## Offline sign-in

- An online sign-in keeps, per user, a PBKDF2-SHA256 verifier of the password (never the password) in SecureStore: `features/auth/offline/`. Signing out keeps it, so the user can sign in again without signal.
- Sign-in tries the API first; only without signal or with the API failing (5xx) it checks the verifier. A 401 from the API is always a wrong password.
- Offline sign-in is refused when: the user never signed in online on this phone, more than 7 days passed since the API last confirmed the account (an online sign-in, a token refresh or a successful `/me`), 5 wrong passwords in a row (an online sign-in unlocks), or the phone clock went back more than 10 minutes.
- An offline session has no tokens: sending anything needs an online sign-in first.
- PBKDF2 runs in native code with `react-native-quick-crypto` (`expo-crypto` has no key derivation). `PBKDF2_ITERATIONS` (310 000, ~150 ms on the emulator) still has to be measured on a low-end phone; each verifier keeps its own count, so it can be raised.

## Local database

- SQLite (`expo-sqlite`) with Drizzle ORM, in `src/infrastructure/db/`: `schema.ts` (tables), `client.ts` (`openDatabase`, `getDatabase`), `migrations/` (generated, do not edit).
- Encrypted with SQLCipher (`['expo-sqlite', { useSQLCipher: true }]` in `app.config.ts`). The 32-byte key is created on first start and kept in SecureStore (`db.encryptionKey`); it is never replaced, because a new key makes the existing file unreadable.
- If the database cannot be opened, the app shows an error screen and deletes nothing.
- Schema changes: edit `schema.ts`, then `pnpm db:generate --name <what_changed>`. Migrations are bundled as `.sql` (Babel `inline-import` + Metro `sourceExts`) and run at start-up, before navigation is shown.
- `bootstrap()` opens the database before restoring the session; call `getDatabase()` only after that (it throws otherwise).
- Screens get live data with `useLiveQuery` (the database is opened with `enableChangeListener`), e.g. `useSyncState` in `infrastructure/sync/syncState.ts`.
- `censuses`: one row per census, id UUID v7 (made on the phone, the order of the ids is the order of the censuses), `userId`, `payload` (JSON, the API's submission body), `status` (`draft` | `ready` | `sent` | `in_review` | `needs_fix` | `anomaly`), and what the API answered (`errors`, `conflict`, `censusId`). Screens read it through `features/census/census.repository.ts`; only the outbox store changes the status of a census.
- `sync_state` is key/value for the sync engine (`lastSyncAt`, `catalogsEtag`); the catalog tables (`localities`, `livestock_breeds`, `forest_species`, `producer_index`) are written only by the catalogs puller. `lastSyncAt` is the last catalogs check: sending censuses does not move it (Perfil shows it as "Datos actualizados").

## Sync

- Only the sync engine talks to the API (besides sign-in). `src/app/sync.ts` wires it to its triggers: start-up, an online sign-in, the signal coming back and the app coming back to the front. It does nothing without an online session (an offline sign-in has no tokens).
- Every trigger sends the ready censuses first, then pulls the catalogs and the maps. One sync at a time: a trigger that arrives while one runs joins it. A failure keeps what the phone has and waits for the next trigger; there is no retry loop.
- Automatic triggers skip the catalogs and the maps when the catalogs were synced less than 15 minutes ago (`SYNC_MIN_INTERVAL_MS`); the censuses are sent anyway. An online sign-in always syncs (`force`).
- Catalogs (`infrastructure/sync/catalogs.puller.ts`): `GET /api/mobile/catalogs` with the saved ETag. A 304 only updates `catalogsSyncedAt` and `lastSyncAt`; a 200 is checked and then replaces every catalog, the ETag and both sync times in one transaction. A bad body or a failed request never touches the saved catalogs.
- Signal (`infrastructure/network/network.monitor.ts`, `expo-network`): Android repeats the network event every ~3 s without changes, so only the no-signal → signal transition counts, and the signal must then hold 30 s (`STABLE_SIGNAL_MS`) before a sync; a cut in between cancels it.
- No generic task queue: the censuses are queued in SQLite (the outbox), and catalogs only need single-flight plus the interval.

## Census outbox

- `infrastructure/sync/outbox.sender.ts` sends the `ready` censuses of the signed-in user with an online session, oldest first, one at a time: `PUT /api/mobile/census-submissions/{id}`, 30 s timeout. Each census goes only with its own user's token; an offline session sends nothing.
- Answers: 201 → `sent`; 202 → `in_review` (`conflict` says what the office must check); 422 → `needs_fix` (`errors`, one per field); 409 → `anomaly`, **never retried** (the API has another census under that id, or refused it for a clash); 401 stops the run without counting an attempt; any other 4xx waits and the run goes on; no signal or 5xx waits and the run stops. Waiting is a backoff of 1, 2, 4… minutes, up to 30.
- A sent payload never changes: the API answers a repeated PUT only when the body is the same, and 409 otherwise.
- `outbox.store.ts` only changes rows still `ready`, so a late answer never overwrites an earlier one.
- `sendNow` has its own serial queue, so the "Enviar censos" button does not wait for a map download. `src/app/sync.ts` exports `sendCensusesNow()` (forced: it ignores the backoff).
- The Censos tab (`features/census/list/census-list.screen.tsx`) lists the user's censuses live, grouped as Para revisar (`needs_fix`, `anomaly`), Borradores (`draft`), Pendientes de envío (`ready`) and Enviados (`sent`, `in_review`); tapping a draft opens it in the form, tapping one the API answered opens what it said.
- The census form (`features/census/form/`) is the web's 8-step wizard. A draft is saved 500 ms after each change and when the form closes, with the step it was on (`form_step`), and opens there again. Finishing needs the date and the producer (name and document); the rest the API checks. Only drafts can be discarded.
- Each step keeps its values as typed (`steps/<step>/<step>.helper.ts`: `toXPayload` / `fromXPayload`, like the web's helpers); `censusForm.model.ts` turns them into the payload.
- Producer step: searches the phone's `producer_index` (`catalogs.queries.ts`) by document or name. Of a registered producer the phone only has the name and the document: the document is not edited, nothing else starts filled (not even the nationality), and what is left empty goes as null, which the API reads as "keep". A locality the phone lacks goes as `{ name }` (needs the department). RENSPA and "vive en la finca" go in `productionUnit`; "Es otra finca del productor" (`newFarm`) shows only for a registered producer.
- Fields more than one step asks (department + locality, coordinates with "Usar mi ubicación") live in `form/fields/`; generic ones (`SelectField`, `AutocompleteField`, `YesNoField`) in `shared/ui/`. Production unit step: the farm's address only when the producer does not live on it (as the web), surface, land tenure and services.
- Livestock step (`steps/livestock/`): "¿Registra actividad pecuaria?", then per species whether it has any and, only then, own and third-party counts per kind of animal (whole numbers, empty goes as null), the calculated total, its breeds, the total of the paper form (a warning when it differs, never a block) and its practices. Breeds come from the phone's `livestock_breeds`; one the phone lacks goes as `{ name }` and the API adds it to the catalog. The rows of each species are in `livestock.constants.ts`.
- Crops (`steps/crops/`), farm inputs (`steps/farmInputs/`) and infrastructure (`steps/infrastructure/`) port the web's steps. Only crops with something typed go in `plots`. A forest species the phone lacks goes as `forestSpeciesId: { name }`; a forest row with something typed but no species or type stops "Terminar" (the API could not take it, and leaving it out would lose it). Figures go through `form/fields/NumberField.tsx` (`decimal` for hectares) and `FieldPairs` lays short fields two by two.
- Familia y finanzas (`steps/familyFinances/`): spouse, children (a warning when more study than there are), advice, associations, finances and workers, with calculated totals.
- A census to fix (`needs_fix`) is fixed on the phone: "Corregir" in its sheet runs `reopenToFix`, which in one transaction copies it into a draft with a new id (its payload and `errors`, opened on the first step with an error, `firstStepToFix`) and deletes the rejected row. The new id keeps an id the API has seen from ever going with another body. Each step shows the errors of its fields (`stepOfField`), the summary all of them; finishing clears them. An error is shown with what the form calls its field (`form/fieldLabels.ts`, `labelOfField`: "Hectáreas totales: …", "Ajo: Hectáreas", "Especie 2: Tipo"), named against the rejected payload, and kept in the draft's `errors` when it is reopened; the names come from each step's constants, so a new field needs its name there (a test checks every field sent has one). The list tags such a draft "A corregir". An `anomaly` is never reopened.
- Unsent = `draft` + `ready` + `needs_fix` (the badge and the sign-out warning). An `anomaly` is not counted: the phone can do nothing more with it.
- Development builds have a "Crear censo de prueba" button (`__DEV__` only) that saves a made-up census (`features/census/testCensus.ts`, DNI 99000001) ready to send.

## Design system

- `@molulabs/ds` (GitHub tag in `package.json`), theme `senal`, as the ministry's web. Its components are native but typed with web props: `onClick` is `onPress`, and `src/shared/ui/` (`Screen`, `Text`, `TextField`) adapts what screens need.
- Toasts: `useToasts().push(tone, title, message)`. They are drawn above the tab bar: `AppTabBar` measures itself into `tabBarHeight.ts`.
- Branding: the "CP" mark on the accent of `senal` (`#0E7282`) for the launcher icon, the Jujuy logo on the splash and the login.

## Platform targets

| Setting    | Value            | Where                                                                   |
| ---------- | ---------------- | ----------------------------------------------------------------------- |
| Expo SDK   | 58               | `package.json`                                                          |
| minSdk     | 24 (Android 7.0) | pinned in `app.config.ts` → `expo-build-properties`; decided 2026-11-04 |
| targetSdk  | 36 (Android 16)  | Expo SDK 58 default                                                     |
| compileSdk | 37 (Android 17)  | Expo SDK 58 default                                                     |

Change minSdk only in `app.config.ts`, never in `android/`. The ministry's field phone models are not known yet; when they are, revisit minSdk and the low-end device used for the map spike.

## Releases

- EAS (`eas.json`), project `censo-scad-jujuy`. Profiles: `development` (dev client, local API), `preview` (APK for the field phones, production API), `production` (AAB for Google Play, later). Version codes are kept by EAS (`appVersionSource: remote`); `version` in `app.config.ts` is raised by hand.
- An `env` value in a build profile wins over the committed `.env`.
- OTA updates (EAS Update) are not set up yet. When they are, they need a fixed `runtimeVersion`: the SQLite migrations ship in the JS.

## Tests

- Jest with the `jest-expo` preset and React Native Testing Library. Tests live in `src/__tests__/`, mirroring the path of the code they test (`src/__tests__/infrastructure/api/authRefresh.test.ts`).
- RNTL v14: `render`, `fireEvent` and `act` are async — always `await` them.
- Find elements as a user would: `getByLabelText`, `getByRole('button', { name })`, `getByText`. Give inputs an `accessibilityLabel` and pressables `accessibilityRole="button"`.
- HTTP: give a fresh axios instance a fake `adapter` (see `authRefresh.test.ts`) instead of adding a mocking library.
- Screen tests mock the session store, `@/src/infrastructure/sync/syncState`, `@/src/features/census/census.repository` and `@/src/infrastructure/network/network.monitor`, so the API client, SecureStore and SQLite are never loaded. Screens that push toasts render inside `ToastProvider`.
- TypeScript 6 includes no `@types/*` by default: global types are listed in `tsconfig.json` → `types`.

## Local development

- Everything runs on the host (not in Docker), except the API.
- The app reaches the API through the mobile port of the local nginx, `8000` (`infra/dev/nginx/mobile.conf`), which serves the API whatever the Host header is. Port 80 routes by host name (`api.*.local`) and does not work from the emulator.
- API URL: `API_URL` in `.env` (committed, `http://10.0.2.2:8000`, the host as seen from the emulator), read by `app.config.ts` into `extra.apiUrl`; the config fails if it is missing. Personal overrides go in `.env.local` (git-ignored), e.g. a phone on the LAN: `API_URL=http://<computer IP>:8000`. Restart Metro after changing either. Secrets never go in `.env`: they will live in EAS environment variables.
- Dev users (API fixtures, password `password`): `rosa@company.com` and `hugo@company.com` are enumerators; `user@company.com` is an operator, which the app must reject.
- Debug builds allow plain HTTP (generated debug manifest); release builds do not.
- Run the API console as the php-fpm user, `docker exec -u www-data ministerio-api-1 bin/console …`: run as root, it leaves a cache the API cannot write (every request then fails with 500).
- Emulator: `emulator -avd Medium_Phone_API_37.0 -gpu swiftshader_indirect` (software rendering). On this machine both `auto` and `host` GPU modes crashed the API 37 emulator.
- Do not start Metro with `CI=1`: it disables watch mode and hot reload.
- Do not run pnpm commands while a native build (`pnpm android`) runs: once `node_modules/.bin` was rewritten mid-build and Gradle failed on a missing intermediate file. `pnpm install --offline` relinks the bins.
- `android/` and `ios/` are generated (CNG) and git-ignored. `pnpm android` does not regenerate an existing `android/`: after changing plugins in `app.config.ts`, run `pnpm expo prebuild --platform android --no-install` first (the `useSQLCipher` change was silently ignored until then). Check SQLCipher with the database header: `adb exec-out run-as com.molulabs.censo cat files/SQLite/censo.db | head -c 16` must not read `SQLite format 3`.
