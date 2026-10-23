// Draft collection contract. No prescribing rules or production activation.
export const VERSION = 'shift-assessment-v4-draft-2026-10-23';
export function activeQuestion(q, answers) {
  return (!q.paths || q.paths.includes(answers.requestPath)) &&
    (!q.when || q.when[1].includes(answers[q.when[0]]));
}
export function validateAssessment(pack, input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw Error('answers_required');
  const questions = pack.sections.flatMap(s => s.questions);
  const known = new Set(questions.map(q => q.id));
  if (Object.keys(input).some(k => !known.has(k))) throw Error('unexpected_answer');
  const answers = {}, problems = [];
  for (const q of questions) {
    if (!activeQuestion(q, input)) continue;
    const raw = input[q.id];
    if (raw !== undefined && typeof raw !== 'string') { problems.push({field:q.id, error:'text_required'}); continue; }
    const value = (raw || '').trim();
    if (!value && !q.optional) problems.push({field:q.id,error:'answer_required'});
    if (value.length > 20000) problems.push({field:q.id,error:'answer_too_long_use_secure_follow_up'});
    if (value && q.options && !q.options.includes(value)) problems.push({field:q.id,error:'invalid_choice'});
    if (value && q.type === 'date') {
      const date = new Date(value + 'T00:00:00Z');
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(date.getTime()) || date.toISOString().slice(0,10) !== value || value.startsWith('0000')) problems.push({field:q.id,error:'invalid_date'});
    }
    answers[q.id] = value;
  }
  return {version:VERSION,answers,problems,complete:problems.length===0,clinicalApproval:false};
}
export function evidenceRequirements(path, {sidePhotoRequired=false}={}) {
  const kinds = ['photo_id','front_photo','scale_photo'];
  if (['Switching provider or medicine','Restarting after a break','Repeat treatment'].includes(path)) kinds.push('prescription');
  if (sidePhotoRequired) kinds.push('side_photo');
  return kinds;
}
export function missingEvidence(path, evidence, policy) {
  return evidenceRequirements(path,policy).filter(kind => !evidence.some(e => e.kind === kind && e.state !== 'rejected'));
}
export const releaseRequirements = Object.freeze([
  'prescriber_approved_questionnaire_and_rules',
  'prescriber_approved_independent_verification',
  'partner_accepted_payment_before_assessment_contract',
  'documented_data_roles_lawful_basis_and_retention',
  'private_storage_and_member_access_verified',
  'real_partner_sandbox_handover_verified',
  'hosted_stripe_payment_refund_and_duplicate_tests_passed',
  'deployed_member_journey_verified',
]);
export function releaseReadiness(receipts={}) {
  const missing=releaseRequirements.filter(key=>receipts[key]!==true);
  return {ready:missing.length===0,missing};
}
