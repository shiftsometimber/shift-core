import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import hq from './hq-ai-v2.js';
import {knowledgeEditorialRoutes} from './knowledge-editorial-v1.js';

class D1Statement{constructor(db,sql,params=[]){this.db=db;this.sql=sql;this.params=params}bind(...params){return new D1Statement(this.db,this.sql,params.map(v=>v===undefined?null:v))}async run(){const r=this.db.prepare(this.sql).run(...this.params);return{success:true,meta:{last_row_id:Number(r.lastInsertRowid||0),changes:Number(r.changes||0)}}}async first(){return this.db.prepare(this.sql).get(...this.params)||null}async all(){return{results:this.db.prepare(this.sql).all(...this.params)}}catch(fn){return this.run().catch(fn)}}
class D1Database{constructor(){this.sqlite=new DatabaseSync(':memory:');this.sqlite.exec('PRAGMA foreign_keys = ON')}prepare(sql){return new D1Statement(this.sqlite,sql)}async batch(statements){const out=[];this.sqlite.exec('BEGIN');try{for(const s of statements)out.push(await s.run());this.sqlite.exec('COMMIT');return out}catch(e){this.sqlite.exec('ROLLBACK');throw e}}exec(sql){this.sqlite.exec(sql);return Promise.resolve({success:true})}}

const DB=new D1Database();
DB.sqlite.exec(`
CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT,email TEXT UNIQUE,first_name TEXT,last_name TEXT,phone TEXT,date_of_birth TEXT,postcode TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP,updated_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE user_auth (user_id INTEGER PRIMARY KEY,password_hash TEXT,email_verified INTEGER NOT NULL DEFAULT 0,email_verified_at TEXT,failed_login_attempts INTEGER NOT NULL DEFAULT 0,locked_until TEXT,last_login_at TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP,updated_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE member_status (user_id INTEGER PRIMARY KEY,lifecycle_stage TEXT,membership_status TEXT,source TEXT,last_activity_at TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP,updated_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE user_sessions (id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL,token_hash TEXT NOT NULL UNIQUE,expires_at TEXT NOT NULL,revoked_at TEXT,last_used_at TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE cases (id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER,reference TEXT,status TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP,updated_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE pharmacy_orders (id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER,case_id INTEGER,status TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP,updated_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE shift_plans (id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL,plan_type TEXT NOT NULL,starts_on TEXT,ends_on TEXT,status TEXT NOT NULL DEFAULT 'active',plan_json TEXT NOT NULL DEFAULT '{}',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE radar_audit (id INTEGER PRIMARY KEY AUTOINCREMENT,action TEXT NOT NULL,detail_json TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
`);
const env={DB,ADMIN_API_KEY:'g3-006-admin',AI:{},EMAIL:{}};
const origin='https://hq.shiftsometimber.co.uk';
const req=(path,{method='GET',body,headers={}}={})=>new Request(`https://api.shiftsometimber.co.uk${path}`,{method,headers:{Origin:origin,...headers,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});
const read=async r=>{const t=await r.text();try{return JSON.parse(t)}catch{return{text:t}}};
const hqCall=async(path,opts={})=>{const response=await hq.fetch(req(path,opts),env,{});return{response,body:await read(response.clone())}};
const editorial=async(path,opts={})=>{const response=await knowledgeEditorialRoutes(req(path,opts),env,{});return{response,body:await read(response.clone())}};

let x=await hqCall('/health');assert.equal(x.response.status,200);
// Anonymous editorial access is still denied by the existing HQ security boundary.
x=await editorial('/v1/hq/articles');assert.equal(x.response.status,401);

const email='g3-006-editor@shift.test',password='Shift-G3-006-Editor-2026!';
x=await hqCall('/v1/hq/auth/bootstrap',{method:'POST',headers:{'x-shift-admin-key':env.ADMIN_API_KEY},body:{email,name:'Commissioning Editor',password}});assert.equal(x.response.status,201,JSON.stringify(x.body));
x=await hqCall('/v1/hq/auth/login',{method:'POST',body:{email,password}});assert.equal(x.response.status,200,JSON.stringify(x.body));
const cookie=(x.response.headers.get('set-cookie')||'').split(';')[0];assert.match(cookie,/^sst_hq_session=/);const auth={Cookie:cookie};

const article={title:'Protein without the pub science',slug:'g3-006-protein',category:'Nutrition',author:'Shift Team',status:'draft',summary:'A plain-English reviewed Knowledge Hub commissioning article.',body:'Useful evidence-led member content.',seoTitle:'Protein guide',publishAt:null};
x=await editorial('/v1/hq/articles',{method:'POST',headers:auth,body:article});assert.ok([200,201].includes(x.response.status),JSON.stringify(x.body));
x=await editorial('/v1/hq/articles',{headers:auth});assert.equal(x.response.status,200);let a=x.body.articles.find(v=>v.slug===article.slug);assert.ok(a?.id);assert.equal(a.review,null);const articleId=a.id;

// Publishing cannot jump the editorial gate.
x=await editorial('/v1/hq/articles',{method:'POST',headers:auth,body:{...article,status:'published'}});assert.equal(x.response.status,409);assert.equal(x.body.error,'editorial_review_required');

// Named review is retained independently of the browser/session request.
x=await editorial(`/v1/hq/articles/${articleId}/review`,{method:'POST',headers:auth,body:{decision:'approved',notes:'Evidence, tone and claims checked for Knowledge Hub publication.'}});assert.equal(x.response.status,200,JSON.stringify(x.body));assert.equal(x.body.decision,'approved');assert.equal(x.body.reviewedBy,'Commissioning Editor');

// Simulate leave/return by issuing a fresh list request: the review identity, decision and note persist.
x=await editorial('/v1/hq/articles',{headers:auth});a=x.body.articles.find(v=>v.id===articleId);assert.equal(a.status,'review');assert.equal(a.review.decision,'approved');assert.equal(a.review.reviewer_name,'Commissioning Editor');assert.equal(a.review.reviewer_email,email);assert.match(a.review.notes,/Evidence, tone and claims checked/);assert.ok(a.review.reviewed_at);

// Only after retained approval can the same existing CMS contract publish the article.
x=await editorial('/v1/hq/articles',{method:'POST',headers:auth,body:{...article,status:'published'}});assert.ok([200,201].includes(x.response.status),JSON.stringify(x.body));
x=await editorial('/v1/hq/articles',{headers:auth});a=x.body.articles.find(v=>v.id===articleId);assert.equal(a.status,'published');assert.equal(a.review.decision,'approved');assert.equal(a.review.reviewer_name,'Commissioning Editor');

console.log(JSON.stringify({proof:'G3-006_KNOWLEDGE_EDITORIAL_REVIEW',anonymousDenied:true,editor:{name:'Commissioning Editor',role:'owner'},journey:['draft','publish_blocked_without_review','approved','leave_return_review_retained','published'],article:{id:articleId,slug:a.slug,status:a.status},review:{decision:a.review.decision,reviewer:a.review.reviewer_name,reviewerEmail:a.review.reviewer_email,notesRetained:true,reviewedAt:a.review.reviewed_at},expectedUserOutcome:'HQ editor can see who reviewed a Knowledge Hub article and publication cannot bypass retained approval.'},null,2));
console.log('PASS G3-006 governed Knowledge editorial journey: authenticated draft -> blocked premature publish -> named approval -> leave/return retained reviewer evidence -> publish.');
