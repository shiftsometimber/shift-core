// Extra boundary for the isolated hosted environment, not production policy.
// A native logout form can suppress Origin under no-referrer. Require the
// browser's forbidden Fetch Metadata headers for that one navigation instead.
export function hostedMutationAllowed(request){
 if(!['POST','PATCH','DELETE','PUT'].includes(request.method))return true;
 const url=new URL(request.url),origin=request.headers.get('Origin');
 if(origin===url.origin)return true;
 return request.method==='POST'&&url.pathname==='/v1/auth/logout'&&
  (origin===null||origin==='null')&&
  request.headers.get('Sec-Fetch-Site')==='same-origin'&&
  request.headers.get('Sec-Fetch-Mode')==='navigate'&&
  request.headers.get('Sec-Fetch-Dest')==='document'&&
  /^application\/x-www-form-urlencoded(?:;|$)/i.test(request.headers.get('Content-Type')||'');
}
