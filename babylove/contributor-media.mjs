// Blog-only immutable media. Requires an explicitly connected existing R2 bucket.
import {BLOG_ORIGIN} from './contributor-policy.mjs';
const TYPES={'image/png':['png',8000000],'image/jpeg':['jpg',8000000],'image/webp':['webp',8000000],'image/gif':['gif',8000000],'video/mp4':['mp4',20000000],'video/webm':['webm',20000000]};
const json=(v,status=200)=>new Response(JSON.stringify(v),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const hex=bytes=>Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
const view=r=>({id:r.id,url:BLOG_ORIGIN+'/uploads/blog/'+r.id+'.'+r.extension,kind:r.mime_type.startsWith('video/')?'video':'image',mimeType:r.mime_type,sizeBytes:r.size_bytes,state:r.state});
export async function ensureMediaSchema(DB){await DB.prepare('CREATE TABLE IF NOT EXISTS knowledge_blog_media(id TEXT PRIMARY KEY,key_id TEXT NOT NULL,idempotency_key TEXT NOT NULL,content_hash TEXT NOT NULL,object_key TEXT NOT NULL UNIQUE,extension TEXT NOT NULL,mime_type TEXT NOT NULL,size_bytes INTEGER NOT NULL,state TEXT NOT NULL,created_at TEXT NOT NULL,UNIQUE(key_id,idempotency_key))').run();}
export async function blogMediaReceipt(env,identity,id,{owner=false}={}){await ensureMediaSchema(env.DB);const row=await env.DB.prepare('SELECT * FROM knowledge_blog_media WHERE id=? AND key_id=?').bind(id,owner?'owner:'+identity.id:identity.id).first();return row?json(view(row)):json({error:'not_found'},404);}
export function validMedia(bytes,type){
 const b=bytes,ascii=(a,z)=>String.fromCharCode(...b.slice(a,z));
 if(type==='image/png')return b.length>=24&&hex(b.slice(0,8))==='89504e470d0a1a0a'&&ascii(12,16)==='IHDR';
 if(type==='image/jpeg')return b.length>=12&&b[0]===255&&b[1]===216&&b[2]===255&&b.at(-2)===255&&b.at(-1)===217;
 if(type==='image/gif')return b.length>=14&&['GIF87a','GIF89a'].includes(ascii(0,6))&&b.at(-1)===59;
 if(type==='image/webp')return b.length>=20&&ascii(0,4)==='RIFF'&&ascii(8,12)==='WEBP';
 if(type==='video/webm')return b.length>=16&&hex(b.slice(0,4))==='1a45dfa3'&&ascii(4,Math.min(b.length,4096)).includes('webm');
 if(type==='video/mp4'){
  let at=0,ftyp=false,moov=false,mdat=false;const d=new DataView(b.buffer,b.byteOffset,b.byteLength);
  while(at+8<=b.length){const n=d.getUint32(at),t=ascii(at+4,at+8);if(n<8||at+n>b.length)return false;if(t==='ftyp')ftyp=n>=16&&['isom','iso2','iso6','mp41','mp42','avc1','M4V '].includes(ascii(at+8,at+12));if(t==='moov')moov=true;if(t==='mdat')mdat=true;at+=n;}
  return at===b.length&&ftyp&&moov&&mdat;
 }
 return false;
}
export async function uploadBlogMedia(request,env,identity,{now=Date.now(),owner=false}={}){
 if(env.BLOG_MEDIA_UPLOAD_ENABLED!=='true'||!env.BLOG_MEDIA?.put||!env.BLOG_MEDIA?.get)return json({error:'blog_media_storage_not_connected'},503);
 const type=(request.headers.get('Content-Type')||'').toLowerCase(),format=TYPES[type];if(!format)return json({error:'supported_image_or_video_required'},415);
 const idem=request.headers.get('Idempotency-Key');if(!/^[a-zA-Z0-9_-]{1,128}$/.test(idem||''))return json({error:'idempotency_key_required'},400);
 const declared=Number(request.headers.get('Content-Length'));if(declared>format[1])return json({error:'media_too_large'},413);
 const reader=request.body?.getReader();if(!reader)return json({error:'media_bytes_required'},400);
 const chunks=[];let n=0;while(true){const r=await reader.read();if(r.done)break;n+=r.value.length;if(n>format[1]){await reader.cancel();return json({error:'media_too_large'},413)}chunks.push(r.value);}
 const bytes=new Uint8Array(n);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length;}
 if(!validMedia(bytes,type))return json({error:'media_signature_or_container_invalid'},422);
 const hash=hex(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))),keyId=owner?'owner:'+identity.id:identity.id,DB=env.DB;
 await ensureMediaSchema(DB);
 const old=await DB.prepare('SELECT * FROM knowledge_blog_media WHERE key_id=? AND idempotency_key=?').bind(keyId,idem).first();
 if(old)return old.content_hash===hash&&old.mime_type===type?json({...view(old),duplicate:true},old.state==='uploaded'?200:409):json({error:'idempotency_content_conflict'},409);
 const id=crypto.randomUUID(),objectKey='blog-contributors/'+id+'.'+format[0],since=new Date(now-86400000).toISOString();
 const auth=owner?'1=1':'EXISTS(SELECT 1 FROM knowledge_blog_keys WHERE id=? AND active=1)';
 const reservation=await DB.prepare(`INSERT INTO knowledge_blog_media(id,key_id,idempotency_key,content_hash,object_key,extension,mime_type,size_bytes,state,created_at) SELECT ?,?,?,?,?,?,?,?,'uploading',? WHERE ${auth} AND (SELECT count(*) FROM knowledge_blog_media WHERE key_id=? AND created_at>?)<20 AND COALESCE((SELECT sum(size_bytes) FROM knowledge_blog_media WHERE key_id=? AND created_at>?),0)+?<=100000000`).bind(id,keyId,idem,hash,objectKey,format[0],type,n,new Date(now).toISOString(),...(owner?[]:[keyId]),keyId,since,keyId,since,n).run();
 if(!reservation.meta?.changes)return json({error:'media_quota_or_access_hold'},429);
 try{
  await env.BLOG_MEDIA.put(objectKey,bytes,{httpMetadata:{contentType:type},customMetadata:{sha256:hash,blogMediaId:id}});
  const stored=await env.BLOG_MEDIA.get(objectKey);if(!stored||stored.size!==n)throw Error('stored_size_mismatch');await stored.body?.cancel?.();
  const active=owner||!!(await DB.prepare('SELECT active FROM knowledge_blog_keys WHERE id=? AND active=1').bind(keyId).first());
  await DB.prepare('UPDATE knowledge_blog_media SET state=? WHERE id=? AND state=\'uploading\'').bind(active?'uploaded':'held_key_revoked',id).run();
  return json(view(await DB.prepare('SELECT * FROM knowledge_blog_media WHERE id=?').bind(id).first()),active?201:409);
 }catch{await DB.prepare("UPDATE knowledge_blog_media SET state='upload_uncertain' WHERE id=?").bind(id).run();return json({id,error:'media_upload_uncertain_check_receipt'},503);}
}
export async function publicBlogMedia(request,env){
 const u=new URL(request.url),m=u.pathname.match(/^\/uploads\/blog\/([a-f0-9-]{36})\.(png|jpg|webp|gif|mp4|webm)$/);
 if(!m)return null;
 if(!['GET','HEAD'].includes(request.method))return json({error:'method_not_allowed'},405);
 if(env.BLOG_CONTRIBUTOR_ENABLED!=='true'||!env.DB||!env.BLOG_MEDIA?.get)return new Response('Not found',{status:404});
 try{
  await ensureMediaSchema(env.DB);const row=await env.DB.prepare("SELECT * FROM knowledge_blog_media WHERE id=? AND extension=? AND state='uploaded'").bind(m[1],m[2]).first();if(!row)return new Response('Not found',{status:404});
  let range=null;const raw=request.headers.get('Range');
  if(raw){const r=/^bytes=(\d+)-(\d*)$/.exec(raw);if(!r)return new Response(null,{status:416,headers:{'Content-Range':'bytes */'+row.size_bytes}});const start=Number(r[1]),end=r[2]?Number(r[2]):row.size_bytes-1;if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start>end||end>=row.size_bytes)return new Response(null,{status:416,headers:{'Content-Range':'bytes */'+row.size_bytes}});range={offset:start,length:end-start+1};}
  const stored=await env.BLOG_MEDIA.get(row.object_key,range?{range}:undefined);if(!stored)return new Response('Not found',{status:404});
  const headers={'Content-Type':row.mime_type,'Content-Length':String(range?.length||row.size_bytes),'Cache-Control':'public, max-age=31536000, immutable','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex','Content-Security-Policy':"default-src 'none'; sandbox",'Accept-Ranges':'bytes','Content-Disposition':'inline; filename="blog-'+row.id+'.'+row.extension+'"'};
  if(range)headers['Content-Range']='bytes '+range.offset+'-'+(range.offset+range.length-1)+'/'+row.size_bytes;
  if(request.method==='HEAD')await stored.body?.cancel?.();
  return new Response(request.method==='HEAD'?null:stored.body,{status:range?206:200,headers});
 }catch{return new Response('Media unavailable',{status:503});}
}
