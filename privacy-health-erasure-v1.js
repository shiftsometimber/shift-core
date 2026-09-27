// Shift Some Timber — optional My Shift health-tracking erasure helper.
// This module deliberately targets only optional non-clinical tracking data.
// It must not be extended to regulated treatment records without a separate
// retention/legal assessment.

export const OPTIONAL_HEALTH_TRACKING_CONSENT = 'my_shift_health_tracking';

export async function eraseOptionalHealthTrackingData(env, userId) {
  const id = Number(userId);
  if (!Number.isFinite(id) || id <= 0) throw new Error('invalid_user_id');

  // Keep the scope narrow: member-entered progress, MOT/check-in history and
  // optional progress imagery. Do not delete identity/account/audit/consent
  // history here; those have separate accountability and rights purposes.
  const statements = [
    env.DB.prepare('DELETE FROM progress_entries WHERE user_id=?').bind(id),
    env.DB.prepare('DELETE FROM check_ins WHERE user_id=?').bind(id),
    env.DB.prepare('DELETE FROM health_mot_entries WHERE user_id=?').bind(id),
    env.DB.prepare('DELETE FROM progress_photos WHERE user_id=?').bind(id)
  ];

  const results = [];
  for (const statement of statements) {
    try {
      results.push(await statement.run());
    } catch (error) {
      // Schema names have evolved across releases. Fail closed at the route
      // layer if a required live table cannot be cleared; do not silently
      // claim erasure succeeded.
      const e = new Error('health_tracking_erasure_failed');
      e.cause = error;
      throw e;
    }
  }
  return { ok: true, deletedScopes: ['progress','check_ins','health_mot','progress_photos'], results };
}
