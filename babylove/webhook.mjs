// https://www.babylovegrowth.ai/docs/integrations/webhook
// Draft intake only: no publication, arbitrary URL fetches or article overwrites.
export const PATH='/v1/integrations/babylovegrowth';
const LIMIT=400000;
const reply=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const digest=async value=>new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)));
async function matches(a,b){const x=await digest(a),y=await digest(b);let diff=0;for(let i=0;i<x.length;i++)diff|=x[i]^y[i];return diff===0;}
async function matchesHash(token,hash){const actual=await digest(token);let diff=0;for(let i=0;i<actual.length;i++)diff|=actual[i]^parseInt(hash.slice(i*2,i*2+2),16);return diff===0;}
function field(value,max,required=false){if(value==null&&!required)return '';if(typeof value!=='string'||value.length>max||(required&&!value.trim()))throw new Error('invalid_payload');return value.trim();}
export function validate(payload){
  if(!payload||Array.isArray(payload)||typeof payload!=='object')throw new Error('invalid_payload');
  const id=payload.id;
  if(!(typeof id==='string'&&/^[a-zA-Z0-9_-]{1,100}$/.test(id))&&!(Number.isSafeInteger(id)&&id>0))throw new Error('invalid_id');
  const slug=field(payload.slug,220,true);
  if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))throw new Error('invalid_slug');
  const title=field(payload.title,300,true),summary=field(payload.metaDescription,3000),body=field(payload.content_markdown,100000,true);
  field(payload.content_html,200000);
  const vendorStatus=String(payload.status||'published').toLowerCase();
  if(!['published','draft'].includes(vendorStatus))throw new Error('invalid_status');
  return {id:String(id),slug,title,summary,body,publish:vendorStatus==='published'};
}
async function readPayload(request){
  const reader=request.body?.getReader();if(!reader)throw new Error('invalid_payload');
  const chunks=[];let length=0;
  while(true){const {value,done}=await reader.read();if(done)break;length+=value.byteLength;if(length>LIMIT){await reader.cancel();throw new Error('payload_too_large');}chunks.push(value);}
  const bytes=new Uint8Array(length);let offset=0;for(const part of chunks){bytes.set(part,offset);offset+=part.byteLength;}
  try{return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));}catch{throw new Error('invalid_json');}
}
async function notifyArrival(env,article){
 const to=env.RADAR_PUBLICATION_EMAIL_TO;
 if(!env.EMAIL?.send||!to)return;
 await env.DB.prepare("CREATE TABLE IF NOT EXISTS babylove_arrival_email(source_id TEXT PRIMARY KEY,status TEXT NOT NULL,recipient TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,sent_at TEXT,provider_message_id TEXT,last_error TEXT)").run();
 const claim=await env.DB.prepare("INSERT OR IGNORE INTO babylove_arrival_email(source_id,status,recipient) VALUES(?,'sending',?)").bind(article.id,to).run();
 if(!claim.meta?.changes)return;
 const link=article.publish?'https://shiftsometimber.co.uk/articles/'+article.slug:null;
 const subject='LoveGrowth post received: '+article.title;
 const text=['Hi Matt','','A new LoveGrowth post has arrived in SHIFT.','',article.title,'Status: '+(article.publish?'Published':'Draft'),link||'', '', 'Source ID: '+article.id].filter(Boolean).join('\n');
 try{
  const result=await env.EMAIL.send({from:{email:env.ADMIN_EMAIL_FROM||'hq@shiftsometimber.co.uk',name:'SHIFT'},to,subject,text});
  await env.DB.prepare("UPDATE babylove_arrival_email SET status='sent',sent_at=CURRENT_TIMESTAMP,provider_message_id=? WHERE source_id=? AND status='sending'").bind(result?.messageId||null,article.id).run();
 }catch(error){
  await env.DB.prepare("UPDATE babylove_arrival_email SET status='delivery_unknown',last_error=? WHERE source_id=? AND status='sending'").bind(String(error?.message||error).slice(0,200),article.id).run().catch(()=>{});
 }
}

export async function babyLoveRoutes(request,env){
  if(new URL(request.url).pathname.replace(/\/+$/,'')!==PATH)return null;
  if(request.method!=='POST')return reply({success:false,error:'method_not_allowed'},405);
  const secret=env.BABYLOVE_WEBHOOK_TOKEN;
  // The deployment can retain only a SHA-256 verifier for a random 256-bit token.
  // The bearer token itself remains private and is never committed to source.
  const verifier=env.BABYLOVE_WEBHOOK_TOKEN_SHA256;
  const hasVerifier=typeof verifier==='string'&&/^[a-f0-9]{64}$/.test(verifier);
  if((verifier!=null&&!hasVerifier)||(!hasVerifier&&(typeof secret!=='string'||secret.length<32))||!env.DB)return reply({success:false,error:'integration_not_configured'},503);
  const authorization=request.headers.get('Authorization');
  const token=authorization!==null?(/^Bearer (\S+)$/.exec(authorization)?.[1]||''):(request.headers.get('X-API-Key')||'');
  if(!token||token.length>4096||!(hasVerifier?await matchesHash(token,verifier):await matches(token,secret)))return reply({success:false,error:'unauthorized'},401);
  if(request.headers.get('Content-Type')?.split(';')[0].trim().toLowerCase()!=='application/json')return reply({success:false,error:'json_required'},415);
  if(Number(request.headers.get('Content-Length'))>LIMIT)return reply({success:false,error:'payload_too_large'},413);
  let payload,article;
  try{payload=await readPayload(request);article=validate(payload);}catch(error){return reply({success:false,error:error.message},error.message==='payload_too_large'?413:400);}
  const raw=JSON.stringify(payload),hash=Array.from(await digest(raw),x=>x.toString(16).padStart(2,'0')).join('');
  try{
    await env.DB.prepare(`CREATE TABLE IF NOT EXISTS babylove_receipts(source_id TEXT PRIMARY KEY,slug TEXT NOT NULL UNIQUE,payload_hash TEXT NOT NULL,payload_json TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`).run();
    const existing=await env.DB.prepare('SELECT source_id,slug,payload_hash,payload_json FROM babylove_receipts WHERE source_id=? OR slug=?').bind(article.id,article.slug).first();
    if(existing){
      if(existing.source_id===article.id&&existing.slug===article.slug&&(existing.payload_hash===hash||sameArticleDelivery(JSON.parse(existing.payload_json),payload))){
        const saved=await env.DB.prepare('SELECT status FROM knowledge_articles WHERE slug=?').bind(article.slug).first().catch(()=>null);
        return reply({success:true,status:'received',duplicate:true,published:saved?.status==='published',link:saved?.status==='published'?'/articles/'+article.slug:undefined});
      }
      return reply({success:false,error:'article_conflict_requires_review'},409);
    }
    // D1 batches are atomic: collision rolls back the receipt as well.
    // Raw HTML, hero image and schema are retained in the receipt, not rendered.
    await env.DB.batch([
      env.DB.prepare('INSERT INTO babylove_receipts(source_id,slug,payload_hash,payload_json) VALUES(?,?,?,?)').bind(article.id,article.slug,hash,raw),
      env.DB.prepare(`INSERT INTO knowledge_articles(title,slug,category,author,status,summary,body,seo_title,publish_at) VALUES(?,?,'Knowledge','SHIFT Team',?,?,?,?,?)`).bind(article.title,article.slug,article.publish?'published':'draft',article.summary,article.body,article.title,article.publish?new Date().toISOString():null)
    ]);
    await notifyArrival(env,article);
    return reply({success:true,status:article.publish?'published':'draft',published:article.publish,link:article.publish?'/articles/'+article.slug:undefined});
  }catch{
    try{
      const receipt=await env.DB.prepare('SELECT source_id,slug,payload_hash FROM babylove_receipts WHERE source_id=? OR slug=?').bind(article.id,article.slug).first();
      if(receipt?.source_id===article.id&&receipt.slug===article.slug&&receipt.payload_hash===hash)return reply({success:true,status:'received',duplicate:true,published:false});
      const collision=await env.DB.prepare('SELECT id FROM knowledge_articles WHERE slug=?').bind(article.slug).first();
      if(receipt||collision)return reply({success:false,error:'article_conflict_requires_review'},409);
    }catch{}
    return reply({success:false,error:'storage_unavailable'},503);
  }
}

// Compare content, not JSON property order or delivery bookkeeping. HTML and images
// are deliberately included: a changed article still requires editorial review.
export function sameArticleDelivery(a,b){
 const fields=['id','slug','title','metaDescription','content_markdown','content_html','heroImageUrl','heroImageAlt','featureImageEnabled','status'];
 return fields.every(key=>String(a[key]??'')===String(b[key]??''));
}
