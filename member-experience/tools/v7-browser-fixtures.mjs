// Dedicated browser fixtures cloned only from the existing synthetic test rows.
// Never copies member data or writes to the production database.
import fs from 'node:fs';import crypto from 'node:crypto';
import {cloudflareRequest as cf} from '/Users/shiftsometimberltd/SST/builds/apple-completion-20261024/journey-shop-release-20261031/performance-precompiled-cloudflare-client-20261103.mjs';
const account='9e5386dcf455be34c582d93f8bfc79e6',database='247b065f-fea4-4891-945b-b707f2417656';
const query=async(sql,params=[])=>{const r=await cf('/accounts/'+account+'/d1/database/'+database+'/query','POST',{sql,params});if(r.some(x=>!x.success))throw Error('Test fixture query failed');return r[0].results;};
const file='/private/tmp/my-timber-v7-browser-access.json',access=fs.existsSync(file)?JSON.parse(fs.readFileSync(file)):{};
for(const [engine,offset]of [['chromium',100],['webkit',200]]){
 access[engine]||={};
 for(const [name,source]of [['choose',900710001],['hard-week',900710002],['milestone',900710003]]){
  const base=(await query('SELECT u.email,m.preferences FROM users u JOIN member_state m ON m.user_id=u.id WHERE u.id=?',[source]))[0];
  if(base?.email!=='v7-'+name+'@example.invalid')throw Error('Synthetic source ownership failed');
  const id=source+offset,email='v7-'+engine+'-'+name+'@example.invalid',existing=(await query('SELECT email FROM users WHERE id=?',[id]))[0];
  if(existing&&existing.email!==email)throw Error('Destination is not the owned synthetic account');
  const item=access[engine][name]||{id,email,token:crypto.randomBytes(32).toString('hex')};
  const preferences=JSON.parse(base.preferences),progress=preferences.lifeBack.progress;
  // Remove only this dedicated fixture's current-day action; historical seed
  // rows remain exactly 12 or 29. No real-account IDs are accepted here.
  const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/London'}).format(new Date());
  delete progress.v7.days[today];progress.operations=[];progress.revision=0;progress.v7.milestones={};progress.v7.preferences={showWeight:true,lead:'weight'};
  if(progress.v7.fit){progress.v7.fit.days={};progress.v7.fit.moves={};progress.v7.fit.feedback={};progress.v7.fit.healthTags=[];}
  await query('INSERT INTO users(id,email,first_name,last_name) VALUES(?,?,?,?) ON CONFLICT(id) DO NOTHING',[id,email,'V7 synthetic',engine+' '+name]);
  await query('INSERT INTO member_state(user_id,preferences) VALUES(?,?) ON CONFLICT(user_id) DO UPDATE SET preferences=excluded.preferences',[id,JSON.stringify(preferences)]);
  await query('DELETE FROM member_food_entries WHERE user_id=?',[id]);
  await query("INSERT INTO consents(user_id,consent_type,consent_version,granted,granted_at) VALUES(?,'my_shift_health_tracking','synthetic-v7',1,?)",[id,new Date().toISOString()]);
  await query('INSERT INTO user_sessions(user_id,token_hash,expires_at) VALUES(?,?,?) ON CONFLICT(token_hash) DO UPDATE SET expires_at=excluded.expires_at,revoked_at=NULL',[id,crypto.createHash('sha256').update(item.token).digest('hex'),new Date(Date.now()+7*86400000).toISOString()]);
  access[engine][name]=item;
 }
}
fs.writeFileSync(file,JSON.stringify(access),{mode:0o600});
console.log(JSON.stringify({syntheticOnly:true,accounts:Object.values(access).flatMap(x=>Object.values(x).map(({email,id})=>({email,id})))}));
