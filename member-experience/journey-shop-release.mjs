// Add the approved Journey/Shop without replacing the currently serving support,
// account, catalogue, clinical, commerce, public-page or scheduled handlers.
import {journeyDataRoutes} from './journey-data.mjs';
import {journeyPageRoutes} from './journey-page.mjs';
import {lifeBackRoutes} from './life-back-routes.mjs';
import {shopPageRoutes} from './shop-routes.mjs';
import {shopNavigationAsset,withShopNavigation} from './shop-navigation.mjs';
import {memberBasketRoutes} from './shop-basket.mjs';
import {withJourneyShopAssets} from './journey-shop-assets.mjs';

const origins=new Set(['https://shiftsometimber.co.uk','https://www.shiftsometimber.co.uk']);
const release='journey-shop-20261031-v1';
function mark(response){
 const headers=new Headers(response.headers);
 headers.set('X-My-Timber-Journey-Shop',release);
 return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
}
function cors(request,response){
 const origin=request.headers.get('Origin');
 if(!origins.has(origin)||origin===new URL(request.url).origin)return response;
 const headers=new Headers(response.headers);
 headers.set('Access-Control-Allow-Origin',origin);
 headers.set('Access-Control-Allow-Credentials','true');
 headers.append('Vary','Origin');
 return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
}
// Read only a bounded clone; the existing handler still receives its untouched
// request for all legacy support operations and invalid/non-Journey input.
async function isJourneyWrite(request){
 if(request.method!=='POST')return false;
 const clone=request.clone(),reader=clone.body?.getReader();
 if(!reader)return false;
 let size=0;const parts=[];
 try{
  for(;;){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;
   if(size>8000){void reader.cancel().catch(()=>{});return false;}parts.push(value);
  }
  const bytes=new Uint8Array(size);let at=0;for(const part of parts){bytes.set(part,at);at+=part.length;}
  const body=JSON.parse(new TextDecoder().decode(bytes));
  return !!body&&typeof body==='object'&&!Array.isArray(body)&&typeof body.action==='string'&&body.action.startsWith('journey-');
 }catch{return false;}finally{reader.releaseLock();}
}
export function wrapJourneyShopService(original){return {
 ...original,
 async fetch(request,env,ctx){
  if(env.MEMBER_EXPERIENCE_V1_ENABLED!=='true')return original.fetch(request,env,ctx);
  const path=new URL(request.url).pathname;
  if(path==='/v1/life-back/journey'){
   if(request.method==='OPTIONS'){
    const origin=request.headers.get('Origin'),allowed=origins.has(origin)||origin===new URL(request.url).origin;
    return new Response(null,{status:allowed?204:403,headers:allowed?{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Credentials':'true','Access-Control-Allow-Methods':'GET, OPTIONS','Access-Control-Allow-Headers':'Content-Type','Vary':'Origin'}:{}});
   }
   return cors(request,mark(await journeyDataRoutes(request,env)));
  }
  if(path==='/v1/life-back'&&await isJourneyWrite(request))return cors(request,mark(await lifeBackRoutes(request,env)));
  const owned=journeyPageRoutes(request,env)||shopNavigationAsset(request)||await memberBasketRoutes(request,env)||await shopPageRoutes(request,env);
  if(owned)return mark(await withShopNavigation(request,owned,env));
  const response=await original.fetch(request,env,ctx);
  return withShopNavigation(request,await withJourneyShopAssets(request,response),env);
 }
};}
