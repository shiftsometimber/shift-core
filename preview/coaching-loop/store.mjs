export const sources=Object.freeze(['scale','wearable','calendar','dose','photos','voice']);
export const uid=()=>crypto.randomUUID();
export function initialState(){return {facts:[],permissions:Object.fromEntries(sources.map(s=>[s,false])),settings:{proactive:false,followup:false,quietStart:'22:00',quietEnd:'08:00',timezone:'Europe/London',weeklyDay:null},stage:'Just starting',mode:'elsewhere',components:['energy'],readings:[],doses:[],actions:[],queue:[],outcomes:[],rejected:[],pausedTypes:[],dismissedPatterns:[],nightRuns:[],calendar:[],reviews:[],touches:[],weeklyPlans:[],lastActivity:null,pendingWant:null};}
export async function load(DB,member){
 const row=await DB.prepare('SELECT revision,body FROM coaching_test_memory WHERE member_id=?').bind(member).first();
 if(!row)throw Object.assign(Error('test_account_missing'),{status:404});
 return{revision:row.revision,state:JSON.parse(row.body)};
}
export async function seed(DB,member,state=initialState()){
 if(!/^synthetic-[a-z0-9-]{1,60}$/.test(member))throw Error('synthetic_accounts_only');
 await DB.prepare('INSERT OR IGNORE INTO coaching_test_memory VALUES(?,0,?,?)').bind(member,JSON.stringify(state),uid()).run();
}
// One compare-and-swap protects all logical stores. No per-request state is global.
export async function mutate(DB,member,type,operation,now=Date.now(),requiresProactive=false){
 const {revision,state}=await load(DB,member);const result=await operation(state);const mutation=uid();
 const writes=await DB.batch([
  DB.prepare('UPDATE coaching_test_memory SET body=?,revision=revision+1,mutation_id=? WHERE member_id=? AND revision=?'+(requiresProactive?' AND EXISTS (SELECT 1 FROM coaching_test_control WHERE id=1 AND proactive_enabled=1)':'')).bind(JSON.stringify(state),mutation,member,revision),
  DB.prepare("INSERT INTO coaching_test_audit_events SELECT ?,?,?,?,?,?,?,? WHERE EXISTS (SELECT 1 FROM coaching_test_memory WHERE member_id=? AND mutation_id=?)").bind(mutation,member,now,type,result?.outcome||'recorded',JSON.stringify(result?.dataUsed||[]),result?.reason||type,result?.channel||'in_app_test',member,mutation)
 ]);
 if(!writes[0].meta?.changes)throw Object.assign(Error('state_changed_retry'),{status:409});
 return{state,result,revision:revision+1};
}
export const fact=(state,key)=>state.facts.find(f=>f.key===key&&f.confirmed);
export function cancelAffected(state,ids=[],source=null){
 const matches=a=>source?a.sources.includes(source):a.dataUsed.some(id=>ids.includes(id));
 const cancelled=state.actions.filter(a=>a.status!=='cancelled'&&matches(a));
 for(const a of cancelled){a.status='cancelled';a.reason='';a.dataUsed=[];a.title='';}
 const actionIds=new Set(cancelled.map(a=>a.id));
 state.queue=state.queue.filter(q=>!actionIds.has(q.actionId)&&!(source&&q.sources.includes(source))&&!q.dataUsed.some(id=>ids.includes(id)));
 state.weeklyPlans=state.weeklyPlans.filter(p=>!(source&&p.sources.includes(source))&&!p.dataUsed.some(id=>ids.includes(id)));
 state.pendingWant=null;return cancelled.length;
}
