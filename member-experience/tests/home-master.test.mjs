import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {reflectionWeek} from '../journey-context.mjs';
import {memberExperienceRoutes,memberExperienceEntry} from '../entry.mjs';

test('reflection days deduplicate entries using UK dates and exclude future and older weeks',()=>{
 const r=reflectionWeek([{at:'2026-09-13T23:30:00Z'},{at:'2026-09-14T12:00:00Z'},{at:'2026-09-15T14:00:00Z'},{at:'2026-09-16T23:30:00Z'},{at:'2026-09-10T09:00:00Z'},{at:'invalid'}],'2026-09-16');
 assert.equal(r.dates.length,7);assert.equal(r.dates[0],'2026-09-14');assert.equal(r.dates[6],'2026-09-20');
 assert.deepEqual(r.loggedDates,['2026-09-14','2026-09-15']);
 assert.deepEqual(reflectionWeek([],'2026-09-16').loggedDates,[]);
});

test('master styling applies only to the dashboard and serves the approved image',async()=>{
 const env={MEMBER_EXPERIENCE_V1_ENABLED:'true'},request=path=>new Request('https://shiftsometimber.co.uk'+path);
 const css=await memberExperienceRoutes(request('/assets/member-experience/home.css'),env).text();
 assert.match(css,/font-family:sans-serif/);assert.doesNotMatch(css,/Georgia|font-family:Arial/);
 for(const path of ['/','/member/grub','/member/fit','/member/dashboard']){
  const html=await (await memberExperienceEntry(request(path),env,new Response('<html><head></head><body><main></main></body></html>',{headers:{'Content-Type':'text/html'}}))).text();
  assert.equal(html.includes('/assets/member-experience/home.css'),path==='/member/dashboard');
 }
 const image=memberExperienceRoutes(request('/assets/member-experience/home-art.webp'),env);
 assert.equal(image.headers.get('Content-Type'),'image/webp');assert.equal(new TextDecoder().decode((await image.arrayBuffer()).slice(0,4)),'RIFF');
 const shell='<html><head></head><body><script>const s=document.createElement("script");s.src="/member-my-timber-problem-v1.js?v=daily-shift-v2";s.defer=true;</script></body></html>';
 const upgraded=await(await memberExperienceEntry(request('/member/dashboard'),env,new Response(shell,{headers:{'Content-Type':'text/html'}}))).text();
 assert.match(upgraded,/s\.src="\/member-my-timber-problem-v1\.js\?v=member-walk-20260920";s\.defer=true/);
 assert.doesNotMatch(upgraded,/daily-shift-v2/);
});

// Run the actual help loader/renderer with a bounded DOM façade. This catches
// the former missing load() and discarded server-provided escalation actions.
test('support entry loads the real solution and exposes its urgent alternative',async()=>{
 const source=readFileSync(new URL('../../frontend/member/member-my-timber-problem-v1.js',import.meta.url),'utf8');
 const calls=[],handlers={};
 const button={dataset:{route:'urgent'},addEventListener:(type,handler)=>{handlers.urgent=handler}};
 const root={innerHTML:'',dataset:{},classList:{add(){},remove(){}},closest:()=>({classList:{remove(){}}}),scrollIntoView(){},querySelector:s=>({addEventListener(){}}),querySelectorAll:s=>s==='[data-route]'?[button]:[]};
 const title={hidden:true,textContent:''};
 const api={getMyTimberHelp:async need=>{calls.push(need);return{solution:{need,title:'Help',summary:'Known guidance',why:'Known rationale',actions:[],alternatives:[{key:'urgent',label:'I cannot keep fluids down'}]}}}};
 const context={window:{SST_API:api},SST_API:api,document:{getElementById:id=>id==='todayActions'?root:title,querySelector:()=>title},requestAnimationFrame:f=>f(),console};
 const harness=source.replace(/  home\(\);\n\}\)\(\);\s*$/,'  window.testLoad=load;\n})();');
 vm.runInNewContext(harness,context);assert.equal(typeof context.window.testLoad,'function');
 await context.window.testLoad('guts');assert.deepEqual(calls,['guts']);assert.equal(title.hidden,false);
 assert.match(root.innerHTML,/I cannot keep fluids down/);assert.equal(typeof handlers.urgent,'function');
 await handlers.urgent();assert.match(root.innerHTML,/NHS 111/);assert.match(root.innerHTML,/999/);
});
