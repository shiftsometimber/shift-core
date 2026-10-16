// Same-origin suggestions only. No automatic selection, submission or account write.
export const gpDirectoryClient=String.raw`(()=>{
'use strict';
function mount(config){
 const form=document.querySelector(config.form),practice=form?.querySelector(config.practice),postcode=form?.querySelector(config.postcode),address=form?.querySelector(config.address);
 if(!form||!practice||!postcode||form.dataset.gpDirectoryMounted)return;
 form.dataset.gpDirectoryMounted='true';
 let host=form.querySelector(config.host),help,select;
 if(!host){host=document.createElement('div');host.id=config.host.slice(1);practice.closest('label')?.after(host);}
 const nearLabel=document.createElement('label');nearLabel.textContent='Your postcode for nearer matches (optional)';
 const near=document.createElement('input');near.type='text';near.maxLength=12;near.autocomplete='off';near.id=host.id+'Near';nearLabel.htmlFor=near.id;nearLabel.append(near);host.prepend(nearLabel);
 help=host.querySelector('[role="status"]')||document.createElement('p');help.setAttribute('role','status');help.setAttribute('aria-live','polite');help.id=config.helpId||host.id+'Help';help.textContent='Type three letters of your surgery name, town or postcode. Choose your registered surgery; you can also enter it manually.';
 if(!help.parentNode)host.append(help);
 const label=document.createElement('label');label.id=config.choiceId||host.id+'Choice';label.textContent='Matching GP practices';
 select=document.createElement('select');select.id=config.selectId;label.htmlFor=select.id;label.append(select);host.append(label);
 const manual=document.createElement('button');manual.type='button';manual.textContent='Enter GP details manually';host.append(manual);
 const selected=document.createElement('p');selected.id=host.id+'Selected';selected.setAttribute('role','status');host.append(selected);
 host.hidden=false;host.style.cssText='width:100%;min-width:0;max-width:100%;contain:inline-size';
 for(const el of [near,select,manual])el.style.cssText='display:block;width:100%;max-width:100%;min-width:0;box-sizing:border-box;min-height:44px;font-size:16px;margin:8px 0';
 practice.setAttribute('aria-describedby',[practice.getAttribute('aria-describedby'),help.id].filter(Boolean).join(' '));
 let timer=null,serial=0,controller=null,results=[];
 function invalidate(){clearTimeout(timer);++serial;controller?.abort();controller=null;results=[];select.replaceChildren(new Option('Choose your GP practice…',''));label.hidden=true;}
 function mode(value){const el=form.querySelector(config.mode||'#__none__');if(el)el.value=value;}
 function clearReference(){const el=form.querySelector(config.code||'#__none__');if(el)el.value='';selected.textContent='';mode('manual');}
 function changed(){form.dispatchEvent(new Event('input',{bubbles:true}));}
 function search(clear){invalidate();if(clear)clearReference();const q=practice.value.trim(),current=serial;
  if(q.length<3||q.length>80){help.textContent='Type at least three characters, or enter your GP details manually.';return;}
  timer=setTimeout(async()=>{
   const active=new AbortController();controller=active;const timeout=setTimeout(()=>active.abort(),7000);help.textContent='Finding matching GP practices…';
   try{
    const nearValue=near.value.trim();const response=await fetch('/v1/member/details/gp-search?'+new URLSearchParams({q,...(nearValue?{near:nearValue}:{})}),{credentials:'include',cache:'no-store',signal:active.signal});
    const body=await response.json();if(current!==serial||practice.value.trim()!==q)return;
    if(!response.ok)throw Error(body.message||'GP suggestions could not load. You can still enter the details manually.');
    results=Array.isArray(body.practices)?body.practices.filter(p=>typeof p.name==='string'&&typeof p.postcode==='string').slice(0,12):[];
    for(const [i,p] of results.entries())select.add(new Option([p.name,...(p.address||[]),p.postcode,...(Number.isFinite(p.distanceMiles)?['about '+p.distanceMiles+' miles']:[])].join(' · '),String(i)));
    label.hidden=!results.length;help.textContent=results.length?((body.distanceNote||'Choose your registered practice.')+(body.hasMore?' More matches are available: type a longer name or town.':'')):'No matching practice found. Enter it manually, or try its town or postcode.';
   }catch(error){if(current===serial)help.textContent=error.name==='AbortError'?'Search timed out. Your details are unchanged; manual entry still works.':error.message;}
   finally{clearTimeout(timeout);}
  },800);
 }
 practice.addEventListener('input',()=>search(true));near.addEventListener('input',()=>search(false));
 for(const el of [postcode,address])if(el)el.addEventListener('input',()=>{invalidate();clearReference();help.textContent='Using your manually entered GP details.';});
 select.addEventListener('change',()=>{
  if(select.value==='')return;const p=results[Number(select.value)];if(!p)return;
  practice.value=p.name;postcode.value=p.postcode;if(address&&Array.isArray(p.address))address.value=p.address.join(', ');
  const code=form.querySelector(config.code||'#__none__');if(code)code.value=p.code||'';mode('directory');
  selected.textContent=[p.name,...(p.address||[]),p.postcode].join(', ')+'. Check this is your registered surgery. Registration and the clinical notification destination have not been verified.';
  invalidate();help.textContent='Surgery details filled. Check them before saving.';changed();
 });
 manual.addEventListener('click',()=>{invalidate();clearReference();help.textContent='Enter your surgery name, full address and postcode below.';practice.focus();changed();});
 const status=form.querySelector(config.mode||'#__none__');if(status)status.addEventListener('change',()=>{invalidate();if(status.value==='no_gp'){for(const el of [practice,postcode,address,form.querySelector(config.code)])if(el)el.value='';selected.textContent='No GP recorded. A prescriber must review any implications for treatment.';}else clearReference();changed();});
 // Saved profile details are read only after an explicit member request.
 if(config.form==='form#assessment'){
  const savedButton=document.createElement('button');savedButton.type='button';savedButton.textContent='Use GP details saved in My Timber';
  const savedSummary=document.createElement('p');savedSummary.setAttribute('role','status');savedSummary.setAttribute('aria-live','polite');
  const applySaved=document.createElement('button');applySaved.type='button';applySaved.textContent='Use these GP details';applySaved.hidden=true;
  host.append(savedButton,savedSummary,applySaved);
  for(const el of [savedButton,applySaved])el.style.cssText='width:100%;max-width:100%;box-sizing:border-box;min-height:44px;margin:8px 0';
  let saved=null,savedRequest=null,savedSerial=0;
  function clearSaved(){++savedSerial;savedRequest?.abort();savedRequest=null;saved=null;applySaved.hidden=true;savedButton.disabled=false;savedSummary.textContent='';}
  for(const el of [practice,postcode,address])if(el)el.addEventListener('input',clearSaved);
  select.addEventListener('change',clearSaved);manual.addEventListener('click',clearSaved);
  savedButton.addEventListener('click',async()=>{
   clearSaved();const current=savedSerial,active=new AbortController();savedRequest=active;savedButton.disabled=true;
   const timeout=setTimeout(()=>active.abort(),7000);savedSummary.textContent='Loading your saved GP details…';
   try{
    const response=await fetch('/v1/member/details',{credentials:'include',cache:'no-store',signal:active.signal});
    const body=await response.json();if(current!==savedSerial)return;
    if(!response.ok||body.ok!==true)throw Error(response.status===401?'Sign in to My Timber to use saved details, or enter your GP manually.':'Saved GP details could not load. Your form is unchanged; manual entry still works.');
    const d=body.details;
    if(!d||d.gpSelectionMode==='no_gp'||typeof d.gpPractice!=='string'||!d.gpPractice.trim())throw Error('No GP practice is saved in your profile. Search or enter your current GP manually.');
    const max={gpPractice:160,gpPostcode:12,gpAddress:500};saved={};
    for(const [key,limit]of Object.entries(max)){
     const value=d[key]??'';if(typeof value!=='string'||value.length>limit||/[\u0000-\u001f\u007f]/.test(value))throw Error('Saved GP details could not be used. Enter them manually.');
     saved[key]=value.trim();
    }
    savedSummary.textContent=[saved.gpPractice,saved.gpAddress,saved.gpPostcode].filter(Boolean).join(', ')+'. Check these are still your registered GP details before using them.';
    applySaved.hidden=false;
   }catch(error){if(current===savedSerial)savedSummary.textContent=error.name==='AbortError'?'Saved details timed out. Your form is unchanged; manual entry still works.':error.message;}
   finally{clearTimeout(timeout);if(current===savedSerial){savedButton.disabled=false;savedRequest=null;}}
  });
  applySaved.addEventListener('click',()=>{
   if(!saved)return;const d=saved;invalidate();clearReference();practice.value=d.gpPractice;postcode.value=d.gpPostcode;if(address)address.value=d.gpAddress;
   clearSaved();help.textContent='Saved GP details filled. Check them and make your separate GP-sharing choice before submitting.';changed();
  });
  window.addEventListener('pagehide',clearSaved);
 }
 window.addEventListener('pagehide',invalidate);invalidate();
}
mount({form:'form#assessment',practice:'[name="gpPractice"]',postcode:'[name="gpPostcode"]',address:'[name="gpAddress"]',host:'#assessmentGpLookup',selectId:'assessmentGpSelect',helpId:'assessmentGpHelp',choiceId:'assessmentGpChoice'});
const member=document.querySelector('#memberDetailsForm[data-gp-directory-v2="true"]');if(member)mount({form:'#memberDetailsForm',practice:'#memberGpPractice',postcode:'#memberGpPostcode',address:'#memberGpAddress',host:'#memberGpDirectory',selectId:'memberGpDirectorySelect',code:'#memberGpCode',mode:'#memberGpSelectionMode'});
})();`;
