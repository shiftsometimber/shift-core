import fs from 'node:fs';
const read=file=>fs.readFileSync(file,'utf8'),need=(ok,message)=>{if(!ok)throw new Error(message)};
const ui=read('frontend/member/member-my-timber-problem-v1.js'),css=read('frontend/member/member-today-final-v1.css'),shell=read('frontend/member/member-shell-v33g.js'),worker=read('worker-entry-v6.js'),workflow=read('.github/workflows/my-timber-final-production.yml'),production=read('my-timber-final-production.mjs');
for(const marker of ['todayDecisionReady','Working late','I’ll have that','Start the session','revealRoot'])need(ui.includes(marker),`missing final Today marker: ${marker}`);
for(const marker of ['MY-TIMBER-FINAL-MOBILE-V1','min-height:148px','min-height:188px','grid-template-columns:1fr','scroll-snap-type:none','focus-visible'])need(css.includes(marker),`missing final mobile marker: ${marker}`);
need(shell.includes('member-today-final-v1.css?v=1'),'final mobile CSS is not loaded');
need(/["']\/member-today-final-v1\.css["']/.test(worker),'final mobile CSS is not Worker-served');
need(/Access-Control-Allow-Headers["']?\s*:\s*["']Content-Type, X-Shift-Commissioning-OIDC, X-Shift-Local-Date, X-Shift-Local-Hour/.test(worker),'Today local date/hour headers are not allowed through the production CORS preflight');
for(const marker of ['390,height:844','recordVideo','working_late','choose-today','dailyAfter.connected?.meal?.recipeId','chosenWorkspace','.today-meal-meta','data-recipe-id','savedFitBefore.plan','savedFitAfter.plan','revealFit','verifyLiveTools','horizontal overflow'])need(production.includes(marker),`missing genuine production walkthrough assertion: ${marker}`);
for(const marker of ['my-timber-final-production.mjs','my-timber-billy-iphone.mp4','actions/upload-artifact@v4'])need(workflow.includes(marker),`final production workflow missing: ${marker}`);
const promotion=read('.github/workflows/cloudflare-production-promote.yml');
need(promotion.includes('frontend/member/member-progress-v1.js'),'Progress runtime changes do not trigger production promotion');
need(workflow.includes('workflow_run:')&&workflow.includes("workflows: ['Cloudflare Production Promote']")&&workflow.includes("github.event.workflow_run.conclusion == 'success'"),'Final production journey must run after successful promotion');
need(workflow.includes('ref: ${{ github.event.workflow_run.head_sha || github.sha }}'),'Final production journey must use the promoted source revision');
const push=workflow.match(/^  push:\n([\s\S]*?)(?=^  workflow_run:)/m)?.[1];
const reviewedVerificationPush="    branches: [main, verification/member-design-20261002, verification/member-finish-20261002, release/internal-closeout-20261004, fix/member-reload-navigation-20261007]\n    paths:\n      - 'my-timber-final-production.mjs'\n      - 'release/app-member-live.mjs'\n      - 'rendered-member-acceptance-support.mjs'\n      - 'health-passport/production-browser.mjs'\n      - 'my-timber-google-play-screenshots.mjs'\n      - '.github/workflows/my-timber-final-production.yml'\n";
need(workflow.includes("internal?'ccb669ea75837fd8c713a899a76956b2b3b5808a'")&&workflow.includes("internal?'37194594995'"),'Internal diagnostics must bind to the exact successful serving-runtime receipt');
need(!push||(
  push===reviewedVerificationPush &&
  workflow.includes("if: github.event_name == 'push' && github.ref == 'refs/heads/main'") &&
  workflow.includes("Prove prior successful runtime and test-only verification delta") &&
  workflow.includes("assert(changed.every(p=>allowed.has(p))") &&
  workflow.includes("assert.equal(receipt.head_sha,baseline);assert.equal(receipt.conclusion,'success')") &&
  workflow.indexOf('Prove prior successful runtime and test-only verification delta')<workflow.indexOf('Acquire short-lived Shift commissioning identity')
),'Only the exact review branches may perform acceptance on an unchanged previously-promoted runtime; main source pushes capture screenshots only');
console.log('PASS My Timber final source gate: retained handlers, current approved UI, genuine authenticated meal/adjustment/Fit journey, saved-choice boundaries, unchanged-runtime verification branches and production video evidence are fail-closed.');
