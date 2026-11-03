// Additive internal RPC helpers around the exact currently-serving programme.
// The default handler, its bindings and every existing safeguard are retained.
import {WorkerEntrypoint} from 'cloudflare:workers';
import original from '__MY_TIMBER_CURRENT_SERVING__';
export * from '__MY_TIMBER_CURRENT_SERVING__';
import {v7LoadGrubCatalogue as loadGrubCatalogue,v7EmptyGrub as emptyGrub,v7UsableCatalogue as usableCatalogue,v7RecommendationFor as recommendationFor,v7GrubMemberContext as grubMemberContext} from '__MY_TIMBER_CURRENT_HELPERS__';
import {v7Offer} from './v7-context.mjs';
export default {...original,fetch(request,env,ctx){
 const h=new Headers(request.headers),release=h.get('X-My-Timber-Legacy-Release');h.delete('X-My-Timber-Legacy-Release');
 return original.fetch(new Request(request,{headers:h}),release===null?env:{...env,MY_TIMBER_V6_RELEASE_ENABLED:release},ctx);
}};
export class V7Offers extends WorkerEntrypoint {
 async legacyScheduled({event,release}){if(event?.cron&&typeof original.scheduled==='function')return original.scheduled(event,{...this.env,MY_TIMBER_V6_RELEASE_ENABLED:release},this.ctx);return null;}
 async recipeById({id}){if(typeof id!=='string'||id.length>180)throw Error('Invalid recipe');return usableCatalogue(await loadGrubCatalogue(this.env.DB)).find(r=>r.id===id)||null;}
 async prepareOffers({userId,at}){
  if(!Number.isSafeInteger(userId)||userId<=0||!Number.isFinite(Date.parse(at)))throw Error('Invalid prepared offer request');
  const consent=await this.env.DB.prepare("SELECT granted FROM consents WHERE user_id=? AND consent_type='my_shift_health_tracking' ORDER BY id DESC LIMIT 1").bind(userId).first();
  const prefs=JSON.parse((await this.env.DB.prepare('SELECT preferences FROM member_state WHERE user_id=?').bind(userId).first())?.preferences||'{}');
  if(Number(consent?.granted)!==1||prefs.myJourney?.setup?.paused===true)throw Error('Tracking is off or paused');
  const recipes=usableCatalogue(await loadGrubCatalogue(this.env.DB)),offer=v7Offer(prefs,recipes,at,{emptyGrub,recommendationFor,grubMemberContext});
  return {on:offer.today||new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/London'}).format(new Date(at)),grubRevision:prefs.grubV2?.revision||0,foodChoices:JSON.stringify(prefs.food||{}),action:offer.action,alternatives:offer.alternatives,choices:[offer.action,...offer.alternatives]};
 }
}

// Read-only public catalogue adapter for isolated test deployments. No account
// cookie, authorisation, purchase or message is forwarded. Production keeps its
// existing public catalogue service bindings.
export class V7PublicCatalogues extends WorkerEntrypoint {
 async fetch(request){const u=new URL(request.url);if(request.method!=='GET'||!(/^\/shift-health\/testing(?:\/[a-z0-9-]{1,70})?$/.test(u.pathname)||['/shift-health/supplements-nutrition','/shop','/assets/shift-purchase-basket-v1.js'].includes(u.pathname)))return new Response('Not found',{status:404});return fetch('https://shiftsometimber.co.uk'+u.pathname,{headers:{Accept:'text/html'},redirect:'manual'});}
}
