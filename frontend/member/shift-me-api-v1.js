// Shift Me V1 — authenticated browser API adapter.
(function(){
  'use strict';
  const API_ROOT=(window.SST_API_BASE||'https://api.shiftsometimber.co.uk').replace(/\/$/,'');
  const ROOT=API_ROOT+'/v1/shift-me';
  const FRIENDLY_ERRORS={image_required:'Choose a clear photo first.',unsupported_image_type:'That photo format is not supported. Choose a JPG, PNG or WebP image.',image_too_large:'That photo is over 3MB. Choose a smaller one.',consent_required:'Please confirm that Shift can use this photo to create your Shift Me.',invalid_multipart:'We could not read that photo. Try choosing it again.',invalid_json:'We could not read those changes. Please try again.',ai_unavailable:'Shift Me is temporarily unavailable. Your account and saved character are safe—please try again shortly.',generation_failed:'We could not create that version of your Shift Me. Try the photo or changes again.',shift_me_required:'Create your Shift Me before applying changes.',shift_me_recreate_required:'This saved Shift Me uses the earlier image format. Delete it and create a fresh version once; future changes will then work normally.',shift_me_service_error:'Shift Me hit a problem while completing that request. Your account is safe—please try again.',not_found:'Your saved Shift Me could not be found.'};
  function apiError(body,status){const code=body&&body.error;const fallback=status===401?'Your session has ended. Sign in again to continue.':status>=500?'Shift Me is temporarily unavailable. Please try again shortly.':'Shift Me could not complete that request. Please try again.';const e=new Error((body&&body.message)||FRIENDLY_ERRORS[code]||fallback);e.status=status;e.code=code;e.body=body;return e;}
  async function withTimeout(task){const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),90000);try{return await task(controller.signal)}catch(err){if(err&&err.name==='AbortError'){const e=new Error('Shift Me took too long to render. Please try again.');e.code='timeout';throw e}throw err}finally{clearTimeout(timer)}}
  async function createShiftMe(appearance={}){return withTimeout(async signal=>{const res=await fetch(ROOT+'/create',{method:'POST',credentials:'include',cache:'no-store',headers:{'Content-Type':'application/json'},body:JSON.stringify({appearance:appearance||{}}),signal});const body=await res.json();if(!res.ok)throw apiError(body,res.status);return body})}
  async function modelReadyImage(file){
    if(!file||typeof createImageBitmap!=='function')return file;
    const bitmap=await createImageBitmap(file),limit=448,scale=Math.min(1,limit/bitmap.width,limit/bitmap.height);
    if(scale===1){bitmap.close?.();return file}
    const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));
    canvas.getContext('2d',{alpha:false}).drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close?.();
    const blob=await new Promise((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(new Error('We could not prepare that photo. Try choosing it again.')),'image/jpeg',0.9));
    return new File([blob],'shift-me-source.jpg',{type:'image/jpeg'});
  }
  async function renderShiftMe(file,appearance={}){const prepared=await modelReadyImage(file);return withTimeout(async signal=>{const form=new FormData();form.append('image',prepared,'shift-me-source.jpg');form.append('consent','true');form.append('appearance',JSON.stringify(appearance||{}));const res=await fetch(ROOT+'/render',{method:'POST',credentials:'include',cache:'no-store',body:form,signal});const body=await res.json();if(!res.ok)throw apiError(body,res.status);return body})}
  async function rerenderShiftMe(appearance={}){return withTimeout(async signal=>{const res=await fetch(ROOT+'/rerender',{method:'POST',credentials:'include',cache:'no-store',headers:{'Content-Type':'application/json'},body:JSON.stringify({appearance:appearance||{}}),signal});const body=await res.json();if(!res.ok)throw apiError(body,res.status);return body})}
  async function getShiftMe(){const res=await fetch(ROOT,{credentials:'include',cache:'no-store'});const body=await res.json();if(!res.ok)throw apiError(body,res.status);return body;}
  async function deleteShiftMe(){const res=await fetch(ROOT,{method:'DELETE',credentials:'include',cache:'no-store'});const body=await res.json();if(!res.ok)throw apiError(body,res.status);return body;}
  function shiftMeImageUrl(){return ROOT+'/image?ts='+Date.now();}
  window.SST_SHIFT_ME={createShiftMe,renderShiftMe,rerenderShiftMe,getShiftMe,deleteShiftMe,shiftMeImageUrl};
  if(window.SST_API){Object.assign(window.SST_API,{createShiftMe,renderShiftMe,rerenderShiftMe,getShiftMe,deleteShiftMe,shiftMeImageUrl});}
})();
