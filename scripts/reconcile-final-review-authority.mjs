import fs from 'node:fs';

const files=[
  'docs/SHIFT-COMMISSIONING-REMEDIATION-MATRIX.md',
  'docs/LAUNCH-FINISH-LINE.md',
  'docs/MATT-FINAL-ACCEPTANCE-PACK.md',
  'docs/COMMISSIONING-EVIDENCE.md'
];

const replacements=[
  ['31799592951','31803717241'],
  ['9218697749','9220287723'],
  ['18225619aa8e28030fbd008ea40cdb39759adc92e2a9db73a261d318ae33fc6f','f02c540a1f6059796ab8615021f8e4747a12f052ce3cd4faa1f14cb0c5f7f7f4'],
  ['806 clean recipes','798 clean recipes'],
  ['806-recipe','798-recipe'],
  ['806 recipe','798 recipe'],
  ['exactly **806','exactly **798'],
  ['exactly 806','exactly 798'],
  ['**806 publication records**','**798 publication records**'],
  ['dinner 203 / snack 187','dinner 195 / snack 187'],
  ['161 / 165 / 156 / 142','161 / 165 / 148 / 142'],
  ['31799592961','31802631318'],
  ['9218694338','9219877222'],
  ['b48d5d2f7770d16c8ad4a4da76bb5036a26e360c6603704144194644de8a8a9f','b0ad06b2badc5ae83a750ec44b360b81f39e8b59407a3c705bb460a17e3012da']
];

for(const file of files){
  if(!fs.existsSync(file)) continue;
  let s=fs.readFileSync(file,'utf8');
  for(const [from,to] of replacements)s=s.split(from).join(to);
  if(file.endsWith('MATT-FINAL-ACCEPTANCE-PACK.md')){
    s=s.replace('This is the post-defect-repair pack; the earlier 783-recipe artifact is superseded and must not be reviewed.','This is the final post-#323 sanity-repaired pack; all earlier 783/806-recipe artifacts are superseded and must not be reviewed.');
    s=s.replace('Pre-review commissioning has already removed the known Slow-Cooker coverage miss, implementation-language leakage, already-cooked-protein method defects and duplicate launch titles.','Pre-review commissioning has removed the Slow-Cooker coverage miss, implementation-language leakage, malformed prawn/lentil filling copy, unsuitable delicate/all-day slow-cooker variants, low-liquid lemon-herb variants, already-cooked-protein method defects and duplicate launch titles.');
    s=s.replace('This supersedes the earlier pack: 16 generic state-caption placeholders were removed before human/domain review.','This is the post-#321 final pack: all 26 movement cues render in full, and the earlier generic/truncated state-caption packs are superseded.');
  }
  fs.writeFileSync(file,s);
}

const evidence='docs/evidence/2026-08-14-final-grub-fit-review-authority.md';
fs.writeFileSync(evidence,`# Final Grub + Fit review authority — 2026-08-14\n\nNo audit status is promoted by this evidence update. Authoritative scoreboard remains **50 PASS / 4 AMBER / 3 BLOCKED; A=4 / B=0 / C=3**.\n\n## Grub\n- Final merged main: \`51c3f04a84a7ee2d1947bf8946c9cb8680aac5c0\` (PR #323).\n- Review workflow: \`31803717241\`, artifact \`9220287723\`, SHA256 \`f02c540a1f6059796ab8615021f8e4747a12f052ce3cd4faa1f14cb0c5f7f7f4\`.\n- Final finite launch cohort: **798 clean recipes / exactly 8 immutable decisions**.\n- Meal breadth: breakfast 212 / lunch 204 / dinner 195 / snack 187.\n- Under deterministic 25% Nay pressure: 161 / 165 / 148 / 142 remain eligible; zero exact repeats through 30/60/90 days.\n- 2,876/2,876 industrial recipes remain nutrition-valid with zero nutrition quarantine; unsuitable slow-cooker/editorial variants remain quarantined rather than reaching human review.\n\n## Fit\n- Final full-cue render merge: \`64c154e7bb17aa2f8da22abaca3a2ca59508af33\` (PR #321).\n- Review workflow: \`31802631318\`, artifact \`9219877222\`, SHA256 \`b0ad06b2badc5ae83a750ec44b360b81f39e8b59407a3c705bb460a17e3012da\`.\n- **26/26 produced and technically QA-passed**; full movement-specific START/MOVE/FINISH guidance renders without arbitrary truncation.\n- Human/domain acceptance remains genuinely outstanding.\n\n## Remaining original-audit human tail\n- G2-002 / G2-003 / G2-004: eight genuine Grub decisions, then existing fail-closed propagation/publication/production-serving proof.\n- G2-007: 26 genuine Fit anatomy/member-comprehension/domain decisions, then publication/production-serving proof.\n`);

const counts=fs.readFileSync('docs/V1-RELEASE-BLOCKER-COUNTS.txt','utf8');
for(const expected of ['A=4','B=0','C=3','AUDIT_PASS=50','AUDIT_AMBER=4','AUDIT_BLOCKED=3'])if(!counts.split(/\r?\n/).includes(expected))throw new Error(`scoreboard moved unexpectedly: ${expected}`);
for(const file of ['docs/SHIFT-COMMISSIONING-REMEDIATION-MATRIX.md','docs/LAUNCH-FINISH-LINE.md','docs/MATT-FINAL-ACCEPTANCE-PACK.md']){
 const s=fs.readFileSync(file,'utf8');
 if(s.includes('806 clean recipes')||s.includes('artifact `9218697749`')||s.includes('artifact `9218694338`'))throw new Error(`stale final-review authority remains in ${file}`);
}
console.log('PASS final review-authority reconciliation: Grub 798/8 + Fit post-#321; scoreboard unchanged 50/4/3, A=4.');
