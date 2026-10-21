import test from 'node:test';import assert from 'node:assert/strict';
import {renderShiftHealthDocument,healthSlugs} from '../shift-health-public.mjs';
import {testosteroneGuides} from '../testosterone-guides.mjs';
import {reconcileSitemap} from '../public-shell-contract.mjs';
const shell='<html><head><title>Old</title></head><body><header>retained header</header><main>old</main><footer>retained footer</footer></body></html>';
test('guides are routed, independently canonical, linked and closed to booking',()=>{
 for(const [slug,p] of Object.entries(testosteroneGuides)){
  assert.ok(healthSlugs.includes(slug));const html=renderShiftHealthDocument(shell,slug);
  assert.equal((html.match(/<h1\b/g)||[]).length,1);
  assert.equal((html.match(/rel="canonical"/g)||[]).length,1);
  assert.ok(html.includes('href="https://shiftsometimber.co.uk/shift-health/'+slug+'"'));
  assert.ok(html.includes('retained header'));assert.ok(html.includes('retained footer'));
  for(const dest of ['/member/dashboard','/shift-health/blood-tests','/shift-health/testosterone-energy'])assert.ok(html.includes('href="'+dest+'"'));
  for(const other of Object.keys(testosteroneGuides))assert.ok(html.includes('href="/shift-health/'+other+'"'));
  assert.doesNotMatch(html,/<form\b|checkout|To be confirmed|noindex/);
  assert.match(html,/not currently bookable/);assert.match(html,/id="evidence"/);
  assert.ok(p.sections.length>=6);
 }
});
test('hub contains approved card and guide routes, no obsolete purchase placeholders',()=>{
 const health=renderShiftHealthDocument(shell);
 assert.match(health,/>Testosterone:<br>start with understanding<\/h2>/);assert.match(health,/href="\/shift-health\/testosterone-energy">Explore testosterone<svg/);assert.match(health,/Need specific help<br>with weight loss\?/);
 const hub=renderShiftHealthDocument(shell,'testosterone-energy');
 for(const slug of Object.keys(testosteroneGuides))assert.ok(hub.includes('href="/shift-health/'+slug+'"'));
 assert.doesNotMatch(hub,/To be confirmed|arrangements must be confirmed|Order home test|<form\b/);
 for(const [,id] of hub.matchAll(/href="#([^"]+)"/g))assert.ok(hub.includes('id="'+id+'"'),id);
});
test('sitemap lists each new guide once across repeat reconciliation',()=>{
 const xml=reconcileSitemap(reconcileSitemap('<urlset><url><loc>https://shiftsometimber.co.uk/shift-health</loc></url></urlset>'));
 for(const slug of Object.keys(testosteroneGuides))assert.equal(xml.split('<loc>https://shiftsometimber.co.uk/shift-health/'+slug+'</loc>').length-1,1);
});
