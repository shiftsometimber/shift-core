import {schema,fields} from './compact-schema.mjs';
export const caseLabels={draft:'Pending',awaiting_review:'Pending',in_review:'To action',needs_information:'Referred back',consultation_required:'To action',ready_for_prescription:'Signed off',declined:'Rejected'};
const withheld=new Set(['email','phone','address','postcode','deliveryAddress','deliveryPostcode','gpAddress','gpPostcode','gpName']);
const allowed=new Set(fields.map(f=>f.id).filter(id=>!withheld.has(id)));
export function clinicianAnswers(answers){return Object.fromEntries(Object.entries(answers).filter(([k])=>allowed.has(k)));}
export function questionLabel(key){return fields.find(f=>f.id===key)?.label||key.replaceAll('_',' ');}
export function questionnaireSnapshot(){return {schemaVersion:schema.version,questions:fields.map(({id,label,items,options})=>({id,label,...items?{items}:{},...options?{options}:{}}))};}
export function questionnaireContext(assessment){
 let declarations;try{declarations=JSON.parse(assessment.declarations_json||'{}');}catch{declarations={};}
 const saved=declarations.questionnaire;
 const matched=saved?.schemaVersion===assessment.schema_version&&Array.isArray(saved.questions);
 const source=matched?saved:assessment.schema_version===schema.version?questionnaireSnapshot():null;
 return {schemaVersion:assessment.schema_version,status:matched?'submitted_snapshot':source?'catalogue_reference':'unavailable',questions:source?source.questions.filter(q=>allowed.has(q.id)):[]};
}
