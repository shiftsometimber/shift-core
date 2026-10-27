// Reuse the existing complete forum, including replies, appeals and moderation.
import {timberShedForumPilotMarkup,timberShedForumPilotCSS,timberShedForumPilotClient} from './timber-shed-forum-ui.mjs';
import {withSessionState} from './session-state.mjs';
const marker="if(jobs.some(x=>x.status==='rejected'))say('shedForumStatus','Some community information could not be loaded. Please try refreshing.');";
if(timberShedForumPilotClient.split(marker).length!==2)throw Error('Reviewed forum bootstrap changed');
const legacy=timberShedForumPilotClient.replaceAll('/v1/timber-shed/forum/','/v1/life-back/shed/forum/').replace(marker,marker+"\n const requested=new URLSearchParams(location.search);if(requested.get('room')&&requested.get('thread'))await openThread(requested.get('room'),requested.get('thread'));else if(location.hash==='#mine')switchView('mine',false);else if(location.hash==='#moderation'&&!by('shedModNav').hidden)switchView('moderation',false);else if(location.hash==='#policy')by('shedViewPolicy').click();");
const markup=timberShedForumPilotMarkup.replace('trained moderator','moderator');
export const fullShedRuntime=String.raw`(()=>{'use strict';
 const realDocument=globalThis.document,host=realDocument.getElementById('fullShedRoot'),nativeFetch=globalThis.fetch.bind(globalThis);if(!host)return;
 let generation=0,mounted=false,loading=false;
 const ready=()=>realDocument.body.dataset.memberSession==='ready'&&realDocument.body.dataset.accountDeleted!=='1'&&!realDocument.hidden;
 function clear(){generation++;mounted=false;loading=false;host.replaceChildren();}
 async function sync(){if(!ready()){clear();return;}if(mounted||loading)return;loading=true;const g=generation;
  try{const response=await nativeFetch('/v1/profile',{credentials:'same-origin',cache:'no-store'});if(!response.ok)throw Error('Sign in to open your community.');const identity=await response.json();if(!identity.profile?.id)throw Error('Sign in to open your community.');if(g!==generation||!ready())return;
   const owned=realDocument.createElement('div');owned.innerHTML=MARKUP;host.replaceChildren(owned);mounted=true;
   const active=()=>g===generation&&mounted&&ready()&&owned.parentNode===host;
   const guardedFetch=async(...args)=>{if(!active())throw Error('Your account changed. Open the community again.');const result=await nativeFetch(...args);if(!active())throw Error('Your account changed. Open the community again.');return result;};
   startLegacy(owned,guardedFetch);
  }catch(error){if(g===generation&&ready()){const p=realDocument.createElement('p');p.setAttribute('role','status');p.textContent=error.message;host.replaceChildren(p);}}
  finally{if(g===generation)loading=false;}
 }
 function startLegacy(owned,guardedFetch){
  const document={getElementById:id=>owned.querySelector('#'+CSS.escape(id)),querySelectorAll:selector=>owned.querySelectorAll(selector),createElement:tag=>realDocument.createElement(tag)},fetch=guardedFetch;
 LEGACY
 }
 new MutationObserver(sync).observe(realDocument.body,{attributes:true,attributeFilter:['data-member-session','data-account-deleted']});
 realDocument.addEventListener('visibilitychange',sync);addEventListener('pagehide',clear);addEventListener('pageshow',sync);sync();
})();`.replace('MARKUP',JSON.stringify(markup)).replace(' LEGACY\n',' '+legacy+'\n');
export const fullShedHTML=withSessionState('<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Conversations · The Timber Shed</title><style>body{margin:0;background:#050505;color:#E7E3DA;font:16px/1.5 Arial,sans-serif}main,header{max-width:780px;margin:auto;padding:20px 16px}a{color:#E7E3DA}[hidden]{display:none!important}button,input,select,textarea{box-sizing:border-box;max-width:100%}'+timberShedForumPilotCSS+'#shedForumPilot .shed-form,#shedForumPilot .shed-topic-live,#shedForumPilot .shed-latest-card,#shedForumPilot .shed-notification{background:#0b0b0b;border-color:#707762}#shedForumPilot .shed-pilot-grid{display:block}#shedForumPilot .shed-form :is(button,input,textarea,select){font:inherit;min-height:44px}#shedForumPilot .shed-community-nav button{min-height:44px}#shedForumPilot .shed-topic-live.reply{margin-left:10px}#shedForumPilot .privacy{border-left:3px solid #707762;padding-left:14px}#shedForumPilot p{overflow-wrap:anywhere}</style></head><body><header><a href="/member/dashboard#today"><img src="/assets/favicon-shift-s-20261020.png" width="28" height="28" alt=""> MY TIMBER</a> · <a href="/member/life-back/shed">Back to my Shed</a></header><main><p>PRIVATE COMMUNITY · EVERYDAY PEER SUPPORT</p><p>The Shed is not monitored continuously. Treatment questions go to your own prescriber or pharmacist. <a href="/member/dashboard?timber=support#today">Urgent help and treatment contacts</a></p><section id="fullShedRoot"></section></main><script type="module" src="/assets/member-experience/programme-shed-conversations.mjs"></script></body></html>');
export function fullShedPageRoutes(request){const path=new URL(request.url).pathname,item=path==='/member/life-back/shed/conversations'?[fullShedHTML,'text/html']:path==='/assets/member-experience/programme-shed-conversations.mjs'?[fullShedRuntime,'text/javascript']:null;if(!item)return null;if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405});return new Response(request.method==='HEAD'?null:item[0],{headers:{'Content-Type':item[1]+'; charset=utf-8','Cache-Control':'no-store, private','Vary':'Cookie','X-Robots-Tag':'noindex, nofollow'}});}
