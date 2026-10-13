import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {LEGACY_SHARE_URL,APPROVED_SHARE_URL,replaceRootShareImage} from '../share-preview/metadata.mjs';
import {SHARE_PREVIEW_PATH,SHARE_PREVIEW_SHA256,sharePreviewBytes} from '../share-preview/asset.mjs';
const origin='https://shiftsometimber.co.uk',dir='b1-runtime-release/root-share-preview';
const paths=['/','/programme','/shift-newsroom','/male-obesity','/assets/og-default.jpg','/assets/favicon-32.png?v=104e','/member-login'];
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const headers=['content-type','cache-control','content-security-policy','strict-transport-security','x-content-type-options','referrer-policy','permissions-policy','x-frame-options'];
async function get(path,{method='GET',crawler=false}={}){
 const r=await fetch(origin+path,{method,headers:{'Cache-Control':'no-cache',...(crawler?{'User-Agent':'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)'}:{})},signal:AbortSignal.timeout(30000)});
 assert.equal(r.status,200,path+' actual serving status');assert(!r.headers.has('set-cookie'),path+' public response sets cookie');
 const body=new Uint8Array(await r.arrayBuffer());return {path,body,sha256:sha(body),headers:Object.fromEntries(headers.map(k=>[k,r.headers.get(k)]))};
}
export function jpegDimensions(bytes){
 assert.equal(bytes[0],255);assert.equal(bytes[1],216);let at=2;
 while(at<bytes.length){assert.equal(bytes[at],255);while(bytes[at]===255)at++;const marker=bytes[at++];if(marker===217||marker===218)break;if(marker===1||(marker>=208&&marker<=215))continue;const size=(bytes[at]<<8)|bytes[at+1];assert(size>=2);if([192,193,194,195,197,198,199,201,202,203,205,206,207].includes(marker))return {width:(bytes[at+5]<<8)|bytes[at+6],height:(bytes[at+3]<<8)|bytes[at+4]};at+=size;
 }throw Error('Missing JPEG dimensions');
}
export function verifyRootPreservation(before,after){
 const baseline=new TextDecoder().decode(before),live=new TextDecoder().decode(after);
 assert.equal(live,replaceRootShareImage(baseline),'Only the two approved homepage image URLs may differ');assert.equal(live.split(APPROVED_SHARE_URL).length,3);assert.equal(live.split(LEGACY_SHARE_URL).length,1);return true;
}
export function verifyRootHeadPreservation(before,head){
 assert.equal(before?.path,'/','Actual pre-release homepage HEAD baseline required');assert.equal(head.path,'/');assert.equal(head.body.length,0,'Homepage HEAD must remain bodyless');assert.deepEqual(head.headers,before.headers,'Homepage HEAD policy must match its own pre-release HEAD baseline');return true;
}
if(process.argv[1]?.endsWith('root-share-preview-live.mjs')){
 mkdirSync(dir,{recursive:true});const phase=process.argv[2];assert(['before','after'].includes(phase));
 const source=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
 if(phase==='before'){
  const records=[];for(let i=0;i<paths.length;i++){const record=await get(paths[i]);writeFileSync(dir+'/before-'+i+'.bin',record.body);delete record.body;records.push(record);}
  const rootHead=await get('/',{method:'HEAD'});verifyRootHeadPreservation(rootHead,rootHead);delete rootHead.body;
  writeFileSync(dir+'/before.json',JSON.stringify({checkedAt:new Date().toISOString(),releaseSource:source,records,rootHead,customerRecordsRead:false,emailTestsRun:false},null,2));console.log('PASS retained actual public homepage GET and HEAD plus6 unchanged routes/assets before publication');
 }else{
  const before=JSON.parse(readFileSync(dir+'/before.json','utf8'));assert.equal(before.releaseSource,source);const results=[];
  for(let i=0;i<paths.length;i++){const record=await get(paths[i]),prior=before.records[i];assert.deepEqual(record.headers,prior.headers,paths[i]+' original policy/security headers changed');if(i===0)verifyRootPreservation(readFileSync(dir+'/before-'+i+'.bin'),record.body);else assert.equal(record.sha256,prior.sha256,paths[i]+' unrelated bytes changed');writeFileSync(dir+'/after-'+i+'.bin',record.body);delete record.body;results.push(record);}
  const crawler=await get('/',{crawler:true});verifyRootPreservation(readFileSync(dir+'/before-0.bin'),crawler.body);
  const image=await get(SHARE_PREVIEW_PATH);assert.equal(image.sha256,SHARE_PREVIEW_SHA256);assert.deepEqual(image.body,sharePreviewBytes());assert.deepEqual(jpegDimensions(image.body),{width:1200,height:630});assert.equal(image.headers['content-type'],'image/jpeg');writeFileSync(dir+'/served-share-preview.jpg',image.body);delete image.body;
  const head=await get(SHARE_PREVIEW_PATH,{method:'HEAD'});assert.equal(head.body.length,0);assert.equal(head.headers['content-type'],'image/jpeg');
  const homeHead=await get('/',{method:'HEAD'});verifyRootHeadPreservation(before.rootHead,homeHead);
  writeFileSync(dir+'/after.json',JSON.stringify({proof:'ROOT_SHARE_EXACT_LIVE_PRESERVATION_20261013',checkedAt:new Date().toISOString(),releaseSource:source,results,image,crawlerRootMatches:true,rootOnlyTwoImageURLsChanged:true,headImageAndRoot:true,existingWhatsAppCardsRefreshGuaranteed:false,emailTestsRun:false,externalMessagesSent:false},null,2));console.log('PASS new1200x630 JPEG/hash, crawler root metadata, GET/HEAD and exact two-link inverse; all6 unrelated routes/assets and security/cache policy unchanged');
 }
}
