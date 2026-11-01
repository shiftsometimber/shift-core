import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {LocalFoodWorker} from '../local_worker_client.mjs';

const request=signal=>new Request('https://shift-ai.internal/recognise-food',{method:'POST',signal,body:JSON.stringify({task:'recognise_food',image:'fixture-only',maxOutputTokens:400})});
async function fixture(t,mode='normal',options={}){
 const directory=await mkdtemp(join(tmpdir(),'shift-food-worker-'));t.after(()=>rm(directory,{recursive:true,force:true}));
 const path=join(directory,'worker.py');
 await writeFile(path,`import json,sys,time,os\nmode=${JSON.stringify(mode)}\nif mode=='never_ready':time.sleep(5)\nprint(json.dumps({'type':'ready','protocol':'bad' if mode=='invalid_ready' else 'shift-food-local-worker-1','productionReady':False}),flush=True)\nfor line in sys.stdin:\n if mode=='hang':time.sleep(5)\n if mode=='malformed':print('not json',flush=True);continue\n if mode=='oversized':print('x'*100001,flush=True);continue\n print(json.dumps({'ok':True,'result':{'items':['fixture-'+str(os.getpid())],'nutrition':{}}}),flush=True)\n`);
 const worker=new LocalFoodWorker({python:'python3',candidate:'fixture',base:'fixture',gate:'fixture',workerPath:path,research:true,startupMs:2000,requestMs:500,...options});
 t.after(()=>worker.close());return worker;
}

test('research override is explicit and request deadline cannot exceed the original 14 seconds',()=>{
 assert.throws(()=>new LocalFoodWorker({}),/production invocation refused/);
 assert.throws(()=>new LocalFoodWorker({python:'python3',candidate:'x',base:'x',gate:'x',research:true,requestMs:14001}),/bounded lifecycle/);
});
test('readiness precedes scans and two scans reuse the same preloaded process',async t=>{
 const worker=await fixture(t);await assert.rejects(worker.fetch(request()),/not_ready/);await worker.start();
 const pid=worker.pid;
 for(let i=0;i<2;i++){const result=await(await worker.fetch(request())).json();assert.equal(result.items[0],'fixture-'+pid)}
 assert.equal(worker.requests,2);assert.equal(worker.pid,pid);worker.close();await assert.rejects(worker.fetch(request()),/not_ready/);
});
test('startup has its own bounded readiness failure and never sends a scan while warming',async t=>{
 const worker=await fixture(t,'never_ready',{startupMs:50});await assert.rejects(worker.start(),/startup_timeout/);assert.equal(worker.requests,0);
 await assert.rejects(worker.start(),/no automatic restart/);
});
test('an invalid readiness handshake cannot enable serving',async t=>{
 const worker=await fixture(t,'invalid_ready');await assert.rejects(worker.start(),/readiness_invalid/);await assert.rejects(worker.fetch(request()),/not_ready/);
});
test('request timeout kills the worker without retrying or queuing another scan',async t=>{
 const worker=await fixture(t,'hang',{requestMs:50});await worker.start();const first=worker.fetch(request());
 await assert.rejects(worker.fetch(request()),/busy/);await assert.rejects(first,/request_timeout/);
 assert.equal(worker.requests,1);assert.equal(worker.state,'failed');await assert.rejects(worker.fetch(request()),/not_ready/);
});
test('request cancellation terminates inference and cannot leak a late result',async t=>{
 const worker=await fixture(t,'hang');await worker.start();const controller=new AbortController();const pending=worker.fetch(request(controller.signal));
 await new Promise(resolve=>setTimeout(resolve,10));controller.abort();await assert.rejects(pending,/request_aborted/);assert.equal(worker.state,'failed');assert.equal(worker.requests,1);
});
test('malformed or oversized child output fails the protocol',async t=>{
 for(const mode of ['malformed','oversized']){const worker=await fixture(t,mode);await worker.start();await assert.rejects(worker.fetch(request()),/protocol_error|output_too_large/);assert.equal(worker.state,'failed')}
});
test('the local adapter refuses alternate endpoints and oversized bodies without inference',async t=>{
 const worker=await fixture(t);await worker.start();
 await assert.rejects(worker.fetch(new Request('https://example.invalid/',{method:'POST',body:'{}'})),/fixed_recognition/);
 await assert.rejects(worker.fetch(new Request('https://shift-ai.internal/recognise-food',{method:'POST',body:'x'.repeat(1100001)})),/bounded_request/);
 assert.equal(worker.requests,0);
});
