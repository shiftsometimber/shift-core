export const goals={weight:'Lose weight',fitness:'Get fitter',energy:'Have more energy',habits:'Build better habits',maintain:'Maintain my progress'};
export const steps={food:{label:'Find a simple meal in Grub',url:'/member/grub'},movement:{label:'Explore movement in Fit',url:'/member/fit'},progress:{label:'Get to know my progress tracker',url:'/member/dashboard#journey'}};
export function normalise(input){
 const out={version:1,goals:[...new Set(input.goals||[])].filter(x=>goals[x]),barrier:['food','movement','sleep','motivation','time'].includes(input.barrier)?input.barrier:'',firstStep:input.firstStep,healthConsent:input.healthConsent===true};
 if(!steps[out.firstStep])throw Error('Choose a first step.');
 if(out.healthConsent){const units=readMeasurements(input);input={...input,...units};if(input.heightUnit||input.weightUnit||input.waistUnit||input.measurementUnits)out.measurementUnits=units.measurementUnits;for(const [key,min,max] of [['height',100,250],['weight',25,400],['waist',40,250]]){const raw=input[key];if(raw!==''&&raw!=null){const n=Number(raw);if(!Number.isFinite(n)||n<min||n>max)throw Error('Check your '+key+' measurement.');out[key]=n;}}
 out.treatment=['shift','elsewhere','stopped','considering','none'].includes(input.treatment)?input.treatment:'';out.treatmentType=['shift','elsewhere'].includes(out.treatment)&&['injection','tablet'].includes(input.treatmentType)?input.treatmentType:'';}
 return out;
}
export function initialJourney(existing,input,date){
 // Onboarding only fills empty baseline fields. It never replaces recorded progress.
 const next=structuredClone(existing||{});next.setup||={};next.weight||={};next.waist||={};
 if(!input.healthConsent)return null;
 let changed=false;
 const fill=(obj,key,value)=>{if(value!=null&&(obj[key]==null||obj[key]==='')){obj[key]=value;changed=true;}};
 fill(next.setup,'heightCm',input.height);fill(next.weight,'startKg',input.weight);fill(next.weight,'currentKg',input.weight);fill(next.waist,'startCm',input.waist);fill(next.waist,'currentCm',input.waist);
 if(!changed)return null;
 fill(next.setup,'startDate',date);fill(next.setup,'units','kg');
 if(!next.setup.route)next.setup.route=input.treatmentType||'lifestyle';
 return next;
}
export async function persist(api,userId,input,{explicitHealthConsent=false}={}){
 const check=async()=>{const me=await api.get('/v1/me');if(String(me.user?.id)!==String(userId))throw Error('Your signed-in account changed. Reload this page before saving.');};
 await check();
 if(input.healthConsent){
 const granted=async()=>{const r=await api.get('/v1/consents');if(!Array.isArray(r.consents))throw Error('Your tracking choice could not be checked. Nothing was saved.');const rows=r.consents.filter(x=>x.consent_type==='my_shift_health_tracking');if(rows.some(x=>!Number.isSafeInteger(Number(x.id))||Number(x.id)<1))throw Error('Your tracking choice could not be checked. Nothing was saved.');return Number(rows.sort((a,b)=>Number(b.id)-Number(a.id))[0]?.granted)===1;};
 if(!await granted()){if(!explicitHealthConsent)throw Object.assign(Error('Optional health tracking is off. Go back to Your starting point to review your choice, or leave health details off and finish setup.'),{code:'health_consent_required'});await check();await api.post('/v1/consents',{type:'my_shift_health_tracking',version:'2026-08-18-v1',granted:true});if(!await granted())throw Error('Your tracking choice was not confirmed. Please retry.');}
 await check();
 const before=(await api.get('/v1/journey')).journey;
 const journey=initialJourney(before,input,new Date().toLocaleDateString('en-CA',{timeZone:'Europe/London'}));
 if(journey){await check();await api.patch('/v1/journey',journey);const after=(await api.get('/v1/journey')).journey;for(const [group,key] of [['setup','heightCm'],['weight','startKg'],['weight','currentKg'],['waist','startCm'],['waist','currentCm']])if(journey[group]?.[key]!=null&&after[group]?.[key]!==journey[group][key])throw Error('Your starting point could not be confirmed. Please try again.');}
 }
 await check();
 const state=(await api.get('/v1/member-state')).state;
 const saved={...input,completedAt:new Date().toISOString(),consentVersion:input.healthConsent?'my-timber-setup-20261021':null};
 const payload={preferences:{...state.preferences,myTimberOnboarding:saved},myWhy:{...state.myWhy}};
 if(!payload.myWhy.why&&input.goals.length)payload.myWhy.why=input.goals.map(x=>goals[x]).join('; ');
 if(!payload.myWhy.promise)payload.myWhy.promise=steps[input.firstStep].label;
 await check();await api.patch('/v1/member-state',payload);
 const confirmation=(await api.get('/v1/member-state')).state?.preferences?.myTimberOnboarding;
 if(JSON.stringify(confirmation)!==JSON.stringify(saved))throw Error('Your setup could not be confirmed. Please try again.');
 return saved;
}


// Values remain centimetres/kilograms at the existing API boundary.
const optionalNumber=v=>v==null||v===''?null:Number(v);
const rounded=v=>v==null?null:Math.round(v*1e6)/1e6;
export function readMeasurements(input){
 const units={height:input.heightUnit||input.measurementUnits?.height||'cm',weight:input.weightUnit||input.measurementUnits?.weight||'kg',waist:input.waistUnit||input.measurementUnits?.waist||'cm'};
 if(!['cm','ft_in'].includes(units.height)||!['kg','stone_lb','lb'].includes(units.weight)||!['cm','in'].includes(units.waist))throw Error('Choose valid measurement units.');
 // Saved records already hold canonical values even when they remember imperial display units.
 const raw=!!(input.heightUnit||input.weightUnit||input.waistUnit);let height=optionalNumber(input.height),weight=optionalNumber(input.weight),waist=optionalNumber(input.waist);
 if(raw&&units.height==='ft_in'){const feet=optionalNumber(input.heightFeet),inches=optionalNumber(input.heightInches);if(feet===null&&inches===null)height=null;else{if(feet===null||!Number.isInteger(feet)||feet<0||inches!==null&&(!Number.isFinite(inches)||inches<0||inches>=12))throw Error('Enter whole feet and inches from 0 to less than 12.');height=(feet*12+(inches||0))*2.54;}}
 if(raw&&units.weight==='stone_lb'){const stone=optionalNumber(input.weightStone),pounds=optionalNumber(input.weightPounds);if(stone===null&&pounds===null)weight=null;else{if(stone===null||!Number.isInteger(stone)||stone<0||pounds!==null&&(!Number.isFinite(pounds)||pounds<0||pounds>=14))throw Error('Enter whole stone and pounds from 0 to less than 14.');weight=(stone*14+(pounds||0))*0.45359237;}}
 else if(raw&&units.weight==='lb'&&weight!==null)weight*=0.45359237;
 if(raw&&units.waist==='in'&&waist!==null)waist*=2.54;
 const out={measurementUnits:units};
 for(const[k,v,min,max]of[['height',height,100,250],['weight',weight,25,400],['waist',waist,40,250]]){if(v!==null){if(!Number.isFinite(v)||v<min||v>max)throw Error('Check your '+k+' measurement and selected units.');out[k]=rounded(v);}}
 return out;
}
export function displayMeasurement(kind,value,unit){
 if(value==null)return ['',''];const trim=n=>String(Math.round(n*1e6)/1e6);
 if(kind==='height'&&unit==='ft_in'){const total=value/2.54,feet=Math.floor(total/12);return [String(feet),trim(total-feet*12)];}
 if(kind==='weight'&&unit==='stone_lb'){const total=value/0.45359237,stone=Math.floor(total/14);return [String(stone),trim(total-stone*14)];}
 return [trim(kind==='waist'&&unit==='in'?value/2.54:kind==='weight'&&unit==='lb'?value/0.45359237:value),''];
}
