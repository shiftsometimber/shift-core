// Research process lifecycle only. Not an HTTP server or Cloudflare deployment.
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';

export class LocalFoodWorker {
 constructor({python,candidate,base,gate,research=false,workerPath=fileURLToPath(new URL('./local_worker.py',import.meta.url)),startupMs=45000,requestMs=14000}={}){
  if(research!==true)throw Error('Research-only local worker; production invocation refused');
  if(!python||!candidate||!base||!gate||!Number.isInteger(startupMs)||startupMs<1||startupMs>45000||!Number.isInteger(requestMs)||requestMs<1||requestMs>14000)throw Error('Local files and bounded lifecycle deadlines required');
  Object.assign(this,{python,candidate,base,gate,workerPath,startupMs,requestMs});this.state='new';this.pending=null;this.requests=0;
 }
 async start(){
  if(this.state!=='new')throw Error('Explicit new worker required; no automatic restart');
  this.state='starting';this.startedAt=Date.now();this.buffer='';
  const ready=new Promise((resolve,reject)=>{this.startResolve=resolve;this.startReject=reject});
  this.startTimer=setTimeout(()=>this.fail('worker_startup_timeout'),this.startupMs);
  this.child=spawn(this.python,[this.workerPath,'--candidate',this.candidate,'--base',this.base,'--gate',this.gate,'--research'],{stdio:['pipe','pipe','pipe']});
  this.pid=this.child.pid;
  this.child.stdout.on('data',data=>this.receive(data));
  // Drain model-loader diagnostics, retaining no stderr/request text.
  this.child.stderr.on('data',()=>{});
  this.child.on('error',()=>this.fail('worker_process_error'));
  this.child.on('exit',()=>{if(this.state!=='closed')this.fail('worker_process_exited')});
  this.child.stdin.on('error',()=>this.fail('worker_input_closed'));
  return ready;
 }
 receive(data){
  if(!['starting','ready'].includes(this.state))return;
  this.buffer+=data.toString('utf8');
  if(Buffer.byteLength(this.buffer)>100000)return this.fail('worker_output_too_large');
  let boundary;
  while((boundary=this.buffer.indexOf('\n'))>=0){
   const line=this.buffer.slice(0,boundary);this.buffer=this.buffer.slice(boundary+1);
   let value;try{value=JSON.parse(line)}catch{return this.fail('worker_protocol_error')}
   if(this.state==='starting'){
    if(value.type!=='ready'||value.protocol!=='shift-food-local-worker-1'||value.productionReady!==false)return this.fail('worker_readiness_invalid');
    clearTimeout(this.startTimer);this.state='ready';this.initializationMs=Date.now()-this.startedAt;this.startResolve();this.startResolve=this.startReject=null;
   }else{
    if(!this.pending||typeof value.ok!=='boolean')return this.fail('worker_unexpected_response');
    const pending=this.pending;this.clearPending();
    if(value.ok===true&&value.result&&Array.isArray(value.result.items)&&value.result.items.length<=12&&
       value.result.items.every(x=>typeof x==='string'&&x.length>0&&x.length<=90)&&
       value.result.nutrition&&typeof value.result.nutrition==='object'&&!Array.isArray(value.result.nutrition)&&Object.keys(value.result.nutrition).length===0){
     pending.resolve(Response.json({items:value.result.items,nutrition:{}}));
    }else if(value.ok===false&&value.error==='invalid_request'){
     pending.resolve(Response.json({error:'invalid_request'},{status:400}));
    }else{pending.reject(Error('worker_model_unavailable'));this.fail('worker_model_unavailable')}
   }
  }
 }
 async fetch(request){
  if(this.state!=='ready')throw Error('worker_not_ready');
  if(this.pending||this.reading)throw Error('worker_busy');
  if(request.url!=='https://shift-ai.internal/recognise-food'||request.method!=='POST')throw Error('fixed_recognition_endpoint_required');
  if(request.signal.aborted)throw Error('worker_request_aborted');
  this.reading=true;let raw;
  try{raw=await request.text()}finally{this.reading=false}
  if(Buffer.byteLength(raw)>1100000)throw Error('bounded_request_required');
  if(this.state!=='ready'||request.signal.aborted)throw Error('worker_not_ready_or_aborted');
  JSON.parse(raw); // Deliberately no logging or persistent copy of the body.
  return new Promise((resolve,reject)=>{
   const aborted=()=>this.fail('worker_request_aborted');
   const timer=setTimeout(()=>this.fail('worker_request_timeout'),this.requestMs);
   this.pending={resolve,reject,timer,signal:request.signal,aborted};
   request.signal.addEventListener('abort',aborted,{once:true});
   this.requests++;
   this.child.stdin.write(raw+'\n');raw=null;
  });
 }
 clearPending(){
  if(this.pending){clearTimeout(this.pending.timer);this.pending.signal.removeEventListener('abort',this.pending.aborted);this.pending=null}
 }
 fail(code){
  if(this.state==='closed')return;
  this.state='failed';clearTimeout(this.startTimer);
  this.startReject?.(Error(code));this.startResolve=this.startReject=null;
  const pending=this.pending;this.clearPending();pending?.reject(Error(code));
  this.stopChild();this.buffer='';
 }
 stopChild(){
  if(this.child&&!this.child.killed){
   this.child.kill('SIGTERM');
   const child=this.child;
   const force=setTimeout(()=>{if(child.exitCode===null&&child.signalCode===null)child.kill('SIGKILL')},1000);force.unref();
  }
 }
 close(){
  if(this.state==='closed')return;
  this.fail('worker_closed');this.state='closed';
 }
}
