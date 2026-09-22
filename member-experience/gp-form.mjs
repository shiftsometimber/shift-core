// Optional GP-directory assistance for the existing assessment form only.
// No submission interception, clinical decisions, stored-profile reads or account writes.
export const gpFormRuntime=String.raw`(()=>{
'use strict';
const form=document.querySelector('form#assessment'),practice=form?.querySelector('[name="gpPractice"]'),postcode=form?.querySelector('[name="gpPostcode"]');
if(!practice||!postcode||!practice.closest('label')||document.getElementById('assessmentGpLookup'))return;
const host=document.createElement('div');host.id='assessmentGpLookup';
host.innerHTML='<p id="assessmentGpHelp" role="status" aria-live="polite">Type three or more letters for NHS GP practice suggestions in England and Wales. Manual entry always works.</p><label id="assessmentGpChoice" hidden>Choose a matching GP practice<select id="assessmentGpSelect"><option value="">Choose a practice…</option></select></label>';
practice.closest('label').after(host);
const help=host.querySelector('p'),choice=host.querySelector('label'),select=host.querySelector('select');
host.style.maxWidth='100%';select.style.maxWidth='100%';select.style.minHeight='44px';
function visible(show){choice.hidden=!show;choice.style.display=show?'block':'none';}visible(false);
practice.setAttribute('aria-describedby',[practice.getAttribute('aria-describedby'),help.id].filter(Boolean).join(' '));
let timer=null,serial=0,controller=null,results=[];
function invalidate(){clearTimeout(timer);++serial;controller?.abort();controller=null;results=[];select.replaceChildren(new Option('Choose a practice…',''));visible(false);}
practice.addEventListener('input',()=>{
 invalidate();const q=practice.value.trim(),current=serial;
 if(q.length<3){help.textContent='Type at least three letters, or enter your GP details manually.';return;}
 if(q.length>80){help.textContent='Use a shorter practice name to search, or continue with manual details.';return;}
 timer=setTimeout(async()=>{
  const active=new AbortController();controller=active;const timeout=setTimeout(()=>active.abort(),7000);
  help.textContent='Searching the NHS GP practice directory…';
  try{
   const response=await fetch('/v1/member/details/gp-search?q='+encodeURIComponent(q),{credentials:'include',cache:'no-store',signal:active.signal});
   const body=await response.json();if(current!==serial||practice.value.trim()!==q)return;
   if(!response.ok)throw Error(response.status===401?'Sign in to My Timber for directory suggestions, or enter your GP details manually.':body.message||'GP search is unavailable. Please enter your GP details manually.');
   results=Array.isArray(body.practices)?body.practices.filter(p=>typeof p.name==='string'&&typeof p.postcode==='string').slice(0,12):[];
   results.forEach((p,i)=>select.add(new Option(p.name+' — '+p.postcode,String(i))));visible(results.length>0);
   help.textContent=results.length?'Choose your practice. Only the practice name and postcode are filled; check the GP name and full practice address below. Registration is not verified.':'No matching GP practice was returned. Enter the details manually.';
  }catch(error){if(current===serial)help.textContent=error.name==='AbortError'?'GP search timed out. Your typed details are unchanged; manual entry still works.':error.message;}
  finally{clearTimeout(timeout);}
 },800);
});
postcode.addEventListener('input',()=>{invalidate();help.textContent='Using your manually entered practice details.';});
select.addEventListener('change',()=>{
 if(select.value==='')return;const p=results[Number(select.value)];if(!p)return;
 practice.value=p.name;postcode.value=p.postcode;invalidate();
 help.textContent='Practice name and postcode selected. Check the GP name and full practice address before submitting. Registration is not verified.';
});
window.addEventListener('pagehide',invalidate);
})();`;
