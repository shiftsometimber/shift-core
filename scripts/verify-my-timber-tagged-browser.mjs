// Finite synthetic-only diagnostic around one existing acceptance driver.
import fs from 'node:fs';import {spawn} from 'node:child_process';
const name=process.argv[2],allowed=new Set(['shed','privacy','safety']);
if(!allowed.has(name))throw Error('Choose a named acceptance driver');
const dir='../v6-live-acceptance',s=JSON.parse(fs.readFileSync(dir+'/synthetic-sessions.json','utf8'));
if(s.tag!=='my_timber_release_test_v6')throw Error('Reserved test guard');
const tag=crypto.randomUUID(),events=[],tails=[];
const save=()=>fs.writeFileSync(dir+'/resource-'+name+'-receipt.json',JSON.stringify({at:new Date().toISOString(),syntheticOnly:true,realMemberEventsSubscribed:false,events},null,2)+'\n');
for(const worker of ['shift-programme-member-20261023','shift-hq-member-comms-20261023','shift-core']){
 const p=spawn('./node_modules/.bin/wrangler',['tail',worker,'--format','json','--header','X-My-Timber-Release-Test:'+tag],{stdio:['ignore','pipe','ignore']});tails.push(p);let buffer='',depth=0,quote=false,escape=false;
 p.stdout.on('data',chunk=>{for(const c of chunk.toString()){
  if(!depth){if(c!=='{')continue;buffer='{';depth=1;continue;}
  buffer+=c;if(quote){if(escape)escape=false;else if(c==='\\')escape=true;else if(c==='"')quote=false;continue;}if(c==='"'){quote=true;continue;}if(c==='{')depth++;if(c==='}'&&--depth===0){try{const e=JSON.parse(buffer),h=e.event?.request?.headers;if(h&&h['x-my-timber-release-test']!==tag&&h['X-My-Timber-Release-Test']!==tag)continue;const v={worker,outcome:e.outcome,path:e.event?.request?.url?new URL(e.event.request.url).pathname:null,cpuTime:e.cpuTime,wallTime:e.wallTime,exceptions:e.exceptions?.map(x=>({name:x.name,message:x.message?.slice(0,400)}))};events.push(v);save();if(v.outcome!=='ok')console.log(JSON.stringify(v));}catch{}}
 }});
}
await new Promise(r=>setTimeout(r,2500));
const scripts={shed:'verify-my-timber-shed-browser.mjs',privacy:'verify-my-timber-feedback-privacy.mjs',safety:'verify-my-timber-safety-widths.mjs'};
const child=spawn(process.execPath,['scripts/'+scripts[name]],{env:{...process.env,TIMBER_RELEASE_TEST_HEADER:tag},stdio:['ignore','inherit','inherit']});
const timer=setTimeout(()=>{events.push({timeout:true});child.kill('SIGTERM');tails.forEach(p=>p.kill('SIGTERM'));save();},420000);
try{process.exitCode=await new Promise(r=>child.once('exit',code=>r(code??1)));await new Promise(r=>setTimeout(r,1000));}finally{clearTimeout(timer);tails.forEach(p=>p.kill('SIGTERM'));save();}
