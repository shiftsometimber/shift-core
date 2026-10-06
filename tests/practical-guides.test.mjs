import test from 'node:test';
import assert from 'node:assert/strict';
import {improvePracticalGuides,PRACTICAL_GUIDES} from '../public-practical-guides.mjs';
import {withPublicSeoCloseout} from '../public-seo-closeout.mjs';
const shell=c=>'<html><head><title>Original</title><link rel="canonical" href="https://shiftsometimber.co.uk/existing"><script type="application/ld+json">{"datePublished":"2026-08-26"}</script></head><body><header>Original header</header><main><h1>'+c.h1+' unchanged</h1>'+c.marker+'<p>Original guidance and safety</p></div></main><footer>Original footer</footer></body></html>';
for(const [path,c] of Object.entries(PRACTICAL_GUIDES)){
 test(path+' retains original guidance, schema and chrome and is idempotent',()=>{
  const before=shell(c),html=improvePracticalGuides(before,path);
  assert(html.includes(c.html));assert.equal(improvePracticalGuides(html,path),html);
  assert.equal(html.match(/<main\b[\s\S]*?<\/main>/)[0].replace(c.html,''),before.match(/<main\b[\s\S]*?<\/main>/)[0]);
  for(const tag of ['header','footer','script'])assert.equal(html.match(new RegExp('<'+tag+'\\b[\\s\\S]*?</'+tag+'>'))[0],before.match(new RegExp('<'+tag+'\\b[\\s\\S]*?</'+tag+'>'))[0]);
  assert.equal((html.match(/<h1\b/g)||[]).length,1);
  assert.equal((html.match(/rel="canonical"/g)||[]).length,1);
 });
}
test('wrong or unrelated documents are unchanged',()=>{const c=PRACTICAL_GUIDES['/mounjaro'],html=shell(c);for(const p of ['/','/start-here','/member/dashboard','/wegovy','/mounjaro-other'])assert.equal(improvePracticalGuides(html,p),html);assert.equal(improvePracticalGuides(html.replace(c.h1,'Wrong article'),'/mounjaro'),html.replace(c.h1,'Wrong article'));});
test('response transform strips stale validators; HEAD has no body; errors and POST pass through',async()=>{
 const p='/guides/mounjaro-ultimate-uk-guide',c=PRACTICAL_GUIDES[p],headers={'content-type':'text/html','content-length':'10',etag:'stale','last-modified':'old'};
 const r=await withPublicSeoCloseout(new Response(shell(c),{headers}),new Request('https://shiftsometimber.co.uk'+p));assert((await r.text()).includes(c.html));assert.equal(r.headers.get('etag'),null);assert.equal(r.headers.get('content-length'),null);
 const head=await withPublicSeoCloseout(new Response(shell(c),{headers}),new Request('https://shiftsometimber.co.uk'+p,{method:'HEAD'}));assert.equal(await head.text(),'');
 for(const [method,status] of [['POST',200],['GET',404],['GET',500]]){const original=new Response(shell(c),{status,headers}),out=await withPublicSeoCloseout(original,new Request('https://shiftsometimber.co.uk'+p,{method}));assert.equal(out,original);}
});
test('prescriber review timing and urgent stop instruction remain explicit',()=>{const h=PRACTICAL_GUIDES['/mounjaro'].html;assert(h.includes('stop using Mounjaro and seek urgent medical help'));assert(h.includes('six months at the highest dose the person can tolerate'));assert(h.includes('not a rule to stop by yourself'));assert(!/guaranteed|buy now|discount/i.test(h));});
