import fs from 'node:fs';

const read=file=>fs.readFileSync(new URL(file,import.meta.url),'utf8');
const need=(condition,message)=>{if(!condition)throw new Error(message)};
const route=read('./frontend/member/treatment-route-v1.js');
const product=read('./frontend/member/treatment-product-v1.js');
const options=read('./frontend/member/treatment-options-v1.js');
const homepage=read('./frontend/member/public-home-v1.html');
const pathway=read('./treatment-pathway-v1.js');
const release=read('./release-operational-status-v1.js');
const evidence=JSON.parse(read('./evidence/accepted-treatment-candidate-v1.json'));

// The accepted primary path is two choices. Previous-treatment detail is conditional
// safety context, not a compulsory third step for every customer.
need(/steps=\['preference','treatment_history','previous_treatment_detail','result'\]/.test(route),'accepted route state graph changed');
need(/if\(state\.step==='preference'\)state\.step='treatment_history'/.test(route),'routine choice no longer advances directly');
need(/state\.step=state\.answers\.previousTreatment\?'previous_treatment_detail':'result'/.test(route),'previous-treatment detail is no longer conditional');
need(/STEP '\+\(i\+1\)\+' OF 2/.test(route),'accepted two-choice progress contract changed');
need(!/step:'adult'|measurements|condition_pathway|email|phone/i.test(route),'unnecessary route collection was reintroduced');
need((route.match(/<select /g)||[]).length===3,'previous treatment must retain exactly three structured selectors');
need(!/<input\b|<textarea\b/i.test(route),'free-text route input was reintroduced');
need(/sessionStorage/.test(route)&&/PROGRESS_TTL/.test(route)&&/data-edit-route/.test(route),'saved/change-answer route controls changed');

// Once a governed catalogue item exists, its exact facts and action stay together.
for(const marker of ['SELECTED CATALOGUE ITEM','Price','Availability','Not published','Treatment access closed'])need(product.includes(marker),`product specificity lost: ${marker}`);
need(/<h3>\$\{esc\(family\.name\)\} · \$\{esc\(item\.label\)\}<\/h3>/.test(product),'selected medicine and strength are no longer named together');
need(/\$\{esc\(family\.name\)\} \$\{esc\(item\.label\)\} · access closed/.test(product),'primary action no longer names the exact item');
need(/data-strength=/.test(product)&&/aria-pressed/.test(product)&&/data-selected/.test(product),'selected strength is not explicit and live-updated');
need(/priceStatus==='published'/.test(product)&&/stockState==='published'/.test(product),'price or availability can bypass governed publication state');
need(!/(?:href|action)=["'][^"']*(?:checkout|basket|order)|buy now|add to basket/i.test(route+options+product),'consumer purchase action was introduced');
need(!/Mounjaro|Wegovy|Ozempic|tirzepatide|semaglutide|£\d/i.test(homepage),'public homepage ceased to be service-level');
need(/priceStatus:'unpublished'/.test(pathway)&&/ctaState:'blocked'/.test(pathway),'public pathway is not fail-closed');

need(evidence.schema==='shift.accepted-treatment-candidate.v1','acceptance evidence schema changed');
need(evidence.acceptanceEnvironment==='physical iPhone Safari','physical iPhone Safari acceptance missing');
need(/^Physical iPhone Safari sign-off: Pass\./.test(evidence.acceptanceStatement),'real-device pass is not recorded');
need(evidence.baseline?.productionTouched===false,'acceptance evidence must not claim production deployment');
need(JSON.stringify(evidence.lockedGates)===JSON.stringify(['commercial','claims','stock','supplier','purchase','clinical']),'accepted locked-gate boundary changed');
for(const gate of evidence.lockedGates)need(release.includes(`'${gate}'`)||gate==='purchase',`operational status no longer models ${gate}`);
need(/medicinePurchase:\{state:saleEnabled\?'enabled':BLOCKED/.test(release),'medicine purchase no longer defaults fail-closed');

console.log(JSON.stringify({
  proof:'ACCEPTED_TREATMENT_CANDIDATE_V1',status:'PASS',
  acceptanceEnvironment:evidence.acceptanceEnvironment,
  route:'two-choice primary path; conditional structured previous-treatment detail',
  product:'exact governed medicine + strength + price/availability status + item-specific locked action',
  gates:Object.fromEntries(evidence.lockedGates.map(gate=>[gate,'locked'])),
  productionTouched:false
},null,2));
