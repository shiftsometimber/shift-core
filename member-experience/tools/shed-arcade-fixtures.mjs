// Two owned synthetic accounts in the isolated test database only. No mail.
import fs from 'node:fs';import crypto from 'node:crypto';import assert from 'node:assert/strict';
import {cloudflareRequest as cf} from '/Users/shiftsometimberltd/SST/builds/apple-completion-20261024/journey-shop-release-20261031/performance-precompiled-cloudflare-client-20261103.mjs';
const db='247b065f-fea4-4891-945b-b707f2417656',account='9e5386dcf455be34c582d93f8bfc79e6',file='/private/tmp/my-timber-shed-arcade-test-access.json';
const query=async(sql,params=[])=>{const r=await cf('/accounts/'+account+'/d1/database/'+db+'/query','POST',{sql,params});assert(r.every(x=>x.success!==false));return r[0].results;};
const source=(await query('SELECT u.email,m.preferences FROM users u JOIN member_state m ON u.id=m.user_id WHERE u.id=?',[900710004]))[0];assert.equal(source.email,'v7-phone@example.invalid');
const access=fs.existsSync(file)?JSON.parse(fs.readFileSync(file)):{};
for(const [name,id]of [['one',900710401],['two',900710402]]){
 const email='shed-arcade-'+name+'@example.invalid',existing=(await query('SELECT email FROM users WHERE id=?',[id]))[0];assert(!existing||existing.email===email);
 const prefs=JSON.parse(source.preferences);delete prefs.shedArcade;
 const row=access[name]||{id,email,token:crypto.randomBytes(32).toString('hex'),secondToken:crypto.randomBytes(32).toString('hex')};
 await query('INSERT INTO users(id,email,first_name,last_name) VALUES(?,?,?,?) ON CONFLICT(id) DO NOTHING',[id,email,'Synthetic arcade',name]);
 await query('INSERT INTO member_state(user_id,preferences) VALUES(?,?) ON CONFLICT(user_id) DO UPDATE SET preferences=excluded.preferences',[id,JSON.stringify(prefs)]);
 await query("INSERT INTO consents(user_id,consent_type,consent_version,granted,granted_at) VALUES(?,'my_shift_health_tracking','synthetic-arcade',1,?)",[id,new Date().toISOString()]);
 for(const token of [row.token,row.secondToken])await query('INSERT INTO user_sessions(user_id,token_hash,expires_at) VALUES(?,?,?) ON CONFLICT(token_hash) DO UPDATE SET expires_at=excluded.expires_at,revoked_at=NULL',[id,crypto.createHash('sha256').update(token).digest('hex'),new Date(Date.now()+7*86400000).toISOString()]);
 row.password||=crypto.randomBytes(24).toString('base64url');
 const salt=crypto.randomBytes(16),hash='pbkdf2$100000$'+salt.toString('base64url')+'$'+crypto.pbkdf2Sync(row.password,salt,100000,32,'sha256').toString('base64url');
 await query('INSERT INTO user_auth(user_id,password_hash,email_verified,email_verified_at) VALUES(?,?,1,?) ON CONFLICT(user_id) DO UPDATE SET password_hash=excluded.password_hash,email_verified=1,email_verified_at=excluded.email_verified_at,failed_login_attempts=0,locked_until=NULL',[id,hash,new Date().toISOString()]);
 access[name]=row;
}
fs.writeFileSync(file,JSON.stringify(access),{mode:0o600});console.log(JSON.stringify({database:'isolated-test',syntheticAccounts:Object.values(access).map(({id,email})=>({id,email})),emailsSent:0}));
