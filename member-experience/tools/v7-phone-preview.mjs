// A short-lived, synthetic-only phone link. No sign-up, email or member data.
import fs from 'node:fs';import crypto from 'node:crypto';
import {cloudflareRequest as cf} from '/Users/shiftsometimberltd/SST/builds/apple-completion-20261024/journey-shop-release-20261031/performance-precompiled-cloudflare-client-20261103.mjs';
const account='9e5386dcf455be34c582d93f8bfc79e6',database='247b065f-fea4-4891-945b-b707f2417656',origin='https://shift-programme-my-timber-v7-test.matobrien.workers.dev';
const query=async(sql,params=[])=>{const r=await cf('/accounts/'+account+'/d1/database/'+database+'/query','POST',{sql,params});if(r.some(x=>!x.success))throw Error('Synthetic preview preparation failed');return r[0].results;};
const file='/private/tmp/my-timber-v7-phone-preview.json',old=fs.existsSync(file)?JSON.parse(fs.readFileSync(file)):null;
if(old&&Date.parse(old.expiresAt)>Date.now()+3600000){console.log(JSON.stringify({prepared:true,retained:true,account:old.email,expiresAt:old.expiresAt}));process.exit(0);}
const id=900710004,email='v7-phone@example.invalid',base=(await query('SELECT u.email,m.preferences FROM users u JOIN member_state m ON m.user_id=u.id WHERE u.id=?',[900710001]))[0];
if(base?.email!=='v7-choose@example.invalid')throw Error('Synthetic base ownership failed');
const exists=(await query('SELECT email FROM users WHERE id=?',[id]))[0];if(exists&&exists.email!==email)throw Error('Synthetic destination ownership failed');
const value={id,email,token:crypto.randomBytes(32).toString('hex'),code:crypto.randomBytes(32).toString('hex'),expiresAt:new Date(Date.now()+86400000).toISOString()};
const preferences=JSON.parse(base.preferences),progress=preferences.lifeBack.progress;delete progress.v7.days[new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/London'}).format(new Date())];progress.v7.milestones={};progress.operations=[];progress.revision=0;
await query('INSERT INTO users(id,email,first_name,last_name) VALUES(?,?,?,?) ON CONFLICT(id) DO NOTHING',[id,email,'V7 phone','Synthetic preview']);
await query('INSERT INTO member_state(user_id,preferences) VALUES(?,?) ON CONFLICT(user_id) DO UPDATE SET preferences=excluded.preferences',[id,JSON.stringify(preferences)]);
await query("INSERT INTO consents(user_id,consent_type,consent_version,granted,granted_at) VALUES(?,'my_shift_health_tracking','synthetic-preview',1,?)",[id,new Date().toISOString()]);
await query('INSERT INTO user_sessions(user_id,token_hash,expires_at) VALUES(?,?,?)',[id,crypto.createHash('sha256').update(value.token).digest('hex'),value.expiresAt]);
value.url=origin+'/__v7/preview/'+value.code;fs.writeFileSync(file,JSON.stringify(value),{mode:0o600});
console.log(JSON.stringify({prepared:true,account:email,expiresAt:value.expiresAt}));
