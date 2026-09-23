import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import vm from 'node:vm';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>readFileSync(path.join(root,p),'utf8');
const contract=JSON.parse(read('contract.json'));
const ui=read('shared/native-presentation.js');
const java=read('android/app/src/main/java/uk/co/shiftsometimber/mytimber/MainActivity.java');
const swift=read('ios/Sources/MyTimberViewController.swift');
test('PWA contract retained; no store or native-push completion claim',()=>{
 assert.equal(contract.name,'My Timber');assert.equal(contract.startPath,'/member/dashboard#today');
 assert.equal(contract.origin,'https://shiftsometimber.co.uk');
 assert.equal(contract.nativePushReady,false);assert.equal(contract.storeSubmissionAllowed,false);
 for(const f of ['android/app/src/main/java/uk/co/shiftsometimber/mytimber/NavigationPolicy.java','ios/Sources/NavigationPolicy.swift'])
  assert.ok(read(f).includes(contract.origin+contract.startPath));
});
test('Both shells refuse arbitrary native access and insecure transport',()=>{
 assert.ok(java.includes('handler.cancel()'));assert.ok(java.includes('MIXED_CONTENT_NEVER_ALLOW'));
 assert.ok(java.includes('setAllowFileAccess(false)'));assert.ok(java.includes('setWebContentsDebuggingEnabled(false)'));
 assert.ok(!java.includes('addJavascriptInterface('));assert.ok(!swift.includes('addScriptMessageHandler('));
 assert.ok(!swift.includes('NSURLAuthenticationMethodServerTrust'));
 assert.ok(read('android/app/src/main/AndroidManifest.xml').includes('usesCleartextTraffic="false"'));
});
test('No app-specific accounts, store checkout, notification grants or automatic retries',()=>{
 for(const text of [ui,java,swift]) {
  assert.doesNotMatch(text,/Notification\.requestPermission\(|registerForRemoteNotifications\(|pushManager\.subscribe\(/);
  assert.doesNotMatch(text,/webView\.reload\(|web\.reload\(/);
 }
 assert.ok(java.includes('dontResend.sendToTarget()'));
 assert.ok(java.includes('request.deny()'));
 assert.ok(java.includes('Intent.ACTION_OPEN_DOCUMENT'));
 assert.doesNotMatch(ui,/\bfetch\(|XMLHttpRequest|localStorage|sessionStorage|indexedDB|caches\./);
});
test('Final store identities are prepared but submission remains explicitly disabled',()=>{
 const gradle=read('android/app/build.gradle'),project=read('ios/project.yml');
 assert.match(gradle,/applicationId 'uk\.co\.shiftsometimber\.mytimber'/);
 assert.match(gradle,/applicationIdSuffix '\.preview'/);
 assert.match(project,/Release:\s*\n\s*PRODUCT_BUNDLE_IDENTIFIER: uk\.co\.shiftsometimber\.mytimber/);
 assert.match(project,/Debug:\s*\n\s*PRODUCT_BUNDLE_IDENTIFIER: uk\.co\.shiftsometimber\.mytimber\.preview/);
 assert.equal(contract.storeSubmissionAllowed,false);
});
function fixture(origin){
 const elements=new Map();
 const title={textContent:'Add My Timber to your phone'},subtitle={textContent:'Old install copy'};
 const box={dataset:{},children:[],querySelector:q=>q==='summary strong'?title:subtitle,appendChild(x){this.children.push(x);if(x.id)elements.set(x.id,x);}};
 elements.set('myTimberApp',box);
 const doc={head:{appendChild(x){elements.set(x.id,x);}},body:{},documentElement:{},readyState:'complete',
  getElementById:id=>elements.get(id),createElement:tag=>({tag,setAttribute(k,v){this[k]=v;}})};
 let callback;
 vm.runInNewContext(ui,{location:{origin},document:doc,MutationObserver:class{constructor(cb){callback=cb;}observe(){}}});
 return {box,title,elements,again:()=>callback?.()};
}
test('Native presentation hides PWA-only install/reminder card and is idempotent',()=>{
 const f=fixture(contract.origin);assert.equal(f.box.dataset.nativeCandidate,'1');
 assert.equal(f.box.children.length,0);f.again();f.again();assert.equal(f.box.children.length,0);
 assert.match(f.elements.get('my-timber-native-style').textContent,/#myTimberApp/);
 assert.match(f.elements.get('my-timber-native-style').textContent,/display:none/);
});
test('Native presentation does not run on untrusted origins',()=>{
 const f=fixture('https://shiftsometimber.co.uk.evil.example');
 assert.equal(f.title.textContent,'Add My Timber to your phone');assert.equal(f.box.children.length,0);
});
