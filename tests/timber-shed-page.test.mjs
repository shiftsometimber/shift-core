import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {timberShedPage,timberShedClient} from '../member-experience/timber-shed-page.mjs';
test('member page and script are behind explicit, default-off feature flags',()=>{
 const src=readFileSync(new URL('../member-experience/entry.mjs',import.meta.url),'utf8');
 assert.match(src,/env\.MEMBER_EXPERIENCE_V1_ENABLED !== 'true'/);
 assert.match(src,/env\.TIMBER_SHED_PRIVATE_ENABLED==='true'/);
 assert.match(src,/\/member\/timber-shed/);
 assert.match(src,/\/assets\/member-experience\/timber-shed\.mjs/);
});
test('the page contains no personal, clinical or community posting facilities',()=>{
 assert.match(timberShedPage,/My Timber/);
 assert.match(timberShedPage,/noindex,nofollow/);
 assert.match(timberShedPage,/No health records are read, shared or published/);
 assert.doesNotMatch(timberShedPage,/<form|<textarea|member-feed|member-profile|community-post/);
 assert.doesNotMatch(timberShedClient,/innerHTML|localStorage|sessionStorage|document\.cookie/);
 assert.match(timberShedClient,/credentials:'same-origin'/);
 assert.match(timberShedClient,/private-progress/);
 assert.doesNotMatch(timberShedClient,/\/v1\/(member-state|health|profile|treatment|tap-room)/);
});
test('the only data fields in the persistence contract are activity IDs and controlled enums',()=>{
 const src=readFileSync(new URL('../member-experience/timber-shed-private.mjs',import.meta.url),'utf8');
 assert.match(src,/ACTIVITY_IDS/);assert.match(src,/CHOICES/);
 assert.doesNotMatch(src,/SELECT \* FROM (member_state|health|users)/);
 assert.doesNotMatch(src,/POSTS|public_feed|community_members/i);
 assert.match(src,/WHERE user_id=\?/);
 assert.match(src,/TIMBER_SHED_PRIVATE_ENABLED/);
});
test('migration remains isolated and is not executed automatically in the private preview',()=>{
 const sql=readFileSync(new URL('../member-experience/timber-shed-private.sql',import.meta.url),'utf8');
 assert.match(sql,/ON DELETE CASCADE/);
 assert.doesNotMatch(sql,/CREATE TABLE.*posts/i);
});
