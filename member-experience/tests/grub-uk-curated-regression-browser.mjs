// Isolated test activation of the discovery-only overlay; no food-publication claim.
// The actual source module remains pending on disk and new draft recipes stay excluded.
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {GRUB_DISCOVERY_MANIFEST} from '../grub-discovery-manifest-20261017.mjs';
const before=readFileSync(new URL('../grub-discovery-manifest-20261017.mjs',import.meta.url),'utf8');
assert.equal(GRUB_DISCOVERY_MANIFEST.status,'pending_editorial_publication');
GRUB_DISCOVERY_MANIFEST.status='approved'; // Test process only; never persisted.
try {await import(process.env.GRUB_BROWSER_KIND==='effort'?'./grub-effort-repeat-browser.mjs':'./grub-ease-browser.mjs');}
finally {assert.equal(readFileSync(new URL('../grub-discovery-manifest-20261017.mjs',import.meta.url),'utf8'),before);}
