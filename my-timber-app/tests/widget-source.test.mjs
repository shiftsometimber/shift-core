import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url)),read=p=>readFileSync(root+p,'utf8');
const java=read('android/app/src/main/java/uk/co/shiftsometimber/mytimber/TimberWidget.java');
const swift=read('ios/Widgets/MyTimberWidget.swift');
test('Widget cannot obtain, display, store or transmit private records',()=>{
 for(const source of [java,swift]){
  assert.doesNotMatch(source,/URLSession|HttpURLConnection|SharedPreferences|UserDefaults|HealthKit|HealthConnect|WebView|evaluateJavascript|authorization|password|cookie|weightKg|doseStrength/i);
 }
 assert.match(swift,/policy: \.never/);
 assert.match(read('android/app/src/main/res/xml/timber_widget_info.xml'),/updatePeriodMillis="0"/);
});
test('Android widget actions are explicit, immutable and independently identified',()=>{
 assert.match(java,/new Intent\(context, MainActivity.class\)/);assert.match(java,/FLAG_IMMUTABLE/);
 const keys=[...java.matchAll(/open\(context, "([a-z]+)", (\d+)\)/g)];
 assert.deepEqual(keys.map(k=>k[1]),['today','progress','grub']);assert.equal(new Set(keys.map(k=>k[2])).size,3);
 assert.doesNotMatch(java,/setData\(|ACTION_VIEW|requestPinAppWidget/);
});
test('Native routes are closed allowlists without URL or token extras',()=>{
 for(const p of ['ios/Sources/WidgetRoute.swift','android/app/src/main/java/uk/co/shiftsometimber/mytimber/WidgetRoute.java']){
  const source=read(p).split('\n').filter(line=>!line.trim().startsWith('//')&&!line.trim().startsWith('/**')).join('\n');assert.doesNotMatch(source,/URLComponents|parse\(|decode|query|parameters|token|password|redirect/i);
  assert.match(source,/member\/dashboard#visualise/);assert.match(source,/member\/grub/);assert.match(source,/return (nil|null)/);
 }
});
test('Shortcuts protect unsaved foreground forms and do not submit them',()=>{
 for(const p of ['ios/Sources/MyTimberViewController.swift','android/app/src/main/java/uk/co/shiftsometimber/mytimber/MainActivity.java']){
  const source=read(p);assert.match(source,/Open My Timber shortcut\?/);assert.match(source,/Stay here/);
  assert.match(source,/Unsaved entries on this page may be lost/);assert.doesNotMatch(source,/submit\(\)|requestSubmit\(|postUrl\(/);
 }
});
test('Native source preserves separate production/dev identities and no app groups',()=>{
 const project=read('ios/project.yml');assert.match(project,/type: app-extension/);
 assert.match(project,/uk\.co\.shiftsometimber\.mytimber\.dev\.widget/);assert.match(project,/uk\.co\.shiftsometimber\.mytimber\.widget/);
 assert.match(project,/target: MyTimberWidget\s+embed: true/);
 assert.doesNotMatch(project,/app-groups|DEVELOPMENT_TEAM|PROVISIONING_PROFILE/);
 assert.match(read('android/app/src/main/AndroidManifest.xml'),/name="\.TimberWidget" android:exported="false"/);
});
