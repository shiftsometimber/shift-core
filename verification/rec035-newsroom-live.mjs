import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const phase=process.argv[2], origin='https://shiftsometimber.co.uk';
const hash=s=>createHash('sha256').update(s).digest('hex');
const normalise=s=>s.replaceAll('<a href="/shift-newsroom">SHIFT Newsroom</a>','');
async function get(path){const r=await fetch(origin+path,{signal:AbortSignal.timeout(30000),headers:{'Cache-Control':'no-cache'}});assert.equal(r.status,200,path);return r.text();}
const fingerprint=JSON.parse(await get('/DEPLOYMENT-FINGERPRINT.json')).aggregate_sha256;
assert.equal(fingerprint,'1ec46ba5f5383cf02c5379cabc6ad20877a8dc6193abd8cc852b1ede43a9dcc0');
const paths=['/','/start-here','/shift-for-work','/member-login','/treatment-order?medicine=mounjaro&view=spec&from=start-here','/assets/header-navigation-v2.css','/start-here-v72.js'];
const pages=[];
for(const path of paths){const html=await get(path);if(path.startsWith('/treatment-order'))assert.ok(html.includes('Based on your answers, this could perhaps work for you…'));pages.push({path,sha256:hash(normalise(html))});}
if(phase==='before'){fs.writeFileSync('newsroom-public-before.json',JSON.stringify({fingerprint,pages},null,2));console.log('PASS: locked public pages captured.');}
else{
 assert.deepEqual(pages,JSON.parse(fs.readFileSync('newsroom-public-before.json')).pages,'Non-newsroom page content changed beyond the approved menu link');
 const html=await get('/shift-newsroom');assert.match(html,/<h1>SHIFT <span class="accent">Newsroom/);assert.match(html,/UK health and access/);assert.match(html,/International research and developments/);assert.match(html,/href="\/shift-newsroom">SHIFT Newsroom/);
 assert.match(html,/rel="canonical" href="https:\/\/shiftsometimber.co.uk\/shift-newsroom"/);
 const redirect=await fetch(origin+'/medicine-news',{redirect:'manual'});assert.equal(redirect.status,301);assert.equal(redirect.headers.get('location'),origin+'/shift-newsroom');
 assert.ok((await get('/sitemap.xml')).includes('<loc>'+origin+'/shift-newsroom</loc>'));
 fs.writeFileSync('newsroom-live-proof.json',JSON.stringify({fingerprint,pages,newsroom:true,canonical:true,redirect:true,sitemap:true},null,2));console.log('PASS: SHIFT Newsroom, canonical/redirect/sitemap, approved menu and locked public content.');
}
