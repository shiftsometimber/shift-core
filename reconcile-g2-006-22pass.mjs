import fs from 'node:fs';

function edit(file, replacements){
  let s=fs.readFileSync(file,'utf8');
  for(const [from,to] of replacements){
    if(!s.includes(from)) throw new Error(`${file}: missing expected marker: ${from.slice(0,100)}`);
    s=s.replace(from,to);
  }
  fs.writeFileSync(file,s);
}

edit('docs/SHIFT-COMMISSIONING-REMEDIATION-MATRIX.md',[
  ['**Current reconciled scoreboard: 57 total / 21 PASS / 33 AMBER / 3 BLOCKED / 0 unmapped.**','**Current reconciled scoreboard: 57 total / 22 PASS / 32 AMBER / 3 BLOCKED / 0 unmapped.**'],
  ['| G2-002 | Grub recipes are not real recipes | AMBER | Structured authored universe is **2,908** including 2,876 industrial objects across real-life meal/fakeaway/treat families. Current industrial conversion has 70 ingredient-level CoFID-validated draft recipes; only 1 reviewed/published recipe is production-served. Review/publication/serving breadth remains M11. |','| G2-002 | Grub recipes are not real recipes | AMBER | Structured authored universe is **2,908** including 2,876 industrial objects across real-life meal/fakeaway/treat families. The governed V6 full-catalogue conversion now has **546 ingredient-level CoFID-validated LOW-risk draft recipes**; only 1 reviewed/published recipe is production-served. Independent review/publication/serving breadth remains M11. |'],
  ['| G2-003 | Grub nutrition figures are not tied to exact ingredients | AMBER | 70 industrial recipes now carry ingredient-level CoFID 2021 validation in the targeted tranche, while the original production-served recipe is also validated. All remaining recipes stay quarantined rather than receiving fabricated precision. |','| G2-003 | Grub nutrition figures are not tied to exact ingredients | AMBER | **546 industrial recipes** now carry ingredient-level CoFID 2021 validation from the repaired V6 catalogue, with 546 LOW / 0 MEDIUM / 0 HIGH in the governed calculation wave. The remaining 2,330 stay quarantined rather than receiving fabricated precision. |'],
  ['| G2-006 | Fit composes durations incorrectly | AMBER | Historical padding defect fixed and behaviour green; complete 10/15/20/30/45/60 session-quality commissioning remains M12. |','| G2-006 | Fit composes durations incorrectly | **PASS** | Unchanged post-merge production commissioning after PR #109 proved the authenticated 10/15/20/30/45/60-minute session-quality matrix end-to-end through the duration-aware V8 composition path. The production gate completed GREEN; duration padding/overrun regressions remain protected. |'],
  ['## 33-AMBER burn-down classification','## 32-AMBER burn-down classification'],
  ['| G2-006 | FINITE | M12 duration/session-quality matrix |\n',''],
  ['PASS rows: 21. AMBER rows: 33. BLOCKED rows: 3. Total: 57.','PASS rows: 22. AMBER rows: 32. BLOCKED rows: 3. Total: 57.']
]);

edit('docs/LAUNCH-FINISH-LINE.md',[
  ['| M11 | Grub catalogue depth, validated nutrition and variety | AMBER — **2,908 authored structured objects**. The industrial 2,876-object pool is schema-valid; all 17,440 ingredient identities are canonically mapped across 168 ingredient identities, and the targeted CoFID 2021 conversion tranche now validates **70 industrial recipes** at ingredient level. Only 1 recipe is independently reviewed/published/production-served; review/publication/serving breadth remains the bottleneck. Short-term authored target 2,500 exceeded; long-term minimum 10,000+ |','| M11 | Grub catalogue depth, validated nutrition and variety | AMBER — **2,908 authored structured objects**. The repaired V6 industrial 2,876-object pool is schema-valid; the governed conversion currently validates **546 industrial recipes** at ingredient level, all LOW-risk in the latest calculation wave, with 2,330 explicitly quarantined. Only 1 recipe is independently reviewed/published/production-served; review/publication/serving breadth remains the bottleneck. Short-term authored target 2,500 exceeded; long-term minimum 10,000+ |'],
  ['Current evidenced classification: **21 PASS / 33 AMBER / 3 BLOCKED / 0 abstraction orphans** after the authorised HQ operator fire drill earned G5-008/B06 PASS.','Current evidenced classification: **22 PASS / 32 AMBER / 3 BLOCKED / 0 abstraction orphans** after unchanged post-merge production commissioning earned G2-006 PASS.'],
  ['The strict generic matcher still refuses ambiguous CoFID promotion; a targeted authoritative CoFID tranche now validates **70 industrial recipes**, which remain drafts until independent review. Existing reviewed/published/production-served remains **1/1/1**.','The strict generic matcher still refuses ambiguous CoFID promotion. The governed repaired-V6 propagation/calculation now validates **546 industrial recipes**, all LOW-risk in the latest wave; **2,330 remain quarantined**. These remain drafts pending independent/second-person content review. Existing reviewed/published/production-served remains **1/1/1**.'],
  ['The 33 remaining AMBERs are classified in the remediation matrix as FINITE / LARGE / HUMAN-DEVICE.','The 32 remaining AMBERs are classified in the remediation matrix as FINITE / LARGE / HUMAN-DEVICE.']
]);

edit('docs/COMMISSIONING-EVIDENCE.md',[
  ['## Industrial Grub factory — M11 remains AMBER','## G2-006 Fit duration/session quality — PASS\nPR #109 merged the repaired duration-aware V8 production harness without broadening the restricted commissioning identity. The unchanged post-merge production run `31649921033` completed GREEN, including the dedicated authenticated `G2-006 Fit duration/session quality production matrix` step for 10/15/20/30/45/60-minute requests. This is the missing production acceptance evidence; G2-006 is therefore PASS rather than being promoted from source or PR CI alone.\n\n## Industrial Grub factory — M11 remains AMBER'],
  ['- The targeted CoFID 2021 conversion path now validates **70 industrial recipes** at ingredient level. Those objects remain drafts until independent content review; no publication barrier is bypassed.','- The governed repaired-V6 full-catalogue path now validates **546 industrial recipes** at ingredient level. The current wave is **546 LOW / 0 MEDIUM / 0 HIGH**, with **2,330 quarantined**. Validated drafts retain the real `second_person_content_review` blocker but no longer carry a stale nutrition-validation blocker; no publication barrier is bypassed.'],
  ['M11 remains AMBER because 70 validated industrial drafts are not yet independently reviewed/published/production-served at catalogue scale.','M11 remains AMBER because 546 validated LOW-risk industrial drafts are not yet independently reviewed/published/production-served at catalogue scale.'],
  ['**57 total / 21 PASS / 33 AMBER / 3 BLOCKED / 0 abstraction orphans.**','**57 total / 22 PASS / 32 AMBER / 3 BLOCKED / 0 abstraction orphans.**'],
  ['Latest original row closure: **G5-008 / B06**. Earlier locked closures include G1-010, G5-007 and G5-011. M11/M12 remain AMBER because downstream commissioned breadth, not authored scale, is the launch criterion.','Latest original row closure: **G2-006** from unchanged post-merge production duration/session-quality commissioning. Earlier locked closures include G5-008/B06, G1-010, G5-007 and G5-011. M11/M12 remain AMBER because downstream commissioned breadth, not authored scale, is the launch criterion.']
]);

edit('docs/ACTIVE-RECOVERY.md',[
  ['# Active recovery checkpoint — 2026-08-12','# Active recovery checkpoint — 2026-08-13'],
  ['Authoritative original audit after demonstrated closures: **57 total / 20 PASS / 34 AMBER / 3 BLOCKED / 0 unmapped**. B03 behavioural remains **9/9 PASS and locked**.','Authoritative original audit after demonstrated closures: **57 total / 22 PASS / 32 AMBER / 3 BLOCKED / 0 unmapped**. B03 behavioural remains **9/9 PASS and locked**.'],
  ['- Previously locked in this wave: G1-010/M05/G5-011 security/privacy; G5-007/B07 Watchtower degradation/recovery; M03 Radar; M07 structured runtime; B03 9/9 behaviour.','- **G2-006 now earns PASS:** unchanged post-merge production run `31649921033` completed the authenticated 10/15/20/30/45/60 Fit duration/session-quality matrix GREEN after PR #109.\n- Previously locked in this wave: G1-010/M05/G5-011 security/privacy; G5-007/B07 Watchtower degradation/recovery; M03 Radar; M07 structured runtime; B03 9/9 behaviour.'],
  ['- Targeted authoritative CoFID 2021 ingredient-level validation: **70 industrial recipes**.\n- Those 70 remain draft/quarantined pending independent review; strict ambiguous mappings remain fail-closed.','- Governed repaired-V6 CoFID 2021 ingredient-level validation: **546 industrial recipes**, all LOW-risk in the latest calculation wave.\n- **2,330** remain quarantined behind unresolved ingredient families; the 546 validated drafts remain blocked on real second-person content review rather than stale nutrition-validation state.'],
  ['6. Merge this reconciliation only on unchanged GREEN CI; after merge, GitHub `main` plus this file/matrix/ledger are the recovery authority.','6. Merge this reconciliation only on unchanged GREEN CI; after merge, GitHub `main` plus this file/matrix/ledger are the recovery authority.\n7. Continue M11 from the ranked high-unlock blockers (`toasted oat crunch`, `light peppercorn sauce`, `chicken sausages`, sauce/yoghurt families) while keeping human review/publication barriers hard.']
]);

edit('finish-line-gate.mjs',[
  ['must(counts.PASS===21,`original matrix PASS count is 21 (found ${counts.PASS||0})`);','must(counts.PASS===22,`original matrix PASS count is 22 (found ${counts.PASS||0})`);'],
  ['must(counts.AMBER===33,`original matrix AMBER count is 33 (found ${counts.AMBER||0})`);','must(counts.AMBER===32,`original matrix AMBER count is 32 (found ${counts.AMBER||0})`);'],
  ["must(matrix.includes('PASS rows: 21. AMBER rows: 33. BLOCKED rows: 3.'),'matrix reconciliation summary matches enforced counts');","must(matrix.includes('PASS rows: 22. AMBER rows: 32. BLOCKED rows: 3.'),'matrix reconciliation summary matches enforced counts');"],
  ["must(launchFinish.includes('21 PASS / 33 AMBER / 3 BLOCKED'),'launch board scoreboard matches enforced counts');","must(launchFinish.includes('22 PASS / 32 AMBER / 3 BLOCKED'),'launch board scoreboard matches enforced counts');"]
]);

console.log('PASS reconciled G2-006 to 22/32/3 and recorded governed V6 Grub conversion at 546 LOW-risk drafts.');
