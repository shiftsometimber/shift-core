import fs from 'node:fs';
let failed=false;const must=(ok,msg)=>{if(!ok){console.error('FAIL '+msg);failed=true}else console.log('PASS '+msg)};
const js=fs.readFileSync('frontend/member/member-today-premium-v1.js','utf8');
const css=fs.readFileSync('frontend/member/member-today-premium-v1.css','utf8');
const shell=fs.readFileSync('frontend/member/member-shell-v33g.js','utf8');
const worker=fs.readFileSync('worker-entry-v6.js','utf8');
const wrangler=fs.readFileSync('wrangler.jsonc','utf8');

must(js.includes('presentation-only layer over the canonical /v1/shift/today contract'),'Today layer declares canonical presentation-only boundary');
must(js.includes('SST_API.getShiftToday'),'Today layer reads the canonical deployed Today API');
must(js.includes('action?.detail||action?.text'),'Today renders canonical action detail instead of dropping it');
must(js.includes('action?.cta?.target')&&js.includes('action?.cta?.label'),'Today renders the canonical action CTA contract');
must(js.includes("hydration:'water'")&&js.includes("grub:'grub'")&&js.includes("fit:'fit'"),'Today CTAs route into existing product surfaces');
must(js.includes("dataset.todayPremiumReady='true'"),'Today exposes a settled rendered-acceptance marker');
must(js.includes('if(!valid){if(card)card.hidden=true'),'Unavailable metrics are hidden rather than rendered as fake values');
must(css.includes('.mp-today-action-card.is-lead')&&css.includes('#17261d')&&css.includes('#f8f6ef'),'Today uses the existing forest/cream premium constitution');
must(css.includes('min-height:48px')&&css.includes('@media(max-width:760px)'),'Today keeps mobile actions touch-usable and responsive');
for(const asset of ['/member-today-premium-v1.js','/member-today-premium-v1.css']){
  must(shell.includes(asset),`member shell injects ${asset}`);
  must(worker.includes(`'${asset}'`),`Shift Core publishes ${asset}`);
  must(wrangler.includes(`shiftsometimber.co.uk${asset}*`)&&wrangler.includes(`www.shiftsometimber.co.uk${asset}*`),`production routes cover ${asset}`);
}
must(fs.existsSync('frontend/member/member-product-v33d.js'),'existing member product runtime remains in place; no parallel product architecture');
if(failed)process.exit(1);
console.log('PASS G2-001 source gate: canonical Today detail/CTA presentation is premium, responsive and Git-authoritative without inventing member state.');