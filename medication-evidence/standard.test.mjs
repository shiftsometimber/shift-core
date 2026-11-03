import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {recipes} from './recipes.mjs';
import {registry} from './registry.mjs';
import {images} from './images.mjs';
import {transformMedicationDocument,withMedicationEvidence,medicationImage,updateMedicationSitemap,MEDICATION_RELEASE,UPDATED_PATHS,digest} from './transform.mjs';
const before=JSON.parse(readFileSync(new URL('./fixtures/before.json',import.meta.url),'utf8'));
const element=(s,tag)=>s.match(new RegExp('<'+tag+'\\b[\\s\\S]*?</'+tag+'>','i'))?.[0];
for(const [path,recipe] of Object.entries(recipes))test(path+' preserves the site shell, URL identity and existing anchors',async()=>{
 const original=before[path],out=await transformMedicationDocument(original,path);
 if(recipe.kind==='benchmark'){assert.equal(out.html,original);return;}
 assert.equal(out.state,'updated');assert.equal((out.html.match(/<main\b/gi)||[]).length,1);assert.equal((out.html.match(/<h1\b/gi)||[]).length,1);
 assert.equal(element(out.html,'header'),element(original,'header'));assert.equal(element(out.html,'footer'),element(original,'footer'));
 assert(out.html.includes('href="https://shiftsometimber.co.uk'+path+'"'));
 const originalIds=[...element(original,'main').matchAll(/\bid=["']([^"']+)/g)].map(x=>x[1]);
 const ids=[...element(out.html,'main').matchAll(/\bid=["']([^"']+)/g)].map(x=>x[1]);assert.equal(new Set(ids).size,ids.length,'Unique main ids');for(const id of originalIds)assert(ids.includes(id),'Retain existing anchor '+id);
 for(const [,id] of out.html.matchAll(/href="#(mm-[^"']+)"/g))assert(ids.includes(id),'Resolve visual source anchor '+id);
 for(const [,raw] of out.html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/g))JSON.parse(raw);
 assert(out.html.includes('data-mm-style="'+MEDICATION_RELEASE+'"'));
 assert.equal((out.html.match(/<script data-mm-controller-script>/g)||[]).length,1,'Every upgraded page must initialise its new controls');
 assert.equal((await transformMedicationDocument(out.html,path)).html,out.html,'Idempotent rendering');
 const publishedDates=s=>[...s.matchAll(/"datePublished"\s*:\s*"([^"]+)"/g)].map(x=>x[1]);assert.deepEqual(publishedDates(out.html),publishedDates(original),'Do not invent or advance original publication dates');
 const reviews=s=>[...s.matchAll(/"reviewedBy"\s*:\s*(\{[^}]+\}|"[^"]+")/g)].map(x=>x[1]);assert.deepEqual(reviews(out.html),reviews(original),'Do not invent a clinical reviewer');
 for(const source of recipe.sourceUrls)assert(out.html.includes(source));
});
test('registry and generated modules agree; every plot has a named source, population, duration and analysis',()=>{
 assert.deepEqual(registry,JSON.parse(readFileSync(new URL('./evidence.json',import.meta.url),'utf8')));
 assert.equal(Object.keys(registry.pages).length,30);assert.equal(UPDATED_PATHS.length,29);assert.equal(Object.keys(registry.studies).length,13);
 for(const st of Object.values(registry.studies)){assert(registry.sources[st.source]);assert(st.population);assert(st.analysis);assert(st.weeks>0);assert(st.measure);assert(st.note);assert(st.sponsor);for(const row of st.rows){assert(row.label);for(const n of [row.value].flat())assert(Number.isFinite(n));}}
 assert.equal(registry.approval.publicCopyApproved,false);assert.equal(registry.approval.independentClinicalReviewClaimed,false);
});
test('the awkward evidence distinctions remain explicit rather than becoming a league table',()=>{
 assert(recipes['/orlistat-definitive-uk-guide'].main.includes('share of participants'));
 assert(recipes['/guides/amycretin-uk-guide'].main.includes('+1.9%'));assert(recipes['/guides/amycretin-uk-guide'].main.includes('not the size of this comparison'));
 assert(recipes['/guides/maritide-uk-guide'].main.includes('12.3–16.2%'));assert(recipes['/guides/maritide-uk-guide'].main.includes('not a confidence interval'));
 const foundayo=recipes['/foundayo'].main;assert(foundayo.includes('11.2%'));assert(foundayo.includes('12.4%'));assert(!foundayo.includes('In the intention-to-treat results reported in the UK product information'));
 assert(recipes['/comparisons/medications/wegovy-vs-saxenda'].main.includes('15.8%'));assert(recipes['/comparisons/medications/wegovy-vs-saxenda'].main.includes('6.4%'));
 assert(!recipes['/future-medicines-comparison'].main.includes('FIFA'));assert(!recipes['/medication-comparison-centre'].main.includes('Relative efficacy'));
 assert.notEqual(recipes['/compare-weight-loss-treatments'].main,recipes['/medication-comparison-centre'].main);
});
test('a changed clinical baseline is left untouched for fresh review',async()=>{
 const path='/mounjaro',changed=before[path].replace('<h1>Mounjaro for men: the full UK picture</h1>','<h1>Mounjaro: newer clinical copy</h1>');assert.notEqual(changed,before[path]);
 const out=await transformMedicationDocument(changed,path);assert.equal(out.state,'baseline-changed');assert.equal(out.html,changed);
});
test('private routes, POST, external hosts and unrelated public pages are passed through without reading request bodies',async()=>{
 const calls=[];const response=new Response('private',{headers:{'Cache-Control':'no-store'}});const wrapped=withMedicationEvidence({fetch(request){calls.push(request);return response}});
 for(const [url,method] of [['https://shiftsometimber.co.uk/member/dashboard','GET'],['https://shiftsometimber.co.uk/v1/member-state','GET'],['https://shiftsometimber.co.uk/checkout','GET'],['https://shiftsometimber.co.uk/admin','GET'],['https://shiftsometimber.co.uk/mounjaro','POST'],['https://example.com/mounjaro','GET'],['https://shiftsometimber.co.uk/recipes','GET'],['https://shiftsometimber.co.uk/mounjaro','HEAD']]){
  const request=new Request(url,{method});assert.equal(await wrapped.fetch(request),response);assert.equal(calls.at(-1),request);
 }
});
test('public rendering keeps status, headers and safety text without retaining stale body validators',async()=>{
 const wrapped=withMedicationEvidence({fetch(){return new Response(before['/mounjaro'],{headers:{'Content-Type':'text/html','Content-Length':'123','ETag':'old','Cache-Control':'private,no-store'}})}});
 const response=await wrapped.fetch(new Request('https://shiftsometimber.co.uk/mounjaro'));assert.equal(response.status,200);assert.equal(response.headers.get('X-Shift-Medicine-Evidence'),MEDICATION_RELEASE);assert.equal(response.headers.get('ETag'),null);assert.equal(response.headers.get('Content-Length'),null);assert.equal(response.headers.get('Cache-Control'),'private,no-store');assert((await response.text()).includes('Severe, persistent abdominal pain'));
});
test('only substantively updated public owners receive a sitemap date',()=>{
 const sample='<urlset>'+Object.keys(recipes).concat('/member/dashboard','/unrelated').map(p=>'<url><loc>https://shiftsometimber.co.uk'+p+'</loc><lastmod>2026-10-01</lastmod></url>').join('')+'</urlset>';
 const out=updateMedicationSitemap(sample);assert.equal((out.match(/2026-11-03/g)||[]).length,29);assert(out.includes('/guides/retatrutide-uk-guide</loc><lastmod>2026-10-01'));
 assert(out.includes('/unrelated</loc><lastmod>2026-10-01'));assert.equal(updateMedicationSitemap(out),out);
});
test('all 29 original sharing images are valid PNGs with correct dimensions, hashes and cache semantics',async()=>{
 assert.equal(Object.keys(images).length,29);
 for(const [path,image] of Object.entries(images)){
  const request=new Request('https://shiftsometimber.co.uk'+path),response=medicationImage(request);const bytes=new Uint8Array(await response.arrayBuffer());assert.deepEqual([...bytes.slice(0,8)],[137,80,78,71,13,10,26,10]);const data=new DataView(bytes.buffer);assert.equal(data.getUint32(16),1200);assert.equal(data.getUint32(20),630);
  const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(x=>x.toString(16).padStart(2,'0')).join('');assert.equal(hash,image.sha256);
  assert.equal(medicationImage(new Request(request,{method:'HEAD'})).body,null);assert.equal(medicationImage(new Request(request,{headers:{'If-None-Match':'"'+hash+'"'}})).status,304);assert.equal(medicationImage(new Request(request,{method:'POST'})),null);
 }
});
test('switching study views changes the selected whole panel, so figures and captions cannot diverge',()=>{
 const html=recipes['/wegovy'].main,script=html.match(/<script data-mm-controller-script>([\s\S]*?)<\/script>/)[1];
 const panels=['step1','oasis4'].map(id=>({dataset:{mmPanel:id},hidden:id!=='step1'}));
 const controls=panels.map(p=>({dataset:{mmSwitch:p.dataset.mmPanel},pressed:p.dataset.mmPanel==='step1',setAttribute(name,value){assert.equal(name,'aria-pressed');this.pressed=value==='true'},addEventListener(type,fn){assert.equal(type,'click');this.click=fn}}));
 const group={querySelectorAll(s){return s==='[data-mm-switch]'?controls:panels}},root={dataset:{},querySelectorAll(s){return s==='[data-mm-study-group]'?[group]:[]},querySelector(){return null}};
 runInNewContext(script,{document:{querySelectorAll(){return [root]}}});controls[1].click();assert.equal(panels[1].hidden,false);assert.equal(panels[0].hidden,true);assert.equal(controls[1].pressed,true);controls[0].click();assert.equal(panels[0].hidden,false);assert.equal(panels[1].hidden,true);
 assert(!/fetch\(|localStorage|sessionStorage|sendBeacon|indexedDB/.test(script),'No health preference is sent or persisted by the new controller');
});
test('metadata handles apostrophes without creating broken attributes',async()=>{
 const s=before['/mounjaro'].replace(/(<meta\b[^>]*name="description"[^>]*content=")[^"]*(")/i,'$1Men\'s information$2');const out=await transformMedicationDocument(s,'/mounjaro');assert.equal(out.state,'updated');assert(!out.html.includes('Men\'s information'));assert(out.html.includes('UK: Evidence, Safety and Access'));
});
test('both comparison pickers initialise, select the right cards and expose duplicate selection',()=>{
 for(const path of ['/medication-comparison-centre','/future-medicines-comparison']){
  const script=recipes[path].main.match(/<script data-mm-controller-script>([\s\S]*?)<\/script>/)[1];
  const selects=['mounjaro','wegovy-injection'].map(value=>({value,addEventListener(type,fn){assert.equal(type,'change');this.change=fn}}));
  const cards=selects.map(()=>['mounjaro','wegovy-injection','foundayo'].map(id=>({dataset:{mmMed:id},hidden:true})));
  const sides=selects.map((select,i)=>({querySelector(){return select},querySelectorAll(){return cards[i]}}));const same={hidden:true};
  const root={dataset:{},querySelectorAll(s){return s==='[data-mm-side]'?sides:s==='[data-mm-select]'?selects:[]},querySelector(){return same}};
  runInNewContext(script,{document:{querySelectorAll(){return [root]}}});assert(root.dataset.mmBound);assert.equal(same.hidden,true);
  selects[0].value='foundayo';selects[0].change();assert.deepEqual(cards[0].filter(c=>!c.hidden).map(c=>c.dataset.mmMed),['foundayo']);selects[1].value='foundayo';selects[1].change();assert.equal(same.hidden,false);
 }
});
