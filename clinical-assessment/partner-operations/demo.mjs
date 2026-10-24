import {newStaff,staffAction,fulfilmentAction,EVIDENCE,CHECKS} from './domain.mjs';
const date='2026-10-24T10:00:00.000Z',expiry='2027-10-24T10:00:00.000Z';
const actor={id:1,role:'owner',mfa:true,clinicalGovernor:true,pharmacyGovernor:true};
const organisation={id:'DEMO-CLINICAL',kind:'clinical',name:'Fictional Clinical Partner',registration:'DEMO—NOT A REGISTRATION',premises:'Fictional address',superintendent:'Fictional governance lead',contact:'demo@example.invalid'};
const pharmacy={...organisation,id:'DEMO-PHARMACY',kind:'pharmacy',name:'Fictional Dispensing Partner'};
function profile(id,kind){const s=newStaff({name:kind==='clinician'?'Alex Example · fictional clinician':'Sam Example · fictional pharmacist',email:id+'@example.invalid',kind,orgId:kind==='clinician'?organisation.id:pharmacy.id},id,date);Object.assign(s.details,{professionalContact:'Demo only',profession:kind==='clinician'?'Pharmacist prescriber':'Pharmacist',regulator:'DEMO ONLY',registrationNumber:'NOT-A-REAL-REGISTRATION',prescribingEntitlement:'Fictional scope',experience:'Fictional training evidence',indemnityProvider:'Fictional insurer',policyReference:'DEMO-POLICY'});s.evidence=EVIDENCE.map(kind=>({id:'DEMO-'+kind,kind,mime:'image/png',digest:'a'.repeat(64),uploadedAt:date,retentionUntil:expiry}));s.status='submitted';return s;}
const applicant=profile('DEMO-APPLICANT','clinician'),dispenser=profile('DEMO-DISPENSER','dispensing');
dispenser.status='active';dispenser.username='DSP-AABBCCDDEEFF';dispenser.hqUserId=12;dispenser.checks=CHECKS.map(kind=>({kind,outcome:'verified',credentialVersion:0,expiresAt:expiry,reviewedBy:'DEMO-VERIFIER'}));dispenser.grants=[{credentialVersion:0,id:'DEMO-GRANT',area:'weight_management',actions:['view_fulfilment','query','supply_decision','prepare','dispatch'],medicines:[],restrictions:'Fictional demonstration only',approvedBy:'DEMO-GOVERNOR',startsAt:date,expiresAt:expiry}];
const staff=new Map([[applicant.id,applicant],[dispenser.id,dispenser]]),organisations=[organisation,pharmacy],events=[];
const invitationDrafts=[];let stock=false;
let order={orderNumber:'DEMO-1042',partnerId:pharmacy.id,memberId:999,area:'weight_management',medicine:'Fictional medicine — not a real prescription',prescriptionId:'DEMO-RX-NOT-VALID',patient:{name:'Alex Example · fictional member'},delivery:{address:'Fictional delivery address'},status:'received',version:0,updatedAt:date};
export function toggleDemoStock(){stock=!stock;return stock;}
export async function demoFetch(url,options={}){
 const parts=new URL(url).pathname.split('/partners')[1]?.split('/').filter(Boolean)||[],data=options.body?JSON.parse(options.body):undefined;
 try{
  let result;
  if(parts[0]==='invitations'){if(data){const s=staff.get(data.staffId),draft={id:crypto.randomUUID(),kind:data.kind,recipient_name:s?.details.name||data.name,recipient_email:s?.details.email||data.email,subject:'FICTIONAL SHIFT invitation',body:'Fictional invitation preview only. Professional onboarding is not open. No invitation is sent and no access is granted.',status:'held_onboarding_closed'};invitationDrafts.push(draft);result={draft,sent:false,accessGranted:false};}else result={drafts:invitationDrafts,sent:false};}
  else if(parts[0]==='organisations'){if(data&&parts[1]){result=organisations.find(o=>o.id===parts[1]);Object.assign(result,{status:data.action==='approve'?'approved':'suspended',version:(result.version||0)+1});}else if(data){result={id:crypto.randomUUID(),...data};organisations.push(result);}else result={organisations};}
  else if(parts[0]==='fulfilment'){
   if(parts[2]==='action'){const r=fulfilmentAction(order,data,dispenser,{id:12,role:'clinical',mfa:true},new Date().toISOString(),crypto.randomUUID(),{prescriptionCurrent:true,stockAvailable:stock});order=r.state;events.push({actor_id:'DEMO-PHARMACIST',action:r.event.action,created_at:r.event.at});result={order,notificationStatus:'fictional_no_message'};}
   else result=parts.length===1?{orders:[order],oversight:false}:{order,oversight:false,events:[...events]};
  }else if(!parts.length){if(data){const s=newStaff(data,crypto.randomUUID(),new Date().toISOString());staff.set(s.id,s);result=s;}else result={staff:[...staff.values()].map(s=>({...s,name:s.details.name})),capabilities:{administrator:true,clinicalGovernor:true,pharmacyGovernor:true}};}
  else {const id=parts[0]==='me'?'DEMO-DISPENSER':parts[0],s=staff.get(id);if(!s)throw Object.assign(Error('staff_not_found'),{status:404});
   if(parts[1]==='action'){if(data.action==='approve')data.username='CLN-AABBCCDDEEFF';if(data.action==='activate')data.accountMfaVerified=false;const r=staffAction(s,data,actor,new Date().toISOString(),crypto.randomUUID());staff.set(id,r.state);events.push({actor_id:'DEMO-OWNER',action:r.event.action,created_at:r.event.at});result=r.state;}
   else if(parts[1]==='link'||parts[1]==='credentials')result={link:'https://hq.shiftsometimber.co.uk/clinical-portal/partners/application#FICTIONAL-NOT-A-REAL-LINK',expiresAt:expiry,sent:false};
   else if(parts[1]==='audit')result={events};else result=s;
  }
  return Response.json(result);
 }catch(e){return Response.json({error:e.message},{status:e.status||422});}
}
if(typeof document!=='undefined'&&document.body.dataset.mode==='dispensing'){
 const b=document.createElement('button');b.type='button';b.textContent='Demo stock: unavailable';b.addEventListener('click',()=>{b.textContent='Demo stock: '+(toggleDemoStock()?'available (fictional)':'unavailable');});document.querySelector('.toolbar').append(b);
}
