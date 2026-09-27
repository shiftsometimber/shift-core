import assert from 'node:assert/strict';
export const AI_CANDIDATE='ccb02aef21cb3eecf1e9c96cdb640063c4590cc6';
export const AI_BASE='b7684acb867e85386cea87ecbfb055847d0fa55d';
export const AI_RELEASE_PATHS=new Set(['wrangler.jsonc','release/shift-ai-scope.mjs','release/shift-ai-live.mjs','release/shift-ai-live.json','tests/shift-ai-release.test.mjs','tests/b1-release-scope.test.mjs','scripts/b1-release-scope.mjs','release/member-details-schema.mjs','.github/workflows/cloudflare-production-promote.yml']);
export const AI_FLAGS='    "SHIFT_AI_PRACTICAL_CONTEXT": "true",\n    "SHIFT_AI_CONVERSATION_MEMORY": "true",\n';
export function withoutAiFlags(config){return config.replace(AI_FLAGS,'')}
export function validateAiRelease(manifest,changed,config,baseConfig){
 assert.equal(manifest.approvedScope,'shift-ai-context-and-memory');
 assert.equal(manifest.applicationCommit,AI_CANDIDATE);
 assert.equal(manifest.baseCommit,AI_BASE);
 assert.equal(manifest.previewWorkflowRun,36281269294);
 assert.equal(manifest.productionActivationAuthorised,true);
 assert.equal(manifest.mode,'runtime-only');
 assert(changed.every(p=>AI_RELEASE_PATHS.has(p)),'AI candidate drift outside approved release paths');
 assert(config.includes(AI_FLAGS),'Both authorised AI flags must be enabled');
 assert.equal(withoutAiFlags(config),baseConfig,'Unexpected configuration change outside the two AI flags');
 return {runtimeOnly:true,applicationCommit:AI_CANDIDATE,baseCommit:AI_BASE,approvedScope:manifest.approvedScope,releaseOnlyChanges:changed,applicationChanges:[],runtimeSchemaAdditions:['member_account_details','member_account_details_preserve_delivery','member_signup_alerts']};
}

export const FOUNDATION_CANDIDATE='bd4c0c20608bccae8a660e8ec50b68880ef09d54';
export const FOUNDATION_PATHS=["preview/ai-context/gateway-settings.mjs","tests/ai-fast-stream.test.mjs","preview/ai-context/runtime-profile.mjs","member-experience/ai-public-answer-cache.mjs","preview/ai-context/inference-client.mjs",".github/workflows/shift-ai-context-evaluation.yml", "ask-timber-v1.js", "frontend/member/api-adapter-v33d.js", "frontend/member/assets/ask-timber-v1.js", "member-experience/ai-external-knowledge.mjs", "member-experience/ai-fast-answers.mjs", "member-experience/ai-foundation.mjs", "member-experience/ai-practical-context.mjs", "member-experience/ai-site-knowledge.mjs", "member-experience/ai-stream.mjs", "member-experience/ai-voice.mjs", "preview/ai-context/browser-proof.mjs", "preview/ai-context/inference.mjs", "preview/ai-context/latency-probe.mjs", "preview/ai-context/site-answer-proof.mjs", "preview/ai-context/site-index.mjs", "scheduled-knowledge-v1.js", "shift-brain-v1.js", "tests/ai-connected-member.test.mjs", "tests/ai-external-knowledge.test.mjs", "tests/ai-fast-stream.test.mjs", "tests/ai-foundation.test.mjs", "tests/ai-site-knowledge.test.mjs", "tests/ask-timber-public.test.mjs"];
export function validateFoundation(read){for(const path of FOUNDATION_PATHS)assert.equal(read('HEAD',path),read(FOUNDATION_CANDIDATE,path),'Foundation source drift: '+path)}
