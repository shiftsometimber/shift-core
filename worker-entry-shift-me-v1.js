import base from './worker-entry-v6.js';
import {shiftMeRoutes} from './shift-me-v1.js';

export default {
  async fetch(request,env,ctx){
    const route=await shiftMeRoutes(request,env,ctx);
    if(route)return route;
    return base.fetch(request,env,ctx);
  },
  async scheduled(controller,env,ctx){
    return base.scheduled(controller,env,ctx);
  }
};
