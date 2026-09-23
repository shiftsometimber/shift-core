const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{spawnSync}=require('node:child_process');
const origin='https://shiftsometimber.co.uk',out='seo-followthrough-proof';
fs.mkdirSync(out+'/responses',{recursive:true});fs.mkdirSync(out+'/lighthouse',{recursive:true});
const routes={home:'/',reta:'/guides/retatrutide-uk-guide',health:'/shift-health',cost:'/articles/mounjaro-cost-uk'};
const inspect=[...Object.values(routes),'/start-here','/clinic-gone-quiet','/provider-switch','/husband-help','/life-back','/articles/food-noise-after-stopping-glp1','/guides/nhs-weight-loss-medication-pathways','/comparisons/medications/mounjaro-vs-saxenda','/comparisons/medications/mounjaro-vs-orlistat','/mental-health/mental-health-and-weight','/authors/matt-obrien','/mental-health/helping-someone-online','/sitemap.xml','/robots.txt'];
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const failures=[],responses=[];
async function capture(route){const r=await fetch(origin+route,{headers:{'User-Agent':'SHIFT-owner-read-only-SEO-audit/1.0'},signal:AbortSignal.timeout(30000)});const body=Buffer.from(await r.arrayBuffer());const file=route==='/'?'home.html':route.slice(1).replaceAll('/','_')+(route.includes('.')?'':'.html');fs.writeFileSync(out+'/responses/'+file,body);const row={route,url:r.url,status:r.status,headers:Object.fromEntries(r.headers),file,sha256:sha(body),bytes:body.length};responses.push(row);if(r.status!==200)failures.push({route,status:r.status});return body;}
(async()=>{
 const before=JSON.parse(await capture('/DEPLOYMENT-FINGERPRINT.json'));
 for(const route of inspect)await capture(route);
 const tools=process.env.SEO_TOOLS,{chromium}=require(tools+'/node_modules/playwright');
 for(let repeat=1;repeat<=3;repeat++)for(const [key,route] of Object.entries(routes)){
  const file=path.join(out,'lighthouse',`${key}-${repeat}.json`);
  const run=spawnSync(process.execPath,[tools+'/node_modules/lighthouse/cli/index.js',origin+route,'--only-categories=performance,accessibility','--output=json','--output-path='+file,'--chrome-flags=--headless --no-sandbox','--quiet','--blocked-url-patterns=*google-analytics.com*,*analytics.google.com*,*googletagmanager.com*,*doubleclick.net*,*googleadservices.com*,*/v1/acquisition/*'],{env:{...process.env,CHROME_PATH:chromium.executablePath()},encoding:'utf8',timeout:90000});
  if(run.status!==0){failures.push({key,repeat,error:String(run.stderr||run.error)});continue;}
  const d=JSON.parse(fs.readFileSync(file));if(d.runtimeError)failures.push({key,repeat,error:d.runtimeError});console.log(key,repeat,d.categories?.performance?.score,d.audits?.['largest-contentful-paint']?.displayValue);
 }
 const after=await(await fetch(origin+'/DEPLOYMENT-FINGERPRINT.json')).json();if(after.aggregate_sha256!==before.aggregate_sha256)failures.push({error:'Pages source changed during measurement'});
 const median=a=>a.sort((a,b)=>a-b)[Math.floor(a.length/2)],pages=[];
 for(const [key,route] of Object.entries(routes)){
  const runs=[];for(let repeat=1;repeat<=3;repeat++){const file=`${key}-${repeat}.json`;if(!fs.existsSync(out+'/lighthouse/'+file))continue;const d=JSON.parse(fs.readFileSync(out+'/lighthouse/'+file));if(d.runtimeError)continue;const a=d.audits;runs.push({file,performance:d.categories.performance.score*100,lcpMs:a['largest-contentful-paint'].numericValue,cls:a['cumulative-layout-shift'].numericValue,tbtMs:a['total-blocking-time'].numericValue,lcpElement:a['largest-contentful-paint-element']?.details});}
  pages.push({route,runs,median:runs.length===3?Object.fromEntries(['performance','lcpMs','cls','tbtMs'].map(k=>[k,median(runs.map(r=>r[k]))])):null});
 }
 fs.writeFileSync(out+'/report.json',JSON.stringify({checkedAt:new Date().toISOString(),scope:'Read-only public responses and three mobile Lighthouse laboratory runs per live page. No deployment, account/customer access, analytics delivery or field-CWV claim. Production and preview are different hosts; do not compare them as a controlled A/B.',sourceCommit:process.env.GITHUB_SHA,pagesFingerprintBefore:before.aggregate_sha256,pagesFingerprintAfter:after.aggregate_sha256,responses,pages,failures},null,2));
 const walk=p=>fs.readdirSync(p,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(p,e.name)):[path.join(p,e.name)]);fs.writeFileSync(out+'/SHA256SUMS',walk(out).sort().map(f=>sha(fs.readFileSync(f))+'  '+path.relative(out,f)+'\n').join(''));
 console.log(JSON.stringify({pages:pages.map(x=>({route:x.route,median:x.median})),failures},null,2));if(failures.length)process.exitCode=1;
})().catch(e=>{fs.writeFileSync(out+'/fatal.txt',String(e.stack||e));console.error(e);process.exitCode=1});
