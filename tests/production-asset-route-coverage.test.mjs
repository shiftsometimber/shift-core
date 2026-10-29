import test from 'node:test';
import assert from 'node:assert/strict';
import {productionAssetRouteCovers as covers} from '../production-asset-route-coverage.mjs';
const a='/member-my-timber-problem-v1.js',hosts=['shiftsometimber.co.uk','www.shiftsometimber.co.uk'];
test('domain-wide and exact production routes cover both retained member assets',()=>{
 for(const asset of [a,'/member-today-premium-v1.css'])for(const host of hosts)for(const pattern of [host+'/*',host+asset+'*'])assert.equal(covers(JSON.stringify({routes:[{pattern}]}),host,asset),true);
});
test('missing www, API-only, wrong host and wrong paths stay uncovered',()=>{
 for(const routes of [[],[{pattern:'api.shiftsometimber.co.uk/*'}],[{pattern:'shiftsometimber.co.uk/member/dashboard*'}],[{pattern:'shiftsometimber.co.uk/other.js*'}],[{pattern:'notshiftsometimber.co.uk/*'}]])assert.equal(covers(JSON.stringify({routes}),hosts[0],a),false);
 assert.equal(covers(JSON.stringify({routes:[{pattern:hosts[0]+'/*'}]}),hosts[1],a),false);
});
test('comments, metadata and environment-only routes cannot satisfy the production assertion',()=>{
 assert.equal(covers('{ "routes": [], /* "pattern": "shiftsometimber.co.uk/*" */ "note": "shiftsometimber.co.uk/*" }',hosts[0],a),false);
 assert.equal(covers(JSON.stringify({env:{preview:{routes:[{pattern:hosts[0]+'/*'}]}}}),hosts[0],a),false);
});
test('valid JSONC route declarations retain comments and trailing comma support',()=>{
 assert.equal(covers('{// comment\n"routes":[{"pattern":"shiftsometimber.co.uk/*"}, // comment\n],}',hosts[0],a),true);
 assert.equal(covers('{"routes":[{"pattern":"shiftsometimber.co.uk/*","script":null}]}',hosts[0],a),false);
});
