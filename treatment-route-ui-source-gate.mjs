import fs from 'node:fs';
const js=fs.readFileSync(new URL('./frontend/member/treatment-route-v1.js',import.meta.url),'utf8');
const css=fs.readFileSync(new URL('./frontend/member/treatment-route-v1.css',import.meta.url),'utf8');
const html=fs.readFileSync(new URL('./frontend/member/treatment-route.html',import.meta.url),'utf8');
const worker=fs.readFileSync(new URL('./worker-entry-v6.js',import.meta.url),'utf8');
const options=fs.readFileSync(new URL('./frontend/member/treatment-options-v1.js',import.meta.url),'utf8');
const product=fs.readFileSync(new URL('./frontend/member/treatment-product-v1.js',import.meta.url),'utf8');
const homepage=fs.readFileSync(new URL('./frontend/member/public-home-v1.html',import.meta.url),'utf8');
const checks={
  oneSection:/steps=\['adult','measurements','condition_pathway','treatment_history','previous_treatment_detail','preference','result'\]/.test(js),
  noContactGate:!/email|phone/.test(js),
  savedProgress:/sessionStorage/.test(js)&&/pageshow/.test(js),
  immediateResult:/state\.step==='result'/.test(js)&&/Your routes, clearly/.test(js),
  clinicalQualifier:/qualified clinician must review your full assessment/.test(js),
  noNamedPom:!/Mounjaro|Wegovy|Ozempic|tirzepatide|semaglutide/i.test(js+html),
  noInventedPrice:!/£\d|pricePence|sellingPrice/.test(js),
  accountBlocked:/data-account disabled/.test(js),
  brand:/#050505/.test(css)&&/#E7E3DA/.test(css)&&/#707762/.test(css),
  iphone:/viewport-fit=cover/.test(html)&&/safe-area-inset-bottom/.test(css),
  workerRoute:/find-my-treatment-route/.test(worker)&&/treatment-route-v1\.js/.test(worker)
  ,liveCatalogue:/\/v1\/treatment\/pathway\/start/.test(js)&&/\/v1\/treatment\/catalogue/.test(js)
  ,homepageServiceOnly:!/Mounjaro|Wegovy|tirzepatide|semaglutide|tablet|injection/i.test(homepage)
  ,productFailClosed:/Purchase unavailable/.test(product)&&/disabled/.test(product)&&/Prices are provisional/.test(options)
};
const failed=Object.entries(checks).filter(([,v])=>!v).map(([k])=>k);if(failed.length){console.error(JSON.stringify({proof:'TREATMENT_ROUTE_UI_SOURCE',status:'FAIL',failed},null,2));process.exit(1)}
console.log(JSON.stringify({proof:'TREATMENT_ROUTE_UI_SOURCE',status:'PASS',checks:Object.keys(checks).length,boundary:'Post-CTA informational route only; no named POM, invented price, clinical eligibility claim or contact gate.'},null,2));
