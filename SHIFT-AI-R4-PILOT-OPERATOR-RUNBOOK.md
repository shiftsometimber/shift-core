# Shift AI R4 pilot operator runbook

## Status

Readiness only. No member is enabled by this checkpoint. The control row defaults to off and the Worker master flag must also be explicitly enabled before any pilot request can run.

Authorised candidate: R4 commit `1785d57b7bb840b491213347b6bebf5d7e218897` plus the pilot-readiness control commit that contains this runbook.

Consent version: `shift-ai-r4-pilot-consent-v1`.

## Control design

All conditions must pass:

1. Worker master binding `SHIFT_AI_R4_PILOT_ENABLED` is exactly `true`.
2. Existing model binding `SHIFT_TODAY_MODEL_ENABLED` is not `true`.
3. D1 control row `shift_ai_pilot_control.id=1` is enabled, in phase 1 or 2, uses the exact consent version and has a valid maximum 14-day window.
4. Phase 1 has an exact limit of five active members. Phase 2 has an exact limit of ten.
5. The authenticated member has an active, time-bounded access row for the current phase.
6. Consent timestamp, version, evidence reference and activating operator are present.

Failure of any condition blocks bootstrap, proposal and confirmation. No new route or HQ control surface exists.

## One-action kill-switch

This single D1 statement immediately stops the pilot, including confirmation of already-pending proposals:

```sql
UPDATE shift_ai_pilot_control
SET enabled=0,
    stopped_at=CURRENT_TIMESTAMP,
    stop_reason='REPLACE_WITH_INCIDENT_REFERENCE',
    updated_at=CURRENT_TIMESTAMP
WHERE id=1;
```

The Worker master binding is an independent second kill. Either control being off blocks access.

The automated evaluation proves that the one-statement D1 kill blocks bootstrap, new proposals and pending confirmation without writing to My Timber.

## Pre-pilot approval checklist

- [ ] Pilot-readiness commit reviewed and approved.
- [ ] No other Shift AI version is deployed.
- [ ] Final privacy/legal review completed for health and other special-category data.
- [ ] Every TBC in the consent wording replaced.
- [ ] Consent and privacy wording supplied before agreement.
- [ ] Withdrawal is as easy as joining and has a named daily owner.
- [ ] Five phase-one member IDs selected without adding anyone else.
- [ ] Model binding independently verified off.
- [ ] Global D1 kill statement tested against the exact candidate environment.
- [ ] Worker master flag tested off.
- [ ] Audit queries tested.
- [ ] Incident owner and backup named.
- [ ] Daily review time booked for all 14 days.

## Configure the pilot while still off

Use explicit UTC timestamps. The entire control window must not exceed 14 days.

```sql
UPDATE shift_ai_pilot_control
SET enabled=0,
    phase=1,
    max_members=5,
    consent_version='shift-ai-r4-pilot-consent-v1',
    starts_at='REPLACE_WITH_UTC_START',
    ends_at='REPLACE_WITH_UTC_END',
    stopped_at=NULL,
    stop_reason=NULL,
    updated_at=CURRENT_TIMESTAMP
WHERE id=1;
```

Do not enable the control yet.

## Record an invitation and consent

Create the member as invited first. Do not use names, email addresses or free-text health information as the evidence reference.

```sql
INSERT INTO shift_ai_pilot_access(
  user_id,status,cohort,consent_version,consented_at,
  consent_evidence_ref,starts_at,ends_at,activated_by
) VALUES(
  REPLACE_MEMBER_ID,'invited',1,'shift-ai-r4-pilot-consent-v1',
  'REPLACE_CONSENT_UTC','REPLACE_MINIMISED_EVIDENCE_REFERENCE',
  'REPLACE_MEMBER_UTC_START','REPLACE_MEMBER_UTC_END','REPLACE_OPERATOR_ID'
);
```

Verify the evidence and exact wording version, then activate only that member:

```sql
UPDATE shift_ai_pilot_access
SET status='active',updated_at=CURRENT_TIMESTAMP
WHERE user_id=REPLACE_MEMBER_ID
  AND status='invited'
  AND consent_version='shift-ai-r4-pilot-consent-v1'
  AND consented_at IS NOT NULL
  AND consent_evidence_ref IS NOT NULL
  AND activated_by IS NOT NULL;
```

Count the cohort before enabling the pilot:

```sql
SELECT cohort,status,COUNT(*) AS members
FROM shift_ai_pilot_access
GROUP BY cohort,status
ORDER BY cohort,status;
```

## Enable phase 1

Only after every checklist item is complete:

1. Verify `SHIFT_TODAY_MODEL_ENABLED` is off.
2. Set the Worker master pilot binding to true through the approved secure configuration process.
3. Enable the D1 control:

```sql
UPDATE shift_ai_pilot_control
SET enabled=1,updated_at=CURRENT_TIMESTAMP
WHERE id=1
  AND phase=1
  AND max_members=5
  AND consent_version='shift-ai-r4-pilot-consent-v1';
```

## Daily audit review

Every day, inspect at minimum:

```sql
SELECT event_name,outcome,COUNT(*) AS events
FROM shift_ai_today_audit
WHERE created_at>=datetime('now','-1 day')
GROUP BY event_name,outcome
ORDER BY event_name,outcome;
```

```sql
SELECT proposal_id,user_id,event_name,outcome,local_date,created_at,result_json
FROM shift_ai_today_audit
WHERE created_at>=datetime('now','-1 day')
  AND (
    outcome IN ('urgent','clinical','catalogue_or_no_guilt_revalidation_failed','incomplete','read_error')
    OR event_name='pilot_gate_failed_closed'
  )
ORDER BY created_at DESC;
```

```sql
SELECT p.id,p.user_id,p.local_date,p.route,p.status,p.created_at,p.confirmed_at,
       c.choice_json
FROM shift_ai_today_proposals p
LEFT JOIN shift_today_choices c
  ON c.user_id=p.user_id
 AND c.local_date=p.local_date
 AND c.domain='ai_rebuild'
WHERE p.created_at>=datetime('now','-1 day')
ORDER BY p.created_at DESC;
```

Review member feedback alongside these queries. The database cannot determine whether a member felt judged, clinically advised or materially misled.

## Immediate stop

Run the one-action kill-switch immediately for any authorised stop condition. Do not investigate first while leaving the pilot live.

After stopping:

1. Verify all three existing endpoints return pilot-off responses.
2. Record the incident reference in `stop_reason`.
3. Preserve audit evidence.
4. Notify the named incident owner.
5. Do not re-enable without a fresh explicit decision.

## Phase 2

Phase 2 is forbidden until the seven-day review confirms no stop criterion triggered. A separate written decision must authorise changing the D1 control to phase 2 and maximum ten members. Do not pre-enable cohort-two access.

## Withdrawal

One member can be removed immediately without affecting others:

```sql
UPDATE shift_ai_pilot_access
SET status='revoked',updated_at=CURRENT_TIMESTAMP
WHERE user_id=REPLACE_MEMBER_ID;
```

Record withdrawal evidence through the approved privacy process. Do not put the member's request text into the pilot access table.
