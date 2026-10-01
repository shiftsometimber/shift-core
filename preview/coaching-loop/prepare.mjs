// Local-only server for the same Worker routes; no production binding or deployment.
import {createServer} from 'node:http';import {readFileSync,mkdirSync} from 'node:fs';import {resolve} from 'node:path';import {randomBytes} from 'node:crypto';import {SQLiteTestDB} from './fixtures.mjs';import {routes,json} from './routes.mjs';
const directory=process.env.COACHING_TEST_EVIDENCE_DIR||'/tmp/shift-coaching-test';mkdirSync(directory,{recursive:true});
const DB=new SQLiteTestDB(resolve(directory,'synthetic.sqlite'));
const env={COACHING_TEST_MODE:'synthetic',COACHING_TEST_LOCAL:'true',COACHING_TEST_DB:DB,COACHING_TEST_SESSION_SECRET:randomBytes(32).toString('hex')};
const files={'/':'index.html','/member/coaching-test/today':'index.html','/member/coaching-test/memory':'index.html','/member/coaching-test/permissions':'index.html','/member/coaching-test/audit':'index.html','/member/coaching-test/weekly-review':'index.html','/member/coaching-test/records':'index.html','/client.mjs':'client.mjs','/style.css':'style.css'};
const server=createServer(async(req,res)=>{try{
 const url=new URL(req.url,'http://127.0.0.1:'+server.address().port);
 const headers=new Headers();for(const[k,v]of Object.entries(req.headers))if(v)headers.set(k,Array.isArray(v)?v.join(','):v);
 const request=new Request(url,{method:req.method,headers,...(req.method!=='GET'&&req.method!=='HEAD'?{body:req,duplex:'half'}:{})});
 let response=await routes(request,env);
 if(!response&&req.method==='GET'&&files[url.pathname])response=new Response(readFileSync(new URL('./'+files[url.pathname],import.meta.url)),{headers:{'Content-Type':url.pathname.endsWith('.css')?'text/css':url.pathname.endsWith('.mjs')?'text/javascript':'text/html','Cache-Control':'no-store','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'"}});
 response=response||json({error:'route_not_found'},404);res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));
 }catch{res.writeHead(500);res.end('Local test request failed');}});
server.listen(Number(process.env.COACHING_TEST_PORT||8789),'127.0.0.1',()=>console.log(JSON.stringify({localTestUrl:'http://127.0.0.1:'+server.address().port,syntheticDatabase:resolve(directory,'synthetic.sqlite'),externalDelivery:false})));
for(const signal of ['SIGTERM','SIGINT'])process.on(signal,()=>server.close(()=>{DB.close();process.exit(0);}));
