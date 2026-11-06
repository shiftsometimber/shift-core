// Deployment configuration selects one read audience. Request parameters cannot
// turn an isolated TEST projection into a production projection, or vice versa.
export function hqProjectionScope(env, requested = []) {
  const test = env.HQ_V3_TEST_MODE === 'true' && env.DEPLOYMENT_ENVIRONMENT === 'test' && env.HQ_V3_LIVE_READS !== 'true';
  const live = env.HQ_V3_LIVE_READS === 'true' && env.DEPLOYMENT_ENVIRONMENT === 'production' && env.HQ_V3_TEST_MODE !== 'true' && env.SSTRX_ENVIRONMENT !== 'synthetic';
  if (!test && !live) return {error:'isolated_test_environment_required', status:503};
  const partition = live ? 'LIVE' : 'TEST';
  if (requested.length > 1 || requested.length === 1 && requested[0] !== partition) return {error:'projection_partition_mismatch', status:403};
  return {partition, audience:'ops_meta', synthetic:test && env.SSTRX_ENVIRONMENT === 'synthetic'};
}
