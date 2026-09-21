// A visible, authenticated Today exposure; never inferred from a login or Fit API read.
export const continuityExposureRuntime=String.raw`(()=>{
 let sent=false,pending=false;
 const observer=new MutationObserver(check);observer.observe(document.body,{subtree:true,attributes:true,childList:true});
 document.addEventListener('visibilitychange',check);window.addEventListener('hashchange',check);
 async function check(){
  const panel=document.getElementById('panel-today');
  if(sent||pending||document.visibilityState!=='visible'||document.body.dataset.memberSession!=='ready'||!panel?.classList.contains('active')||!panel.getClientRects().length)return;
  pending=true;
  try{const response=await fetch('/v1/events',{method:'POST',credentials:'same-origin',keepalive:true,headers:{'Content-Type':'application/json'},body:JSON.stringify({event_name:'continuity_today_exposed',surface:'today',properties:{}})});if(response.ok){sent=true;observer.disconnect();document.removeEventListener('visibilitychange',check);window.removeEventListener('hashchange',check)}}catch{}finally{pending=false}
 }
 check();
})();`;
