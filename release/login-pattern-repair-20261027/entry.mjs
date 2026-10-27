import original from '../../worker.js';
import {repairLoginResponse} from './repair.mjs';
export default {...original,async fetch(request,env,ctx){return repairLoginResponse(request,await original.fetch(request,env,ctx));}};
