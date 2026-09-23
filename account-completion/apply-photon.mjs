// Apply only the exact Photon choice to the verified PR792 source. Never main.
import fs from 'node:fs';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
assert.equal(process.env.GITHUB_REF,'refs/heads/fix/account-completion-20260923');
function once(s,a,b){assert.equal(s.split(a).length,2,'Ambiguous patch anchor: '+a.slice(0,100));return s.replace(a,b);}
function edit(path,marker,fn){const s=fs.readFileSync(path,'utf8');if(s.includes(marker))return;assert.equal(s,execFileSync('git',['show','a09a339c0cb312cca78dea9063eace8688843eda:'+path],{encoding:'utf8'}),'Source drift: '+path);const next=fn(s);assert(next.includes(marker));fs.writeFileSync(path,next);}
edit('member-experience/member-details.mjs','photonSearchMarkup',s=>{
 s="import {photonSearchMarkup,photonAddressRuntime} from './photon-address-client.mjs';\n"+s;
 s=once(s,'>Find address</button>','>Search address suggestions</button>');
 s=once(s,'    <p class="md-help" id="memberAddressHelp"',"    ${photonSearchMarkup('member')}\n    <p class=\"md-help\" id=\"memberAddressHelp\"");
 s=once(s,'loaded=true;dirty=false;}',"loaded=true;dirty=false;window.dispatchEvent(new CustomEvent('memberAddressLoaded',{detail:{enabled:addressEnabled}}));}");
 const a=s.indexOf("$('memberFindAddress').addEventListener('click',"),b=s.indexOf("$('memberGpPractice').addEventListener('input',",a);assert(a>0&&b>a);s=s.slice(0,a)+'// Both address forms use the shared Photon component below.\n'+s.slice(b);
 return once(s,'})();`+deliveryRuntime+emailChangeRuntime;','})();`+deliveryRuntime+emailChangeRuntime+photonAddressRuntime;');
});
edit('member-experience/member-delivery-client.mjs','photonSearchMarkup',s=>{
 s="import {photonSearchMarkup} from './photon-address-client.mjs';\n"+s;
 s=once(s,'>Find delivery address</button>','>Search delivery suggestions</button>');
 s=once(s,'</button></div><p class="md-help" id="memberDeliveryLookupHelp"',"</button></div>${photonSearchMarkup('memberDelivery')}<p class=\"md-help\" id=\"memberDeliveryLookupHelp\"");
 s=once(s,'dirty=false;choice();}',"dirty=false;choice();window.dispatchEvent(new CustomEvent('memberDeliveryAddressLoaded',{detail:{enabled:configured}}));}");
 const a=s.indexOf("$('memberDeliveryFind').addEventListener('click',"),b=s.indexOf('load();\n})();`;',a);assert(a>0&&b>a);return s.slice(0,a)+'// Search and explicit selection are shared with the home form.\n'+s.slice(b);
});
for(const path of ['member-experience/member-details-routes.mjs','member-experience/member-delivery-routes.mjs'])edit(path,'photonEnabled',s=>"import {photonEnabled} from './photon-address.mjs';\n"+s.replace('Boolean(env?.MEMBER_ADDRESS_API_KEY)','photonEnabled(env)').replace('Boolean(env.MEMBER_ADDRESS_API_KEY)','photonEnabled(env)'));
edit('member-experience/member-details-lookups.mjs','photonAddressRoute',s=>{
 s="import {photonAddressRoute} from './photon-address.mjs';\n"+s;
 s=once(s,'export async function memberDetailsLookupRoute(request,env){','export async function memberDetailsLookupRoute(request,env){\n const address=await photonAddressRoute(request,env);if(address)return address;');
 const a=s.indexOf(" if(path.endsWith('address-search')){"),b=s.indexOf(" const query=String(u.searchParams.get('q')",a);assert(a>0&&b>a);s=s.slice(0,a)+s.slice(b);
 s=once(s,"if(!['/v1/member/details/gp-search','/v1/member/details/address-search'].includes(path))return null;","if(path!=='/v1/member/details/gp-search')return null;");
 return once(s,'export async function searchPostcode(postcode,key,transport=fetch){','// Legacy isolated adapter contract only; no active route calls this paid provider.\nexport async function searchPostcode(postcode,key,transport=fetch){');
});
edit('preview/member-details/prepare.mjs',"MEMBER_ADDRESS_PROVIDER='photon'",s=>once(s,"c.vars.MEMBER_GP_LOOKUP_ENABLED='true';","c.vars.MEMBER_ADDRESS_PROVIDER='photon'; // No paid key, trial or subscription.\nc.vars.MEMBER_GP_LOOKUP_ENABLED='true';"));
edit('preview/member-details/browser-proof.mjs','optional open-data search',s=>once(s,"assert(await page.locator('#memberFindAddress').isDisabled());assert.match(await page.locator('#memberAddressHelp').innerText(),/not connected/);row.checks.push('Email remains protected; unconfigured postcode lookup is explicitly labelled and manual save works');","assert(!(await page.locator('#memberFindAddress').isDisabled()));assert.match(await page.locator('#memberAddressSource').innerText(),/OpenStreetMap/);assert.match(await page.locator('#memberAddressSource').innerText(),/Some addresses are missing/);row.checks.push('Email remains protected; optional open-data search has clear limits and manual save still works');"));
console.log('Photon configured in the isolated preview only; paid provider is not reachable through the active route.');
