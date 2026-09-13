// Add the pay-first handoff to the current Pages response, preserving its source.
export async function withPatientStartHere(response,request,env){
  const path=new URL(request.url).pathname;
  if(env.MEDICINE_INTAKE_V2_ENABLED!=='true'||!['/treatment-order','/treatment-order.html'].includes(path)||!response.ok||request.method!=='GET'||!response.headers.get('content-type')?.includes('text/html'))return response;
  const html=await response.text();
  if(html.includes('src="/patient-start-here-v2.js"'))return new Response(html,response);
  const headers=new Headers(response.headers);
  for(const name of ['content-length','etag','last-modified'])headers.delete(name);
  headers.set('cache-control','no-store');
  return new Response(html.replace('</body>','<script src="/patient-start-here-v2.js" defer></script></body>'),{status:response.status,headers});
}
