// Keep only the origin of the five explicitly requested AI services. Paths,
// prompts, fragments, query strings and all other referrers remain withheld.
export function safeAiReferrer(raw){
 try{const u=new URL(raw),h=u.hostname.toLowerCase();if(u.protocol!=='https:')return '';
  if(['chat.openai.com','chatgpt.com','perplexity.ai','gemini.google.com','copilot.microsoft.com'].includes(h))return 'https://'+h+'/';
 }catch{}
 return '';
}
// Google and Bing traffic cannot be distinguished from Direct if every
// consented page view has an empty referrer. Retain only a recognised HTTPS
// search origin on already-permitted public pages; never transmit query, path,
// fragment or a referrer from an unknown site.
export function safeSearchOrigin(raw){
 try{
  const u=new URL(raw),h=u.hostname.toLowerCase();
  if(u.protocol!=='https:')return '';
  if(['google.com','www.google.com','google.co.uk','www.google.co.uk','bing.com','www.bing.com'].includes(h))return 'https://'+h+'/';
 }catch{}
 return '';
}
export function repairAnalytics(script){
 const before="page_referrer:''";
 if(script.split(before).length!==2)return script;
 const expression='(('+safeAiReferrer.toString()+')(document.referrer)||('+safeSearchOrigin.toString()+')(document.referrer))';
 // This expression stays inside the existing permitted-page + analytics-
 // consent gate, immediately before the existing single tag-manager load.
 return script.replace(before,'page_referrer:'+expression);
}
