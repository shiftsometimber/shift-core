// Read-only HTTP timings, not LCP/INP/CLS. Keep network phases separate from TTFB.
import {execFileSync} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
const paths=['/','/articles/mounjaro-cost-uk','/articles/alcohol-and-weight-men','/shift-newsroom','/medicine-news/bolt-pharmacy-ads-banned-asa'];
const rounds=Number(process.env.LATENCY_ROUNDS||6),samples=[];
for(let round=0;round<rounds;round++)for(const path of paths){
 try{
  const raw=execFileSync('curl',['--silent','--show-error','--max-time','20','--output','/dev/null','--write-out','%{json}','https://shiftsometimber.co.uk'+path],{encoding:'utf8'});
  const r=JSON.parse(raw);
  samples.push({path,round,status:r.http_code,dns_ms:r.time_namelookup*1000,connect_ms:r.time_connect*1000,tls_ms:r.time_appconnect*1000,ttfb_ms:r.time_starttransfer*1000,total_ms:r.time_total*1000,after_connect_ms:(r.time_starttransfer-Math.max(r.time_appconnect,r.time_connect))*1000,bytes:r.size_download});
 }catch{samples.push({path,round,error:'request_failed_or_timeout'})}
}
const percentile=(values,p)=>{const a=values.slice().sort((a,b)=>a-b);return a.length?Math.round(a[Math.ceil(a.length*p)-1]):null};
const routes=paths.map(path=>{const rows=samples.filter(s=>s.path===path&&s.status===200);return {path,successes:rows.length,total:rounds,median_ttfb_ms:percentile(rows.map(r=>r.ttfb_ms),.5),p95_ttfb_ms:percentile(rows.map(r=>r.ttfb_ms),.95),p95_total_ms:percentile(rows.map(r=>r.total_ms),.95)}});
const report={checked_at:new Date().toISOString(),source_sha:process.env.GITHUB_SHA||null,location:'runner network; not representative-user field data',method:'sequential fresh curl connections, six rounds per route by default; p95 on small samples is a diagnostic, not CWV',routes,samples};
mkdirSync('article-quality-proof',{recursive:true});writeFileSync('article-quality-proof/latency.json',JSON.stringify(report,null,2));
console.log(JSON.stringify(routes,null,2));
if(samples.some(s=>s.error||s.status!==200))process.exitCode=1;
