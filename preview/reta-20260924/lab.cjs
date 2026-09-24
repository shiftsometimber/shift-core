const fs=require('fs'),path=require('path'),{spawnSync}=require('node:child_process');
const assert=require('node:assert/strict');
const base=process.env.LAB_BASE||'https://shift-reta-repair-preview.matobrien.workers.dev';
const tools=process.env.SEO_TOOLS;const chromium=require(tools+'/node_modules/playwright').chromium;
const routes={reta:'/guides/retatrutide-uk-guide'};
const out='reta-proof/lighthouse';fs.mkdirSync(out,{recursive:true});
const failures=[];
for(let repeat=1;repeat<=3;repeat++)for(const [key,route] of Object.entries(routes))for(const mode of (repeat%2?['baseline','candidate']:['candidate','baseline'])){
 const file=path.join(out,`${key}-${mode}-${repeat}.json`),url=base+route+(mode==='baseline'?'?__seo_baseline=1':'');
 assert.equal(new URL(url).pathname,route,'Route-aware scripts require the same pathname in both modes');
 const run=spawnSync(process.execPath,[tools+'/node_modules/lighthouse/cli/index.js',url,'--only-categories=performance,accessibility','--output=json','--output-path='+file,'--chrome-flags=--headless --no-sandbox','--quiet','--blocked-url-patterns=*google-analytics.com*,*analytics.google.com*,*doubleclick.net*,*googleadservices.com*,*/v1/acquisition/*'],{env:{...process.env,CHROME_PATH:chromium.executablePath()},encoding:'utf8',timeout:90000});
 if(run.status!==0){failures.push({file,status:run.status,error:String(run.stderr||run.error||'Lab failed')});continue;}
 const d=JSON.parse(fs.readFileSync(file));if(d.runtimeError)failures.push({file,error:d.runtimeError});
 console.log(key,mode,repeat,d.categories?.performance?.score,d.audits?.['largest-contentful-paint']?.displayValue);
}
const median=a=>a.sort((x,y)=>x-y)[Math.floor(a.length/2)];const groups=[];
for(const [key,route] of Object.entries(routes)){
 const group={page:key,path:route};
 for(const mode of ['baseline','candidate']){
  const runs=[];
  for(let repeat=1;repeat<=3;repeat++){
   const file=`${key}-${mode}-${repeat}.json`;if(!fs.existsSync(path.join(out,file)))continue;
   const d=JSON.parse(fs.readFileSync(path.join(out,file)));if(d.runtimeError)continue;const a=d.audits;
   runs.push({file,performance:d.categories.performance.score*100,accessibility:d.categories.accessibility.score*100,lcpMs:a['largest-contentful-paint'].numericValue,cls:a['cumulative-layout-shift'].numericValue,tbtMs:a['total-blocking-time'].numericValue,bytes:a['total-byte-weight'].numericValue,contrastScore:a['color-contrast'].score,contrastFailures:a['color-contrast'].details?.items||[]});
  }
  group[mode]={runs,median:runs.length===3?Object.fromEntries(['performance','accessibility','lcpMs','cls','tbtMs','bytes'].map(k=>[k,median(runs.map(x=>x[k]))])):null};
 }
 groups.push(group);
}
fs.writeFileSync('reta-proof/mobile-comparison.json',JSON.stringify({scope:'Three simulated-mobile runs per page and mode, identical pathnames, frozen shell and preview host. Alternating mode order. A query switch chooses original HTML without changing route-aware script behaviour. Not field CrUX, not live production uplift, and not a guarantee of load time. Earlier prefixed-path results are superseded for comparisons.',failures,pages:groups},null,2));
console.log(JSON.stringify(groups.map(x=>({page:x.page,baseline:x.baseline.median,candidate:x.candidate.median})),null,2));
if(failures.length||groups.some(x=>!x.baseline.median||!x.candidate.median))process.exitCode=1;

if(groups.some(x=>x.candidate.median.lcpMs>x.baseline.median.lcpMs*0.95 || x.candidate.median.cls>x.baseline.median.cls+0.02))throw Error('Required measured LCP improvement or CLS preservation not achieved');
