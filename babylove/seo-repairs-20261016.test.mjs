import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {renderMarkdown,articleHTML,dynamicBabyLovePublicRoute} from './dynamic-public.mjs';
const rows=JSON.parse(readFileSync(new URL('./corrected-public-rows.json',import.meta.url)));
const env=row=>({DB:{prepare(){return {bind(){return this},async first(){return row?.status==='published'?row:null}}}}});
const row={...rows[0],slug:'proxy-test',body:'![x](https://media.babylovegrowth.ai/blog-images/organization-55073/test.jpeg)'};
const image=(src,headers={})=>new Request('https://shiftsometimber.co.uk/articles/proxy-test/image?src='+encodeURIComponent(src),{headers});
test('new media host is proxied in HTML and article image schema without changing canonical or dates',()=>{
 for(const r of rows){const html=articleHTML(r);const schema=JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);assert.equal(schema.datePublished,r.publish_at);assert.equal(schema.url,'https://shiftsometimber.co.uk/articles/'+r.slug);assert.equal((html.match(/<h1[ >]/g)||[]).length,1);assert.doesNotMatch(html,/<img[^>]+src="https:\/\/media\.babylovegrowth\.ai/);assert.match(schema.image,/^https:\/\/shiftsometimber\.co\.uk\/articles\/.+\/image\?src=/);}
});
test('published media proxy strips incoming secrets and rejects redirects, foreign sources and unrelated organisation paths',async()=>{
 const original=globalThis.fetch;let calls=[];
 globalThis.fetch=async(url,options)=>{calls.push({url,options});return new Response('image',{headers:{'Content-Type':'image/jpeg'}})};
 try{
 const src='https://media.babylovegrowth.ai/blog-images/organization-55073/test.jpeg';
 assert.equal((await dynamicBabyLovePublicRoute(image(src,{Cookie:'secret',Authorization:'Bearer secret'}),env(row))).status,200);
 assert.equal(calls.length,1);assert.equal(calls[0].options.redirect,'manual');assert.deepEqual(Object.keys(calls[0].options.headers),['Accept']);
 for(const bad of ['https://evil.example/x.jpeg','https://media.babylovegrowth.ai/blog-images/organization-55074/test.jpeg','https://media.babylovegrowth.ai/blog-images/organization-55073/absent.jpeg','http://media.babylovegrowth.ai/blog-images/organization-55073/test.jpeg','https://user:pass@media.babylovegrowth.ai/blog-images/organization-55073/test.jpeg','https://media.babylovegrowth.ai:8443/blog-images/organization-55073/test.jpeg','https://media.babylovegrowth.ai.evil.example/blog-images/organization-55073/test.jpeg'])assert.equal((await dynamicBabyLovePublicRoute(image(bad),env(row))).status,404);
 assert.equal(calls.length,1);
 assert.equal(await dynamicBabyLovePublicRoute(image(src),env({...row,status:'draft'})),null);
 for(const result of [new Response(null,{status:302,headers:{Location:'https://evil.example/x'}}),new Response('<html>',{headers:{'Content-Type':'text/html'}})]){globalThis.fetch=async()=>result;assert.equal((await dynamicBabyLovePublicRoute(image(src),env(row))).status,502)}
 }finally{globalThis.fetch=original}
});
test('four audited fragment targets resolve while existing heading IDs survive',()=>{
 const cases=[['glp-1-weight-loss-plateau','how-we-can-help-if-youre-stalled-on-glp-1-treatment','how-we-can-help-if-you-re-stalled-on-glp-1-treatment'],['mens-weight-loss-diet','alcohols-role-in-mens-weight-loss','alcohol-s-role-in-men-s-weight-loss'],['glp-1-constipation','safe-laxative-use-if-diet-and-lifestyle-arent-enough','safe-laxative-use-if-diet-and-lifestyle-aren-t-enough'],['glp-1-constipation','managing-constipation-that-doesnt-go-away','managing-constipation-that-doesn-t-go-away']];
 for(const [slug,target,old] of cases){const r=rows.find(r=>r.slug===slug),html=renderMarkdown(r.body,r.title,slug);assert(html.includes('id="'+target+'"'));assert(html.includes('id="'+old+'"'));}
 const html=renderMarkdown("## Don't\n\n## Dont\n\n[Jump](#dont)");assert.equal((html.match(/id="dont"/g)||[]).length,1);
});
test('only three exact approved slug URL label combinations receive nofollow',()=>{
 const cases=[['glp-1-constipation','https://nutrilike.es/probioticos-para-colon-irritable-cuales-funcionan-y-como-elegir-el-adecuado','Fibre is the other pillar'],['glp-1-and-alcohol','https://getrecover365.com/blogs/blog/what-alcohol-really-does-to-your-liver-and-how-to-help-it-recover',"Recover 365's guide to alcohol and liver recovery"],['glp-1-weight-loss-plateau','https://vivoclinic.org/blog/tirzepatide-vs-semaglutide','clinical review of tirzepatide versus semaglutide']];
 for(const [slug,url,label] of cases){assert.match(renderMarkdown(`[${label}](${url})`,'',slug),/rel="noopener noreferrer nofollow"/);for(const [s,u,l] of [['other',url,label],[slug,url+'?x=1',label],[slug,url,label+' changed']])assert.doesNotMatch(renderMarkdown(`[${l}](${u})`,'',s),/nofollow/);}
 assert.doesNotMatch(renderMarkdown('[NICE](https://www.nice.org.uk/)','','glp-1-constipation'),/nofollow/);
});
test('corrected content removes known dose, product, review and service errors',()=>{
 const bodies=rows.map(r=>r.body).join('\n');assert.doesNotMatch(bodies,/\b72 mg\b|six months on (?:the )?maintenance dose|6 months on the maintenance dose|Our clinician-led medication pathway|Our approach pairs clinical assessment|partners like \[Nutrilike\]|Kikaboni|NutroBlaze|bloomsociety|hendersonvillencjiujitsu/);
 const eligibility=rows.find(r=>r.slug==='wegovy-eligibility-uk');assert.match(eligibility.body,/maximum is 7\.2 mg once weekly/);
 const dosage=rows.find(r=>r.slug==='glp-1-dosage-guide');assert.match(dosage.body,/1\.5 mg once daily/);assert.match(dosage.body,/Rybelsus is a diabetes product/);
});
