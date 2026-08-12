import fs from 'node:fs';

let bad = false;
const read = (file) => fs.readFileSync(file, 'utf8');
const must = (condition, message) => {
  if (!condition) {
    console.error(`FAIL ${message}`);
    bad = true;
  }
};

const legacyFinish = read('docs/FINISH-LINE.md');
const launchFinish = read('docs/LAUNCH-FINISH-LINE.md');
const matrix = read('docs/SHIFT-COMMISSIONING-REMEDIATION-MATRIX.md');
const auth = read('auth-recovery-v1.js');
const delivery = read('auth-delivery-v1.js');
const watch = read('watchtower-v1.js');

// Preserve the original frozen finish-line contract for compatibility.
for (const marker of ['## BLOCKER', '## MUST FINISH', '## POST-LAUNCH', 'B-01', 'B-08', 'M-09', 'Critical path', 'Recovery rule']) {
  must(legacyFinish.includes(marker), `legacy finish line ${marker}`);
}
must((legacyFinish.match(/^B-\d+/gm) || []).length === 8, 'exactly 8 legacy blocker IDs');
must((legacyFinish.match(/^M-\d+/gm) || []).length === 9, 'exactly 9 legacy must-finish IDs');

// The launch board is the current authoritative abstraction layer.
for (const marker of ['B01', 'B08', 'M01', 'M17', 'B03 production behavioural subrows closed: **9/9**', 'Original-audit reconciliation']) {
  must(launchFinish.includes(marker), `launch finish line ${marker}`);
}
for (let n = 9; n <= 17; n += 1) {
  const id = `M${String(n).padStart(2, '0')}`;
  must(launchFinish.includes(`| ${id} |`), `restored anti-abstraction row ${id}`);
}

// The original audit must remain exactly 57 unique substantive Gate rows.
const matrixIds = [...matrix.matchAll(/^\| (G[1-5]-\d{3}) \|/gm)].map((match) => match[1]);
const uniqueMatrixIds = new Set(matrixIds);
must(matrixIds.length === 57, `original remediation matrix has 57 rows (found ${matrixIds.length})`);
must(uniqueMatrixIds.size === 57, `original remediation matrix has 57 unique IDs (found ${uniqueMatrixIds.size})`);
for (const gate of [1, 2, 3, 4, 5]) {
  must(matrixIds.some((id) => id.startsWith(`G${gate}-`)), `Gate ${gate} remains represented in remediation matrix`);
}
const blockedRows = (matrix.match(/\| BLOCKED \|/g) || []).length;
must(blockedRows === 3, `original matrix retains exactly 3 genuine BLOCKED rows (found ${blockedRows})`);

// Transactional auth observability remains protected while B01 awaits secure token execution.
for (const marker of ['recordAuthDelivery', 'password_reset', 'binding_missing', "status:'failed'"]) {
  must(auth.includes(marker), `auth delivery ${marker}`);
}
for (const marker of ['auth_delivery_events', 'email_hash', 'authDeliveryHealth']) {
  must(delivery.includes(marker), `delivery store ${marker}`);
}
for (const marker of ['authDeliveryHealth', 'auth_email_', 'Check email binding/provider delivery']) {
  must(watch.includes(marker), `Watchtower email ${marker}`);
}

if (bad) process.exit(1);
console.log('PASS V1 finish-line + 57-row audit crosswalk + transactional auth observability');
