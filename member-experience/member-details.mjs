// Additive, scoped account controls. Existing settings/security/consent controls remain.
export function withMemberDetails(html){
 if(html.includes('id="memberDetailsPanel"')||!/<main\b/.test(html))return html;
 const panel=`<section id="memberDetailsPanel" aria-labelledby="memberDetailsTitle">
  <div class="md-heading"><p class="eyebrow">MY TIMBER · YOUR ACCOUNT</p><h2 id="memberDetailsTitle">Member details</h2><p>Moved house? New number? Keep your details up to date here.</p></div>
  <p class="md-notice">These are your account details. Changing them does not change an address on an existing order. For an order already placed, contact <a href="mailto:support@shiftsometimber.co.uk">support@shiftsometimber.co.uk</a>.</p>
  <form id="memberDetailsForm">
   <fieldset id="memberDetailsFields" disabled><legend class="md-sr">Your personal and contact details</legend>
    <h3>Personal details</h3><div class="md-grid">
     <label for="memberFirstName">First name<input id="memberFirstName" name="firstName" autocomplete="given-name" maxlength="100" required></label>
     <label for="memberLastName">Last name<input id="memberLastName" name="lastName" autocomplete="family-name" maxlength="100"></label>
     <label for="memberDob">Date of birth<input id="memberDob" name="dateOfBirth" type="date" autocomplete="bday" min="1900-01-01"></label>
     <label for="memberPhone">Phone number<input id="memberPhone" name="phone" type="tel" autocomplete="tel" maxlength="50"></label>
    </div>
    <label for="memberEmail">Sign-in email<input id="memberEmail" name="email" type="email" autocomplete="email" readonly aria-describedby="memberEmailHelp"></label><p id="memberEmailHelp" class="md-help">Your sign-in email is protected. <a href="mailto:support@shiftsometimber.co.uk">Contact support</a> to request an email change. Password and privacy controls remain below.</p>
    <div class="md-section"><h3>Home address</h3><div class="md-postcode">
     <label for="memberPostcode">Postcode<input id="memberPostcode" name="postcode" autocomplete="postal-code" maxlength="12" aria-describedby="memberAddressHelp"></label><button id="memberFindAddress" type="button" class="md-secondary">Find address</button>
    </div>
    <p class="md-help" id="memberAddressHelp" role="status" aria-live="polite">You can enter your full address manually below.</p>
    <div id="memberAddressLookup" hidden><label for="memberAddressSelect">Select your address<select id="memberAddressSelect"><option value="">Choose an address…</option></select></label></div>
    <label for="memberAddress1">Address line 1<input id="memberAddress1" name="address1" autocomplete="address-line1" maxlength="120"></label>
    <label for="memberAddress2">Address line 2 <span class="md-optional">(optional)</span><input id="memberAddress2" name="address2" autocomplete="address-line2" maxlength="120"></label>
    <div class="md-grid"><label for="memberTown">Town or city<input id="memberTown" name="town" autocomplete="address-level2" maxlength="100"></label><label for="memberCounty">County <span class="md-optional">(optional)</span><input id="memberCounty" name="county" autocomplete="address-level1" maxlength="100"></label></div></div>
    <div class="md-section"><h3>GP practice <span class="md-optional">(optional)</span></h3>
     <label for="memberGpPractice">Practice name<input id="memberGpPractice" name="gpPractice" autocomplete="off" maxlength="160" aria-describedby="memberGpHelp"></label>
     <p id="memberGpHelp" class="md-help" role="status" aria-live="polite">Type three or more letters for NHS practice suggestions in England and Wales. You can also enter your GP manually.</p>
     <div id="memberGpLookup" hidden><label for="memberGpSelect">Choose a matching practice<select id="memberGpSelect"><option value="">Choose your GP practice…</option></select></label></div>
     <label for="memberGpPostcode">Practice postcode <span class="md-optional">(optional)</span><input id="memberGpPostcode" name="gpPostcode" autocomplete="off" maxlength="12"></label>
     <input id="memberGpCode" name="gpCode" type="hidden"><p id="memberGpSelected" class="md-help"></p>
    </div>
   </fieldset>
   <div class="md-actions"><button id="memberDetailsSave" type="submit" disabled>Save member details</button><button id="memberDetailsReload" type="button" class="md-secondary" hidden>Reload saved details</button></div>
   <p id="memberDetailsStatus" role="status" aria-live="polite">Loading your saved details…</p>
  </form></section>`;
 // This is one card inside Settings, not a replacement page, header or dashboard.
 return html.replace(/(<main\b[^>]*>)/,'$1'+panel).replace('</body>','<link rel="stylesheet" href="/assets/member-experience/member-details.css"><script defer src="/assets/member-experience/member-details.mjs"></script></body>');
}
export const memberDetailsStyles=String.raw`
#memberDetailsPanel{box-sizing:border-box;max-width:920px;width:100%;margin:0 auto 32px;padding:28px;border:1px solid #707762;border-radius:16px;background:#e7e3da;color:#050505;font-family:inherit}
#memberDetailsPanel *,#memberDetailsPanel *:before,#memberDetailsPanel *:after{box-sizing:border-box}
#memberDetailsPanel :is(h2,h3,p,label,legend,small,span){color:inherit;-webkit-text-fill-color:currentColor}
#memberDetailsPanel h2{font-size:32px;line-height:1.15;margin:8px 0 12px;font-family:inherit;letter-spacing:-.03em}
#memberDetailsPanel h3{font-size:21px;line-height:1.3;margin:6px 0 16px;font-family:inherit}
#memberDetailsPanel p{line-height:1.5;font-size:16px;overflow-wrap:anywhere}
#memberDetailsPanel .eyebrow{font-size:11px;letter-spacing:.12em;font-weight:800}
#memberDetailsPanel .md-notice{border-left:3px solid #707762;padding:10px 14px;margin:18px 0 24px}
#memberDetailsPanel a{color:#050505;text-decoration:underline;overflow-wrap:anywhere}
#memberDetailsPanel fieldset{margin:0;padding:0;border:0;min-width:0}
#memberDetailsPanel label{display:block;font-size:15px;font-weight:700;margin:0 0 16px}
#memberDetailsPanel :is(input,select){display:block;max-width:100%;width:100%;min-height:48px;margin:8px 0 0;padding:12px;border:1px solid #707762;border-radius:8px;background:#e7e3da;color:#050505;font:400 16px/1.3 Arial,sans-serif;-webkit-text-fill-color:#050505}
#memberDetailsPanel input[readonly]{border-style:dashed}
#memberDetailsPanel input[type=hidden]{display:none}
#memberDetailsPanel .md-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0 18px}
#memberDetailsPanel .md-section{padding-top:22px;margin-top:20px;border-top:1px solid #707762}
#memberDetailsPanel .md-postcode{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:end}
#memberDetailsPanel .md-postcode button{margin-bottom:16px}
#memberDetailsPanel .md-help{font-size:14px;line-height:1.5;margin:0 0 18px}
#memberDetailsPanel .md-optional{font-size:14px;font-weight:400}
#memberDetailsPanel button{min-height:48px;max-width:100%;margin:0;padding:12px 18px;border:1px solid #050505;border-radius:8px;background:#050505;color:#e7e3da;-webkit-text-fill-color:currentColor;font:700 16px/1.4 Arial,sans-serif;cursor:pointer}
#memberDetailsPanel button.md-secondary{background:transparent;color:#050505}
#memberDetailsPanel button:disabled{opacity:.6;cursor:not-allowed}
#memberDetailsPanel :is(input,select,button,a):focus-visible{outline:3px solid #050505;outline-offset:3px}
#memberDetailsPanel .md-actions{display:flex;flex-wrap:wrap;gap:12px;margin-top:24px}
#memberDetailsPanel #memberDetailsStatus{min-height:24px;font-weight:700;margin-bottom:0}
#memberDetailsPanel .md-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)}
/* Retained theme styles use important rules. Define both sides of the colour
   pair only on this new card; never recolour the shared shell or old settings. */
html body[data-member-page="settings"] #memberDetailsPanel{background:#050505!important;color:#e7e3da!important}
html body[data-member-page="settings"] #memberDetailsPanel :is(h2,h3,p,label,legend,small,span,a){color:#e7e3da!important;-webkit-text-fill-color:#e7e3da!important}
html body[data-member-page="settings"] #memberDetailsPanel :is(input,select){background:#e7e3da!important;color:#050505!important;-webkit-text-fill-color:#050505!important}
html body[data-member-page="settings"] #memberDetailsPanel button{background:#e7e3da!important;color:#050505!important;-webkit-text-fill-color:#050505!important;border-color:#707762!important;opacity:1!important}
html body[data-member-page="settings"] #memberDetailsPanel button:disabled{border-style:dashed!important;cursor:not-allowed}
html body[data-member-page="settings"] #memberDetailsPanel :is(input,select,button,a):focus-visible{outline-color:#e7e3da!important;box-shadow:none!important}
#memberDetailsPanel [hidden]{display:none!important}
@media(max-width:600px){#memberDetailsPanel{padding:20px 16px}#memberDetailsPanel h2{font-size:28px}#memberDetailsPanel .md-grid{grid-template-columns:1fr}#memberDetailsPanel .md-postcode{grid-template-columns:1fr;gap:0}#memberDetailsPanel .md-actions>button,#memberDetailsPanel .md-postcode button{width:100%}}
`;
export const memberDetailsRuntime=String.raw`(()=>{
'use strict';
const form=document.getElementById('memberDetailsForm');if(!form||form.dataset.bound)return;form.dataset.bound='true';
const $=id=>document.getElementById(id),fields=$('memberDetailsFields'),save=$('memberDetailsSave'),reload=$('memberDetailsReload'),status=$('memberDetailsStatus');
const ids={firstName:'memberFirstName',lastName:'memberLastName',dateOfBirth:'memberDob',phone:'memberPhone',postcode:'memberPostcode',address1:'memberAddress1',address2:'memberAddress2',town:'memberTown',county:'memberCounty',gpPractice:'memberGpPractice',gpPostcode:'memberGpPostcode',gpCode:'memberGpCode'};
let revision=null,loaded=false,busy=false,pending=null,dirty=false,gpEnabled=false,addressEnabled=false,gpTimer=null,gpSerial=0,gpResults=[],addressResults=[];
function message(text){status.textContent=text;}
function payload(){return Object.fromEntries(Object.entries(ids).map(([k,id])=>[k,$(id).value.trim()]));}
function controls(disabled){fields.disabled=disabled;save.disabled=disabled;}
function fill(result){if(!result||result.ok!==true||!result.details||typeof result.revision!=='string')throw Error('Your saved details could not be read. Please reload.');for(const[k,id]of Object.entries(ids))$(id).value=result.details[k]||'';$('memberEmail').value=result.details.email||'';revision=result.revision;gpEnabled=result.gpLookupConfigured===true;addressEnabled=result.addressLookupConfigured===true;$('memberFindAddress').disabled=!addressEnabled;$('memberAddressHelp').textContent=addressEnabled?'Enter a postcode, then choose Find address. Manual entry also works.':'Postcode lookup is not connected yet. Enter your full address below; saving it works without lookup.';$('memberGpHelp').textContent=gpEnabled?'Type three or more letters for NHS practice suggestions in England and Wales. Manual entry is also available.':'GP suggestions are unavailable here. Enter your practice name and postcode manually.';$('memberGpSelected').textContent=result.details.gpCode?'Selected directory reference: '+result.details.gpCode:'';loaded=true;dirty=false;}
async function api(url,method='GET',body){let response;try{response=await fetch(url,{method,credentials:'include',cache:'no-store',headers:method==='GET'?{}:{'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(15000)});}catch{const e=new Error('Connection interrupted. Your edits are still here. Retry the same save or reload saved details.');e.uncertain=method==='PATCH';throw e;}
const b=await response.json().catch(()=>null);if(!response.ok||!b){const e=new Error(b?.message||(response.status===401?'Please sign in again to see your details.':'We could not confirm this request. Retry or reload your saved details.'));e.code=b?.error;e.status=response.status;e.uncertain=method==='PATCH'&&(!b||b.error==='save_confirmation_unavailable');throw e;}return b;}
async function load(){if(busy)return;busy=true;controls(true);message('Loading your saved details…');try{const r=await api('/v1/member/details');fill(r);pending=null;controls(false);$('memberFindAddress').disabled=!addressEnabled;reload.hidden=true;message('Your saved account details are shown above.');}catch(e){message(e.message);reload.hidden=false;reload.textContent='Retry loading details';controls(true);}finally{busy=false;}}
reload.addEventListener('click',()=>{if(dirty&&!confirm('Reload your saved details? This will discard the unsaved edits on this page.'))return;load();});
form.addEventListener('input',()=>{dirty=true;});
form.addEventListener('submit',async event=>{event.preventDefault();if(!loaded||busy||save.disabled)return;if(!pending)pending={details:payload(),revision,operationId:crypto.randomUUID()};busy=true;controls(true);reload.hidden=true;message('Saving your details…');try{const r=await api('/v1/member/details','PATCH',pending);fill(r);pending=null;controls(false);$('memberFindAddress').disabled=!addressEnabled;message('Member details saved.');save.textContent='Save member details';}catch(e){message(e.message);reload.hidden=false;reload.textContent='Reload saved details';if(e.uncertain){fields.disabled=true;save.disabled=false;save.textContent='Retry save';}else{pending=null;controls(false);$('memberFindAddress').disabled=!addressEnabled;if(e.status===409||e.status===401)save.disabled=true;}}finally{busy=false;}});
$('memberDob').max=new Date().toISOString().slice(0,10);
$('memberFindAddress').addEventListener('click',async()=>{if(!loaded||busy||!addressEnabled)return;const button=$('memberFindAddress'),help=$('memberAddressHelp'),postcode=$('memberPostcode').value.trim();if(!postcode){help.textContent='Enter your postcode first.';return;}button.disabled=true;help.textContent='Looking for addresses…';try{const r=await api('/v1/member/details/address-search?postcode='+encodeURIComponent(postcode));addressResults=r.addresses||[];const select=$('memberAddressSelect');select.replaceChildren(new Option('Choose your address…',''));addressResults.forEach((a,i)=>select.add(new Option(a.label,String(i))));$('memberAddressLookup').hidden=!addressResults.length;help.textContent=addressResults.length?'Choose your address from the list, or enter it below.':'No matching address was returned. Enter your address manually.';}catch(e){help.textContent=e.message;}finally{button.disabled=!addressEnabled;}});
$('memberAddressSelect').addEventListener('change',event=>{if(event.target.value==='')return;const a=addressResults[Number(event.target.value)];if(!a)return;for(const k of ['address1','address2','town','county','postcode'])$(ids[k]).value=a[k]||'';dirty=true;});
$('memberGpPractice').addEventListener('input',()=>{clearTimeout(gpTimer);const serial=++gpSerial;gpResults=[];$('memberGpCode').value='';$('memberGpSelected').textContent='';$('memberGpLookup').hidden=true;const q=$('memberGpPractice').value.trim();if(!gpEnabled||q.length<3)return;gpTimer=setTimeout(async()=>{const help=$('memberGpHelp');help.textContent='Searching the NHS practice directory…';try{const r=await api('/v1/member/details/gp-search?q='+encodeURIComponent(q));if(serial!==gpSerial)return;gpResults=r.practices||[];const select=$('memberGpSelect');select.replaceChildren(new Option('Choose your GP practice…',''));gpResults.forEach((p,i)=>select.add(new Option(p.name+' — '+p.postcode,String(i))));$('memberGpLookup').hidden=!gpResults.length;help.textContent=gpResults.length?'Choose a matching NHS practice below. This does not confirm that you are registered there.':'No matching practice was returned. Enter your GP name and postcode manually.';}catch(e){if(serial===gpSerial)help.textContent=e.message;}},800);});
$('memberGpSelect').addEventListener('change',event=>{if(event.target.value==='')return;const p=gpResults[Number(event.target.value)];if(!p)return;++gpSerial;clearTimeout(gpTimer);$('memberGpPractice').value=p.name;$('memberGpPostcode').value=p.postcode;$('memberGpCode').value=p.code;$('memberGpSelected').textContent='Selected from NHS directory: '+p.code+'. Registration has not been verified.';dirty=true;});
$('memberGpPostcode').addEventListener('input',()=>{$('memberGpCode').value='';$('memberGpSelected').textContent='Manual practice details.';});
load();
})();`;
