import fs from 'node:fs';
const BASE=(process.env.SHIFT_API_BASE||'https://api.shiftsometimber.co.uk').replace(/\/$/,'');
const ORIGIN='https://shiftsometimber.co.uk';
const AUTHORITY='matt-final-v1-2026-08-14';
const OIDC=String(process.env.SHIFT_COMMISSIONING_OIDC||'').trim();
const GRUB_FILE=process.env.GRUB_PUBLISHABLE_FILE||'grub-publication-evidence/grub-v1-publishable.json';
const FIT_FILE=process.env.FIT_PUBLISHABLE_FILE||'fit-publication-evidence/fit-v1-publishable.json';
const OUT=process.env.FINAL_V1_PRODUCTION_EVIDENCE_DIR||'final-v1-production-evidence';
if(!OIDC)throw new Error('SHIFT_COMMISSIONING_OIDC required');fs.mkdirSync(OUT,{recursive:true});
const grub=JSON.parse(fs.readFileSync(GRUB_FILE,'utf8')),fit=JSON.parse(fs.readFileSync(FIT_FILE,'utf8'));
const assert=(c,m)=>{if(!c)throw new Error(m)};
assert(grub?.proof==='M11_V1_PUBLISHABLE_CONTENT_V2_MEMBER_SERVING',`unexpected Grub proof ${grub?.proof}`);
assert(grub?.items?.length===798,`expected 798 accepted Grub items, got ${grub?.items?.length}`);
assert(fit?.proof==='FIT_V1_PUBLISHABLE_CONTENT_V1',`unexpected Fit proof ${fit?.proof}`);
assert(fit?.authority===AUTHORITY&&fit?.items?.length===26,`expected 26 accepted Fit items under ${AUTHORITY}`);
for(const x of [...grub.items,...fit.items])assert(x?.review?.status==='approved'&&x?.review?.authority===AUTHORITY,`accepted review authority missing ${x?.id}`);
const mealCounts=Object.fromEntries(['breakfast','lunch','dinner','snack'].map(t=>[t,grub.items.filter(x=>x?.data?.meal_type===t).length]));
assert(Object.values(mealCounts).every(n=>n>=150),`Grub per-meal launch floor failed ${JSON.stringify(mealCounts)}`);

async function api(path,{method='GET',body,cookie,oidc=true}={}){const h={Origin:ORIGIN};if(body!==undefined)h['content-type']='application/json';if(cookie)h.cookie=cookie;if(oidc)h['x-shift-commissioning-oidc']=OIDC;const r=await fetch(BASE+path,{method,headers:h,body:body===undefined?undefined:JSON.stringify(body)});let data=null;try{data=await r.json()}catch{}return{r,data,cookie:(r.headers.get('set-cookie')||'').split(';')[0]}}
const before=await api('/v1/commissioning/structured-content/status');assert(before.r.ok,`publication status route ${before.r.status} ${JSON.stringify(before.data)}`);
const all=[...grub.items,...fit.items];let batches=0,published=0;
for(let i=0;i<all.length;i+=25){const items=all.slice(i,i+25);const res=await api('/v1/commissioning/structured-content/batch',{method:'POST',body:{authority:AUTHORITY,items}});assert(res.r.ok,`publication batch ${batches+1} failed ${res.r.status} ${JSON.stringify(res.data)}`);assert(Number(res.data?.published)===items.length,`publication batch count mismatch ${batches+1}`);batches++;published+=items.length;}
const after=await api('/v1/commissioning/structured-content/status');assert(after.r.ok,`post-publication status ${after.r.status}`);assert(Number(after.data?.acceptedRecipes)===798,`accepted recipe count ${after.data?.acceptedRecipes}`);assert(Number(after.data?.acceptedExercises)===26,`accepted exercise count ${after.data?.acceptedExercises}`);assert(Number(after.data?.acceptedPublished)===824,`accepted total count ${after.data?.acceptedPublished}`);

const assetProof=[];for(const item of fit.items){const url=new URL(item.data.visual.asset_ref);const r=await fetch(url);const ct=r.headers.get('content-type')||'';assert(r.ok&&ct.includes('image/svg+xml'),`Fit asset not live ${url.pathname}: ${r.status} ${ct}`);assetProof.push({id:item.id,url:url.href,status:r.status,contentType:ct,authority:r.headers.get('x-shift-fit-visual-authority')||null});}

const nonce=`final-v1-${Date.now()}`,password='Shift-Commissioning-2026!',email=`shiftsometimber+${nonce}@gmail.com`;
const reg=await api('/v1/auth/register',{method:'POST',body:{email,firstName:'DaveFinalV1',password,source:'commissioning'},oidc:false});assert(reg.r.status===201,`member register ${reg.r.status} ${JSON.stringify(reg.data)}`);assert(reg.cookie,'member cookie missing');const cookie=reg.cookie;
const grubPlan=await api('/v1/grub/plan',{method:'POST',body:{days:1,calories:2000,protein_g:120,preferences:'family food'},cookie,oidc:false});assert(grubPlan.r.ok,`member Grub plan ${grubPlan.r.status}`);const meals=grubPlan.data?.plan?.days?.flatMap(d=>d.meals||[])||[];const acceptedGrubIds=new Set(grub.items.map(x=>String(x.id)));const servedGrub=meals.filter(x=>x?.structured?.published&&acceptedGrubIds.has(String(x.id)));assert(servedGrub.length>=1,'accepted final V1 Grub item was not actually served to member');
const fitPlan=await api('/v1/fit/plan',{method:'POST',body:{days:3,minutes_per_day:30,location:'home',equipment:['dumbbell','dumbbells','mat'],limitations:'no acute injuries'},cookie,oidc:false});assert(fitPlan.r.ok,`member Fit plan ${fitPlan.r.status}`);const exercises=fitPlan.data?.plan?.sessions?.flatMap(s=>s.exercises||[])||[];const acceptedFitIds=new Set(fit.items.map(x=>String(x.id)));const servedFit=exercises.filter(x=>x?.structured?.published&&acceptedFitIds.has(String(x.id)));assert(servedFit.length>=1,'accepted final V1 Fit item was not actually served to member');for(const x of servedFit)assert(x.visual?.status==='approved'&&String(x.visual?.asset_ref||'').includes('/fit-premium/'),'served final V1 Fit item lacks accepted premium visual');

const proof={proof:'FINAL_V1_PRODUCTION_PUBLICATION_AND_SERVING_V1',authority:AUTHORITY,published:{batches,records:published,recipes:Number(after.data.acceptedRecipes),exercises:Number(after.data.acceptedExercises),total:Number(after.data.acceptedPublished),mealCounts},assets:{proved:assetProof.length,items:assetProof},memberServing:{grub:{servedAccepted:servedGrub.map(x=>x.id),catalogue:grubPlan.data?.plan?.catalogue},fit:{servedAccepted:servedFit.map(x=>x.id),catalogue:fitPlan.data?.plan?.catalogue}},statusBefore:before.data,statusAfter:after.data};
fs.writeFileSync(`${OUT}/final-v1-production-publication-serving.json`,JSON.stringify(proof,null,2));
console.log(JSON.stringify({proof:proof.proof,authority:AUTHORITY,published:proof.published,fitAssets:assetProof.length,memberServing:{grub:servedGrub.map(x=>x.id),fit:servedFit.map(x=>x.id)}},null,2));
console.log('PASS exact accepted V1 authority is published into production D1, all 26 accepted Fit visuals are live, and authenticated member Grub/Fit journeys actually serve accepted descendants.');
