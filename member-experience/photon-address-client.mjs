// Shared home/delivery controls. Search is explicit, not an external call per keystroke.
export function photonSearchMarkup(prefix){
 return `<label for="${prefix}AddressQuery">Building or street <span class="md-optional">(optional)</span><input id="${prefix}AddressQuery" maxlength="100" autocomplete="off" placeholder="Add a house number, building or street to narrow the search" aria-describedby="${prefix}AddressSource"></label><p class="md-help" id="${prefix}AddressSource"><span id="${prefix}PhotonSource">Optional free suggestions from Photon. Pressing Search sends only this postcode and these search terms—not your name, email, phone or health information. Some addresses are missing; always check the result.<br>Address data © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap contributors (ODbL)</a>.</span><span id="${prefix}IdealSource" hidden>Address lookup from Ideal Postcodes. Pressing Search sends only your postcode to this provider. Check the selected address before saving.</span></p><button id="${prefix}AddressManual" type="button" class="md-secondary">Enter address manually</button>`;
}
export const photonAddressRuntime=String.raw`(()=>{
'use strict';
const $=id=>document.getElementById(id);
const configs=[{prefix:'member',form:'memberDetailsForm',fields:'memberDetailsFields',button:'memberFindAddress',help:'memberAddressHelp',select:'memberAddressSelect',choices:'memberAddressLookup',postcode:'memberPostcode',address1:'memberAddress1',address2:'memberAddress2',town:'memberTown',county:'memberCounty',event:'memberAddressLoaded'},{prefix:'memberDelivery',form:'memberDeliveryForm',fields:'memberDeliveryFields',button:'memberDeliveryFind',help:'memberDeliveryLookupHelp',select:'memberDeliverySelect',choices:'memberDeliveryChoices',postcode:'memberDeliveryPostcode',address1:'memberDeliveryAddress1',address2:'memberDeliveryAddress2',town:'memberDeliveryTown',county:'memberDeliveryCounty',event:'memberDeliveryAddressLoaded'}];
for(const c of configs){
 const form=$(c.form),fields=$(c.fields),button=$(c.button),help=$(c.help),select=$(c.select),choices=$(c.choices),query=$(c.prefix+'AddressQuery'),manual=$(c.prefix+'AddressManual');
 if(!form||!query||query.dataset.bound)continue;query.dataset.bound='true';let serial=0,abort=null,results=[],enabled=false,selecting=false,licensed=false;
 const fingerprint=()=>[query.value,...[c.postcode,c.address1,c.town,c.county].map(id=>$(id).value)].join('\u0000');
 function clear(){serial++;abort?.abort();abort=null;results=[];choices.hidden=true;select.replaceChildren(new Option('Choose an address suggestion…',''));button.disabled=!enabled;}
 window.addEventListener(c.event,e=>{enabled=e.detail?.enabled===true;licensed=e.detail?.provider==='ideal-postcodes';if($(c.prefix+'PhotonSource'))$(c.prefix+'PhotonSource').hidden=licensed;if($(c.prefix+'IdealSource'))$(c.prefix+'IdealSource').hidden=!licensed;query.parentElement&&(query.parentElement.hidden=licensed);clear();help.textContent=enabled&&licensed?'Enter your postcode, then search and choose your address.':enabled?'Enter your postcode. Add a building or street when needed, then search. Manual entry always works.':'Address suggestions are unavailable. Enter and save your address manually.';});
 form.addEventListener('input',e=>{if(e.target!==select&&!selecting)clear();});form.addEventListener('change',e=>{if(e.target!==select&&!selecting)clear();});
 form.addEventListener('submit',clear);
 manual.addEventListener('click',()=>{clear();help.textContent='Enter your address below. No address search is required.';$(c.address1).focus();});
 button.addEventListener('click',async()=>{
  if(fields.disabled||!enabled)return;clear();const postcode=$(c.postcode).value.trim(),terms=query.value.trim();
  if(!postcode){help.textContent='Enter your postcode first, or enter your address manually.';$(c.postcode).focus();return;}
  const n=serial,before=fingerprint(),controller=new AbortController();abort=controller;const timer=setTimeout(()=>controller.abort(),8000);button.disabled=true;help.textContent='Searching addresses…';
  try{
   const r=await fetch('/v1/member/details/address-search',{method:'POST',credentials:'include',cache:'no-store',headers:{'Content-Type':'application/json'},body:JSON.stringify({postcode,query:licensed?'':terms}),signal:controller.signal});
   const b=await r.json();if(n!==serial||before!==fingerprint()||fields.disabled)return;
   if(!r.ok)throw Error(b.message||'Address search is unavailable. Enter your address manually.');
   results=Array.isArray(b.addresses)?b.addresses:[];
   for(const [i,a]of results.entries())select.add(new Option(String(a.label),String(i)));
   choices.hidden=!results.length;
   help.textContent=licensed?(results.length?(b.mayHaveMore?'Showing the first 100 addresses. If yours is missing, enter it manually.':'Choose your address, then check every field before saving.'):'No addresses were returned. Check the postcode or enter the address manually.'):results.length?'Choose a suggestion, then check the house or flat and every address field. This is not postal verification.':'No complete matching address was found. Add a building or street and search again, or enter the address manually.';
  }catch(e){if(n===serial&&!fields.disabled)help.textContent=e.name==='AbortError'?'Address search took too long. Enter your address manually.':e.message;}
  finally{clearTimeout(timer);if(n===serial){abort=null;button.disabled=!enabled;}}
 });
 select.addEventListener('change',()=>{
  if(fields.disabled||select.value==='')return;const a=results[Number(select.value)];if(!a)return;
  // Never silently overwrite an existing flat/locality with a conflicting line 2.
  if(a.address2&&$(c.address2).value.trim()&&$(c.address2).value.trim()!==a.address2){help.textContent='This address needs a different address line 2: '+a.address2+'. Check and clear your existing line 2 before selecting it, or enter the address manually.';$(c.address2).focus();return;}
  const changes=[[c.address1,a.address1],[c.address2,a.address2],[c.town,a.town],[c.county,a.county],[c.postcode,a.postcode]];selecting=true;
  try{for(const[id,value]of changes)if(typeof value==='string'&&value){$(id).value=value;$(id).dispatchEvent(new Event('input',{bubbles:true}));}}
  finally{selecting=false;clear();}
  help.textContent='Suggestion selected. Check your house or flat and all address fields before saving. Nothing is saved until you press Save.';$(c.address1).focus();
 });
}
})();`;
