// Narrow public-terms overlay around the exact current live Core.
// Clinical, payment, stock, supplier, communications and all RPC exports are preserved.
import original from '__MY_TIMBER_CURRENT_CORE__';
export * from '__MY_TIMBER_CURRENT_CORE__';
import {assessmentSaleTermsResponse} from './assessment-sale-terms.mjs';
export default {...original,async fetch(request,env,ctx){
 const path=new URL(request.url).pathname.replace(/\/+$/,'');
 if(!['/terms-of-sale','/refunds'].includes(path)||!['GET','HEAD'].includes(request.method))return original.fetch(request,env,ctx);
 const upstream=request.method==='HEAD'?new Request(request,{method:'GET'}):request;
 return assessmentSaleTermsResponse(request,await original.fetch(upstream,env,ctx));
}};
