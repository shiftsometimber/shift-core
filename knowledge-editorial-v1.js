import hq from './hq-ai-v2.js';

const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const WRITE_ROLES=new Set(['owner','admin','marketing','content']);

async function ensureReviewSchema(DB){
  await DB.exec(`CREATE TABLE IF NOT EXISTS knowledge_article_reviews (
    article_id INTEGER PRIMARY KEY,
    decision TEXT NOT NULL,
    reviewer_id INTEGER,
    reviewer_name TEXT NOT NULL,
    reviewer_email TEXT,
    notes TEXT,
    reviewed_at TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );CREATE INDEX IF NOT EXISTS idx_knowledge_article_reviews_decision ON knowledge_article_reviews(decision,reviewed_at);`);
}
async function actor(request,env,ctx){
  const r=await hq.fetch(new Request(new URL('/v1/hq/me',request.url),{method:'GET',headers:request.headers}),env,ctx);
  if(!r.ok)return{response:r};
  const body=await r.json();return{user:body.user||{}};
}
export async function listEditorialArticles(DB,baseArticles=[]){
  await ensureReviewSchema(DB);
  const {results=[]}=await DB.prepare(`SELECT article_id,decision,reviewer_id,reviewer_name,reviewer_email,notes,reviewed_at FROM knowledge_article_reviews`).all();
  const byId=new Map(results.map(r=>[Number(r.article_id),r]));
  return baseArticles.map(a=>({...a,review:byId.get(Number(a.id))||null}));
}
export async function reviewEditorialArticle(DB,articleId,user,{decision,notes}={}){
  await ensureReviewSchema(DB);
  const article=await DB.prepare(`SELECT id,title,slug,status FROM knowledge_articles WHERE id=?`).bind(Number(articleId)).first();
  if(!article)return{ok:false,status:404,error:'article_not_found'};
  const d=String(decision||'').toLowerCase();
  if(!['approved','changes_requested'].includes(d))return{ok:false,status:400,error:'invalid_review_decision'};
  const reviewedAt=new Date().toISOString();
  await DB.prepare(`INSERT INTO knowledge_article_reviews(article_id,decision,reviewer_id,reviewer_name,reviewer_email,notes,reviewed_at,updated_at) VALUES(?,?,?,?,?,?,?,CURRENT_TIMESTAMP)
    ON CONFLICT(article_id) DO UPDATE SET decision=excluded.decision,reviewer_id=excluded.reviewer_id,reviewer_name=excluded.reviewer_name,reviewer_email=excluded.reviewer_email,notes=excluded.notes,reviewed_at=excluded.reviewed_at,updated_at=CURRENT_TIMESTAMP`)
    .bind(Number(articleId),d,Number(user?.id)||null,String(user?.name||'Named HQ reviewer').slice(0,150),String(user?.email||'').slice(0,254)||null,String(notes||'').trim().slice(0,2000)||null,reviewedAt).run();
  if(d==='changes_requested'&&article.status!=='draft')await DB.prepare(`UPDATE knowledge_articles SET status='draft',updated_at=? WHERE id=?`).bind(reviewedAt,Number(articleId)).run();
  if(d==='approved'&&article.status==='draft')await DB.prepare(`UPDATE knowledge_articles SET status='review',updated_at=? WHERE id=?`).bind(reviewedAt,Number(articleId)).run();
  return{ok:true,status:200,articleId:Number(articleId),decision:d,reviewedBy:String(user?.name||'Named HQ reviewer'),reviewedAt};
}
export async function canPublishEditorialArticle(DB,slug){
  await ensureReviewSchema(DB);
  const row=await DB.prepare(`SELECT a.id,a.status,r.decision,r.reviewer_name,r.reviewer_email,r.reviewed_at FROM knowledge_articles a LEFT JOIN knowledge_article_reviews r ON r.article_id=a.id WHERE a.slug=?`).bind(String(slug||'')).first();
  return{ok:!!row&&row.decision==='approved',row:row||null};
}

export async function knowledgeEditorialRoutes(request,env,ctx){
  const u=new URL(request.url),p=u.pathname.replace(/\/+$/,'')||'/',m=request.method.toUpperCase();
  if(p!=='/v1/hq/articles'&&!/^\/v1\/hq\/articles\/\d+\/review$/.test(p))return null;
  await ensureReviewSchema(env.DB);

  if(m==='GET'&&p==='/v1/hq/articles'){
    const base=await hq.fetch(request,env,ctx);if(!base.ok)return base;
    const body=await base.json();return json({...body,articles:await listEditorialArticles(env.DB,body.articles||[])});
  }

  const a=await actor(request,env,ctx);if(a.response)return a.response;
  if(!WRITE_ROLES.has(String(a.user.role||'')))return json({ok:false,error:'forbidden'},403);

  const reviewMatch=p.match(/^\/v1\/hq\/articles\/(\d+)\/review$/);
  if(m==='POST'&&reviewMatch){
    let b={};try{b=await request.json()}catch{}
    const out=await reviewEditorialArticle(env.DB,Number(reviewMatch[1]),a.user,b);
    return json(out,out.status||200);
  }

  if(m==='POST'&&p==='/v1/hq/articles'){
    let b={};try{b=await request.clone().json()}catch{}
    const status=String(b.status||'draft').toLowerCase();
    if(['published','scheduled'].includes(status)){
      const approval=await canPublishEditorialArticle(env.DB,b.slug);
      if(!approval.ok)return json({ok:false,error:'editorial_review_required',message:'Approve this article in Knowledge Hub before publishing or scheduling it.'},409);
    }
    return hq.fetch(request,env,ctx);
  }
  return json({ok:false,error:'not_found'},404);
}
