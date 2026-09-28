import preview from '../growth-member/worker.mjs';
import {withAppLayout} from '../../app-layout-live.mjs';
export default {async fetch(request,env,ctx){const u=new URL(request.url);if(env.SHIFT_ENVIRONMENT!=='stabilisation-preview-20260917'||!/^shift-stabilisation-preview\.[a-z0-9-]+\.workers\.dev$/.test(u.hostname)||!env.STAGING_EXPIRES_AT||Date.now()>=Date.parse(env.STAGING_EXPIRES_AT))return new Response('Preview unavailable',{status:404});return withAppLayout(request,await preview.fetch(request,env,ctx));}};
