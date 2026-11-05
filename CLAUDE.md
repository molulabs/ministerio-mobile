@AGENTS.md

## Project context

Offline-first Android app (iOS later) for the livestock/producer census of the Ministerio de Producción (Jujuy). Field enumerators (`ROLE_ENUMERATOR`) work a full day without signal; data is sent when connectivity returns.

- Plan: https://claude.ai/artifact/7Wky6z823sxr2X6eubfEPH — read it before starting a new phase.
- Sibling repos in `../`: `api/` (Symfony, JWT via `/api/login` + `/api/refresh`), `app/` (web, React + Formik/Yup), `infra/` (Docker Compose + nginx).
- Mobile API lives under `/api/mobile/` (`GET catalogs` with ETag, idempotent `PUT census-submissions/{uuid}`).

## Core rules (from the plan)

- SQLite is the only source of truth on the device. Screens read/write SQLite through repositories; only the sync engine talks to the API (except login). No Redux, RTK Query or TanStack Query.
- Never lose field data: never delete unsent census rows on logout, token failure or migration.
- Each census is sent only with its own user's token.
- Census rules never go into the design system (`@molulabs/ds`).

## Offline sign-in

- An online sign-in keeps, per user, a PBKDF2-SHA256 verifier of the password (never the password) in SecureStore: `features/auth/offline/`. Signing out keeps it, so the user can sign in again without signal.
- Sign-in tries the API first; only without signal or with the API failing (5xx) it checks the verifier. A 401 from the API is always a wrong password.
- Offline sign-in is refused when: the user never signed in online on this phone, more than 7 days passed since the API last confirmed the account (an online sign-in, a token refresh or a successful `/me`), 5 wrong passwords in a row (an online sign-in unlocks), or the phone clock went back more than 10 minutes.
- An offline session has no tokens: sending anything needs an online sign-in first.
- PBKDF2 runs in native code with `react-native-quick-crypto` (`expo-crypto` has no key derivation). `PBKDF2_ITERATIONS` (310 000, ~150 ms on the emulator) still has to be measured on a low-end phone; each verifier keeps its own count, so it can be raised.

## Platform targets

| Setting    | Value            | Where                                                              |
| ---------- | ---------------- | ------------------------------------------------------------------ |
| Expo SDK   | 58               | `package.json`                                                     |
| minSdk     | 24 (Android 7.0) | pinned in `app.json` → `expo-build-properties`; decided 2026-11-04 |
| targetSdk  | 36 (Android 16)  | Expo SDK 58 default                                                |
| compileSdk | 37 (Android 17)  | Expo SDK 58 default                                                |

Change minSdk only in `app.json`, never in `android/`. The ministry's field phone models are not known yet; when they are, revisit minSdk and the low-end device used for the map spike.

## Tests

- Jest with the `jest-expo` preset and React Native Testing Library. Tests live in `src/__tests__/`, mirroring the path of the code they test (`src/__tests__/infrastructure/api/authRefresh.test.ts`).
- RNTL v14: `render`, `fireEvent` and `act` are async — always `await` them.
- Find elements as a user would: `getByLabelText`, `getByRole('button', { name })`, `getByText`. Give inputs an `accessibilityLabel` and pressables `accessibilityRole="button"`.
- HTTP: give a fresh axios instance a fake `adapter` (see `authRefresh.test.ts`) instead of adding a mocking library.
- Screen tests mock the session store, so the API client and SecureStore are never loaded.
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
- `android/` and `ios/` are generated (CNG) and git-ignored.
