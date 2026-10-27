// One finite, header-filtered diagnostic. Never subscribe to real-member events.
import fs from 'node:fs';import {spawn} from 'node:child_process';
const dir='../v6-live-acceptance',s=JSON.parse(fs.readFileSync(dir+'/synthetic-sessions.json','utf8')),tag=crypto.randomUUID(),events=[],children=[];
if(s.tag!=='my_timber_release_test_v6'||s.members[0].email!=='my-timber-v6-dan@example.invalid')throw Error('Reserved synthetic identity required');
const save=()=>fs.writeFileSync(dir+'/resource-diagnostic.json',JSON.stringify({at:new Date().toISOString(),testHeader:tag,syntheticOnly:true,realMemberEventsSubscribed:false,events},null,2)+'\n');
function start(worker){
 const child=spawn('./node_modules/.bin/wrangler',['tail',worker,'--format','json','--header','X-My-Timber-Release-Test:'+tag],{stdio:['ignore','pipe','pipe']}),state={buffer:'',depth:0,quote:false,escape:false};children.push(child);
 child.stderr.on('data',()=>{});
 child.stdout.on('data',chunk=>{for(const c of chunk.toString()){
  if(state.depth===0){if(c!=='{')continue;state.buffer='';state.depth=1;state.buffer+=c;continue;}
  state.buffer+=c;if(state.quote){if(state.escape)state.escape=false;else if(c==='\\')state.escape=true;else if(c==='"')state.quote=false;continue;}if(c==='"'){state.quote=true;continue;}if(c==='{')state.depth++;if(c==='}'&&--state.depth===0){try{const d=JSON.parse(state.buffer);if(d.event?.request?.headers&&d.event.request.headers['x-my-timber-release-test']!==tag&&d.event.request.headers['X-My-Timber-Release-Test']!==tag)continue;const row={worker,outcome:d.outcome,eventTimestamp:d.eventTimestamp,path:d.event?.request?.url?new URL(d.event.request.url).pathname:null,cpuTime:d.cpuTime,wallTime:d.wallTime,exceptions:d.exceptions?.map(e=>({name:e.name,message:e.message?.slice(0,400)}))};events.push(row);save();console.log(JSON.stringify(row));}catch{}}}
 });
 child.on('exit',code=>{events.push({worker,tailExit:code});save();});
}
start('shift-programme-member-20261023');start('shift-hq-member-comms-20261023');
const until=Date.now()+55000,timer=setTimeout(()=>children.forEach(c=>c.kill('SIGTERM')),55000);
try{
 await new Promise(r=>setTimeout(r,2500));
 const headers={'Cookie':'sst_session='+s.members[0].token,'X-My-Timber-Release-Test':tag};
 const profile=await fetch('https://shiftsometimber.co.uk/v1/profile',{headers});const own=await profile.json();if(own.profile?.source!==s.tag||own.profile.id!==s.members[0].id)throw Error('Synthetic identity did not match');
 for(const p of ['/member/life-back/support','/assets/my-timber-layout.mjs','/member/dashboard?timber=stuff','/assets/member-experience/programme-shed.mjs','/v1/life-back','/member/life-back/support','/assets/my-timber-layout.mjs','/member/dashboard?timber=support']){if(Date.now()>until-10000)break;const r=await fetch('https://shiftsometimber.co.uk'+p,{headers,signal:AbortSignal.timeout(9000)}),body=await r.text();events.push({request:p,status:r.status,bytes:body.length,resourceFailure:/Error 1102|exceeded resource limits/.test(body)});save();}
 await new Promise(r=>setTimeout(r,2500));
}catch(e){events.push({diagnosticError:e.message});save();}finally{clearTimeout(timer);children.forEach(c=>c.kill('SIGTERM'));save();}
