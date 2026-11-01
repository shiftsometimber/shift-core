export function enquiryPayload(form){
 const data=new FormData(form),get=name=>String(data.get(name)||'').trim();
 const website=get('website');if(website&&!['https:','http:'].includes(new URL(website).protocol))throw Error('Use a website address beginning with https:// or http://.');
 return {name:get('name'),email:get('email'),type:'partnership',consent:form.querySelector('#permission').checked,message:['Referral / affiliate enquiry','Route: '+get('route'),'Organisation: '+get('organisation'),'Organisation type: '+get('type'),'Website: '+(website||'Not supplied')].join('\n')};
}
export async function sendEnquiry(payload,{fetcher=fetch,token}={}){
 if(!token)throw Error('Complete the security check and try again.');
 const response=await fetcher('/v1/contact',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({...payload,turnstileToken:token}),signal:AbortSignal.timeout(20000)});
 const body=await response.json().catch(()=>({}));
 if(!response.ok||body.ok!==true||body.status!=='sent')throw Error(body.message||'We could not confirm delivery. Please wait before trying again.');
 return body.message;
}
export function initReferrer(){
 const form=document.getElementById('referral-form');if(!form)return;
 document.querySelectorAll('[data-route]').forEach(link=>link.addEventListener('click',()=>{document.getElementById('referral-route').value=link.dataset.route;}));
 let pending=false;
 form.addEventListener('submit',async event=>{
  event.preventDefault();event.stopImmediatePropagation();if(pending||!form.reportValidity())return;
  const status=document.getElementById('referral-status'),button=document.getElementById('referral-send');pending=true;button.disabled=true;button.textContent='Sending…';status.textContent='';
  try{
   const payload=enquiryPayload(form);
   if(!window.SSTTurnstile){await new Promise((resolve,reject)=>{const script=document.createElement('script'),timer=setTimeout(()=>reject(Error('The security check could not load. Please try again.')),12000);script.src='/turnstile-auth-v1.js?v=contact-security-20260916';script.onload=()=>{clearTimeout(timer);resolve();};script.onerror=()=>{clearTimeout(timer);reject(Error('The security check could not load. Please try again.'));};document.head.append(script);});}
   if(!window.SSTTurnstile?.getToken)throw Error('The security check is unavailable. Please try again.');
   const token=await window.SSTTurnstile.getToken('contact_enquiry',form);
   status.textContent=await sendEnquiry(payload,{token});status.dataset.state='success';form.reset();
  }catch(error){status.textContent=error.message||'We could not confirm delivery. Please wait before trying again.';status.dataset.state='error';}
  finally{pending=false;button.disabled=false;button.textContent='Send enquiry';}
 },true);
}
if(typeof document!=='undefined')initReferrer();
