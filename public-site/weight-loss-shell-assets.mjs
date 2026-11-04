// The shared browser shell rebuilds three navigation links after page load.
// Keep its exact current script; change only the three approved label literals.
export const WEIGHT_LOSS_CTA_RELEASE='explore-weight-loss-assets-20261104';
export function relabelWeightLossCtas(source){
 const count=source.split('Start Here').length-1;
 if(!count)return source;
 if(count!==3)throw new Error('Shared shell label source changed; reconcile before serving');
 return source.split('Start Here').join('Explore Weight Loss');
}
export function wrapWeightLossShellAssets(original){return {...original,async fetch(request,env,ctx){
 const response=await original.fetch(request,env,ctx),path=new URL(request.url).pathname;
 if(request.method!=='GET'||!response.ok||!['/assets/v42.js','/assets/home-shell-v1.js'].includes(path)||!/javascript/i.test(response.headers.get('Content-Type')||''))return response;
 const body=relabelWeightLossCtas(await response.text()),headers=new Headers(response.headers);
 for(const name of ['Content-Length','Content-Encoding','ETag','Last-Modified'])headers.delete(name);
 headers.set('X-Shift-Weight-Loss-CTA',WEIGHT_LOSS_CTA_RELEASE);
 return new Response(body,{status:response.status,statusText:response.statusText,headers});
}};}
export {wrapWeightLossShellAssets as wrapWeightLossCta};
