// Dashboard is served by a separate existing owner. Preserve all its methods,
// bindings, schedules and account handlers; add only the approved member chrome.
import {withShopNavigation} from './shop-navigation.mjs';
export function wrapJourneyShopDocuments(original){return {
 ...original,
 async fetch(request,env,ctx){
  const response=await original.fetch(request,env,ctx);
  if(env.MY_TIMBER_V6_RELEASE_ENABLED!=='true')return response;
  return withShopNavigation(request,response,{...env,MEMBER_EXPERIENCE_V1_ENABLED:'true'});
 }
};}
