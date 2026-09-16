import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {restoreDashboardTools,dashboardToolsRuntime,dashboardToolsStyles} from '../dashboard-tools.mjs';
import {memberExperienceEntry,memberExperienceRoutes} from '../entry.mjs';
const baseline=readFileSync(new URL('../test-support/dashboard.html',import.meta.url),'utf8');
const enabled={MEMBER_EXPERIENCE_V1_ENABLED:'true'};

test('retained tools are additive inside the authenticated shell and leave original sections untouched',()=>{
 const upgraded=restoreDashboardTools(baseline);
 for(const id of ['previewAuth','panel-today','panel-journey']){
  const section=new RegExp('<section\\b[^>]*id="'+id+'"[^>]*>[\\s\\S]*?<\\/section>');
  assert.equal(upgraded.match(section)[0],baseline.match(section)[0],id+' must retain its existing markup');
 }
 for(const id of ['panel-visualise','panel-plans','photoInput','savePhotoConsent','saveOriginal','savedPhotos','activePlans'])assert.equal([...upgraded.matchAll(new RegExp('id="'+id+'"','g'))].length,1,id);
 assert.ok(upgraded.indexOf('id="panel-plans"')<upgraded.indexOf('</main>'));
 assert.equal(restoreDashboardTools(upgraded),upgraded,'idempotent');
 assert.equal(restoreDashboardTools('<html><body><main>Unknown screen</main></body></html>'),'<html><body><main>Unknown screen</main></body></html>');
 assert.doesNotMatch(upgraded.slice(upgraded.indexOf('id="panel-visualise"')),/member-shell-v33g|member-shift-me-premium|member-medicines-watch/);
});

test('utility links expose restored tools, with private and feature-gated assets',async()=>{
 const r=await memberExperienceEntry(new Request('https://shiftsometimber.co.uk/member/dashboard'),enabled,new Response(baseline,{headers:{'Content-Type':'text/html'}})),html=await r.text();
 assert.match(html,/<summary>More<\/summary><div><a class="mp-tab" data-panel="visualise"/);
 assert.match(html,/data-panel="plans" href="\/member\/dashboard#plans"/);
 for(const path of ['/assets/member-experience/tools.mjs','/assets/member-experience/tools.css']){
  assert.equal(memberExperienceRoutes(new Request('https://shiftsometimber.co.uk'+path),{}),null);
  const response=memberExperienceRoutes(new Request('https://shiftsometimber.co.uk'+path),enabled);
  assert.match(response.headers.get('Cache-Control'),/no-store/);
  assert.equal(response.status,200);
 }
 new Function(dashboardToolsRuntime);
 assert.match(dashboardToolsStyles,/font-family:inherit/);
 assert.doesNotMatch(dashboardToolsStyles,/font-family:Arial|font-family:Georgia/);
});

test('tools do not load private-record clients before existing session hydration',()=>{
 const appended=[];
 const member={hidden:true,classList:{contains:()=>false}};
 vm.runInNewContext(dashboardToolsRuntime,{document:{body:{dataset:{memberTools:'v1'}},getElementById:()=>member,readyState:'complete',addEventListener(){},head:{appendChild:s=>appended.push(s)}},window:{addEventListener(){}},MutationObserver:class{observe(){}}});
 assert.deepEqual(appended,[]);
});

test('photo client mounts after DOM ready without invoking legacy Today or altering selected panel',async()=>{
 const source=readFileSync(new URL('../../frontend/member/member-product-v33d.js',import.meta.url),'utf8');
 const ids=['photoWeightStone','photoWeightPounds','photoWeightKg','photoWeightLbOnly','photoWaist','photoWeightUnit','photoWeightStoneWrap','photoWeightKgWrap','photoWeightLbWrap','photoInput','photoPreview','visualConsentWrap','saveOriginal','photoWaistUnit','visualConsent','savedPhotos'];
 const nodes=new Map(ids.map(id=>['#'+id,{style:{},value:'',innerHTML:'',addEventListener(){}}]));
 const calls=[];const api={listProgressPhotos:async()=>{calls.push('photos');return{photos:[]}},getShiftContext:async()=>calls.push('context'),getShiftToday:async()=>calls.push('today')};
 const context={document:{body:{dataset:{memberTools:'v1'}},readyState:'complete',querySelector:s=>nodes.get(s)||null,querySelectorAll:()=>[],addEventListener(){}},window:{addEventListener(){throw Error('should mount immediately after DOM ready')}},localStorage:{setItem(){},getItem(){return null}},SST_API:api,location:{hash:'#plans',pathname:'/member/dashboard'},history:{replaceState(){throw Error('must not change selected route')}}};
 vm.runInNewContext(source,context);await new Promise(setImmediate);
 assert.deepEqual(calls,['photos']);
 assert.equal(typeof nodes.get('#photoInput').onchange,'function');
 assert.equal(typeof nodes.get('#saveOriginal').onclick,'function');
 for(const id of ['photoWeightStone','photoWeightPounds','photoWeightKg','photoWeightLbOnly','photoWaist'])assert.equal(nodes.get('#'+id).value,'','never prefill invented measurements');
 assert.match(nodes.get('#savedPhotos').innerHTML,/No saved progress photos yet/);
});

test('saved plan viewer reads the selected private snapshot without changing the current workspace',async()=>{
 const source=readFileSync(new URL('../../frontend/member/member-plans-premium-v1.js',import.meta.url),'utf8');
 const calls=[],hosts=[];
 const card={querySelector:()=>null,appendChild:node=>hosts.push(node)};
 const button={dataset:{planSnapshot:'41'},closest:()=>card,setAttribute(){}};
 const context={location:{pathname:'/member/dashboard'},document:{readyState:'loading',addEventListener(){},createElement:()=>({dataset:{},setAttribute(){},innerHTML:''})},fetch:async(url,options)=>{calls.push({url,options});return{ok:true,json:async()=>({plans:[{id:40,plan:{days:[{meals:[{name:'A different plan'}]}]}},{id:41,starts_on:'2026-09-16',plan:{days:[{meals:[{name:'Saved <script>meal</script>',recipe:{ingredients:[{name:'Rice',amount:100,unit:'g'}]}}]}]}}]})}},AbortController,setTimeout,clearTimeout};
 const harness=source.replace("  if(document.readyState==='loading')",'  globalThis.testSnapshot=snapshot;\n  if(document.readyState===\'loading\')');
 vm.runInNewContext(harness,context);await context.testSnapshot(button);
 assert.equal(calls.length,1);assert.equal(calls[0].url,'/v1/plan/latest');assert.equal(calls[0].options.credentials,'same-origin');assert.equal(calls[0].options.method,undefined);assert.equal(calls[0].options.body,undefined);
 assert.match(hosts[0].innerHTML,/Saved &lt;script&gt;meal&lt;\/script&gt;/);assert.match(hosts[0].innerHTML,/Rice/);assert.doesNotMatch(hosts[0].innerHTML,/A different plan|<script>/);assert.match(hosts[0].innerHTML,/does not replace your current food week/);assert.equal(button.disabled,false);
});

test('restored plans preserve hydration records without offering the absent legacy water panel',async()=>{
 const source=readFileSync(new URL('../../frontend/member/member-plans-premium-v1.js',import.meta.url),'utf8');
 for(const restored of [true,false])for(const populated of [true,false]){
  const box={innerHTML:'',dataset:{}};
  const groups=populated?{current:[{id:17,type:'hydration',title:'Hydration guide',summary:'Saved hydration plan'},{id:18,type:'grub',title:'Food plan'},{id:19,type:'fit',title:'Movement plan'}],replaced:[{id:16,type:'hydration',title:'Earlier hydration guide',summary:'Earlier saved plan'}],other:[]}:{current:[],replaced:[],other:[]};
  const api={getPlanList:async()=>({plans:groups})};
  const document={body:{dataset:restored?{memberTools:'v1'}:{}},readyState:'complete',querySelector:s=>s==='#activePlans'?box:null,addEventListener(){}};
  vm.runInNewContext(source,{document,window:{SST_API:api},SST_API:api,location:{pathname:'/member/dashboard'},MutationObserver:class{observe(){}}});
  await new Promise(setImmediate);
  assert.equal(box.dataset.planManagerReady,'true','actual client render must complete');
  assert.equal(box.innerHTML.includes('data-open-plan="water"'),!restored,'only the legacy mode has a real water panel');
  assert.match(box.innerHTML,/data-open-plan="grub"/);assert.match(box.innerHTML,/data-open-plan="fit"/);
  if(populated){
   for(const id of [16,17])assert.match(box.innerHTML,new RegExp('data-plan-snapshot="'+id+'"'),'saved hydration contents remain reachable');
   assert.match(box.innerHTML,/3 current/);assert.match(box.innerHTML,/1 previous plan kept in history/);assert.match(box.innerHTML,/Earlier hydration guide/);
  }else if(restored){assert.doesNotMatch(box.innerHTML,/Set hydration guide|Build a Grub, Fit or hydration plan/)}
 }
});

test('restored photo presentation cannot inject legacy Today or Journey controllers',()=>{
 const source=readFileSync(new URL('../../frontend/member/member-progress-picture-premium-v1.js',import.meta.url),'utf8');
 for(const restored of [true,false]){
  const scripts=[],intros=[],callbacks=[];
  const heading={insertAdjacentElement:(_,node)=>intros.push(node)};
  const panel={dataset:{},classList:{add(){}},querySelector:s=>s===':scope > h2, h2'?heading:null,querySelectorAll:()=>[]};
  const document={body:{dataset:restored?{memberTools:'v1'}:{},appendChild:node=>scripts.push(node.src)},readyState:'loading',addEventListener:(_,callback)=>callbacks.push(callback),querySelector:s=>s==='#panel-visualise'?panel:null,createElement:()=>({dataset:{},setAttribute(){}})};
  vm.runInNewContext(source,{document,location:{pathname:'/member/dashboard'}});
  callbacks.forEach(callback=>callback());
  assert.equal(panel.dataset.progressPicturePremium,'v1','picture presentation still mounts');
  assert.equal(intros.length,1,'picture introduction remains available');
  assert.match(intros[0].innerHTML,/Your photo\. Your account\./);
  assert.deepEqual(scripts,restored?[]:['/whole-man-intent-os-v1.js?v=3','/whole-man-journey-modes-v1.js?v=2']);
 }
});

test('photo save requires an explicit stone/pounds pair and preserves waist measurements when units change',async()=>{
 const source=readFileSync(new URL('../../frontend/member/member-product-v33d.js',import.meta.url),'utf8');
 const ids=['photoWeightStone','photoWeightPounds','photoWeightKg','photoWeightLbOnly','photoWaist','photoWeightUnit','photoWeightStoneWrap','photoWeightKgWrap','photoWeightLbWrap','photoInput','photoPreview','visualConsentWrap','saveOriginal','savePhotoConsent','photoWaistUnit','visualConsent','visualStatus','savedPhotos'];
 const nodes=new Map(ids.map(id=>['#'+id,{style:{},value:'',innerHTML:'',addEventListener(){}}]));
 nodes.get('#photoWeightUnit').value='stone';nodes.get('#photoWaistUnit').value='cm';nodes.get('#photoInput').files=[{name:'synthetic.png'}];nodes.get('#savePhotoConsent').checked=true;
 const payloads=[];let decoded=0;
 const api={listProgressPhotos:async()=>({photos:[]}),saveProgressPhoto:async(file,payload)=>payloads.push(JSON.parse(JSON.stringify(payload)))};
 const context={document:{body:{dataset:{memberTools:'v1'}},readyState:'complete',querySelector:s=>nodes.get(s)||null,querySelectorAll:()=>[],addEventListener(){},createElement:name=>{assert.equal(name,'canvas');return{getContext:()=>({drawImage(){}}),toBlob:callback=>callback({})}}},window:{},localStorage:{setItem(){},getItem(){return null}},SST_API:api,File:class{},createImageBitmap:async()=>{decoded++;return{width:500,height:700,close(){}}}};
 vm.runInNewContext(source,context);
 const save=nodes.get('#saveOriginal').onclick;
 nodes.get('#photoWeightPounds').value='4.0';await save();assert.equal(payloads.length,0);assert.equal(decoded,0);assert.match(nodes.get('#visualStatus').textContent,/Choose both stone and pounds/);
 nodes.get('#photoWeightStone').value='15';nodes.get('#photoWeightPounds').value='';await save();assert.equal(payloads.length,0);assert.equal(decoded,0);
 nodes.get('#photoWeightPounds').value='0.0';await save();assert.equal(payloads.length,1);assert.equal(payloads[0].weightKg,210*0.45359237);assert.equal(payloads[0].waistCm,null);
 nodes.get('#photoWeightStone').value='';nodes.get('#photoWeightPounds').value='';await save();assert.equal(payloads[1].weightKg,null);
 const waist=nodes.get('#photoWaist'),unit=nodes.get('#photoWaistUnit');waist.value='111.0';unit.value='in';unit.onchange();assert.ok(Math.abs(Number(waist.value)*2.54-111)<1e-10);assert.match(waist.innerHTML,/value="32.0"/);assert.match(waist.innerHTML,/value="48.0"/);await save();assert.ok(Math.abs(payloads[2].waistCm-111)<1e-10);
 unit.value='cm';unit.onchange();assert.ok(Math.abs(Number(waist.value)-111)<1e-10);
 waist.value='';unit.value='in';unit.onchange();assert.equal(waist.value,'');
 waist.value='32.0';await save();assert.equal(payloads[3].waistCm,81.28);
 assert.equal(nodes.get('#saveOriginal').disabled,false);
});

test('Progress summary does not load a duplicate Journey check-in in the restored master',()=>{
 const source=readFileSync(new URL('../../frontend/member/member-progress-v1.js',import.meta.url),'utf8');
 for(const restored of [true,false]){
  const appended=[],callbacks=[];
  const document={body:{dataset:restored?{memberTools:'v1'}:{}},readyState:'loading',querySelector:()=>null,head:{appendChild:node=>appended.push(node.src||node.href)},createElement:()=>({dataset:{}}),addEventListener:(name,callback)=>callbacks.push({name,callback})};
  vm.runInNewContext(source,{document,location:{pathname:'/member/dashboard'}});
  assert.equal(callbacks.length,1,'summary boot remains registered');assert.equal(callbacks[0].name,'DOMContentLoaded');
  assert.deepEqual(appended,restored?[]:['/member-my-journey-checkin-v1.css?v=1','/member-my-journey-checkin-v1.js?v=1']);
 }
});

test('actual header links return from restored tools to Today and Journey without rewriting either panel',()=>{
 let ready=false;const handlers={},windowHandlers={},historyCalls=[];
 const names=['today','journey','visualise','plans'];
 const panels=names.map(name=>({id:'panel-'+name,innerHTML:'existing '+name,classList:{active:name==='today',toggle(_,on){this.active=on}},scrollIntoView(){}}));
 const member={hidden:false,classList:{contains:()=>ready}};
 const location={href:'https://shiftsometimber.co.uk/member/dashboard#today',hash:'#today'};
 const document={body:{dataset:{memberTools:'v1'}},readyState:'complete',getElementById:id=>id==='previewMember'?member:panels.find(p=>p.id===id),querySelector:()=>({removeAttribute(){}}),querySelectorAll:s=>s==='.mp-panel'?panels:[],addEventListener:(name,fn)=>handlers[name]=fn};
 const window={addEventListener:(name,fn)=>windowHandlers[name]=fn,dispatchEvent:event=>windowHandlers[event.type]?.()};
 vm.runInNewContext(dashboardToolsRuntime,{document,window,location,URL,Event,history:{replaceState:(_,__,hash)=>{historyCalls.push(hash);location.hash=hash}},MutationObserver:class{observe(){}}});
 function click(name){let prevented=false;handlers.click({target:{closest:()=>({href:'https://shiftsometimber.co.uk/member/dashboard#'+name})},preventDefault:()=>prevented=true});return prevented}
 assert.equal(click('plans'),false,'unhydrated session stays with normal sign-in handling');ready=true;
 for(const name of ['visualise','journey','plans','today']){
  assert.equal(click(name),true);assert.deepEqual(panels.filter(p=>p.classList.active).map(p=>p.id),['panel-'+name]);assert.equal(location.hash,'#'+name);
 }
 assert.deepEqual(panels.map(p=>p.innerHTML),names.map(name=>'existing '+name));assert.deepEqual(historyCalls,['#visualise','#journey','#plans','#today']);
});

test('finishing delayed tool loading keeps a member-opened More menu open until they choose a destination',async()=>{
 for(const initial of ['','today','plans']){
  const handlers={},windowHandlers={},pending=[];
  const panels=['today','journey','visualise','plans'].map(name=>({id:'panel-'+name,classList:{active:name==='today',toggle(_,on){this.active=on}},scrollIntoView(){}}));
  const member={hidden:false,classList:{contains:()=>true}},more={open:false,removeAttribute(name){if(name==='open')this.open=false}};
  const location={href:'https://shiftsometimber.co.uk/member/dashboard'+(initial?'#'+initial:''),hash:initial?'#'+initial:''};
  const history={replaceState:(_,__,hash)=>location.hash=hash};
  const document={body:{dataset:{memberTools:'v1'}},readyState:'complete',getElementById:id=>id==='previewMember'?member:panels.find(panel=>panel.id===id),querySelector:selector=>selector==='.member-nav-more'?more:null,querySelectorAll:selector=>selector==='.mp-panel'?panels:[],addEventListener:(name,callback)=>handlers[name]=callback,createElement:()=>({}),head:{appendChild:script=>pending.push(script)}};
  const window={SST_API:{},addEventListener:(name,callback)=>windowHandlers[name]=callback,dispatchEvent:event=>windowHandlers[event.type]?.()};
  vm.runInNewContext(dashboardToolsRuntime,{document,window,location,URL,Event,history,MutationObserver:class{observe(){}}});
  assert.equal(pending.length,1,'first real tool load must remain pending');
  more.open=true; // A member opens More while the script network requests finish.
  if(!initial){
   // The pinned Journey V2 boot calls activate('today',false) on an empty
   // hash; that still uses replaceState, which emits no hashchange event.
   history.replaceState(null,'','#today');
   assert.equal(more.open,true,'Journey initialisation itself has not closed More');
  }
  for(let index=0;index<4;index++){
   assert.equal(pending.length,index+1,'tool scripts must still load sequentially');
   pending[index].onload();await new Promise(setImmediate);
   assert.equal(more.open,true,'background script completion must not dismiss an open menu');
  }
  assert.deepEqual(panels.filter(panel=>panel.classList.active).map(panel=>panel.id),['panel-'+(initial||'today')],'initial requested panel must still synchronise');
  let prevented=false;
  handlers.click({target:{closest:()=>({href:'https://shiftsometimber.co.uk/member/dashboard#visualise'})},preventDefault:()=>prevented=true});
  assert.equal(prevented,true);assert.equal(more.open,false,'explicit selection must still close More');assert.equal(location.hash,'#visualise');
  assert.deepEqual(panels.filter(panel=>panel.classList.active).map(panel=>panel.id),['panel-visualise']);
 }
});
