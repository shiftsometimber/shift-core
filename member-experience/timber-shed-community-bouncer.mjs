import {suggestsPrivateDetails} from './timber-shed-privacy-signals.mjs';
// SHIFT Community Bouncer: deterministic, explainable pre-publication triage.
// This is not a clinical assessment, diagnosis, crisis detector, or an external AI service.
// No My Timber health/profile records, third-party model calls or auto-publication.
export const BOUNCER_VERSION='bouncer-rules-2026-10-22-v3';
export const BOUNCER_NAME='SHIFT Community Bouncer';
export const BOUNCER_TAGLINE="Everyone’s welcome. Hassle isn’t.";
const RULES=[
 {category:'immediate-safety',severity:'critical',patterns:[
  /\b(?:i am|i'm|im|i feel like)\s+(?:going to|about to|planning to)\s+(?:kill myself|end my life|hurt myself|take my own life)\b/i,
  /\b(?:suicide|kill myself|end my life)\s+(?:tonight|today|right now|soon)\b/i,
  /\b(?:i have|i've)\s+(?:taken an overdose|overdosed|hurt myself)\b/i
 ]},
 {category:'self-harm',severity:'high',patterns:[
  /\b(?:suicid(?:e|al)|self[ -]?harm|kill myself|end my life|want to die|overdose)\b/i,
  /\b(?:cutting myself|hurting myself)\b/i
 ]},
 {category:'eating-disorder',severity:'high',patterns:[
  /\b(?:anorexi(?:a|c)|bulimi(?:a|c)|binge[ -]?purge|purging|starv(?:e|ing|ation))\b/i,
  /\b(?:make myself sick|stop eating altogether|how to purge)\b/i
 ]},
 {category:'medication-trading',severity:'high',patterns:[
  /\b(?:sell(?:ing)?|buy(?:ing)?|swap(?:ping)?|trade|trading|supply|supplying|give\s+away|for\s+sale|available\s+for\s+purchase|dm\s+me|message\s+me|contact\s+me)\b.{0,100}\b(?:mounjaro|wegovy|ozempic|testosterone|steroid(?:s)?|peptide(?:s)?|pen(?:s)?|jab(?:s)?|injection(?:s)?|medicine(?:s)?|medication|prescription(?:s)?)\b/i,
  /\b(?:mounjaro|wegovy|ozempic|testosterone|peptide(?:s)?|pen(?:s)?|jab(?:s)?|injection(?:s)?|medicine(?:s)?|medication|prescription(?:s)?)\b.{0,100}\b(?:for\s+sale|selling|buy\s+now|swap|trade|spare|leftover|supplier|vendor|dm\s+me|message\s+me|contact\s+me)\b/i,
  /\b(?:spare|leftover)\s+(?:(?:mounjaro|wegovy|ozempic|prescription)\s+)?(?:pen|pens|injection|injections|jab|jabs)\b.{0,65}(?:£\s*\d+|\b(?:dm|message|buy|sale|offer|available)\b)/i,
  /\b(?:peptide|peptides|research\s+peptide|research\s+peptides)\b.{0,90}(?:£\s*\d+|\b(?:order|vendor|supplier|ship|purchase|discount|dm\s+me|message\s+me)\b)/i,
  /\b(?:research\s+use\s+only|not\s+for\s+human\s+consumption|unlicensed|unapproved|investigational|clinical\s+trial|trial[- ]stage)\b.{0,100}\b(?:for\s+sale|buy|sell|supplier|vendor|order|ship|purchase|discount|dm\s+me)\b/i,
  /\b(?:for\s+sale|buy|sell|supplier|vendor|order|ship|purchase|discount|dm\s+me)\b.{0,100}\b(?:research\s+use\s+only|not\s+for\s+human\s+consumption|unlicensed|unapproved|investigational|clinical\s+trial|trial[- ]stage)\b/i
 ]},
 {category:'investigational-treatment',severity:'review',patterns:[
  /\b(?:investigational|clinical\s+trial|trial[- ]stage|research\s+use\s+only|not\s+for\s+human\s+consumption|unlicensed\s+peptide(?:s)?)\b/i
 ]},
 {category:'medication',severity:'high',patterns:[
  /\b(?:double|triple|increase|change|skip)\s+(?:my|your|the)?\s*(?:dose|dosage|injection|jab)\b/i,
  /\b(?:take|inject|use)\s+\d+(?:\.\d+)?\s*(?:mg|ml)\b/i,
  /\b(?:buy|sell|share)\s+(?:prescription|mounjaro|wegovy|medication|medicine)\b/i
 ]},
 {category:'substance-use',severity:'high',patterns:[
  /\b(?:withdrawal|detox|relapse|overdose|heroin|cocaine|opioid|addiction)\b/i
 ]},
 {category:'harassment',severity:'high',patterns:[
  /\b(?:i will|i'll|im going to|i'm going to)\s+(?:hurt|attack|kill|find)\s+(?:you|them|him|her)\b/i,
  /\b(?:you should die|kill yourself|go kill yourself)\b/i
 ]},
 {category:'personal-information',severity:'high',patterns:[
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
  /(?:\+44\s?|0)7\d{3}[\s-]?\d{6}\b/,
  /\b(?:my|our)\s+(?:address|postcode|nhs number|medical record number)\s*(?:is|:)\b/i,
  /\b(?:https?:\/\/|www\.)\S+/i
 ]},
 {category:'unsafe-weight-advice',severity:'high',patterns:[
  /\b(?:lose|drop)\s+\d+\s*(?:kg|lbs|pounds|stone)\s+(?:in|per)\s+(?:a|one|1|two|2)\s+(?:day|week)\b/i,
  /\b(?:fast|starve|purge)\s+(?:for|to)\s+(?:days|lose weight)\b/i
 ]},
 {category:'mental-wellbeing',severity:'review',patterns:[
  /\b(?:depress(?:ed|ion)|panic attack|anxiet(?:y|ies)|therapy|counsell(?:or|ing)|mental health)\b/i
 ]}
];
const severityRank={routine:0,review:1,high:2,critical:3};
const PRIORITY={routine:3,review:2,high:1,critical:0};
const GUIDANCE={
 'immediate-safety':'Possible immediate safety concern: keep private, prioritise trained safeguarding review. Automated screening cannot assess urgency.',
 'self-harm':'Possible self-harm concern: hold privately for trained safeguarding review.',
 'eating-disorder':'Possible eating-disorder content: specialist-informed human review required.',
 'medication-trading':'Possible medication or investigational-product trading, sourcing or promotion. Hold privately; do not publish. Deliberate trading is grounds for a ban after human review.',
 'investigational-treatment':'Discussion of an investigational or unlicensed product. Review context; neutral factual research discussion is not automatically a breach.',
 'medication':'Possible treatment or dosage discussion: do not treat as clinical advice; refer clinical questions to the treating provider.',
 'substance-use':'Possible substance-use concern: specialist-informed human review required.',
 'harassment':'Potential threatening or abusive language: review before any publication.',
 'personal-information':'Potential identifying or contact information: hold and request safer wording.',
 'unsafe-weight-advice':'Potential unsafe weight-loss guidance: hold for review.',
 'mental-wellbeing':'Sensitive wellbeing subject: consider context and avoid clinical advice.'
};
export function screenForumText({title='',body=''}={}){
 if(typeof title!=='string'||typeof body!=='string')throw Error('invalid_content');
 const content=[title,body].join('\n').slice(0,1600);
 const categories=[],reasons=[];let severity='routine';
 for(const rule of RULES){
  if(rule.patterns.some(pattern=>pattern.test(content))){
   categories.push(rule.category);
   reasons.push(GUIDANCE[rule.category]);
   if(severityRank[rule.severity]>severityRank[severity])severity=rule.severity;
  }
 }
 if(suggestsPrivateDetails(content)&&!categories.includes('personal-information')){categories.push('personal-information');reasons.push(GUIDANCE['personal-information']);if(severityRank.high>severityRank[severity])severity='high'}
 // Ambiguity is a reason to escalate, not proof of a condition or wrongdoing.
 return Object.freeze({
  policyVersion:BOUNCER_VERSION,
  severity,
  priority:PRIORITY[severity],
  categories:Object.freeze(categories),
  reasons:Object.freeze(reasons),
  recommendation:severity==='routine'?'human-review':severity==='review'?'sensitive-human-review':'hold-for-specialist-review',
  mayAutoPublish:false,
  requiresHumanApproval:true,
  requiresSafeguardingSignoff:severity==='high'||severity==='critical'
 });
}
export function bouncerSubmissionNotice(result){
 if(result?.severity==='critical')return 'Your message is held privately for review. This is not an emergency service and nobody may see it immediately. If you or someone else is in immediate danger, call 999. For urgent NHS help, use NHS 111. Samaritans: 116 123.';
 if(result?.severity==='high')return 'Your message is held privately for specialist-informed human review. This community cannot provide medical or crisis support. For immediate danger call 999; for urgent NHS advice use 111.';
 return 'Submitted privately for moderation. Not visible to other members.';
}
