// Original UK authority documents enter the existing owner-review lifecycle.
// Recognising provenance does not approve claims, generate copy or publish.
const rules=[
 {origin:'https://www.gov.uk',path:/^\/drug-safety-update\/[a-z0-9-]+\/?$/,authority:'MHRA',region:'UK'},
 {origin:'https://hansard.parliament.uk',path:/^\/Commons\/\d{4}-\d{2}-\d{2}\/debates\/[a-fA-F0-9-]+\/[A-Za-z0-9-]+\/?$/,authority:'UK Parliament — Hansard',region:'UK'},
 {origin:'https://commonslibrary.parliament.uk',path:/^\/research-briefings\/cbp-\d+\/?$/,authority:'House of Commons Library',region:'UK'}
];
function original(value){try{const u=new URL(value);if(u.username||u.password||u.port||u.search||u.hash)return null;const rule=rules.find(r=>r.origin===u.origin&&r.path.test(u.pathname));return rule?{u,rule}:null}catch{return null}}
export function officialEditorialEvidence({inputUrl,finalUrl,title,body,sourceDate,retrievedAt}){
 const input=original(inputUrl),final=original(finalUrl);
 if(!input||!final||input.rule!==final.rule)return null;
 if(typeof title!=='string'||title.trim().length<10||/access denied|just a moment|sign in|captcha/i.test(title))return null;
 if(typeof body!=='string'||body.trim().length<300)return null;
 if(!/^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(String(sourceDate||''))||!Number.isFinite(Date.parse(sourceDate)))return null;
 if(!Number.isFinite(Date.parse(retrievedAt))||Date.parse(sourceDate)>Date.parse(retrievedAt)+86400000)return null;
 return {source_tier:1,authority:final.rule.authority,publisher:final.rule.authority,title:title.trim(),url:final.u.href,source_date:sourceDate,retrieved_at:retrievedAt,summary:body.trim().slice(0,12000),manual_editorial_intake:true};
}
export function isEditorialIntakeRelevant(text){return /\b(prostate|PSA|testosterone|hypogonadism|blood[- ]?test\w*|cholesterol|HbA1c|Yellow Card|MedSafetyWeek|medicine.?safety)\b/i.test(String(text))}
