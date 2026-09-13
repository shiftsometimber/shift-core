(()=>{'use strict';
  const $=s=>document.querySelector(s),all=s=>[...document.querySelectorAll(s)];
  const medicine=$('[data-medication-select]'),dose=$('[data-dose-select]'),next=$('[data-op-step="0"] [data-op-next]');
  if(!medicine||!dose||!next)return;
  const names={mounjaro:'mounjaro','wegovy-injection':'wegovy injection','wegovy-tablet':'wegovy tablet',foundayo:'foundayo',orlistat:'orlistat'};
  let products=[],enabled=false;
  const chosen=()=>{const product=products.find(p=>p.name.toLowerCase()===names[medicine.value]);const variants=(product?.variants||[]).filter(v=>{const label=String(v.strengthLabel||'');const amount=medicine.value==='orlistat'?(label.match(/(\d+)\s*capsules?/i)||[])[1]:(label.match(/\d+(?:\.\d+)?/)||[])[0];return amount!==undefined&&Number(amount)===Number(dose.value)});const variant=variants.length===1?variants[0]:null;return variant?.status==='available'&&(!product.status||product.status==='available')?variant:null};
  const notice=document.createElement('p');notice.className='op-validation';notice.setAttribute('role','status');
  function sync(){if(!enabled)return;const variant=chosen();next.disabled=!variant;next.textContent=variant?'Continue to payment →':'No stock available today';next.onclick=()=>{const selected=chosen();if(selected)location.assign(`/treatment-checkout?variant=${encodeURIComponent(selected.id)}`)};notice.textContent='After successful payment, your patient details, health questions, GP details and supporting photos open automatically. Treatment still requires clinical approval.';const stock=$('[data-stock-status]');if(stock)stock.textContent=variant?'Available · clinical assessment after payment':'No stock available today';const context=$('[data-stage-context]');if(context&&$('input[name="treatment-stage"]:checked')?.value!=='new')context.textContent='Choose the strength you currently use. After payment, the pharmacy reviews your treatment history and evidence before confirming suitability.';}
  async function boot(){try{const r=await fetch('/v1/catalogue/medicines',{credentials:'omit',cache:'no-store'}),body=await r.json();if(!r.ok||body.intakeFlow!=='shift_v2')return;products=body.products||[];enabled=true;
    all('[data-op-step]').forEach(section=>section.hidden=section.dataset.opStep!=='0');
    all('.op-bmi-gate,.op-life-priorities,.op-ready-checklist').forEach(section=>{section.hidden=true;section.querySelectorAll('input,select,textarea,button').forEach(control=>control.disabled=true)});
    all('.op-progress b span').forEach((node,i)=>node.textContent=['Choose','Pay','Your details','Clinical review'][i]||node.textContent);
    all('.op-progress b').forEach((node,i)=>node.classList.toggle('active',i===0));
    next.parentElement.before(notice);
    // Bubble-phase listeners run after the existing selection/dose handlers.
    document.addEventListener('change',event=>{if(event.target===medicine||event.target===dose||event.target.matches('input[name="treatment-stage"]'))sync()});
    document.addEventListener('input',sync);
    document.addEventListener('change',sync);
    // The existing catalogue refresh may finish after our own request.
    const price=$('[data-stock-status]');if(price){let updating=false;new MutationObserver(()=>{if(updating)return;const expected=chosen()?'Available · clinical assessment after payment':'No stock available today';if(price.textContent!==expected){updating=true;sync();updating=false}}).observe(price,{childList:true})}
    sync();
  }catch{next.disabled=true;next.textContent='Ordering unavailable';}}
  boot();
})();
