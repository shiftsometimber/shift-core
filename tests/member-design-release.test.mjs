import test from 'node:test';
import assert from 'node:assert/strict';
import {MEMBER_DESIGN_CANDIDATE,MEMBER_DESIGN_RUN,MEMBER_DESIGN_PATHS,MEMBER_LAYOUT_CANDIDATE,MEMBER_LAYOUT_RUN,MEMBER_LAYOUT_PATHS,validateMemberDesignPayload,validateMemberLayoutPayload,verifyMemberDesignProof} from '../release/member-design-scope.mjs';
test('member design release accepts only the six exact browser-tested presentation files',()=>{
 validateMemberDesignPayload((ref,path)=>path,MEMBER_DESIGN_PATHS);
 for(const path of MEMBER_DESIGN_PATHS)assert.throws(()=>validateMemberDesignPayload((ref,p)=>ref==='HEAD'&&p===path?'changed':p,MEMBER_DESIGN_PATHS),/design drift/);
 for(const path of ['wrangler.jsonc','worker-entry-v6.js','member-experience/grub-routes.mjs','migrations/unreviewed.sql'])assert.throws(()=>validateMemberDesignPayload((ref,p)=>p,[...MEMBER_DESIGN_PATHS,path]),/outside/);
});
test('member design release requires the exact successful isolated browser proof',async()=>{
 const receipt={head_sha:MEMBER_DESIGN_CANDIDATE,path:'.github/workflows/member-design-preview.yml',conclusion:'success'};
 const layout={head_sha:MEMBER_LAYOUT_CANDIDATE,path:'.github/workflows/member-panel-layout-preview.yml',conclusion:'success'};
 await verifyMemberDesignProof(async path=>{if(path==='/actions/runs/'+MEMBER_DESIGN_RUN)return receipt;assert.equal(path,'/actions/runs/'+MEMBER_LAYOUT_RUN);return layout});
 for(const patch of [{head_sha:'another'},{path:'.github/workflows/unrelated.yml'},{conclusion:'failure'},{conclusion:null}])await assert.rejects(()=>verifyMemberDesignProof(async()=>({...receipt,...patch})));
 for(const patch of [{head_sha:'another'},{path:'.github/workflows/unrelated.yml'},{conclusion:'failure'},{conclusion:null}])await assert.rejects(()=>verifyMemberDesignProof(async path=>path==='/actions/runs/'+MEMBER_DESIGN_RUN?receipt:{...layout,...patch}));
});
test('returning-member layout repair requires exactly its three proven files and rejects unrelated changes',()=>{
 validateMemberLayoutPayload((ref,path)=>path,MEMBER_LAYOUT_PATHS);
 for(const path of MEMBER_LAYOUT_PATHS)assert.throws(()=>validateMemberLayoutPayload((ref,p)=>ref==='HEAD'&&p===path?'changed':p,MEMBER_LAYOUT_PATHS),/layout drift/);
 for(const path of ['wrangler.jsonc','worker-entry-v6.js','member-experience/grub-routes.mjs','migrations/unreviewed.sql'])assert.throws(()=>validateMemberLayoutPayload((ref,p)=>p,[...MEMBER_LAYOUT_PATHS,path]),/outside/);
});
