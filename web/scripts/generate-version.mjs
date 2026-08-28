import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const repoRoot = fileURLToPath(new URL('../..', import.meta.url));
const publicDir = fileURLToPath(new URL('../public', import.meta.url));

function git(...args) {
  return execFileSync('git', ['-C', repoRoot, ...args], { encoding: 'utf8' }).trim();
}

let buildNumber;
let commit;
try {
  buildNumber = git('rev-list', '--count', 'HEAD');
  commit = git('rev-parse', '--short=8', 'HEAD');
} catch {
  buildNumber = process.env.CF_BUILD_NUMBER || String(Date.now());
  commit = process.env.CF_COMMIT || 'unknown';
}

const payload = {
  version: `0.1.${buildNumber}`,
  commit,
  builtAt: new Date().toISOString()
};

mkdirSync(publicDir, { recursive: true });
writeFileSync(`${publicDir}/version.json`, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
console.log(`Cosmic Fight ${payload.version} (${payload.commit})`);
