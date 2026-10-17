// Offline, explicit publication preparation. Never deploys or writes a database.
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {buildUKCorePublication} from '../grub-uk-core-publication-gate-20261017.mjs';
import {GRUB_DISCOVERY_MANIFEST} from '../member-experience/grub-discovery-manifest-20261017.mjs';
const file=process.argv[2];
if(!file)throw Error('Supply the actual completed independent human-review record. No review is inferred from deployment permission.');
const pack=JSON.parse(fs.readFileSync('content/grub/uk-core-drafts-20261017.json','utf8')),review=JSON.parse(fs.readFileSync(file,'utf8'));
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
if(review.discovery_manifest_sha256!==hash(GRUB_DISCOVERY_MANIFEST)||!['discovery_decisions','timing_estimates'].every(s=>review.discovery_review_scopes?.includes(s)))throw Error('The actual independent review must cover these exact discovery decisions and timing estimates.');
const publication=buildUKCorePublication(pack,review); // all gates run before any source write
const ids=new Set(GRUB_DISCOVERY_MANIFEST.rows.map(r=>r.id));
for(const item of publication.items)if(ids.has(item.id))throw Error('UK publication would collide with an existing discovery identity');
const manifest={...GRUB_DISCOVERY_MANIFEST,status:'approved',uk_core_release:publication.release_id,rows:[...GRUB_DISCOVERY_MANIFEST.rows,...publication.items.map((r,index)=>({id:r.id,decision:'retain',eligible:true,tier:'core',rank:r.data.food_format==='pizza'?index:30+index,reason:'Exact independent human-reviewed UK core recipe.',image_policy:'no_image_published',content_sha256:hash({title:r.title,data:r.data,review:r.review})}))]};
fs.writeFileSync('grub-uk-core-publication-20261017.mjs','// Exact source publication generated only after independent human review.\nexport const UK_CORE_PUBLICATION='+JSON.stringify(publication)+';\n');
fs.writeFileSync('member-experience/grub-discovery-manifest-20261017.mjs','// Discovery only; all old identities and recipe bytes remain addressable.\nexport const GRUB_DISCOVERY_MANIFEST='+JSON.stringify(manifest)+';\n');
console.log(JSON.stringify({prepared:true,release_id:publication.release_id,newRecipes:publication.items.length,deployed:false,databaseWrites:0,requiredNext:'Qualify the exact changed source and preserve current Core ownership before the already-authorised bounded release.'}));
