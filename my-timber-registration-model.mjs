export const goals={weight:'Lose weight',fitness:'Get fitter',energy:'Have more energy',habits:'Build better habits',maintain:'Maintain my progress'};
export const steps={food:{label:'Find a simple meal in Grub',url:'/member/grub'},movement:{label:'Explore movement in Fit',url:'/member/fit'},progress:{label:'Get to know my progress tracker',url:'/member/dashboard#journey'}};
export function normalise(input){
 if(!input||typeof input!=='object'||Array.isArray(input)||!Array.isArray(input.goals)||input.goals.length>5)throw Error('Check your setup choices.');
 const out={version:1,goals:[...new Set(input.goals||[])].filter(x=>Object.hasOwn(goals,x)),barrier:['food','movement','sleep','motivation','time'].includes(input.barrier)?input.barrier:'',firstStep:input.firstStep,healthConsent:input.healthConsent===true};
 if(!Object.hasOwn(steps,out.firstStep))throw Error('Choose a first step.');
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
