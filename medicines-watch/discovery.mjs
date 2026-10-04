// Read-only search plan for the existing Medicines Watch credibility task.
// Deliberately topic-based: an unknown medicine name must still be discoverable.
export const discoveryTopics = [
 'obesity overweight weight management medicine approval safety withdrawal',
 'obesity GLP-1 GIP glucagon amylin incretin phase trial initiation results discontinued paused',
 'obesity muscle preservation body composition combination oral long acting treatment',
 'obesity specialist indication knee osteoarthritis sleep apnoea MASH COPD menopause trial',
 'obesity medicine peptide early phase first-in-human smaller international developer',
];
export const discoveryDomains = [
 'gov.uk','nice.org.uk','england.nhs.uk','nhs.uk','medicines.org.uk','clinicaltrials.gov',
 'novonordisk.com','lilly.com','amgen.com','zealandpharma.com','roche.com',
 'pfizer.com','vikingtherapeutics.com','structuretx.com','boehringer-ingelheim.com',
 'astrazeneca.com','hansoh.cn','hengrui.com','kailera.com',
 'regeneron.com','scholarrock.com','merck.com','chugai-pharm.co.jp','enveda.com',
 'mbxbio.com','arrowheadpharma.com','lexpharma.com','neurocrine.com',
 'corbuspharma.com','syntis.bio','alveustx.com',
 'siriusrna.com','fractyl.com',
 'artelobio.com',
 'regor.com',
 'abbvie.com','ascletis.com','ternspharma.com',
 'biophytis.com','orsobio.com','neurobiogen.com','sbpgroup.com','lepumedical.com',
 'biomedind.com',
 'antagtherapeutics.com','ganlee.com',
];
// Supply a current date when running; never leave a review month fixed.
export function queriesForDate(date=new Date()) {
 const month=new Intl.DateTimeFormat('en-GB',{month:'long',year:'numeric',timeZone:'UTC'}).format(date);
 return discoveryDomains.map(domain=>({domain,q:`site:${domain} obesity weight management trial approval safety ${month}`}));
}
export function summariseDiscovery(results,checkedAt=new Date().toISOString()) {
 const byDomain=new Map(results.map(r=>[r.domain,r]));
 const missing=discoveryDomains.filter(d=>!byDomain.has(d));
 const failed=discoveryDomains.filter(d=>byDomain.has(d)&&byDomain.get(d).status!=='searched');
 return {checkedAt,scope:'Selected primary-source domains; not exhaustive industry coverage',
  searchedDomains:discoveryDomains.filter(d=>byDomain.get(d)?.status==='searched'),
  missingDomains:missing,failedDomains:failed,scanComplete:missing.length===0&&failed.length===0,
  industryComplete:false,evidenceReviewRequired:true,clinicalApproval:null,
  candidates:results.flatMap(r=>r.status==='searched'?(r.candidates||[]):[])};
}
// Unrestricted topic queries catch unknown developers. Dated AND undated
// attempts stay accountable; selected domains are only an additional aid.
export function topicQueriesForDate(date=new Date()) {
 const day=date.toISOString().slice(0,10);
 return discoveryTopics.flatMap((topic,i)=>[
  {id:`topic-${i}-dated`,topic,date:day,q:`${topic} ${day}`},
  {id:`topic-${i}-undated`,topic,date:null,q:topic},
 ]);
}
export function summariseTopicDiscovery(results,date=new Date()) {
 const plan=topicQueriesForDate(date),byId=new Map(results.map(r=>[r.id,r]));
 const missing=plan.filter(q=>!byId.has(q.id)).map(q=>q.id);
 const failed=plan.filter(q=>byId.has(q.id)&&byId.get(q.id).status!=='searched').map(q=>({id:q.id,outcome:byId.get(q.id).status,error:byId.get(q.id).error||null}));
 return {checkedAt:date.toISOString(),scope:'Topic discovery across unrestricted primary sources; not exhaustive industry coverage',queries:plan.map(q=>({...q,status:byId.get(q.id)?.status||'not_performed'})),missing,failed,scanComplete:!missing.length&&!failed.length,industryComplete:false,clinicalApproval:null,evidenceReviewRequired:true};
}
