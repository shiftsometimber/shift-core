// Small native entry. Unchanged legacy handlers remain in their own serving
// service; they are not parsed/initialised for each shell asset or native page.
import {wrapV7} from './v7-release.mjs';
import {withShopNavigation} from './shop-navigation.mjs';
import {supportSummary} from './support-plan.mjs';
function application(env){return wrapV7({fetch:request=>{if(/^\/member\/support(?:\/|$)/.test(new URL(request.url).pathname)&&env.SUPPORT)return env.SUPPORT.fetch(request);const h=new Headers(request.headers);h.set('X-My-Timber-Legacy-Release',env.MY_TIMBER_V6_RELEASE_ENABLED||'false');return env.MEMBER_LEGACY.fetch(new Request(request,{headers:h}));},scheduled:event=>event.cron?env.V7_OFFERS.legacyScheduled({event:{cron:event.cron,scheduledTime:event.scheduledTime},release:env.MY_TIMBER_V6_RELEASE_ENABLED||'false'}):null},{
 withShopNavigation,supportSummary,
 prepareOffers:(_DB,_prefs,at,userId)=>env.V7_OFFERS.prepareOffers({userId,at}),
 recipeById:(_DB,id)=>env.V7_OFFERS.recipeById({id})
});}
export default {
 fetch(request,env,ctx){return application(env).fetch(request,env,ctx);},
 scheduled(event,env,ctx){return application(env).scheduled(event,env,ctx);}
};
