// Public information only. No ordering, clinical questionnaire or results integration.
export const PUBLIC_BLOODS_ROOT='/shift-health/blood-tests';
export const PUBLIC_BLOODS_PATHS=[PUBLIC_BLOODS_ROOT,...['baseline','advanced','complete'].flatMap(id=>[`${PUBLIC_BLOODS_ROOT}/${id}`,`${PUBLIC_BLOODS_ROOT}/${id}/your-test`]),`${PUBLIC_BLOODS_ROOT}/my-timber-example`,`${PUBLIC_BLOODS_ROOT}/about`];
export const INDEXABLE_BLOODS_PATHS=[PUBLIC_BLOODS_ROOT,...['baseline','advanced','complete'].map(id=>`${PUBLIC_BLOODS_ROOT}/${id}`)];
export function isPublicBloodsRequest(request){return ['GET','HEAD'].includes(request.method)&&PUBLIC_BLOODS_PATHS.includes(new URL(request.url).pathname.replace(/\/$/,''));}
export const BLOODS_ENTRY=`<section class="wrap health-bloods" aria-labelledby="health-bloods-heading"><div><span class="health-badge">INTRODUCING · COMING SOON</span><h2 id="health-bloods-heading">Meet SHIFT Bloods.</h2><p>Blood tests with a choice of collection. Explore our panels and the upper-arm device we’re trialling as an alternative to finger-prick kits.</p><p class="bloods-entry-status">No stock available today. Orders and bookings are closed.</p></div><a class="btn bloods-entry-cta" href="/shift-health/blood-tests">Explore SHIFT Bloods <span aria-hidden="true">→</span></a></section>`;
export const BLOODS_ENTRY_STYLE=`[data-shift-health] .health-bloods{margin-top:36px;margin-bottom:20px;padding:30px 34px;background:#1d2618;border:1px solid #5e6c50;border-radius:22px;display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:32px}[data-shift-health] .health-bloods h2{font-size:38px;line-height:1.08;margin:8px 0 12px}[data-shift-health] .health-bloods p{max-width:650px;font-size:16px;color:#d2d4c8}[data-shift-health] .health-bloods .bloods-entry-status{font-size:12px;margin:14px 0 0}[data-shift-health] .health-bloods .health-badge{font-size:10px;font-weight:900;letter-spacing:.13em;color:#b2bba0}[data-shift-health] .health-bloods a.bloods-entry-cta{min-height:48px;min-width:180px;background:#e7e3da;color:#707762;font-size:19px;font-weight:900;white-space:normal;gap:8px;text-align:center}[data-shift-health] .bloods-entry-cta:focus-visible{outline:3px solid #b2bba0;outline-offset:4px}@media(max-width:850px){[data-shift-health] .health-bloods{grid-template-columns:1fr;gap:20px}[data-shift-health] .health-bloods .bloods-entry-cta{justify-self:start}}@media(max-width:600px){[data-shift-health] .health-bloods{padding:24px;margin-top:25px}[data-shift-health] .health-bloods h2{font-size:31px}[data-shift-health] .health-bloods p{font-size:14px}}`;
export function addBloodsEntry(main){const target='<section class="wrap intro"';if(!main.includes(target))throw Error('SHIFT Health entry anchor missing');return main.replace(target,BLOODS_ENTRY+target);}

// Matt's exact Version1 FAQ, approved29October. Existing page ownership,
// prices, collection information and closed ordering remain unchanged.
export const NHS_HOME_TEST_FAQ='<details data-approved-nhs-home-test-faq><summary>Does NHS home testing mean every blood test is available through the NHS App?</summary><p>No. An NHS Home Test assessment published on 15 October 2026 describes an early platform starting with HIV self-testing, with other test types envisaged for the future. The assessment itself took place on 30 April. Passing alpha assessment permits conditional progression towards private beta; it does not confirm a public launch of testosterone testing or general blood panels.</p><p>For symptoms or a result you are worried about, ask your GP what investigation and follow-up are appropriate. SHIFT Bloods ordering remains closed.</p><p>Source: <a href="https://digitalhealth.blog.gov.uk/2026/10/15/nhse-home-test-alpha-assessment/">DHSC — NHSE Home Test Alpha Assessment</a>, published 15 October 2026; assessment 30 April 2026.</p></details>';
export function addApprovedHomeTestFaq(html){
 const question='Does NHS home testing mean every blood test is available through the NHS App?';
 if(html.includes(question)){
  if(html.split(NHS_HOME_TEST_FAQ).length!==2)throw Error('Existing NHS Home Test FAQ differs from the approved copy');
  return html;
 }
 const marker='<div class="faqs">',heading='<h2>The useful questions.</h2>';
 if(html.split(marker).length!==2||html.split(heading).length!==2)throw Error('Bloods FAQ insertion boundary changed');
 const start=html.indexOf(marker),title=html.indexOf(heading);
 if(start<title||start-title>300)throw Error('Bloods FAQ is outside its approved section');
 return html.slice(0,start+marker.length)+NHS_HOME_TEST_FAQ+html.slice(start+marker.length);
}

// This public surface is served by the isolated shift-bloods-public Worker, so it
// must carry the approved navigation retirement independently of Core.
export const BLOODS_NAVIGATION_RETIREMENT='bloods-navigation-20261031-r1';
export const BLOODS_NAVIGATION_RETIREMENT_STYLES='.sst-shed-teaser{display:none!important}';
export const BLOODS_NAVIGATION_RETIREMENT_CLIENT=String.raw`(function retireTimberShedClient(){
  function retire(){for(const node of document.querySelectorAll('.sst-shed-teaser')){node.hidden=true;node.setAttribute('aria-hidden','true');if(node.textContent)node.textContent=''}}
  retire();
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',retire,{once:true});
  new MutationObserver(retire).observe(document.documentElement,{childList:true,subtree:true});
  setTimeout(retire,0);setTimeout(retire,250);
})();`;
export function retirePublicShedNavigation(html){
 const cleaned=html.replace(/<span\b(?=[^>]*\bclass=["'][^"']*\bsst-shed-teaser\b[^"']*["'])[^>]*>[\s\S]*?<\/span>/gi,'');
 if(cleaned.includes('data-shift-navigation-retirement'))return cleaned;
 if(!/<\/head>/i.test(cleaned)||!/<\/body>/i.test(cleaned))return cleaned;
 return cleaned
  .replace(/<\/head>/i,`<style data-shift-navigation-retirement="${BLOODS_NAVIGATION_RETIREMENT}">${BLOODS_NAVIGATION_RETIREMENT_STYLES}</style></head>`)
  .replace(/<\/body>/i,`<script data-shift-navigation-retirement="${BLOODS_NAVIGATION_RETIREMENT}">${BLOODS_NAVIGATION_RETIREMENT_CLIENT}</script></body>`);
}


