# Account deletion requests

My Timber Settings sends an authenticated request. A successful response means **received**, not erased. It atomically adds the request to `data_requests`, adds an open **Review account deletion request** task to the existing HQ CRM task queue, and revokes all current sessions. Repeat submissions reuse a pending request and open task. No automatic email or blanket customer-record deletion is introduced.

The HQ operator must review the task and the pending request for that member, verify the appropriate identity and retention requirements, carry out the applicable erasure across the recorded data stores and processors, document retained records and the reason, and respond to the member. Set `data_requests.status` to `completed` and `completed_at` only after actual completion is evidenced; then close the HQ task. A completed task alone is not evidence of deletion. Requests that cannot yet be completed must remain visible with their next action recorded.

Review the HQ task queue each working day, including older pending `data_requests` which predate this repair. The code change does not certify previous request completion, appoint an operator, or establish that an external processor has deleted data. Those operational checks remain open from the discovery audit.

Optional health-history erasure is a separate immediate, authenticated operation. It retains the account and necessary consent/audit history, and removes optional Pen Day notes and their legacy analytics with other optional health stores. Do not treat that narrower operation as account deletion.

My Timber PWA check-in subscriptions are device-specific in
`my_timber_push_devices`. Session revocation pauses delivery immediately; it is
not erasure of the subscription. Include these device rows and their related
`my_timber_push_deliveries` rows in account erasure (deliveries first), as well as
the pre-existing `fit_push_subscriptions` and reminder stores where applicable.
Device endpoints and encryption material must not be included in ordinary logs
or screenshots. The PWA control can remove the current device's check-in
subscription directly without changing unrelated Fit/email choices.
