import test from 'node:test';
import assert from 'node:assert/strict';
import {mentalHealthDescription,withPublicSeoCloseout,SHARING_IMAGE_PATHS,PUBLIC_TWITTER_IMAGE,completePublicSharingImage,repairPublicSeoLinks,PERFORMANCE_SNIPPETS,repairPerformanceSnippet,repairArticleImageSchema} from '../public-seo-closeout.mjs';

const old='Plain-English guidance ending professional or.';
const shell=`<html><head><meta content="${old}" name="description"><meta name="twitter:description" content="${old}"><meta content="${old}" property="og:description"></head><body>Preserved page</body></html>`;

test('the two approved mental-health descriptions replace malformed metadata exactly once',async()=>{
 for(const path of ['/mental-health/medication-and-weight','/mental-health/when-someone-refuses-help']){
  const request=new Request('https://shiftsometimber.co.uk'+path);
  const response=await withPublicSeoCloseout(new Response(shell,{headers:{'content-type':'text/html; charset=utf-8'}}),request);
  const html=await response.text(),description=mentalHealthDescription(path);
  assert.ok(description);assert.doesNotMatch(description,/professional or\./);assert.ok(html.includes('Preserved page'));
  assert.equal((html.match(/name="description"/g)||[]).length,1);
  assert.equal((html.match(/property="og:description"/g)||[]).length,1);
  assert.equal((html.match(/name="twitter:description"/g)||[]).length,1);
  assert.equal((html.match(new RegExp(description.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'g'))||[]).length,3);
 }
});

test('unrelated public pages remain byte-for-byte untouched',async()=>{
 const response=new Response(shell,{headers:{'content-type':'text/html'}});
 assert.equal(await withPublicSeoCloseout(response,new Request('https://shiftsometimber.co.uk/about')),response);
});

test('the eight missing sharing images are completed once and existing editorial images survive',()=>{
 for(const path of SHARING_IMAGE_PATHS){const once=completePublicSharingImage(shell,path);assert.equal(once.replace(PUBLIC_TWITTER_IMAGE,''),shell);assert.equal(completePublicSharingImage(once,path),once)}
 const custom=shell.replace('</head>',`<meta content="/real-article.jpg" name='twitter:image'></head>`);
 assert.equal(completePublicSharingImage(custom,'/programme'),custom);
 assert.equal(completePublicSharingImage(shell,'/about'),shell);
});

test('legacy anchors use final destinations with queries and the correct Journey fragment',()=>{
 const html=`<a href="/articles/mounjaro-vs-wegovy#evidence">Compare</a><a href='/member/journey?from=programme#old'>Journey</a><a href="https://www.shiftsometimber.co.uk/member/progress">Progress</a>`;
 const result=repairPublicSeoLinks(html);
 assert.equal(result,`<a href="/compare-weight-loss-treatments#evidence">Compare</a><a href='/member/dashboard?from=programme#journey'>Journey</a><a href="/member/dashboard#journey">Progress</a>`);
 assert.equal(repairPublicSeoLinks(result),result);
});

test('link repair preserves external anchors, scripts, form actions and unrelated data attributes',()=>{
 const html=`<a href="https://example.org/member/progress">External</a><a data-href="/member/progress">Data</a><script>const example='<a href="/member/journey">';</script><form action="/member/progress"></form><!-- <a href="/member/progress"> -->`;
 assert.equal(repairPublicSeoLinks(html),html);
});

const {SIX_TOPIC_SEO,withSixTopicGuides}=await import('../public-seo-closeout.mjs');
const topicShell='<html><head><title>Original</title><meta content="original" name="description"><meta property="og:title" content="Original"><link rel="canonical" href="https://shiftsometimber.co.uk/example"><script type="application/ld+json">{"dateModified":"2026-08-26"}</script></head><body><header>Original menu</header><main><h1>Original heading</h1><p>Original safety advice</p></main><footer>Original footer</footer></body></html>';
test('six topic guides preserve article, clinical review dates, schema and shell',()=>{
 for(const path of Object.keys(SIX_TOPIC_SEO)){
  const html=withSixTopicGuides(topicShell,path);
  assert.match(html,/Original safety advice/);assert.match(html,/<h1>Original heading<\/h1>/);assert.match(html,/"dateModified":"2026-08-26"/);assert.match(html,/<header>Original menu<\/header>/);assert.match(html,/<footer>Original footer<\/footer>/);
  assert.equal((html.match(/data-six-topic-seo=/g)||[]).length,1);assert.equal((html.match(/name="description"/g)||[]).length,1);assert.equal(withSixTopicGuides(html,path),html);
 }
});
test('homepage, Start Here, member, API, checkout and Watch documents remain identical',()=>{
 for(const path of ['/','/start-here','/member/dashboard','/v1/medicines-watch/health','/checkout','/treatment-centre/medicines-watch'])assert.equal(withSixTopicGuides(topicShell,path),topicShell);
});
test('mental-health routes keep a standalone support path and research keeps supply boundaries',()=>{
 const mental=withSixTopicGuides(topicShell,'/mens-mental-health').match(/<section class="shift-topic-guides"[\s\S]*?<\/section>/)[0];
 assert.match(mental,/without joining SHIFT/);assert.match(mental,/urgent-mental-health-help/);assert.doesNotMatch(mental,/href="\/(mounjaro|wegovy|start-here|member)/);
 const hub=withSixTopicGuides(topicShell,'/explore-knowledge');assert.match(hub,/not an offer of supply/);assert.match(hub,/Retatrutide \(Reta\)/);
});
test('failed and non-HTML responses and mutations are not rewritten',async()=>{
 for(const [status,type,method] of [[404,'text/html','GET'],[200,'application/json','GET'],[200,'text/html','POST']]){
  const response=new Response(topicShell,{status,headers:{'content-type':type}});
  assert.equal(await withPublicSeoCloseout(response,new Request('https://shiftsometimber.co.uk/mounjaro',{method})),response);
 }
});

test('data-led performance snippets change only title and search/share descriptions',()=>{
 const article='<html><head><title>Old title</title><meta name="description" content="Old description"><meta property="og:title" content="Old title"><meta property="og:description" content="Old description"><meta name="twitter:title" content="Old title"><meta name="twitter:description" content="Old description"></head><body><main><h1>Keep this H1</h1><p>Keep this clinical body.</p></main></body></html>';
 for(const pair of Object.entries(PERFORMANCE_SNIPPETS)){
  const path=pair[0],item=pair[1],html=repairPerformanceSnippet(article,path);
  assert.ok(html.includes('<title>'+item.title.replaceAll('&','&amp;')+'</title>'));
  assert.ok(html.includes(item.description));
  assert.match(html,/<h1>Keep this H1<\/h1>/);assert.match(html,/Keep this clinical body/);
  assert.equal(repairPerformanceSnippet(html,path),html);
 }
 assert.equal(repairPerformanceSnippet(article,'/articles/unrelated'),article);
});
test('article image schema repair uses the existing public OG image without changing article copy',()=>{
 const source='<html><head><script type="application/ld+json">{"@context":"https://schema.org","@type":"Article","headline":"Keep headline"}</script></head><body><main><p>Keep body</p></main></body></html>';
 const html=repairArticleImageSchema(source,'/articles/wegovy-side-effects-timeline');
 const data=JSON.parse(html.split('<script type="application/ld+json">')[1].split('</script>')[0]);
 assert.equal(data.image,'https://shiftsometimber.co.uk/assets/og-default.jpg');assert.equal(data.headline,'Keep headline');assert.match(html,/Keep body/);
 assert.equal(repairArticleImageSchema(html,'/articles/wegovy-side-effects-timeline'),html);
 assert.equal(repairArticleImageSchema(source,'/about'),source);
});
test('performance closeout preserves homepage, Start Here and unrelated articles',async()=>{
 for(const path of ['/','/start-here','/articles/unrelated']){
  const response=new Response(topicShell,{headers:{'content-type':'text/html'}});
  assert.equal(await withPublicSeoCloseout(response,new Request('https://shiftsometimber.co.uk'+path)),response);
 }
});
