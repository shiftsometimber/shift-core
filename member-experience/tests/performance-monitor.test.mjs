import test from'node:test';import assert from'node:assert/strict';import{fixture}from'../../health-passport/fixture.mjs';import{performanceMetricsRoute,performanceMetricsPath}from'../performance-monitor.mjs';
const url='https://shiftsometimber.co.uk'+performanceMetricsPath;
const request=body=>new Request(url,{method:'POST',headers:{Origin:'https://shiftsometimber.co.uk','Content-Type':'application/json'},body:JSON.stringify(body)});
test('RUM accepts only finite anonymous timing fields, never identifiers, health text, URLs or cookies',async()=>{
 const f=fixture({seed:false});try{const body={screen:'today',visit:'fresh',usableMs:1000,serverMs:120,ackMs:15,outcome:'usable'};
 for(const extra of [{email:'private@example.invalid'},{path:'/member/treatment'},{accountId:1},{symptoms:'private'},{timestamp:Date.now()}])assert.equal((await performanceMetricsRoute(request({...body,...extra}),f.env)).status,400);
 assert.equal((await performanceMetricsRoute(new Request(url,{method:'POST',headers:{Origin:'https://evil.invalid','Content-Type':'application/json'},body:JSON.stringify(body)}),f.env)).status,403);
 const r=await performanceMetricsRoute(request(body),f.env);assert.equal(r.status,202);assert.equal(r.headers.get('Cache-Control'),'no-store, private');
 const rows=await f.env.DB.prepare('SELECT * FROM my_timber_performance_buckets').all();assert(rows.results.every(r=>Object.keys(r).every(k=>['hour','screen','visit','metric','bucket_ms','n'].includes(k))));
 }finally{f.close();}});
test('twenty slow samples create an aggregate median budget alert; timeouts are not counted as usable',async()=>{
 const f=fixture({seed:false});try{for(let i=0;i<20;i++)await performanceMetricsRoute(request({screen:'fit',visit:'warm',usableMs:900,outcome:'usable'}),f.env);
 const rows=await f.env.DB.prepare('SELECT * FROM my_timber_performance_alerts').all();assert(rows.results.some(r=>r.reason==='median_budget_exceeded'&&r.samples>=20&&r.median_ms===900));
 await performanceMetricsRoute(request({screen:'journey',visit:'fresh',usableMs:20000,outcome:'timeout'}),f.env);
 const usable=await f.env.DB.prepare("SELECT COUNT(*) n FROM my_timber_performance_buckets WHERE screen='journey' AND metric='usableMs'").first();assert.equal(usable.n,0);
 }finally{f.close();}});
