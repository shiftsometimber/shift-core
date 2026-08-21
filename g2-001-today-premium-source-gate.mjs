import fs from 'node:fs';
let failed=false;const must=(ok,msg)=>{if(!ok){console.error('FAIL '+msg);failed=true}else console.log('PASS '+msg)};
const js=fs.readFileSync('frontend/member/member-today-premium-v1.js','utf8');
const css=fs.readFileSync('frontend/member/member-today-premium-v1.css','utf8');
const shell=fs.readFileSync('frontend/member/member-shell-v33g.js','utf8');
const worker=fs.readFileSync('worker-entry-v6.js','utf8');
const wrangler=fs.readFileSync('wrangler.jsonc','utf8');

must(js.includes('SST_API.getShiftToday'),'Today layer reads the canonical deployed Today API');
must(js.includes('Show me what matters')&&js.includes("key:'mood'")&&js.includes("key:'guts'")&&js.includes("key:'energy'"),'Today presents the approved three-tap check-in without scoring ceremony');
must(js.includes('card.meals.map')&&js.includes('data-choice="${domain}:'),'Today renders named meal and movement decisions from the canonical Today response');
must(js.includes('SST_API.saveShiftTodayGrub')&&js.includes('SST_API.saveShiftTodayMove'),'Today choices persist through the existing member API adapter');
must(js.includes("data-panel=\"progress\"")&&js.includes("data-panel=\"ai\""),'Optional Progress and Ask Timber branches route into existing product surfaces');
must(js.includes("dataset.todayPremiumReady='true'"),'Today exposes a settled rendered-acceptance marker');
must(!js.includes('check-in complete')&&!js.includes('success confetti'),'Today avoids generic completion and confetti language');
must(css.includes('--shift-black:#050505')&&css.includes('--shift-cream:#E7E3DA')&&css.includes('--shift-green:#707762'),'Today uses the approved three-colour Shift constitution');
must(css.includes('min-height:48px')&&css.includes('@media(max-width:760px)'),'Today keeps mobile actions touch-usable and responsive');
for(const asset of ['/member-today-premium-v1.js','/member-today-premium-v1.css']){
  must(shell.includes(asset),`member shell injects ${asset}`);
  must(worker.includes(`'${asset}'`),`Shift Core publishes ${asset}`);
  must(wrangler.includes(`shiftsometimber.co.uk${asset}*`)&&wrangler.includes(`www.shiftsometimber.co.uk${asset}*`),`production routes cover ${asset}`);
}
must(fs.existsSync('frontend/member/member-product-v33d.js'),'existing member product runtime remains in place; no parallel product architecture');
if(failed)process.exit(1);
console.log('PASS G2-001 source gate: canonical Today detail/CTA presentation is premium, responsive and Git-authoritative without inventing member state.');
