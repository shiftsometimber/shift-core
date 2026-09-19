// Isolated test database only. Never connected to production or real accounts.
import {DatabaseSync} from 'node:sqlite';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
export function fixture({filename=':memory:',seed=true}={}){
 const db=new DatabaseSync(filename);
 db.exec(`PRAGMA foreign_keys=ON;
 CREATE TABLE users(id INTEGER PRIMARY KEY,email TEXT,first_name TEXT,last_name TEXT);
 CREATE TABLE user_sessions(id INTEGER PRIMARY KEY,user_id INTEGER,token_hash TEXT,expires_at TEXT,revoked_at TEXT,last_used_at TEXT);
 CREATE TABLE consents(id INTEGER PRIMARY KEY,user_id INTEGER,consent_type TEXT,consent_version TEXT,granted INTEGER,granted_at TEXT,withdrawn_at TEXT,created_at TEXT);
 CREATE TABLE member_state(user_id INTEGER PRIMARY KEY,my_why TEXT DEFAULT '{}',roadmap TEXT DEFAULT '{}',treatment_finder TEXT DEFAULT '{}',decision_readiness TEXT DEFAULT '{}',preferences TEXT DEFAULT '{}',updated_at TEXT);
 CREATE TABLE audit_log(id INTEGER PRIMARY KEY,user_id INTEGER,action TEXT,entity_type TEXT,entity_id TEXT,metadata TEXT,created_at TEXT);
 CREATE TABLE progress_entries(id INTEGER PRIMARY KEY,user_id INTEGER,recorded_on TEXT,weight_kg REAL,waist_cm REAL,systolic REAL,diastolic REAL,resting_hr REAL,source TEXT,created_at TEXT);
 CREATE TABLE check_ins(id INTEGER PRIMARY KEY,user_id INTEGER,case_id INTEGER,wellbeing_score INTEGER,notes TEXT,submitted_at TEXT);
 CREATE TABLE assessments(id INTEGER PRIMARY KEY,user_id INTEGER,status TEXT,answers TEXT,outcome TEXT,created_at TEXT,updated_at TEXT);
 CREATE TABLE health_mot_results(id INTEGER PRIMARY KEY,user_id INTEGER,provider TEXT,collected_at TEXT,payload_json TEXT,created_at TEXT);
 CREATE TABLE medicine_orders(id INTEGER PRIMARY KEY,user_id INTEGER,order_number TEXT,medicine_name TEXT,strength_label TEXT,status TEXT,clinical_status TEXT,created_at TEXT,updated_at TEXT);
 CREATE TABLE shift_treatment_context(user_id INTEGER PRIMARY KEY,medicine TEXT,route TEXT,dose TEXT,status TEXT,updated_at TEXT);`);
 db.exec(readFileSync(new URL('./schema.sql',import.meta.url),'utf8'));
 const sessions=new Map();
 for(const id of [1,2]){
  const token='test-only-member-'+id;sessions.set(id,token);
  db.prepare('INSERT INTO users(id,email,first_name) VALUES(?,?,?)').run(id,'fictional-'+id+'@example.invalid',id===1?'Alex':'Sam');
  db.prepare('INSERT INTO user_sessions(id,user_id,token_hash,expires_at) VALUES(?,?,?,?)').run(id,id,createHash('sha256').update(token).digest('hex'),'2099-01-01T00:00:00Z');
  db.prepare("INSERT INTO consents(user_id,consent_type,granted) VALUES(?,'my_shift_health_tracking',?)").run(id,seed?1:0);
  const preferences=seed?{myJourney:{setup:{complete:true,startDate:'2026-08-01',heightCm:180,units:'kg',route:'lifestyle',targetMode:'loss',why:id===1?'More energy for weekends':'Other account private goal'},weight:{startKg:100,currentKg:96.5,targetKg:90},waist:{startCm:110,currentCm:106},healthInterests:['health-mot','sleep-apnoea'],updatedAt:'2026-09-17T08:00:00Z'},lifeBack:{progress:{revision:4}},grubV2:{savedRecipes:['kept']}}:{grubV2:{savedRecipes:['kept']}};
  db.prepare('INSERT INTO member_state(user_id,preferences) VALUES(?,?)').run(id,JSON.stringify(preferences));
 }
 if(seed){
  db.exec(`INSERT INTO progress_entries(user_id,recorded_on,weight_kg,waist_cm,systolic,diastolic,source,created_at) VALUES(1,'2026-09-17',96.5,106,126,82,'member','2026-09-17T08:00:00Z'),(2,'2026-09-17',123,120,NULL,NULL,'private-second-account','2026-09-17T08:00:00Z');
  INSERT INTO assessments(user_id,status,answers,outcome,created_at) VALUES(1,'completed','{"energy":"Improving","sleep":"Mixed"}','"Personal questionnaire recorded. Not a diagnosis."','2026-09-10T08:00:00Z');
  INSERT INTO health_mot_results(user_id,provider,collected_at,payload_json,created_at) VALUES(1,'Fictional preview lab','2026-09-12','{"results":[{"code":"demo","label":"Fictional demonstration result","value":5.2,"unit":"demo units","status":"unknown"}],"review":{"state":"unreviewed"}}','2026-09-13T08:00:00Z');
  INSERT INTO medicine_orders(user_id,order_number,medicine_name,strength_label,status,clinical_status,created_at) VALUES(1,'PREVIEW-ONLY-0001','Fictional demonstration medicine','Not for treatment','cancelled','not_started','2026-09-03T08:00:00Z');`);
 }
 const DB={prepare(sql){let args=[];const statement={bind(...a){args=a;return this},_run(){const r=db.prepare(sql).run(...args);return {success:true,meta:{changes:Number(r.changes),last_row_id:Number(r.lastInsertRowid)}}},async first(column){const row=db.prepare(sql).get(...args)||null;return column?row?.[column]:row},async all(){return{results:db.prepare(sql).all(...args)}},async run(){return this._run()}};return statement},async exec(sql){db.exec(sql)},async batch(statements){db.exec('BEGIN');try{const result=statements.map(s=>s._run());db.exec('COMMIT');return result}catch(error){db.exec('ROLLBACK');throw error}}};
 return {db,DB,sessions,env:{DB,HEALTH_PASSPORT_V1_ENABLED:'true',MEMBER_EXPERIENCE_V1_ENABLED:'true'},close:()=>db.close()};
}
// One clock sample is essential: two calls can accidentally create a TTL of 30m + 1ms.
export const draft=(now=Date.now())=>({version:1,id:crypto.randomUUID(),createdAt:new Date(now).toISOString(),expiresAt:new Date(now+1800000).toISOString(),answers:{why:['Lose weight','Feel more energy'],med:['No medication'],access:['NHS'],budget:['£0 / NHS']}});
export const treatment=()=>({medicine:'Personal test medicine',dose:'As on my own record',provider:'Fictional prescriber',startedOn:'2026-08-01',endedOn:null,status:'current',note:'Personal history only'});
export function request(path='',method='GET',body,id=1,headers={}){return new Request('https://shiftsometimber.co.uk/v1/health-passport'+path,{method,headers:{...(id?{Cookie:'sst_session=test-only-member-'+id}:{}),'Content-Type':'application/json',...headers},...(body!==undefined?{body:JSON.stringify(body)}:{})});}
