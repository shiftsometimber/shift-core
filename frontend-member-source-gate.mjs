import fs from 'node:fs';
const css=fs.readFileSync('frontend/member/member-p0-v1.css','utf8');
const shell=fs.readFileSync('frontend/member/member-shell-v33g.js','utf8');
const fail=[];
const need=(ok,msg)=>{if(!ok)fail.push(msg)};
need(/\.ask-drawer\{[\s\S]*visibility:hidden!important;[\s\S]*pointer-events:none!important;[\s\S]*contain:layout paint!important/.test(css),'closed Ask Timber drawer is not contained/non-interactive');
need(/\.ask-drawer\.open\{[\s\S]*visibility:visible!important;[\s\S]*pointer-events:auto!important/.test(css),'open Ask Timber drawer is not restored');
const globalBlocks=(css.match(/(^|\n)\s*(?:html|body)(?:\s*,\s*(?:html|body))*\s*\{[^}]*\}/gi)||[]).join('\n');
need(!/overflow-x\s*:\s*(?:hidden|clip)/i.test(globalBlocks),'P0 attempts to mask page overflow globally');
need(/member-p0-v1\.css\?v=1/.test(shell),'member shell does not inject versioned P0 CSS');
need(/pointer-events:none/.test(shell),'member notice can still intercept pointer events');
need(/function clearNotice\(\)/.test(shell)&&/getMe\(\);clearNotice\(\)/.test(shell),'member notice is not cleared after successful session verification');
need(/function authenticatedNav\(\)/.test(shell)&&/member\/dashboard\.html/.test(shell),'authenticated My Shift destination is not repaired');
need(/if\(err\.status===401\)\{location\.replace\('\/member-login\.html\?next='/.test(shell),'401 session guard changed unexpectedly');
if(fail.length){console.error(JSON.stringify({proof:'V1_FRONTEND_SOURCE_P0',fail},null,2));process.exit(1)}
console.log(JSON.stringify({proof:'V1_FRONTEND_SOURCE_P0',status:'PASS',checks:['drawer overflow root fixed without global masking','notice non-interactive and cleared on successful auth','authenticated My Shift points to dashboard','401 guard unchanged'],authority:'frontend/README.md'},null,2));
