import fs from 'node:fs';

const read=p=>fs.readFileSync(p,'utf8');
const write=(p,s)=>fs.writeFileSync(p,s);

const matrixPath='docs/SHIFT-COMMISSIONING-REMEDIATION-MATRIX.md';
let matrix=read(matrixPath);
matrix=matrix.replace('**Current reconciled scoreboard: 57 total / 46 PASS / 8 AMBER / 3 BLOCKED / 0 unmapped.**','**Current reconciled scoreboard: 57 total / 48 PASS / 6 AMBER / 3 BLOCKED / 0 unmapped.**');
const row3='| G1-003 | Registration email lifecycle incomplete | **PASS** | Fresh real production lifecycle run `31793828102` rerun job `94753848697` registered a genuinely unverified member, delivered the real verification email to the connected Gmail inbox, blocked pre-verification login with HTTP 403 / `email_verification_required`, then after the genuine inbox token was used accepted verified login with HTTP 200, completed logout with HTTP 200 and retained a fresh final login with HTTP 200. Connected-inbox evidence also shows `Welcome to My Shift` arrived at 11:27:49 UTC only after the 11:26:49 verification email and successful verification. Artifact `9217492229`, digest `sha256:82bce3845465ff96a651fd3f15dfc5427986f324f4f1e29f4f6aebc76603f2c5`. Evidence: `docs/evidence/2026-08-14-g1-003-g1-004-real-verification-pass.md`. |';
const row4='| G1-004 | Email verification is effectively bypassed | **PASS** | The same fresh real production lifecycle proves verification is not bypassed: registration requires verification, pre-verification login is rejected, genuine inbox verification changes the account state, post-verification login succeeds, logout succeeds, and verified state survives a new login. The Welcome message is observed only after verification. Existing resend invalidation/replay rejection source and regression evidence remain additive rather than substituted. Run `31793828102`, job `94753848697`, artifact `9217492229`. Evidence: `docs/evidence/2026-08-14-g1-003-g1-004-real-verification-pass.md`. |';
matrix=matrix.replace(/^\| G1-003 \|.*$/m,row3).replace(/^\| G1-004 \|.*$/m,row4);
const marker='## 8-AMBER burn-down classification';
if(matrix.includes(marker)){
  const [before,after]=matrix.split(marker);
  const cleaned=after.split('\n').filter(line=>!/^\| G1-003 \|/.test(line)&&!/^\| G1-004 \|/.test(line)).join('\n');
  matrix=before+marker+cleaned;
}
matrix=matrix.replace('PASS rows: 46. AMBER rows: 8. BLOCKED rows: 3. Total: 57.','PASS rows: 48. AMBER rows: 6. BLOCKED rows: 3. Total: 57.');
write(matrixPath,matrix);

const countsPath='docs/V1-RELEASE-BLOCKER-COUNTS.txt';
let counts=read(countsPath)
  .replace(/^A=8$/m,'A=6')
  .replace(/^AUDIT_PASS=46$/m,'AUDIT_PASS=48')
  .replace(/^AUDIT_AMBER=8$/m,'AUDIT_AMBER=6');
write(countsPath,counts);

const boardPath='docs/V1-RELEASE-BLOCKER-BOARD-V2.md';
let board=read(boardPath);
board=board.replace('**A — V1 RELEASE BLOCKERS: 8 AMBER rows / 3 active shared clusters.**','**A — V1 RELEASE BLOCKERS: 6 AMBER rows / 3 active shared clusters.**');
board=board.replace('**A CLOSED: 19 — ','**A CLOSED: 21 — G1-003 real verification lifecycle, G1-004 verification enforcement, ');
board=board.replace(/^G1-001, G1-003, G1-004, G5-013\..*$/m,'G1-001, G5-013. Real registration/verification/login/session is now production-proven through genuine connected-inbox verification evidence; password recovery remains the sole Gate-1 account-lifecycle AMBER and G5-013 remains open until recovery plus final human/device legs are complete.');
write(boardPath,board);

const evidencePath='docs/COMMISSIONING-EVIDENCE.md';
let evidence=read(evidencePath);
const entry=`\n\n## 2026-08-14 — G1-003 / G1-004 genuine email verification lifecycle PASS\n\n- Production workflow run: \`31793828102\`; rerun job: \`94753848697\`.\n- Fresh member registration: HTTP 201, \`verificationRequired=true\`, delivery sent.\n- Pre-verification login: HTTP 403, \`email_verification_required\`.\n- Genuine verification email delivered to the connected Gmail alias at 11:26:49 UTC.\n- After the genuine inbox token was used, login became HTTP 200.\n- Logout: HTTP 200. Fresh final login: HTTP 200, proving retained verified state.\n- Connected Gmail shows \`Welcome to My Shift\` at 11:27:49 UTC, after verification rather than before it.\n- Retained artifact: \`9217492229\`; SHA256 \`82bce3845465ff96a651fd3f15dfc5427986f324f4f1e29f4f6aebc76603f2c5\`.\n- Commissioning conclusion: G1-003 PASS and G1-004 PASS. G1-001 recovery remains independently AMBER.\n`;
if(!evidence.includes('G1-003 / G1-004 genuine email verification lifecycle PASS')) evidence+=entry;
write(evidencePath,evidence);

const proofPath='docs/evidence/2026-08-14-g1-003-g1-004-real-verification-pass.md';
write(proofPath,`# G1-003 / G1-004 — genuine email verification lifecycle PASS\n\nFresh production run \`31793828102\`, rerun job \`94753848697\`, executed the real lifecycle against production.\n\n- registration: HTTP 201, verification required, real delivery sent\n- pre-verification login: HTTP 403 / \`email_verification_required\`\n- genuine verification email: connected Gmail, 11:26:49 UTC\n- post-verification login: HTTP 200\n- logout: HTTP 200\n- final fresh login: HTTP 200\n- post-verification Welcome email: connected Gmail, 11:27:49 UTC\n- retained artifact: \`9217492229\`\n- artifact SHA256: \`82bce3845465ff96a651fd3f15dfc5427986f324f4f1e29f4f6aebc76603f2c5\`\n\nThis is demonstrated inbox/token/account-state evidence, not source or merge inference. G1-003 and G1-004 are therefore PASS. Password recovery remains independently AMBER.\n`);

console.log('Reconciled G1-003/G1-004 PASS: expected scoreboard 48 PASS / 6 AMBER / 3 BLOCKED, A=6');
