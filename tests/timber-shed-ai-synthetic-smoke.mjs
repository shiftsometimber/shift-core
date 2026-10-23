// Synthetic-only smoke test for SHIFT Community Bouncer.
// NEVER pass member posts, credentials, health records, or real names.
// The key must be supplied securely as a local process environment secret.
// Does not change Cloudflare, production feature flags, accounts or member data.
import {classifyForumSubmissionWithModel,AI_MODERATION_MODEL} from '../member-experience/timber-shed-ai-moderation.mjs';
import {screenForumText} from '../member-experience/timber-shed-community-bouncer.mjs';

const FIXTURES=Object.freeze([
 {id:'everyday-chat',title:'Fictional chat example',body:'A fictional member enjoys a walk and a cup of tea after work.'},
 {id:'medicine-trading',title:'Fictional rule violation',body:'Fictional example: I have a spare prescription pen for sale. Contact me.'},
 {id:'privacy-warning',title:'Fictional privacy example',body:'Fictional example: I was thinking about sharing my home address in a public forum.'}
]);

export async function runSyntheticSmoke(key, classify=classifyForumSubmissionWithModel){
 if(typeof key!=='string'||!key.trim())return {ok:false,error:'dedicated_api_key_missing'};
 const results=[];
 for(const item of FIXTURES){
  const local=screenForumText(item);
  const model=await classify({title:item.title,body:item.body},{
   TIMBER_SHED_AI_MODERATION_ENABLED:'true',
   TIMBER_SHED_AI_PROVIDER_APPROVED:'true', // Only this isolated fictional-text smoke invocation.
   TIMBER_SHED_AI_MODERATION_KEY:key
  });
  if(!model?.ok)return {ok:false,error:'provider_test_failed',completed:results.length};
  results.push({
   fixture:item.id,
   localSeverity:local.severity,
   modelSeverity:model.severity,
   model:model.model,
   requiresHumanApproval:model.requiresHumanApproval,
   mayAutoPublish:model.mayAutoPublish
  });
 }
 return {ok:true,model:AI_MODERATION_MODEL,syntheticOnly:true,results};
}

if(process.argv[1]&&import.meta.url===new URL('file://'+process.argv[1]).href){
 if(process.argv.includes('--help')){
  console.log('Synthetic-only moderation connectivity check. Set TIMBER_SHED_AI_MODERATION_KEY securely in the local environment, then run: node tests/timber-shed-ai-synthetic-smoke.mjs --synthetic-only');
 }else if(!process.argv.includes('--synthetic-only')){
  console.error('BLOCKED: explicitly pass --synthetic-only. No provider request made.');
  process.exitCode=2;
 }else{
  const result=await runSyntheticSmoke(process.env.TIMBER_SHED_AI_MODERATION_KEY);
  // Print classifications only, never raw text, API keys or provider responses.
  console.log(JSON.stringify(result));
  if(!result.ok)process.exitCode=2;
 }
}
