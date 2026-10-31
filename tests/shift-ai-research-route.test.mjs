import test from 'node:test';
import assert from 'node:assert/strict';
import {askTimberRoutes} from '../ask-timber-v1.js';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const request=(body,origin='https://shiftsometimber.co.uk')=>new Request('https://shiftsometimber.co.uk/v1/ai/chat',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json',Cookie:'sst_session=PRIVATE_SESSION'},body:JSON.stringify(body)});
test('research uses the existing Ask Timber route without private journey, model or conversation access',async()=>{
 const env={AI:{run(){throw Error('research must not generate')}},DB:{exec(){throw Error('index unavailable')},prepare(){throw Error('must not read member data')}}};
 const data=await(await askTimberRoutes(request({message:'Show research about testosterone; my result is 7.2',research:true,useJourney:true}),env)).json();
 assert.equal(data.mode,'research');assert.equal(data.journeyUsed,false);assert(data.sources.length);assert(!JSON.stringify(data).includes('7.2'));assert.match(data.limitations,/not clinically approved/);
});
test('urgent signposting and truthful human handoff still precede research',async()=>{
 for(const [message,mode]of [['I have severe chest pain. Find research about weight loss','safety'],['Can you contact Matt about testosterone research?','human_handoff']]){
  const data=await(await askTimberRoutes(request({message,research:true}),{})).json();assert.equal(data.mode,mode);assert.equal(data.research,undefined);
 }
});
test('research keeps the same origin boundary and explicit opt-in',async()=>{
 assert.equal((await askTimberRoutes(request({message:'protein research',research:true},'https://evil.invalid'),{})).status,403);
 assert.equal((await askTimberRoutes(request({message:'protein research'}),{})).status,503);
 const data=await(await askTimberRoutes(request({message:'protein research',research:true}),{})).json();assert.equal(data.mode,'research');assert.equal(data.sources[0].url.includes('nhs.uk'),true);
});
function client(fetch){
 const nodes=Object.fromEntries(['timberForm','timberQuestion','timberResponse','timberSubmit','timberCount'].map(id=>[id,{value:'',hidden:true,innerHTML:'',listeners:{},addEventListener(event,handler){this.listeners[event]=handler},scrollIntoView(){},querySelectorAll(){return[]},focus(){}}]));
 const choice={checked:true},type={value:'review'};
 nodes.timberForm.insertAdjacentHTML=(_where,html)=>{nodes.timberForm.controlsHTML=html};
 nodes.timberForm.querySelector=selector=>selector==='[data-timber-research]'?choice:type;
 const window={SST_API_BASE:'https://api.shiftsometimber.co.uk'};
 const context={window,document:{getElementById:id=>nodes[id],querySelectorAll:()=>[]},fetch,URL,TypeError,Headers,AbortController,setTimeout,clearTimeout};
 vm.runInNewContext(readFileSync(new URL('../frontend/member/api-adapter-v33d.js',import.meta.url),'utf8'),context);
 vm.runInNewContext(readFileSync(new URL('../frontend/member/assets/ask-timber-v1.js',import.meta.url),'utf8'),context);
 return {nodes,choice,submit:()=>nodes.timberForm.listeners.submit({preventDefault(){}})};
}
test('served form, existing adapter and real research route preserve the opt-out and source links',async()=>{
 let sent;const c=client(async(url,options)=>{sent=JSON.parse(options.body);return askTimberRoutes(new Request(url,{...options,headers:{...options.headers,Origin:'https://shiftsometimber.co.uk'}}),{})});
 c.nodes.timberQuestion.value='Find research about protein';await c.submit();
 assert.equal(sent.research,true);assert.equal(sent.researchType,'review');assert.equal(sent.useJourney,false);assert.equal(sent.personalisation,false);assert.deepEqual(sent.history,[]);
 assert.match(c.nodes.timberForm.controlsHTML,/Find research and sources/);assert.match(c.nodes.timberResponse.innerHTML,/Research and sources/);assert.match(c.nodes.timberResponse.innerHTML,/https:\/\/www.nhs.uk/);assert.match(c.nodes.timberResponse.innerHTML,/NCBI policies and disclaimer/);assert.doesNotMatch(c.nodes.timberResponse.innerHTML,/high confidence|Nothing extra/);assert.equal(c.nodes.timberSubmit.disabled,false);
});
test('source titles and metadata are escaped and executable source URLs are not linked',async()=>{
 const c=client(async()=>Response.json({ok:true,mode:'research',answer:'References only.',sources:[{id:1,title:'<script>bad()</script>',publisher:'<img src=x onerror=bad()>',url:'javascript:bad()',evidenceType:'Research article',pmid:'12345',checkedAt:'2026-10-31',publishedAt:'2025 Jan'}],research:{searchUrl:'javascript:bad()'},attribution:{url:'javascript:bad()'}}));
 c.nodes.timberQuestion.value='Find research about protein';await c.submit();const html=c.nodes.timberResponse.innerHTML;
 assert.match(html,/&lt;script&gt;/);assert.match(html,/PMID 12345/);assert.match(html,/2025 Jan/);assert.doesNotMatch(html,/<script>|<img|href="javascript:/);
});
