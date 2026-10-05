import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const run=promisify(execFile);
import {mkdirSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {SIX_TOPIC_SEO,withSixTopicGuides} from '../public-seo-closeout.mjs';
const live=process.argv.includes('--live'),base='https://shiftsometimber.co.uk';
const sha=s=>createHash('sha256').update(s).digest('hex');
const read=async path=>(await run('curl',['-fsSL','--max-time','40',base+path],{encoding:'utf8',maxBuffer:8*1024*1024})).stdout;
const out='six-topic-seo-proof';mkdirSync(out,{recursive:true});
const proof={checkedAt:new Date().toISOString(),mode:live?'live':'candidate',pages:[],links:[],failures:[],searchRankingClaim:false};
const paths=Object.keys(SIX_TOPIC_SEO),targets=new Set();
await Promise.all(paths.map(async path=>{try{
 const before=await read(path),html=live?before:withSixTopicGuides(before,path);
 assert(html.includes(`data-six-topic-seo="${path}"`),'Topic section absent');
 assert.equal((html.match(/<h1\b/gi)||[]).length,1,'Single existing H1');
 assert.equal((html.match(/rel=["']canonical["']/gi)||[]).length,1,'Single canonical');
 assert(!/<meta[^>]*(?:name=["']robots["'][^>]*content=["'][^"']*noindex|content=["'][^"']*noindex[^>]*name=["']robots)/i.test(html),'Unexpected noindex');
 const section=html.match(/<section class="shift-topic-guides"[\s\S]*?<\/section>/)[0];
 for(const m of section.matchAll(/href="([^"]+)"/g))targets.add(m[1]);
 if(!live){assert.equal(withSixTopicGuides(html,path),html,'Idempotence');const stripped=html.replace(section,'');assert.equal(stripped.match(/<main\b[\s\S]*?<\/main>/i)[0],before.match(/<main\b[\s\S]*?<\/main>/i)[0],'Existing article content changed');assert.equal(html.match(/<header\b[\s\S]*?<\/header>/i)?.[0],before.match(/<header\b[\s\S]*?<\/header>/i)?.[0],'Header changed');assert.equal(html.match(/<footer\b[\s\S]*?<\/footer>/i)?.[0],before.match(/<footer\b[\s\S]*?<\/footer>/i)?.[0],'Footer changed')}
 writeFileSync(`${out}/${path.slice(1).replaceAll('/','_')}.html`,html);
 proof.pages.push({path,sha256:sha(html),existingContentPreserved:!live,sectionPresent:true});
}catch(e){proof.failures.push({path,error:e.message})}}));
await Promise.all([...targets].map(async path=>{try{const html=await read(path);assert(/<main\b/i.test(html),'Not a content page');proof.links.push({path,contentServed:true})}catch(e){proof.failures.push({path,error:e.message})}}));
proof.pass=proof.pages.length===paths.length&&proof.failures.length===0;
writeFileSync(`${out}/proof.json`,JSON.stringify(proof,null,2)+'\n');console.log(JSON.stringify(proof,null,2));if(!proof.pass)process.exitCode=1;
