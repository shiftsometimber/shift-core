import test from 'node:test';
import assert from 'node:assert/strict';
import {timberShedForumRooms,timberShedForumPreview,timberShedForumRules} from '../member-experience/timber-shed-forums.mjs';
import {timberShedPage} from '../member-experience/timber-shed-page.mjs';
test('six distinct rooms and twelve fictional prompts, no member posts',()=>{
 assert.equal(timberShedForumRooms.length,6);
 assert.equal(new Set(timberShedForumRooms.map(x=>x.id)).size,6);
 assert.deepEqual(timberShedForumRooms.map(x=>x.id),['main-shed','shifting-timber','grub-fit','good-to-talk','small-wins','after-treatment']);
 for(const room of timberShedForumRooms){assert.equal(room.topics.length,2);assert(room.topics.every(t=>t.length===2&&t.every(s=>s.length>8)))}
 const html=timberShedForumPreview();
 assert.equal((html.match(/class="forum-room"/g)||[]).length,6);
 assert.equal((html.match(/class="forum-topic"/g)||[]).length,12);
 assert.equal((html.match(/Fictional discussion example/g)||[]).length,12);
});
test('no publishing UI, identity or private account data is injected into forum',()=>{
 const html=timberShedForumPreview();
 assert.doesNotMatch(html,/<form|<textarea|contenteditable|<input|<script|member_id|user_id|profile_id|member\.email|localStorage|sessionStorage|fetch\(/i);
 assert.match(html,/Posting, replies and member profiles are disabled/);
 assert.match(html,/Nothing from My Timber is published here/);
 assert.match(timberShedPage,/Fictional discussion example/);
 assert.match(timberShedPage,/forum-grid/);
 assert.match(timberShedPage,/My Timber/);
});
test('forum safety rules forbid automatic private data sharing and direct messaging',()=>{
 const rules=timberShedForumRules.join(' ');
 assert.match(rules,/never used to prefill posts/);
 assert.match(rules,/deliberately submitted/);
 assert.match(rules,/trained adult cover/);
 assert.match(rules,/No private messaging/);
});
