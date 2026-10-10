import {verifyGithubOidc} from '../commissioning-identity-v1.js';
const fixture=/^shiftsometimber\+(?:finish|longitudinal|b03|structured|structured-authrender|sport|safety)-[a-z0-9-]+@gmail\.com$/i;
export async function beginCommissioningGrubTimings(request,env){
 if(env.COMMISSIONING_GRUB_TIMING_ENABLED!=='true'||request.method!=='GET'||new URL(request.url).pathname!=='/v1/grub/workspace')return null;
 const token=request.headers.get('X-Shift-Commissioning-OIDC');if(!token)return null;
 try{const start=performance.now(),identity=await verifyGithubOidc(token);if(!identity.ok)return null;return createGrubTimingCollector(performance.now()-start)}catch{return null}
}
export function createGrubTimingCollector(verificationMs=0){
 const started=performance.now(),phases=[],database=[];let authorised=false,overflow=false;
 const append=(list,item)=>{if(list.length<24)list.push(item);else overflow=true};
 const label=sql=>/FROM user_sessions/.test(sql)?'auth_session_select':/UPDATE user_sessions SET last_used_at/.test(sql)?'auth_last_used_update':/FROM structured_content/.test(sql)?'catalogue_select':/SELECT preferences FROM member_state/.test(sql)?'member_state_select':'other';
 return{
  identity(auth){authorised=!auth.response&&fixture.test(String(auth.user?.email||''));},
  measureSync(name,work){const start=performance.now();try{return work()}finally{append(phases,{name,elapsedMs:performance.now()-start})}},
  async measure(name,work){const start=performance.now();try{return await work()}finally{append(phases,{name,elapsedMs:performance.now()-start})}},
  wrapDB(db){return new Proxy(db,{get(target,key){if(key!=='prepare'){const v=Reflect.get(target,key,target);return typeof v==='function'?v.bind(target):v}
   return sql=>{const wrap=statement=>new Proxy(statement,{get(stmt,method){if(method==='bind')return(...values)=>wrap(stmt.bind(...values));
    const value=Reflect.get(stmt,method,stmt);if(['first','all','run'].includes(method))return async(...args)=>{const start=performance.now();try{const result=await value.apply(stmt,args);append(database,{phase:label(sql),method,bindingElapsedMs:performance.now()-start,executionMs:Number.isFinite(result?.meta?.duration)?result.meta.duration:null,ok:true});return result}catch(e){append(database,{phase:label(sql),method,bindingElapsedMs:performance.now()-start,executionMs:null,ok:false});throw e}};
    return typeof value==='function'?value.bind(stmt):value}});
    return wrap(target.prepare(sql))}
  }})},
  response(response){if(!authorised)return response;const timing={schema:'commissioning_grub_timing_v1',verificationMs,totalMs:performance.now()-started,phases,database,overflow};
   const headers=new Headers(response.headers);headers.set('Cache-Control','no-store');headers.set('X-Shift-Commissioning-Timing',JSON.stringify(timing));headers.set('Server-Timing',phases.map(x=>x.name+';dur='+x.elapsedMs.toFixed(3)).join(', '));
   return new Response(response.body,{status:response.status,statusText:response.statusText,headers})}
 }
}
