import {fail} from './domain.mjs';
const hash=async v=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(v))),b=>b.toString(16).padStart(2,'0')).join('');
// The edge supplies CF-Connecting-IP. Missing IP fails closed, never falls back to an attacker-supplied XFF.
export async function limitProfessionalAuth(request,env,kind,subject,at=Date.now()){
 const ip=request.headers.get('CF-Connecting-IP');if(!ip||ip.length>80||!env.DB)fail(503,'auth_rate_limit_unavailable');
 const seconds=Math.floor(at/1000),bucket=Math.floor(seconds/300)*300,day=Math.floor(seconds/86400)*86400;
 const definitions=[['ip:'+ip,bucket,20,seconds+600],['daily-ip:'+ip,day,150,day+172800],['subject:'+kind+':'+subject,bucket,kind==='mfa'?6:8,seconds+600]];
 const statements=[];for(const [scope,start,,expiry]of definitions){const key=await hash(scope);statements.push(env.DB.prepare('INSERT INTO partner_auth_limits(scope_hash,window_start,expires_at,attempt_count) VALUES(?,?,?,1) ON CONFLICT(scope_hash,window_start) DO UPDATE SET attempt_count=attempt_count+1 RETURNING attempt_count').bind(key,start,expiry));}
 // D1 batch executes transactionally and returns each RETURNING row. Remove expired cache counters in bounded batches.
 let result;try{await env.DB.prepare('DELETE FROM partner_auth_limits WHERE rowid IN (SELECT rowid FROM partner_auth_limits WHERE expires_at<=? LIMIT 100)').bind(seconds).run();result=await env.DB.batch(statements);}catch{fail(503,'auth_rate_limit_unavailable');}
 if(result.length!==definitions.length)fail(503,'auth_rate_limit_unavailable');
 for(let i=0;i<result.length;i++){const count=result[i].results?.[0]?.attempt_count;if(!Number.isInteger(count))fail(503,'auth_rate_limit_unavailable');if(count>definitions[i][2])fail(429,'too_many_authentication_attempts');}
}
