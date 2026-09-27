import fs from 'node:fs';
import path from 'node:path';
import {CATALOGUE_PUBLICATION_RELEASE} from '../catalogue-publication-release-v1.mjs';
import {validateCatalogueRelease,validateCatalogueSnapshot} from '../catalogue-publication-core.mjs';
import {CATALOGUE_COLUMNS,catalogueRowsSha256,countCatalogueTypes} from '../catalogue-publication-shared.mjs';

if(process.argv[2]==='--sql') {
  console.log(`SELECT ${CATALOGUE_COLUMNS.join(',')} FROM structured_content WHERE content_type IN ('recipe','exercise') ORDER BY id;`);
}else {
  const input=process.argv[2],out=process.argv[3];
  if(!input || !out)throw new Error('usage: catalogue-publication-snapshot.mjs <wrangler-json> <artifact-directory>');
  const raw=JSON.parse(fs.readFileSync(input,'utf8'));
  if(!Array.isArray(raw) || raw.length!==1 || raw[0]?.success!==true || !Array.isArray(raw[0].results))throw new Error('catalogue_snapshot_query_invalid');
  await validateCatalogueRelease(CATALOGUE_PUBLICATION_RELEASE);
  const rows=await validateCatalogueSnapshot(CATALOGUE_PUBLICATION_RELEASE,raw[0].results);
  const approved={...CATALOGUE_PUBLICATION_RELEASE,status:'approved'};
  const proof={proof:'CATALOGUE_READ_ONLY_SNAPSHOT_V1',status:'pass',source_sha:process.env.GITHUB_SHA||null,captured_at:new Date().toISOString(),database_writes:false,release_id:approved.release_id,rows_sha256:approved.rows_sha256,snapshot_sha256:await catalogueRowsSha256(rows),snapshot_counts:countCatalogueTypes(rows),protected_originals:approved.protected_originals.length,addition_counts:approved.addition_counts};
  fs.mkdirSync(out,{recursive:true});
  fs.writeFileSync(path.join(out,'catalogue-snapshot.json'),JSON.stringify(rows,null,2)+'\n');
  fs.writeFileSync(path.join(out,'catalogue-snapshot-proof.json'),JSON.stringify(proof,null,2)+'\n');
  // Preserve the generated lazy compressed payload, changing only its phase.
  // The separate snapshot proof binds the exact nine-column source bytes.
  const module=fs.readFileSync(new URL('../catalogue-publication-release-v1.mjs',import.meta.url),'utf8');
  const statusLine=`"status": "${CATALOGUE_PUBLICATION_RELEASE.status}"`;
  if(!module.includes(statusLine))throw new Error('catalogue_release_source_format_changed');
  fs.writeFileSync(path.join(out,'catalogue-publication-release-v1.mjs'),module.replace(statusLine,'"status": "approved"'));
  fs.copyFileSync(new URL('../evidence/catalogue-publication-2026-09-16/target-serving-manifests.json.gz',import.meta.url),path.join(out,'target-serving-manifests.json.gz'));
  console.log(JSON.stringify(proof,null,2));
}
