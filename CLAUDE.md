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

## Platform targets

| Setting    | Value            | Where                                                              |
| ---------- | ---------------- | ------------------------------------------------------------------ |
| Expo SDK   | 58               | `package.json`                                                     |
| minSdk     | 24 (Android 7.0) | pinned in `app.json` → `expo-build-properties`; decided 2026-11-04 |
| targetSdk  | 36 (Android 16)  | Expo SDK 58 default                                                |
| compileSdk | 37 (Android 17)  | Expo SDK 58 default                                                |

Change minSdk only in `app.json`, never in `android/`. The ministry's field phone models are not known yet; when they are, revisit minSdk and the low-end device used for the map spike.

## Local development

- Everything runs on the host (not in Docker), except the API.
- nginx routes by host name (`api.*.local`): from the emulator, `10.0.2.2` hits the default server, not the API. Do not assume `http://10.0.2.2/api/...` works.
- Emulator: `emulator -avd Medium_Phone_API_37.0 -gpu host` (auto GPU mode crashed on API 37).
- Do not start Metro with `CI=1`: it disables watch mode and hot reload.
- `android/` and `ios/` are generated (CNG) and git-ignored.
