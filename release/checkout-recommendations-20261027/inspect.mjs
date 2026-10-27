import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
const account='9e5386dcf455be34c582d93f8bfc79e6',zone='66ec3268950adcfc837b7b8b2f8356ed',database='88f40aed-cb23-4372-8c94-8a73f48bc847';
const root='checkout-release';mkdirSync(root,{recursive:true});
async function cf(path,body){const r=await fetch('https://api.cloudflare.com/client/v4'+path,{method:body?'POST':'GET',headers:{Authorization:'Bearer '+process.env.CLOUDFLARE_API_TOKEN,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});const j=await r.json();assert(r.ok&&j.success,JSON.stringify(j.errors));return j.result;}
const routes=await cf('/zones/'+zone+'/workers/routes');
const scope=routes.filter(r=>/checkout|purchase-basket|treatment-order|treatment-options|medicine-front-door|supplements|\/mounjaro|\/wegovy|shift-health|hq\.shiftsometimber.co.uk\/(?:\*|index.html)?$/.test(r.pattern));
const owners=[...new Set(scope.map(r=>r.script).filter(Boolean))],versions={};
for(const owner of owners){const data=await cf('/accounts/'+account+'/workers/scripts/'+owner+'/deployments');const d=data.deployments.sort((a,b)=>b.created_on.localeCompare(a.created_on))[0];versions[owner]={deployment:d.id,versions:d.versions};}
const schema=(await cf('/accounts/'+account+'/d1/database/'+database+'/query',{sql:"SELECT name,sql FROM sqlite_master WHERE type='table' AND (name IN ('products','medicine_products','medicine_variants','supplement_products') OR name LIKE '%variant%')"}))[0].results;
const receipt={readOnly:true,routeCount:routes.length,scope,versions,schema};writeFileSync(root+'/inspection.json',JSON.stringify(receipt,null,2));console.log(JSON.stringify(receipt));
