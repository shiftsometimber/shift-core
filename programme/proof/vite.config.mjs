import {defineConfig} from 'vite';
import {readFileSync,existsSync,mkdirSync} from 'node:fs';
import {resolve,extname} from 'node:path';
import {createHash,randomBytes} from 'node:crypto';
import {sqliteAdapter} from '../test-support/db.mjs';
import {SCHEMA,ProgrammeStore} from '../store.mjs';
import {programmeRoutes,PRIVATE_HEADERS} from '../routes.mjs';
import {programmeHTML} from '../screen.mjs';
import {authenticateMember} from '../../member-state-fast-v1.js';
import {fixture} from '../test-support/fixtures.mjs';
const root=resolve(import.meta.dirname,'../..');const pagesRoot=process.env.SHIFT_PAGES_ROOT;if(!pagesRoot)throw new Error('Set SHIFT_PAGES_ROOT to the verified e5f8927 Pages source.');mkdirSync(resolve(root,'programme/proof/data'),{recursive:true});
const db=sqliteAdapter(resolve(root,'programme/proof/data/fictional.sqlite'));
db.sqlite.exec(SCHEMA+`CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY,first_name TEXT);CREATE TABLE IF NOT EXISTS user_sessions(id INTEGER PRIMARY KEY, user_id INTEGER, token_hash TEXT UNIQUE, expires_at TEXT, revoked_at TEXT,last_used_at TEXT);`);
const env={DB:db,PROGRAMME_DB:db,PROGRAMME_V1_ENABLED:'true'},store=new ProgrammeStore(db);
const toolbar='<div class="sp-fixture-bar"><span>ISOLATED TEST · Fictional accounts · 13 Sep 2026</span><a href="/__fixtures/dave">Dave</a><a href="/__fixtures/dave-fresh">Dave fresh review</a><a href="/__fixtures/gaz">Gaz</a><a href="/__fixtures/new">New member</a><a href="/__fixtures/constraint">Constraint check</a><a href="/__fixtures/expiry">Simulate expiry</a><a href="/__fixtures/logout">End fixture session</a><a href="/__qa">Responsive checks</a></div>';
const html=programmeHTML.replace('<body class="sp-shell">','<body class="sp-shell">'+toolbar);
const hash=s=>createHash('sha256').update(s).digest('hex');
const send=async(res,response)=>{res.statusCode=response.status;for(const[k,v]of response.headers)res.setHeader(k,v);res.end(Buffer.from(await response.arrayBuffer()))};
const fixturePage='<!doctype html><html lang="en"><meta name="viewport" content="width=device-width"><title>SHIFT isolated test</title><link rel="stylesheet" href="/assets/programme-v1/programme.css"><body class="sp-shell"><main class="sp"><p class="sp-kicker">Fictional data only</p><h1>Programme working proof.</h1><p>Saved test records, real decisions and an isolated database. No connection to production services.</p><div class="sp-actions"><a class="sp-button" href="/__fixtures/dave">Open Dave fixture</a><a class="sp-button" href="/__fixtures/gaz">Open Gaz fixture</a><a class="sp-button" href="/__fixtures/new">Open new-member fixture</a></div></main></body></html>';
export default defineConfig({root,publicDir:false,server:{host:'0.0.0.0',allowedHosts:['terminal.local'],fs:{allow:[root]}},plugins:[{name:'isolated-programme',configureServer(server){server.middlewares.use(async(req,res)=>{
 try{
 const url=new URL(req.url,'http://'+req.headers.host),path=url.pathname;
 if(path.startsWith('/__fixtures/')){
  const key=path.split('/').pop();
  if(key==='logout'){res.setHeader('Set-Cookie','sst_session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0');res.statusCode=303;res.setHeader('Location','/');res.end();return}
  if(key==='expiry'){const request=new Request(url,{headers:req.headers});const auth=await authenticateMember(request,env);if(auth.userId){const s=await store.get(auth.userId);s.entitlement.active=false;await store.save(auth.userId,s.revision,s)}res.statusCode=303;res.setHeader('Location','/member/programme');res.end();return}
  const name={dave:'Dave','dave-fresh':'Dave',gaz:'Gaz',new:'New member',constraint:'Constraint check'}[key];if(!name){res.statusCode=404;res.end();return}
  const id={dave:101,'dave-fresh':104,gaz:102,new:103,constraint:105}[key];db.sqlite.prepare('INSERT OR IGNORE INTO users(id,first_name) VALUES(?,?)').run(id,name);await store.create(id,fixture(name));
  const token=randomBytes(32).toString('hex');db.sqlite.prepare('INSERT INTO user_sessions(user_id,token_hash,expires_at) VALUES(?,?,?)').run(id,hash(token),'2027-01-01T00:00:00Z');
  res.setHeader('Set-Cookie',`sst_session=${token}; Path=/; HttpOnly; SameSite=Strict`);res.setHeader('Cache-Control','no-store');res.statusCode=303;res.setHeader('Location','/member/programme');res.end();return;
 }
 if(path==='/__qa'){const width=[1440,1024,768,390,360].includes(Number(url.searchParams.get('width')))?Number(url.searchParams.get('width')):1440;return send(res,new Response('<!doctype html><html lang="en"><meta name="viewport" content="width=device-width"><title>Programme responsive QA</title><body style="margin:0;background:#25291e;color:#E7E3DA"><nav>'+[1440,1024,768,390,360].map(w=>'<a style="color:#E7E3DA;padding:10px;display:inline-block" href="/__qa?width='+w+'">'+w+' pixels</a>').join('')+'</nav><iframe title="Programme at '+width+' pixels" src="/member/programme" style="display:block;border:0;width:'+width+'px;height:920px"></iframe></body></html>',{headers:{'Content-Type':'text/html','Cache-Control':'no-store'}}))}
 if(path==='/'||path==='/member/dashboard')return send(res,new Response(fixturePage,{headers:{...PRIVATE_HEADERS,'Content-Type':'text/html'}}));
 let body;if(!['GET','HEAD'].includes(req.method)){const chunks=[];let length=0;for await(const c of req){length+=c.length;if(length>21000){res.statusCode=413;res.end();return}chunks.push(c)}body=Buffer.concat(chunks)}
 const request=new Request(url,{method:req.method,headers:req.headers,body,duplex:body?'half':undefined});
 const response=await programmeRoutes(request,env,{authenticate:authenticateMember,html,fixtureMode:true});if(response){if(path==='/member/programme'){const headers=new Headers(response.headers);headers.set('Content-Security-Policy',headers.get('Content-Security-Policy').replace("frame-ancestors 'none'","frame-ancestors 'self'"));return send(res,new Response(response.body,{status:response.status,headers}))}return send(res,response);}
 // Only static shell assets and the new module can be loaded. Existing pages,
 // auth scripts, analytics and API calls are deliberately not served here.
 const allowed=path==='/styles.css'||path==='/assets/member-shell-v6.css'||path==='/assets/shift-recovery-v6.css'||path.startsWith('/assets/programme-v1/')||path.startsWith('/assets/7B503EDB-')||path.startsWith('/assets/fonts/');
 const assetRoot=path.startsWith('/assets/programme-v1/')?resolve(root,'frontend/member'):resolve(pagesRoot);const file=resolve(assetRoot,'.'+path);
 if(allowed&&file.startsWith(assetRoot+'/')&&existsSync(file)){const type={'.css':'text/css','.mjs':'text/javascript','.js':'text/javascript','.png':'image/png','.woff2':'font/woff2'}[extname(file)]||'application/octet-stream';res.setHeader('Content-Type',type);res.setHeader('Cache-Control','no-store');res.end(readFileSync(file));return}
 res.statusCode=404;res.setHeader('Content-Type','text/plain');res.end('Outside this isolated Programme test. The existing route is unchanged.');
 }catch(e){res.statusCode=500;res.end('Isolated test could not complete the request.')}})}}]});
