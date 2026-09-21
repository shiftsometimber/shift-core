// Bounded primary-source evidence, checked 21 September 2026. No personalised
// permission, dose advice or assumption that an unspecified jab is a GLP-1.
const food=/\b(eat|eating|food|meal|chocolate|sweets|kebab|takeaway|pizza|burger|breakfast|lunch|dinner)\b/i;
const injection=/\b(jab|injection|inject|pen)\w*\b/i;
const named=/\b(mounjaro|tirzepatide|wegovy|ozempic|semaglutide|saxenda|liraglutide|insulin|vaccin\w*|flu|covid|b12)\b/i;
export function foodInjectionClarification(message){
 if(!food.test(message)||!injection.test(message)||named.test(message))return null;
 return {answer:'Which jab do you mean? Tell me its name so I can answer your food question using the right information, rather than assume which injection you have had.',keyPoints:[],nextSteps:['Add the name of the injection to your question.'],followUps:[],sources:[],limitations:'The injection has not been identified. No individual food or medicine advice has been given.'};
}
export function reviewedFoodEvidence(message){
 if(!food.test(message))return [];
 const sources=[];
 if(/\b(mounjaro|tirzepatide)\b/i.test(message))sources.push({title:'Cambridge University Hospitals: food with tirzepatide (Mounjaro)',url:'https://www.cuh.nhs.uk/patient-information/your-obesity-treatment-tirzepatide-mounjaro/',content:'Tirzepatide can be injected with or without food. For nausea, the NHS hospital advises bland, low-fat foods, slow eating and stopping when full. Eating less fatty or spicy food may also help heartburn. This is general guidance, not a guarantee that a particular food will suit an individual. The leaflet does not give chocolate-specific permission or a waiting time after an injection.'});
 if(/\b(wegovy|ozempic|semaglutide)\b/i.test(message))sources.push({title:'NHS: food and drink with semaglutide',url:'https://www.nhs.uk/medicines/semaglutide/',content:'NHS guidance says to follow a healthy, balanced diet while using semaglutide. The page was reviewed on 15 May 2026. It does not give chocolate-specific permission or a waiting time after an injection. Check the product leaflet or ask a pharmacist for questions that depend on individual treatment.'});
 return sources.map(s=>({title:s.title,content:s.content,authority:90,reviewState:'verified',citation:s.url,provenance:[{ref:s.url}],limitations:'Primary source checked 21 September 2026. General food guidance; not an individual assessment.'}));
}
