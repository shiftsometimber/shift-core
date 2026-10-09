// One owner-authorised flag; every other configuration byte remains protected.
export const TREATMENT_FLAG='    "MY_TREATMENT_ENABLED": "true",\n';
export function withoutTreatmentFlag(config){return config.replace(TREATMENT_FLAG,'');}
export const TREATMENT_SCHEMA_STEP='      - name: Prepare exact additive My Treatment stores\n        run: node release/my-treatment-schema.mjs\n';
export const TREATMENT_LIVE_STEP='      - name: Verify live My Treatment delivery and private APIs\n        run: node release/my-treatment-live.mjs\n';
export const TREATMENT_TEST_STEP='      - name: Verify My Treatment schema preservation and release boundaries\n        run: node --test tests/my-treatment-release.test.mjs\n';
export function withoutTreatmentSteps(workflow){return workflow.replace(TREATMENT_SCHEMA_STEP,'').replace(TREATMENT_LIVE_STEP,'').replace(TREATMENT_TEST_STEP,'');}
