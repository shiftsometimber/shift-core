// Preview-only capacity policy. Never imported by the production entry.
const HOST='shift-stabilisation-preview.matobrien.workers.dev';
export function previewAccountLimit(env,hostname){
 return hostname===HOST&&env.SHIFT_ENVIRONMENT==='stabilisation-preview-20260917'&&env.STAGING_REVIEW_ACCOUNT_LIMIT==='100'?100:20;
}
export function previewAccountCapacity(count,env,hostname){
 const limit=previewAccountLimit(env,hostname);
 return {limit,used:count,available:Number.isSafeInteger(count)&&count>=0&&count<limit};
}
// A reviewer returning with their own valid session should not consume another slot.
// Authentication failure must not be mistaken for permission to create an account.
export async function resumeFictionalPreview(request,env,authenticate){
 const u=new URL(request.url);
 if(u.hostname!==HOST||env.SHIFT_ENVIRONMENT!=='stabilisation-preview-20260917'||request.method!=='POST'||u.pathname!=='/__preview/start'||request.headers.get('Origin')!==u.origin)return null;
 const auth=await authenticate(request,env);
 if(!auth.userId||auth.response)return null;
 if(!/@example\.invalid$/i.test(String(auth.user?.email||'')))return null;
 return new Response(null,{status:303,headers:{Location:'/member/settings#memberDetailsPanel','Cache-Control':'no-store, private','X-Robots-Tag':'noindex, nofollow','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'}});
}
