import fs from 'node:fs';
const read=file=>fs.readFileSync(file,'utf8');
const home=read('frontend/member/public-home-v1.html'),homeCss=read('frontend/member/public-journey-v1.css'),route=read('frontend/member/treatment-route-v1.js'),routeCss=read('frontend/member/treatment-route-v1.css'),options=read('frontend/member/treatment-options-v1.js'),product=read('frontend/member/treatment-product-v1.js'),productCss=read('frontend/member/treatment-pathway-v2.css');
const surface=[home,route,options,product].join('\n');
const checks={
  homepageSinglePrimaryJourney:/Find my treatment route/.test(home)&&/href="#how-it-works"/.test(home)&&/One clear route/.test(home),
  journeyStagesVisible:/tr-journey/.test(route)&&/tp-journey/.test(options)&&/tp-journey/.test(product),
  answersRemainEditable:/data-edit-route/.test(route)&&/Change answers/.test(route),
  resultsExplainMatch:/match to the routine you chose/.test(route)&&/not an eligibility or clinical decision/.test(route),
  productReturnsToResults:/Back to my route results/.test(product)&&/sst_treatment_route_v1/.test(route),
  strengthsNotCustomerControls:/tp-ladder-static/.test(product)&&!/data-strength|aria-pressed/.test(product),
  clearLockedEnding:/Information ends here/.test(product)&&/No checkout, order or medicine CTA exists/.test(product),
  mobileAndFocus:/@media\(max-width:720px\)/.test(productCss)&&/focus-visible/.test(productCss)&&/safe-area-inset-bottom/.test(routeCss),
  catalogueOnly:/treatment\/pathway\/start/.test(route)&&/treatment\/pathway\/start/.test(options)&&/treatment\/pathway\/start/.test(product),
  noCommercialLeak:!/£\d|proposedPricePence|proposed_price|sellingPrice|supplier tbc/i.test(surface),
  noPurchasePath:!/href="[^"]*(checkout|basket|order)|buy now|add to basket/i.test(surface),
  compactHomepage:/sj-strip-cta/.test(homeCss)&&/sj-today-proof/.test(home)
};
const failed=Object.entries(checks).filter(([,ok])=>!ok).map(([name])=>name);
if(failed.length){console.error(JSON.stringify({proof:'PHASE_4_DEFINITIVE_JOURNEY',status:'FAIL',failed},null,2));process.exit(1)}
console.log(JSON.stringify({proof:'PHASE_4_DEFINITIVE_JOURNEY',status:'PASS',checks:Object.keys(checks).length,boundary:'Homepage through governed route information is coherent; medicine access remains absent.'},null,2));
