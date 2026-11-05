This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

This project uses **pnpm** (version pinned in `package.json` → `packageManager`) and Node 24 (`.nvmrc`). Never use `npx` or `npm`: run CLIs with `pnpm <bin>` (installed) or `pnpm dlx <pkg>` (one-off).

```bash
pnpm expo install <package> # ALWAYS use instead of pnpm add — resolves SDK-compatible versions
pnpm start                  # start Metro for the development build
pnpm android                # build and install the development build on the emulator/device
pnpm lint                   # lint (ESLint + eslint-config-expo + prettier)
pnpm typecheck              # tsc --noEmit
pnpm test                   # jest (jest-expo + React Native Testing Library)
pnpm format                 # prettier --write
pnpm dlx expo-doctor        # diagnose dependency and config issues
pnpm expo install --fix     # fix incompatible package versions
```

Run lint, typecheck, test and format:check before declaring any task done.

## Navigation & structure

- Navigation uses **React Navigation** (not Expo Router), as decided in the project plan. `src/app/` holds the entry (`App.tsx`, bootstrap, `navigation/`), not file-based routes.
- Code is organized by feature: `src/features/*`, `src/infrastructure/*`, `src/shared/*`. Features depend on infrastructure and shared, never the reverse, and never on each other.
- Imports use the `@/src/...` alias.
- Identifiers in English; user-facing text in Spanish.

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `pnpm dlx eas-cli@latest <command>`; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `pnpm android` (`expo run:android`) locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md
