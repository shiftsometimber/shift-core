import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {banner,css,addHomeBanner,removeHomeBanner} from '../home-route-banner.mjs';
import {stabilisePublicHtml} from '../public-startup-stability.mjs';
import {preserveApprovedStartup} from '../release/member-details-preservation.mjs';
const anchor='<section aria-labelledby="struggle-artwork-title" class="struggle-artwork-section">';
const raw='<html><head></head><body><main id="main-content"><section class="hero">Original hero</section>'+anchor+'Original note</section><footer>Original footer</footer></main></body></html>';
test('only approved banner and scoped CSS are inserted; repeated transform is inert',()=>{const after=addHomeBanner(raw);assert.equal(removeHomeBanner(after,{required:true}),raw);assert.equal(after,raw.replace('</head>',css+'</head>').replace(anchor,banner+anchor));assert.equal(addHomeBanner(after),after);assert.throws(()=>removeHomeBanner(after.replace('IS FREE FOR EVERYONE.','Purchase required.')));assert.throws(()=>removeHomeBanner(after+banner));assert.throws(()=>removeHomeBanner(raw,{required:true}));});
test('startup integration preserves other routes and all original home bytes',()=>{assert.equal(stabilisePublicHtml('/',raw),addHomeBanner(raw));for(const p of ['/programme','/member-login','/member/dashboard','/shop'])assert.equal(stabilisePublicHtml(p,raw),raw);assert.equal(preserveApprovedStartup('/',Buffer.from(addHomeBanner(raw))).toString(),raw);assert.equal(addHomeBanner('<html><head></head><body>Unknown template</body></html>'),'<html><head></head><body>Unknown template</body></html>');});
test('actual current-home fixture is restored including speed CSS, and font bytes match signed-off asset',()=>{const font=readFileSync(new URL('../preview/home-banner/assets/barlow-condensed-700.ttf',import.meta.url)).toString('base64');assert(css.includes('data:font/ttf;base64,'+font));assert(css.includes('padding:3px 16px!important'));assert.equal((banner.match(/<a[ >]/g)||[]).length,9);});

test('desktop frame change is CSS-only and previous live banner restores exactly',async()=>{const {addHomeBanner:oldAdd}=await import('../home-route-banner-legacy.mjs');const old=oldAdd(raw);assert.equal(addHomeBanner(old),addHomeBanner(raw));assert.equal(removeHomeBanner(old),raw);assert.throws(()=>removeHomeBanner(old,{required:true}));assert(css.includes('@media(min-width:1001px)'));assert(css.includes('padding-bottom:0!important'));assert(css.includes('font-style:italic!important'));});

import {addCreamNavigation,removeCreamNavigation,headerPreview} from '../cream-navigation.mjs';
test('shared cream navigation preserves content and links, restores exact bytes and rejects drift',()=>{const original=raw.replace('<body>','<body><header data-header-v2 class="site-header">Original links</header>');for(const path of ['/','/programme','/shift-health','/member/dashboard']){const after=stabilisePublicHtml(path,original);assert(after.includes(headerPreview));assert.equal(removeCreamNavigation(path==='/'?removeHomeBanner(after):after),original);assert.equal(stabilisePublicHtml(path,after),after);}assert.equal(addCreamNavigation(raw),raw);assert.throws(()=>removeCreamNavigation(addCreamNavigation(original).replace('background:#E7E3DA!important','background:#fff!important')));});

test('hero preload reuses exact responsive image and is reversible',async()=>{
 const {addCreamNavigation,removeCreamNavigation,heroPreload}=await import('../cream-navigation.mjs');
 const img='<img src="/assets/seo-20260923/heroLarge-22b76937213e5741.webp" srcset="/assets/seo-20260923/heroSmall-54d52bf31ac3389a.webp 768w, /assets/seo-20260923/heroLarge-22b76937213e5741.webp 1536w" sizes="(max-width:760px) 100vw, 50vw">';
 const html='<head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><header data-header-v2></header><section class="home-hero">'+img+'</section></body>';
 const result=addCreamNavigation(html);assert(result.includes(heroPreload));assert(result.includes(img));assert.equal(addCreamNavigation(result),result);assert.equal(removeCreamNavigation(result),html);
 assert(!addCreamNavigation(html.replace('class="home-hero"','class="other"')).includes(heroPreload));
});

test('home bootstrap embedding preserves authoritative privacy code and exact restoration',async()=>{
 const {addCreamNavigation,removeCreamNavigation,inlineBootstrap}=await import('../cream-navigation.mjs');
 const {bootstrap}=await import('../activation-measurement/assets.mjs');
 assert.equal(inlineBootstrap,'<script data-shift-inline-bootstrap>'+bootstrap+'</script>');
});

 test('production output matches exact approved compact transform',async()=>{const {replaceFreeStrip}=await import('../preview/home-banner/free-design.mjs');const {banner:b,css:c}=await import('../preview/home-banner/four-step.mjs');assert.equal(addHomeBanner(raw),replaceFreeStrip(raw.replace('</head>',c+'</head>').replace(anchor,b+anchor)));});
