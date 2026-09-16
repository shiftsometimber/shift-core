// Read-only local preview of the exact Health renderer and retained live shell.
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {renderShiftHealthDocument,healthSlugs} from '../shift-health-public.mjs';
const origin='https://shiftsometimber.co.uk';
const shell=await (await fetch(origin+'/programme')).text();
createServer(async(req,res)=>{
  try{
    if(req.method!=='GET'){res.writeHead(405);res.end();return}
    const url=new URL(req.url,'http://127.0.0.1:8789');
    const slug=url.pathname==='/shift-health'?'':url.pathname.split('/')[2];
    if(url.pathname==='/shift-health'||healthSlugs.includes(slug)){
      res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(renderShiftHealthDocument(shell,slug));return;
    }
    if(url.pathname.startsWith('/assets/shift-health/')){
      res.writeHead(200,{'Content-Type':'image/webp'});res.end(await readFile(new URL('../frontend/member'+url.pathname,import.meta.url)));return;
    }
    const r=await fetch(origin+url.pathname+url.search);res.writeHead(r.status,{'Content-Type':r.headers.get('content-type')||'text/plain'});res.end(Buffer.from(await r.arrayBuffer()));
  }catch(e){res.writeHead(502);res.end('Preview unavailable: '+e.message)}
}).listen(8789,'0.0.0.0',()=>console.log('Read-only preview: http://127.0.0.1:8789/shift-health'));
