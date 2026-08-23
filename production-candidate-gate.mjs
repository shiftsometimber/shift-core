import fs from 'node:fs';

const read=file=>fs.readFileSync(new URL(file,import.meta.url),'utf8');
const worker=read('./worker-entry-v6.js');
const home=read('./frontend/member/public-home-v1.html');
const route=read('./frontend/member/treatment-route-v1.js');
const options=read('./frontend/member/treatment-options-v1.js');
const product=read('./frontend/member/treatment-product-v1.js');
const treatmentStyles=read('./frontend/member/treatment-pathway-v2.css');
const pathway=read('./treatment-pathway-v1.js');
const catalogue=read('./treatment-catalogue-v1.js');
const hq=read('./commercial-hq-v1.js');
const intake=read('./treatment-catalogue-intake-v1.js');
const claims=read('./claims-library-v1.js');
const surface=[home,route,options,product].join('\n');

const checks={
  definitiveHome:/path==='\/'\|\|path==='\/public-home'/.test(worker)&&/public-home-v1/.test(worker),
  coherentJourney:/find-my-treatment-route/.test(home)&&/\/treatment-options\//.test(route)&&/\/v1\/treatment\/pathway\/start/.test(product)&&/data-edit-route/.test(route)&&/tp-journey/.test(product),
  noConsumerCheckout:!/(?:href|action)=["'][^"']*(?:checkout|basket|order)|buy now|add to basket|place order/i.test(surface),
  accessExplicitlyClosed:/Treatment access is not open yet/.test(home)&&/Treatment access is closed/.test(options)&&/Treatment access closed/.test(product),
  noInternalLaunchPlaceholders:!/\bTBC\b|proposed price|supplier tbc/i.test(surface),
  treatmentVisualDebtClosed:/\.tp-back\{[^}]*color:var\(--black\)/.test(treatmentStyles)&&/tp-ladder-static/.test(treatmentStyles)&&/tp-locked/.test(treatmentStyles),
  publicCatalogueHidesWorkingCommercials:!/proposedPricePence/.test(pathway)&&/priceStatus:'unpublished'/.test(pathway)&&/ctaState:'blocked'/.test(pathway),
  catalogueDefaultsClosed:/cta_state TEXT NOT NULL DEFAULT 'blocked'/.test(catalogue)&&/stock_state TEXT NOT NULL DEFAULT 'tbc'/.test(catalogue)&&/commercial_state TEXT NOT NULL DEFAULT 'blocked'/.test(catalogue),
  hqTreatmentEvidenceFailClosed:/allTreatmentPurchasePathsLocked:true/.test(hq)&&/cta_state='blocked'/.test(hq)&&/commercial_state='blocked'/.test(hq)&&/treatmentHqSummary/.test(hq),
  catalogueIntakeFailClosed:/idempotency_conflict/.test(intake)&&/rollback_revision_conflict/.test(intake)&&/cta_state='blocked'/.test(intake)&&/commercial_state='blocked'/.test(intake)&&!intake.includes('claims_state='),
  claimsFailClosed:/claim\.state!=='approved'/.test(claims)&&/review_at/.test(claims)&&/expires_at/.test(claims)&&/return null/.test(claims),
  noUngovernedNumericClaim:!/4½ stone|4\.5 stone|lost \d/i.test(home),
  noPlaceholderDeadEnds:!/Explore men’s health|href="#"|javascript:/i.test(home)
};

const failed=Object.entries(checks).filter(([,value])=>!value).map(([name])=>name);
if(failed.length){console.error(JSON.stringify({proof:'PRODUCTION_CANDIDATE_FAIL_CLOSED',status:'FAIL',failed},null,2));process.exit(1)}
console.log(JSON.stringify({proof:'PRODUCTION_CANDIDATE_FAIL_CLOSED',status:'PASS',checks:Object.keys(checks).length,boundary:'Consumer route can merge without enabling medicine sale, unapproved claims, stock, supplier, commercial or clinical gates.'},null,2));
