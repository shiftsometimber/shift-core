import assert from 'node:assert/strict';

const DEFAULT_SHARING_IMAGE='/assets/og-default.jpg';

function mainImages(html){
 const main=String(html).match(/<main\b[\s\S]*?<\/main>/i)?.[0]||'';
 return [...main.matchAll(/<img\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)].map(match=>match[1]);
}

export function assertArticleImagePolicy({html,path,schema,sharingImage,production}){
 const images=mainImages(html);
 if(schema?.image){
  if(images.length)return 'article';
  const raw=Array.isArray(schema.image)?schema.image[0]:schema.image?.url||schema.image;
  const structured=new URL(String(raw).replace(/&amp;/g,'&'));
  const fallback=new URL(String(sharingImage).replace(/&amp;/g,'&'));
  assert.equal(structured.origin,production,path+' structured fallback origin');
  assert.equal(structured.pathname,DEFAULT_SHARING_IMAGE,path+' conservative structured fallback');
  assert.equal(fallback.href,structured.href,path+' matching sharing fallback');
  return 'publisher-fallback-schema';
 }
 assert.equal(images.length,0,path+' structured image required for visible article imagery');
 const fallback=new URL(String(sharingImage).replace(/&amp;/g,'&'));
 assert.equal(fallback.origin,production,path+' sharing image origin');
 assert.equal(fallback.pathname,DEFAULT_SHARING_IMAGE,path+' conservative sharing fallback');
 return 'publisher-fallback';
}
