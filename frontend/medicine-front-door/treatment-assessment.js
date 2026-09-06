const API='https://api.shiftsometimber.co.uk';
const params=new URLSearchParams(location.search);
const variantId=Number(params.get('variant'));
const returnTo=String(params.get('returnTo')||'/treatment-order');
const form=document.querySelector('#assessment');
const status=document.querySelector('#status');
const previous=document.querySelector('#previousTreatment');
const previousDetails=document.querySelector('#previousDetails');
document.querySelector('#variantId').value=Number.isInteger(variantId)&&variantId>0?String(variantId):'';
previous.onchange=()=>{const yes=previous.value==='yes';previousDetails.hidden=!yes;for(const input of previousDetails.querySelectorAll('input'))input.required=yes};
function finish(result){
  sessionStorage.setItem(`sst-medicine-verification:${variantId}`,JSON.stringify({token:result.verificationToken,expiresAt:result.expiresAt}));
  const target=returnTo.startsWith('/')&&!returnTo.startsWith('//')?returnTo:'/treatment-order';
  status.textContent='Verified. Returning you to secure payment…';
  setTimeout(()=>location.assign(target+(target.includes('?')?'&':'?')+'verified=1'),700);
}
async function waitFor(reference){
  for(let attempt=0;attempt<40;attempt++){
    await new Promise(resolve=>setTimeout(resolve,3000));
    const response=await fetch(`${API}/v1/commerce/medicine-clinical-intake-status?reference=${encodeURIComponent(reference)}`,{credentials:'include',cache:'no-store'});
    const result=await response.json();
    if(!response.ok)throw Error(result.message||result.error||'Verification status could not be checked');
    if(result.verified&&result.verificationToken)return finish(result);
    status.textContent='The pharmacy partner is checking your verification. Keep this page open…';
  }
  throw Error('Verification is still being reviewed. No payment has been taken; return later to continue.');
}
form.onsubmit=async event=>{
  event.preventDefault();
  const button=form.querySelector('button[type="submit"]');
  if(!variantId){status.textContent='Choose a treatment before starting verification.';return}
  button.disabled=true;
  status.textContent='Sending securely to the pharmacy partner…';
  try{
    const intake=await fetch(`${API}/v1/commerce/medicine-clinical-intake`,{method:'POST',credentials:'include',body:new FormData(form)});
    const result=await intake.json();
    if(!intake.ok)throw Error(result.message||result.error||'The verification could not be submitted');
    if(result.verified&&result.verificationToken)return finish(result);
    status.textContent='Details received. The pharmacy partner is checking them before payment opens…';
    await waitFor(result.intakeReference);
  }catch(error){status.textContent=error.message;button.disabled=false}
};
