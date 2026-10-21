// Temporal constraints describe the requested answer, not evidence relevance.
// Preserve named medicines and clinical phrases such as short-acting inhalers.
export function focusedKnowledgeQuery(query){
 return String(query||'').replace(/\b(?:when\s+(?:i(?:'m| am)?|you(?:'re| are)?)\s+)?(?:am\s+|are\s+)?short\s+(?:on|of)\s+time\b/gi,' ').replace(/\b(?:do(?:n['’]t| not) have|haven['’]t got|have (?:very )?little)\s+time\b/gi,' ').replace(/\bin a (?:rush|hurry)\b/gi,' ');
}
