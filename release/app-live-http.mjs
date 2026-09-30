import {assertAppClient} from './app-client-proof.mjs';
import {consentClient} from '../acquisition-activation/consent.mjs';
import assert from 'node:assert/strict';import {writeFileSync} from 'node:fs';
import {appClient} from '../preview/app-layout/presentation.mjs';import {webToolsClient} from '../member-inline-tools.mjs';import {appAsset,launchAsset,launchClient} from '../app-layout-live.mjs';
const base='https://shiftsometimber.co.uk',checks=[];
for(const [path,expected]of [['/consent-v4a.js',consentClient],[appAsset,appClient],[launchAsset,launchClient],['/assets/my-timber-web-tools.mjs',webToolsClient]]){const r=await fetch(base+path);assert.equal(r.status,200);assert.match(r.headers.get('content-type'),/javascript/);const actual=await r.text();if(path===appAsset)assertAppClient(actual,expected);else assert.equal(actual,expected);checks.push(path)}
for(const [path,app]of [['/member/dashboard?view=app',true],['/member/dashboard?view=web',false],['/member/grub?view=web&app_panel=1',false]]){const r=await fetch(base+path);assert(r.ok);const html=await r.text();assert.equal(html.includes('data-app-layout="preview"'),app);assert.equal(/<body[^>]*data-web-tabs="1"/.test(html),!app);assert(!html.includes('APP LAYOUT PREVIEW ·'));assert(!html.includes('src="/__app-layout.mjs"'));checks.push(path)}
for(const p of ['/','/programme','/shop','/mens-mental-health']){const r=await fetch(base+p,{headers:{Cookie:'shift_app_view=1'}});assert(r.ok);const html=await r.text();assert(!html.includes('data-app-layout="preview"'));assert(!html.includes('data-web-tabs="1"'));checks.push(p)}
writeFileSync('b1-runtime-release/app-live-http.json',JSON.stringify({at:new Date().toISOString(),checks,status:'pass'},null,2));
