import test from 'node:test';import assert from 'node:assert/strict';
import {repairWatchLinks,repairWatchResponse} from './links.mjs';
const shell=body=>'<header>Unchanged</header><a href="#industry-mounjaro">Outside</a><section id="watch-evidence-desk">'+body+'</section><section id="watch-coverage-gaps"><a href="#industry-mounjaro">Outside</a></section>';
test('all six detailed links resolve to their real cards; industry links clear filters too',()=>{
 const ids=['mounjaro','wegovy-injection','wegovy-tablet','orlistat','foundayo','retatrutide'];
 for(const id of ids){const before=shell('<a href="#industry-'+id+'">Exact original medicine wording</a>');const after=repairWatchLinks(before);assert.equal(after,before.replace('<section id="watch-evidence-desk"><a href="#industry-'+id+'">','<section id="watch-evidence-desk"><a href="/treatment-centre/medicines-watch#'+id+'">'));assert.equal(repairWatchLinks(after),after);}
 assert(repairWatchLinks(shell('<a href="#industry-example">Example</a>')).includes('href="/treatment-centre/medicines-watch#industry-example"'));
});
test('unrelated links, text, outside sections and absent section remain exact',()=>{
 const html=shell('<a href="https://example.invalid/#industry-mounjaro">Source</a><p>industry-mounjaro</p>');assert.equal(repairWatchLinks(html),html);assert.equal(repairWatchLinks('<a href="#industry-mounjaro">Outside</a>'),'<a href="#industry-mounjaro">Outside</a>');
});
test('only successful canonical GET HTML changes; preserve privacy/security headers',async()=>{
 const body=shell('<a href="#industry-mounjaro">Mounjaro</a>');
 const make=()=>new Response(body,{headers:{'Content-Type':'text/html','Content-Length':'999','Content-Encoding':'gzip','ETag':'old','Content-Security-Policy':"default-src 'self'",'X-Frame-Options':'DENY'}});
 for(const [host,path,method] of [['shiftsometimber.co.uk','/', 'GET'],['shiftsometimber.co.uk','/treatment-centre', 'GET'],['other.invalid','/treatment-centre/medicines-watch','GET'],['shiftsometimber.co.uk','/treatment-centre/medicines-watch','HEAD'],['shiftsometimber.co.uk','/treatment-centre/medicines-watch','POST']]){const r=make();assert.equal(await repairWatchResponse(new Request('https://'+host+path,{method}),r),r);}
 const r=await repairWatchResponse(new Request('https://shiftsometimber.co.uk/treatment-centre/medicines-watch?q=hidden'),make());assert.equal(r.headers.get('Content-Security-Policy'),"default-src 'self'");assert.equal(r.headers.get('X-Frame-Options'),'DENY');assert(!r.headers.has('ETag'));assert(!r.headers.has('Content-Length'));assert(!r.headers.has('Content-Encoding'));assert.equal(r.headers.get('Cache-Control'),'private, no-store');assert.equal(await r.text(),repairWatchLinks(body));
 const denied=new Response('Denied',{status:401});assert.equal(await repairWatchResponse(new Request('https://shiftsometimber.co.uk/treatment-centre/medicines-watch'),denied),denied);
});
