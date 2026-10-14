import assert from 'node:assert/strict';
export const LEGACY_ROOT_SHARE_URL='https://shiftsometimber.co.uk/assets/og-default.jpg';
export const APPROVED_ROOT_SHARE_URL='https://shiftsometimber.co.uk/assets/shift-share-20261013.jpg';
// Diagnostic inverse only. Never serves a response or changes runtime metadata.
// The original complete public-page comparison still checks every other byte.
export function preserveApprovedRootShare(path,input,{required=false}={}){
 if(path!=='/')return input;
 const found={},sources=[];
 const result=input.toString('utf8').replace(/<meta\b[^>]*>/gi,tag=>{
  const key=tag.match(/\b(?:property|name)\s*=\s*["'](og:image|twitter:image)["']/i)?.[1]?.toLowerCase();
  if(!key)return tag;
  found[key]=(found[key]||0)+1;
  const match=tag.match(/\bcontent\s*=\s*(["'])([^"']*)\1/i);
  assert(match&&[LEGACY_ROOT_SHARE_URL,APPROVED_ROOT_SHARE_URL].includes(match[2]),'Unreviewed homepage sharing image');
  if(required)assert.equal(match[2],APPROVED_ROOT_SHARE_URL,'Exact approved sharing image must be served after release');
  sources.push(match[2]);
  return tag.replace(match[0],match[0].replace(match[2],LEGACY_ROOT_SHARE_URL));
 });
 assert.equal(found['og:image'],1,'Exactly one root og:image required');
 assert.equal(found['twitter:image'],1,'Exactly one root twitter:image required');
 assert.equal(new Set(sources).size,1,'Mixed root sharing sources refused');
 return Buffer.from(result);
}
