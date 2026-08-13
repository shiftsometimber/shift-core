// Shift Me V1 — authenticated browser API adapter.
(function(){
  'use strict';
  const API_ROOT=(window.SST_API_BASE||'https://api.shiftsometimber.co.uk').replace(/\/$/,'');
  const ROOT=API_ROOT+'/v1/shift-me';
  function apiError(body,status){const e=new Error((body&&body.message)||((body&&body.error)||`Shift Me returned ${status}.`));e.status=status;e.code=body&&body.error;e.body=body;return e;}
  async function renderShiftMe(file,appearance={}){
    const form=new FormData();form.append('image',file,'shift-me-source.jpg');form.append('consent','true');form.append('appearance',JSON.stringify(appearance||{}));
    const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),90000);
    try{const res=await fetch(ROOT+'/render',{method:'POST',credentials:'include',cache:'no-store',body:form,signal:controller.signal});const body=await res.json();if(!res.ok)throw apiError(body,res.status);return body;}
    catch(err){if(err&&err.name==='AbortError'){const e=new Error('Shift Me took too long to render. Please try again.');e.code='timeout';throw e;}throw err;}
    finally{clearTimeout(timer)}
  }
  async function getShiftMe(){const res=await fetch(ROOT,{credentials:'include',cache:'no-store'});const body=await res.json();if(!res.ok)throw apiError(body,res.status);return body;}
  async function deleteShiftMe(){const res=await fetch(ROOT,{method:'DELETE',credentials:'include',cache:'no-store'});const body=await res.json();if(!res.ok)throw apiError(body,res.status);return body;}
  function shiftMeImageUrl(){return ROOT+'/image?ts='+Date.now();}
  window.SST_SHIFT_ME={renderShiftMe,getShiftMe,deleteShiftMe,shiftMeImageUrl};
  if(window.SST_API){Object.assign(window.SST_API,{renderShiftMe,getShiftMe,deleteShiftMe,shiftMeImageUrl});}
})();
