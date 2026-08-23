import fs from 'node:fs';
const read=file=>fs.readFileSync(file,'utf8');
const pathway=read('treatment-pathway-v1.js'),route=read('frontend/member/treatment-route-v1.js'),product=read('frontend/member/treatment-product-v1.js'),options=read('frontend/member/treatment-options-v1.js'),css=read('frontend/member/treatment-pathway-v2.css'),hq=read('commercial-hq-v1.js');
const checks={
  governedDailyGuidance:/TREATMENT_FORMULATION_GUIDANCE/.test(pathway)&&/Once-daily routine/.test(pathway),
  strengthNotSelfSelected:/not a menu/.test(pathway)&&/clinical_review_required/.test(pathway),
  switchingBoundary:/Do not overlap, replace or switch/.test(pathway),
  missedDoseBoundary:/Do not double a dose/.test(pathway),
  resultExplainsTablet:/daily routine/.test(route)&&/Explore how the route works/.test(route),
  productHasTabletDepth:/DAILY TABLET ROUTE/.test(product)&&/Starting or switching/.test(product)&&/If a dose is missed/.test(product),
  comparePageHasTabletBoundary:/Tablet route:/.test(options)&&/daily does not mean self-selected/.test(options),
  hqTabletSummary:/tabletRouteHqSummary/.test(hq)&&/clinicalSelectionRequired:true/.test(hq)&&/switchingReviewRequired:true/.test(hq),
  mobileBoundariesCollapse:/tp-boundaries/.test(css)&&/@media\(max-width:720px\)/.test(css),
  noPublicProposedPrices:!/proposedPricePence|proposed_price_pence|selling_price_pence/.test(route+product+options)
};
const failed=Object.entries(checks).filter(([,ok])=>!ok);if(failed.length){console.error(failed);process.exit(1)}
console.log(`Phase 2 tablet route gate passed: ${Object.keys(checks).length} governed consumer and fail-closed checks.`);
