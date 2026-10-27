// Dedicated moderation-model adapter for SHIFT Community Bouncer.
// Default off. Never send member-authored text to a third party without an explicit
// provider-approval gate and server-side secret. No My Timber records are read.
export const AI_MODERATION_POLICY='bouncer-omni-2026-10-22-v1';
export const AI_MODERATION_MODEL='omni-moderation-latest';
const ENDPOINT='https://api.openai.com/v1/moderations';
const CATEGORY_RISK={
 'self-harm/intent':'critical','self-harm/instructions':'critical',
 'self-harm':'high','violence/graphic':'high','violence':'high',
 'harassment/threatening':'high','hate/threatening':'high',
 'sexual/minors':'high','illicit/violent':'high',
 'hate':'review','harassment':'review','sexual':'review','illicit':'review'
};
const rank={routine:0,review:1,high:2,critical:3};
const priority={routine:3,review:2,high:1,critical:0};
const invalid=()=>({ok:false,error:'model_unavailable',requiresHumanApproval:true,mayAutoPublish:false});
export function parseModerationResult(payload){
 if(!payload||typeof payload!=='object'||!Array.isArray(payload.results)||payload.results.length!==1)return invalid();
 if(typeof payload.model!=='string'||!payload.model.startsWith('omni-moderation-'))return invalid();
 const result=payload.results[0];
 if(!result||typeof result.flagged!=='boolean'||!result.categories||typeof result.categories!=='object'||Array.isArray(result.categories))return invalid();
 const categories=[];let severity='routine';
 for(const [name,value] of Object.entries(result.categories)){
  if(typeof value!=='boolean')return invalid();
  if(value){categories.push(name);const next=CATEGORY_RISK[name]||'high';if(rank[next]>rank[severity])severity=next}
 }
 if(result.flagged&&severity==='routine')severity='high'; // Unknown flagged category is never silently ignored.
 return Object.freeze({ok:true,policyVersion:AI_MODERATION_POLICY,model:payload.model,severity,priority:priority[severity],categories:Object.freeze(categories),flagged:result.flagged,requiresHumanApproval:true,mayAutoPublish:false});
}
export async function classifyForumSubmissionWithModel({title='',body=''},env,fetcher=fetch){
 // This is a DATA-SHARING authorisation gate, separate from the forum feature flags.
 // Do not call a provider if the privacy, contractual and pilot permissions are absent.
 if(env.TIMBER_SHED_AI_MODERATION_ENABLED!=='true'||env.TIMBER_SHED_AI_PROVIDER_APPROVED!=='true')return {ok:false,error:'model_not_authorised'};
 if(typeof env.TIMBER_SHED_AI_MODERATION_KEY!=='string'||!env.TIMBER_SHED_AI_MODERATION_KEY)return invalid();
 if(typeof title!=='string'||typeof body!=='string'||title.length>100||body.length>1000)return {ok:false,error:'invalid_content'};
 const controller=new AbortController();
 const timeout=setTimeout(()=>controller.abort(),4500);
 try{
  const response=await fetcher(ENDPOINT,{
   method:'POST',
   headers:{Authorization:'Bearer '+env.TIMBER_SHED_AI_MODERATION_KEY,'Content-Type':'application/json'},
   body:JSON.stringify({model:AI_MODERATION_MODEL,input:(title?title+'\n':'')+body}),
   signal:controller.signal
  });
  if(!response.ok)return invalid();
  const result=await response.json();
  return parseModerationResult(result);
 }catch{return invalid()}
 finally{clearTimeout(timeout)}
}
export function mergeModerationSignals(rules,model){
 if(!rules||!model?.ok)return {ok:false,error:'model_unavailable',mayAutoPublish:false};
 const severity=rank[rules.severity]>=rank[model.severity]?rules.severity:model.severity;
 return Object.freeze({
  ok:true,severity,priority:priority[severity],
  categories:Object.freeze([...new Set([...rules.categories,...model.categories.map(x=>'model:'+x)])]),
  policyVersion:rules.policyVersion+'+'+model.policyVersion,
  model:model.model,
  mayAutoPublish:false,
  requiresHumanApproval:true,
  requiresSafeguardingSignoff:severity==='high'||severity==='critical'
 });
}
