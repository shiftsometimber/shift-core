// Synthetic UI fixtures only. No provider request, Checkout Session, payment,
// message or member record is created. The review states are explicitly seeded
// for presentation tests and are not evidence of a financial integration.
import fs from 'node:fs';import crypto from 'node:crypto';
import {cloudflareRequest as cf} from '/Users/shiftsometimberltd/SST/builds/apple-completion-20261024/journey-shop-release-20261031/performance-precompiled-cloudflare-client-20261103.mjs';
const A='9e5386dcf455be34c582d93f8bfc79e6',D='247b065f-fea4-4891-945b-b707f2417656';
const query=async(sql,params=[])=>{const r=await cf('/accounts/'+A+'/d1/database/'+D+'/query','POST',{sql,params});if(!r.every(x=>x.success))throw Error('Fixture query failed');return r[0].results;};
const file='/private/tmp/my-timber-welcome-test-access.json',access=fs.existsSync(file)?JSON.parse(fs.readFileSync(file)):{};
const source=(await query('SELECT u.email,m.preferences FROM users u JOIN member_state m ON m.user_id=u.id WHERE u.id=?',[900710001]))[0];
if(source?.email!=='v7-choose@example.invalid')throw Error('Synthetic source boundary');
for(const [engine,offset]of [['chromium',0],['webkit',10]]){
 access[engine]||={};
 for(const [name,n,complete,status]of [['first',1,false,null],['browse',5,false,null],['returning',2,true,null],['review',3,true,'assessment_pending'],['declined',4,true,'refund_pending']]){
  const id=900710500+offset+n,email='welcome-'+engine+'-'+name+'@example.invalid',old=(await query('SELECT email FROM users WHERE id=?',[id]))[0];
  if(old&&old.email!==email)throw Error('Destination boundary');
  const a=access[engine][name]||{id,email,token:crypto.randomBytes(32).toString('hex')};
  const prefs=JSON.parse(source.preferences);prefs.lifeBack.progress.v7.days={};prefs.lifeBack.progress.v7.milestones={};prefs.lifeBack.progress.operations=[];prefs.lifeBack.progress.revision=0;
  if(complete)prefs.myJourney.setup.completedAt=new Date().toISOString();else delete prefs.myJourney.setup.completedAt;
  await query('INSERT INTO users(id,email,first_name,last_name) VALUES(?,?,?,?) ON CONFLICT(id) DO NOTHING',[id,email,'Synthetic','Welcome '+name]);
  await query('INSERT INTO member_state(user_id,preferences) VALUES(?,?) ON CONFLICT(user_id) DO UPDATE SET preferences=excluded.preferences',[id,JSON.stringify(prefs)]);
  await query("INSERT INTO consents(user_id,consent_type,consent_version,granted,granted_at) VALUES(?,'my_shift_health_tracking','synthetic-welcome',?,?)",[id,complete?1:0,new Date().toISOString()]);
  await query('INSERT INTO user_sessions(user_id,token_hash,expires_at) VALUES(?,?,?) ON CONFLICT(token_hash) DO UPDATE SET expires_at=excluded.expires_at,revoked_at=NULL',[id,crypto.createHash('sha256').update(a.token).digest('hex'),new Date(Date.now()+86400000).toISOString()]);
  if(status){const ref='SYNTHETIC-WELCOME-UI-'+id;await query("INSERT INTO medicine_orders(order_number,user_id,email,medicine_id,variant_id,medicine_name,strength_label,unit_price_pence,total_pence,status,clinical_status) VALUES(?,?,?,1,1,'SYNTHETIC UI FIXTURE','NO MEDICINE',0,0,'paid',?) ON CONFLICT(order_number) DO UPDATE SET clinical_status=excluded.clinical_status",[ref,id,email,status]);}
  access[engine][name]=a;
 }
}
fs.writeFileSync(file,JSON.stringify(access),{mode:0o600});
console.log(JSON.stringify({syntheticOnly:true,noPaymentOrProviderRequests:true,accounts:Object.values(access).flatMap(x=>Object.values(x).map(({id,email})=>({id,email})))}));
