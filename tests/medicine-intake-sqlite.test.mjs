import assert from 'node:assert/strict';
import test from 'node:test';
import {DatabaseSync} from 'node:sqlite';
import {createHash} from 'node:crypto';
import {QUESTIONS,QUESTIONNAIRE_VERSION} from '../assessment-v2/schema.mjs';
import {medicineCommerceRoutes} from '../medicine-commerce-v1.js';

// Executes the production queries and schema against an isolated real SQLite
// database. Only provider HTTP is synthetic; this is not a partner acceptance.
function database() {
  const sql = new DatabaseSync(':memory:');
  sql.exec(`PRAGMA foreign_keys=ON;
    CREATE TABLE users(id INTEGER PRIMARY KEY,email TEXT,first_name TEXT,last_name TEXT);
    CREATE TABLE user_auth(user_id INTEGER PRIMARY KEY,email_verified INTEGER);
    CREATE TABLE user_sessions(token_hash TEXT PRIMARY KEY,user_id INTEGER,expires_at TEXT,revoked_at TEXT);
    CREATE TABLE medicine_products(id INTEGER PRIMARY KEY,name TEXT,form TEXT,status TEXT,partner TEXT,sellable INTEGER,availability_state TEXT);
    CREATE TABLE medicine_variants(id INTEGER PRIMARY KEY,medicine_id INTEGER,strength_label TEXT,status TEXT,partner TEXT,sellable INTEGER,availability_state TEXT);
    CREATE TABLE medicine_inventory(variant_id INTEGER PRIMARY KEY,stock_on_hand INTEGER,reserved INTEGER);
    INSERT INTO users VALUES(41,'first@example.test','Synthetic','First'),(42,'second@example.test','Synthetic','Second');
    INSERT INTO user_auth VALUES(41,1),(42,1);
    INSERT INTO medicine_products VALUES(1,'Mounjaro','injection','available','synthetic-provider',1,'available');
    INSERT INTO medicine_variants VALUES(102,1,'5 mg','available','synthetic-provider',1,'available');
    INSERT INTO medicine_inventory VALUES(102,10,0);`);
  for (const [id,token] of [[41,'first'],[42,'second']]) sql.prepare('INSERT INTO user_sessions VALUES(?,?,?,NULL)').run(createHash('sha256').update(token).digest('hex'),id,'2099-01-01T00:00:00Z');
  const DB = {
    prepare(query) {
      let args=[];
      return {bind(...values){args=values;return this},
        async first(column){const row=sql.prepare(query).get(...args);return row?(column?row[column]:{...row}):null},
        async all(){return {results:sql.prepare(query).all(...args).map(x=>({...x})),success:true}},
        async run(){const result=sql.prepare(query).run(...args);return {success:true,meta:{changes:Number(result.changes),last_row_id:Number(result.lastInsertRowid)}}},
      };
    },
    async batch(statements){sql.exec('BEGIN');try{const rows=[];for(const stmt of statements)rows.push(await stmt.run());sql.exec('COMMIT');return rows}catch(error){sql.exec('ROLLBACK');throw error}},
  };
  return {sql,DB};
}
function assessment(submissionId=crypto.randomUUID(),overrides={}) {
  const form=new FormData();
  const fields={submissionId,variantId:'102',patientFirstName:'Synthetic',patientLastName:'First',patientPhone:'01610000000',patientAddress1:'1 Test Street',patientTown:'Test town',patientPostcode:'AA1 1AA',dateOfBirth:'1981-08-03',heightCm:'180',weightKg:'100',weightRelatedCondition:'no',conditions:'None',medicines:'None',insulinUse:'no',previousTreatment:'no',gpName:'Dr Test',gpPractice:'Test Practice',gpAddress:'Test Street',gpPostcode:'AA1 1AA',gpContactConsent:'on',answersConfirmed:'on',imageConsent:'on',...overrides};
  for(const [key,value]of Object.entries(fields))form.set(key,value);
  for(const key of ['photoId','bodyFront','bodySide'])form.set(key,new File(['synthetic image'],key+'.jpg',{type:'image/jpeg'}));
  return form;
}
async function fixture(t,provider,extraEnv={}) {
  const {DB,sql}=database();t.after(()=>sql.close());
  const original=globalThis.fetch;const calls=[];
  globalThis.fetch=async(url,init)=>{assert.equal(new URL(url).origin,'https://pharmacy.example.test');calls.push({url,init});return provider(url,init)};
  t.after(()=>{globalThis.fetch=original});
  const env={DB,PHARMACY_CLINICAL_INTAKE_URL:'https://pharmacy.example.test/intake',PHARMACY_CLINICAL_RESUME_URL:'https://pharmacy.example.test/resume',PHARMACY_PORTAL_ORIGIN:'https://portal.example.test',PHARMACY_INTEGRATION_SECRET:'synthetic-only',...extraEnv};
  async function request(path,{method='GET',body,token='first',callback=false}={}){
    const headers=callback?{Authorization:'Bearer synthetic-only'}:{Cookie:'sst_session='+token,Origin:'https://shiftsometimber.co.uk'};
    if(body&&!(body instanceof FormData))headers['Content-Type']='application/json';
    const response=await medicineCommerceRoutes(new Request('https://api.shiftsometimber.co.uk'+path,{method,headers,...(body?{body:body instanceof FormData?body:JSON.stringify(body)}:{})}),env,{});
    return {status:response.status,body:await response.json()};
  }
  return {sql,calls,request};
}
const intake='/v1/commerce/medicine-clinical-intake';
const status='/v1/commerce/medicine-clinical-intake-status';
const callback='/v1/integrations/pharmacy/clinical-intake-status';

test('real SQL persists one complete assessment, rejects changed replay and isolates reopening',async t=>{
  const f=await fixture(t,()=>Response.json({reference:'provider-case',patientReference:'provider-patient',status:'submitted'}));
  const id=crypto.randomUUID();const first=await f.request(intake,{method:'POST',body:assessment(id)});
  assert.equal(first.status,202);assert.equal(first.body.prescribingApproved,false);
  const repeat=await f.request(intake,{method:'POST',body:assessment(id)});assert.equal(repeat.body.intakeReference,first.body.intakeReference);assert.equal(f.calls.length,1);
  const changed=await f.request(intake,{method:'POST',body:assessment(id,{medicines:'Changed answer'})});assert.equal(changed.status,409);assert.equal(f.calls.length,1);
  assert.equal((await f.request(status+'?reference='+first.body.intakeReference,{token:'second'})).status,404);
  const stored=f.sql.prepare('SELECT * FROM medicine_clinical_intakes').get();assert.equal(stored.provider_patient_reference,'provider-patient');assert.equal(stored.consent_version,'medicine-clinical-intake-v1-2026-09-06');assert.equal(Object.keys(JSON.parse(stored.evidence_receipts_json)).length,3);
  assert.equal(f.sql.prepare('SELECT count(*) AS n FROM medicine_intake_attempts').get().n,1);
  const sent=f.calls[0].init.body;assert.equal(sent.get('patientEmail'),'first@example.test');assert.equal(sent.get('strengthLabel'),'5 mg');assert.equal(sent.get('clientReference'),first.body.intakeReference);
  const receipt=JSON.parse(sent.get('evidenceReceipts'));for(const entry of Object.values(receipt)){assert.match(entry.sha256,/^[a-f0-9]{64}$/);assert.equal(entry.bytes,15)}
  assert(!JSON.stringify(stored).includes('1 Test Street'));assert(!JSON.stringify(stored).includes('1981-08-03'));
});

test('real SQL rejects mismatched callbacks, issues payment only after verification, and does not reopen a consumed case',async t=>{
  const f=await fixture(t,()=>Response.json({reference:'provider-case',patientReference:'provider-patient',status:'submitted'}));
  const first=await f.request(intake,{method:'POST',body:assessment()});const ref=first.body.intakeReference;
  const update=body=>f.request(callback,{method:'POST',callback:true,body:{partnerReference:'provider-case',clientReference:ref,patientReference:'provider-patient',...body}});
  assert.equal((await update({status:'verified',patientReference:'foreign-patient'})).status,409);
  assert.equal((await update({status:'verified'})).status,200);assert.equal((await update({status:'verified'})).body.duplicate,true);
  const verified=await f.request(status+'?reference='+ref);assert.equal(verified.body.verified,true);assert.equal(verified.body.prescribingApproved,false);
  const hash=createHash('sha256').update(verified.body.verificationToken).digest('hex');assert(f.sql.prepare('SELECT * FROM medicine_prepay_verifications WHERE token_hash=?').get(hash));
  f.sql.prepare('UPDATE medicine_prepay_verifications SET used_at=? WHERE token_hash=?').run(new Date().toISOString(),hash);
  assert.equal((await f.request(status+'?reference='+ref)).body.status,'payment_started');assert.equal(f.sql.prepare('SELECT count(*) AS n FROM medicine_prepay_verifications').get().n,1);
  assert.equal((await update({status:'submitted'})).status,409);
});

test('real SQL recovers a lost provider response through the same client reference without resending',async t=>{
  const f=await fixture(t,()=>{throw Error('synthetic connection lost')});const id=crypto.randomUUID();
  const first=await f.request(intake,{method:'POST',body:assessment(id)});assert.equal(first.status,503);
  assert.equal((await f.request(intake,{method:'POST',body:assessment(id)})).body.status,'delivery_unconfirmed');assert.equal(f.calls.length,1);
  const body={partnerReference:'recovered-case',patientReference:'recovered-patient',clientReference:first.body.intakeReference,status:'verified'};
  assert.equal((await f.request(callback,{method:'POST',callback:true,body})).status,200);
  assert.equal((await f.request(callback,{method:'POST',callback:true,body})).body.duplicate,true);
  const recovered=await f.request(status+'?reference='+first.body.intakeReference);assert.equal(recovered.body.verified,true);assert.equal(f.calls.length,1);
});

test('real SQL keeps secure clarification bound to the same case and account and rejects expired sessions',async t=>{
  const f=await fixture(t,url=>url.endsWith('/intake')?Response.json({reference:'provider-case',patientReference:'provider-patient',status:'more_information_required'}):Response.json({reference:'provider-case',patientReference:'provider-patient',resumeUrl:'https://portal.example.test/resume/opaque-token',expiresAt:new Date(Date.now()+60000).toISOString()}));
  const first=await f.request(intake,{method:'POST',body:assessment()});const body={intakeReference:first.body.intakeReference};
  assert.equal((await f.request(intake+'-resume',{method:'POST',body,token:'second'})).status,404);assert.equal(f.calls.length,1);
  const resume=await f.request(intake+'-resume',{method:'POST',body});assert.equal(resume.status,200);assert.equal(resume.body.resumeUrl,'https://portal.example.test/resume/opaque-token');assert.equal(JSON.parse(f.calls[1].init.body).clientReference,first.body.intakeReference);
  f.sql.prepare('UPDATE user_sessions SET expires_at=?').run('2000-01-01T00:00:00Z');assert.equal((await f.request(status+'?reference='+first.body.intakeReference)).status,401);
});

function expanded(path='Starting treatment'){
 const answers=Object.fromEntries(QUESTIONS.map(q=>[q.id,q.type==='multi'?JSON.stringify(['None of the above']):q.options?(q.options.includes('No')?'No':q.options.includes('None of the above')?'None of the above':q.options[0]):q.type==='date'?'2026-10-19':'Synthetic clinical detail']));
 answers.requestPath=path;answers.forMyself='Yes';answers.inUK='Yes';
 return {version:QUESTIONNAIRE_VERSION,answers,prescribingAcknowledged:true};
}
test('expanded case requires explicit provider version acceptance and never drops answers',async t=>{
 const f=await fixture(t,()=>Response.json({reference:'expanded-case',patientReference:'expanded-patient',status:'submitted'}));
 const result=await f.request(intake,{method:'POST',body:assessment(undefined,{expandedAssessment:JSON.stringify(expanded())})});
 assert.equal(result.status,503);assert.equal(result.body.error,'assessment_contract_not_approved');assert.equal(f.calls.length,0);
});
test('expanded case sends full versioned answers once, holds prescribing approval and stores no answers',async t=>{
 const f=await fixture(t,()=>Response.json({reference:'expanded-case',patientReference:'expanded-patient',status:'submitted'}),{PHARMACY_ASSESSMENT_VERSION:QUESTIONNAIRE_VERSION});
 const payload=expanded('Switching provider or medicine'),id=crypto.randomUUID();payload.answers.medicalHistory='Not sure';payload.answers.medicalHistoryDetails='Previous investigation — details to verify';
 const form=()=>assessment(id,{expandedAssessment:JSON.stringify(payload)});
 const first=await f.request(intake,{method:'POST',body:form()});assert.equal(first.status,202);assert.equal(first.body.prescribingApproved,false);
 assert.equal((await f.request(intake,{method:'POST',body:form()})).body.intakeReference,first.body.intakeReference);assert.equal(f.calls.length,1);
 const sent=f.calls[0].init.body;const received=JSON.parse(sent.get('expandedAssessment'));
 assert.equal(received.answers.medicalHistoryDetails,payload.answers.medicalHistoryDetails);assert.equal(received.answers.timeOnDose,payload.answers.timeOnDose);assert.equal(received.answers.repeatChanges,undefined);
 assert.equal(sent.get('questionnaireVersion'),QUESTIONNAIRE_VERSION);assert.equal(sent.get('selectionIsPreference'),'true');assert.equal(sent.get('prescribingApproval'),'pending');
 const rows=JSON.stringify(f.sql.prepare('SELECT * FROM medicine_intake_attempts').all());assert(!rows.includes('Previous investigation'));assert(!rows.includes('Synthetic clinical detail'));
 payload.answers.timeOnDose='Different actual dose history';assert.equal((await f.request(intake,{method:'POST',body:form()})).status,409);assert.equal(f.calls.length,1);
});
test('accepted expanded contract cannot be bypassed with a legacy or incomplete form',async t=>{
 const f=await fixture(t,()=>{throw Error('must not send')},{PHARMACY_ASSESSMENT_VERSION:QUESTIONNAIRE_VERSION});
 assert.equal((await f.request(intake,{method:'POST',body:assessment()})).status,400);
 const payload=expanded();delete payload.answers.medicines1;
 const result=await f.request(intake,{method:'POST',body:assessment(undefined,{expandedAssessment:JSON.stringify(payload)})});assert.equal(result.status,400);assert.equal(result.body.field,'medicines1');assert.equal(f.calls.length,0);
});
