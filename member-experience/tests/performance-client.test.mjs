import test from'node:test';import assert from'node:assert/strict';import vm from'node:vm';import{memberPerformanceClient}from'../performance-client.mjs';
function harness(){
 const listeners=new Map(),calls=[],state={id:1,apiId:1,expired:false,release:null,hold:false,reloads:0,clears:0};
 const document={readyState:'loading',hidden:false,body:{dataset:{memberSession:'pending'}},documentElement:{dataset:{},hasAttribute:()=>false,toggleAttribute(){}},addEventListener:(name,fn)=>{const list=listeners.get(name)||[];list.push(fn);listeners.set(name,list)},dispatchEvent:e=>{for(const fn of listeners.get(e.type)||[])fn(e);return true},querySelectorAll:selector=>selector==='main'?[{replaceChildren:()=>state.clears++}]:[],getElementById:()=>null,querySelector:()=>null};
 const location={origin:'https://shiftsometimber.co.uk',href:'https://shiftsometimber.co.uk/member/dashboard',reload:()=>state.reloads++};
 const network=async(input)=>{const u=new URL(input instanceof Request?input.url:input,location.href);calls.push(u.origin);const id=u.origin===location.origin?state.id:state.apiId;if(u.origin!==location.origin&&state.hold)await new Promise(r=>state.release=r);await new Promise(r=>setTimeout(r,5));return Response.json(state.expired?{error:'expired'}:{user:{id,source:u.origin}},{status:state.expired?401:200});};
 const window={fetch:network},context=vm.createContext({window,parent:window,document,location,Request,Response,Headers,URL,AbortController,AbortSignal,Event,CustomEvent,performance,setTimeout,clearTimeout,queueMicrotask,addEventListener(){},BroadcastChannel:class{addEventListener(){}postMessage(){}},history:{},console});window.location=location;vm.runInContext('('+memberPerformanceClient.toString()+')()',context);return{window,document,state,calls};
}
test('startup shares only freshly verified matching identities, preserving each origin response',async()=>{
 const h=harness(),same='/v1/me',api='https://api.shiftsometimber.co.uk/v1/me';
 const replies=await Promise.all([h.window.fetch(same),h.window.fetch(same),h.window.fetch(api),h.window.fetch(api)]);
 assert.deepEqual(h.calls.sort(),['https://api.shiftsometimber.co.uk','https://shiftsometimber.co.uk']);for(const r of replies){assert.equal(r.status,200);assert.match(r.headers.get('Cache-Control'),/no-store/);}
 assert.equal((await replies[2].json()).user.source,'https://api.shiftsometimber.co.uk');
 await h.window.fetch(api);assert.equal(h.calls.length,2);
 await h.window.MT_MEMBER_IDENTITY(true);await h.window.fetch(api);assert.equal(h.calls.length,4,'A new server identity verification invalidates the origin result');
});
test('a different account on the API origin fails closed and clears the retained private view',async()=>{
 const h=harness(),api='https://api.shiftsometimber.co.uk/v1/me';await h.window.fetch(api);h.document.body.dataset.memberSession='ready';h.state.apiId=2;
 await h.window.MT_MEMBER_IDENTITY(true);const denied=await h.window.fetch(api);assert.equal(denied.status,401);assert.equal(h.document.body.dataset.memberSession,'signed-out');assert(h.state.clears>0);assert.equal(h.state.reloads,0);assert.doesNotMatch(await denied.text(),/"id":1/);
});
test('an old in-flight identity cannot reappear after account switch or session expiry',async()=>{
 const h=harness(),api='https://api.shiftsometimber.co.uk/v1/me';await h.window.MT_MEMBER_IDENTITY();h.document.body.dataset.memberSession='ready';h.state.hold=true;const old=h.window.fetch(api);while(!h.state.release)await new Promise(r=>setTimeout(r,1));h.state.id=2;await assert.rejects(h.window.MT_MEMBER_IDENTITY(true));h.state.release();assert.equal((await old).status,401);assert(h.state.clears>0);h.state.expired=true;await assert.rejects(h.window.MT_MEMBER_IDENTITY(true));assert.equal(h.document.body.dataset.memberSession,'signed-out');
});
test('late denied API reads cannot relock the signed-out screen or repeat document reloads',async()=>{
 const h=harness();await h.window.MT_MEMBER_IDENTITY();h.document.body.dataset.memberSession='ready';h.state.expired=true;const reloads=h.state.reloads;
 await assert.rejects(h.window.MT_MEMBER_IDENTITY(true));assert.equal(h.document.body.dataset.memberSession,'signed-out');assert.equal(h.document.documentElement.dataset.mtScreenLocked,undefined);
 const r=await h.window.fetch('/v1/profile');assert.equal(r.status,401);assert.equal(h.document.body.dataset.memberSession,'signed-out');assert.equal(h.document.documentElement.dataset.mtScreenLocked,undefined);assert.equal(h.state.reloads,reloads);assert(h.state.clears>0);
});

