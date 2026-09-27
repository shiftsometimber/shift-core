import {GRUB_EXPANSION_SERVING_AUTHORITY as productionManifest} from '../grub-expansion-serving-manifest-v1.mjs';
import {CATALOGUE_PUBLICATION_RELEASE as ownerRelease} from '../catalogue-publication-release-v1.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {buildIndustrialCatalogue} from '../industrial-catalogue-v14.js';
import {buildGrubExpansionPublication,prepareGrubExpansionBatch,protectedRecipeContent,normaliseGrubEditorialEvidence,REVIEW_SCOPES} from '../grub-expansion-publication-v1.mjs';
import {loadGovernedGrubCatalogue,selectGovernedGrubRows,reviewedRecipeMinutes} from '../grub-expansion-authority-v1.mjs';
import {memberRecipe,filterRecipe} from '../member-experience/grub-search.mjs';

// These identities and decisions are synthetic fixtures, never publication evidence.
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const snapshotKeys = ['id','content_type','title','version','status','data_json','review_json','created_at','updated_at'];
const example = () => ({meal_type:'breakfast',servings:1,ingredients:[{item:'porridge oats',amount:'50g'}],method:['Weigh the oats.','Simmer the oats until tender.'],equipment:['saucepan'],allergens:['gluten'],storage:{chilled:'Cool promptly and refrigerate.'},food_safety:['Serve hot.'],nutrition:{kcal:190,protein_g:6,carbohydrate_g:30,fat_g:4,fibre_g:5},ingredient_evidence:[{item:'porridge oats',grams:50,code:'synthetic-food'}],prep_minutes:5,cook_minutes:10,rest_minutes:0,total_minutes:15,tags:['breakfast'],taxonomy:{budget:'budget'},food_format:'porridge'});
function fixtures() {
  const protected_v1 = [], existingRows = [];
  for (let i=0;i<798;i++) {
    const id = `synthetic-original-${String(i).padStart(4,'0')}`, title = `Synthetic original ${i}`, data = example();
    data.nutrition = {...data.nutrition,status:'validated',methodology:'Synthetic test only'};
    data.provenance = {final_v1_acceptance:{accepted:true,proof:'SYNTHETIC_TEST_ONLY'}};
    protected_v1.push({id,content_hash:hash(protectedRecipeContent(data,title))});
    existingRows.push({id,content_type:'recipe',title,version:1,status:'published',data_json:JSON.stringify(data),review_json:JSON.stringify({status:'approved',test_fixture:true}),created_at:'2026-01-01',updated_at:'2026-01-01'});
  }
  const candidates = Array.from({length:1873},(_,i) => {
    const row = {id:`synthetic-addition-${String(i).padStart(4,'0')}`,template_key:`synthetic-family-${i%87}`,title:`Synthetic addition ${i}`,...example(),status:'draft',review:{status:'awaiting_second_person_review',approved:false},technical_issues:[]};
    row.content_hash = hash(row); return row;
  });
  const families = Array.from({length:87},(_,i) => {
    const template_key = `synthetic-family-${i}`, rows = candidates.filter(row => row.template_key === template_key), descendants = rows.map(({id,content_hash}) => ({id,content_hash}));
    return {template_key,template_digest:hash({scope:'GRUB_ADDITIVE_EXPANSION_V1',key:template_key,descendants}),recipe_ids:rows.map(row => row.id),eligible_for_review:true,technical_holds:[]};
  });
  const decisions = {proof:'GRUB_ADDITIVE_EDITORIAL_DECISIONS_V1',recipes:candidates.map(row => ({id:row.id,content_hash:row.content_hash,decision:'PASS',reviewer:{id:'synthetic-independent-reviewer',kind:'ai'},author_ids:['synthetic-author'],reviewed_at:'2026-09-16T12:00:00Z',scopes:[...REVIEW_SCOPES],findings:[]})),families:families.map(family => ({template_key:family.template_key,template_digest:family.template_digest,decision:'PASS',recipes:family.recipe_ids.map(id => { const row = candidates.find(row => row.id === id); return {id,content_hash:row.content_hash}; })}))};
  const authorship = {proof:'GRUB_ADDITIVE_AUTHORSHIP_V1',recipes:candidates.map(row => ({id:row.id,content_hash:row.content_hash,author_ids:['synthetic-author']}))};
  const humanAcceptance = {proof:'GRUB_ADDITIVE_HUMAN_ACCEPTANCE_V1',families:decisions.families.map(family => ({...structuredClone(family),reviewer:{id:'synthetic-human-test-fixture',kind:'human'},reviewed_at:'2026-09-16T12:01:00Z',scopes:[...REVIEW_SCOPES,'member_humanness'],findings:[]}))};
  return {result:{summary:{proof:'GRUB_ADDITIVE_EXPANSION_REVIEW_V1'},protected_v1,quarantined:Array.from({length:205},(_,i) => ({id:`synthetic-quarantine-${i}`})),candidates,families},decisions,authorship,humanAcceptance,existingRows};
}
const source = fixtures();
const release = buildGrubExpansionPublication(source);
const pendingManifest = {...release.serving_manifest,status:'pending',additions:[]};
const rowFromItem = item => ({id:item.id,content_type:item.contentType,title:item.title,version:item.version,status:item.status,data_json:JSON.stringify(item.data),review_json:JSON.stringify(item.review),data:item.data,review:item.review});
const originals = source.existingRows.map(row => ({...row,data:JSON.parse(row.data_json),review:JSON.parse(row.review_json)}));
const all = [...originals,...release.items.map(rowFromItem)];
function database() {
  const db = new DatabaseSync(':memory:');
  db.exec("CREATE TABLE structured_content (id TEXT PRIMARY KEY,content_type TEXT NOT NULL,title TEXT NOT NULL,version INTEGER NOT NULL,status TEXT NOT NULL,data_json TEXT NOT NULL,review_json TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)");
  const insert = db.prepare(`INSERT INTO structured_content (${snapshotKeys.join(',')}) VALUES (${snapshotKeys.map(() => '?').join(',')})`);
  for (const row of source.existingRows) insert.run(...snapshotKeys.map(key => row[key]));
  return db;
}
function transact(db,batch) {
  db.exec('BEGIN');
  try { for (const statement of batch) db.prepare(statement.sql).run(...statement.params); db.exec('COMMIT'); }
  catch (error) { db.exec('ROLLBACK'); throw error; }
}
const snapshots = db => db.prepare("SELECT * FROM structured_content WHERE id LIKE 'synthetic-original-%' ORDER BY id").all().map(row => ({...row}));

test('bridge preserves 798 original rows bytewise and atomically adds all 1873 without the old authority marker', () => {
  const db = database(), before = snapshots(db), batch = prepareGrubExpansionBatch(release);
  assert.ok(batch.every(statement => statement.params.length <= 100));
  assert.ok(batch.every(statement => !/ON CONFLICT|REPLACE INTO|UPDATE structured_content/.test(statement.sql)));
  transact(db,batch);
  assert.deepEqual(snapshots(db),before);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM structured_content').get().n,2671);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM sqlite_master WHERE name LIKE 'grub_guard_%'").get().n,0);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM structured_content WHERE id LIKE 'synthetic-quarantine-%'").get().n,0);
  assert.ok(release.items.every(item => !item.data.provenance.final_v1_acceptance && item.review.reviewer.kind === 'ai'));
  assert.equal(release.production_mutated,false); db.close();
});

test('pending, FIX, incomplete-scope and self reviews cannot become publication authority', () => {
  for (const mutate of [
    x => { x.decisions.recipes[0].decision = 'PENDING'; },
    x => { x.decisions.recipes[0].decision = 'FIX'; },
    x => { x.decisions.families[0].decision = 'PENDING'; },
    x => { x.decisions.recipes[0].scopes = ['ingredients']; },
    x => { x.decisions.recipes[0].reviewer.id = 'synthetic-author'; },
    x => { x.authorship.recipes[0].author_ids = []; },
    x => { x.decisions.recipes[0].author_ids = []; },
    x => { x.decisions.recipes[0].findings = ['Unresolved issue']; },
  ]) { const input = structuredClone(source); mutate(input); assert.throws(() => buildGrubExpansionPublication(input)); }
});

test('independent AI PASS never substitutes for the actual mandatory human editorial acceptance', () => {
  for (const mutate of [
    x => { delete x.humanAcceptance; },
    x => { x.humanAcceptance.families[0].reviewer.kind = 'ai'; },
    x => { x.humanAcceptance.families[0].decision = 'PENDING'; },
    x => { x.humanAcceptance.families[0].template_digest = 'stale'; },
    x => { x.humanAcceptance.families[0].recipes.pop(); },
    x => { x.humanAcceptance.families[0].scopes = [...REVIEW_SCOPES]; },
  ]) { const input = structuredClone(source); mutate(input); assert.throws(() => buildGrubExpansionPublication(input),/human/i); }
});

test('the consolidated AI report normalizes exact decisions without promoting publication authority', () => {
  const report = {proof:'GRUB_INDEPENDENT_EDITORIAL_REVIEW_V1',publication_authority:false,human_editorial_acceptance:'pending',decisions:source.decisions.recipes,families:source.decisions.families.map(family => ({template_key:family.template_key,template_digest:family.template_digest,decision:family.decision,coverage_complete:true,descendants:family.recipes}))};
  const normalized = normaliseGrubEditorialEvidence(report);
  assert.deepEqual(normalized.recipes,source.decisions.recipes); assert.deepEqual(normalized.families,source.decisions.families);
  assert.equal(normalized.source_evidence_sha256,hash(report)); assert.equal(normalized.publication_authority,false);
  assert.throws(() => buildGrubExpansionPublication({...source,decisions:report,humanAcceptance:undefined}),/human second-person/);
  assert.throws(() => normaliseGrubEditorialEvidence({...report,publication_authority:true}),/proof required/);
});

test('changed candidates, family descendants and technical holds invalidate their bound review', () => {
  for (const mutate of [
    x => { x.result.candidates[0].method[0] += ' Changed'; },
    x => { x.result.candidates[0].technical_issues.push('held'); },
    x => { x.result.families[0].technical_holds.push('held'); },
    x => { x.result.families[0].recipe_ids.pop(); },
    x => { x.decisions.families[0].recipes.pop(); },
  ]) { const input = structuredClone(source); mutate(input); assert.throws(() => buildGrubExpansionPublication(input)); }
});

test('builder rejects changed originals, protected overlaps, quarantines and pre-existing draft IDs', () => {
  for (const mutate of [
    x => { x.existingRows[0].title += ' Changed'; },
    x => { x.result.candidates[0].id = x.result.protected_v1[0].id; },
    x => { x.result.candidates[0].id = x.result.quarantined[0].id; },
    x => { x.existingRows.push({...x.existingRows[0],id:x.result.candidates[0].id,status:'draft'}); },
    x => { x.existingRows.push({...x.existingRows[0],id:x.result.quarantined[0].id}); },
  ]) { const input = structuredClone(source); mutate(input); assert.throws(() => buildGrubExpansionPublication(input)); }
});

test('atomic database guard rolls back for an original changed after preflight, including metadata-only edits', () => {
  const db = database();
  db.prepare('UPDATE structured_content SET updated_at=? WHERE id=?').run('2026-09-17',source.existingRows[0].id);
  const before = snapshots(db);
  assert.throws(() => transact(db,prepareGrubExpansionBatch(release)),/CHECK constraint/);
  assert.deepEqual(snapshots(db),before);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM structured_content').get().n,798);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM sqlite_master WHERE name LIKE 'grub_guard_%'").get().n,0); db.close();
});

test('late ID collision rolls back earlier inserts without overwriting the colliding draft', () => {
  const db = database(), item = release.items.at(-1);
  db.prepare("INSERT INTO structured_content (id,content_type,title,version,status,data_json,review_json) VALUES (?,'recipe','Keep this draft',4,'draft','{}','{}')").run(item.id);
  assert.throws(() => transact(db,prepareGrubExpansionBatch(release)),/UNIQUE constraint/);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM structured_content').get().n,799);
  assert.equal(db.prepare('SELECT title FROM structured_content WHERE id=?').get(item.id).title,'Keep this draft'); db.close();
});

test('a publication payload changed after preparation is rejected before database access', () => {
  const changed = structuredClone(release); changed.items[0].data.method[0] += ' Changed';
  assert.throws(() => prepareGrubExpansionBatch(changed),/payload hash mismatch/);
});

test('both serving modes retain 798 until explicit authority, then serve every one of 2671 rows through keyset pagination', async () => {
  const db = database(); transact(db,prepareGrubExpansionBatch(release));
  let queries = 0;
  const adapter = {prepare(sql) { return {bind(...params) { return {async all() { queries++; return {results:db.prepare(sql).all(...params)}; }}; }}; }};
  const pending = await loadGovernedGrubCatalogue(adapter,pendingManifest);
  assert.equal(pending.allPublished.length,2671); assert.equal(pending.authority.rows.length,798); assert.equal(pending.authority.incomplete,false); assert.equal(queries,6);
  const approved = await loadGovernedGrubCatalogue(adapter,release.serving_manifest);
  assert.equal(approved.authority.rows.length,2671); assert.equal(approved.authority.accepted,798); assert.equal(approved.authority.expansionAccepted,1873); assert.equal(approved.authority.incomplete,false); db.close();
});

test('runtime rejects missing, changed, forged and overlapping expansion authority', async () => {
  const changed = structuredClone(all); changed[798].data.method[0] += ' Changed'; changed[798].data_json = JSON.stringify(changed[798].data);
  assert.equal((await selectGovernedGrubRows(changed,release.serving_manifest)).reason,'expansion_content_changed');
  assert.equal((await selectGovernedGrubRows(all.slice(1),release.serving_manifest)).incomplete,true);
  assert.equal((await selectGovernedGrubRows(all.slice(0,-1),release.serving_manifest)).incomplete,true);
  const forged = structuredClone(all); forged[798].data.provenance.final_v1_acceptance = {accepted:true};
  assert.equal((await selectGovernedGrubRows(forged,release.serving_manifest)).incomplete,true);
  const overlap = structuredClone(release.serving_manifest); overlap.additions[0].id = originals[0].id;
  assert.equal((await selectGovernedGrubRows(all,overlap)).incomplete,true);
  const pendingWithAdditions = {...release.serving_manifest,status:'pending'};
  assert.equal((await selectGovernedGrubRows(all,pendingWithAdditions)).incomplete,true);
});

test('unlisted published rows remain excluded and an original content change holds both catalogue surfaces', async () => {
  const rogue = {...all[798],id:'synthetic-unlisted',title:'Not reviewed'};
  const output = await selectGovernedGrubRows([...all,rogue],release.serving_manifest);
  assert.equal(output.rows.length,2671); assert.ok(!output.rows.some(row => row.id === rogue.id));
  const changed = structuredClone(all); changed[0].data.ingredients[0].amount = '500g';
  assert.equal((await selectGovernedGrubRows(changed,pendingManifest)).reason,'original_content_changed');
});

test('six-hour overnight recipes retain total timing and cannot pass the fast filter or old planner timing check', () => {
  const row = structuredClone(all[798]); row.data.prep_minutes = 10; row.data.cook_minutes = 0; row.data.rest_minutes = 360; row.data.total_minutes = 370; row.data.timeMinutes = 10;
  const recipe = memberRecipe(row);
  assert.equal(recipe.minutes,370); assert.equal(filterRecipe(recipe,'fast'),false); assert.equal(reviewedRecipeMinutes(row.data),370);
  const legacy = structuredClone(originals[0]); legacy.data.total_minutes = 999;
  assert.equal(memberRecipe(legacy).minutes,15); assert.equal(reviewedRecipeMinutes(legacy.data),15);
});

test('pending authority retains 798 originals; approved authority requires the complete exact owner batch', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(),'grub-retained-serving-'));
  try {
    execFileSync(process.execPath,['grub-v1-publication-pack.mjs'],{stdio:'pipe',env:{...process.env,COFID_INDEX:path.resolve('tests/fixtures/grub-cofid-2021-governed-subset.json'),GRUB_PUBLICATION_DIR:dir,GRUB_DECISIONS_FILE:path.resolve('evidence/grub-v1-final-decisions-2026-08-14.json')}});
    const payload = JSON.parse(fs.readFileSync(path.join(dir,'grub-v1-publishable.json'),'utf8'));
    const human = JSON.parse(fs.readFileSync('evidence/matt-v1-final-content-acceptance-2026-08-14.json','utf8'));
    const raw = new Map(buildIndustrialCatalogue().recipes.map(row => [row.id,row]));
    const rows = payload.items.map(item => ({...item,data:{...raw.get(item.id),...item.data,provenance:{final_v1_acceptance:{accepted:true,proof:human.proof,reviewer:human.reviewer,accepted_at:human.accepted_at}}}}));
    const pending={...productionManifest,status:'pending',additions:[],revisions:[]};
    const result = await selectGovernedGrubRows(rows,pending);
    assert.equal(result.incomplete,false,result.reason); assert.equal(result.rows.length,798); assert.equal(result.expansionAccepted,0);
    assert.equal((await selectGovernedGrubRows(rows)).incomplete,true,'Approved runtime must reject missing owner-authorised additions');
    rows.push(...ownerRelease.additions.filter(row=>row.content_type==='recipe').map(row=>({...row,data:JSON.parse(row.data_json),review:JSON.parse(row.review_json)})));
    const complete=await selectGovernedGrubRows(rows);assert.equal(complete.incomplete,false,complete.reason);assert.equal(complete.rows.length,2671);
    const queryFile = path.join(dir,'read-only-production-query-fixture.json');
    const queryResult = [{success:true,results:rows.map(row => ({id:row.id,title:row.title,version:row.version||1,data_json:JSON.stringify(row.data),review_json:JSON.stringify(row.review)}))}];
    fs.writeFileSync(queryFile,JSON.stringify(queryResult));
    const verified = JSON.parse(execFileSync(process.execPath,['member-experience/verify-production-catalogue.mjs',queryFile],{encoding:'utf8'}));
    assert.equal(verified.exactServingAuthority,true); assert.equal(verified.originalAccepted,798); assert.equal(verified.databaseWrites,false);
    queryResult[0].results[0].title += ' Changed'; fs.writeFileSync(queryFile,JSON.stringify(queryResult));
    assert.throws(() => execFileSync(process.execPath,['member-experience/verify-production-catalogue.mjs',queryFile],{stdio:'pipe'}),/original_content_changed/);
  } finally { fs.rmSync(dir,{recursive:true,force:true}); }
});

function ownerInput() {
  const input=structuredClone(source);delete input.humanAcceptance;
  input.ownerAcceptance={proof:'GRUB_OWNER_PUBLICATION_INSTRUCTION_V1',status:'authorised',instruction:'Publish them all !!!!!!',actor:{id:'Matt O’Brien',kind:'human',role:'owner'},recorded_at:'2026-09-16T18:46:00Z',human_editorial_review_claimed:false,candidate_sha256:hash(input.result),independent_review_sha256:hash(normaliseGrubEditorialEvidence(input.decisions)),authorship_sha256:hash(input.authorship),families:input.decisions.families.map(f=>({...structuredClone(f),decision:'AUTHORISE_PUBLICATION'}))};
  return input;
}

test('explicit owner instruction authorises exact reviewed batch without inventing human editorial review',async()=>{
  const input=ownerInput(),approved=buildGrubExpansionPublication(input);
  assert.equal(approved.items.length,1873);
  assert.equal(approved.serving_manifest.acceptance_kind,'owner_publication');
  for(const row of approved.items){assert.equal(row.review.owner_publication.human_editorial_review_claimed,false);assert.equal(row.review.reviewer.kind,'ai');assert.equal(row.review.human_acceptance,undefined);}
  const selected=await selectGovernedGrubRows([...originals,...approved.items.map(rowFromItem)],approved.serving_manifest);
  assert.equal(selected.incomplete,false);assert.equal(selected.rows.length,2671);
});

test('owner instruction cannot authorise stale, partial, self-reviewed or falsely attested content',()=>{
  for(const mutate of [
    x=>x.ownerAcceptance.instruction='Go ahead',
    x=>x.ownerAcceptance.actor.role='viewer',
    x=>x.ownerAcceptance.human_editorial_review_claimed=true,
    x=>x.ownerAcceptance.candidate_sha256='0'.repeat(64),
    x=>x.ownerAcceptance.families[0].recipes.pop(),
    x=>x.ownerAcceptance.families[0].template_digest='stale',
    x=>x.selectedTemplateKeys=[x.result.families[0].template_key],
    x=>x.decisions.recipes[0].reviewer.id='synthetic-author',
  ]){const input=ownerInput();mutate(input);assert.throws(()=>buildGrubExpansionPublication(input));}
});
