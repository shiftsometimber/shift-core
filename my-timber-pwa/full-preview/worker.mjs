// Whole-site verification on the existing isolated staging host, never production.
import staging from '../../preview/stabilisation/worker.mjs';
import {pwaAssets,withPwa} from '../presentation.mjs';
import {pwaReminderRoutes} from '../reminders.mjs';
export default {async fetch(request,env,ctx){
 const u=new URL(request.url);
 if(u.hostname!=='shift-stabilisation-preview.matobrien.workers.dev'||env.SHIFT_ENVIRONMENT!=='stabilisation-preview-20260917'||Date.now()>=Date.parse(env.STAGING_EXPIRES_AT||0))return new Response('Preview unavailable',{status:404});
 const asset=pwaAssets(request);if(asset)return asset;
 if(u.pathname.startsWith('/v1/my-timber-pwa/'))return pwaReminderRoutes(request,env);
 return withPwa(request,await staging.fetch(request,env,ctx));
}};
