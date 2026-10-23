import webpush from 'web-push';
import {validEndpoint} from './model.mjs';
export async function sendSupportPush(env,row,body,transport=fetch){
 if(!validEndpoint(row.endpoint))return 'expired';
 const identity=await env.DB.prepare('SELECT public_key,private_key,subject FROM fit_notification_config WHERE id=1').first();if(!identity)throw Error('push_unavailable');
 const payload=webpush.generateRequestDetails({endpoint:row.endpoint,keys:{p256dh:row.p256dh,auth:row.auth}},JSON.stringify(body),{TTL:1800,urgency:'normal',contentEncoding:'aes128gcm',vapidDetails:{publicKey:identity.public_key,privateKey:identity.private_key,subject:identity.subject}});
 const r=await transport(row.endpoint,{method:payload.method,headers:payload.headers,body:payload.body,redirect:'manual',signal:AbortSignal.timeout(10000)});
 return r.ok?'accepted':[404,410].includes(r.status)?'expired':'rejected';
}
