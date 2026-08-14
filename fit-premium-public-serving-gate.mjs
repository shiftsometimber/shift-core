import fs from 'node:fs';
const fail=[];const need=(ok,msg)=>{if(!ok)fail.push(msg)};
const source='assets/fit/premium',bound='frontend/member/assets/fit/premium';
const a=fs.readdirSync(source).filter(x=>x.endsWith('.svg')).sort(),b=fs.readdirSync(bound).filter(x=>x.endsWith('.svg')).sort();
need(a.length===26&&b.length===26,`expected 26/26 Fit visual assets, got ${a.length}/${b.length}`);
need(JSON.stringify(a)===JSON.stringify(b),'bound Fit visual filenames differ from accepted source');
for(const f of a)need(fs.readFileSync(`${source}/${f}`).equals(fs.readFileSync(`${bound}/${f}`)),`${f}: bound public asset differs byte-for-byte from accepted source`);
const ops=fs.readFileSync('commissioning-ops-v1.js','utf8'),wrangler=fs.readFileSync('wrangler.jsonc','utf8'),shell=fs.readFileSync('frontend/member/member-shell-v33g.js','utf8'),prod=fs.readFileSync('fit-premium-assets-production.mjs','utf8');
need(ops.includes('/assets\\/fit\\/premium\\/')&&ops.includes('image/svg+xml'),'Worker does not explicitly serve published Fit premium SVG paths');
need(wrangler.includes('shiftsometimber.co.uk/assets/fit/premium/*')&&wrangler.includes('www.shiftsometimber.co.uk/assets/fit/premium/*'),'public site Worker routes for Fit premium assets missing');
need(shell.includes('assetReady(SHIFT_ME_API_SRC')&&shell.includes("console.warn('shift_me_optional_assets_unavailable')"),'member shell does not isolate optional Shift Me asset failure');
need(!/ensureShiftMePremium\(\)\{if\(!onDashboard\(\)\)return;ensureCss/.test(shell),'member shell still injects Shift Me unconditionally');
need(prod.includes("FIT_V1_26_PREMIUM_ASSETS_PRODUCTION_HTTP_V1")&&prod.includes("text.includes('START')")&&prod.includes("text.includes('MOVE')")&&prod.includes("text.includes('FINISH')"),'production proof does not require real 26-asset HTTP three-state rendering source');
if(fail.length){console.error(JSON.stringify({proof:'FIT_PREMIUM_PUBLIC_SERVING_SOURCE_V1',status:'FAIL',fail},null,2));process.exit(1)}
console.log(JSON.stringify({proof:'FIT_PREMIUM_PUBLIC_SERVING_SOURCE_V1',status:'PASS',acceptedSource:26,publicBound:26,byteIdentical:true,shiftMeFailureIsolated:true},null,2));
