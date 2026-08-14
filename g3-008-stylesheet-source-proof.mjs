const SITE=(process.env.SHIFT_SITE_BASE||'https://shiftsometimber.co.uk').replace(/\/$/,'');
const url=`${SITE}/member-p0-v1.css?v=3`;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let evidence=null;
for(let attempt=1;attempt<=30;attempt++){
  const r=await fetch(`${url}&proof=${Date.now()}`,{redirect:'manual',headers:{'Cache-Control':'no-cache'}});
  const text=await r.text();
  evidence={proof:'G3_008_LIVE_STYLESHEET_SOURCE',attempt,url,status:r.status,authority:r.headers.get('x-shift-frontend-authority'),cache:r.headers.get('cache-control'),contentType:r.headers.get('content-type'),bytes:Buffer.byteLength(text),hasPrimaryRepair:text.includes('#53624d'),hasControlRepair:text.includes('#6f7869'),hasFocusRepair:text.includes('focus-visible')&&text.includes('#53624d'),hasSpecificityRepair:text.includes('html body .mp-btn:not(.ghost)')&&text.includes('html body .member-form input')};
  console.log(JSON.stringify(evidence));
  const ready=r.ok&&evidence.hasPrimaryRepair&&evidence.hasControlRepair&&evidence.hasFocusRepair&&evidence.hasSpecificityRepair&&String(evidence.authority||'').includes('member-p0-v1.css');
  if(ready){console.log('PASS G3-008 live stylesheet source: production serves the exact high-specificity contrast/control/focus repair from Git authority.');process.exit(0)}
  if(attempt<30)await sleep(10000);
}
throw new Error(`live stylesheet did not converge to commissioned G3-008 source: ${JSON.stringify(evidence)}`);
