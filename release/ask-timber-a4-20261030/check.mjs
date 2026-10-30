import assert from 'node:assert/strict';
import fs from 'node:fs';
import css from './styles.mjs';
import {transformHTML,outsideScope,scripts,mainHTML,topics,release,clientURL} from './layout.mjs';
export function check(before,after=transformHTML(before,css)){
 assert.equal(outsideScope(after),outsideScope(before),'Preserve all document bytes outside the approved Ask main and new style');
 const existingScripts=s=>scripts(s).filter(tag=>!tag.includes('src="'+clientURL+'"'));
 assert.deepEqual(existingScripts(after),existingScripts(before),'Every existing script retained exactly');
 assert.equal(scripts(after).filter(tag=>tag.includes('src="'+clientURL+'"')).length,1,'Connect the wider prompt buttons once');
 assert.equal(transformHTML(after,css),after,'A4 must be idempotent');
 const old=mainHTML(before),now=mainHTML(after);
 for(const id of ['timberForm','timberQuestion','timberSubmit','timberCount','timberResponse','atg-suggestions','atg-topic-status','atg-reset','atg-compose-eyebrow','atg-input-hint'])assert.equal((now.match(new RegExp('id="'+id+'"','g'))||[]).length,1,'Keep one '+id);
 const attrs=(s,re)=>[...s.matchAll(re)].map(x=>x[0]).sort();
 assert.deepEqual(attrs(now,/data-timber-prompt="[^"]*"/g),attrs(old,/data-timber-prompt="[^"]*"/g),'Preserve wider question values');
 assert.deepEqual(attrs(now,/data-topic="[^"]*"/g),attrs(old,/data-topic="[^"]*"/g),'Preserve topic choice values');
 for(const key of topics)assert(now.includes('src="/ask-timber/assets/a4-20261030/'+key+'.webp"'));
 assert.equal((now.match(/class="atg-topic"/g)||[]).length,4,'Only four topic selectors');
 assert.equal((now.match(/class="kh-prompt"/g)||[]).length,6);
 assert(now.indexOf('id="timberForm"')<now.indexOf('class="atg-start"'));
 assert(now.indexOf('class="atg-start"')<now.indexOf('id="wider-health-topics"'));
 assert.equal(now.match(/<form\b[^>]*>[\s\S]*?<\/form>/)[0],old.match(/<form\b[^>]*>[\s\S]*?<\/form>/)[0],'Question form is unchanged');
 assert.equal(now.match(/<p class="atg-boundary">[\s\S]*?<\/p>/)[0],old.match(/<p class="atg-boundary">[\s\S]*?<\/p>/)[0],'Non-clinical wording is unchanged');
 const destinations=s=>attrs(s,/href="[^"]*"/g);
 assert.deepEqual(destinations(now),destinations(old),'Retain existing routes');
 assert(after.includes('data-ask-a4="'+release+'"'));
 assert(!now.includes('atg-icon')&&!now.includes('atg-card-arrow'));
 return {outsideMainPreserved:true,scriptsPreserved:true,formPreserved:true,topicControls:4,widerTopicControls:6,idempotent:true};
}
if(process.argv[2])console.log(JSON.stringify(check(fs.readFileSync(process.argv[2],'utf8'))));
