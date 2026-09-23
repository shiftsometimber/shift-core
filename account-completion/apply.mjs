// Guarded modifications against the current released source. Never runs on main.
import fs from 'node:fs';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
assert.equal(process.env.GITHUB_REF,'refs/heads/fix/account-completion-20260923');
const edits=[];
function edit(path,sha,marker,fn){const before=fs.readFileSync(path,'utf8');if(before.includes(marker))return;assert.equal(execFileSync('git',['hash-object',path],{encoding:'utf8'}).trim(),sha,'Source drift: '+path);const after=fn(before);assert.notEqual(after,before);assert(after.includes(marker));fs.writeFileSync(path,after);edits.push(path);}
function once(text,old,replacement){assert.equal(text.split(old).length,2,'Expected one exact patch anchor: '+old.slice(0,100));return text.replace(old,replacement);}
edit('member-experience/member-details-routes.mjs','ec49ace7906ba0bf35c356ed76552da463097709','memberDeliveryRoute',s=>{
 s="import {memberDeliveryRoute} from './member-delivery-routes.mjs';\n"+s;
 s=once(s,'export async function memberDetailsRoute(request,env){','export async function memberDetailsRoute(request,env){\n const delivery=await memberDeliveryRoute(request,env);if(delivery)return delivery;');
 return once(s,'const contact=JSON.stringify(Object.fromEntries(CONTACT.map(k=>[k,values[k]])))','const savedContact=JSON.parse(current.row?.body_json||\'{}\');\n const contact=JSON.stringify({...Object.fromEntries(CONTACT.map(k=>[k,values[k]])),...(savedContact.delivery?{delivery:savedContact.delivery}:{})})');
});
edit('member-experience/member-details.mjs','a7fb05255c1b849a044fca198d6528482dfe3dd3','deliveryMarkup',s=>{
 s="import {deliveryMarkup,deliveryRuntime} from './member-delivery-client.mjs';\n"+s;
 s=once(s,'  </form></section>`;','  </form>${deliveryMarkup}</section>`;');
 s=once(s,"message('Member details saved.');save.textContent='Save member details';","message('Member details saved.');save.textContent='Save member details';window.dispatchEvent(new Event('memberDetailsSaved'));");
 s=once(s,'load();\n})();`;','window.addEventListener(\'memberDeliverySaved\',()=>{if(!busy&&!dirty)load();else message(\'Delivery address saved. Reload account details before saving unsaved home edits.\');});\nload();\n})();`+deliveryRuntime;');
 return s;
});
edit('frontend/medicine-front-door/treatment-assessment.html','0603847db45d10ae20d2924278c95a0ff47a2849','/assets/member-experience/gp-form.mjs',s=>once(s,'</body>','<script defer src="/assets/member-experience/gp-form.mjs"></script>\n</body>'));
console.log('Bounded candidate paths changed:',JSON.stringify(edits));
