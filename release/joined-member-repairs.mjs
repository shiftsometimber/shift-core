// Surgical repairs over the current core. Unrelated live code is retained.
import {joinedAssets} from './joined-member-assets.mjs';
import {treatmentRuntime} from '../member-experience/treatment-page.mjs';
import {grubPlanQualityClient} from '../member-experience/grub-plan-quality-client.mjs';
export const grubNutritionBefore=String.raw`function nutritionContextMarkup(){
 const info=workspace?.nutritionContext;if(!info?.days.length)return '';
 const line=d=>'<span>'+foodNumber(d.kcal)+' kcal</span><span>'+foodNumber(d.protein)+'g protein</span><span>'+foodNumber(d.fibre)+'g fibre</span>';
 return '<section class="grub-nutrition-context"><h3>How your plan adds up</h3><p>Per person, from the meals saved below. Snacks, drinks and unlogged food are not included. These are planned meals, not a record of what you ate.</p>'+info.days.map(d=>'<div class="grub-nutrition-row"><strong>Day '+d.day+' · '+d.meals+' meals</strong>'+line(d)+'</div>').join('')+'<div class="grub-nutrition-row"><strong>Whole saved plan</strong>'+line(info.totals)+'</div></section>';
}
`;
const revision='joined-member-20261023';
const hashes={
 '/member-my-journey-v2.js':'48b71ff5b1160f43832af6b02817c2e6c247999bb77eb4b0cbc955627992e44a',
 '/member-my-journey-checkin-v1.js':'c205147a011b1fbabd2460b996962538a91591d6fd9b5bffbd2455c5e17a42f0',
 '/assets/member-experience/treatment.mjs':'4bbd2b641c9004101851e21a70504583fb7d00c0915a0a49c39bfb0854aa6bd0'
};
export const toolSelectionBefore="if(!toolKeys.includes(key))key='today';chosen=key;syncTabs();";
export const toolSelectionAfter="if(!toolKeys.includes(key))key='today';if(push||key!=='today'){const today=document.getElementById('panel-today');if(today&&!today.classList.contains('active'))document.querySelector('.mp-tab[data-panel=\"today\"]')?.click();}chosen=key;syncTabs();";
export const askCopyRepairs=[
 [`<span class="confidence">'+safe(result.confidence)+' confidence</span>`,``],
 [`<div class="context"><strong>My Timber will receive:</strong> '+result.context.constraints.map(safe).join(' · ')+'</div>`,`<p>Review this adjustment in My Timber before saving it.</p>`],
 [`<div class="context"><strong>My Timber will only receive the practical part:</strong> '+result.context.constraints.map(safe).join(' · ')+'</div>`,`<p>Only the everyday adjustment is passed to My Timber. Your medical question is not included.</p>`],
 [`Ask Timber will pass “'+pending.situation.label+'” and its practical constraints to the governed Life changed? flow.`,`Review “'+pending.situation.label+'” in My Timber. Nothing changes until you choose and save an adjustment.`]
];
export const grubPlanBefore='Per person, from the meals saved below. Snacks, drinks and unlogged food are not included. These are planned meals, not a record of what you ate.';
export const grubPlanAfter='Per person, from your saved meal ideas. This is not a complete daily food allowance or a personalised nutrition target. Add meals, portions and snacks to suit your needs. Drinks and unlogged food are excluded; missing nutrition stays unknown. Planning a meal does not record it as eaten.';
export const joinedAssetPaths=new Set([...Object.keys(hashes),'/assets/my-timber-layout.mjs','/assets/ask-timber-phase8.js','/assets/member-experience/grub.mjs','/my-timber-v11.js']);
const digest=async s=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))].map(x=>x.toString(16).padStart(2,'0')).join('');
export async function repairMemberAsset(request,response){
 const path=new URL(request.url).pathname;
 if(request.method!=='GET'||!response.ok||!joinedAssetPaths.has(path))return response;
 let body=await response.text(),changed=false;
 if(hashes[path]){
  if(await digest(body)===hashes[path]){body=path==='/assets/member-experience/treatment.mjs'?treatmentRuntime:joinedAssets[path];changed=true;}
 }else{
  const edits=path==='/assets/my-timber-layout.mjs'?[[toolSelectionBefore,toolSelectionAfter]]:path==='/assets/ask-timber-phase8.js'?askCopyRepairs:path==='/assets/member-experience/grub.mjs'?[[grubNutritionBefore,grubPlanQualityClient]]:[["'/member/dashboard#lifeback'","'/member/life-back'"]];
  // Check every expected fragment before changing anything. Never partially
  // patch a newer independently released runtime.
  const expected=path==='/my-timber-v11.js'?3:1;
  if(edits.every(([before])=>body.split(before).length-1===expected)){
   for(const [before,after]of edits)body=body.split(before).join(after);changed=true;
  }
 }
 const headers=new Headers(response.headers);headers.set('X-Shift-Member-Repair',changed?revision:'source-changed-unpatched');
 if(changed&&path==='/assets/member-experience/grub.mjs')headers.set('X-Shift-Grub-Quality','grub-plan-quality-20261023');
 headers.set('Cache-Control','no-store, must-revalidate');for(const key of ['Content-Length','Content-Encoding','ETag','Last-Modified'])headers.delete(key);
 return new Response(body,{status:response.status,headers});
}
export async function repairAskDocument(request,response){
 if(!['/member/ask-timber','/member/ask-timber.html'].includes(new URL(request.url).pathname)||request.method!=='GET'||!response.ok||!response.headers.get('Content-Type')?.includes('text/html'))return response;
 const html=await response.text(),body=html.replace('<title>Ask Timber | My Timber preview</title>','<title>Ask Timber | My Timber</title>').replace(/(src=[\"']\/assets\/ask-timber-phase8\.js)(?:\?[^\"']*)?([\"'])/g,'$1?v=joined-member-20261023$2');
 const headers=new Headers(response.headers);headers.set('Cache-Control','no-store, must-revalidate');headers.set('X-Shift-Member-Repair',revision);for(const key of ['Content-Length','Content-Encoding','ETag','Last-Modified'])headers.delete(key);
 return new Response(body,{status:response.status,headers});
}
