// Worker-safe serialization shared by the fixed release builder and publisher.
export const CATALOGUE_COLUMNS = Object.freeze(['id','content_type','title','version','status','data_json','review_json','created_at','updated_at']);
export const CATALOGUE_COUNTS = Object.freeze({originals:{recipe:798,exercise:1326},additions:{recipe:1885,exercise:1542}});
export const catalogueSha256 = async value => [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))].map(b=>b.toString(16).padStart(2,'0')).join('');
export function canonicalCatalogueRows(rows) {
  if (!Array.isArray(rows)) throw new Error('catalogue_rows_required');
  const ids=new Set();
  return rows.map(row=>{
    if (!row || typeof row.id!=='string' || !row.id || ids.has(row.id)) throw new Error('catalogue_duplicate_or_invalid_id');
    ids.add(row.id);
    for(const key of CATALOGUE_COLUMNS) if(!Object.hasOwn(row,key) || row[key]===undefined) throw new Error(`catalogue_missing_${key}`);
    return Object.fromEntries(CATALOGUE_COLUMNS.map(key=>[key,row[key]]));
  }).sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0);
}
export const catalogueRowsSha256 = async rows => catalogueSha256(JSON.stringify(canonicalCatalogueRows(rows)));
export function countCatalogueTypes(rows) {
  const counts={recipe:0,exercise:0};
  for(const row of rows) { if(!Object.hasOwn(counts,row.content_type)) throw new Error('catalogue_unexpected_type'); counts[row.content_type]++; }
  return counts;
}
export function sameCatalogueCounts(actual,expected) { return actual?.recipe===expected.recipe && actual?.exercise===expected.exercise; }
