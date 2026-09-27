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

export const FOUNDATION_CANDIDATE='de27e77e2d3adb979677f181c682e979ef56538b';
export const FOUNDATION_PATHS=['ask-timber-v1.js','shift-brain-v1.js','member-experience/ai-foundation.mjs','tests/ai-foundation.test.mjs','.github/workflows/shift-ai-context-evaluation.yml'];
export function validateFoundation(read){for(const path of FOUNDATION_PATHS)assert.equal(read('HEAD',path),read(FOUNDATION_CANDIDATE,path),'Foundation source drift: '+path)}
