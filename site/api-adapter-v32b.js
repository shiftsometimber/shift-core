// Shift Some Timber V3.2B — browser adapter for Shift Core on Cloudflare Workers.
window.SST_API_BASE = window.SST_API_BASE || 'https://api.shiftsometimber.co.uk';
window.SST_API = (function(){
  const base=window.SST_API_BASE.replace(/\/$/,'')+'/v1';
  async function request(path,options={}){
    const res=await fetch(base+path,{
      credentials:'include',
      headers:{'Content-Type':'application/json',...(options.headers||{})},
      ...options
    });
    const ct=res.headers.get('content-type')||'';
    const body=ct.includes('application/json')?await res.json():await res.text();
    if(!res.ok){const err=new Error(body?.message||body?.error||`API ${res.status}`);err.status=res.status;err.body=body;throw err;}
    return body;
  }
  return {
    connected:()=>!!base,
    health:()=>request('/health'),
    register:data=>request('/auth/register',{method:'POST',body:JSON.stringify(data)}),
    login:data=>request('/auth/login',{method:'POST',body:JSON.stringify(data)}),
    logout:()=>request('/auth/logout',{method:'POST'}),
    getMe:()=>request('/me'),
    getProfile:()=>request('/profile'),
    saveProfile:data=>request('/profile',{method:'PATCH',body:JSON.stringify(data)}),
    getMemberState:()=>request('/member-state'),
    saveMemberState:data=>request('/member-state',{method:'PATCH',body:JSON.stringify(data)}),
    getProgress:()=>request('/progress'),
    saveProgress:data=>request('/progress',{method:'POST',body:JSON.stringify(data)}),
    getMots:()=>request('/health-mot'),
    saveMot:data=>request('/health-mot',{method:'POST',body:JSON.stringify(data)}),
    getCheckIns:()=>request('/check-ins'),
    saveCheckIn:data=>request('/check-ins',{method:'POST',body:JSON.stringify(data)}),
    getCases:()=>request('/cases'),
    createCase:data=>request('/cases',{method:'POST',body:JSON.stringify(data)}),
    getPharmacyOrders:()=>request('/pharmacy/orders'),
    createPharmacyOrder:data=>request('/pharmacy/orders',{method:'POST',body:JSON.stringify(data)}),
    getConsents:()=>request('/consents'),
    saveConsent:data=>request('/consents',{method:'POST',body:JSON.stringify(data)}),
    exportData:()=>request('/privacy/export',{method:'POST'}),
    deleteAccount:()=>request('/privacy/account',{method:'DELETE'})
  };
})();
