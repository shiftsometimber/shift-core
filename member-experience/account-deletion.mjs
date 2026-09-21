const card=`<section class="tracker-card" data-account-deletion aria-labelledby="accountDeletionHeading"><h3 id="accountDeletionHeading">Request account deletion</h3><p>You can ask SHIFT to delete your account and personal data. This sends a request for review; it does not immediately erase every record. We will contact you at your account email about the outcome and any records that must be retained.</p><p>Submitting signs you out on all current devices. You can export your data above before requesting deletion.</p><button type="button" class="btn btn-ghost" id="accountDeletionOpen" aria-expanded="false" aria-controls="accountDeletionForm">Request account deletion</button><form id="accountDeletionForm" hidden><label><input type="checkbox" id="accountDeletionConfirm" required> I want to request account deletion and understand that I will be signed out.</label><div class="actions"><button class="btn btn-primary" type="submit">Send deletion request</button><button class="btn btn-ghost" type="button" id="accountDeletionCancel">Cancel</button></div></form><p id="accountDeletionStatus" role="status" aria-live="polite"></p><a id="accountDeletionSignIn" href="/member-login?returnTo=%2Fmember%2Fsettings" hidden>Sign in again</a><p>If you need help or cannot sign in, <a href="/contact">contact SHIFT</a>.</p></section>`;
export function withAccountDeletion(html){
  if(html.includes('data-account-deletion'))return html;
  return html.replace('</main>',card+'</main>').replace('</body>','<script defer src="/assets/member-experience/account-deletion.mjs"></script></body>');
}
export const accountDeletionRuntime=String.raw`(()=>{
 'use strict';
 const host=document.querySelector('[data-account-deletion]');if(!host)return;
 const open=document.getElementById('accountDeletionOpen'),form=document.getElementById('accountDeletionForm'),confirm=document.getElementById('accountDeletionConfirm'),cancel=document.getElementById('accountDeletionCancel'),status=document.getElementById('accountDeletionStatus'),signIn=document.getElementById('accountDeletionSignIn');
 let pending=false;
 open.onclick=()=>{form.hidden=false;open.hidden=true;open.setAttribute('aria-expanded','true');confirm.focus();};
 cancel.onclick=()=>{if(pending)return;form.reset();form.hidden=true;open.hidden=false;open.setAttribute('aria-expanded','false');status.textContent='';signIn.hidden=true;open.focus();};
 form.onsubmit=async event=>{
  event.preventDefault();if(pending||!confirm.checked||!form.reportValidity())return;
  pending=true;form.setAttribute('aria-busy','true');for(const item of form.elements)item.disabled=true;status.textContent='Sending your deletion request…';signIn.hidden=true;
  try{
   if(!window.SST_API?.deleteAccount)throw Error('unavailable');
   const result=await SST_API.deleteAccount();if(result?.ok!==true||result.status!=='received')throw Error('unconfirmed');
   form.remove();open.remove();status.textContent='Deletion request received. You are signed out on all current devices. Your request is awaiting review; your account data has not yet been deleted. SHIFT will contact you at your account email.';
   status.dataset.state='received';
   // Remove the signed-in controls after the server has revoked the sessions.
   const main=host.closest('main');if(main)main.replaceChildren(host);
   document.querySelector('.sst-member-tabs')?.remove();status.tabIndex=-1;status.focus();
  }catch(error){
   status.textContent=error?.status===401?'Please sign in again to send your deletion request. If you already submitted it, contact SHIFT to check its status.':'We could not confirm receipt. Your request may have reached SHIFT. Check your connection and try again, or contact SHIFT to check its status.';
   status.dataset.state='error';signIn.hidden=error?.status!==401;for(const item of form.elements)item.disabled=false;
  }finally{pending=false;form.removeAttribute('aria-busy');}
 };
})();`;
