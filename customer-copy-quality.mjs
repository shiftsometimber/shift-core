// Publication validation only: never strip customer questions or clinical text.
const internalPatterns=[
 /\b(?:price|pricing|amount)\s+(?:(?:is|are)\s+)?(?:still\s+)?being\s+finali[sz]ed\b/i,
 /\b(?:TODO|FIXME)\s*[:\u2013\u2014-]/i,
 /\b(?:internal|editorial|developer)\s+(?:note|reminder|question)\s*:/i,
 /\[(?:insert|placeholder|add source|confirm with|TBC)\b[^\]]*\]/i,
 /\b(?:confirm|agree)\s+with\s+(?:the\s+)?(?:partner|supplier|developer|clinical lead)\b/i,
 /\b(?:checkout|website|page|form)\s+must\s+(?:state|explain|include|show)\b/i,
 /\b(?:fee|fees|refund conditions|arrangements|scope)\b[^.!?\n]{0,80}\bmust\s+be\s+(?:stated|agreed|confirmed)\b/i,
 /\b(?:awaiting|needs)\s+(?:internal\s+|partner\s+|editorial\s+)?(?:approval|sign-off)\b/i,
];
export function customerCopyIssues(value){
 const text=Array.isArray(value)?value.join('\n'):String(value??'');
 return internalPatterns.some(pattern=>pattern.test(text))?['internal_working_copy']:[];
}
