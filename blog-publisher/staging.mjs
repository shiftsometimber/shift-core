// Protected acceptance routes on the existing article-quality preview Worker.
// Dedicated synthetic-content D1; never production/member data or notifications.
import {blogRoutes,createBlogKey,ensureBlogSchema,runBlogQueue,API,ADMIN} from '../babylove/contributor-service.mjs';
import {handleRequest} from './worker.mjs';
import {sha256,BLOG_ORIGIN} from '../babylove/contributor-policy.mjs';
const privateHeaders={'Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow','Referrer-Policy':'no-referrer'};
const json=(v,status=200)=>new Response(JSON.stringify(v),{status,headers:{...privateHeaders,'Content-Type':'application/json'}});
const protectedPath=p=>p.startsWith(API)||p.startsWith(ADMIN)||p.startsWith('/__blog-stage/')||p.startsWith('/uploads/blog/')||p.startsWith('/articles/blog-stage-')||['/explore-knowledge','/sitemap.xml'].includes(p);
async function equal(a,b){return typeof a==='string'&&typeof b==='string'&&a.length>32&&await sha256(a)===await sha256(b);}
export default {async fetch(request,env,ctx){
 const u=new URL(request.url),path=u.pathname;
 if(env.BLOG_STAGING_MODE!=='isolated-acceptance'||!await equal(request.headers.get('X-Blog-Staging-Access'),env.BLOG_STAGING_ACCESS))return json({error:'private_staging_access_required'},401);
 if(!protectedPath(path))return json({error:'outside_blog_acceptance'},404);
 try{
  const fetcher=async(raw,options={})=>{
   const target=new URL(String(raw));
   if(target.origin===BLOG_ORIGIN&&protectedPath(target.pathname)){
    const h=new Headers(options.headers);h.set('X-Blog-Staging-Access',env.BLOG_STAGING_ACCESS);
    return fetch(u.origin+target.pathname+target.search,{...options,headers:h});
   }
   return fetch(raw,options);
  };
  if(path==='/__blog-stage/setup'&&request.method==='POST'){
   await env.DB.prepare('CREATE TABLE IF NOT EXISTS knowledge_articles(id INTEGER PRIMARY KEY,title TEXT,slug TEXT UNIQUE,category TEXT,author TEXT,status TEXT,summary TEXT,body TEXT,seo_title TEXT,publish_at TEXT,updated_at TEXT)').run();
   await ensureBlogSchema(env.DB);
   return json(await createBlogKey(env.DB,'Isolated hosted acceptance only'),201);
  }
  if(path==='/__blog-stage/queue'&&request.method==='POST'){
   const b=await request.json();const now=Date.parse(b.testClock);
   if(!Number.isFinite(now)||now<Date.parse('2026-10-21')||now>Date.parse('2026-11-01'))return json({error:'bounded_test_clock_required'},400);
   return json({kind:'hosted_acceptance_with_controlled_clock',unattendedScheduleVerified:false,result:await runBlogQueue(env,{now,fetcher})});
  }
  const ownerResolver=async r=>{
   // Explicit staging fixture authority is separate from a genuine HQ session.
   if(r.headers.get('X-Blog-Staging-Fixture-Owner')==='true')return {id:'staging-fixture-owner',role:'owner',synthetic:true};
   if(!r.headers.get('Cookie'))return null;
   const real=await fetch('https://api.shiftsometimber.co.uk/v1/hq/me',{headers:{Cookie:r.headers.get('Cookie')},redirect:'manual'});
   if(!real.ok)return null;const x=await real.json();return x.user?.role==='owner'?x.user:null;
  };
  const clock=request.headers.get('X-Blog-Staging-Clock');const now=clock?Date.parse(clock):Date.now();
  if(!Number.isFinite(now)||now<Date.parse('2026-10-21')||now>Date.parse('2026-11-01'))return json({error:'bounded_test_clock_required'},400);
  const canonical=new Request(BLOG_ORIGIN+path+u.search,request);
  let response=await handleRequest(canonical,env,ctx,{fetcher,ownerResolver,now,staging:true});
  const headers=new Headers(response.headers);for(const [k,v]of Object.entries(privateHeaders))headers.set(k,v);
  return new Response(response.body,{status:response.status,headers});
 }catch(e){return json({error:String(e.message).slice(0,200)},503);}
}};
