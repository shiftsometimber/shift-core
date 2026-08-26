import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {
  ensureEvidenceDeskSchema,upsertEvidenceSource,upsertEvidenceClaim,recordEvidenceObservation,
  createEvidencePackage,decideEvidencePackage,deliverEvidenceDecisionEmails,runEvidenceDeskScheduled
  ,commissionMhraGlp1R11,runMhraGlp1R11,evidenceDeskRoutes,MHRA_NAION_R14_REPLACEMENT
} from '../evidence-desk-v1.js';
import {extractMhraGlp1GuidanceFacts,MHRA_GLP1_R11} from '../evidence-adapter-mhra-glp1-v1.js';

class D1Statement{
  constructor(db,sql,args=[]){this.db=db;this.sql=sql;this.args=args}
  bind(...args){return new D1Statement(this.db,this.sql,args)}
  async first(){return this.db.prepare(this.sql).get(...this.args)||null}
  async all(){return{results:this.db.prepare(this.sql).all(...this.args)}}
  async run(){const result=this.db.prepare(this.sql).run(...this.args);return{...result,lastInsertRowid:result.lastInsertRowid}}
}
class D1{
  constructor(){this.db=new DatabaseSync(':memory:')}
  prepare(sql){return new D1Statement(this.db,sql)}
  async batch(statements){this.db.exec('BEGIN');try{const out=[];for(const statement of statements)out.push(await statement.run());this.db.exec('COMMIT');return out}catch(error){this.db.exec('ROLLBACK');throw error}}
  async exec(sql){this.db.exec(sql)}
}
const matt={id:1,name:"Matt O'Brien",email:'matt@example.test',role:'owner'};
const clinician={id:2,name:'Qualified reviewer',email:'reviewer@example.test',role:'clinical'};

function mhraContent(note='Initial official update',timestamp='2026-02-05T13:31:40Z'){
  return{base_path:MHRA_GLP1_R11.basePath,content_id:MHRA_GLP1_R11.contentId,title:'GLP-1 medicines for weight loss and diabetes: what you need to know',description:'Guidance on the safe and effective use of GLP-1 medicines for weight loss and diabetes.',document_type:'guidance',schema_name:'publication',public_updated_at:timestamp,details:{change_history:[{note,public_timestamp:timestamp}]}};
}
function jsonFetch(content,{status=200,type='application/json'}={}){return async()=>new Response(JSON.stringify(content),{status,headers:{'content-type':type,etag:'"official-version"'}})}

async function fixture({riskLane='amber',communicationClass='general_information'}={}){
  const DB=new D1();await ensureEvidenceDeskSchema(DB);
  const source=await upsertEvidenceSource(DB,{id:'mhra-safety',family:'mhra',name:'MHRA safety',canonicalUrl:'https://www.gov.uk/drug-device-alerts',authorityName:'MHRA',extractionMethod:'official_feed',status:'active'});
  assert.equal(source.ok,true);
  const claim=await upsertEvidenceClaim(DB,{id:'weight-treatment-safety',claimText:'Current safety wording',riskLane,communicationClass,dependencies:[{sourceId:'mhra-safety',factKey:'safety_summary'}],pages:[{pagePath:'/knowledge/treatment-safety',contentKey:'safety-summary'}]});
  assert.equal(claim.ok,true);
  return{DB,env:{DB}};
}

async function materialEvent(DB){
  const baseline=await recordEvidenceObservation(DB,'mhra-safety',{facts:{safety_summary:'Original wording',unrelated_widget:'A'}});assert.equal(baseline.materialState,'baseline_recorded');
  return recordEvidenceObservation(DB,'mhra-safety',{contentHash:'changed-page-shell',facts:{safety_summary:'Updated wording',unrelated_widget:'A'}});
}

test('whole-page noise does not become an evidence event when structured facts are unchanged',async()=>{
  const {DB}=await fixture();
  const first=await recordEvidenceObservation(DB,'mhra-safety',{contentHash:'page-a',facts:{safety_summary:'No change'}});
  const second=await recordEvidenceObservation(DB,'mhra-safety',{contentHash:'page-b-cookie-banner',facts:{safety_summary:'No change'}});
  assert.equal(first.materialState,'baseline_recorded');assert.equal(second.materialState,'no_material_change');assert.equal(second.event,null);
  assert.equal(DB.db.prepare('SELECT COUNT(*) c FROM evidence_desk_events').get().c,0);
});

test('a structured fact change maps to the exact claim and page',async()=>{
  const {DB}=await fixture(),changed=await materialEvent(DB);
  assert.equal(changed.materialState,'material_change');assert.equal(changed.event.materiality,'mapped_material_change');assert.equal(changed.event.riskLane,'amber');
  assert.deepEqual(changed.event.impactedClaims.map(x=>x.id),['weight-treatment-safety']);
  assert.deepEqual(changed.event.impactedClaims[0].pages.map(x=>x.page_path),['/knowledge/treatment-safety']);
});

test('unmapped authoritative change is retained without pretending it has a destination',async()=>{
  const {DB}=await fixture();
  await recordEvidenceObservation(DB,'mhra-safety',{facts:{other_fact:'one'}});
  const changed=await recordEvidenceObservation(DB,'mhra-safety',{facts:{other_fact:'two'}});
  assert.equal(changed.event.status,'mapping_required');assert.equal(changed.event.impactedClaims.length,0);
});

test('package creation queues one decision only and keeps every publication destination locked',async()=>{
  const {DB}=await fixture(),changed=await materialEvent(DB);
  const pkg=await createEvidencePackage(DB,changed.event.id,{title:'Safety wording changed',summary:'One mapped claim needs review.',proposedChanges:[{pagePath:'/knowledge/treatment-safety',contentKey:'safety-summary',before:'Original wording',after:'Updated wording'}],evidence:[{sourceId:'mhra-safety',factKey:'safety_summary'}]},matt);
  assert.equal(pkg.state,'awaiting_decision');assert.deepEqual(pkg.distribution,{web:'locked_pending_decision',newsletter:'locked',social:'locked'});
  assert.equal(DB.db.prepare('SELECT COUNT(*) c FROM evidence_desk_notifications').get().c,1);
  const repeated=await createEvidencePackage(DB,changed.event.id,{title:'Safety wording changed',summary:'Updated draft.',proposedChanges:[{pagePath:'/knowledge/treatment-safety',after:'Updated wording'}]},matt);
  assert.equal(repeated.packageId,pkg.packageId);assert.equal(DB.db.prepare('SELECT COUNT(*) c FROM evidence_desk_notifications').get().c,1);
});

test('medicine information needs a separate communications decision before web approval',async()=>{
  const {DB}=await fixture({communicationClass:'medicine_information'}),changed=await materialEvent(DB);
  const pkg=await createEvidencePackage(DB,changed.event.id,{title:'Medicine information changed',summary:'Mapped medicine information.',proposedChanges:[{pagePath:'/knowledge/treatment-safety',after:'Updated wording'}]},matt);
  const blocked=await decideEvidencePackage(DB,pkg.packageId,{decision:'approve_web_only'},matt);assert.equal(blocked.status,409);assert.equal(blocked.error,'medicines_communications_review_required');
  const comms=await decideEvidencePackage(DB,pkg.packageId,{decision:'communications_approved',authorityRef:'MED-COMMS-001'},matt);assert.equal(comms.ok,true);
  const approved=await decideEvidencePackage(DB,pkg.packageId,{decision:'approve_web_only',note:'Web only.'},matt);assert.equal(approved.state,'approved_web_pending_publish');assert.deepEqual(approved.publication,{web:'approved_but_not_published',newsletter:'locked',social:'locked'});
});

test('red package cannot be approved without exact qualified and communications review',async()=>{
  const {DB}=await fixture({riskLane:'red',communicationClass:'clinical_safety'}),changed=await materialEvent(DB);
  const pkg=await createEvidencePackage(DB,changed.event.id,{title:'Clinical safety change',summary:'Urgent mapped safety update.',proposedChanges:[{pagePath:'/knowledge/treatment-safety',after:'Updated wording'}]},matt);
  let result=await decideEvidencePackage(DB,pkg.packageId,{decision:'approve_web_only'},matt);assert.equal(result.error,'qualified_review_required');
  result=await decideEvidencePackage(DB,pkg.packageId,{decision:'qualified_review_approved',authorityRef:'CLINICAL-EXACT-PACKAGE-001'},matt);assert.equal(result.status,403);
  result=await decideEvidencePackage(DB,pkg.packageId,{decision:'qualified_review_approved',authorityRef:'CLINICAL-EXACT-PACKAGE-001'},clinician);assert.equal(result.ok,true);
  result=await decideEvidencePackage(DB,pkg.packageId,{decision:'approve_web_only'},matt);assert.equal(result.error,'medicines_communications_review_required');
  await decideEvidencePackage(DB,pkg.packageId,{decision:'communications_approved',authorityRef:'MED-COMMS-002'},matt);
  result=await decideEvidencePackage(DB,pkg.packageId,{decision:'approve_web_only'},matt);assert.equal(result.state,'approved_web_pending_publish');
});

test('no publication justified is a successful audited outcome',async()=>{
  const {DB}=await fixture(),changed=await materialEvent(DB);
  const pkg=await createEvidencePackage(DB,changed.event.id,{title:'Reviewed source change',summary:'No public correction is warranted.',proposedChanges:[{pagePath:'/knowledge/treatment-safety',after:'No change'}]},matt);
  const result=await decideEvidencePackage(DB,pkg.packageId,{decision:'no_publication_justified',note:'The existing page remains accurate.'},matt);
  assert.equal(result.state,'closed_no_publication');assert.equal(DB.db.prepare("SELECT COUNT(*) c FROM evidence_desk_decisions WHERE decision='no_publication_justified'").get().c,1);
});

test('a final package cannot be reopened or re-decided',async()=>{
  const {DB}=await fixture(),changed=await materialEvent(DB);
  const pkg=await createEvidencePackage(DB,changed.event.id,{title:'Reviewed source change',summary:'No public correction is warranted.',proposedChanges:[{pagePath:'/knowledge/treatment-safety',after:'No change'}]},matt);
  const closed=await decideEvidencePackage(DB,pkg.packageId,{decision:'no_publication_justified',note:'Existing page remains accurate.'},matt);assert.equal(closed.state,'closed_no_publication');
  const repeated=await decideEvidencePackage(DB,pkg.packageId,{decision:'approve_web_only'},matt);assert.equal(repeated.status,409);assert.equal(repeated.error,'evidence_package_finalised');
  const redraft=await createEvidencePackage(DB,changed.event.id,{title:'Attempted redraft',summary:'Should remain closed.',proposedChanges:[{pagePath:'/knowledge/treatment-safety',after:'Changed'}]},matt);assert.equal(redraft.status,409);assert.equal(redraft.error,'evidence_package_finalised');
});

test('medicines communications approval is restricted to control authority',async()=>{
  const {DB}=await fixture({communicationClass:'medicine_information'}),changed=await materialEvent(DB);
  const pkg=await createEvidencePackage(DB,changed.event.id,{title:'Medicine information changed',summary:'Mapped medicine information.',proposedChanges:[{pagePath:'/knowledge/treatment-safety',after:'Updated wording'}]},matt);
  const blocked=await decideEvidencePackage(DB,pkg.packageId,{decision:'communications_approved',authorityRef:'MED-COMMS-003'},clinician);assert.equal(blocked.status,403);assert.equal(blocked.error,'medicines_communications_authority_required');
});

test('silent runs send no email and configured-off scheduling stays sealed',async()=>{
  const {DB,env}=await fixture();
  const empty=await deliverEvidenceDecisionEmails(env);assert.equal(empty.sent,0);assert.equal(empty.reason,'evidence_desk_email_off');
  const scheduled=await runEvidenceDeskScheduled(env);assert.equal(scheduled.state,'sealed');assert.equal(scheduled.sourcesChecked,0);
});

test('decision email reports configuration failure without losing the queued decision',async()=>{
  const {DB,env}=await fixture(),changed=await materialEvent(DB);
  await createEvidencePackage(DB,changed.event.id,{title:'Decision required',summary:'Review this mapped update.',proposedChanges:[{pagePath:'/knowledge/treatment-safety',after:'Updated wording'}]},matt);
  DB.db.prepare('UPDATE evidence_desk_control SET enabled=1,decision_email_enabled=1 WHERE id=1').run();
  const result=await deliverEvidenceDecisionEmails(env);assert.equal(result.ok,false);assert.equal(result.reason,'email_binding_missing');
  const notification=DB.db.prepare("SELECT status,error_code FROM evidence_desk_notifications").get();assert.equal(notification.status,'queued');assert.equal(notification.error_code,'email_binding_missing');
});

test('the commissioned MHRA adapter records a real structured baseline then maps one exact change to one red package',async()=>{
  const DB=new D1(),env={DB};await commissionMhraGlp1R11(DB,matt);
  const baseline=await runMhraGlp1R11(env,{fetchImpl:jsonFetch(mhraContent()),force:true});assert.equal(baseline.state,'baseline_recorded');assert.equal(baseline.packageId,null);
  const changed=await runMhraGlp1R11(env,{fetchImpl:jsonFetch(mhraContent('Updated GLP-1 warning wording','2026-08-26T10:00:00Z')),force:true});assert.equal(changed.state,'material_change');assert.ok(changed.eventId);assert.ok(changed.packageId);
  const pkg=DB.db.prepare('SELECT * FROM evidence_desk_packages WHERE id=?').get(changed.packageId);assert.equal(pkg.risk_lane,'red');assert.equal(pkg.communication_class,'clinical_safety');assert.equal(pkg.web_eligible,0);assert.equal(pkg.social_eligible,0);
  const event=DB.db.prepare('SELECT impacted_claims_json FROM evidence_desk_events WHERE id=?').get(changed.eventId);const impact=JSON.parse(event.impacted_claims_json);assert.deepEqual(impact[0].pages.map(page=>page.page_path),['/glp1-knowledge-centre.html']);
});

test('the MHRA adapter rejects identity drift and fails closed without creating evidence',async()=>{
  assert.throws(()=>extractMhraGlp1GuidanceFacts({...mhraContent(),content_id:'wrong'}),/mhra_adapter_identity_mismatch/);
  const DB=new D1(),env={DB};await commissionMhraGlp1R11(DB,matt);
  const failed=await runMhraGlp1R11(env,{fetchImpl:jsonFetch({...mhraContent(),schema_name:'unexpected'}),force:true});assert.equal(failed.ok,false);assert.equal(failed.state,'failed_closed');
  assert.equal(DB.db.prepare('SELECT COUNT(*) c FROM evidence_desk_snapshots').get().c,0);assert.equal(DB.db.prepare("SELECT COUNT(*) c FROM evidence_desk_decisions WHERE decision='source_adapter_failed'").get().c,1);
});

test('the one-action stop prevents the commissioned adapter from fetching',async()=>{
  const DB=new D1(),env={DB};await commissionMhraGlp1R11(DB,matt);DB.db.prepare("UPDATE evidence_desk_control SET enabled=0,ingestion_enabled=0,stop_reason='Commissioning stop proof' WHERE id=1").run();
  let fetched=false;const result=await runEvidenceDeskScheduled({...env},{fetchImpl:async()=>{fetched=true;return jsonFetch(mhraContent())()}});assert.equal(result.state,'sealed');assert.equal(result.sourcesChecked,0);assert.equal(fetched,false);
});

test('R1.2 commissioning route is non-production only, token protected and exposes a read-only inbox',async()=>{
  const DB=new D1(),ctx={};await ensureEvidenceDeskSchema(DB);
  let response=await evidenceDeskRoutes(new Request('https://candidate.test/v1/evidence-desk/r1-2/commission',{method:'POST',headers:{Authorization:'Bearer exact-token'}}),{DB,EVIDENCE_DESK_ENV:'production',EVIDENCE_DESK_COMMISSION_TOKEN:'exact-token'},ctx);assert.equal(response.status,409);
  const env={DB,EVIDENCE_DESK_ENV:'non-production',EVIDENCE_DESK_COMMISSION_TOKEN:'exact-token'};
  response=await evidenceDeskRoutes(new Request('https://candidate.test/v1/evidence-desk/r1-2/commission',{method:'POST',headers:{Authorization:'Bearer wrong-token'}}),env,ctx);assert.equal(response.status,401);
  response=await evidenceDeskRoutes(new Request('https://candidate.test/v1/evidence-desk/r1-2/commission',{method:'POST',headers:{Authorization:'Bearer exact-token'}}),env,ctx);assert.equal(response.status,200);assert.equal((await response.json()).ok,true);
  response=await evidenceDeskRoutes(new Request('https://candidate.test/v1/evidence-desk/r1-2/baseline',{method:'POST',headers:{Authorization:'Bearer exact-token'}}),env,ctx);assert.equal(response.status,200);assert.equal((await response.json()).materialState,'baseline_recorded');
  response=await evidenceDeskRoutes(new Request('https://candidate.test/v1/evidence-desk/r1-2/inbox',{headers:{Authorization:'Bearer exact-token'}}),env,ctx);const inbox=await response.json();assert.equal(inbox.mode,'read_only');assert.deepEqual(inbox.capabilities,{compose:false,approve:false,publish:false,newsletter:false,social:false,model:false});assert.equal(inbox.claim.page_path,'/glp1-knowledge-centre.html');
  response=await evidenceDeskRoutes(new Request('https://candidate.test/v1/evidence-desk/r1-2/stop',{method:'POST',headers:{Authorization:'Bearer exact-token','Content-Type':'application/json'},body:JSON.stringify({reason:'Unit stop proof'})}),env,ctx);assert.equal((await response.json()).state,'sealed');
  response=await evidenceDeskRoutes(new Request('https://candidate.test/v1/evidence-desk/r1-2/fetch',{method:'POST',headers:{Authorization:'Bearer exact-token'}}),env,ctx);assert.deepEqual(await response.json(),{ok:true,state:'sealed',sourcesChecked:0});
});

test('R1.3 records an honest human amend outcome while every destination stays sealed',async()=>{
  const DB=new D1(),ctx={};await ensureEvidenceDeskSchema(DB);
  const env={DB,EVIDENCE_DESK_ENV:'non-production',EVIDENCE_DESK_COMMISSION_TOKEN:'exact-token',EVIDENCE_DESK_R13_REVIEWER_NAME:"Matt O'Brien"};
  const headers={Authorization:'Bearer exact-token'};
  let response=await evidenceDeskRoutes(new Request('https://candidate.test/v1/evidence-desk/r1-2/commission',{method:'POST',headers}),env,ctx);assert.equal(response.status,200);
  response=await evidenceDeskRoutes(new Request('https://candidate.test/v1/evidence-desk/r1-2/baseline',{method:'POST',headers}),env,ctx);assert.equal(response.status,200);
  const observed=await runMhraGlp1R11(env,{force:true,ensureSchema:false,fetchImpl:jsonFetch(mhraContent('Updated pregnancy, contraception and acute pancreatitis safety guidance.'))});assert.equal(observed.state,'material_change');
  response=await evidenceDeskRoutes(new Request('https://candidate.test/v1/evidence-desk/r1-2/stop',{method:'POST',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify({reason:'R1.3 review remains sealed'})}),env,ctx);assert.equal(response.status,200);
  response=await evidenceDeskRoutes(new Request('https://candidate.test/v1/evidence-desk/r1-3/checklist',{headers}),env,ctx);let checklist=await response.json();assert.equal(checklist.complete,false);assert.deepEqual(checklist.missing,['exact_proposed_page_copy']);assert.equal(checklist.recommendedDecision,'amend');assert.equal(checklist.controls.website,false);
  response=await evidenceDeskRoutes(new Request('https://candidate.test/v1/evidence-desk/r1-3/review',{method:'POST',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify({decision:'amend',attestation:'human_editorial_review',note:'Exact proposed page wording is missing; return the package before either specialist review.'})}),env,ctx);const review=await response.json();assert.equal(review.state,'changes_required');assert.deepEqual(review.publication,{web:'locked',newsletter:'locked',social:'locked'});
  const states=DB.db.prepare(`SELECT p.status package_status,e.status event_status,p.web_eligible,p.newsletter_eligible,p.social_eligible FROM evidence_desk_packages p JOIN evidence_desk_events e ON e.id=p.event_id`).get();assert.equal(states.package_status,'changes_required');assert.equal(states.event_status,'changes_required');assert.equal(states.web_eligible,0);assert.equal(states.newsletter_eligible,0);assert.equal(states.social_eligible,0);
  response=await evidenceDeskRoutes(new Request('https://candidate.test/v1/evidence-desk/r1-3/review',{method:'POST',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify({decision:'amend',attestation:'human_editorial_review',note:'Exact proposed page wording is missing; return the package before either specialist review.'})}),env,ctx);assert.equal((await response.json()).idempotent,true);
  const decisions=DB.db.prepare(`SELECT decision,actor_name,authority_ref FROM evidence_desk_decisions WHERE decision IN ('r1_3_review_checklist','amend') ORDER BY id`).all().map(row=>({...row}));assert.deepEqual(decisions,[{decision:'r1_3_review_checklist',actor_name:"Matt O'Brien",authority_ref:'R1.3-EDITORIAL-REVIEW'},{decision:'amend',actor_name:"Matt O'Brien",authority_ref:'R1.3-EDITORIAL-REVIEW'}]);
});

test('R1.4 attaches one exact evidenced revision and prepares a locked specialist packet',async()=>{
  const DB=new D1(),ctx={};await ensureEvidenceDeskSchema(DB);
  const env={DB,EVIDENCE_DESK_ENV:'non-production',EVIDENCE_DESK_COMMISSION_TOKEN:'exact-token',EVIDENCE_DESK_R13_REVIEWER_NAME:"Matt O'Brien"};
  const headers={Authorization:'Bearer exact-token'};
  await evidenceDeskRoutes(new Request('https://candidate.test/v1/evidence-desk/r1-2/commission',{method:'POST',headers}),env,ctx);
  await evidenceDeskRoutes(new Request('https://candidate.test/v1/evidence-desk/r1-2/baseline',{method:'POST',headers}),env,ctx);
  const observed=await runMhraGlp1R11(env,{force:true,ensureSchema:false,fetchImpl:jsonFetch(mhraContent(MHRA_NAION_R14_REPLACEMENT.sourceChangeNote,MHRA_NAION_R14_REPLACEMENT.sourcePublishedAt))});assert.equal(observed.state,'material_change');
  await evidenceDeskRoutes(new Request('https://candidate.test/v1/evidence-desk/r1-2/stop',{method:'POST',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify({reason:'R1.4 remains sealed'})}),env,ctx);
  await evidenceDeskRoutes(new Request('https://candidate.test/v1/evidence-desk/r1-3/review',{method:'POST',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify({decision:'amend',attestation:'human_editorial_review',note:'Exact proposed page wording is missing; return the package before either specialist review.'})}),env,ctx);
  let response=await evidenceDeskRoutes(new Request('https://candidate.test/v1/evidence-desk/r1-4/replacement',{method:'POST',headers}),env,ctx);const attached=await response.json();assert.equal(attached.state,'awaiting_specialist_review');assert.equal(attached.revision.revisionId,'R1.4-MHRA-NAION-2026-02-05-V1');assert.ok(attached.revision.copyHash);assert.equal(attached.revision.proposedText,MHRA_NAION_R14_REPLACEMENT.proposedText);assert.deepEqual(attached.locks,{qualifiedReview:true,communicationsReview:true,website:true,newsletter:true,social:true,model:true});
  assert.match(attached.revision.proposedText,/semaglutide \(Wegovy, Ozempic and Rybelsus\)/);assert.match(attached.revision.proposedText,/very rare reports/);assert.match(attached.revision.proposedText,/warning is specific to semaglutide/);assert.doesNotMatch(attached.revision.proposedText,/GLP-1 medicines have.*NAION/i);
  response=await evidenceDeskRoutes(new Request('https://candidate.test/v1/evidence-desk/r1-4/replacement',{method:'POST',headers}),env,ctx);assert.equal((await response.json()).idempotent,true);
  response=await evidenceDeskRoutes(new Request('https://candidate.test/v1/evidence-desk/r1-3/checklist',{headers}),env,ctx);const checklist=await response.json();assert.equal(checklist.complete,true,JSON.stringify(checklist));assert.deepEqual(checklist.missing,[]);assert.equal(checklist.recommendedDecision,'send_for_qualified_review');
  response=await evidenceDeskRoutes(new Request('https://candidate.test/v1/evidence-desk/r1-4/review-packet',{headers}),env,ctx);const packet=await response.json();assert.equal(packet.mode,'specialist_review_packet');assert.equal(packet.integrity.exactRevision,true);assert.equal(packet.specialistReviews.qualifiedClinical.approved,false);assert.equal(packet.specialistReviews.medicinesCommunications.approved,false);assert.deepEqual(packet.distribution,{web:'locked',newsletter:'locked',social:'locked'});assert.deepEqual(packet.preflight.blockers,['qualified_clinical_review','medicines_communications_review','page_baseline_and_rollback_capture','publication_authority_disabled']);assert.equal(packet.capabilities.publish,false);
  const state=DB.db.prepare(`SELECT p.status package_status,e.status event_status,p.web_eligible,p.newsletter_eligible,p.social_eligible,p.qualified_review_ref,p.communications_review_ref FROM evidence_desk_packages p JOIN evidence_desk_events e ON e.id=p.event_id`).get();assert.equal(state.package_status,'awaiting_specialist_review');assert.equal(state.event_status,'awaiting_specialist_review');assert.equal(state.web_eligible,0);assert.equal(state.newsletter_eligible,0);assert.equal(state.social_eligible,0);assert.equal(state.qualified_review_ref,null);assert.equal(state.communications_review_ref,null);
  assert.equal(DB.db.prepare("SELECT COUNT(*) c FROM evidence_desk_decisions WHERE decision='exact_replacement_attached'").get().c,1);
});
