// Narrow positive recognition, not absence-of-risk classification or a safety guarantee.
// Unrecognised wording remains pending. No external provider or member profile reads.
import {BOUNCER_VERSION} from './timber-shed-community-bouncer.mjs';
export const ROUTINE_PUBLICATION_VERSION='shed-routine-publication-2026-10-23-v1';
const titles=[/^(?:hello|hi)(?: everyone| all)?$/,/^(?:a )?small win(?: today| this week)?$/,/^weekend plans$/,/^how was your weekend$/,/^what are you looking forward to this weekend$/,/^(?:a )?walk(?: today| this week)?$/,/^getting outside$/,/^(?:thank you|thanks everyone)$/];
const sentences=[
 /^(?:hello|hi)(?: everyone| all)?$/,
 /^(?:i|we) (?:went|am going|are going|got out) for a(?: short| lunchtime| morning| evening)? walk(?: today| yesterday| this morning| this afternoon| this evening| this weekend)?$/,
 /^(?:i|we) (?:enjoyed|enjoy) (?:a|the) (?:walk|fresh air|weekend)$/,
 /^it (?:felt|feels) good to get outside$/,
 /^made time for a(?: lunchtime| short)? walk(?: today| this week)?$/,
 /^(?:a walk|a decent brew|a walk and a decent brew)(?: and a bit of time with the family)?$/,
 /^what have you got planned$/,
 /^what are you looking forward to this weekend$/,
 /^(?:well done|thank you|thanks)(?: everyone| for sharing| for the support)?$/,
 /^(?:that|this|it) sounds like a (?:good|great|lovely) plan$/,
 /^sounds like a (?:good|great|lovely) plan$/,
 /^hope you (?:all )?have a (?:good|great|lovely) weekend$/,
 /^looking forward to the weekend$/,
 /^keeping it simple this weekend$/,
 /^one small step at a time$/
];
export function routinePublicationDecision(input,screening){
 const hold={publish:false,policyVersion:ROUTINE_PUBLICATION_VERSION,reason:'unrecognised_or_sensitive'};
 if(!screening||screening.policyVersion!==BOUNCER_VERSION||screening.severity!=='routine'||screening.categories?.length!==0)return hold;
 if(typeof input?.body!=='string'||(input.title!==undefined&&typeof input.title!=='string'))return hold;
 const raw=[input.title||'',input.body].join('\n');
 // Non-ASCII, numbers, markup, URL punctuation or unusual separators are never normalised into approval.
 if(!/^[A-Za-z ,.!?\n]+$/.test(raw)||input.body.length>1000)return hold;
 const normal=s=>s.toLowerCase().trim().replace(/\s+/g,' ');
 if(input.title!==undefined&&!titles.some(p=>p.test(normal(input.title))))return hold;
 const parts=input.body.split(/[.!?]+/).map(normal).filter(Boolean);
 if(parts.length<1||parts.length>5||!parts.every(s=>sentences.some(p=>p.test(s))))return hold;
 return {publish:true,policyVersion:ROUTINE_PUBLICATION_VERSION,reason:'recognised_everyday_message'};
}
