// My Timber member details: authenticated account data plus member-owned address/GP preferences.
// Email is identity-owned and intentionally read-only here.
export function withMemberDetails(html){
  if(html.includes('id="memberDetailsPanel"'))return html;
  const panel=`<section class="member-account-card" id="memberDetailsPanel" aria-labelledby="memberDetailsTitle">
    <p class="eyebrow">YOUR ACCOUNT</p><h2 id="memberDetailsTitle">Member details</h2>
    <p>Keep your contact, home address and GP details up to date. Changes here apply to your account going forward; they do not rewrite an address already attached to an existing order.</p>
    <form id="memberDetailsForm">
      <div class="member-details-grid">
        <label>First name<input id="memberFirstName" autocomplete="given-name" maxlength="100"></label>
        <label>Last name<input id="memberLastName" autocomplete="family-name" maxlength="100"></label>
        <label>Email<input id="memberEmail" type="email" autocomplete="email" readonly aria-describedby="memberEmailHelp"><small id="memberEmailHelp">Your sign-in email is protected. Contact support if this needs changing.</small></label>
        <label>Date of birth<input id="memberDob" type="date" autocomplete="bday"></label>
        <label>Mobile<input id="memberPhone" type="tel" autocomplete="tel" maxlength="50"></label>
      </div>
      <fieldset><legend>Home address</legend>
        <div class="member-postcode-row"><label>Postcode<input id="memberPostcode" autocomplete="postal-code" maxlength="20"></label><button id="memberFindAddress" type="button" class="mp-btn secondary">Find address</button></div>
        <div id="memberAddressLookup" hidden><label>Select address<select id="memberAddressSelect"><option value="">Choose an address…</option></select></label></div>
        <p class="member-detail-help" id="memberAddressHelp">You can always enter the address manually.</p>
        <label>Address line 1<input id="memberAddress1" autocomplete="address-line1" maxlength="120"></label>
        <label>Address line 2 <span>(optional)</span><input id="memberAddress2" autocomplete="address-line2" maxlength="120"></label>
        <div class="member-details-grid"><label>Town / city<input id="memberTown" autocomplete="address-level2" maxlength="100"></label><label>County <span>(optional)</span><input id="memberCounty" autocomplete="address-level1" maxlength="100"></label></div>
      </fieldset>
      <fieldset><legend>GP practice</legend>
        <p class="member-detail-help">Start typing your GP practice. Suggestions appear when the lookup service is available; manual entry always remains available.</p>
        <label>GP practice<input id="memberGpPractice" autocomplete="off" maxlength="160" list="memberGpSuggestions"></label><datalist id="memberGpSuggestions"></datalist>
        <label>GP postcode <span>(optional)</span><input id="memberGpPostcode" autocomplete="postal-code" maxlength="20"></label>
      </fieldset>
      <button class="mp-btn" id="memberDetailsSave" type="submit">Save member details</button>
      <div class="mp-status" id="memberDetailsStatus" role="status" aria-live="polite">Loading your details…</div>
    </form>
  </section>`;
  const target=/<main\b[^>]*>/;
  if(!target.test(html))return html;
  return html.replace(target,m=>m+panel)
    .replace('</body>','<link rel="stylesheet" href="/assets/member-experience/member-details.css"><script defer src="/assets/member-experience/member-details.mjs"></script></body>');
}
export const memberDetailsStyles=String.raw`
.member-account-card{max-width:920px;margin:0 auto 28px;padding:28px;border:1px solid #707762;border-radius:16px;background:#f4f1e9;color:#11140f}
.member-account-card h2{margin:6px 0 10px}.member-account-card fieldset{margin:22px 0;padding:18px;border:1px solid #b6b8a9;border-radius:12px}.member-account-card legend{font-weight:800;padding:0 8px}.member-account-card label{display:grid;gap:7px;margin:12px 0;font-weight:700}.member-account-card input,.member-account-card select{width:100%;box-sizing:border-box;min-height:48px;padding:10px 12px;border:1px solid #707762;border-radius:8px;background:#fff;color:#11140f;font:inherit}.member-account-card input[readonly]{background:#e7e3da}.member-details-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0 16px}.member-postcode-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:end}.member-detail-help,.member-account-card small{font-weight:400;color:#4c5245}.member-account-card .mp-status{margin-top:12px;min-height:24px}.member-account-card .mp-btn{min-height:48px;padding:12px 18px;border:1px solid #707762;background:#17261d;color:#e7e3da;border-radius:10px;font:inherit;font-weight:800;cursor:pointer}.member-account-card .mp-btn.secondary{background:#e7e3da;color:#11140f}
@media(max-width:600px){.member-account-card{padding:20px}.member-details-grid,.member-postcode-row{grid-template-columns:1fr}.member-postcode-row .mp-btn{width:100%}}
`;
export const memberDetailsRuntime=String.raw`(()=>{
'use strict';
const form=document.getElementById('memberDetailsForm');if(!form)return;
const $=id=>document.getElementById(id), status=$('memberDetailsStatus');
let state=null, profile=null;
const text=(v,max=160)=>String(v??'').trim().slice(0,max);
function setStatus(message){status.textContent=message}
function details(){return state?.preferences?.memberDetails||{}}
function fill(){
 const d=details();
 $('memberFirstName').value=profile?.first_name||'';$('memberLastName').value=profile?.last_name||'';$('memberEmail').value=profile?.email||'';$('memberDob').value=profile?.date_of_birth||'';$('memberPhone').value=profile?.phone||'';$('memberPostcode').value=d.postcode||profile?.postcode||'';$('memberAddress1').value=d.address1||'';$('memberAddress2').value=d.address2||'';$('memberTown').value=d.town||'';$('memberCounty').value=d.county||'';$('memberGpPractice').value=d.gpPractice||'';$('memberGpPostcode').value=d.gpPostcode||'';
}
async function api(path,options){const r=await fetch(path,{credentials:'include',headers:{'Content-Type':'application/json',...(options?.headers||{})},...options});const b=await r.json().catch(()=>({}));if(!r.ok)throw new Error(b.message||'That change could not be saved. Please try again.');return b}
async function load(){try{const [p,s]=await Promise.all([api('/v1/profile'),api('/v1/member-state')]);profile=p.profile;state=s.state||{preferences:{}};fill();setStatus('Your current account details are shown above.')}catch(e){setStatus(e.message)}}
$('memberFindAddress').addEventListener('click',async()=>{
 const postcode=text($('memberPostcode').value,20);if(!postcode){setStatus('Enter your postcode first.');return}
 setStatus('Looking for addresses…');
 try{const r=await fetch('/v1/address-lookup?postcode='+encodeURIComponent(postcode),{credentials:'include'});if(r.status===404||r.status===501){setStatus('Address lookup is not connected yet. Please enter your address manually.');return}const b=await r.json();if(!r.ok)throw new Error(b.message||'Address lookup is unavailable. Please enter it manually.');const list=Array.isArray(b.addresses)?b.addresses:[],select=$('memberAddressSelect');select.innerHTML='<option value="">Choose an address…</option>'+list.map((a,i)=>'<option value="'+i+'">'+String(a.label||a.address1||'Address').replace(/[<>&"]/g,'')+'</option>').join('');select._addresses=list;$('memberAddressLookup').hidden=!list.length;setStatus(list.length?'Choose your address from the list.':'No addresses found. You can enter it manually.')}catch(e){setStatus(e.message)}
});
$('memberAddressSelect').addEventListener('change',e=>{const a=e.target._addresses?.[Number(e.target.value)];if(!a)return;$('memberAddress1').value=a.address1||'';$('memberAddress2').value=a.address2||'';$('memberTown').value=a.town||a.city||'';$('memberCounty').value=a.county||'';});
let gpTimer;$('memberGpPractice').addEventListener('input',()=>{clearTimeout(gpTimer);gpTimer=setTimeout(async()=>{const q=text($('memberGpPractice').value,80);if(q.length<3)return;try{const r=await fetch('/v1/gp-lookup?q='+encodeURIComponent(q),{credentials:'include'});if(!r.ok)return;const b=await r.json(),list=Array.isArray(b.practices)?b.practices:[];$('memberGpSuggestions').innerHTML=list.slice(0,12).map(x=>'<option value="'+String(x.name||'').replace(/[<>&"]/g,'')+'"></option>').join('')}catch{}},250)});
form.addEventListener('submit',async e=>{e.preventDefault();const button=$('memberDetailsSave');button.disabled=true;setStatus('Saving…');try{
 const postcode=text($('memberPostcode').value,20);
 const p=await api('/v1/profile',{method:'PATCH',body:JSON.stringify({firstName:text($('memberFirstName').value,100),lastName:text($('memberLastName').value,100),phone:text($('memberPhone').value,50),dateOfBirth:text($('memberDob').value,20),postcode})});profile=p.profile;
 const memberDetails={postcode,address1:text($('memberAddress1').value,120),address2:text($('memberAddress2').value,120),town:text($('memberTown').value,100),county:text($('memberCounty').value,100),gpPractice:text($('memberGpPractice').value,160),gpPostcode:text($('memberGpPostcode').value,20)};
 const preferences={...(state?.preferences||{}),memberDetails};const s=await api('/v1/member-state',{method:'PATCH',body:JSON.stringify({preferences})});state=s.state;fill();setStatus('Member details saved ✓');
 }catch(err){setStatus(err.message)}finally{button.disabled=false}});
load();
})();`;
