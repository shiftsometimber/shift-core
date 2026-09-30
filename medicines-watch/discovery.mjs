// Read-only search plan for the existing Medicines Watch credibility task.
// Deliberately topic-based: an unknown medicine name must still be discoverable.
export const discoveryTopics = [
 'obesity overweight weight management medicine approval safety withdrawal',
 'obesity GLP-1 GIP glucagon amylin incretin phase trial initiation results discontinued paused',
 'obesity muscle preservation body composition combination oral long acting treatment',
];
export const discoveryDomains = [
 'gov.uk','nice.org.uk','england.nhs.uk','nhs.uk','medicines.org.uk','clinicaltrials.gov',
 'novonordisk.com','lilly.com','amgen.com','zealandpharma.com','roche.com',
 'pfizer.com','vikingtherapeutics.com','structuretx.com','boehringer-ingelheim.com',
 'astrazeneca.com','hansoh.cn','hengrui.com','kailera.com',
 'regeneron.com','scholarrock.com','merck.com',
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
