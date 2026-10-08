import test from 'node:test';
import assert from 'node:assert/strict';
import {TOOL_PATHS,PUBLIC_STYLES,repairFreeToolSchema,withPublicToolDelivery} from '../public-tool-delivery.mjs';
const origin='https://shiftsometimber.co.uk';
const request=(p,method='GET',headers={})=>new Request(origin+p,{method,headers});
const markup=node=>'<main>Unchanged calculator</main><script type="application/ld+json">'+JSON.stringify(node)+'</script>';
test('free public application gets truthful price, with authorship and dates preserved and no invented review',async()=>{
 const node={'@context':'https://schema.org','@type':'WebApplication',name:'Calculator',isAccessibleForFree:true,dateModified:'2026-08-08',creator:{name:'Shift Some Timber'}};
 for(const p of TOOL_PATHS){
  const before=markup(node),r=await withPublicToolDelivery(new Response(before,{headers:{'Content-Type':'text/html','Cache-Control':'no-store','ETag':'stale','Content-Encoding':'gzip'}}),request(p));
  const after=await r.text(),data=JSON.parse(after.match(/<script[^>]*>(.*?)<\/script>/s)[1]);
  assert.deepEqual(data,{...node,offers:{'@type':'Offer',price:0,priceCurrency:'GBP'}});assert(after.startsWith('<main>Unchanged calculator</main>'));
  assert.equal(r.headers.get('Cache-Control'),'no-store');assert.equal(r.headers.get('ETag'),null);assert.equal(r.headers.get('Content-Encoding'),null);assert.equal(repairFreeToolSchema(after),after);
 }
});
test('existing offers, non-free apps, malformed JSON and unrelated schema preserved',()=>{
 for(const node of [{'@type':'WebApplication',offers:{price:3},isAccessibleForFree:true},{'@type':'WebApplication',isAccessibleForFree:false},{'@type':'Organization',isAccessibleForFree:true}])assert.equal(repairFreeToolSchema(markup(node)),markup(node));
 assert.equal(repairFreeToolSchema('<script type="application/ld+json">broken</script>'),'<script type="application/ld+json">broken</script>');
 const graph={'@graph':[{'@type':['SoftwareApplication'],isAccessibleForFree:true},{'@type':'Article',headline:'Preserve'}]};
 const repaired=JSON.parse(repairFreeToolSchema(markup(graph)).match(/<script[^>]*>(.*?)<\/script>/s)[1]);assert.equal(repaired['@graph'][0].offers.price,0);assert.deepEqual(repaired['@graph'][1],graph['@graph'][1]);
});
test('only allowlisted public CSS cached briefly; body, security and validators preserved',async()=>{
 for(const p of PUBLIC_STYLES){const r=await withPublicToolDelivery(new Response('body{color:black}',{headers:{'Content-Type':'text/css; charset=utf-8','Cache-Control':'no-store',Pragma:'no-cache',ETag:'css1','X-Content-Type-Options':'nosniff'}}),request(p+'?v=8'));assert.equal(r.headers.get('Cache-Control'),'public, max-age=300, must-revalidate');assert.equal(await r.text(),'body{color:black}');assert.equal(r.headers.get('ETag'),'css1');assert.equal(r.headers.get('X-Content-Type-Options'),'nosniff');assert.equal(r.headers.get('Pragma'),null);}
});
test('private, authenticated, cookie-varying CSS, failures and wrong content types are never made public',async()=>{
 for(const [extra,req,status] of [[{'Set-Cookie':'session=secret'},request('/assets/header-navigation-v2.css'),200],[{Vary:'Accept-Encoding, Cookie'},request('/assets/header-navigation-v2.css'),200],[{Vary:'*'},request('/assets/header-navigation-v2.css'),200],[{'Cache-Control':'private, no-store'},request('/assets/header-navigation-v2.css'),200],[{},request('/assets/header-navigation-v2.css','GET',{Authorization:'secret'}),200],[{},request('/assets/header-navigation-v2.css'),404],[{'Content-Type':'text/html'},request('/assets/header-navigation-v2.css'),200]]){const r=new Response('keep',{status,headers:{'Content-Type':'text/css',...extra}});assert.equal(await withPublicToolDelivery(r,req),r);}
});
test('homepage, Start Here, members, APIs and consent/analytics scripts preserve responses',async()=>{
 for(const p of ['/','/start-here','/member/dashboard','/v1/me','/analytics-bootstrap-v1.js','/consent-v4a.js','/assets/unknown.css']){const r=new Response(markup({'@type':'WebApplication',isAccessibleForFree:true}),{headers:{'Content-Type':'text/html','Cache-Control':'no-store'}});assert.equal(await withPublicToolDelivery(r,request(p)),r);}
 const r=new Response('HEAD',{headers:{'Content-Type':'text/html'}});assert.equal(await withPublicToolDelivery(r,request('/tools/bmi','HEAD')),r);
});
