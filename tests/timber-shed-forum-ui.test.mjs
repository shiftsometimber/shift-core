import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {timberShedForumPilotMarkup,timberShedForumPilotClient,timberShedForumPilotCSS} from '../member-experience/timber-shed-forum-ui.mjs';
import {timberShedForumPreview} from '../member-experience/timber-shed-forums.mjs';
import {timberShedPage} from '../member-experience/timber-shed-page.mjs';
test('private forum pilot UI provides deliberate posting and reporting, not automatic publication',()=>{
 assert.match(timberShedForumPilotMarkup,/Submit for moderation/);
 assert.match(timberShedForumPilotMarkup,/Nothing is published immediately/);
 assert.match(timberShedForumPilotMarkup,/separate display name/);
 assert.match(timberShedForumPilotClient,/profile\/save/);
 assert.match(timberShedForumPilotClient,/api\('submit',payload\)/);
 assert.match(timberShedForumPilotClient,/moderation/);
 assert.match(timberShedForumPilotClient,/report/);
 assert.match(timberShedForumPilotClient,/dismiss/);
 assert.doesNotMatch(timberShedForumPilotClient,/localStorage|sessionStorage|innerHTML|document\.cookie|window\.prompt|prompt\(/);
 assert.doesNotMatch(timberShedForumPilotClient,/\/v1\/(member-state|health|treatment|profile|member\/details)/);
 assert.match(timberShedForumPilotClient,/credentials:'same-origin'/);
 assert.match(timberShedForumPilotCSS,/max-width:800px/);
});
test('member page switches from fictional preview only under a separate forum feature flag',()=>{
 const source=readFileSync(new URL('../member-experience/entry.mjs',import.meta.url),'utf8');
 assert.match(source,/env\.TIMBER_SHED_FORUM_ENABLED==='true'/);
 assert.match(source,/TIMBER_SHED_FORUM_PILOT_APPROVED/);
 assert.match(source,/replace\(timberShedForumPreview\(\),timberShedForumPilotMarkup\)/);
 assert.match(source,/env\.TIMBER_SHED_PRIVATE_ENABLED==='true'/);
 assert.match(source,/env\.MEMBER_EXPERIENCE_V1_ENABLED !== 'true'/);
 assert(timberShedPage.includes(timberShedForumPreview()));
});
test('API dispatch is feature-gated; no public route or community data reads in page',()=>{
 const source=readFileSync(new URL('../worker-entry-v6.js',import.meta.url),'utf8');
 assert.match(source,/timberShedForumRoutes\(request,env\)/);
 const route=readFileSync(new URL('../member-experience/timber-shed-forum-routes.mjs',import.meta.url),'utf8');
 assert.match(route,/TIMBER_SHED_FORUM_ENABLED!=='true'/);
 assert.match(route,/adult_verified_members_only/);
 assert.match(route,/status='approved'/);
 assert.match(route,/moderator_only/);
 assert.doesNotMatch(route,/SELECT .* FROM (member_state|health_|treatment_)/);
});
