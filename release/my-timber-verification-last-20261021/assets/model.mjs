export const goals={weight:'Lose weight',fitness:'Get fitter',energy:'Have more energy',habits:'Build better habits',maintain:'Maintain my progress'};
export const steps={food:{label:'Find a simple meal in Grub',url:'/member/grub'},movement:{label:'Explore movement in Fit',url:'/member/fit'},progress:{label:'Get to know my progress tracker',url:'/member/dashboard#journey'}};
export function normalise(input){
 const out={version:1,goals:[...new Set(input.goals||[])].filter(x=>goals[x]),barrier:['food','movement','sleep','motivation','time'].includes(input.barrier)?input.barrier:'',firstStep:input.firstStep,healthConsent:input.healthConsent===true};
 if(!steps[out.firstStep])throw Error('Choose a first step.');
 if(out.healthConsent){for(const [key,min,max] of [['height',100,250],['weight',25,400],['waist',40,250]]){const raw=input[key];if(raw!==''&&raw!=null){const n=Number(raw);if(!Number.isFinite(n)||n<min||n>max)throw Error('Check your '+key+' measurement.');out[key]=n;}}
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
export async function persist(api,userId,input){
 const check=async()=>{const me=await api.get('/v1/me');if(String(me.user?.id)!==String(userId))throw Error('Your signed-in account changed. Reload this page before saving.');};
 await check();
 const before=(await api.get('/v1/journey')).journey;
 const journey=initialJourney(before,input,new Date().toLocaleDateString('en-CA',{timeZone:'Europe/London'}));
 if(journey){await api.patch('/v1/journey',journey);const after=(await api.get('/v1/journey')).journey;for(const [group,key] of [['setup','heightCm'],['weight','startKg'],['weight','currentKg'],['waist','startCm'],['waist','currentCm']])if(journey[group]?.[key]!=null&&after[group]?.[key]!==journey[group][key])throw Error('Your starting point could not be confirmed. Please try again.');}
 await check();
 const state=(await api.get('/v1/member-state')).state;
 const saved={...input,completedAt:new Date().toISOString(),consentVersion:input.healthConsent?'my-timber-setup-20261021':null};
 const payload={preferences:{...state.preferences,myTimberOnboarding:saved},myWhy:{...state.myWhy}};
 if(!payload.myWhy.why&&input.goals.length)payload.myWhy.why=input.goals.map(x=>goals[x]).join('; ');
 if(!payload.myWhy.promise)payload.myWhy.promise=steps[input.firstStep].label;
 await api.patch('/v1/member-state',payload);
 const confirmation=(await api.get('/v1/member-state')).state?.preferences?.myTimberOnboarding;
 if(JSON.stringify(confirmation)!==JSON.stringify(saved))throw Error('Your setup could not be confirmed. Please try again.');
 return saved;
}
