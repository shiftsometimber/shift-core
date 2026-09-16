import {CATALOGUE_PUBLICATION_RELEASE as release} from '../catalogue-publication-release-v1.mjs';
import {validateCatalogueRelease} from '../catalogue-publication-core.mjs';
import {CATALOGUE_COLUMNS} from '../catalogue-publication-shared.mjs';

const rows=await validateCatalogueRelease(release);
const quote=value=>`'${String(value).replaceAll("'","''")}'`;
const chunks=[];for(let index=0;index<rows.length;index+=40)chunks.push(rows.slice(index,index+40));
const same=CATALOGUE_COLUMNS.map(key=>`s.${key} IS json_extract(e.value,'$.${key}')`).join(' AND ');
const select=[`CASE WHEN EXISTS(SELECT 1 FROM structured_content s WHERE s.id=json_extract(e.value,'$.id') AND NOT (${same})) THEN json('catalogue_addition_collision') ELSE json_extract(e.value,'$.id') END`,...CATALOGUE_COLUMNS.slice(1).map(key=>`json_extract(e.value,'$.${key}')`)];
const sql=['BEGIN TRANSACTION;',"SELECT CASE WHEN (SELECT COUNT(*) FROM structured_content WHERE content_type IN ('recipe','exercise')) IN (2124,5551) THEN 1 ELSE json('catalogue_snapshot_count_drift') END;"];
for(const part of chunks){const json=quote(JSON.stringify(part));sql.push(`INSERT INTO structured_content (${CATALOGUE_COLUMNS.join(',')}) SELECT ${select.join(',')} FROM json_each(${json}) e WHERE true ON CONFLICT(id) DO NOTHING;`)}
sql.push('COMMIT;');process.stdout.write(sql.join('\n')+'\n');
