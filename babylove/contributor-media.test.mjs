import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {blogRoutes,createBlogKey,ensureBlogSchema,API,siteChecks} from './contributor-service.mjs';
import {validMedia} from './contributor-media.mjs';
import {articleHTML} from './dynamic-public.mjs';
function database(){const sqlite=new DatabaseSync(':memory:');return {sqlite,prepare(sql){let args=[];return {bind(...x){args=x;return this},async run(){const r=sqlite.prepare(sql).run(...args);return {meta:{changes:Number(r.changes)}}},async first(){return sqlite.prepare(sql).get(...args)||null},async all(){return {results:sqlite.prepare(sql).all(...args)}}}}};}
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a2ioAAAAASUVORK5CYII=','base64');
async function setup(){const objects=new Map();const env={DB:database(),BLOG_CONTRIBUTOR_ENABLED:'true',BLOG_MEDIA_UPLOAD_ENABLED:'true',BLOG_MEDIA:{async put(k,b,meta){assert.ok(k.startsWith('blog-contributors/'));assert.equal(objects.has(k),false);objects.set(k,{bytes:Uint8Array.from(b),meta});},async get(k,opts){const o=objects.get(k);if(!o)return null;let b=o.bytes;if(opts?.range)b=b.slice(opts.range.offset,opts.range.offset+opts.range.length);return {size:b.length,body:new Blob([b]).stream()};}}};await ensureBlogSchema(env.DB);const key=await createBlogKey(env.DB,'Staging media');return {env,key,objects};}
const upload=(key,body=png,type='image/png',idem='upload_one')=>new Request('https://api.shiftsometimber.co.uk'+API+'/media',{method:'POST',headers:{Authorization:'Bearer '+key.token,'Content-Type':type,'Idempotency-Key':idem},body});
test('scoped upload returns immutable blog URL, serves real bytes and retries without another write',async()=>{
 const {env,key,objects}=await setup();try{
  const r=await blogRoutes(upload(key),env,{});assert.equal(r.status,201);const s=await r.json();assert.equal(s.kind,'image');assert.match(s.url,/\/uploads\/blog\/[a-f0-9-]+\.png$/);
  const pub=await blogRoutes(new Request(s.url),env,{});assert.equal(pub.status,200);assert.equal(pub.headers.get('Content-Type'),'image/png');assert.equal(pub.headers.get('X-Content-Type-Options'),'nosniff');assert.deepEqual(Buffer.from(await pub.arrayBuffer()),png);
  const retry=await blogRoutes(upload(key),env,{});assert.equal(retry.status,200);assert.equal((await retry.json()).duplicate,true);assert.equal(objects.size,1);
  const other=await createBlogKey(env.DB,'Other contributor');const receipt=path=>new Request('https://api.shiftsometimber.co.uk'+API+'/media/'+s.id,{headers:{Authorization:'Bearer '+path.token}});assert.equal((await blogRoutes(receipt(key),env,{})).status,200);assert.equal((await blogRoutes(receipt(other),env,{})).status,404);
  env.DB.sqlite.prepare('UPDATE knowledge_blog_keys SET active=0').run();assert.equal((await blogRoutes(upload(key,png,'image/png','revoked'),env,{})).status,401);
 }finally{env.DB.sqlite.close()}
});
test('uploads fail closed for absent storage, HTML/SVG, false media types, size and quota',async()=>{
 const {env,key,objects}=await setup();try{
  env.BLOG_MEDIA_UPLOAD_ENABLED='false';assert.equal((await blogRoutes(upload(key),env,{})).status,503);env.BLOG_MEDIA_UPLOAD_ENABLED='true';
  assert.equal((await blogRoutes(upload(key,'<svg/>','image/svg+xml'),env,{})).status,415);assert.equal((await blogRoutes(upload(key,'<script>unsafe()</script>'),env,{})).status,422);
  const big=upload(key);big.headers.set('Content-Length','8000001');assert.equal((await blogRoutes(big,env,{})).status,413);assert.equal(objects.size,0);
  await blogRoutes(upload(key),env,{});env.DB.sqlite.prepare('UPDATE knowledge_blog_media SET size_bytes=100000000').run();assert.equal((await blogRoutes(upload(key,png,'image/png','over_quota'),env,{})).status,429);assert.equal(objects.size,1);
 }finally{env.DB.sqlite.close()}
});
test('MP4 validation, range delivery and native video renderer stay within owned blog media',async()=>{
 const box=(t,b)=>{const out=Buffer.alloc(8+b.length);out.writeUInt32BE(out.length);out.write(t,4);b.copy(out,8);return out};
 const mp4=Buffer.concat([box('ftyp',Buffer.from('isom0000')),box('moov',Buffer.alloc(8)),box('mdat',Buffer.alloc(12))]);assert.equal(validMedia(mp4,'video/mp4'),true);assert.equal(validMedia(Buffer.from('ftypisom'),'video/mp4'),false);
 const {env,key}=await setup();try{
  const r=await blogRoutes(upload(key,mp4,'video/mp4','video'),env,{});assert.equal(r.status,201);const s=await r.json();const part=await blogRoutes(new Request(s.url,{headers:{Range:'bytes=0-15'}}),env,{});assert.equal(part.status,206);assert.equal((await part.arrayBuffer()).byteLength,16);assert.equal(part.headers.get('Content-Range'),'bytes 0-15/'+mp4.length);
  const html=articleHTML({title:'Staging article',slug:'test',body:'Original copy',author:"Matt O'Brien",publish_at:'2026-10-20T10:00:00Z',contributor:true,blogMetadata:{heroImage:{url:'https://shiftsometimber.co.uk/assets/image.png',alt:'Image'},keywords:[],sources:[],video:{url:s.url,poster:'https://shiftsometimber.co.uk/assets/image.png',caption:'Illustrative video',transcript:'An accurate transcript.'}}});assert.ok(html.includes('<video controls playsinline preload="metadata"'));assert.ok(html.includes(s.url));assert.ok(html.includes('Video transcript'));assert.equal(html.includes('autoplay'),false);
 }finally{env.DB.sqlite.close()}
});
