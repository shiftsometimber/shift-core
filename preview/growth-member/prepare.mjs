import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {improvePublicCopy,copyChanges} from './public-copy.mjs';
const dir='work/staging/generated';mkdirSync(dir+'/growth-evidence',{recursive:true});
const baseline=JSON.parse(readFileSync(dir+'/public-baseline.json'));
const evidence={source:process.env.GITHUB_SHA,capturedAt:baseline.checkedAt,productionWrites:0,changes:[]};
for(const change of copyChanges){
 const row=baseline.pages.find(p=>p.path===change.path);if(!row)throw Error('Missing current public route '+change.path);
 const source=row.before,after=improvePublicCopy(source,change.path);
 // Compare shell fragments byte for byte before preview containment is added.
 for(const tag of ['header','footer','aside']){
  const re=new RegExp('<'+tag+'\\b[^>]*>[\\s\\S]*?<\\/'+tag+'>','g');
  if(JSON.stringify(source.match(re))!==JSON.stringify(after.match(re)))throw Error('Protected '+tag+' changed');
 }
 const stem=change.path.slice(1);
 writeFileSync(dir+'/assets/public-documents/'+stem+'.html',after);
 writeFileSync(dir+'/growth-evidence/'+stem+'-before.html',source);
 writeFileSync(dir+'/growth-evidence/'+stem+'-after.html',after);
 evidence.changes.push({...change,before:row.sha256,after:createHash('sha256').update(after).digest('hex'),shellPreserved:true});
}
writeFileSync(dir+'/growth-evidence/copy-manifest.json',JSON.stringify(evidence,null,2));
const config=JSON.parse(readFileSync(dir+'/config.json'));
config.main='../../../preview/growth-member/worker.mjs';
writeFileSync(dir+'/config.json',JSON.stringify(config,null,2));
