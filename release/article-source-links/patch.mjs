import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

export const sha=value=>createHash('sha256').update(value).digest('hex');
function segment(code){
 const marker='// babylove/dynamic-public.mjs\n';
 assert.equal(code.split(marker).length,2,'Exactly one compiled article module required');
 const start=code.indexOf(marker),rest=code.slice(start+marker.length);
 const next=/\n\/\/ [A-Za-z0-9_./-]+\.(?:m?js|json)\n/.exec(rest);
 assert(next,'Following compiled module boundary required');
 return code.slice(start,start+marker.length+next.index+1);
}
export function deriveArticlePatch(before,after){
 const oldText=segment(before),newText=segment(after);
 assert.notEqual(oldText,newText,'Article correction is absent');
 assert(oldText.length<100000&&newText.length<100000,'Article module exceeds the bounded envelope');
 assert.match(newText,/function articleSource\d*\(/,'Tested source-label function missing');
 const reverted=after.replace(newText,()=>oldText);
 if(reverted!==before){
  let first=0;while(first<before.length&&first<reverted.length&&before[first]===reverted[first])first++;
  let tail=0;while(tail<before.length-first&&tail<reverted.length-first&&before.at(-1-tail)===reverted.at(-1-tail))tail++;
  throw Error('Compiled changes outside the article module are forbidden: '+JSON.stringify({first,beforeLength:before.length,afterLength:reverted.length,before:before.slice(Math.max(0,first-200),first+1000),after:reverted.slice(Math.max(0,first-200),first+1000),beforeEnd:before.slice(Math.max(0,before.length-tail-300),before.length-tail+100),afterEnd:reverted.slice(Math.max(0,reverted.length-tail-300),reverted.length-tail+100)}));
 }
 return {oldText,newText,beforeSHA256:sha(before),afterSHA256:sha(after)};
}
export function applyArticlePatch(bytes,patch){
 const before=Buffer.from(bytes).toString('utf8');
 assert(Buffer.from(before).equals(Buffer.from(bytes)),'Serving module must be exact UTF-8');
 assert.equal(before.split(patch.oldText).length,2,'Serving article preimage is absent or ambiguous');
 const code=before.replace(patch.oldText,()=>patch.newText);
 assert.equal(code.split(patch.newText).length,2);
 assert.equal(code.replace(patch.newText,()=>patch.oldText),before,'Serving patch must have an exact byte inverse');
 return {code,proof:{beforeSHA256:sha(bytes),afterSHA256:sha(code),exactInverse:true,oldArticleSHA256:sha(patch.oldText),newArticleSHA256:sha(patch.newText)}};
}

// Preserve the final serving shell and all existing HTML transformations.
// Admit only complete changed link/image atoms from the authenticated Markdown,
// and require those atoms to explain the renderer's entire body difference.
export function expectedRenderedDocument(html,body,beforeRender,afterRender,title='',slug=''){
 const before=beforeRender(body,title,slug),after=afterRender(body,title,slug);
 if(before===after)return {html,replacements:[]};
 const atom=fn=>token=>fn(token,'',slug).replace(/^<p>|<\/p>$/g,'');
 const oldAtom=atom(beforeRender),newAtom=atom(afterRender),changes=new Map();
 for(const m of body.matchAll(/!?\[([^\]]*)\]\((https?:\/\/(?:[^\s()]|\([^()\s]*\))+|\/[^\s)]*|#[a-z0-9_-]+)\)/gi)){
  const oldText=oldAtom(m[0]),newText=newAtom(m[0]);
  if(oldText!==newText)changes.set(oldText,newText);
 }
 assert(changes.size,'Renderer changes must be explained by complete source link/image atoms');
 let projected=before,expected=html;const replacements=[];
 for(const [oldText,newText]of changes){
  const sourceCount=before.split(oldText).length-1,liveCount=html.split(oldText).length-1;
  assert(sourceCount>0&&liveCount===sourceCount,'The exact source link/image occurrences must match the actual live document');
  projected=projected.replaceAll(oldText,()=>newText);expected=expected.replaceAll(oldText,()=>newText);
  replacements.push({beforeSHA256:sha(oldText),afterSHA256:sha(newText),occurrences:liveCount});
 }
 assert.equal(sha(projected),sha(after),'Link/image changes must explain every changed rendered body byte');
 return {html:expected,replacements};
}
