import assert from 'node:assert/strict';

// Verification-only allowlist: remove exactly the two owner-approved additions
// from pre/post fingerprints. Retain every other byte, including tools links in
// article content, so the existing production preservation check stays strict.
export function preserveCalculatorsNavigation(path,input,{required=false}={}){
 const body=Buffer.isBuffer(input)?input:Buffer.from(input);
 const html=body.toString('utf8');
 if(!/<html\b/i.test(html)||!/<main\b/i.test(html))return body;
 if(/^\/(?:member\/|v1\/|api\/|hq(?:\/|$))/.test(path))return body;
 assert.ok(Buffer.from(html).equals(body),'Public calculator navigation must be valid UTF-8');
 let regions=0;
 const result=html.replace(/<aside\b(?=[^>]*\bid=["']site-drawer["'])[^>]*>[\s\S]*?<\/aside>|<footer\b(?=[^>]*\bclass=["'][^"']*\bsite-footer\b[^"']*["'])[^>]*>[\s\S]*?<\/footer>/gi,region=>{
  regions++;
  const anchors=region.match(/<a\b[^>]*\bhref=["']\/tools["'][^>]*>[\s\S]*?<\/a>/g)||[];
  assert.ok(anchors.length<=1,'Duplicate calculator link in '+path);
  if(required)assert.equal(anchors.length,1,'Missing approved calculator link in '+path);
  if(!anchors.length)return region;
  const anchor=anchors[0];
  assert.match(anchor,/^<a href="\/tools"(?: aria-current="page")?>Calculators &amp; Tools<\/a>$/,'Calculator label or destination differs from approval');
  if(/^<footer/i.test(region)){
   const explore=region.match(/<section><h2>Explore<\/h2>[\s\S]*?<\/section>/)?.[0];
   assert.ok(explore?.includes(anchor),'Calculator footer link must remain under Explore');
  }else{
   assert.match(region,/>Ask Timber<\/a><a href="\/tools"(?: aria-current="page")?>Calculators &amp; Tools<\/a><a href="\/contact"/,'Calculator drawer link must stay in alphabetical position');
  }
  return region.replace(anchor,'');
 });
 assert.equal(regions,2,'Expected exactly one public drawer and footer on '+path);
 return Buffer.from(result);
}
