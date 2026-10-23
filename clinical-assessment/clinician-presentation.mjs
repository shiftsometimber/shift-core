import {fields} from './compact-schema.mjs';
export const caseLabels={draft:'Pending',awaiting_review:'Pending',in_review:'To action',needs_information:'Referred back',consultation_required:'To action',ready_for_prescription:'Signed off',declined:'Rejected'};
const withheld=new Set(['email','phone','address','postcode','deliveryAddress','deliveryPostcode','gpAddress','gpPostcode','gpName']);
const allowed=new Set(fields.map(f=>f.id).filter(id=>!withheld.has(id)));
export function clinicianAnswers(answers){return Object.fromEntries(Object.entries(answers).filter(([k])=>allowed.has(k)));}
export function questionLabel(key){return fields.find(f=>f.id===key)?.label||key.replaceAll('_',' ');}
