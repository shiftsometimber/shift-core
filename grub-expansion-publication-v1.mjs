// Offline release preparation. No credentials, network calls or database writes.
import {createHash} from 'node:crypto';
import {assertPublishableStructuredContent} from './structured-content-v1.js';

export const EXPANSION_PROOF = 'GRUB_ADDITIVE_PUBLICATION_V1';
export const REVIEW_SCOPES = ['title','ingredients','method','equipment','allergens','nutrition','storage','food_safety','serving_metadata'];
export const NUTRIENTS = ['kcal','protein_g','carbohydrate_g','fat_g','fibre_g'];
const snapshotKeys = ['id','content_type','title','version','status','data_json','review_json','created_at','updated_at'];
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const textHash = value => createHash('sha256').update(value).digest('hex');
const need = (ok,message) => { if (!ok) throw new Error(message); };
const uniqueMap = (rows,key,label) => {
  need(Array.isArray(rows), `${label} must be an array`);
  const map = new Map();
  for (const row of rows) { need(typeof row?.[key] === 'string' && row[key] && !map.has(row[key]), `${label} duplicate or missing ${key}`); map.set(row[key],row); }
  return map;
};
const same = (a,b) => JSON.stringify(a) === JSON.stringify(b);
const sorted = values => [...values].sort();
const descendants = rows => rows.map(({id,content_hash}) => ({id,content_hash})).sort((a,b) => a.id.localeCompare(b.id));

// Reconstruct the original V1 review shape, rather than hash publication-only
// nutrition status/provenance or a serializer's absent shift_says=null.
export function protectedRecipeContent(data,title) {
  const content = {};
  for (const key of ['title','meal_type','servings','ingredients','method','equipment','allergens','storage','food_safety','nutrition','shift_says']) {
    if (key === 'title') content[key] = title;
    else if (key === 'nutrition') content[key] = Object.fromEntries(NUTRIENTS.map(name => [name,data.nutrition?.[name]]));
    else if (key === 'shift_says') { if (data[key] != null) content[key] = data[key]; }
    else content[key] = data[key];
  }
  return content;
}

export function buildGrubHumanAcceptanceTemplate(result) {
  need(result?.summary?.proof === 'GRUB_ADDITIVE_EXPANSION_REVIEW_V1', 'candidate proof required');
  const candidates = uniqueMap(result.candidates,'id','candidates');
  return {proof:'GRUB_ADDITIVE_HUMAN_ACCEPTANCE_V1',status:'pending',policy_source:'docs/SHIFT-MEMBER-HUMANNESS-STANDARD.md',families:result.families.map(family => ({
    template_key:family.template_key,template_digest:family.template_digest,
    recipes:family.recipe_ids.map(id => { const row = candidates.get(id); need(row,`family recipe missing: ${id}`); return {id,content_hash:row.content_hash}; }),
    decision:'PENDING',reviewer:null,reviewed_at:null,scopes:[],required_scopes:[...REVIEW_SCOPES,'member_humanness'],findings:[]
  }))};
}

export function normaliseGrubEditorialEvidence(report) {
  if (report?.proof === 'GRUB_ADDITIVE_EDITORIAL_DECISIONS_V1') return report;
  need(report?.proof === 'GRUB_INDEPENDENT_EDITORIAL_REVIEW_V1' && report.publication_authority === false && report.human_editorial_acceptance === 'pending', 'independent editorial evidence proof required');
  need(Array.isArray(report.decisions) && Array.isArray(report.families), 'independent editorial evidence records required');
  return {proof:'GRUB_ADDITIVE_EDITORIAL_DECISIONS_V1',source_evidence_proof:report.proof,source_evidence_sha256:hash(report),publication_authority:false,
    recipes:structuredClone(report.decisions),families:report.families.map(family => {
      need(family.coverage_complete === true && Array.isArray(family.descendants), `incomplete independent family evidence: ${family.template_key}`);
      return {template_key:family.template_key,template_digest:family.template_digest,decision:family.decision,recipes:structuredClone(family.descendants)};
    })};
}

export function buildGrubExpansionPublication({result,decisions,authorship,humanAcceptance,existingRows,selectedTemplateKeys}) {
  need(result?.summary?.proof === 'GRUB_ADDITIVE_EXPANSION_REVIEW_V1', 'candidate proof required');
  const protectedIds = uniqueMap(result.protected_v1,'id','protected cohort');
  const excluded = uniqueMap(result.quarantined,'id','quarantine');
  const candidates = uniqueMap(result.candidates,'id','candidates');
  const families = uniqueMap(result.families,'template_key','families');
  need(protectedIds.size === 798 && excluded.size === 205 && candidates.size === 1873 && families.size === 87, 'immutable expansion partition mismatch');
  for (const row of candidates.values()) {
    need(!protectedIds.has(row.id) && !excluded.has(row.id), `candidate overlaps protected/quarantined ID: ${row.id}`);
    need(row.content_hash === hash(Object.fromEntries(Object.entries(row).filter(([key]) => key !== 'content_hash'))), `candidate hash mismatch: ${row.id}`);
  }
  for (const id of protectedIds.keys()) need(!excluded.has(id), `protected/quarantine overlap: ${id}`);
  const seen = new Set();
  for (const family of families.values()) {
    const rows = [...candidates.values()].filter(row => row.template_key === family.template_key);
    need(rows.length && same(sorted(family.recipe_ids),sorted(rows.map(row => row.id))), `family descendants mismatch: ${family.template_key}`);
    need(family.template_digest === hash({scope:'GRUB_ADDITIVE_EXPANSION_V1',key:family.template_key,descendants:descendants(rows)}), `family digest mismatch: ${family.template_key}`);
    rows.forEach(row => seen.add(row.id));
  }
  need(seen.size === candidates.size, 'candidate missing from family authority');
  decisions = normaliseGrubEditorialEvidence(decisions);
  need(decisions?.proof === 'GRUB_ADDITIVE_EDITORIAL_DECISIONS_V1', 'independent editorial decision proof required');
  need(authorship?.proof === 'GRUB_ADDITIVE_AUTHORSHIP_V1', 'independent authorship roster required');
  const reviews = uniqueMap(decisions.recipes,'id','recipe decisions');
  const familyDecisions = uniqueMap(decisions.families,'template_key','family decisions');
  const authors = uniqueMap(authorship.recipes,'id','authorship roster');
  const selected = selectedTemplateKeys || [...families.keys()];
  need(Array.isArray(selected) && selected.length && new Set(selected).size === selected.length, 'nonempty unique family selection required');
  // docs/SHIFT-MEMBER-HUMANNESS-STANDARD.md makes human second-person
  // editorial acceptance mandatory above automated/domain checks. Independent
  // AI review is retained honestly; it cannot attest that a human reviewed it.
  need(humanAcceptance?.proof === 'GRUB_ADDITIVE_HUMAN_ACCEPTANCE_V1', 'exact human second-person acceptance required by SHIFT-MEMBER-HUMANNESS-STANDARD');
  const humanDecisions = uniqueMap(humanAcceptance.families,'template_key','human acceptance');
  const approved = [];
  for (const key of selected) {
    const family = families.get(key), decision = familyDecisions.get(key), human = humanDecisions.get(key);
    need(family && decision?.decision === 'PASS' && decision.template_digest === family.template_digest, `family lacks exact PASS: ${key}`);
    const rows = family.recipe_ids.map(id => candidates.get(id));
    need(family.eligible_for_review === true && family.technical_holds?.length === 0, `family technical hold: ${key}`);
    need(Array.isArray(decision.recipes) && same(descendants(decision.recipes),descendants(rows)), `family review does not cover all exact descendants: ${key}`);
    need(human?.decision === 'PASS' && human.template_digest === family.template_digest && human.reviewer?.kind === 'human' && typeof human.reviewer.id === 'string' && human.reviewer.id.trim() && Number.isFinite(Date.parse(human.reviewed_at)), `family lacks exact human acceptance: ${key}`);
    need(Array.isArray(human.recipes) && same(descendants(human.recipes),descendants(rows)) && REVIEW_SCOPES.every(scope => human.scopes?.includes(scope)) && human.scopes.includes('member_humanness') && Array.isArray(human.findings) && human.findings.length === 0, `human editorial review incomplete: ${key}`);
    for (const row of rows) {
      const review = reviews.get(row.id), author = authors.get(row.id);
      need(row.status === 'draft' && row.review?.status === 'awaiting_second_person_review' && row.review.approved === false && Array.isArray(row.technical_issues) && row.technical_issues.length === 0, `candidate not technically ready: ${row.id}`);
      need(review?.decision === 'PASS' && review.content_hash === row.content_hash, `recipe lacks exact PASS: ${row.id}`);
      need(typeof review.reviewer?.id === 'string' && review.reviewer.id.trim() && ['ai','human'].includes(review.reviewer.kind), `reviewer identity required: ${row.id}`);
      need(Number.isFinite(Date.parse(review.reviewed_at)), `review timestamp required: ${row.id}`);
      need(Array.isArray(review.findings) && review.findings.length === 0 && REVIEW_SCOPES.every(scope => review.scopes?.includes(scope)), `review incomplete or unresolved: ${row.id}`);
      need(author?.content_hash === row.content_hash && Array.isArray(author.author_ids) && author.author_ids.length && author.author_ids.every(id => typeof id === 'string' && id.trim()) && new Set(author.author_ids).size === author.author_ids.length, `exact author roster required: ${row.id}`);
      need(same(sorted(review.author_ids || []),sorted(author.author_ids)) && !author.author_ids.includes(review.reviewer.id), `independent reviewer required: ${row.id}`);
      need(!author.author_ids.includes(human.reviewer.id), `independent human reviewer required: ${row.id}`);
      need(['prep_minutes','cook_minutes','rest_minutes','total_minutes'].every(field => typeof row[field] === 'number' && Number.isFinite(row[field]) && row[field] >= 0) && row.total_minutes >= Math.max(row.prep_minutes,row.cook_minutes,row.rest_minutes) && row.total_minutes > 0, `reviewed serving times required: ${row.id}`);
      need(Array.isArray(row.tags) && row.taxonomy && typeof row.taxonomy === 'object' && typeof row.food_format === 'string' && row.food_format, `reviewed serving metadata required: ${row.id}`);
      need(Array.isArray(row.ingredient_evidence) && row.ingredient_evidence.length === row.ingredients?.length, `ingredient nutrition evidence required: ${row.id}`);
      need(NUTRIENTS.every(name => typeof row.nutrition?.[name] === 'number' && Number.isFinite(row.nutrition[name]) && row.nutrition[name] >= 0), `validated numeric nutrition required: ${row.id}`);
      approved.push({row,review,family,human});
    }
  }
  const existing = uniqueMap(existingRows,'id','existing database snapshot');
  const protectedSnapshot = [];
  for (const [id,binding] of protectedIds) {
    const source = existing.get(id);
    need(source && snapshotKeys.every(key => source[key] !== undefined) && source.content_type === 'recipe' && source.status === 'published', `original published row missing: ${id}`);
    const data = JSON.parse(source.data_json), review = JSON.parse(source.review_json);
    need(data.provenance?.final_v1_acceptance?.accepted === true && review.status === 'approved', `original authority missing: ${id}`);
    need(hash(protectedRecipeContent(data,source.title)) === binding.content_hash, `original content changed: ${id}`);
    protectedSnapshot.push(Object.fromEntries(snapshotKeys.map(key => [key,source[key]])));
  }
  const legacy = [...existing.values()].filter(row => row.content_type === 'recipe' && row.status === 'published' && JSON.parse(row.data_json).provenance?.final_v1_acceptance?.accepted === true);
  need(legacy.length === 798, 'unexpected legacy acceptance count');
  for (const id of excluded.keys()) need(existing.get(id)?.status !== 'published', `quarantined recipe published: ${id}`);
  for (const {row} of approved) need(!existing.has(row.id), `insert would overwrite existing ID: ${row.id}`);
  const reviewDigest = hash({decisions,authorship}), humanDigest = hash(humanAcceptance);
  const releaseId = hash({proof:EXPANSION_PROOF,protected:result.protected_v1,excluded:sorted(excluded.keys()),approved:descendants(approved.map(item => item.row)),review_digest:reviewDigest,human_acceptance_digest:humanDigest});
  const items = approved.map(({row,review,family,human}) => {
    const fields = ['meal_type','servings','ingredients','method','equipment','allergens','storage','food_safety','ingredient_evidence','prep_minutes','cook_minutes','rest_minutes','total_minutes','tags','taxonomy','food_format'];
    const data = Object.fromEntries(fields.map(key => [key,structuredClone(row[key])]));
    if (row.shift_says != null) data.shift_says = row.shift_says;
    data.nutrition = {status:'validated',...row.nutrition,methodology:'CoFID 2021 ingredient-level weighted calculation; independently reviewed exact expansion content'};
    data.provenance = {grub_expansion_acceptance:{accepted:true,proof:EXPANSION_PROOF,release_id:releaseId,content_hash:row.content_hash,template_digest:family.template_digest,reviewer:review.reviewer,reviewed_at:review.reviewed_at,human_acceptance_digest:humanDigest}};
    data.canonical_review = {scope:'exact_recipe_and_family',template_digest:family.template_digest,content_hash:row.content_hash,decision_source:decisions.proof};
    const item = {id:row.id,contentType:'recipe',title:row.title,version:1,status:'published',data,review:{status:'approved',scope:'exact_recipe_and_family',decision_source:decisions.proof,content_hash:row.content_hash,template_digest:family.template_digest,reviewer:structuredClone(review.reviewer),reviewed_at:review.reviewed_at,scopes:[...review.scopes],author_ids:[...review.author_ids],human_acceptance:{proof:humanAcceptance.proof,template_digest:family.template_digest,reviewer:structuredClone(human.reviewer),reviewed_at:human.reviewed_at,scopes:[...human.scopes]}}};
    assertPublishableStructuredContent(item);
    return item;
  });
  const servingManifest = {proof:'GRUB_EXPANSION_SERVING_AUTHORITY_V1',status:'approved',release_id:releaseId,review_digest:reviewDigest,human_acceptance_digest:humanDigest,protected_v1:structuredClone(result.protected_v1),quarantined_ids:sorted(excluded.keys()),additions:items.map(item => ({id:item.id,title:item.title,content_hash:item.review.content_hash,data_sha256:textHash(JSON.stringify(item.data)),review_sha256:textHash(JSON.stringify(item.review))}))};
  const release = {proof:EXPANSION_PROOF,release_id:releaseId,production_mutated:false,review_digest:reviewDigest,human_acceptance_digest:humanDigest,protected_snapshot:protectedSnapshot,quarantined_ids:sorted(excluded.keys()),items,serving_manifest:servingManifest};
  release.payload_sha256 = hash(release);
  return release;
}

// Execute the ENTIRE returned list in one D1 DB.batch, which is transactional.
// Never execute statements individually. Ordinary short-lived guard tables are
// used because D1 does not support connection-scoped SQLite TEMP tables.
// Each INSERT stays below D1's 100 bound parameters; no conflict handler updates
// existing content. Any changed original row/collision rolls the whole batch back.
export function prepareGrubExpansionBatch(release) {
  const {payload_sha256,...body} = release || {};
  need(body.proof === EXPANSION_PROOF && payload_sha256 === hash(body), 'publication payload hash mismatch');
  need(/^[a-f0-9]{64}$/.test(body.release_id) && body.protected_snapshot?.length === 798 && body.quarantined_ids?.length === 205 && body.items?.length > 0, 'publication guard partition mismatch');
  const prefix = `grub_guard_${body.release_id.slice(0,20)}`, protectedTable = `${prefix}_original`, excludedTable = `${prefix}_excluded`, checkTable = `${prefix}_check`;
  const statements = [];
  const add = (sql,params = []) => statements.push({sql,params});
  add(`CREATE TABLE ${protectedTable} (id TEXT PRIMARY KEY,content_type TEXT,title TEXT,version INTEGER,status TEXT,data_json TEXT,review_json TEXT,created_at TEXT,updated_at TEXT)`);
  add(`CREATE TABLE ${excludedTable} (id TEXT PRIMARY KEY)`);
  add(`CREATE TABLE ${checkTable} (ok INTEGER NOT NULL CHECK (ok = 1))`);
  const insert = (table,columns,rows) => {
    const chunkSize = Math.floor(90 / columns.length);
    for (let i=0; i<rows.length; i+=chunkSize) {
      const chunk = rows.slice(i,i+chunkSize);
      add(`INSERT INTO ${table} (${columns.join(',')}) VALUES ${chunk.map(() => `(${columns.map(() => '?').join(',')})`).join(',')}`,chunk.flat());
    }
  };
  insert(protectedTable,snapshotKeys,body.protected_snapshot.map(row => snapshotKeys.map(key => row[key])));
  insert(excludedTable,['id'],body.quarantined_ids.map(id => [id]));
  add(`INSERT INTO ${checkTable} SELECT CASE WHEN (SELECT COUNT(*) FROM structured_content s JOIN ${protectedTable} p ON ${snapshotKeys.map(key => `s.${key} IS p.${key}`).join(' AND ')}) = 798 AND (SELECT COUNT(*) FROM structured_content WHERE content_type = 'recipe' AND status = 'published' AND json_extract(data_json,'$.provenance.final_v1_acceptance.accepted') = 1) = 798 AND NOT EXISTS (SELECT 1 FROM structured_content s JOIN ${excludedTable} q ON s.id = q.id WHERE s.status = 'published') THEN 1 ELSE 0 END`);
  insert('structured_content',['id','content_type','title','version','status','data_json','review_json'],body.items.map(item => [item.id,'recipe',item.title,1,'published',JSON.stringify(item.data),JSON.stringify(item.review)]));
  add(`DROP TABLE ${checkTable}`); add(`DROP TABLE ${excludedTable}`); add(`DROP TABLE ${protectedTable}`);
  need(statements.every(statement => statement.params.length <= 100 && Buffer.byteLength(statement.sql) < 100000 && statement.params.every(value => typeof value !== 'string' || Buffer.byteLength(value) < 2000000)), 'D1 statement limits exceeded');
  return statements;
}
