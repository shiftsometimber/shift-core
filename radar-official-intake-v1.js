// Official-source intake remains preparation only; owner approval/publication are separate.
const SOURCES=[
 {host:'www.gov.uk',path:/^\/drug-safety-update\//,authority:'MHRA'},
 {host:'hansard.parliament.uk',path:/^\/Commons\/\d{4}-\d{2}-\d{2}\/debates\//i,authority:'UK Parliament'},
 {host:'commonslibrary.parliament.uk',path:/^\/research-briefings\//,authority:'House of Commons Library'},
];
export function officialIntakeAuthority(value){
 let u;try{u=new URL(value)}catch{return null}
 if(u.protocol!=='https:'||u.username||u.password||(u.port&&u.port!=='443'))return null;
 return SOURCES.find(s=>u.hostname===s.host&&s.path.test(u.pathname))?.authority||null;
}
export function officialIntakeDate(html,date){
 if(!date)throw Error('source_date_required');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date))throw Error('source_date_invalid');
 const d=new Date(date+'T00:00:00Z');if(!Number.isFinite(d.getTime())||d.toISOString().slice(0,10)!==date)throw Error('source_date_invalid');
 const visible=new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(d);
 const text=String(html).replace(/<[^>]+>/g,' ').replace(/&nbsp;|&#160;/g,' ').replace(/\s+/g,' ');
 if(!text.includes(visible)&&!String(html).includes(date))throw Error('source_date_not_found');
 return date;
}
export function officialIntakeRelevant(authority,title,body){
 return Boolean(authority)&&/\b(prostate|PSA|blood[- ]test|testosterone|men['’]?s health|cholesterol|Yellow Card|MedSafetyWeek|suspected side effects)\b/i.test(title+' '+body);
}
