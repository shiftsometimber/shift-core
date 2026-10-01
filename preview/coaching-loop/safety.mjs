// A conservative output boundary for synthetic tests, NOT medical triage.
// The help panel is always available even if these finite checks miss a message.
const medical=/\b(dos(?:e|age|ing)|mg|diagnos\w*|side[ -]?effects?|symptoms?|pancreati\w*|gallbladder|dehydrat\w*|pregnan\w*|contracepti\w*|vomit\w*|faint\w*|chest pain|abdominal pain|stomach pain|blood in|eligib\w*|prescrib\w*|taper\w*|restart\w*)\b/i;
const crisis=/\b(suicid\w*|kill myself|end my life|hurt myself|self[ -]?harm|can't go on|cannot go on|better off dead)\b/i;
const eating=/\b(purg\w*|make myself sick|making myself sick|barely eaten|not eaten for|haven't eaten for|starv\w*)\b/i;
const minor=/\b(?:i(?:'m| am)\s+(?:[0-9]|1[0-7])\s*(?:years? old|yo)?|under\s*18)\b/i;
export const helpPanel=Object.freeze({title:'Get the right help',text:'Shift AI can help with everyday plans. It cannot assess symptoms or make medicine decisions. Nobody is monitoring this chat, and saving a message does not send it to a clinician.',links:[{label:'Contact your own prescriber or GP',url:'https://www.nhs.uk/nhs-services/gps/'},{label:'NHS 111 — England',url:'https://www.nhs.uk/nhs-services/urgent-and-emergency-care-services/when-to-use-111/'},{label:'Urgent mental-health help — England',url:'https://www.nhs.uk/nhs-services/mental-health-services/where-to-get-urgent-help-for-mental-health/'},{label:'Emergency help',url:'https://www.nhs.uk/nhs-services/urgent-and-emergency-care-services/when-to-call-999/'},{label:'Scotland: NHS 24',url:'https://www.nhs24.scot/'},{label:'Wales: NHS 111 Wales',url:'https://111.wales.nhs.uk/'},{label:'Northern Ireland: health services',url:'https://www.nidirect.gov.uk/articles/health-service-useful-numbers'}]});
export function boundary(message){
 if(typeof message!=='string'||message.length>2000)throw Object.assign(Error('invalid_message'),{status:400});
 if(minor.test(message))return{kind:'adult_service',coaching:false,text:'My Timber coaching is for adults. Please speak with a parent, guardian or a healthcare professional.',help:helpPanel};
 if(crisis.test(message)||eating.test(message)||medical.test(message))return{kind:'support',coaching:false,help:helpPanel};
 return{kind:'coaching',coaching:true};
}
