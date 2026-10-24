// Immediate self-service member account deletion. The legacy export name is
// retained for route compatibility; there is no approval or HQ request queue.
import {eraseAcquisitionStatement} from './acquisition-activation/server.mjs';
export const CLOSED_ACCOUNT_PASSWORD_PREFIX='closed$';
export const ACCOUNT_ERASURE_TABLES=Object.freeze([
 'member_email_changes','member_email_change_limits','member_signup_alerts','auth_tokens',
 'fit_reminder_deliveries','fit_push_subscriptions','fit_reminder_preferences',
 'member_treatment_push_devices','my_timber_push_devices',
 'my_timber_support_delivery_history','my_timber_support_devices','my_timber_support_steps',
 'shift_ai_proactive_delivery','shift_ai_proactive_outbox','shift_ai_proactive_insights',
 'shift_ai_conversations','shift_ai_memory_v2','shift_ai_member_memory','ai_memory','ai_memory_consent',
 'ai_action_requests','shift_ai_privacy_settings',
 'shift_daily_action_events','shift_daily_actions','shift_daily_feedback','shift_daily_plans',
 'shift_plan_actions','shift_recommendation_log','shift_plans','shift_personal_state',
 'shift_today_choices','shift_today_checkins','daily_checkin_actions','my_journey_weekly_checkins',
 'member_food_entries','member_pen_day_notes','hydration_log','progress_entries','progress_photos',
 'shift_progress_photos_v2','health_mot_entries','health_mots','health_passport_records',
 'member_treatment_events','member_medical_disclosures','member_treatment_records','shift_treatment_context',
 'member_targets','member_programmes','programme_v1_accounts','shift_me_v1','shift_meal_preferences',
 'member_account_details','member_state','product_events','product_feedback','segment_members','campaign_recipients'
]);
const RETAINED_RECORD_TABLES=Object.freeze(['cases','assessments','pharmacy_orders','orders','medicine_orders','medicine_clinical_intakes','health_mot_results','support_tickets']);
const REQUIRED=Object.freeze(['users','user_auth','user_sessions','auth_tokens','member_state','member_status','data_requests']);

export async function receiveAccountDeletion(DB,userId,now=new Date().toISOString()){
 const id=Number(userId);if(!Number.isSafeInteger(id)||id<=0)throw Error('invalid_user_id');
 const rows=await DB.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
 const present=new Set((rows.results||[]).map(row=>row.name));
 if(REQUIRED.some(name=>!present.has(name)))throw Error('account_deletion_schema_incomplete');
 const retained=RETAINED_RECORD_TABLES.filter(name=>present.has(name)).map(name=>`EXISTS(SELECT 1 FROM ${name} WHERE user_id=users.id)`);
 if(present.has('tap_room_reports'))retained.push(present.has('tap_room_posts')?'EXISTS(SELECT 1 FROM tap_room_reports r LEFT JOIN tap_room_posts p ON p.id=r.post_id WHERE r.reporter_user_id=users.id OR p.user_id=users.id)':'EXISTS(SELECT 1 FROM tap_room_reports WHERE reporter_user_id=users.id)');
 const retention=retained.join(' OR ')||'0';
 const statements=[];
 // Children must be removed before the owning rows, with foreign keys enabled.
 if(present.has('my_timber_support_deliveries')&&present.has('my_timber_support_devices'))statements.push(DB.prepare('DELETE FROM my_timber_support_deliveries WHERE endpoint IN (SELECT endpoint FROM my_timber_support_devices WHERE user_id=?)').bind(id));
 if(present.has('my_timber_push_deliveries'))statements.push(DB.prepare('DELETE FROM my_timber_push_deliveries WHERE endpoint IN (SELECT endpoint FROM my_timber_push_devices WHERE user_id=?)').bind(id));
 if(present.has('member_treatment_push_deliveries'))statements.push(DB.prepare('DELETE FROM member_treatment_push_deliveries WHERE treatment_id IN (SELECT id FROM member_treatment_records WHERE user_id=?)').bind(id));
 for(const table of ACCOUNT_ERASURE_TABLES)if(present.has(table))statements.push(DB.prepare(`DELETE FROM ${table} WHERE user_id=?`).bind(id));
 if(present.has('check_ins'))statements.push(DB.prepare('DELETE FROM check_ins WHERE user_id=? AND case_id IS NULL').bind(id));
 // Stop pending communications without deleting completed operational records.
 for(const table of ['message_outbox','hq_outbox'])if(present.has(table))statements.push(DB.prepare(`UPDATE ${table} SET status='cancelled',updated_at=? WHERE user_id=? AND status IN ('queued','pending','scheduled','retry')`).bind(now,id));
 if(present.has('tap_room_profiles'))statements.push(DB.prepare("UPDATE tap_room_profiles SET display_name='Deleted member',bio=NULL,status='deleted',updated_at=? WHERE user_id=?").bind(now,id));
 if(present.has('tap_room_posts'))statements.push(DB.prepare("UPDATE tap_room_posts SET body='[Deleted by member]',status='deleted',deleted_at=?,updated_at=? WHERE user_id=?"+(present.has('tap_room_reports')?' AND NOT EXISTS(SELECT 1 FROM tap_room_reports WHERE post_id=tap_room_posts.id)':'')).bind(now,now,id));
 if(present.has('consents'))statements.push(DB.prepare("INSERT INTO consents(user_id,consent_type,consent_version,granted,withdrawn_at,created_at) SELECT ?,c.consent_type,'account-deletion/2026-10-24',0,?,? FROM consents c WHERE c.user_id=? AND c.granted=1 AND c.id=(SELECT MAX(latest.id) FROM consents latest WHERE latest.user_id=c.user_id AND latest.consent_type=c.consent_type)").bind(id,now,now,id));
 if(present.has('audit_log'))statements.push(eraseAcquisitionStatement(DB,id));
 // Keep a non-loginable authentication tombstone: an orphaned users row must
 // never be recovered by normal registration into its old retained records.
 statements.push(DB.prepare('INSERT INTO user_auth(user_id,password_hash,email_verified,failed_login_attempts,updated_at) VALUES(?,?,0,0,?) ON CONFLICT(user_id) DO UPDATE SET password_hash=excluded.password_hash,email_verified=0,failed_login_attempts=0,locked_until=NULL,updated_at=excluded.updated_at').bind(id,CLOSED_ACCOUNT_PASSWORD_PREFIX+crypto.randomUUID(),now));
 statements.push(DB.prepare('UPDATE user_sessions SET revoked_at=COALESCE(revoked_at,?) WHERE user_id=?').bind(now,id));
 statements.push(DB.prepare("UPDATE member_status SET lifecycle_stage='closed',membership_status='cancelled',updated_at=? WHERE user_id=?").bind(now,id));
 // The account is always closed. Identity is removed automatically unless it
 // anchors an existing clinical/order/support record under the retained policy.
 const tombstone='deleted-'+crypto.randomUUID()+'@deleted.invalid';
 statements.push(DB.prepare(`UPDATE users SET email=CASE WHEN ${retention} THEN email ELSE ? END,first_name=CASE WHEN ${retention} THEN first_name ELSE 'Deleted member' END,last_name=CASE WHEN ${retention} THEN last_name ELSE NULL END,phone=CASE WHEN ${retention} THEN phone ELSE NULL END,date_of_birth=CASE WHEN ${retention} THEN date_of_birth ELSE NULL END,postcode=CASE WHEN ${retention} THEN postcode ELSE NULL END,updated_at=? WHERE id=?`).bind(tombstone,now,id));
 statements.push(DB.prepare("UPDATE data_requests SET status='completed',completed_at=? WHERE user_id=? AND request_type='deletion' AND status IN ('received','in_progress')").bind(now,id));
 statements.push(DB.prepare("INSERT INTO data_requests(user_id,request_type,status,received_at,completed_at) SELECT ?,'deletion','completed',?,? WHERE NOT EXISTS(SELECT 1 FROM data_requests WHERE user_id=? AND request_type='deletion' AND status='completed')").bind(id,now,now,id));
 if(present.has('hq_tasks'))statements.push(DB.prepare("UPDATE hq_tasks SET status='done',completed_at=?,updated_at=? WHERE user_id=? AND title='Review account deletion request' AND status NOT IN ('done','cancelled')").bind(now,now,id));
 // One D1 transaction: no successful response, partial erase or reusable
 // credentials if any required step fails. No emails or new HQ tasks are sent.
 await DB.batch(statements);
 return {ok:true,status:'deleted',deletedAt:now,accountClosed:true};
}
