import {routes,json} from './routes.mjs';
export default {async fetch(request,env){const response=await routes(request,env);if(response)return response;return json({ok:false,error:'route_not_found'},404);}};
