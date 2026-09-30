import test from 'node:test';
import assert from 'node:assert/strict';
import {MEMBER_FOCUS_APPROVED,MEMBER_FOCUS_RUN,MEMBER_FOCUS_PATHS,validateMemberFocus} from '../release/member-focus-scope.mjs';
test('approved My Timber release rejects drift in every reviewed file',()=>{
 assert.equal(MEMBER_FOCUS_APPROVED,'6cc950b4f6020e44dbaafffe4b7bf90d54852cca');assert.equal(MEMBER_FOCUS_RUN,36636511091);assert.equal(MEMBER_FOCUS_PATHS.length,22);
 validateMemberFocus((ref,path)=>path);
 for(const altered of MEMBER_FOCUS_PATHS)assert.throws(()=>validateMemberFocus((ref,path)=>ref==='HEAD'&&path===altered?'changed':path),/source drift/);
});
