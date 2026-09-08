import {recordAuthDelivery} from './auth-delivery-v1.js';

const DEFAULT_FROM='hello@shiftsometimber.co.uk';
const INTERNAL_RECIPIENTS=['hello@shiftsometimber.co.uk','matt@shiftsometimber.co.uk'];

export async function sendTransactionalEmail(env,{to,subject,text,html,eventType,userId=null,internalNotify=false}){
  const recipients=[to,...(internalNotify?INTERNAL_RECIPIENTS:[])].filter(Boolean);
  const unique=[...new Set(recipients.map(x=>String(x).trim().toLowerCase()))];
  const results=[];
  for(const email of unique){
    if(!env.EMAIL){
      await recordAuthDelivery(env.DB,{userId,email,eventType,status:'binding_missing'});
      results.push({email,status:'binding_missing'});
      continue;
    }
    try{
      const result=await env.EMAIL.send({
        from:{email:String(env.TRANSACTIONAL_EMAIL_FROM||DEFAULT_FROM),name:'Shift Some Timber'},
        to:email,subject:String(subject||'SHIFT update').slice(0,180),
        text:String(text||''),html:String(html||'')
      });
      const providerId=result?.id||result?.messageId||null;
      await recordAuthDelivery(env.DB,{userId,email,eventType,status:'sent',providerId});
      results.push({email,status:'sent',providerId});
    }catch(e){
      const errorCode=String(e?.code||e?.name||e?.message||'delivery_error').replace(/[^a-zA-Z0-9_.:-]/g,'_').slice(0,120);
      await recordAuthDelivery(env.DB,{userId,email,eventType,status:'failed',errorCode});
      console.error('transactional_email_failed',eventType,email,errorCode);
      results.push({email,status:'failed',errorCode});
    }
  }
  return results;
}

export const medicineEmailTemplates={
  orderConfirmation:o=>({subject:`SHIFT order ${o.orderNumber||''} received`,text:`Your SHIFT order has been received and is moving to clinical checks.`,html:`<h1>Order received</h1><p>Your order has been received and is moving to clinical checks.</p>`}),
  clinicalStatus:o=>({subject:`SHIFT clinical status update`,text:`Your clinical status is now: ${o.status||'updated'}.`,html:`<h1>Clinical status update</h1><p>Your status is now: <strong>${o.status||'updated'}</strong>.</p>`}),
  interestNotify:o=>({subject:`SHIFT interest registered`,text:`We have registered your interest and will update you when this route is genuinely available.`,html:`<h1>Interest registered</h1><p>We’ll update you when this route is genuinely available.</p>`})
};
