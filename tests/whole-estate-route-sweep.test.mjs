import test from 'node:test';
import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {createServer} from 'node:http';
import {promisify} from 'node:util';

const run=promisify(execFile);
const page=(body='Useful route content for the complete estate sweep.')=>'<!doctype html><title>Route</title><main>'+body+'</main>';
async function fixture(handler,check){
  const server=createServer(handler);await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base='http://127.0.0.1:'+server.address().port;
  try{await check(base)}finally{await new Promise(resolve=>server.close(resolve))}
}
function report(stdout){const end=stdout.indexOf('\n::notice');return JSON.parse(stdout.slice(stdout.indexOf('{'),end<0?undefined:end));}

test('whole-estate sweep uses bounded concurrency while retaining complete route and blank-page checks',async()=>{
  let active=0,peak=0;
  await fixture((request,response)=>{
    active++;peak=Math.max(peak,active);const finish=()=>{response.writeHead(200,{'content-type':'text/html'});response.end(page(request.url==='/'?'Useful route directory for the complete member experience. '+['a','b','c','d'].map(path=>'<a href="/'+path+'">'+path+'</a>').join(''):'Complete route '+request.url+' with useful member-facing content.'));active--;};
    setTimeout(finish,['/a','/b','/c','/d'].includes(request.url)?120:10);
  },async base=>{
    const {stdout}=await run(process.execPath,['gate1-whole-estate-production-sweep.mjs'],{cwd:process.cwd(),env:{...process.env,SHIFT_SITE_BASE:base,SHIFT_SWEEP_MAX:'20',SHIFT_SWEEP_CONCURRENCY:'3',SHIFT_SWEEP_TIMEOUT_MS:'2000'},maxBuffer:4e6});
    const result=report(stdout);assert.equal(result.checked,6);assert.equal(result.failures.length,0);assert.equal(result.truncated,false);assert.equal(result.concurrency,3);assert.equal(result.requestTimeoutMs,2000);assert(peak>=2,'At least two independent routes must overlap');
  });
});

test('whole-estate sweep fails closed when a route exceeds the bounded request timeout',async()=>{
  let slowRequests=0;
  await fixture((request,response)=>{
    if(request.url==='/hang')slowRequests++;
    const finish=()=>{response.writeHead(200,{'content-type':'text/html'});response.end(page(request.url==='/'?'<a href="/hang">Slow route</a>':'Complete route content for timeout verification.'));};
    setTimeout(finish,request.url==='/hang'?500:5);
  },async base=>{
    await assert.rejects(run(process.execPath,['gate1-whole-estate-production-sweep.mjs'],{cwd:process.cwd(),env:{...process.env,SHIFT_SITE_BASE:base,SHIFT_SWEEP_MAX:'10',SHIFT_SWEEP_CONCURRENCY:'2',SHIFT_SWEEP_TIMEOUT_MS:'100'},maxBuffer:4e6}),error=>{
      const result=report(error.stdout);assert(result.failures.some(item=>item.url===base+'/hang'&&/^network:(?:TimeoutError|AbortError):/.test(item.error)&&item.attempts===2));assert.equal(slowRequests,2);return true;
    });
  });
});

test('whole-estate sweep retries one transient timeout and still fails persistent faults closed',async()=>{
  let transientRequests=0;
  await fixture((request,response)=>{
    if(request.url==='/transient')transientRequests++;
    const finish=()=>{response.writeHead(200,{'content-type':'text/html'});response.end(page(request.url==='/'?'Useful route directory for bounded retry verification. <a href="/transient">Transient route</a>':'Complete route content after one transient timeout.'));};
    setTimeout(finish,request.url==='/transient'&&transientRequests===1?150:5);
  },async base=>{
    const {stdout}=await run(process.execPath,['gate1-whole-estate-production-sweep.mjs'],{cwd:process.cwd(),env:{...process.env,SHIFT_SITE_BASE:base,SHIFT_SWEEP_MAX:'10',SHIFT_SWEEP_CONCURRENCY:'2',SHIFT_SWEEP_TIMEOUT_MS:'100'},maxBuffer:4e6});
    const result=report(stdout);assert.equal(result.failures.length,0);assert.equal(result.truncated,false);assert.equal(result.networkRetryLimit,1);assert.equal(result.retriedRoutes,1);assert.equal(transientRequests,2);
  });
});

test('whole-estate sweep retries one transient fetch failure and still fails persistent faults closed',async()=>{
  let transientRequests=0;
  await fixture((request,response)=>{
    if(request.url==='/transient-fetch'&&++transientRequests===1){request.socket.destroy();return;}
    response.writeHead(200,{'content-type':'text/html'});
    response.end(page(request.url==='/'?'Useful route directory for transport retry verification. <a href="/transient-fetch">Transient fetch route</a>':'Complete route content after one transient fetch failure.'));
  },async base=>{
    const {stdout}=await run(process.execPath,['gate1-whole-estate-production-sweep.mjs'],{cwd:process.cwd(),env:{...process.env,SHIFT_SITE_BASE:base,SHIFT_SWEEP_MAX:'10',SHIFT_SWEEP_CONCURRENCY:'1',SHIFT_SWEEP_TIMEOUT_MS:'2000'},maxBuffer:4e6});
    const result=report(stdout);assert.equal(result.failures.length,0);assert.equal(result.retriedRoutes,1);assert.equal(transientRequests,2);
  });
  let persistentRequests=0;
  await fixture((request,response)=>{
    if(request.url==='/persistent-fetch'){persistentRequests++;request.socket.destroy();return;}
    response.writeHead(200,{'content-type':'text/html'});response.end(page('<a href="/persistent-fetch">Persistent fetch fault</a>'));
  },async base=>{
    await assert.rejects(run(process.execPath,['gate1-whole-estate-production-sweep.mjs'],{cwd:process.cwd(),env:{...process.env,SHIFT_SITE_BASE:base,SHIFT_SWEEP_MAX:'10',SHIFT_SWEEP_CONCURRENCY:'1',SHIFT_SWEEP_TIMEOUT_MS:'2000'},maxBuffer:4e6}),error=>{
      const result=report(error.stdout);assert(result.failures.some(item=>item.url===base+'/persistent-fetch'&&item.error==='network:TypeError:fetch failed'&&item.attempts===2));assert.equal(persistentRequests,2);return true;
    });
  });
});

test('whole-estate sweep decodes HTML URL entities once and does not amplify query links',async()=>{
  const requested=[];
  await fixture((request,response)=>{
    requested.push(request.url);
    const href=request.url.startsWith('/explore')?request.url.replaceAll('&','&amp;'):'/explore?topic=food&amp;limit=12';
    response.writeHead(200,{'content-type':'text/html'});
    response.end(page('Complete route content with a stable query link. <a href="'+href+'">Explore food</a>'));
  },async base=>{
    const {stdout}=await run(process.execPath,['gate1-whole-estate-production-sweep.mjs'],{cwd:process.cwd(),env:{...process.env,SHIFT_SITE_BASE:base,SHIFT_SWEEP_MAX:'10',SHIFT_SWEEP_CONCURRENCY:'2',SHIFT_SWEEP_TIMEOUT_MS:'2000'},maxBuffer:4e6});
    const result=report(stdout);
    assert.equal(result.truncated,false);
    assert.equal(result.failures.length,0);
    assert.equal(requested.filter(url=>url.startsWith('/explore')).length,1);
    assert(requested.includes('/explore?topic=food&limit=12'));
    assert(!requested.some(url=>url.includes('amp%3B')||url.includes('amp;')));
  });
});

