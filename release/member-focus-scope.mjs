// Matt authorised this exact tested preview on 30 September 2026: Go live.
import assert from 'node:assert/strict';
export const MEMBER_FOCUS_APPROVED='6cc950b4f6020e44dbaafffe4b7bf90d54852cca';
export const MEMBER_FOCUS_RUN=36636511091;
export const MEMBER_FOCUS_PATHS=[
  ".github/workflows/app-layout-preview.yml",
  "frontend/member/member-my-timber-problem-v1.js",
  "member-experience/checkin-followup-client.mjs",
  "member-experience/chrome.mjs",
  "member-experience/grub-runtime.mjs",
  "member-experience/life-back-assets.mjs",
  "member-experience/life-back-routes.mjs",
  "member-experience/life-back/client.mjs",
  "member-experience/life-back/next-shift.mjs",
  "member-experience/staging/pins.json",
  "member-experience/tests/today-focus.test.mjs",
  "preview/app-layout/first-week.mjs",
  "preview/app-layout/first-week.test.mjs",
  "preview/app-layout/member-feedback-proof.cjs",
  "preview/app-layout/personal-focus.mjs",
  "preview/app-layout/presentation.mjs",
  "preview/app-layout/presentation.test.mjs",
  "preview/app-layout/refinement.mjs",
  "preview/app-layout/tabs.mjs",
  "preview/app-layout/today.mjs",
  "preview/app-layout/verify.cjs",
  "preview/growth-member/continuity-journey.mjs"
];
export function validateMemberFocus(read){
 for(const path of MEMBER_FOCUS_PATHS)assert.equal(read('HEAD',path),read(MEMBER_FOCUS_APPROVED,path),'Approved My Timber source drift: '+path);
}
