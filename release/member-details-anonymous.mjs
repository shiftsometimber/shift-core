// Read-only/authentication-rejection probes. No session, member write or provider call.
import assert from 'node:assert/strict';

export async function verifyAnonymousMemberBoundaries(base, transport=fetch) {
  const origin = new URL(base).origin;
  const probes = [
    {path:'/v1/member/details',status:401},
    {path:'/v1/member/details/gp-search?q=Blackdown',status:401},
    {path:'/v1/member/details/delivery',status:401},
    {path:'/v1/member/details/address-search?postcode=SW1A%201AA',status:405},
    {path:'/v1/member/details/address-search',method:'POST',status:401,origin},
    {path:'/v1/member/details/address-search',method:'POST',status:403,origin:'https://invalid-origin.example'},
  ];
  const checks=[];
  for(const probe of probes) {
    const method=probe.method||'GET';
    const response=await transport(origin+probe.path,{
      method,credentials:'omit',redirect:'manual',signal:AbortSignal.timeout(30000),
      headers:{'Cache-Control':'no-cache',...(method==='POST'?{'Origin':probe.origin,'Content-Type':'application/json'}:{})},
      ...(method==='POST'?{body:JSON.stringify({postcode:'SW1A 1AA',query:''})}:{})
    });
    // Cancel the unused error body so six probes do not retain connections.
    await response.body?.cancel();
    assert.equal(response.status,probe.status,method+' '+probe.path+' anonymous boundary');
    checks.push({path:probe.path,method,status:response.status,...(probe.origin?{sameOrigin:probe.origin===origin}:{})});
  }
  return checks;
}
