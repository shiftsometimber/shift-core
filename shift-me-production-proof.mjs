import fs from 'node:fs';
import crypto from 'node:crypto';

const BASE=(process.env.SHIFT_API_BASE||'https://api.shiftsometimber.co.uk').replace(/\/$/,'');
const ORIGIN='https://shiftsometimber.co.uk';
const OUT=process.env.SHIFT_ME_EVIDENCE_DIR||'shift-me-production-evidence';
const password='Shift-Commissioning-2026!';
const nonce=`shiftme-${Date.now()}`;
const SOURCE_B64='/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCQEsAUADASIAAhEBAxEB/8QAHQAAAQUBAQEAAAAAAAAAAAAAAAECAwQFBgcICf/EAEIQAAEDAgMFBQYEBQMFAAAAAAECAwQFEQASITFBBhMiUWFxFDKBkaGxByNCUsHR8BUzYnKSorLC4fEWNENzk//EABsBAAMBAQEBAAAAAAAAAAAAAAABAgMEBQYH/8QANhEAAgIBAwMDAgQEBwAAAAAAAAECEQMSITEEQVEFEyJhcYGRFDKhscHR8BQjQvEVM2KS/9oADAMBAAIRAxEAPwD5W4pLcq4Lr38RPxBGm3D3VbI0izXKrd/lrL3y3X2OWxrMMhrBdyGbTiW2nmHUH2u5sT9nfVX0Adq+zlYLW6KY7fr3fZ84+SbUeJVcB5q1r1VnIy3dR8moE2jvtxHY7Ngp1Vo2Wl3qRV5Rsu8Swmf47BPiK/Uqwlz0sJ7jN9rShPj1p0VVHeoHzm5WhmjvjnG3XrVPuu1tMuTkI7qkH3D0+PUhVQNbhrh6SVmUD6A8I5wy9zvyOdFYJVEdpTcBrm8gbt2c8Iyb5csH0dWnHJkgOn8+eI7T7qnsc7Hq0p3jju3kFvnfM9hVPVcWpOYgQ7NFZ2mVlH3rfS6h9mfQXfEiK1mEvkCnvHbw3I7kiW2Pn0+XKj0q5xJjGic0E9zxryY5CGv1x9kKc7K4j+sXFX2TxHM1R+vms9NuXpYcOl0qxlBMd6p4b6rHfydkOWrHFV2+rRoNVfQiM1PW5FpRjyRDNou9wjh8j+YysfuvhF0wzLnBih1HKOvhySzDfxnJ9y8+XKpVjPsuZVbwylqnI7dZkF4ck8h5ULW7XnGmptcOH7dBwY3qtQVji6JbPpxWqfKfb9OQGHU1MqFp+SdBmj+smd4fcMi0pIqLgBgO7D5zYG+8K79A3nM6FjqA//9k=';
fs.mkdirSync(OUT,{recursive:true});

const assert=(c,m)=>{if(!c)throw new Error(m)};
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');

async function jsonCall(path,{method='GET',body,cookie}={}){
  const h={Origin:ORIGIN};
  if(cookie)h.Cookie=cookie;
  let payload;
  if(body!==undefined){
    if(body instanceof FormData) payload=body;
    else {h['Content-Type']='application/json';payload=JSON.stringify(body)}
  }
  const r=await fetch(BASE+path,{method,headers:h,body:payload});
  let data=null; try{data=await r.json()}catch{}
  return {r,data,cookie:(r.headers.get('set-cookie')||'').split(';')[0]};
}
async function register(label){
  const email=`shiftsometimber+${nonce}-${label.toLowerCase()}@gmail.com`;
  const x=await jsonCall('/v1/auth/register',{method:'POST',body:{email,password,firstName:`ShiftMe${label}`,source:'commissioning'}});
  assert(x.r.status===201,`register ${label} failed: ${x.r.status} ${JSON.stringify(x.data)}`);
  assert(x.cookie,`register ${label} missing session`);
  return {email,cookie:x.cookie};
}
async function getImage(cookie,label){
  const r=await fetch(BASE+'/v1/shift-me/image',{headers:{Origin:ORIGIN,Cookie:cookie},cache:'no-store'});
  assert(r.ok,`${label} image fetch failed ${r.status}`);
  const buf=Buffer.from(await r.arrayBuffer());
  assert(buf.length>1000,`${label} image unexpectedly small`);
  fs.writeFileSync(`${OUT}/${label}.png`,buf);
  return {buf,sha256:hash(buf),bytes:buf.length};
}
async function render(cookie,appearance){
  const src=Buffer.from(SOURCE_B64,'base64');
  const form=new FormData();
  form.append('image',new File([src],'ordinary-bloke-test.jpg',{type:'image/jpeg'}));
  form.append('consent','true');
  form.append('appearance',JSON.stringify(appearance));
  const x=await jsonCall('/v1/shift-me/render',{method:'POST',body:form,cookie});
  assert(x.r.status===201,`initial render failed ${x.r.status} ${JSON.stringify(x.data)}`);
  assert(x.data?.shiftMe?.id,'initial render missing Shift Me id');
  assert(x.data?.sourcePhotoStored===false,'source photo retention contract failed');
  return x.data;
}
async function rerender(cookie,appearance){
  const x=await jsonCall('/v1/shift-me/rerender',{method:'POST',body:appearance,cookie});
  assert(x.r.status===201,`rerender failed ${x.r.status} ${JSON.stringify(x.data)}`);
  assert(x.data?.shiftMe?.id,'rerender missing Shift Me id');
  return x.data;
}

const A=await register('A'), B=await register('B');
const first={build:'Average',bodyShape:'Straight',face:'Oval',hair:'Short',hairline:'Mature',facial:'Short beard',skin:'Light-medium',eyes:'Hazel',glasses:'Keep source glasses',top:'Black tee',bottom:'Black joggers',accessory:'None'};
const changed={build:'Stocky',bodyShape:'Round middle',face:'Fuller',hair:'Bald',hairline:'Bald',facial:'Full beard',skin:'Light-medium',eyes:'Hazel',glasses:'Black rectangular',top:'Olive hoodie',bottom:'Olive joggers',accessory:'None'};
const bLook={build:'Broad',bodyShape:'Broad shoulders',face:'Square',hair:'Buzz cut',hairline:'High',facial:'Stubble',skin:'Light-medium',eyes:'Hazel',glasses:'No glasses',top:'White tee',bottom:'Black shorts',accessory:'None'};

await render(A.cookie,first);
const aInitial=await getImage(A.cookie,'a-initial');
const bBefore=await jsonCall('/v1/shift-me',{cookie:B.cookie});
assert(bBefore.r.ok&&bBefore.data?.shiftMe===null,'member B could see A Shift Me metadata');
const bImageBefore=await fetch(BASE+'/v1/shift-me/image',{headers:{Origin:ORIGIN,Cookie:B.cookie}});
assert(bImageBefore.status===404,'member B could retrieve A image');

await rerender(A.cookie,changed);
const aChanged=await getImage(A.cookie,'a-changed');
assert(aInitial.sha256!==aChanged.sha256,'creator control rerender returned identical image bytes');
const aMeta=await jsonCall('/v1/shift-me',{cookie:A.cookie});
assert(aMeta.r.ok,'A metadata read failed');
for(const [k,v] of Object.entries(changed))assert(aMeta.data?.shiftMe?.appearance?.[k]===v,`appearance persistence mismatch ${k}`);

await render(B.cookie,bLook);
const bRendered=await getImage(B.cookie,'b-rendered');
assert(bRendered.sha256!==aChanged.sha256,'A/B images unexpectedly identical');
const aAfterB=await getImage(A.cookie,'a-after-b');
assert(aAfterB.sha256===aChanged.sha256,'member B render contaminated A Shift Me');

const delA=await jsonCall('/v1/shift-me',{method:'DELETE',cookie:A.cookie});
assert(delA.r.ok&&delA.data?.deleted===true,'A delete failed');
const aAfterDelete=await jsonCall('/v1/shift-me',{cookie:A.cookie});
assert(aAfterDelete.r.ok&&aAfterDelete.data?.shiftMe===null,'A metadata remained after delete');
const aImageDeleted=await fetch(BASE+'/v1/shift-me/image',{headers:{Origin:ORIGIN,Cookie:A.cookie}});
assert(aImageDeleted.status===404,'A generated image remained retrievable after delete');

await jsonCall('/v1/shift-me',{method:'DELETE',cookie:B.cookie});
const summary={
  at:new Date().toISOString(),
  source:'non-member synthetic ordinary-bloke commissioning fixture',
  sourcePhotoStored:false,
  initial:{sha256:aInitial.sha256,bytes:aInitial.bytes},
  changed:{sha256:aChanged.sha256,bytes:aChanged.bytes},
  bRendered:{sha256:bRendered.sha256,bytes:bRendered.bytes},
  visibleControlChangeEvidence:'binary image changed after same-member controlled rerender',
  isolationEvidence:'B had no A metadata/image before own render; B render did not alter A image',
  persistenceEvidence:changed,
  deletionEvidence:'A metadata null and image 404 after DELETE',
  humanVisualAcceptanceRequired:true,
  storyboardAuthority:'Matt-approved Timber Mill storyboard remains final visual acceptance authority'
};
fs.writeFileSync(`${OUT}/summary.json`,JSON.stringify(summary,null,2));
console.log('SHIFT ME PRODUCTION TECHNICAL PROOF PASS',JSON.stringify(summary));
