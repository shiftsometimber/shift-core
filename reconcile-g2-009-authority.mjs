import fs from 'node:fs';

function read(path){return fs.readFileSync(path,'utf8')}
function write(path,text){fs.writeFileSync(path,text)}
function replaceRequired(text,oldValue,newValue,label){
  if(text.includes(newValue))return text;
  if(!text.includes(oldValue))throw new Error(`reconciliation anchor missing: ${label}`);
  return text.replace(oldValue,newValue);
}

const matrixPath='docs/SHIFT-COMMISSIONING-REMEDIATION-MATRIX.md';
let matrix=read(matrixPath);
matrix=replaceRequired(matrix,
  '**Current reconciled scoreboard: 57 total / 26 PASS / 28 AMBER / 3 BLOCKED / 0 unmapped.**',
  '**Current reconciled scoreboard: 57 total / 27 PASS / 27 AMBER / 3 BLOCKED / 0 unmapped.**','matrix scoreboard');
matrix=replaceRequired(matrix,
  '| G2-009 | Conundrum lacks kitchen intelligence | AMBER | Obvious chicken+cheese+wrap relationship is production-proven; broader catalogue-backed ingredient intelligence remains tied to M11. |',
  '| G2-009 | Conundrum lacks kitchen intelligence | **PASS** | Corrected post-merge production commissioning proves governed `published_catalogue` authority, a known reviewed/published recipe match for its own core ingredients with retained matched-ingredient evidence, and an honest zero-result journey that refuses to invent unrelated fallback content. Run `31710006859`, production job `94480182185`; retained evidence `docs/evidence/2026-08-13-g2-009-catalogue-conundrum.md`. |','G2-009 row');
matrix=replaceRequired(matrix,'## 28-AMBER burn-down classification','## 27-AMBER burn-down classification','AMBER heading');
matrix=matrix.replace('| G2-009 | FINITE | M11 catalogue-backed Conundrum intelligence |\n','');
matrix=replaceRequired(matrix,
  'All 57 original audit requirements remain represented exactly once in the matrix. PASS rows: 26. AMBER rows: 28. BLOCKED rows: 3. Total: 57. Zero row may be removed or compressed away.',
  'All 57 original audit requirements remain represented exactly once in the matrix. PASS rows: 27. AMBER rows: 27. BLOCKED rows: 3. Total: 57. Zero row may be removed or compressed away.','matrix reconciliation');
write(matrixPath,matrix);

const evidencePath='docs/COMMISSIONING-EVIDENCE.md';
let evidence=read(evidencePath);
evidence=replaceRequired(evidence,
  '**57 total / 26 PASS / 28 AMBER / 3 BLOCKED / 0 abstraction orphans.**',
  '**57 total / 27 PASS / 27 AMBER / 3 BLOCKED / 0 abstraction orphans.**','evidence scoreboard');
evidence=evidence.replace(/^Latest original row closure:.*$/m,
  'Latest original row closure: **G2-009 Conundrum catalogue intelligence.** PR #160 corrected only the restricted commissioning identity namespace; unchanged main production run `31710006859`, job `94480182185`, then proved governed published-catalogue authority, a known reviewed/published recipe match with retained matched-ingredient evidence, and an honest zero-result path with no invented fallback. Retained evidence: `docs/evidence/2026-08-13-g2-009-catalogue-conundrum.md`. G1-009 remains independently locked PASS; no adjacent Grub row is promoted by association.');
if(!evidence.includes('## Gate 2 Conundrum catalogue intelligence — PASS')){
  evidence=evidence.replace('## Gate 4 Knowledge flywheel — PASS',
`## Gate 2 Conundrum catalogue intelligence — PASS
**G2-009 PASS:** corrected post-merge production commissioning demonstrates the real member Conundrum journey against governed reviewed/published catalogue content. The runtime reports \`published_catalogue\`, returns \`lighter-beef-cottage-pie\` for its relevant ingredient set with retained matched-ingredient evidence, and returns zero results for unrelated synthetic ingredients rather than inventing a fallback. Evidence: run \`31710006859\`, job \`94480182185\`, \`docs/evidence/2026-08-13-g2-009-catalogue-conundrum.md\`.

## Gate 4 Knowledge flywheel — PASS`);
}
write(evidencePath,evidence);

const finishPath='docs/LAUNCH-FINISH-LINE.md';
let finish=read(finishPath);
finish=replaceRequired(finish,
  'Exactly **57** original rows remain mandatory. Current evidenced classification is **26 PASS / 28 AMBER / 3 BLOCKED / 0 abstraction orphans**. G1-009 moved only after the unchanged post-RC3 production rendered matrix fingerprinted the live repair and passed all six browser/device journeys with zero horizontal overflow. Adjacent recovery/verification/loading/premium/Dave rows remain AMBER. No other row is promoted by association.',
  'Exactly **57** original rows remain mandatory. Current evidenced classification is **27 PASS / 27 AMBER / 3 BLOCKED / 0 abstraction orphans**. G2-009 moved only after corrected-main production commissioning proved governed catalogue-backed Conundrum matching plus honest zero-result behaviour in run `31710006859` / job `94480182185`. G1-009 remains independently locked PASS. Adjacent Grub catalogue, recovery/verification/loading/premium/Dave rows remain AMBER; no row is promoted by association.','finish scoreboard');
write(finishPath,finish);

const countsPath='docs/V1-RELEASE-BLOCKER-COUNTS.txt';
let counts=read(countsPath);
counts=replaceRequired(counts,'A=24\nB=4\nC=3\nAUDIT_PASS=26\nAUDIT_AMBER=28\nAUDIT_BLOCKED=3\n','A=24\nB=3\nC=3\nAUDIT_PASS=27\nAUDIT_AMBER=27\nAUDIT_BLOCKED=3\n','counts');
write(countsPath,counts);

console.log('PASS G2-009 authoritative reconciliation: 27 PASS / 27 AMBER / 3 BLOCKED; Category A 24, B 3, C 3.');
