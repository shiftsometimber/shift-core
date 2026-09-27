import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
// Read-only configuration proof. Never log the API response or any credentials.
export function validateGateway(g){
 assert.equal(g.id,'shift-ai');
 assert.equal(g.authentication,true,'Gateway authentication must be enabled');
 assert.equal(g.collect_logs,false,'Gateway prompt/response logging must be disabled');
 assert(!g.logpush&&!g.otel?.length,'Gateway prompt export must be disabled');
 assert(!g.retry_max_attempts||g.retry_max_attempts===1,'Gateway retries must be disabled');
 assert(!g.workers_ai_billing_mode||g.workers_ai_billing_mode==='postpaid','Keep existing standard Workers AI billing');
 assert(g.rate_limiting_limit>0&&g.rate_limiting_interval>0,'Gateway rate limiting must be enabled');
 assert.equal(g.spend_limits?.enabled,true,'Spend limits must be enabled');
 const rules=g.spend_limits.rules.filter(r=>r.enabled!==false&&r.limitType==='cost'&&!r.model&&!r.provider&&!Object.keys(r.metadata||{}).length);
 assert(rules.some(r=>r.limit===2&&r.window===86400&&r.technique==='sliding'),'Require shared $2 per rolling day');
 return true;
}
async function main(){
 const account=process.env.CLOUDFLARE_ACCOUNT_ID,token=process.env.CLOUDFLARE_API_TOKEN;
 assert(account&&token,'Existing Cloudflare credential is required');
 const r=await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/ai-gateway/gateways/shift-ai`,{headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(20000)});
 if(!r.ok)throw Error('Read-only gateway settings verification HTTP '+r.status+'; existing deployment credential may need AI Gateway Read permission');
 const data=await r.json();assert(data.success&&data.result,'Gateway settings response failed');const g=data.result;
 const report={at:new Date().toISOString(),id:g.id,authentication:g.authentication,collectLogs:g.collect_logs,logpush:!!g.logpush,hasOtel:!!g.otel?.length,retryMaxAttempts:g.retry_max_attempts??null,billing:g.workers_ai_billing_mode??'postpaid',rateLimit:{limit:g.rate_limiting_limit,interval:g.rate_limiting_interval,technique:g.rate_limiting_technique},spendEnabled:g.spend_limits?.enabled,rules:(g.spend_limits?.rules||[]).map(r=>({limit:r.limit,window:r.window,technique:r.technique,enabled:r.enabled!==false,limitType:r.limitType,scoped:!!(r.model||r.provider||Object.keys(r.metadata||{}).length)}))};
 const dir=process.argv[2]||'evidence/shift-ai-real-probe';mkdirSync(dir,{recursive:true});writeFileSync(dir+'/gateway-settings.json',JSON.stringify(report,null,2));console.log('SHIFT_GATEWAY_SETTINGS '+JSON.stringify(report));validateGateway(g);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)main().catch(e=>{console.error(e.message);process.exitCode=1});
