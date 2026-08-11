import fs from 'node:fs';

let failed = false;
const fail = (message) => { console.error(message); failed = true; };

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const wrangler = String(pkg?.devDependencies?.wrangler || '');
const packageManager = String(pkg?.packageManager || '');
const nodeVersion = fs.existsSync('.nvmrc') ? fs.readFileSync('.nvmrc', 'utf8').trim() : '';

// Cloudflare Workers Builds must not float across Wrangler releases. A floating
// ^4.x range resolved to a release whose dependency graph requested an
// unavailable Miniflare alpha and prevented dependency installation entirely.
if (!/^\d+\.\d+\.\d+$/.test(wrangler)) fail(`Wrangler must be pinned to an exact stable semver, got: ${wrangler || '<missing>'}`);
if (/[A-Za-z-]/.test(wrangler)) fail(`Wrangler prerelease versions are forbidden in production tooling: ${wrangler}`);
if (wrangler !== '4.112.0') fail(`Unexpected Wrangler toolchain drift: expected 4.112.0, got ${wrangler}`);

if (packageManager !== 'npm@10.9.2') fail(`Package manager must be pinned to npm@10.9.2, got: ${packageManager || '<missing>'}`);
if (nodeVersion !== '22.16.0') fail(`Cloudflare build Node version must remain pinned to 22.16.0, got: ${nodeVersion || '<missing>'}`);

const forbidden = ['alpha', 'beta', 'rc', 'nightly', 'canary', 'next'];
const packageText = fs.readFileSync('package.json', 'utf8').toLowerCase();
for (const marker of forbidden) {
  if (packageText.includes(`-${marker}`)) fail(`Production package manifest contains forbidden prerelease marker: -${marker}`);
}

if (failed) process.exit(1);
console.log(`Shift toolchain source gate passed: Node ${nodeVersion}, ${packageManager}, Wrangler ${wrangler}.`);
