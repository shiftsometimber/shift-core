// A deletion request is a human review workflow, not immediate erasure of
// every record. Receipt, the existing HQ work queue and sign-out are atomic.
export async function receiveAccountDeletion(DB,userId,now=new Date().toISOString()){
  const title='Review account deletion request';
  await DB.batch([
    DB.prepare(`INSERT INTO data_requests(user_id,request_type,status,received_at)
      SELECT ?,'deletion','received',? WHERE NOT EXISTS
      (SELECT 1 FROM data_requests WHERE user_id=? AND request_type='deletion' AND status IN ('received','in_progress'))`).bind(userId,now,userId),
    DB.prepare(`INSERT INTO hq_tasks(user_id,title,description,status,due_at,created_at,updated_at)
      SELECT ?,?,?,'open',?,?,? WHERE NOT EXISTS
      (SELECT 1 FROM hq_tasks WHERE user_id=? AND title=? AND status NOT IN ('done','cancelled'))`).bind(userId,title,
      'Account deletion requested in My Timber. Review the pending deletion in data_requests for this member, confirm identity and any necessary retention, complete the applicable erasure, record the outcome and respond to the member. A request receipt is not completed deletion. Follow docs/privacy-account-deletion.md.',
      now.slice(0,10),now,now,userId,title),
    DB.prepare('UPDATE user_sessions SET revoked_at=? WHERE user_id=? AND revoked_at IS NULL').bind(now,userId)
  ]);
  return {ok:true,status:'received'};
}
