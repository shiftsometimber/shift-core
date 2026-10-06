import {withoutCoachEntrypoint} from '../shift-coach/release-contract.mjs';
import assert from 'node:assert/strict';
export const AI_CANDIDATE='ccb02aef21cb3eecf1e9c96cdb640063c4590cc6';
export const AI_BASE='b7684acb867e85386cea87ecbfb055847d0fa55d';
export const AI_RELEASE_PATHS=new Set(['.github/workflows/ai-lossless-proof.yml','wrangler.jsonc','release/shift-ai-scope.mjs','release/shift-ai-live.mjs','release/shift-ai-live.json','tests/shift-ai-release.test.mjs','tests/b1-release-scope.test.mjs','scripts/b1-release-scope.mjs','release/member-details-schema.mjs','.github/workflows/cloudflare-production-promote.yml']);
export const AI_FLAGS='    "SHIFT_AI_PRACTICAL_CONTEXT": "true",\n    "SHIFT_AI_CONVERSATION_MEMORY": "true",\n';
export function withoutAiFlags(config){return withoutCoachEntrypoint(config).replace(AI_FLAGS,'')}
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

export const FOUNDATION_CANDIDATE='df2289a6a06260122d8df3ad17b08a41fb6267c3';
export const FOUNDATION_PATHS=["preview/ai-context/gateway-settings.mjs","tests/ai-fast-stream.test.mjs","preview/ai-context/runtime-profile.mjs","member-experience/ai-public-answer-cache.mjs","preview/ai-context/inference-client.mjs",".github/workflows/shift-ai-context-evaluation.yml", "ask-timber-v1.js", "frontend/member/api-adapter-v33d.js", "frontend/member/assets/ask-timber-v1.js", "member-experience/ai-external-knowledge.mjs", "member-experience/ai-fast-answers.mjs", "member-experience/ai-foundation.mjs", "member-experience/ai-practical-context.mjs", "member-experience/ai-site-knowledge.mjs", "member-experience/ai-stream.mjs", "member-experience/ai-voice.mjs", "preview/ai-context/browser-proof.mjs", "preview/ai-context/inference.mjs", "preview/ai-context/latency-probe.mjs", "preview/ai-context/site-answer-proof.mjs", "preview/ai-context/site-index.mjs", "scheduled-knowledge-v1.js", "shift-brain-v1.js", "tests/ai-connected-member.test.mjs", "tests/ai-external-knowledge.test.mjs", "tests/ai-fast-stream.test.mjs", "tests/ai-foundation.test.mjs", "tests/ai-site-knowledge.test.mjs", "tests/ask-timber-public.test.mjs"];
export const LOSSLESS_CANDIDATE='6796a750a0a2ea4cad2779dfed7f2b3272b64e78';
export const LOSSLESS_PATHS=new Set(['member-experience/ai-site-knowledge.mjs','tests/ai-site-knowledge.test.mjs']);
// Owner-authorised privacy repair: bind only the two tested payload files.
export const PRIVACY_FALLBACK_CANDIDATE='1ce04c88c9493ee18b0cd1a1d991d76f04ba51cf';
export const PRIVACY_FALLBACK_PATHS=new Set(['ask-timber-v1.js','tests/ai-fast-stream.test.mjs']);
// Owner-authorised fresh-stream repair, proved with real hosted inference.
export const STREAM_RELIABILITY_CANDIDATE='e501cf536a07c34975d98b621b36c5978e1d9250';
export const STREAM_RELIABILITY_PATHS=new Set(['ask-timber-v1.js','member-experience/ai-stream.mjs','tests/ai-fast-stream.test.mjs','tests/ai-stream-reliability.test.mjs','preview/ai-context/fresh-reliability-proof.mjs','.github/workflows/priority-closeout-proof.yml']);
// Owner-approved public SEO v3 work reduced only the public Life Back stream
// prompt. Keep its exact integration byte pinned without widening the earlier
// reliability source for private, clinical or other foundation files.
export const PUBLIC_SITE_STREAM_CANDIDATE='98220aae8b1c7135e43d1e100b32e6895eec7b34';
FOUNDATION_PATHS.push('tests/ai-stream-reliability.test.mjs','preview/ai-context/fresh-reliability-proof.mjs','.github/workflows/priority-closeout-proof.yml');
export function foundationSource(path){return path==='ask-timber-v1.js'?PUBLIC_SITE_STREAM_CANDIDATE:STREAM_RELIABILITY_PATHS.has(path)?STREAM_RELIABILITY_CANDIDATE:PRIVACY_FALLBACK_PATHS.has(path)?PRIVACY_FALLBACK_CANDIDATE:LOSSLESS_PATHS.has(path)?LOSSLESS_CANDIDATE:FOUNDATION_CANDIDATE}
export function validateFoundation(read){for(const path of FOUNDATION_PATHS)assert.equal(read('HEAD',path),read(foundationSource(path),path),'Foundation source drift: '+path)}
