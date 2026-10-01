import test from 'node:test';
import assert from 'node:assert/strict';
import {MEMBER_DESIGN_CANDIDATE,MEMBER_DESIGN_RUN,MEMBER_DESIGN_PATHS,validateMemberDesignPayload,verifyMemberDesignProof} from '../release/member-design-scope.mjs';
test('member design release accepts only the six exact browser-tested presentation files',()=>{
 validateMemberDesignPayload((ref,path)=>path,MEMBER_DESIGN_PATHS);
 for(const path of MEMBER_DESIGN_PATHS)assert.throws(()=>validateMemberDesignPayload((ref,p)=>ref==='HEAD'&&p===path?'changed':p,MEMBER_DESIGN_PATHS),/design drift/);
 for(const path of ['wrangler.jsonc','worker-entry-v6.js','member-experience/grub-routes.mjs','migrations/unreviewed.sql'])assert.throws(()=>validateMemberDesignPayload((ref,p)=>p,[...MEMBER_DESIGN_PATHS,path]),/outside/);
});
test('member design release requires the exact successful isolated browser proof',async()=>{
 const receipt={head_sha:MEMBER_DESIGN_CANDIDATE,path:'.github/workflows/member-design-preview.yml',conclusion:'success'};
 await verifyMemberDesignProof(async path=>{assert.equal(path,'/actions/runs/'+MEMBER_DESIGN_RUN);return receipt});
 for(const patch of [{head_sha:'another'},{path:'.github/workflows/unrelated.yml'},{conclusion:'failure'},{conclusion:null}])await assert.rejects(()=>verifyMemberDesignProof(async()=>({...receipt,...patch})));
});
