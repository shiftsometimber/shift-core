import test from 'node:test';import assert from 'node:assert/strict';
import {verifyOrganicDelivery} from '../release/organic-followthrough-live.mjs';
import {ORGANIC_LINK_EDITS} from '../public-seo-organic-links.mjs';
import {APPROVED_LINK_EDITS} from '../public-seo-link-repairs.mjs';
const delivered=async(url)=>{const path=new URL(url).pathname;if(path==='/sitemap.xml')return new Response('<urlset><url><loc>https://shiftsometimber.co.uk/compare-weight-loss-treatments</loc></url></urlset>');const pairs=ORGANIC_LINK_EDITS[path]||[APPROVED_LINK_EDITS[path]];return new Response(pairs.map(p=>p[1]).join(''));};
test('live verification rejects a successful HTTP response carrying old anchors',async()=>{await assert.rejects(()=>verifyOrganicDelivery(async(url)=>new URL(url).pathname==='/treatment-centre'?new Response(ORGANIC_LINK_EDITS['/treatment-centre'][0][0]):delivered(url)),/Retired anchor remains live/);});
test('all exact delivered changes pass but sitemap alias regression fails',async()=>{const e=await verifyOrganicDelivery(delivered);assert.equal(e.pages.length,10);await assert.rejects(()=>verifyOrganicDelivery(async(url)=>new URL(url).pathname==='/sitemap.xml'?new Response('<urlset><loc>https://shiftsometimber.co.uk/treatments/compare</loc></urlset>'):delivered(url)),/Redirect alias remains/);});
test('missing earlier urgent-support repair is a release failure',async()=>{await assert.rejects(()=>verifyOrganicDelivery(async(url)=>new URL(url).pathname==='/mens-mental-health'?new Response('<p>Old page without approved support link</p>'):delivered(url)),/Approved anchor not delivered/);});

test('transport retry retains exact anchor assertions and emits retry evidence',async()=>{
 let first=true;const e=await verifyOrganicDelivery(async url=>{if(first){first=false;throw Object.assign(new TypeError('fetch failed'),{cause:{code:'ECONNRESET'}})}return delivered(url)});assert.equal(e.pages[0].attempts,2);assert.deepEqual(e.pages[0].transportFailures,[{attempt:1,code:'ECONNRESET'}]);
 let calls=0;await assert.rejects(()=>verifyOrganicDelivery(async url=>{if(++calls===1)throw Object.assign(new TypeError('fetch failed'),{cause:{code:'ECONNRESET'}});return new Response('<p>changed content</p>')}),/Approved anchor not delivered/);assert.equal(calls,2);
});
