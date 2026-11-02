import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
const phase=process.argv[2];if(!['before','after'].includes(phase))throw Error('Performance phase required');
const directory='aeo-geo-proof/lighthouse';mkdirSync(directory,{recursive:true});
const paths={home:'/',guide:'/articles/weight-loss-medication-eligibility-uk',memberSignedOut:'/member/dashboard'};
if(phase==='after'&&existsSync('aeo-geo-proof/public-catalogue.json'))paths.recipe=JSON.parse(readFileSync('aeo-geo-proof/public-catalogue.json')).recipes[0].path;
if(process.env.AEO_PERFORMANCE_TARGETS){const selected=process.env.AEO_PERFORMANCE_TARGETS.split(',');for(const name of Object.keys(paths))if(!selected.includes(name))delete paths[name];if(!Object.keys(paths).length)throw Error('No known performance targets selected');}
const reports=[];
for(const [name,path] of Object.entries(paths))for(let sample=1;sample<=3;sample++){
 const file=directory+'/'+name+'-'+phase+'-'+sample+'.json';
 try{
  execFileSync(process.execPath,[process.env.LIGHTHOUSE_CLI,'https://shiftsometimber.co.uk'+path,'--only-categories=performance,accessibility,seo','--output=json','--output-path='+file,'--chrome-flags=--headless --no-sandbox','--quiet'],{stdio:'pipe',timeout:120000,maxBuffer:1e6});
  const r=JSON.parse(readFileSync(file));reports.push({name,path,phase,sample,at:r.fetchTime,performance:r.categories.performance.score*100,accessibility:r.categories.accessibility.score*100,seo:r.categories.seo.score*100,lcp:r.audits['largest-contentful-paint'].numericValue,cls:r.audits['cumulative-layout-shift'].numericValue,tbt:r.audits['total-blocking-time'].numericValue,ttfb:r.audits['server-response-time']?.numericValue,runtimeError:r.runtimeError||null});
 }catch(error){reports.push({name,path,phase,sample,error:String(error.message).slice(0,300)});}
}
writeFileSync(directory+'/'+phase+'-summary.json',JSON.stringify({kind:'Lighthouse mobile lab; not PageSpeed Insights or CrUX',member:'Signed-out cover only; authenticated dashboard unmeasured',reports},null,2));console.log(JSON.stringify(reports));
