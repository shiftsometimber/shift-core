import {DatabaseSync} from 'node:sqlite';
import {createHash} from 'node:crypto';
class Statement{
 constructor(db,sql){this.db=db;this.sql=sql;this.args=[];}
 bind(...args){this.args=args;return this;}
 async first(){return this.db.prepare(this.sql).get(...this.args)||null;}
 async all(){return {results:this.db.prepare(this.sql).all(...this.args)};}
 async run(){const r=this.db.prepare(this.sql).run(...this.args);return {success:true,meta:{changes:Number(r.changes),last_row_id:Number(r.lastInsertRowid)}};}
}
export class FixtureDB{
 constructor(file=':memory:'){
  this.sqlite=new DatabaseSync(file);
  this.sqlite.exec(`CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY,date_of_birth TEXT);
   CREATE TABLE IF NOT EXISTS user_sessions(id INTEGER PRIMARY KEY,user_id INTEGER,token_hash TEXT,expires_at TEXT,revoked_at TEXT,last_used_at TEXT);
   CREATE TABLE IF NOT EXISTS consents(id INTEGER PRIMARY KEY,user_id INTEGER,consent_type TEXT,granted INTEGER,consent_version TEXT,granted_at TEXT,withdrawn_at TEXT,created_at TEXT);
   CREATE TABLE IF NOT EXISTS member_state(user_id INTEGER PRIMARY KEY,my_why TEXT DEFAULT '{}',roadmap TEXT DEFAULT '{}',treatment_finder TEXT DEFAULT '{}',decision_readiness TEXT DEFAULT '{}',preferences TEXT NOT NULL DEFAULT '{}',updated_at TEXT);
   CREATE TABLE IF NOT EXISTS member_status(user_id INTEGER PRIMARY KEY,last_activity_at TEXT,updated_at TEXT);
   CREATE TABLE IF NOT EXISTS progress_entries(id INTEGER PRIMARY KEY,user_id INTEGER,source TEXT);
   CREATE TABLE IF NOT EXISTS check_ins(id INTEGER PRIMARY KEY,user_id INTEGER,case_id INTEGER);
   CREATE TABLE IF NOT EXISTS support_tickets(id INTEGER PRIMARY KEY,reference TEXT UNIQUE,user_id INTEGER,subject TEXT,priority TEXT,status TEXT,body TEXT,assigned_hq_user_id INTEGER,created_at TEXT,updated_at TEXT,closed_at TEXT);
   CREATE TABLE IF NOT EXISTS audit_log(id INTEGER PRIMARY KEY,user_id INTEGER,action TEXT,entity_type TEXT,entity_id TEXT,metadata TEXT,created_at TEXT);`);
 }
 prepare(sql){return new Statement(this.sqlite,sql);}
 async batch(statements){this.sqlite.exec('BEGIN IMMEDIATE');try{const out=[];for(const s of statements)out.push(await s.run());this.sqlite.exec('COMMIT');return out;}catch(e){this.sqlite.exec('ROLLBACK');throw e;}}
 close(){this.sqlite.close();}
}
export function fixture(t,file){const DB=new FixtureDB(file);t?.after(()=>DB.close());for(const id of [1,2]){
 DB.sqlite.prepare('INSERT OR IGNORE INTO users VALUES(?,?)').run(id,'1985-01-01');
 DB.sqlite.prepare('INSERT OR IGNORE INTO member_state(user_id) VALUES(?)').run(id);
 DB.sqlite.prepare('INSERT OR IGNORE INTO member_status(user_id) VALUES(?)').run(id);
 DB.sqlite.prepare('INSERT OR IGNORE INTO user_sessions VALUES(?,?,?,?,NULL,NULL)').run(id,id,createHash('sha256').update('fixture-token-'+id).digest('hex'),'2027-10-01');
 DB.sqlite.prepare("INSERT OR IGNORE INTO consents(id,user_id,consent_type,granted,created_at) VALUES(?,?,'my_shift_health_tracking',1,'2026-10-02')").run(id,id);
 }return DB;}
export function request(method='GET',body=null,member=1,extra={}){return new Request('https://shiftsometimber.co.uk/v1/shift-coach',{method,headers:{Cookie:'sst_session=fixture-token-'+member,...(method!=='GET'?{Origin:'https://shiftsometimber.co.uk','Content-Type':'application/json'}:{}),...extra},body:body?JSON.stringify(body):undefined});}
export const setupInput=revision=>({kind:'setup',revision,operationId:crypto.randomUUID(),goal:'Enjoy time with the family',week:'Three late shifts and no free evenings',focus:'food',stage:'Just starting',mode:'elsewhere'});
