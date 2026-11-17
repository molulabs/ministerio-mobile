// Writes, in Markdown, what an `eas update --json` published and what the profile of a phone will
// show once it has it ("Versión … · actualización <last 6 characters of the update id>").
//   node scripts/ota-summary.mjs update.json
import { readFileSync } from 'node:fs';

const text = readFileSync(process.argv[2], 'utf8');
// The command may print a notice before the JSON
const updates = JSON.parse(text.slice(text.search(/[[{]/)));
const android = [updates].flat().find((update) => update.platform === 'android');

if (!android) {
  console.log('Published, but the output has no Android update:\n\n```json\n' + text + '\n```');
  process.exit(0);
}

console.log(`## OTA update published

| | |
|---|---|
| Message | ${android.message} |
| Runtime version | ${android.runtimeVersion} |
| Commit | ${android.gitCommitHash} |
| Android update id | \`${android.id}\` |
| Group | \`${android.group}\` |

On a phone with the APK ${android.runtimeVersion}: close the app completely, open it (it downloads the
update), close it and open it again. **Perfil → Versión** must say
**${android.runtimeVersion} · actualización ${android.id.slice(-6)}**.`);
