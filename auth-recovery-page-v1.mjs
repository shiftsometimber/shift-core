// Narrow repair of the current authoritative Pages reset document. Keep its
// markup, copy, styles and confirmation journey; restore five logical fallbacks.
export function repairPasswordResetDocument(html){
 return html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,script=>{
  if(!script.includes("getElementById('resetForm')")||!script.includes("API+'/auth/reset-password'"))return script;
  for(const value of ["new URLSearchParams(location.search).get('token')","f.get('password')","f.get('confirm')",'body.message','err.message']){
   script=script.replace(value+" |'",value+" ||'");
  }
  return script;
 });
}
export async function repairPasswordResetResponse(response,request){
 if(!['/reset-password','/reset-password.html'].includes(new URL(request.url).pathname)||request.method!=='GET'||!response.ok||!response.headers.get('Content-Type')?.includes('text/html'))return response;
 const body=repairPasswordResetDocument(await response.text()),headers=new Headers(response.headers);
 for(const key of ['Content-Length','ETag','Last-Modified'])headers.delete(key);
 headers.set('Cache-Control','no-store');headers.set('Referrer-Policy','no-referrer');
 return new Response(body,{status:response.status,headers});
}
