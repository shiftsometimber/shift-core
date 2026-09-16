// Shared by both Grub serving surfaces. This module never creates recipes.
import {GRUB_EXPANSION_SERVING_AUTHORITY} from './grub-expansion-serving-manifest-v1.mjs';
const nutrients = ['kcal','protein_g','carbohydrate_g','fat_g','fibre_g'];
const sha256 = async text => [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text)))].map(byte => byte.toString(16).padStart(2,'0')).join('');
const unique = (rows,key) => new Map(rows.map(row => [row[key],row]));

function originalContent(row) {
  const data = row.data, content = {};
  for (const key of ['title','meal_type','servings','ingredients','method','equipment','allergens','storage','food_safety','nutrition','shift_says']) {
    if (key === 'title') content[key] = row.title;
    else if (key === 'nutrition') content[key] = Object.fromEntries(nutrients.map(name => [name,data.nutrition?.[name]]));
    else if (key === 'shift_says') { if (data[key] != null) content[key] = data[key]; }
    else content[key] = data[key];
  }
  return content;
}

export async function selectGovernedGrubRows(rows,manifest = GRUB_EXPANSION_SERVING_AUTHORITY) {
  const accepted = rows.filter(row => row.data?.provenance?.final_v1_acceptance?.accepted === true);
  const base = {active:true,expected:798,accepted:accepted.length,expansionAccepted:0,publishedTotal:rows.length};
  const failure = reason => ({...base,incomplete:true,reason,rows:[]});
  if (manifest?.proof !== 'GRUB_EXPANSION_SERVING_AUTHORITY_V1' || !['pending','approved'].includes(manifest.status) || !Array.isArray(manifest.protected_v1) || manifest.protected_v1.length !== 798 || !Array.isArray(manifest.quarantined_ids) || manifest.quarantined_ids.length !== 205 || !Array.isArray(manifest.additions)) return failure('invalid_serving_manifest');
  const protectedIds = unique(manifest.protected_v1,'id'), excluded = new Set(manifest.quarantined_ids), byId = unique(rows,'id');
  if (protectedIds.size !== 798 || excluded.size !== 205 || byId.size !== rows.length || accepted.length !== 798) return failure('original_cohort_incomplete');
  if (accepted.some(row => !protectedIds.has(row.id) || excluded.has(row.id) || row.review?.status !== 'approved')) return failure('original_authority_mismatch');
  const originalHashes = await Promise.all(accepted.map(async row => [row.id,await sha256(JSON.stringify(originalContent(row)))]));
  if (originalHashes.some(([id,hash]) => protectedIds.get(id)?.content_hash !== hash)) return failure('original_content_changed');
  if (manifest.status === 'pending') {
    if (manifest.additions.length) return failure('pending_manifest_has_additions');
    return {...base,incomplete:false,rows:accepted};
  }
  if (!/^[a-f0-9]{64}$/.test(manifest.release_id || '') || !/^[a-f0-9]{64}$/.test(manifest.review_digest || '') || !/^[a-f0-9]{64}$/.test(manifest.human_acceptance_digest || '') || !manifest.additions.length || manifest.additions.length > 1873 || unique(manifest.additions,'id').size !== manifest.additions.length) return failure('invalid_expansion_authority');
  const additions = [];
  for (const binding of manifest.additions) {
    const row = byId.get(binding.id), acceptance = row?.data?.provenance?.grub_expansion_acceptance;
    if (!row || protectedIds.has(binding.id) || excluded.has(binding.id) || row.title !== binding.title || row.data?.provenance?.final_v1_acceptance || acceptance?.accepted !== true || acceptance.proof !== 'GRUB_ADDITIVE_PUBLICATION_V1' || acceptance.release_id !== manifest.release_id || acceptance.content_hash !== binding.content_hash || row.review?.status !== 'approved' || row.review?.decision_source !== 'GRUB_ADDITIVE_EDITORIAL_DECISIONS_V1' || row.review?.content_hash !== binding.content_hash || !['ai','human'].includes(row.review?.reviewer?.kind)) return failure('expansion_missing_or_unapproved');
    if (acceptance.human_acceptance_digest !== manifest.human_acceptance_digest || row.review.human_acceptance?.proof !== 'GRUB_ADDITIVE_HUMAN_ACCEPTANCE_V1' || row.review.human_acceptance?.reviewer?.kind !== 'human' || row.review.human_acceptance?.template_digest !== acceptance.template_digest) return failure('expansion_human_acceptance_missing');
    additions.push(row);
  }
  const hashes = await Promise.all(additions.map(async row => ({id:row.id,data:await sha256(row.data_json || JSON.stringify(row.data)),review:await sha256(row.review_json || JSON.stringify(row.review))})));
  const bindings = unique(manifest.additions,'id');
  if (hashes.some(row => row.data !== bindings.get(row.id).data_sha256 || row.review !== bindings.get(row.id).review_sha256)) return failure('expansion_content_changed');
  return {...base,incomplete:false,expansionAccepted:additions.length,rows:[...accepted,...additions]};
}

export async function loadGovernedGrubCatalogue(DB,manifest = GRUB_EXPANSION_SERVING_AUTHORITY) {
  const allPublished = [];
  let after = '';
  for (;;) {
    const {results = []} = await DB.prepare("SELECT id,title,version,data_json,review_json,updated_at FROM structured_content WHERE content_type='recipe' AND status='published' AND id > ? ORDER BY id LIMIT ?").bind(after,500).all();
    if (!results.length) break;
    if (results.some((row,index) => !row.id || row.id <= (index ? results[index-1].id : after))) throw new Error('grub_catalogue_pagination_invalid');
    allPublished.push(...results.map(row => ({...row,data:JSON.parse(row.data_json),review:JSON.parse(row.review_json)})));
    if (allPublished.length > 10000) throw new Error('grub_catalogue_partition_unexpected');
    if (results.length < 500) break;
    after = results.at(-1).id;
  }
  return {allPublished,authority:await selectGovernedGrubRows(allPublished,manifest)};
}

export function reviewedRecipeMinutes(data) {
  if (data?.provenance?.grub_expansion_acceptance?.accepted === true && Number.isFinite(data.total_minutes) && data.total_minutes >= 0) return data.total_minutes;
  return Number(data?.prep_minutes || 0) + Number(data?.cook_minutes || 0);
}
