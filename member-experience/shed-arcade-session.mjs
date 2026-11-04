// Account-scoped entertainment cache. Never adopts the prototypes' shared keys.
export function arcadeSession(s){
 const owner=String(s.state().accountId),key='mt:shed-arcade:'+owner;let local={owner,values:{},pending:{}};
 try{const old=JSON.parse(localStorage.getItem(key)||'null');if(old?.owner===owner)local=old;}catch{}
 const games=s.games,merge=(g,a,b)=>g.kind==='stars'?Array.from({length:7},(_,i)=>Math.max(a?.[i]||0,b?.[i]||0)):g.kind==='time'?(a>0&&b>0?Math.min(a,b):a>0?a:b||0):Math.max(a||0,b||0);
 let state=s.state().arcade||{bests:{},muted:true,nickname:''},syncing=null,closed=false;
 const persist=()=>{try{localStorage.setItem(key,JSON.stringify(local));}catch{}};
 function accept(next){state={...next,bests:{...next.bests}};for(const g of games){const v=merge(g,state.bests[g.key],local.values[g.key]);if(v!==undefined){state.bests[g.key]=v;local.values[g.key]=v;}}if(local.pending.sound)state.muted=local.pending.sound.muted;if(local.pending.nickname)state.nickname=local.pending.nickname.nickname;state.muted=state.muted!==false;s.update(state);persist();}
 accept(state);
 async function sync(){
  if(syncing||closed||!navigator.onLine||!s.ready()||String(s.state()?.accountId)!==owner)return syncing;
  syncing=(async()=>{for(let attempts=0;Object.keys(local.pending).length&&attempts<32;attempts++){const slot=Object.keys(local.pending)[0];
   if(closed||!s.ready()||String(s.state()?.accountId)!==owner)break;
   const item=local.pending[slot],intent=JSON.stringify(item);
   try{const result=await s.request('/v1/my-timber/arcade',item);if(String(result.accountId)!==owner)break;if(JSON.stringify(local.pending[slot])===intent)delete local.pending[slot];accept(result.arcade);}
   catch{persist();break;}
  }})().finally(()=>{syncing=null;});return syncing;
 }
 function queue(slot,item){local.pending[slot]=item;persist();sync();}
 function get(k,d){if(k==='mt_arcade_muted')return state.muted!==false;if(k==='mt_saw_handle')return state.nickname||'';return local.values[k]??state.bests[k]??d;}
 function set(k,v){
  if(closed)return;local.values[k]=v;
  if(k==='mt_arcade_muted'){state.muted=!!v;queue('sound',{action:'sound',muted:!!v});}
  else if(k==='mt_saw_handle'){state.nickname=String(v);queue('nickname',{action:'nickname',nickname:String(v)});}
  else {const g=games.find(g=>g.key===k);if(g){const value=merge(g,state.bests[k],v);state.bests[k]=value;local.values[k]=value;queue(g.id,{action:'best',game:g.id,value});}}
  persist();s.update(state);
 }
 function nudgeAllowed(){const n=state.nudge;if(!n||n.dismissed||n.shown.length>=2||n.shown.some(x=>x.on===state.on))return false;return !n.shown.length||Date.parse(state.on+'T12:00:00Z')-Date.parse(n.shown.at(-1).on+'T12:00:00Z')>=2*86400000;}
 async function nudge(){if(!nudgeAllowed()||!navigator.onLine)return false;try{const r=await s.request('/v1/my-timber/arcade',{action:'nudge-seen'});accept(r.arcade);return true;}catch{return false;}}
 function dismiss(){state.nudge.dismissed=true;queue('nudge-dismiss',{action:'nudge-dismiss'});s.update(state);}
 const online=()=>sync();addEventListener('online',online);
 return {get,set,sync,accept,nudge,dismiss,state:()=>state,close(){closed=true;removeEventListener('online',online);},purge(){try{localStorage.removeItem(key);}catch{};local={owner,values:{},pending:{}};}};
}
