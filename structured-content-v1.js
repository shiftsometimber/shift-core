export async function ensureStructuredContent(DB){
  await DB.exec(`CREATE TABLE IF NOT EXISTS structured_content (id TEXT PRIMARY KEY,content_type TEXT NOT NULL,title TEXT NOT NULL,version INTEGER NOT NULL DEFAULT 1,status TEXT NOT NULL DEFAULT 'draft',data_json TEXT NOT NULL,review_json TEXT NOT NULL DEFAULT '{}',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);CREATE INDEX IF NOT EXISTS idx_structured_content_type_status ON structured_content(content_type,status);`);
}

export function assertPublishableStructuredContent(item){
  if(String(item?.status||'draft')!=='published')return true;
  const type=String(item?.contentType||'');
  const data=item?.data||{};
  const review=item?.review||{};
  if(review.status!=='approved')throw new Error('structured_content_review_approval_required');
  if(type==='recipe'){
    if(data?.nutrition?.status!=='validated')throw new Error('structured_recipe_nutrition_validation_required');
    for(const key of ['kcal','protein_g','carbohydrate_g','fat_g','fibre_g'])if(!Number.isFinite(Number(data?.nutrition?.[key])))throw new Error(`structured_recipe_${key}_required`);
    if(!String(data?.nutrition?.methodology||'').trim())throw new Error('structured_recipe_nutrition_methodology_required');
  }else if(type==='exercise'){
    if(data?.visual?.status!=='approved'||!String(data?.visual?.asset_ref||'').trim()||!String(data?.visual?.alt_text||'').trim())throw new Error('structured_exercise_member_visual_approval_required');
  }else throw new Error('structured_content_type_not_publishable');
  return true;
}

export async function upsertStructuredContent(DB,item){
  if(!item?.id||!item?.contentType||!item?.title)throw new Error('structured_content_identity_required');
  assertPublishableStructuredContent(item);
  await ensureStructuredContent(DB);
  const data=JSON.stringify(item.data||{}),review=JSON.stringify(item.review||{});
  await DB.prepare(`INSERT INTO structured_content(id,content_type,title,version,status,data_json,review_json,updated_at) VALUES(?,?,?,?,?,?,?,CURRENT_TIMESTAMP) ON CONFLICT(id) DO UPDATE SET content_type=excluded.content_type,title=excluded.title,version=MAX(structured_content.version+1,excluded.version),status=excluded.status,data_json=excluded.data_json,review_json=excluded.review_json,updated_at=CURRENT_TIMESTAMP`).bind(String(item.id),String(item.contentType),String(item.title),Number(item.version||1),String(item.status||'draft'),data,review).run();
  return{id:item.id};
}

export async function listPublishedContent(DB,type,{limit=100,offset=0}={}){
  await ensureStructuredContent(DB);
  const{results=[]}=await DB.prepare(`SELECT id,title,version,data_json,updated_at FROM structured_content WHERE content_type=? AND status='published' ORDER BY updated_at DESC LIMIT ? OFFSET ?`).bind(type,Math.min(500,Math.max(1,limit)),Math.max(0,offset)).all();
  return results.map(x=>({...x,data:JSON.parse(x.data_json||'{}')}));
}
