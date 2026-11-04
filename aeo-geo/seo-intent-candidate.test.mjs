import test from 'node:test';
import assert from 'node:assert/strict';
import {WEGOVY_SEARCH_CANDIDATE,applyWegovySearchCandidate,enhancePublicHtml} from './schema.mjs';
const c=WEGOVY_SEARCH_CANDIDATE;
const before='<html><head><title>'+c.beforeTitle+'</title><meta name="description" content="'+c.beforeDescription+'"><meta property="og:title" content="'+c.beforeTitle+'"><meta name="twitter:title" content="'+c.beforeTitle+'"><meta property="og:description" content="'+c.beforeDescription+'"><meta name="twitter:description" content="'+c.beforeDescription+'"></head><body><main><h1>'+c.beforeTitle+'</h1><script type="application/ld+json">{"@type":"Article","headline":"'+c.beforeTitle+'"}</script><a href="/start-here">Explore Weight Loss</a></main></body></html>';
test('candidate rewrites precisely six existing search/social metadata tags',()=>{
 const next=applyWegovySearchCandidate(before,c.path);
 assert.notEqual(next,before);
 assert.equal(next.includes('<title>'+c.title+'</title>'),true);
 assert.equal(next.includes('<meta name="description" content="'+c.description+'">'),true);
 assert.equal(next.includes('<h1>'+c.beforeTitle+'</h1>'),true);
 assert.equal(next.includes('"headline":"'+c.beforeTitle+'"'),true);
 assert.equal(next.includes('href="/start-here"'),true);
 assert.equal((next.match(/<meta /g)||[]).length,5);
 assert.equal(applyWegovySearchCandidate(next,c.path),next);
});
test('other owner, missing/changed source and double tags fail closed',()=>{
 assert.equal(applyWegovySearchCandidate(before,'/articles/weight-loss-medication-eligibility-uk'),before);
 for(const altered of [before.replace('NHS BMI','NHS access'),before.replace('<meta name="twitter:description"','<meta name="x:description"'),before.replace('</title>','</title><title>duplicate</title><title>'+c.beforeTitle+'</title>')])assert.equal(applyWegovySearchCandidate(altered,c.path),altered);
});
test('private and noindex documents remain byte-identical',()=>{
 for(const path of ['/member/dashboard','/checkout','/hq'])assert.equal(enhancePublicHtml(before,path),before);
 const excluded=before.replace('<head>','<head><meta name="robots" content="noindex">');
 assert.equal(enhancePublicHtml(excluded,c.path),excluded);
});
test('review candidate contains no price, stock, availability or prescription promises',()=>{
 assert.equal(c.title.length<=60,true);
 assert.equal(c.description.length<=155,true);
 for(const x of ['buy now','in stock','prescribe with SHIFT','guaranteed','eligible if'])assert.equal((c.title+' '+c.description).toLowerCase().includes(x),false);
});
