import fs from 'node:fs';

const need=(ok,message)=>{if(!ok)throw new Error(message)};
const shell=fs.readFileSync('frontend/member/my-timber-preview.html','utf8');
const worker=fs.readFileSync('worker-entry-v6.js','utf8');
const config=fs.readFileSync('wrangler.jsonc','utf8');

need(worker.includes("new URL('/my-timber-preview',request.url)"),'live My Timber route is not serving the governed shell');
for(const marker of [
  'aria-label="Main website navigation"',
  'href="/start-here.html"',
  'href="/treatment-centre.html"',
  'href="/explore-knowledge.html"',
  'href="/timber-mill.html"',
  'class="tap-link" href="/tap-room"',
  'aria-label="My Timber destinations"',
  'class="member-tap-room" href="/tap-room"',
  'aria-expanded="false"',
  'min-height:44px',
  'name="rememberMe" type="checkbox" checked',
  'Keep me signed in on this device',
  'data.rememberMe=form.elements.rememberMe.checked',
  "params.get('returnTo')"
])need(shell.includes(marker),`My Timber navigation contract missing ${marker}`);
need(shell.includes("?'https://api.shiftsometimber.co.uk':location.origin"),'production My Timber is not routed to the canonical API origin');
for(const marker of ['shiftsometimber.co.uk/member/dashboard*','shiftsometimber.co.uk/member-login*','shiftsometimber.co.uk/member-register*'])need(config.includes(marker),`live My Timber route missing ${marker}`);
need(!shell.includes('Isolated My Timber preview'),'live My Timber still presents itself as an isolated preview');
need(!shell.includes('Nothing here touches your live Shift account'),'live My Timber still contains preview-only account copy');
const login=fs.readFileSync('member-login-fastpath-v1.js','utf8');
for(const marker of ['body?.rememberMe===true','Domain=.shiftsometimber.co.uk','Max-Age=','REMEMBER_DAYS=90','STANDARD_HOURS=12'])need(login.includes(marker),`remember-me contract missing ${marker}`);

console.log('My Timber navigation gate: PASS');
