// Existing account credentials only. Retry explicit authentication denials after one read-only refresh; never retry unknown writes.
import {readFileSync} from 'node:fs';import {spawnSync} from 'node:child_process';import assert from 'node:assert/strict';
const config='/Users/shiftsometimberltd/Library/Preferences/.wrangler/config/default.toml';
const currentToken=()=>process.env.CLOUDFLARE_API_TOKEN||readFileSync(config,'utf8').match(/^oauth_token\s*=\s*"([^"\n]+)"/m)?.[1];
let refreshed=false;
export async function cloudflareRequest(path,method='GET',body){
 for(let attempt=0;attempt<2;attempt++){
  const used=currentToken();assert(used,'Existing Cloudflare credential absent');const multi=body instanceof FormData;
  const response=await fetch('https://api.cloudflare.com/client/v4'+path,{method,headers:{Authorization:'Bearer '+used,...(body&&!multi?{'Content-Type':'application/json'}:{})},body:multi?body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(55000)}),j=await response.json();
  const authenticationDenied=[401,403].includes(response.status)&&(j.errors||[]).some(e=>e.code===10000);
  if(authenticationDenied&&attempt===0&&!process.env.CLOUDFLARE_API_TOKEN){
   // Another authorised job may already have refreshed the shared credential while this request was in flight.
   if(currentToken()===used){
    assert(!refreshed,'Credential still denied after the existing refresh');refreshed=true;
    const r=spawnSync(process.execPath,['/Users/shiftsometimberltd/.npm/_npx/095711ed2bffd7f3/node_modules/wrangler/bin/wrangler.js','deployments','list','--name','shift-core'],{encoding:'utf8',timeout:60000});assert.equal(r.status,0,'Existing read-only credential refresh failed');
   }continue;
  }
  assert(response.ok&&j.success,method+' '+path+' HTTP '+response.status+' '+JSON.stringify(j.errors));return j.result;
 }throw Error('Cloudflare authentication remains unavailable');
}