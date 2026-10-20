import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('iOS 27 scene receives cold and warm closed-allowlist widget navigation',()=>{
 const scene=read('ios/Sources/SceneDelegate.swift');
 assert.match(scene,/connectionOptions\.urlContexts\.count == 1/);
 assert.match(scene,/controller\.initialDestination = destination/);
 assert.match(scene,/openURLContexts contexts: Set<UIOpenURLContext>/);
 assert.match(scene,/contexts\.count == 1/);
 assert.match(scene,/controller\.openWidgetDestination\(destination\)/);
 assert.match(scene,/WidgetRoute\.destination\(url\.absoluteString\)/);
 assert.match(scene,/sceneWillResignActive/);assert.match(scene,/privacyCover/);
 assert.match(scene,/pendingTreatmentNavigation/);assert.match(scene,/controller\.openTreatment\(\)/);
 assert.doesNotMatch(scene,/application\(_ application/);
});
test('scene candidate retains current version7, HealthKit and scene manifest without new entitlements',()=>{
 const project=read('ios/project.yml');
 assert.match(project,/CURRENT_PROJECT_VERSION: 7/);assert.match(project,/UIApplicationSceneManifest:/);
 assert.match(project,/UISceneDelegateClassName: \$\(PRODUCT_MODULE_NAME\)\.SceneDelegate/);
 assert.match(project,/CODE_SIGN_ENTITLEMENTS: HealthKit.entitlements/);
 assert.doesNotMatch(project,/com\.apple\.security\.application-groups|PROVISIONING_PROFILE|DEVELOPMENT_TEAM/);
});
