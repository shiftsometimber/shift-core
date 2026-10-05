import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import {fileURLToPath} from 'node:url';
import {CATALOGUE_PUBLICATION_RELEASE as release} from '../catalogue-publication-release-v1.mjs';
import {GRUB_EXPANSION_SERVING_AUTHORITY as authority} from '../grub-expansion-serving-manifest-v1.mjs';
import {grubImages} from '../member-experience/grub-image-map.mjs';

// Build the entire governed image workload, using the serving identity of revisions.
// This is a source inventory. It must never be represented as a fresh D1 export.
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const output=path.resolve(process.argv[2]||path.join(root,'evidence/grub-image-coverage-2026-10-04'));
const pendingFile=process.argv[3];
const sha=value=>crypto.createHash('sha256').update(value).digest('hex');
const required=(condition,message)=>{if(!condition)throw new Error(message);};
const originals=['breakfast','lunch','dinner','snack'].flatMap(meal=>JSON.parse(fs.readFileSync(path.join(root,`preview/fit-grub/catalogue/${meal}.json`),'utf8')));
const rows=new Map(originals.map(row=>[row.id,{id:row.id,title:row.title,meal:row.meal,data:row.source,basis:'accepted_original_visual_snapshot',expected_content_hash:authority.protected_v1.find(x=>x.id===row.id)?.content_hash}]));
required(rows.size===798,'original_identity_count');
required(authority.protected_v1.every(x=>rows.has(x.id)),'original_identity_binding');
const published=new Map(release.additions.filter(x=>x.content_type==='recipe').map(x=>[x.id,x]));
required(published.size===1885,'publication_recipe_count');
for(const binding of [...authority.revisions,...authority.additions]){
  const row=published.get(binding.id);
  required(row&&row.title===binding.title&&row.status==='published',`publication_binding:${binding.id}`);
  required(sha(row.data_json)===binding.data_sha256,`data_hash:${binding.id}`);
  required(sha(row.review_json)===binding.review_sha256,`review_hash:${binding.id}`);
  const data=JSON.parse(row.data_json), id=binding.original_id||binding.id;
  if(binding.original_id)required(rows.has(id),`revision_original:${id}`);
  else required(!rows.has(id),`addition_duplicate:${id}`);
  rows.set(id,{id,title:row.title,meal:data.meal_type,data,basis:binding.original_id?'exact_published_protected_revision':'exact_published_expansion',publication_id:row.id,expected_content_hash:binding.content_hash,data_sha256:binding.data_sha256,review_sha256:binding.review_sha256});
}
required(rows.size===2671,'governed_identity_count');
required(authority.quarantined_ids.every(id=>!rows.has(id)),'quarantine_excluded');
const pending=pendingFile?JSON.parse(fs.readFileSync(pendingFile,'utf8')):[];
const pendingMap=new Map(pending.map(x=>[x.recipeId,x]));
// Prepared entries may already be in the local candidate mapper. They are not live.
const servedMap=new Map(grubImages.filter(x=>!pendingMap.has(x.id)).map(x=>[x.id,x]));
for(const [id,image] of servedMap){
  const row=rows.get(id);
  required(row&&image.title===row.title&&JSON.stringify(image.ingredients)===JSON.stringify(row.data.ingredients)&&JSON.stringify(image.method)===JSON.stringify(row.data.method),`served_image_exact_binding:${id}`);
}
for(const [id,image] of pendingMap){
  const row=rows.get(id);
  required(row&&image.title===row.title&&!servedMap.has(id),`pending_image_binding:${id}`);
  const asset=path.join(root,image.asset);
  required(fs.existsSync(asset)&&sha(fs.readFileSync(asset))===image.sha256,`pending_asset_hash:${id}`);
}
const groups=new Map();
const recipes=[...rows.values()].sort((a,b)=>a.id.localeCompare(b.id)).map(row=>{
  const signature=sha(JSON.stringify([row.data.ingredients,row.data.method]));
  const group=groups.get(signature)||{id:signature,recipe_ids:[],titles:[],ingredients:row.data.ingredients,method:row.data.method,meal:row.meal,assets:[]};
  group.recipe_ids.push(row.id);group.titles.push(row.title);
  const served=servedMap.get(row.id),prepared=pendingMap.get(row.id),asset=served||prepared;
  if(asset)group.assets.push({recipe_id:row.id,status:served?'current_exact_mapping':'prepared_not_live',src:served?.src||prepared?.asset,sha256:asset.sha256});
  groups.set(signature,group);
  return {id:row.id,title:row.title,meal:row.meal,basis:row.basis,publication_id:row.publication_id,expected_content_hash:row.expected_content_hash,data_sha256:row.data_sha256,review_sha256:row.review_sha256,visual_signature:signature,ingredients:row.data.ingredients,method:row.data.method,photo_status:served?'current_exact_mapping':prepared?'prepared_not_live':'missing',asset:asset?{src:served?.src||prepared?.asset,sha256:asset.sha256}:null};
});
const work=[...groups.values()].sort((a,b)=>a.meal.localeCompare(b.meal)||a.titles[0].localeCompare(b.titles[0])).map((group,index)=>({
  ...group,sequence:index+1,reuse_status:group.recipe_ids.length>1?'exact_content_reuse_candidate_requires_member_title_review':'single_recipe',
  title_conflict_review:group.titles.some(title=>title!==group.titles[0]),
  generation_status:group.assets.length?'asset_available_requires_exact_member_binding':'missing',
  prompt:`Create one premium realistic food editorial photograph for SHIFT My Timber. Landscape 4:3; warm natural light, cream ceramic serving ware, matte black or muted cream background; an ordinary believable single serving with generous margin for responsive cropping. No text, logos, people or decorative ingredients. Exact recipe: ${group.titles[0]}. Ingredients, quantities and allergens: ${JSON.stringify(group.ingredients)}. Preparation: ${JSON.stringify(group.method)}. Depict the finished food in the state described by that method, including any ingredients kept separate. Do not add garnish, sauces, sides or food absent from those ingredients. Quantities are illustrative, not nutritional or allergen evidence.`,
  review_required:['ingredient identity','cooked/raw state and preparation','all member titles versus actual recipe content','no unlisted food or garnish','credible single serving','responsive crop','asset hash and exact per-recipe mapping','fresh serving read-back before publication']
}));
const count=status=>recipes.filter(x=>x.photo_status===status).length;
const summary={proof:'GRUB_WHOLE_CATALOGUE_IMAGE_QUEUE_V1',source_commit:'16db771c02ad154472eb0b52c4715def98702f88',publication_release_id:release.release_id,serving_authority_release_id:authority.release_id,basis:'798 accepted original visual snapshots, with 12 exact published revisions substituted under original serving IDs, plus 1873 exact published additions. Source inventory, not fresh database read-back.',usable_recipes:recipes.length,current_exact_mappings:count('current_exact_mapping'),prepared_not_live:count('prepared_not_live'),missing_recipes:count('missing'),distinct_exact_content_groups:work.length,duplicate_pairs:work.filter(x=>x.recipe_ids.length>1).length,groups_without_any_asset:work.filter(x=>!x.assets.length).length,current_coverage_percent:100*count('current_exact_mapping')/recipes.length,coverage_if_prepared_attached_percent:100*(count('current_exact_mapping')+count('prepared_not_live'))/recipes.length,complete:false,closure:'Every governed usable recipe has reviewed accurate imagery with an explicit exact title/ingredient/method binding, asset hash, responsive verification and fresh serving read-back. Never close from a sample or family-only matching.',reuse_limit:'2623 strict ingredient-and-method groups are candidates, not approved shared mappings. Different title claims require review. No nutrition, clinical or allergen certification inferred.'};
fs.mkdirSync(output,{recursive:true});
fs.writeFileSync(path.join(output,'summary.json'),JSON.stringify(summary,null,2)+'\n');
fs.writeFileSync(path.join(output,'recipe-image-queue.json.gz'),zlib.gzipSync(JSON.stringify({summary,recipes,groups:work}),{level:9}));
console.log(JSON.stringify(summary,null,2));
