// Deliberately a bounded record-status monitor, not an efficacy/safety assessment.
// Keep dates and their ACTUAL/ESTIMATED types together. Never infer completion.
const statuses = new Set(['NOT_YET_RECRUITING','RECRUITING','ENROLLING_BY_INVITATION','ACTIVE_NOT_RECRUITING','COMPLETED','SUSPENDED','TERMINATED','WITHDRAWN','UNKNOWN']);
function date(value) {
  if (value == null) return null;
  if (!/^\d{4}-\d{2}(?:-\d{2})?$/.test(value.date || '') || !['ACTUAL','ESTIMATED'].includes(value.type)) throw Error('invalid_source_date');
  return {date:value.date,type:value.type};
}
export function registryLifecycle(data, nctId) {
  const p=data?.protocolSection, identity=p?.identificationModule, status=p?.statusModule, design=p?.designModule;
  if (!/^NCT\d{8}$/.test(nctId||'') || identity?.nctId!==nctId) throw Error('source_identity_not_verified');
  if (!identity.briefTitle || !p.sponsorCollaboratorsModule?.leadSponsor?.name || !statuses.has(status?.overallStatus)
    || !design?.studyType || !Number.isInteger(design.enrollmentInfo?.count) || typeof data.hasResults!=='boolean'
    || !status.lastUpdatePostDateStruct || (data.hasResults && !data.resultsSection)) throw Error('invalid_json');
  return {nctId,title:identity.briefTitle,sponsor:p.sponsorCollaboratorsModule.leadSponsor.name,
    status:status.overallStatus,whyStopped:status.whyStopped||null,phases:design.phases||[],
    enrollment:{count:design.enrollmentInfo.count,type:design.enrollmentInfo.type||null},
    start:date(status.startDateStruct),primaryCompletion:date(status.primaryCompletionDateStruct),completion:date(status.completionDateStruct),
    firstPosted:date(status.studyFirstPostDateStruct),lastUpdated:date(status.lastUpdatePostDateStruct),
    hasResults:data.hasResults,resultsFirstPosted:date(status.resultsFirstPostDateStruct),resultsLastUpdated:date(status.resultsLastUpdatePostDateStruct)};
}
