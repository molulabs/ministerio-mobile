#!/usr/bin/env bash
# Stops an OTA update whose native side differs from the APK it would reach: such an update would
# call native code the APK does not have, and the app would close on start.
#   scripts/check-native-fingerprint.sh
# Compares the project with the last finished Android build of channel "preview" for the version in
# app.config.ts (the runtime version, policy appVersion). Needs API_URL (it is in the fingerprint,
# through the app config) and an EAS login or EXPO_TOKEN. EAS runs `eas` by default; set EAS to
# another command to use, e.g. EAS="pnpm dlx eas-cli@latest".
set -euo pipefail

cd "$(dirname "$0")/.."
eas=${EAS:-eas}
channel=preview

version=$(pnpm --silent expo config --json | node -e 'process.stdout.write(JSON.parse(require("fs").readFileSync(0, "utf8")).version)')

# The JSON commands may print a notice before the JSON: read from the first brace or bracket
from_json() { node -e "
  const text = require('fs').readFileSync(0, 'utf8');
  const start = text.search(/[[{]/);
  if (start < 0) { console.error(text); process.exit(1); }
  const data = JSON.parse(text.slice(start));
  process.stdout.write(String(($1)(data) ?? '') + '\n');
"; }

build=$($eas build:list --platform android --channel "$channel" --runtime-version "$version" \
    --status finished --limit 1 --json --non-interactive | from_json 'builds => builds[0]?.id')

if [[ -z $build ]]; then
    echo "No finished Android build of channel $channel with version $version: build the APK first (eas build -p android --profile $channel)." >&2
    exit 1
fi

read -r built current < <($eas fingerprint:compare --build-id "$build" --environment "$channel" --json --non-interactive \
    | from_json 'd => d.fingerprint1.hash + " " + d.fingerprint2.hash')

if [[ $built != "$current" ]]; then
    echo "The native side changed since the APK $version (build $build): raise the version in app.config.ts and build a new APK instead of an OTA update." >&2
    echo "See what changed: $eas fingerprint:compare --build-id $build" >&2
    exit 1
fi

echo "Native side unchanged since the APK $version (build $build, fingerprint $built): the update can go by OTA."
