// Supplementary privacy screening for member-authored forum text.
// Pattern matching is only triage: it cannot guarantee detection or assess intent.
export function suggestsPrivateDetails(text){
 if(typeof text!=='string')return false;
 return /\b(?:share|sharing|post|posting|publish|publishing|give out|send|sending)\b.{0,60}\b(?:my|our|their|his|her)\s+(?:(?:home|full|street|personal)\s+)?(?:address|postcode|phone(?: number)?|mobile(?: number)?|nhs number|medical record number)\b/i.test(text)
  || /\b(?:my|our|their|his|her)\s+(?:home|full|street)\s+(?:address|postcode)\b.{0,60}\b(?:online|public|post|share)\b/i.test(text);
}
