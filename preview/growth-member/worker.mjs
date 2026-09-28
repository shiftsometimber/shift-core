import preview from '../stabilisation/worker.mjs';
export default {async fetch(request,env,ctx){
 const response=await preview.fetch(request,env,ctx);
 if(new URL(request.url).pathname!=='/__review'||!response.ok)return response;
 let body=await response.text();
 body=body.replace('Launch-readiness repairs','SHIFT: growth and member experience');
 body=body.replace('Payment recovery, accurate treatment selections and reliable member photos. B1 save/reset regressions retained.','Review the first-week example, the plain-English service offer and improved Next Shift feedback.');
 body=body.replace('<h2>Public website</h2>','<h2>Changes for your review</h2><p><a href="/programme">First-week example</a><a href="/help">What you get from SHIFT</a></p><p>The existing header, navigation and member account model are preserved. Treatments use “No stock available today”. No public copy says partners or sign-off are pending.</p><h2>Existing public journeys</h2>');
 body=body.replace('<h2>What stayed out of scope</h2>','<h2>Before approval</h2><p>This is a review candidate, not a release. Try negative feedback twice: the next task must change. If an adjusted step helps, the useful adjustment should be retained. Automated checks use fictional accounts; real-device acceptance and the wider release matrix remain separate.</p><h2>What stayed out of scope</h2>');
 body=body.replace('<a href="/sitemap.xml">Preview sitemap proposal</a>','').replace('Three legacy pages remain unpromoted rather than linking visitors into outdated workplace, pricing or browser-storage claims.','No new pricing, paid services, partner commitments or wider redesign is included in this candidate.');
 return new Response(body,{status:response.status,headers:response.headers});
}};
