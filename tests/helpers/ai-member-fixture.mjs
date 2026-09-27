import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {createHash} from 'node:crypto';
import {buildMemberJourneyContext,requestMemberJourney} from '../../member-experience/ai-context.mjs';
import {askTimberRoutes} from '../../ask-timber-v1.js';
import {buildShiftBrainContext} from '../../shift-brain-v1.js';
import {ukDate} from '../../member-experience/journey-context.mjs';

class Statement {
  constructor(db,sql){this.db=db;this.sql=sql;this.args=[]}
  bind(...args){this.args=args;return this}
  async first(){this.db.reads.push(this.sql);return this.db.sqlite.prepare(this.sql).get(...this.args)||null}
  async all(){this.db.reads.push(this.sql);return {results:this.db.sqlite.prepare(this.sql).all(...this.args)}}
  async run(){this.db.writes.push(this.sql);const r=this.db.sqlite.prepare(this.sql).run(...this.args);return {success:true,meta:{changes:Number(r.changes),last_row_id:Number(r.lastInsertRowid)}}}
}
class D1 {
  constructor(){this.sqlite=new DatabaseSync(':memory:');this.reads=[];this.writes=[]}
  prepare(sql){return new Statement(this,sql)}
  async exec(sql){this.writes.push(sql);this.sqlite.exec(sql)}
  async batch(statements){this.sqlite.exec('BEGIN');try{const rows=[];for(const s of statements)rows.push(await s.run());this.sqlite.exec('COMMIT');return rows}catch(e){this.sqlite.exec('ROLLBACK');throw e}}
}
const sha=v=>createHash('sha256').update(v).digest('hex');
const ratings=n=>Object.fromEntries(['energy','sleep','confidence','movement','clothes','personal'].map(k=>[k,n]));
const entry=(goalId,at,n=60,win='Synthetic weekend win')=>({id:'entry-'+at,goalId,at,ratings:ratings(n),win});
const currentDate=()=>ukDate(new Date());
function preferences(id=1){
  const date=currentDate(),at=new Date(Date.now()-60000).toISOString(),goalId='goal-'+id;
  return {
    myJourney:{setup:{startDate:'2026-01-01',targetMode:'loss',focus:'movement',why:'Synthetic purpose '+id,reviewCadence:'weekly',paused:false},weight:{startKg:110,currentKg:100,targetKg:90},updatedAt:at},
    grubV2:{today:{date,recipeId:'recipe-'+id,name:id===1?'Synthetic Lentil Bowl':'OTHER_MEMBER_PRIVATE_MEAL',chosenAt:at,minutes:15,kcal:480,protein_g:32},week:[{day:1},{day:2}],options:{style:'fast',servings:2,exclude:'mushrooms'},learning:{yay:['liked-'+id],nay:['disliked-'+id]}},
    fitJourney:{entries:{done:{status:'done',exerciseId:'march',recordedOn:date,updatedAt:at},skipped:{status:'skipped',exerciseId:'squat',recordedOn:date,updatedAt:at},old:{status:'done',exerciseId:'walk',recordedOn:'2001-01-01',updatedAt:at}}},
    lifeBack:{progress:{version:3,revision:2,goalId,goal:id===1?'Enjoying weekend walks':'OTHER_MEMBER_PRIVATE_GOAL',entries:[entry(goalId,at,60,id===1?'Synthetic first win':'OTHER_MEMBER_PRIVATE_WIN')],operations:[]}}
  };
}
function fixture(t){
  const DB=new D1();t.after(()=>DB.sqlite.close());
  DB.sqlite.exec(`
    CREATE TABLE users(id INTEGER PRIMARY KEY,email TEXT,first_name TEXT,last_name TEXT,date_of_birth TEXT,postcode TEXT);
    CREATE TABLE user_sessions(id INTEGER PRIMARY KEY,user_id INTEGER,token_hash TEXT,expires_at TEXT,revoked_at TEXT,last_used_at TEXT);
    CREATE TABLE member_state(user_id INTEGER PRIMARY KEY,preferences TEXT,my_why TEXT DEFAULT '{}',roadmap TEXT DEFAULT '{}',treatment_finder TEXT DEFAULT '{}',decision_readiness TEXT DEFAULT '{}');
    CREATE TABLE member_status(user_id INTEGER PRIMARY KEY,lifecycle_stage TEXT,membership_status TEXT);
    CREATE TABLE consents(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER,consent_type TEXT,granted INTEGER,created_at TEXT DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE check_ins(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER,case_id INTEGER,wellbeing_score INTEGER,notes TEXT,submitted_at TEXT);
    CREATE TABLE my_journey_weekly_checkins(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER,week_ending TEXT,weight_kg REAL,waist_cm REAL,overall_feeling TEXT,mood TEXT,energy TEXT,confidence TEXT,sleep TEXT,confirmed_at TEXT);
    INSERT INTO users VALUES(1,'PRIVATE_EMAIL_ONE@example.test','Synthetic','One','PRIVATE_DOB_ONE','PRIVATE_POSTCODE_ONE'),(2,'PRIVATE_EMAIL_TWO@example.test','Synthetic','Two','PRIVATE_DOB_TWO','PRIVATE_POSTCODE_TWO');
    INSERT INTO member_status VALUES(1,'member','active'),(2,'member','active');
  `);
  for(const id of [1,2]){
    DB.sqlite.prepare('INSERT INTO user_sessions VALUES(?,?,?,?,NULL,NULL)').run(id,id,sha('synthetic-'+id),'2099-01-01T00:00:00Z');
    DB.sqlite.prepare('INSERT INTO member_state(user_id,preferences) VALUES(?,?)').run(id,JSON.stringify(preferences(id)));
    DB.sqlite.prepare("INSERT INTO consents(user_id,consent_type,granted) VALUES(?,'my_shift_health_tracking',1)").run(id);
    DB.sqlite.prepare('INSERT INTO check_ins(user_id,wellbeing_score,notes,submitted_at) VALUES(?,?,?,?)').run(id,4,'PRIVATE_MOOD_NOTE_'+id,new Date(Date.now()-60000).toISOString());
  }
  const calls=[];
  const AI={run:async(model,options)=>{calls.push(options);return {response:JSON.stringify({answer:'Your saved records are available.',keyPoints:[],nextSteps:[],followUps:[],confidence:'high',limitations:'Saved choices and self-reported records only.'})}}};
  return {DB,AI,calls,env:{DB,AI}};
}
const getPrefs=(DB,id=1)=>JSON.parse(DB.sqlite.prepare('SELECT preferences FROM member_state WHERE user_id=?').get(id).preferences);
const putPrefs=(DB,p,id=1)=>DB.sqlite.prepare('UPDATE member_state SET preferences=? WHERE user_id=?').run(JSON.stringify(p),id);
const consent=(DB,id,granted)=>DB.sqlite.prepare("INSERT INTO consents(user_id,consent_type,granted) VALUES(?,'my_shift_health_tracking',?)").run(id,granted?1:0);
function request(body={},token='synthetic-1',origin='https://shiftsometimber.co.uk'){
  return new Request('https://api.shiftsometimber.co.uk/v1/ai/chat',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json',...(token?{Cookie:'sst_session='+token}:{})},body:JSON.stringify({message:'What is my chosen meal and my personal goal?',useJourney:true,...body})});
}
const ask=(env,body,token,origin)=>askTimberRoutes(request(body,token,origin),env);
const prompt=calls=>calls.map(call=>call.messages.map(m=>m.content).join('\n')).join('\n');


export {fixture,ask,request,getPrefs,putPrefs,consent};
