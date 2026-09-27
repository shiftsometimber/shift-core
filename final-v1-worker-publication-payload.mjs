import fs from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
const sqlPath=process.env.FINAL_V1_SQL_FILE||'final-v1-production-publication-evidence/final-v1-production-publication.sql';
const outPath=process.env.FINAL_V1_WORKER_PAYLOAD||'final-v1-production-publication-evidence/final-v1-worker-publication-payload.json';
const sourceSha=String(process.env.FINAL_V1_SOURCE_SHA||'').trim();
if(!/^[0-9a-f]{40}$/.test(sourceSha))throw new Error('FINAL_V1_SOURCE_SHA required');
const sql=fs.readFileSync(sqlPath,'utf8'),db=new DatabaseSync(':memory:');db.exec(sql);
const rows=db.prepare("SELECT id,content_type,title,status,data_json,review_json FROM structured_content WHERE status='published' ORDER BY content_type,id").all().map(x=>({...x}));
if(rows.length!==2124)throw new Error(`expected 2124 accepted rows, got ${rows.length}`);
const recipes=rows.filter(x=>x.content_type==='recipe').length,exercises=rows.filter(x=>x.content_type==='exercise').length;
if(recipes!==798||exercises!==1326)throw new Error(`partition drift ${recipes}/${exercises}`);
for(const row of rows){const d=JSON.parse(row.data_json),r=JSON.parse(row.review_json);if(d?.provenance?.final_v1_acceptance?.accepted!==true||r?.status!=='approved'||r?.final_v1!==true)throw new Error(`row not finally accepted: ${row.id}`)}
const payload={proof:'FINAL_V1_WORKER_PUBLICATION_PAYLOAD_V1',source_sha:sourceSha,total:rows.length,recipes,exercises,items:rows};
fs.writeFileSync(outPath,JSON.stringify(payload));
console.log(JSON.stringify({proof:payload.proof,source_sha:sourceSha,total:rows.length,recipes,exercises,bytes:fs.statSync(outPath).size},null,2));
