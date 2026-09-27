// Correct the archive publication dates lost by the HQ form's partial SEO object.
// Body, source dates, destinations, status and publication approvals are preserved.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const account=process.env.CLOUDFLARE_ACCOUNT_ID,token=process.env.CLOUDFLARE_API_TOKEN;
assert.ok(process.argv.includes('--remote'));assert.equal(account,'9e5386dcf455be34c582d93f8bfc79e6');assert.ok(token);
async function query(sql,params=[]){
 const r=await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/d1/database/88f40aed-cb23-4372-8c94-8a73f48bc847/query`,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({sql,params})});
 const b=await r.json();assert.ok(r.ok&&b.success,JSON.stringify(b.errors));return b.result[0];
}
const rows=(await query("SELECT id,status,content_package_json,updated_at,reviewed_at FROM radar_events WHERE json_extract(content_package_json,'$.archive.batch')='REC-036-UK-archive-20260913' ORDER BY id")).results;
assert.deepEqual(rows.map(r=>r.id),Array.from({length:15},(_,i)=>295+i));
assert.ok(rows.every(r=>r.status==='published'));
const proof=[];
for(const row of rows){
 const history=(await query("SELECT created_at FROM radar_publication_history WHERE event_id=? AND action='published' ORDER BY version LIMIT 1",[row.id])).results[0];
 assert.ok(history?.created_at?.startsWith('2026-09-13'));
 const content=JSON.parse(row.content_package_json), before={datePublished:content.seo.datePublished,author:content.seo.author};
 const after={datePublished:history.created_at,author:'SHIFT Newsroom'};
 if(before.datePublished!==after.datePublished||before.author!==after.author){
  const change=await query("UPDATE radar_events SET content_package_json=json_set(content_package_json,'$.seo.datePublished',?,'$.seo.author',?) WHERE id=? AND status='published' AND content_package_json=?",[after.datePublished,after.author,row.id,row.content_package_json]);
  assert.equal(change.meta?.changes,1,'Article changed during metadata correction');
  await query('INSERT INTO radar_audit(event_id,action,actor,detail_json) VALUES(?,?,?,?)',[row.id,'archive_metadata_corrected','codex_archive_preparation',JSON.stringify({batch:'REC-036-UK-archive-20260913',reason:'HQ partial SEO payload dropped original metadata; align SHIFT publication date with first audited publication, retaining source date separately.',before,after,body_changed:false,destinations_changed:false,status_changed:false})]);
 }
 const check=(await query('SELECT status,content_package_json,updated_at,reviewed_at FROM radar_events WHERE id=?',[row.id])).results[0];
 const corrected=JSON.parse(check.content_package_json);assert.deepEqual(corrected,{...content,seo:{...content.seo,...after}});
 assert.equal(check.status,row.status);assert.equal(check.updated_at,row.updated_at);assert.equal(check.reviewed_at,row.reviewed_at);
 proof.push({id:row.id,slug:content.seo.slug,before,after,originalSourceDate:content.archive.original_source_date});
}
fs.writeFileSync('uk-archive-metadata-correction.json',JSON.stringify(proof,null,2));
console.log('PASS: 15 published archive articles retain their content and approval state; SEO dates match the first audited SHIFT publication.');
console.log(JSON.stringify(proof,null,2));
