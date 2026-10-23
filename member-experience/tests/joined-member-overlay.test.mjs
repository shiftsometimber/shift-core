import test from 'node:test';import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {repairMemberAsset,repairAskDocument,toolSelectionBefore,toolSelectionAfter,askCopyRepairs,grubNutritionBefore} from '../../release/joined-member-repairs.mjs';
import overlay from '../../release/connected-programme-worker.mjs';
const req=p=>new Request('https://shiftsometimber.co.uk'+p);
const response=s=>new Response(s,{headers:{'Content-Type':'text/javascript',ETag:'old'}});
test('tool selection repair preserves every other byte in the current layout',async()=>{
 const old='before\n'+toolSelectionBefore+'\nafter',r=await repairMemberAsset(req('/assets/my-timber-layout.mjs?v=1'),response(old)),body=await r.text();
 assert.equal(body,'before\n'+toolSelectionAfter+'\nafter');assert.equal(r.headers.get('ETag'),null);assert.match(r.headers.get('X-Shift-Member-Repair'),/^joined-member/);
});
test('unexpected independent layout changes are preserved and explicitly marked unpatched',async()=>{
 const old='new independently released tool selector';const r=await repairMemberAsset(req('/assets/my-timber-layout.mjs'),response(old));assert.equal(await r.text(),old);assert.equal(r.headers.get('X-Shift-Member-Repair'),'source-changed-unpatched');
});
test('Ask copy repair keeps the complete handoff and classification code outside four display fragments',async()=>{
 const old=askCopyRepairs.map(([before])=>before).join('\n'),r=await repairMemberAsset(req('/assets/ask-timber-phase8.js'),response(old));assert.equal(await r.text(),askCopyRepairs.map(([,after])=>after).join('\n'));
 const partial=askCopyRepairs[0][0],p=await repairMemberAsset(req('/assets/ask-timber-phase8.js'),response(partial));assert.equal(await p.text(),partial,'no partial mutation on a newer runtime');
});
test('the current pinned Journey asset is replaced; unknown source remains untouched',async()=>{
 const original=execFileSync('git',['show','564493774:frontend/member/member-my-journey-v2.js'],{encoding:'utf8'});
 const r=await repairMemberAsset(req('/member-my-journey-v2.js?v=1'),response(original)),s=await r.text();assert.match(s,/connected.lifeBack/);assert.doesNotMatch(s,/section\('5. Life Back baseline'/);assert.equal(r.headers.get('X-Shift-Member-Repair'),'joined-member-20261023');
 const newer=await repairMemberAsset(req('/member-my-journey-v2.js'),response('another release'));assert.equal(await newer.text(),'another release');
});
test('meal plan totals are explicitly a partial food record, with no invented nutrition target',async()=>{
 const r=await repairMemberAsset(req('/assets/member-experience/grub.mjs'),response('before '+grubNutritionBefore+' after')),body=await r.text();assert(body.startsWith('before '));assert(body.endsWith(' after'));assert.match(body,/These days need another look/);assert.match(body,/higher calorie total does not confirm/);assert.equal(r.headers.get('X-Shift-Grub-Quality'),'grub-plan-quality-20261023');
 const newer='independent nutrition function';const unchanged=await repairMemberAsset(req('/assets/member-experience/grub.mjs'),response(newer));assert.equal(await unchanged.text(),newer);assert.equal(unchanged.headers.get('X-Shift-Member-Repair'),'source-changed-unpatched');
});
test('after-treatment Life Back links use the actual page for all three later weeks',async()=>{
 const old=Array(3).fill("href:'/member/dashboard#lifeback'").join(';');const r=await repairMemberAsset(req('/my-timber-v11.js'),response(old));assert.equal(await r.text(),Array(3).fill("href:'/member/life-back'").join(';'));
});
test('Ask document removes only its live preview title and preserves the rest of the page',async()=>{
 const old='<title>Ask Timber | My Timber preview</title><main>Existing controls</main>';const r=await repairAskDocument(req('/member/ask-timber'),new Response(old,{headers:{'Content-Type':'text/html'}}));assert.equal(await r.text(),'<title>Ask Timber | My Timber</title><main>Existing controls</main>');
});
test('the new private GET routes deny anonymous access; writes and unrelated clinical routes stay with core',async()=>{
 const env={MEMBER_EXPERIENCE_V1_ENABLED:'true',CORE:{fetch:async()=>new Response('existing core')}};
 for(const p of ['/v1/my-journey','/v1/journey','/v1/member/treatment','/v1/member/treatment/summary.pdf','/v1/grub/workspace','/v1/grub/workspace/'])assert.equal((await overlay.fetch(req(p),env)).status,401,p);
 for(const p of ['/v1/journey/weekly-check-in','/v1/member/treatment/records','/v1/member/treatment-notifications','/treatment-assessment','/v1/grub/search','/v1/grub/diary','/'])assert.equal(await(await overlay.fetch(req(p),env)).text(),'existing core',p);
});

 test('Ask repair gives previously cached scripts a fresh versioned URL',async()=>{
 const old='<title>Ask Timber | My Timber preview</title><script src="/assets/ask-timber-phase8.js?v=15"></script>';
 const r=await repairAskDocument(req('/member/ask-timber'),new Response(old,{headers:{'Content-Type':'text/html'}}));assert.match(await r.text(),/src="\/assets\/ask-timber-phase8\.js\?v=joined-member-20261023"/);
 });
