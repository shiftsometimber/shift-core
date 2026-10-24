const card=`<section class="tracker-card" data-account-deletion aria-labelledby="accountDeletionHeading"><h3 id="accountDeletionHeading">Delete my account</h3><p>Confirming deletes your My Timber account immediately. Your saved member data is removed and you are signed out on all devices. Records covered by our retention policy are kept as explained in our privacy policy.</p><p>This cannot be undone. You can export your data above before deleting your account.</p><button type="button" class="btn btn-ghost" id="accountDeletionOpen" aria-expanded="false" aria-controls="accountDeletionForm">Delete my account</button><form id="accountDeletionForm" hidden><label><input type="checkbox" id="accountDeletionConfirm" required> I understand that my account will be deleted immediately and I will be signed out on all devices.</label><div class="actions"><button class="btn btn-primary" type="submit">Delete my account now</button><button class="btn btn-ghost" type="button" id="accountDeletionCancel">Cancel</button></div></form><p id="accountDeletionStatus" role="status" aria-live="polite"></p><a id="accountDeletionSignIn" href="/member-login?returnTo=%2Fmember%2Fsettings" hidden>Sign in again</a><p>If you need help or cannot sign in, <a href="/contact">contact SHIFT</a>.</p></section>`;
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
  pending=true;form.setAttribute('aria-busy','true');for(const item of form.elements)item.disabled=true;status.textContent='Deleting your account…';signIn.hidden=true;
  try{
   if(!window.SST_API?.deleteAccount)throw Error('unavailable');
   const result=await SST_API.deleteAccount();if(result?.ok!==true||result.status!=='deleted'||result.accountClosed!==true)throw Error('unconfirmed');
   form.remove();open.remove();status.textContent='Your My Timber account has been deleted. You are signed out on all devices. Your optional member data has been removed. Records covered by our retention policy are kept as explained in our privacy policy.';
   status.dataset.state='deleted';
   host.dataset.accountDeleted='1';document.body.dataset.accountDeleted='1';
   host.querySelector('h3').textContent='Account deleted';
   host.querySelectorAll(':scope>p').forEach(node=>{if(node!==status&&!node.querySelector('a[href="/contact"]'))node.remove();});
   signIn.hidden=false;signIn.textContent='Back to My Timber';signIn.href='/my-timber';
   document.title='Account deleted · My Timber';
   // Remove the signed-in controls after the server has revoked the sessions.
   const main=host.closest('main');if(main)main.replaceChildren(host);
   document.querySelectorAll('.sst-member-tabs,#appBottomNav,#todayBrand .member-design-account,#memberSessionStatus,#myTimberApp').forEach(node=>node.remove());
   status.tabIndex=-1;status.focus();host.scrollIntoView({block:'start'});
  }catch(error){
   status.textContent=error?.status===401?'Your sign-in has expired. Sign in again to delete your account. If you already confirmed deletion, try signing in to check whether the account is closed.':'We could not confirm whether deletion completed. Check your connection before trying again. If you cannot sign in, contact SHIFT to check the account status.';
   status.dataset.state='error';signIn.hidden=error?.status!==401;for(const item of form.elements)item.disabled=false;
  }finally{pending=false;form.removeAttribute('aria-busy');}
 };
})();`;
