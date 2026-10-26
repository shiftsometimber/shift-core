import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {fixture} from '../../health-passport/fixture.mjs';
import {isV6AcceptanceRequest,gateV6Owner} from '../support-release-gate.mjs';
test('acceptance selection requires the reserved identity, source and valid real session',async t=>{
 const f=fixture({seed:false});t.after(()=>f.close());f.db.exec('CREATE TABLE member_status(user_id INTEGER PRIMARY KEY,source TEXT)');
 f.db.prepare('INSERT INTO member_status VALUES(?,?)').run(1,'my_timber_release_test_v6');
 const req=(token='test-only-member-1')=>new Request('https://shiftsometimber.co.uk/member/life-back/support',{headers:{Cookie:'sst_session='+token}});
 assert.equal(await isV6AcceptanceRequest(req(),f.env),false);
 f.db.prepare('UPDATE users SET email=? WHERE id=1').run('my-timber-v6-dan@example.invalid');assert.equal(await isV6AcceptanceRequest(req(),f.env),true);
 f.db.prepare("UPDATE member_status SET source='member' WHERE user_id=1").run();assert.equal(await isV6AcceptanceRequest(req(),f.env),false);
 assert.equal(await isV6AcceptanceRequest(req('forged'),f.env),false);
 const old={fetch:async()=>new Response('current member experience')},next={fetch:async()=>new Response('new candidate')};
 assert.equal(await(await gateV6Owner(old,next).fetch(req(),f.env,{})).text(),'current member experience');
 assert.equal(await(await gateV6Owner(old,next).fetch(new Request('https://shiftsometimber.co.uk/'),{...f.env,MY_TIMBER_V6_RELEASE_ENABLED:'true'},{})).text(),'current member experience');
});
