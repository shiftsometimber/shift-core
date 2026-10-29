import {memberBasketAsset} from './shop-navigation.mjs';

// Keep the exact serving shared basket/payment checks. The private adapter adds
// account lifecycle reset and stale-response rejection; it creates no payments.
export function bindMemberBasket(source){
  function once(before,after){const first=source.indexOf(before);if(first<0||source.indexOf(before,first+before.length)!==-1)throw Error('Shared basket contract changed: '+before.slice(0,50));source=source.slice(0,first)+after+source.slice(first+before.length);}
  once("let account='',attempts=[],saved=null,notice='';","let account='',attempts=[],saved=null,notice='';let memberBasketEpoch=0;");
  once('function render(){','function render(){\n   if(document.body.dataset.memberSession!=="ready"){fab.hidden=true;inner.replaceChildren();if(panel.open)panel.close();return;}');
  const begin=source.indexOf('async function load(){'),end=source.indexOf('async function resume(',begin);
  if(begin<0||end<0)throw Error('Shared basket load boundary changed');
  let load=source.slice(begin,end);
  if(!load.includes('const body=await response.json();'))throw Error('Shared basket response boundary changed');
  load=load.replace('async function load(){','async function load(){const memberViewEpoch=++memberBasketEpoch;saved=read();')
   .replace("if(!response.ok){account='';",'if(memberViewEpoch!==memberBasketEpoch||document.body.dataset.memberSession!=="ready")return;\n     if(!response.ok){account=\'\';')
   .replace('const body=await response.json();','const body=await response.json();if(memberViewEpoch!==memberBasketEpoch||document.body.dataset.memberSession!=="ready")return;')
   .replace("}catch{account='';attempts=[];notice=", "}catch{if(memberViewEpoch!==memberBasketEpoch)return;account='';attempts=[];notice=");
  source=source.slice(0,begin)+load+source.slice(end);
  once('async function resume(channel){','async function resume(channel){const memberResumeEpoch=memberBasketEpoch;if(!account||document.body.dataset.memberSession!=="ready")return;');
  once("if(body.accountReference!==account)throw Error('Your account changed. Please sign in again.');",'if(memberResumeEpoch!==memberBasketEpoch||document.body.dataset.memberSession!=="ready")return;\n     '+"if(body.accountReference!==account)throw Error('Your account changed. Please sign in again.');");
  if(source.includes('window.SHIFT_EXTRAS={')){
    once('proceed.onclick=async()=>{if(busy)return;busy=true;', 'proceed.onclick=async()=>{if(busy)return;const memberDecision=decision,memberAccount=account,memberExtrasEpoch=epoch;busy=true;');
    once('await refresh();if(decision?.medicine)', 'await refresh();if(decision!==memberDecision||account!==memberAccount||epoch!==memberExtrasEpoch+1||document.body.dataset.memberSession!=="ready")return;if(decision?.medicine)');
    once("location.assign(url.href);}}catch(error){notice(error.message);proceed.disabled=false;}", 'if(decision!==memberDecision||account!==memberAccount||epoch!==memberExtrasEpoch+1||document.body.dataset.memberSession!=="ready")return;'+"location.assign(url.href);}}catch(error){notice(error.message);proceed.disabled=false;}");
  }
  once('\n load();\n})();',String.raw`
 document.addEventListener('sst:member-basket-clear',()=>{++memberBasketEpoch;account='';attempts=[];saved=null;notice='';document.dispatchEvent(new CustomEvent('sst:basket-rendered',{detail:{account:'',locked:true}}));render();fab.hidden=true;inner.replaceChildren();if(panel.open)panel.close();});
 document.addEventListener('sst:member-basket-refresh',()=>{if(document.body.dataset.memberSession==='ready')load();});
 document.addEventListener('sst:member-basket-open',async()=>{const version=memberBasketEpoch+1;await load();if(version===memberBasketEpoch&&account&&document.body.dataset.memberSession==='ready'){render();if(!panel.open)panel.showModal();}});
 if(document.body.dataset.memberSession==='ready')load();
})();`);
  return source;
}

export async function memberBasketRoutes(request,env,fetchPublic=globalThis.fetch){
  if(env.MEMBER_EXPERIENCE_V1_ENABLED!=='true'||new URL(request.url).pathname!==memberBasketAsset||!['GET','HEAD'].includes(request.method))return null;
  const headers={'Content-Type':'text/javascript; charset=utf-8','Cache-Control':'no-store, private','X-Content-Type-Options':'nosniff'};
  try{
    const response=await fetchPublic(new Request('https://shiftsometimber.co.uk/assets/shift-purchase-basket-v1.js',{headers:{Accept:'text/javascript'},redirect:'error',signal:AbortSignal.timeout(12000)}));
    if(!response.ok||!/(?:javascript|ecmascript)/i.test(response.headers.get('Content-Type')||''))throw Error('Shared basket unavailable');
    const source=await response.text();if(source.length>512000)throw Error('Basket asset exceeded its boundary');
    const script=bindMemberBasket(source);
    return new Response(request.method==='HEAD'?null:script,{headers});
  }catch{return new Response(request.method==='HEAD'?null:'/* Shared basket unavailable. No payment or selection has been created. */',{status:503,headers});}
}
