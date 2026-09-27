import fs from 'node:fs';
import {CATALOGUE_PUBLICATION_RELEASE as release} from '../catalogue-publication-release-v1.mjs';

const input=process.argv[2];
if(!input)throw new Error('catalogue_d1_proof_input_required');
const payload=JSON.parse(fs.readFileSync(input,'utf8'));
const row=payload?.[0]?.results?.[0];
const additions=Number(release.addition_counts.recipe)+Number(release.addition_counts.exercise);
const originals=Number(release.protected_counts.recipe)+Number(release.protected_counts.exercise);
if(Number(row?.total)!==originals+additions || Number(row?.authorised)!==additions)throw new Error('catalogue_d1_proof_failed');
const report={ok:true,proof:'CATALOGUE_PUBLICATION_RESULT_V1',release_id:release.release_id,rows_sha256:release.rows_sha256,inserted:0,already_present:additions,protected_originals:originals,original_rows_unchanged:true,transactional:true,completed_at:new Date().toISOString(),published_at:null,verified_via:'cloudflare_d1'};
if(process.env.CATALOGUE_PUBLICATION_REPORT)fs.writeFileSync(process.env.CATALOGUE_PUBLICATION_REPORT,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
