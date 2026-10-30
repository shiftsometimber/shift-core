import test from 'node:test';
import assert from 'node:assert/strict';
import {guides,topics,answers,sources,existing} from './content.mjs';
import {renderKnowledgeHub,renderGuide,renderFertility,improveExisting,knowledgeSitemap,ASSET} from './render.mjs';
import {withHealthKnowledgeWorker} from './production.mjs';
import {healthKnowledgeAnswer,healthKnowledgeEvidence} from './evidence.mjs';
import {askTimberRoutes} from '../ask-timber-v1.js';
import vm from 'node:vm';
import {client} from './client.mjs';
import {readFileSync} from 'node:fs';

const origin='https://shiftsometimber.co.uk';
const retained=Array.from({length:45},(_,i)=>'<article class="article" data-item><small>weight</small><h3>Existing guide '+i+'</h3><p>Retained text '+i+'</p><a href="/articles/existing-'+i+'">Read the full guide →</a></article>').join('');
const shell='<!doctype html><html lang="en-GB"><head><title>Original</title><meta name="description" content="original"><link rel="canonical" href="'+origin+'/knowledge"><script type="application/ld+json">{"old":true}</script></head><body><header id="kept-header">Retain current header</header><main><h1>Original title</h1>'+retained+'</main><footer id="kept-footer">Retain current footer</footer></body></html>';
const request=(path,options={})=>new Request(origin+path,options);
const backend={async fetch(r){const path=new URL(r.url).pathname;if(path==='/sitemap.xml')return new Response('<urlset><url><loc>'+origin+'/existing</loc></url></urlset>',{headers:{'content-type':'application/xml','etag':'old'}});return new Response(shell,{headers:{'content-type':'text/html; charset=utf-8','etag':'old','content-length':'2','content-security-policy':"default-src 'self'"}});}};

test('all fifty planned topics have an article route, answer and linked source evidence',()=>{
 assert.equal(topics.length,6);assert.equal(guides.length,42);assert.equal(answers.length,50);
 assert.equal(new Set(guides.map(g=>g.path)).size,42);
 const all=[...guides,...existing],ids=new Set(sources.map(s=>s.id));
 const roadmap=JSON.parse(readFileSync(new URL('./roadmap.json',import.meta.url),'utf8'));
 assert.equal(all.length,50);assert.equal(new Set(all.map(g=>g.id)).size,50);
 assert.deepEqual([...answers.map(a=>a.id)].sort(),roadmap.map(r=>r.id).sort());
 assert(roadmap.every(r=>r.path&&r.question&&r.coverage!=='backlog'));
 for(const t of topics)assert(answers.filter(a=>all.find(g=>g.id===a.id)?.topic===t.id).length>=8,t.id);
 for(const a of answers){assert(all.some(g=>g.path===a.path));assert(a.sources.every(id=>ids.has(id)));}
 for(const g of guides){assert(g.sections.length>=5);assert(g.sources.length);assert(g.answerSources.every(id=>ids.has(id)));assert(g.related.every(id=>all.some(a=>a.id===id)));assert(g.sections.every(s=>s[2].every(id=>ids.has(id))));const words=[g.answer,...g.sections.map(s=>s[1])].join(' ').split(/\s+/).length;assert(words>=300,g.id+' '+words);}
});
test('Knowledge retains every existing guide and adds six real topic sections with one canonical document',()=>{
 const html=renderKnowledgeHub(shell);assert(html);
 for(let i=0;i<45;i++){assert(html.includes('Retained text '+i));assert(html.includes('href="/articles/existing-'+i+'"'));}
 for(const t of topics)assert(html.includes('id="'+t.id+'"'));
 assert.equal((html.match(/<h1\b/g)||[]).length,1);assert.equal((html.match(/rel="canonical"/g)||[]).length,1);
 assert.equal((html.match(/data-kh-card/g)||[]).length,45+guides.length+existing.length);
 assert(html.includes('<header id="kept-header">'));assert(html.includes('<footer id="kept-footer">'));
 assert.equal(renderKnowledgeHub(html),html);assert.equal(renderKnowledgeHub('<html><main>Changed template without cards</main></html>'),null);
});
test('all new guides render accessible headings, current source links, Article metadata and no invented clinical review',()=>{
 for(const g of guides){const html=renderGuide(shell,g.path);assert(html);assert.equal((html.match(/<h1\b/g)||[]).length,1);assert(html.includes('"@type":"Article"'));assert(html.includes('href="'+origin+g.path+'"'));assert(html.includes('has not been reviewed by a clinician'));assert(!html.includes('reviewedBy'));assert(html.includes('href="/ask-timber?q='));for(const id of g.sources)assert(html.includes(sources.find(s=>s.id===id).url));}
 assert.equal(renderGuide(shell,'/guides/unknown'),null);
});
test('fertility has its own start and only the fertility shortcut is changed',()=>{
 const html=renderFertility(shell);for(const id of ['D01','D02','T02'])assert(html.includes(guides.find(g=>g.id===id).path));
 const health=shell.replace('</main>','<a href="/shift-health/trt-explained">↗︎Fertility</a><a href="/shift-health/trt-explained">TRT explained</a></main>');
 const out=improveExisting(health,'/shift-health');assert.match(out,/href="\/shift-health\/fertility">↗︎Fertility/);assert.match(out,/href="\/shift-health\/trt-explained">TRT explained/);assert.equal(improveExisting(out,'/shift-health'),out);
});
test('FAQs and Ask topic additions are idempotent and preserve the original forms',()=>{
 for(const path of ['/faq','/ask-timber']){const original=shell.replace('</main>','<form id="keep-form"><input name="original"></form></main>'),html=improveExisting(original,path);assert(html.includes('<form id="keep-form">'));assert.equal((html.match(/<h1\b/g)||[]).length,1);assert.equal(improveExisting(html,path),html);}
 const faq=improveExisting(shell,'/faq');assert.equal((faq.match(/data-kh-faq>/g)||[]).length,50);assert(faq.includes('data-kh-faq-search'));assert.equal((faq.match(/data-kh-faq-group/g)||[]).length,6);
 const ask=improveExisting(shell,'/ask-timber');assert.equal((ask.match(/data-timber-prompt=/g)||[]).length,6);
});
test('sitemap adds each new guide and fertility exactly once while preserving existing entries',()=>{
 const before='<urlset><url><loc>'+origin+'/existing</loc><lastmod>2026-01-01</lastmod></url></urlset>',after=knowledgeSitemap(before);assert(after.includes('<lastmod>2026-01-01</lastmod>'));assert.equal((after.match(/<loc>/g)||[]).length,44);assert.equal(knowledgeSitemap(after),after);
});
test('wrapper limits changes to public read routes, preserving home, auth, commerce and API requests',async()=>{
 const calls=[];const original=new Response('unchanged',{status:201,headers:{'x-original':'yes'}}),worker=withHealthKnowledgeWorker({async fetch(r){calls.push(r);return original}});
 for(const path of ['/','/member/dashboard','/checkout','/v1/profile','/guides/unknown']){const req=request(path);assert.equal(await worker.fetch(req,{},{}),original);assert.equal(calls.at(-1),req);}
 assert.equal(await worker.fetch(new Request('https://api.shiftsometimber.co.uk/knowledge'),{},{}),original);
 assert.equal(await worker.fetch(request('/knowledge',{method:'POST',body:'unchanged'}),{},{}),original);
});
test('GET and HEAD agree, stale validators are removed, security headers survive and assets are served',async()=>{
 const worker=withHealthKnowledgeWorker(backend);
 for(const path of ['/knowledge','/faq','/ask-timber','/shift-health/fertility',guides[0].path,'/sitemap.xml']){
  const get=await worker.fetch(request(path),{},{}),head=await worker.fetch(request(path,{method:'HEAD',headers:{'if-none-match':'old'}}),{},{});
  assert.equal(get.status,200,path);assert.equal(head.status,200,path);assert.equal(await head.text(),'');assert.equal(get.headers.get('etag'),null);assert.equal(head.headers.get('etag'),null);assert.equal(get.headers.get('content-length'),null);assert.equal(head.headers.get('x-shift-health-knowledge'),get.headers.get('x-shift-health-knowledge'));
  if(path!=='/sitemap.xml')assert.equal(get.headers.get('content-security-policy'),"default-src 'self'");
 }
 const asset=await worker.fetch(request(ASSET),{},{});assert.equal(asset.status,200);assert.match(asset.headers.get('content-type'),/javascript/);
});
test('a failed shell is not falsely presented as a successful guide',async()=>{
 const worker=withHealthKnowledgeWorker({async fetch(){return new Response('Unavailable',{status:503});}});assert.equal((await worker.fetch(request(guides[0].path),{},{})).status,503);
});
test('fertility can obtain the shared public layout across its existing Worker boundary',async()=>{
 const seen=[],worker=withHealthKnowledgeWorker({async fetch(){return new Response('Not owned here',{status:404});}});
 const env={SHIFT_KNOWLEDGE_SHELL:{async fetch(r){seen.push(new URL(r.url).pathname);return new Response(shell,{headers:{'content-type':'text/html; charset=utf-8'}});}}};
 const result=await worker.fetch(request('/shift-health/fertility'),env,{});
 assert.equal(result.status,200);assert.deepEqual(seen,['/knowledge']);assert((await result.text()).includes('Thinking about a family?'));
});
test('fifty concise answers share their source data and do not hijack mixed or dosing questions',()=>{
 for(const a of answers){const result=healthKnowledgeAnswer(a.question);assert(result,a.id);assert(result.sources.length);assert.equal(result.journeyUsed,false);assert.deepEqual(result.keyPoints,[]);assert.deepEqual(result.nextSteps,[]);assert.deepEqual(result.followUps,[]);assert.match(result.answer,/\[1\]/);assert(result.answer.includes(origin+a.path));assert(result.sources.every(s=>s.reviewState==='source_checked'));}
 for(const q of ['What dose of TRT should I inject?','Does TRT affect fertility and should I stop my dose?','What is my saved goal?','Can I have a kebab?','What is the latest retatrutide approval?'])assert.equal(healthKnowledgeAnswer(q),null,q);
});
test('source retrieval recognises all six areas and keeps unrelated questions out',()=>{
 for(const q of ['TRT and having children','bloods and cholesterol','home laboratory testing','sperm test','sleep study','creatine supplements'])assert(healthKnowledgeEvidence(q).length,q);
 assert.deepEqual(healthKnowledgeEvidence('Can I have a kebab?'),[]);
 const fatigue=healthKnowledgeEvidence('I am always shattered');assert(fatigue.some(e=>e.id==='health:T01'));assert(fatigue.every(e=>e.reviewState==='source_checked'));assert(!fatigue.some(e=>e.id==='health:T02'));
});
test('new topics retrieve specific evidence for ordinary wording, with useful deeper passages',()=>{
 const examples=[
  ['T05','I am changing TRT provider and need my monitoring records'],
  ['T08','My libido is lower and erections have changed'],
  ['B03','How is an HbA1c different from blood glucose'],
  ['B05','What is ferritin and can inflammation affect it'],
  ['B06','What does TSH measure in thyroid testing'],
  ['B07','I want to understand creatinine in a kidney blood test'],
  ['B08','Are B12 blood levels useful when assessing deficiency'],
  ['C03','Can a home kit give a false negative result'],
  ['C04','How do I prepare my blood sample for posting'],
  ['C05','How do venous and finger prick collection compare'],
  ['C06','Does a negative FIT rule out a bowel problem'],
  ['C07','Is urine albumin the same as ACR'],
  ['C08','The control result on this test is invalid'],
  ['D03','What does sperm motility and morphology mean'],
  ['D04','Could a fertility diet guarantee pregnancy'],
  ['D05','Can my prescribed medicine affect fertility'],
  ['D06','Can a home test give vasectomy clearance'],
  ['D07','How might anabolic steroids in the past affect sperm'],
  ['D08','Fertility worries are putting stress on our relationship'],
  ['E03','What is CBT-I for insomnia'],
  ['E04','I work rotating night shifts and cannot sleep well'],
  ['E05','Is caffeine late at night affecting my sleep'],
  ['E06','My CPAP mask leaks and I want to cover the vents'],
  ['E07','Can I trust my sleep tracker stages and score'],
  ['E08','I am drowsy on the drive to work'],
  ['F04','Is creatine useful for strength exercise'],
  ['F05','What is the NHS advice about vitamin D in winter'],
  ['F06','I feel tired so should I take iron tablets'],
  ['F07','Are electrolyte powders needed for hydration'],
  ['F08','What evidence supports collagen claims for skin'],
  ['F09','Does magnesium glycinate help me stay asleep'],
  ['F10','Are testosterone booster supplements backed by studies']
 ];
 for(const [id,q]of examples){const result=healthKnowledgeEvidence(q);assert.equal(result[0]?.id,'health:'+id,q+' → '+result.map(e=>e.id));assert(result[0].provenance.some(p=>p.ref===origin+guides.find(g=>g.id===id).path));}
 const cpap=healthKnowledgeEvidence('My CPAP mask leaks and I want to cover the vents')[0];assert(cpap.content.includes('Do not block vents'));assert(cpap.provenance.some(p=>p.ref===sources.find(s=>s.id==='S49').url));
 for(const q of ['I want to get fit','Can I have a kebab?','What is my saved goal?'])assert.deepEqual(healthKnowledgeEvidence(q),[],q);
 for(const q of ['Can I drive if I am struggling to stay awake and should I change my CPAP pressure?','Should I take 40 mg of iron for my ferritin of 8?','Does magnesium work and what dose should I take?'])assert.equal(healthKnowledgeAnswer(q),null,q);
});
test('actual Ask route returns checked answers without model calls and retains origin and urgent handling',async()=>{
 const env={AI:{async run(){throw Error('Checked answer should not call model')}},DB:{prepare(){throw Error('Checked answer should not read private data')}}};
 const req=message=>request('/v1/ai/chat',{method:'POST',headers:{Origin:origin,'content-type':'application/json'},body:JSON.stringify({message,useJourney:false})});
 for(const message of answers.map(a=>a.question)){const response=await askTimberRoutes(req(message),env),data=await response.json();assert.equal(response.status,200,message);assert.equal(data.mode,'source_checked_health',message);assert.equal(data.journeyUsed,false);}
 const urgent=await(await askTimberRoutes(req('I have chest pain and want to ask about supplements'),{})).json();assert.equal(urgent.mode,'safety');assert.match(urgent.answer,/999/);
 const hostile=request('/v1/ai/chat',{method:'POST',headers:{Origin:'https://untrusted.invalid','content-type':'application/json'},body:JSON.stringify({message:'Does TRT affect fertility?'})});assert.equal((await askTimberRoutes(hostile,env)).status,403);
});

test('the shipped search client filters six areas, synonyms and empty results without network activity',()=>{
 const html=renderKnowledgeHub(shell),listeners={};
 const control=name=>({value:'',addEventListener(event,fn){listeners[name+':'+event]=fn;}});
 const search=control('search'),select=control('select'),count={textContent:''},empty={hidden:true};
 const cards=[...html.matchAll(/<article\b([^>]*)>([\s\S]*?)<\/article>/g)].map(([,attrs,body])=>({dataset:{khTopic:attrs.match(/data-kh-topic="([^"]+)"/)[1]},textContent:body.replace(/<[^>]+>/g,' '),hidden:false}));
 const groups=[...topics.map(t=>t.id),'existing'].map(id=>({hidden:false,querySelectorAll:()=>cards.filter(c=>c.dataset.khTopic===id)}));
 const root={querySelector:s=>({'[data-kh-search]':search,'[data-kh-select]':select,'[data-kh-count]':count,'[data-kh-empty]':empty}[s]),querySelectorAll:s=>s==='[data-kh-card]'?cards:groups};
 const document={querySelector:s=>s==='[data-shift-knowledge]'?root:null,getElementById:()=>null};
 vm.runInNewContext(client,{document,URLSearchParams,location:{search:''},Event});
 for(const topic of topics){select.value=topic.id;listeners['select:change']();assert(cards.filter(c=>!c.hidden).every(c=>c.dataset.khTopic===topic.id));assert(cards.some(c=>!c.hidden));}
 select.value='';for(const q of ['bloods','TRT','sperm','vitamins']){search.value=q;listeners['search:input']();assert(cards.some(c=>!c.hidden),q);assert.equal(empty.hidden,true);}
 search.value='no-such-guide-493';listeners['search:input']();assert.equal(cards.filter(c=>!c.hidden).length,0);assert.equal(empty.hidden,false);assert.equal(count.textContent,'0 guide links shown');
 search.value='';listeners['search:input']();assert.equal(cards.filter(c=>!c.hidden).length,cards.length);assert(groups.every(g=>!g.hidden));
});

test('the fifty-question FAQ search hides empty topic groups and restores the complete set',()=>{
 const html=improveExisting(shell,'/faq'),listeners={},search={value:'',addEventListener:(event,fn)=>{listeners[event]=fn;}},count={textContent:''};
 const groups=[...html.matchAll(/<section class="kh-section" data-kh-faq-group[^>]*>([\s\S]*?)<\/section>/g)].map(([,body])=>{
  const items=[...body.matchAll(/<details[^>]*data-kh-faq>([\s\S]*?)<\/details>/g)].map(([,text])=>({textContent:text.replace(/<[^>]+>/g,' '),hidden:false}));
  return {items,hidden:false,querySelectorAll:()=>items};
 });
 const items=groups.flatMap(g=>g.items);assert.equal(items.length,50);
 const document={getElementById:()=>null,querySelector:s=>({'[data-kh-faq-search]':search,'[data-kh-faq-count]':count}[s]||null),querySelectorAll:s=>s==='[data-kh-faq]'?items:groups};
 vm.runInNewContext(client,{document,URLSearchParams,location:{search:''},Event});
 search.value='CPAP';listeners.input();assert(items.some(i=>!i.hidden));assert(items.filter(i=>!i.hidden).every(i=>/cpap/i.test(i.textContent)));assert(groups.some(g=>g.hidden));
 search.value='no-question-493';listeners.input();assert(items.every(i=>i.hidden));assert(groups.every(g=>g.hidden));assert.equal(count.textContent,'0 questions shown');
 search.value='';listeners.input();assert(items.every(i=>!i.hidden));assert(groups.every(g=>!g.hidden));assert.equal(count.textContent,'50 questions shown');
});
