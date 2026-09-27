import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {askTimberRoutes} from '../ask-timber-v1.js';
import {retrieveUnifiedKnowledge} from '../shift-brain-v1.js';
const QUESTION='I need to loose weight fast. Help me';
const source=readFileSync(new URL('../frontend/member/assets/ask-timber-v1.js',import.meta.url),'utf8');
const adapter=readFileSync(new URL('../frontend/member/api-adapter-v33d.js',import.meta.url),'utf8');
const survey={id:1,document_id:1,title:'Psychiatric survey',content:'The survey helps describe need. These are not live figures.',source_uri:'https://example.test/survey',trust_tier:1,status:'approved'};
const weight={id:2,document_id:2,title:'Weight loss basics',content:'Reviewed weight loss information. Read the full guide for its context.',source_uri:'https://example.test/weight',trust_tier:2,status:'approved'};
function database({legacy=[survey,weight],graph=[]}={}){
 const reads=[];return{reads,prepare(sql){reads.push(sql);assert.match(sql,/^SELECT\b/);const result=sql.includes('FROM ai_knowledge_chunks')?legacy:sql.includes('FROM shift_knowledge_nodes')?graph:[];const st={bind:()=>st,all:async()=>({results:result}),first:async()=>null};return st;}};
}
function client(fetch){
 const nodes=Object.fromEntries(['timberForm','timberQuestion','timberResponse','timberSubmit','timberCount'].map(id=>[id,{value:'',hidden:true,innerHTML:'',listeners:{},addEventListener(event,handler){this.listeners[event]=handler},scrollIntoView(){},querySelectorAll(){return[]},focus(){}}]));
 const window={SST_API_BASE:'https://api.shiftsometimber.co.uk'};
 const context={window,document:{getElementById:id=>nodes[id],querySelectorAll:()=>[]},fetch,TypeError,Headers,AbortController,setTimeout,clearTimeout};
 vm.runInNewContext(adapter,context);vm.runInNewContext(source,context);
 return{nodes,window,submit:async()=>nodes.timberForm.listeners.submit({preventDefault(){}})};
}
test('reported public question traverses real adapter and route without private reads for absent or stale cookies',async()=>{
 for(const cookie of [null,'sst_session=expired','sst_session=revoked']){
  const DB=database(),calls=[];const env={DB,AI:{run:async()=>{throw Error('synthetic provider failure')}}};
  const c=client(async(url,options)=>{const body=JSON.parse(options.body);calls.push(body);const headers=new Headers(options.headers);headers.set('Origin','https://shiftsometimber.co.uk');if(cookie)headers.set('Cookie',cookie);return askTimberRoutes(new Request(url,{...options,headers}),env)});
  c.nodes.timberQuestion.value=QUESTION;await c.submit();
  assert.equal(calls[0].useJourney,false);assert.match(c.nodes.timberResponse.innerHTML,/one manageable change today/);assert.doesNotMatch(c.nodes.timberResponse.innerHTML,/Psychiatric|survey|401/);assert.equal(c.nodes.timberSubmit.disabled,false);assert(!DB.reads.some(sql=>/user_sessions|member_state|consents|check_ins/.test(sql)));
 }
});
test('existing member callers retain private context and anonymous requests are still refused',async()=>{
 const DB=database();const c=client((url,options)=>askTimberRoutes(new Request(url,{...options,headers:{...options.headers,Origin:'https://shiftsometimber.co.uk','Content-Type':'application/json'}}),{DB,AI:{run:async()=>{throw Error('must not generate')}}}));
 await assert.rejects(c.window.SST_API.askShiftAI({message:QUESTION}),e=>e.status===401&&e.code==='authentication_required');
});
test('unrelated authority, filler words, substring and metadata matches cannot become an answer',async()=>{
 const DB=database({legacy:[survey,{...survey,id:3,title:'Network',content:'A weightless particle and fastidious preparation.'}],graph:[{id:'metadata-only',label:'Unrelated topic',domain:'health',data_json:JSON.stringify({summary:'An unrelated survey.',tags:['weight','fast']}),authority:100,verified_at:'2026-09-01'}]});
 assert.deepEqual(await retrieveUnifiedKnowledge(DB,QUESTION),[]);
 const response=await askTimberRoutes(new Request('https://shiftsometimber.co.uk/v1/ai/chat',{method:'POST',body:JSON.stringify({message:'Explain fast weight loss evidence',useJourney:false})}),{DB,AI:{run:async()=>{throw Error('must not generate')}}});
 const data=await response.json();assert.equal(response.status,200);assert.equal(data.confidence,'low');assert.deepEqual(data.sources,[]);assert.match(data.answer,/reliable answer/);
});
test('actual mental-health evidence remains retrievable when it is the question topic',async()=>{
 const items=await retrieveUnifiedKnowledge(database(),'What does the psychiatric survey say?');assert.equal(items[0].title,'Psychiatric survey');
});
test('public errors suppress internal messages, preserve input and support a successful retry',async()=>{
 for(const status of [401,403,429,500,503]){
  let calls=0;const c=client(async()=>++calls===1?new Response(JSON.stringify({error:'internal_failure',message:'PRIVATE_INTERNAL_DETAIL <script>attack</script>'}),{status,headers:{'Content-Type':'application/json'}}):Response.json({ok:true,answer:'Recovered answer',confidence:'low'}));
  c.nodes.timberQuestion.value=QUESTION;await c.submit();assert.equal(c.nodes.timberQuestion.value,QUESTION);assert.equal(c.nodes.timberSubmit.disabled,false);assert.match(c.nodes.timberResponse.innerHTML,/temporarily unavailable/);assert.doesNotMatch(c.nodes.timberResponse.innerHTML,/PRIVATE_INTERNAL|attack|Shift Core|401/);await c.submit();assert.match(c.nodes.timberResponse.innerHTML,/Recovered answer/);
 }
});
test('network failure keeps a useful message and retry works',async()=>{
 let first=true;const c=client(async()=>{if(first){first=false;throw new TypeError('fetch failed')}return Response.json({ok:true,answer:'Recovered answer'})});c.nodes.timberQuestion.value=QUESTION;await c.submit();assert.match(c.nodes.timberResponse.innerHTML,/Check your connection/);await c.submit();assert.match(c.nodes.timberResponse.innerHTML,/Recovered answer/);
});

test('general starter questions use a checked how-to source rather than news, without dropping specific clinical questions',async()=>{
 for(const message of ['I need to loose weight fast. Help me','How can I lose weight?','I want to lose some weight','Where do I start with weight loss?']){
  const DB=database({legacy:[survey]}),AI={run:async()=>{throw Error('starter should not generate')}};
  const data=await(await askTimberRoutes(new Request('https://shiftsometimber.co.uk/v1/ai/chat',{method:'POST',body:JSON.stringify({message,useJourney:false})}),{DB,AI})).json();
  assert.equal(data.mode,'reviewed_direct');assert.equal(data.sources[0].url,'https://www.nhs.uk/live-well/healthy-weight/managing-your-weight/tips-to-help-you-lose-weight/');assert.match(data.answer,/0.5–1 kg/);assert.equal(DB.reads.length,0);
 }
 for(const message of ['I need to lose weight and have severe chest pain','I want to lose weight with Mounjaro','Why am I losing weight without trying?','I am 15 and want to lose weight','I want to lose weight but I have an eating disorder']){
  const data=await(await askTimberRoutes(new Request('https://shiftsometimber.co.uk/v1/ai/chat',{method:'POST',body:JSON.stringify({message,useJourney:false})}),{DB:database({legacy:[]}),AI:{run:async()=>{throw Error('synthetic failure')}}})).json();
  assert.doesNotMatch(data.answer,/one manageable change today/);
 }
});

test('forgotten password is a high-contrast action immediately after password on the authoritative shared sign-in shell',()=>{
 const html=readFileSync(new URL('../frontend/member/my-timber-preview.html',import.meta.url),'utf8');
 assert.match(html,/<label>Password[\s\S]*?<\/label>\s*<button[^>]*data-forgot-password>Forgotten your password\?<\/button>\s*<label class="remember-choice">/);
 assert.match(html,/\.preview-auth \.auth-link\{[^}]*background:#e7e3da!important;color:#050505!important/);
 assert.match(html,/\.auth-link:focus-visible/);
 assert.match(html,/data-forgot-password[^\n]+addEventListener\('click',\(\)=>\{resetForm.hidden=false;form.hidden=true/);
});

test('consecutive food questions render only the current service answer, even with a stale intent helper',async()=>{
 const replies=['Reviewed takeaway information.','Which injection do you mean? I cannot confirm chocolate advice without knowing that.','A short walk can be a manageable starting point.'];let index=0;
 const c=client(async()=>Response.json({ok:true,answer:replies[index++],keyPoints:[],nextSteps:[],sources:[],confidence:'low'}));
 c.window.AskTimberIntent={detect:()=>['food'],complete:()=>({ok:true,answer:'If you want the kebab, have the kebab.'})};
 for(const [i,q]of ['Can I have a kebab?','Can I eat chocolate after a jab?','How do I start walking?'].entries()){
  c.nodes.timberQuestion.value=q;await c.submit();assert.match(c.nodes.timberResponse.innerHTML,new RegExp(replies[i].replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));assert.doesNotMatch(c.nodes.timberResponse.innerHTML,/have the kebab|chicken shish|Order the kebab/);
 }
});
test('intent diagnostics never add unreviewed food advice or claim missing coverage is complete',()=>{
 const context=vm.createContext({});vm.runInContext(readFileSync(new URL('../frontend/member/assets/ask-timber-intent-v2.js',import.meta.url),'utf8'),context);
 for(const q of ['Can I have a kebab?','Can I eat chocolate after a jab?','Can I eat pizza?','What about breakfast?']){
  const original={ok:true,mode:'grounded',answer:'I cannot reliably answer this yet.',keyPoints:[],nextSteps:[],sources:[],limitations:'No relevant reviewed source.'};
  const result=context.AskTimberIntent.complete(q,original);assert.equal(result.answer,original.answer);assert.equal(JSON.stringify(result.keyPoints),'[]');assert.equal(JSON.stringify(result.nextSteps),'[]');assert.equal(result.intentCoverage.complete,false);assert.equal(context.AskTimberIntent.foodAddendum(q),null);
 }
});

test('food after an unidentified injection asks which injection without assuming treatment or reusing history',async()=>{
 for(const message of ['Can I eat chocolate after a jab?','Can I have chocolate after my injection?','Can I have a takeaway after a jab?']){
  const DB=database(),response=await askTimberRoutes(new Request('https://shiftsometimber.co.uk/v1/ai/chat',{method:'POST',body:JSON.stringify({message,useJourney:false,history:[{role:'user',content:'Can I have a kebab?'},{role:'assistant',content:'Have a kebab.'}]})}),{DB,AI:{run:async()=>{throw Error('must clarify before generation')}}});
  const data=await response.json();assert.equal(data.mode,'clarification');assert.match(data.answer,/Which jab/);assert.doesNotMatch(data.answer,/kebab|safe|chicken shish/);assert.equal(DB.reads.length,0);
 }
});
test('named Mounjaro food question supplies relevant primary evidence and anchors the current question',async()=>{
 let prompt;
 const response=await askTimberRoutes(new Request('https://shiftsometimber.co.uk/v1/ai/chat',{method:'POST',body:JSON.stringify({message:'Can I eat chocolate after Mounjaro?',useJourney:false})}),{DB:database({legacy:[]}),AI:{run:async(_,input)=>{prompt=input.messages;return{response:{answer:'Food guidance [1]',confidence:'medium'}}}}});
 const data=await response.json();assert.match(prompt.at(-1).content,/QUESTION:\nCan I eat chocolate after Mounjaro\?/);assert.match(prompt.at(-1).content,/with or without food/);assert.match(prompt[0].content,/Answer the current QUESTION/);assert.equal(data.sources[0].url,'https://www.cuh.nhs.uk/patient-information/your-obesity-treatment-tirzepatide-mounjaro/');
});
