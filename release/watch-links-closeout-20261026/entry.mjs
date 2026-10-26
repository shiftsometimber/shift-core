import original from '../treatments-presentation-20261021/worker.mjs';
import {repairWatchResponse} from './links.mjs';
export default {...original,async fetch(request,env,ctx){return repairWatchResponse(request,await original.fetch(request,env,ctx));}};
