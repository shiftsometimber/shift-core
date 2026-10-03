import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';

export async function ensureQueryRedaction({accountId,token,script='shift-core',fetcher=fetch}={}){
 assert(/^[a-f0-9]{32}$/.test(accountId||''),'Cloudflare account required');
 assert(token,'Cloudflare credential required');
 assert(/^[a-z0-9-]+$/.test(script),'Invalid script name');
 const base='https://api.cloudflare.com/client/v4/accounts/'+accountId+'/workers/scripts/'+script;
 const api=async(method,body)=>{
  const response=await fetcher(base+'/script-settings',{method,headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
  const data=await response.json();
  assert(response.ok&&data.success,'Query-redaction settings request failed: HTTP '+response.status);
  assert(data.result&&typeof data.result==='object','Missing script settings');
  return data.result;
 };
 const before=await api('GET');
 assert(before.observability&&typeof before.observability==='object','Missing observability settings');
 const expected=structuredClone(before);expected.observability.redact_query_string=true;
 if(before.observability.redact_query_string!==true)await api('PATCH',{observability:expected.observability});
 const after=await api('GET');assert.deepEqual(after,expected,'Query redaction not applied or unrelated script settings changed');
 return {at:new Date().toISOString(),queryRedactionEnabled:true,otherSettingsPreserved:true,changed:before.observability.redact_query_string!==true,retroactiveLogErasure:false};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const receipt=await ensureQueryRedaction({accountId:process.env.CLOUDFLARE_ACCOUNT_ID,token:process.env.CLOUDFLARE_API_TOKEN});
 mkdirSync('b1-runtime-release',{recursive:true});writeFileSync('b1-runtime-release/query-log-redaction.json',JSON.stringify(receipt,null,2));console.log(JSON.stringify(receipt));
}
