import assert from 'node:assert/strict';

export const CURRENT_RUNTIME_STRICT_FETCH='  "compatibility_flags": ["nodejs_compat", "global_fetch_strictly_public"],\n';
export const PRIOR_RUNTIME_FETCH='  "compatibility_flags": ["nodejs_compat"],\n';

// The strict-public fetch flag is an independently approved production hardening.
// Historical composition checks remove only that exact additive flag and continue
// comparing every other configuration byte with the pinned baseline.
export function withoutCurrentRuntimePreservationFlag(source){
  const matches=source.split(CURRENT_RUNTIME_STRICT_FETCH).length-1;
  assert(matches<=1,'Duplicate strict-public compatibility flags');
  return source.replace(CURRENT_RUNTIME_STRICT_FETCH,PRIOR_RUNTIME_FETCH);
}
