import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const phase=process.argv[2], origin='https://shiftsometimber.co.uk';
const sha=s=>createHash('sha256').update(s).digest('hex');
const primary=['/start-here','/programme','/shift-health','/treatment-centre','/member/dashboard'];
const menu=primary.concat(['/about','/ask-timber','/contact','/help','/how-are-you-feeling','/explore-knowledge','/shift-for-work','/shop','/work-with-us']);
async function get(path){const r=await fetch(origin+path,{signal:AbortSignal.timeout(30000),headers:{'Cache-Control':'no-cache'}});assert.equal(r.status,200,path);return r.text();}
function check(s,path){const nav=s.match(/<nav[^>]*class="desktop-nav"[^>]*>([\s\S]*?)<\/nav>/)?.[1],drawer=s.match(/<aside[^>]*id="site-drawer"[^>]*>([\s\S]*?)<\/aside>/)?.[1];const hrefs=v=>[...String(v||'').matchAll(/<a[^>]*href="([^"]+)"/g)].map(m=>m[1]);assert.deepEqual(hrefs(nav),primary,path+': primary');assert.deepEqual(hrefs(drawer),menu,path+': menu');assert.ok(s.includes('data-header-style="underline"'),path+': variant');}
const fp=JSON.parse(await get('/DEPLOYMENT-FINGERPRINT.json'));assert.equal(fp.aggregate_sha256,'1ec46ba5f5383cf02c5379cabc6ad20877a8dc6193abd8cc852b1ede43a9dcc0');
const paths=['/','/start-here','/programme','/shift-health','/treatment-centre','/about','/explore-knowledge','/shop','/work-with-us','/shift-for-work','/medicine-news','/medicine-news/obesity-management-new-research','/treatment-order?medicine=mounjaro&view=spec&from=start-here'];
const pages=[];
for(const path of paths){const body=await get(path);check(body,path);if(path.startsWith('/treatment-order'))assert.ok(body.includes('Based on your answers, this could perhaps work for you…'));if(path==='/')assert.ok(!body.includes('data-shift-ai-full-wire'));pages.push({path,sha256:sha(body)});}
for(const path of ['/assets/header-navigation-v2.css','/assets/v42.js','/start-here-v72.js','/turnstile-auth-v1.js?v=timeout-20260912']){pages.push({path,sha256:sha(await get(path))});}
if(phase==='before'){fs.writeFileSync('auth-header-public-before.json',JSON.stringify({fingerprint:fp.aggregate_sha256,pages},null,2));console.log('PASS: public header routes captured before independent auth-shell update.');}
else{
 const before=JSON.parse(fs.readFileSync('auth-header-public-before.json'));assert.deepEqual(pages,before.pages,'public source changed during auth update');
 const expected=fs.readFileSync('frontend/member/my-timber-preview.html','utf8');const auth=[];
 for(const path of ['/member-login','/member-register','/my-timber-preview']){const body=await get(path);check(body,path);assert.equal(body,expected,path+': exact auth shell');auth.push({path,sha256:sha(body)});}
 fs.writeFileSync('auth-header-live-proof.json',JSON.stringify({fingerprint:fp.aggregate_sha256,pages,auth,publicBytesUnchanged:true},null,2));console.log('PASS: exact approved sign-in/register shell and menu; all public pages, menu/journey assets and Pages fingerprint preserved.');
}
