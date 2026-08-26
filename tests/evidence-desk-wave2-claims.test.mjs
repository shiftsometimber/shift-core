import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';

const schema=readFileSync(new URL('../migrations/007_shift_evidence_desk.sql',import.meta.url),'utf8');
const migration=readFileSync(new URL('../migrations/008_evidence_desk_wave2_claims.sql',import.meta.url),'utf8');

test('Wave 2 register persists 16 mapped claims while every delivery path remains locked',()=>{
  const db=new DatabaseSync(':memory:');
  db.exec(schema);db.exec(migration);
  const counts=db.prepare(`SELECT COUNT(*) total,SUM(risk_lane='amber') amber,SUM(risk_lane='red') red,SUM(status='locked') locked FROM evidence_desk_claims WHERE id LIKE 'w2-%'`).get();
  assert.deepEqual({...counts},{total:16,amber:12,red:4,locked:4});
  assert.equal(db.prepare(`SELECT COUNT(*) n FROM evidence_desk_claim_dependencies WHERE claim_id LIKE 'w2-%'`).get().n,16);
  assert.equal(db.prepare(`SELECT COUNT(*) n FROM evidence_desk_page_dependencies WHERE claim_id LIKE 'w2-%'`).get().n,16);
  const boundary=db.prepare(`SELECT c.claim_text,c.risk_lane,c.status,p.page_path FROM evidence_desk_claims c JOIN evidence_desk_page_dependencies p ON p.claim_id=c.id WHERE c.id='w2-whr-002'`).get();
  assert.equal(boundary.page_path,'/tools/waist-height');assert.equal(boundary.risk_lane,'amber');assert.equal(boundary.status,'active');assert.match(boundary.claim_text,/0\.5–0\.59/);
  const control=db.prepare(`SELECT * FROM evidence_desk_control WHERE id=1`).get();
  for(const field of ['enabled','ingestion_enabled','decision_email_enabled','website_publish_enabled','newsletter_enabled','social_enabled'])assert.equal(control[field],0,field);
  assert.equal(db.prepare(`SELECT COUNT(*) n FROM evidence_desk_packages`).get().n,0);
  assert.equal(db.prepare(`SELECT COUNT(*) n FROM evidence_desk_notifications`).get().n,0);
});

test('Wave 2 migration is idempotent',()=>{
  const db=new DatabaseSync(':memory:');db.exec(schema);db.exec(migration);db.exec(migration);
  assert.equal(db.prepare(`SELECT COUNT(*) n FROM evidence_desk_claims WHERE id LIKE 'w2-%'`).get().n,16);
  assert.equal(db.prepare(`SELECT COUNT(*) n FROM evidence_desk_claim_dependencies WHERE claim_id LIKE 'w2-%'`).get().n,16);
  assert.equal(db.prepare(`SELECT COUNT(*) n FROM evidence_desk_page_dependencies WHERE claim_id LIKE 'w2-%'`).get().n,16);
});
