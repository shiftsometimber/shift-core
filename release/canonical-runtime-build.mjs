import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {liveAppClient} from '../app-layout-live.mjs';
import {memberImageViewerRuntime} from '../shift-coach/member-image-viewer.mjs';
import {supportPlanRuntime} from '../member-experience/support-plan-client.mjs';
import {supportTryRuntime} from '../member-experience/support-plan-pages.mjs';
import {shedRuntime} from '../member-experience/shed-support-ui.mjs';
export const digest=value=>createHash('sha256').update(value).digest('hex');
export function canonicalRuntime(bundle){
 assert.equal(bundle.split('export {').length,2,'Expected one module export block');
 for(const declaration of ['var liveAppClient = appClient + memberDesignClient + "\\n" + sixPageRecoveryRuntime;','var memberImageViewerRuntime =','var supportPlanRuntime =','var supportTryRuntime =','var shedRuntime ='])
  assert.equal(bundle.split(declaration).length,2,'Expected one native client binding');
 const insertion='// Native client serialization retained across bundling.\n'+'liveAppClient = '+JSON.stringify(liveAppClient)+';\nmemberImageViewerRuntime = '+JSON.stringify(memberImageViewerRuntime)+';\n'+'supportPlanRuntime = '+JSON.stringify(supportPlanRuntime)+';\nsupportTryRuntime = '+JSON.stringify(supportTryRuntime)+';\nshedRuntime = '+JSON.stringify(shedRuntime)+';\n';
 const result=bundle.replace('export {',insertion+'export {');
 assert.equal(result.replace(insertion,''),bundle,'Canonical repair must be exactly reversible');
 return {bundle:result,baseSHA256:digest(bundle),buildSHA256:digest(result),nativeClientSHA256:digest(liveAppClient),viewerSHA256:digest(memberImageViewerRuntime),supportRuntimeSHA256:digest(supportPlanRuntime),tryRuntimeSHA256:digest(supportTryRuntime),shedRuntimeSHA256:digest(shedRuntime)};
}
export function uploadedVersion(output){
 const matches=[...output.matchAll(/(?:Worker )?Version ID:\s*([a-f0-9-]{36})/g)];
 assert.equal(matches.length,1,'Upload must identify exactly one staged version');
 return matches[0][1];
}
