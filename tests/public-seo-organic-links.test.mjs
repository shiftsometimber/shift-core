import test from 'node:test';import assert from 'node:assert/strict';
import {ORGANIC_LINK_EDITS,repairOrganicLinks,preserveOrganicLinks,repairOrganicSitemap,withOrganicLinkRepairs} from '../public-seo-organic-links.mjs';
import {withContextSeo} from '../public-seo-context.mjs';
test('finite current anchors change only their href and reverse without content drift',()=>{
 assert.equal(Object.keys(ORGANIC_LINK_EDITS).length,9);
 for(const [path,pairs] of Object.entries(ORGANIC_LINK_EDITS))for(const [before,after] of pairs){
  const html='<title>Original</title>'+before+'<p>Original dates and clinical wording</p><script>const unchanged=true;</script>';
  assert.equal(repairOrganicLinks(path,html),html.replace(before,after));
  assert.equal(preserveOrganicLinks(path,Buffer.from(repairOrganicLinks(path,html))).toString(),html);
  assert.equal(repairOrganicLinks(path,repairOrganicLinks(path,html)),repairOrganicLinks(path,html));
  assert.equal(repairOrganicLinks(path,before+before),before+before);
  assert.equal(repairOrganicLinks(path,'source drift'),'source drift');
 }
});
test('only the redirecting comparison alias is excluded, without changing dates or archives',()=>{
 const node=loc=>'<url><loc>'+loc+'</loc><lastmod>2025-01-01</lastmod></url>';
 const wanted=node('https://shiftsometimber.co.uk/compare-weight-loss-treatments')+node('https://shiftsometimber.co.uk/guides/retatrutide-uk-guide');
 const xml='<urlset>'+wanted+node('https://shiftsometimber.co.uk/treatments/compare')+node('https://other.example/treatments/compare')+'</urlset>';
 const expected='<urlset>'+wanted+node('https://other.example/treatments/compare')+'</urlset>';
 assert.equal(repairOrganicSitemap(xml),expected);assert.equal(repairOrganicSitemap(expected),expected);
});
test('homepage, Start Here, private routes, other hosts, methods and non-HTML responses stay untouched',async()=>{
 const body=ORGANIC_LINK_EDITS['/treatment-centre'][0][0];
 for(const [url,method,status,type] of [['https://shiftsometimber.co.uk/','GET',200,'text/html'],['https://shiftsometimber.co.uk/start-here','GET',200,'text/html'],['https://shiftsometimber.co.uk/shift-health','GET',200,'text/html'],['https://shiftsometimber.co.uk/member/dashboard','GET',200,'text/html'],['https://other.example/treatment-centre','GET',200,'text/html'],['https://shiftsometimber.co.uk/treatment-centre','POST',200,'text/html'],['https://shiftsometimber.co.uk/treatment-centre','GET',404,'text/html'],['https://shiftsometimber.co.uk/treatment-centre','GET',200,'application/json']]){
  const r=new Response(body,{status,headers:{'Content-Type':type}});assert.equal(await withOrganicLinkRepairs(r,new Request(url,{method})),r);
 }
});
test('production wrapper performs new edits and retains the existing approved urgent-support repair',async()=>{
 const path='/treatment-centre',[before,after]=ORGANIC_LINK_EDITS[path][0];
 const out=await withContextSeo(new Response(before,{headers:{'Content-Type':'text/html','ETag':'stale','Content-Length':'999','Cache-Control':'public'}}),new Request('https://shiftsometimber.co.uk'+path));
 assert.equal(await out.text(),after);assert.equal(out.headers.get('ETag'),null);assert.equal(out.headers.get('Content-Length'),null);assert.equal(out.headers.get('Cache-Control'),'public');
 const urgent='<a href="/mental-health/urgent-help">urgent support guide for your nation</a>';
 const repaired=await withContextSeo(new Response(urgent,{headers:{'Content-Type':'text/html'}}),new Request('https://shiftsometimber.co.uk/mens-mental-health'));
 assert.equal(await repaired.text(),urgent.replace('/mental-health/urgent-help','/mental-health/urgent-mental-health-help'));
});
