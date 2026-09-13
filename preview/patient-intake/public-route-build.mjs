import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {withPatientStartHere} from '../../patient-start-here-v2.js';
const origin='https://0da69833.projectshift.pages.dev',out=new URL('./public/',import.meta.url);
// The current approved Pages deployment, recorded in REC-034/035. Never an old ZIP.
const pending=['/start-here','/treatment-order'],seen=new Set(),proof=[];
const excluded=/analytics|consent|newsroom-ticker/;
while(pending.length){const path=pending.shift();if(seen.has(path)||excluded.test(path))continue;seen.add(path);assert.ok(seen.size<180,'Unexpectedly large public dependency graph');
 const r=await fetch(origin+path);assert.equal(r.status,200,path);let bytes=Buffer.from(await r.arrayBuffer());const type=r.headers.get('content-type')||'';
 proof.push({path,sha256:createHash('sha256').update(bytes).digest('hex'),bytes:bytes.length});
 const text=/html|javascript|css/.test(type)?bytes.toString('utf8'):'';
 if(text){for(const m of text.matchAll(/(?:src|href)=["'](\/[^"'#?]+)(?:\?[^"']*)?["']|url\(["']?(\/[^"')?#]+)(?:\?[^"')]*)?["']?\)|["'](\/assets\/[^"'?#]+)(?:\?[^"']*)?["']/g)){const target=m[1]||m[2]||m[3];if(/\.(?:js|css|svg|png|jpe?g|webp|woff2?|gif)$/i.test(target))pending.push(target)}}
 let name=path.replace(/^\//,'');if(['/start-here','/treatment-order'].includes(path)){
   if(path==='/treatment-order')assert.ok(text.includes('Based on your answers, this could perhaps work for you'));
   const source=await withPatientStartHere(new Response(text,{headers:{'content-type':'text/html'}}),new Request(origin+path),{MEDICINE_INTAKE_V2_ENABLED:'true'});
   let html=await source.text();
   html=html.replace(/<script\b[^>]*src=["'][^"']*(?:analytics|consent|newsroom-ticker)[^"']*["'][^>]*>\s*<\/script>/g,'');
   html=html.replace('<head>','<head><script src="/public-route-demo.js"></script>');
   html=html.replace(/<body([^>]*)>/,'<body$1><div style="background:#707762;color:#050505;padding:12px;text-align:center;font:700 14px Arial">PREVIEW · Sample stock and simulated payment only. No real patient data.</div>');
   bytes=Buffer.from(html);name+='.html';
 }
 await mkdir(new URL(name.replace(/[^/]+$/,''),out),{recursive:true});await writeFile(new URL(name,out),bytes);
}
await writeFile(new URL('patient-start-here-v2.js',out),await readFile(new URL('../../frontend/member/patient-start-here-v2.js',import.meta.url)));
await writeFile(new URL('public-route-demo.js',out),await readFile(new URL('./public-route-demo.js',import.meta.url)));
await writeFile(new URL('public-source-proof.json',out),JSON.stringify({origin,pagesSource:'c733bf03834d93154a51a0db6ef05dbebb3c7cb3',files:proof},null,2));
console.log(`Preserved approved Pages source; copied ${proof.length} preview dependencies.`);
