import {readFileSync,writeFileSync,copyFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve,dirname} from 'node:path';
// Generates one candidate from the current authoritative repository. Does not
// contact any service, mutate a database, bypass release gates or submit a build.
const root=resolve(process.argv[2]||'.'),changed=[];
function edit(path,transforms){
 const file=resolve(root,path),before=readFileSync(file,'utf8');let after=before;
 for(const [from,to]of transforms){if(after.split(from).length!==2)throw Error('Source drift or duplicate preparation: '+path);after=after.replace(from,to);}
 if(after!==before){writeFileSync(file,after);changed.push(path);}
}
function copy(from,to){const dest=resolve(root,to);mkdirSync(dirname(dest),{recursive:true});copyFileSync(resolve(root,from),dest);changed.push(to);}
edit('my-timber-app/ios/Sources/MyTimberViewController.swift',[
 ['config.applicationNameForUserAgent="MyTimberNativePreview/0.1"','config.applicationNameForUserAgent="MyTimberNativePreview/0.1 MyTimberConnectedHealthPreview/1"'],
 ['let decision=NavigationPolicy.classify(url.absoluteString)','if TimberHealthEntry.handle(action,web:webView,presenter:self){decisionHandler(.cancel);return}\n        let decision=NavigationPolicy.classify(url.absoluteString)']
]);
copy('connected-health/native/ios/HealthReader.swift','my-timber-app/ios/Sources/HealthReader.swift');
copy('connected-health/native/ios/ConnectedHealthController.swift','my-timber-app/ios/Sources/ConnectedHealthController.swift');
copy('connected-health/native/ios/HealthKit.entitlements','my-timber-app/ios/HealthKit.entitlements');
edit('my-timber-app/ios/project.yml',[
 ['        CODE_SIGN_STYLE: Automatic','        CODE_SIGN_STYLE: Automatic\n        CODE_SIGN_ENTITLEMENTS: HealthKit.entitlements'],
 ['        CFBundleDisplayName: My Timber','        CFBundleDisplayName: My Timber\n        NSHealthShareUsageDescription: With your separate agreement, My Timber reads only the weight, height, steps and sleep categories you choose and stores copies in your account for progress across the app and website. Stop syncing or delete imported data in My Timber Settings. No treatment changes or clinical verification.']
]);
edit('my-timber-app/android/app/src/main/java/uk/co/shiftsometimber/mytimber/MainActivity.java',[
 ['+" MyTimberNativePreview/0.1"','+" MyTimberNativePreview/0.1 MyTimberConnectedHealthPreview/1"'],
 ['NavigationPolicy.Decision decision = NavigationPolicy.classify(request.getUrl().toString());','if (uk.co.shiftsometimber.mytimber.health.HealthEntry.openIfRequested(MainActivity.this,view,request)) return true;\n                NavigationPolicy.Decision decision = NavigationPolicy.classify(request.getUrl().toString());']
]);
edit('my-timber-app/android/build.gradle',[["plugins { id 'com.android.application' version '8.13.2' apply false }","plugins { id 'com.android.application' version '8.13.2' apply false; id 'com.android.library' version '8.13.2' apply false }"]]);
edit('my-timber-app/android/settings.gradle',[["include ':app'","include ':app', ':connectedHealth'\nproject(':connectedHealth').projectDir = new File(settingsDir, '../../connected-health/native/android')"]]);
edit('my-timber-app/android/app/build.gradle',[["plugins { id 'com.android.application' }","plugins { id 'com.android.application' }\ndependencies { implementation project(':connectedHealth') }"]]);
// AndroidX is required by Health Connect, without dropping Android 8 shell users.
writeFileSync(resolve(root,'my-timber-app/android/gradle.properties'),'android.useAndroidX=true\norg.gradle.jvmargs=-Xmx2g\n');changed.push('my-timber-app/android/gradle.properties');
edit('privacy-health-erasure-route-v1.js',[
 ["import {eraseAcquisitionStatement}","import {connectedHealthErasureStatements} from './connected-health/privacy.mjs';\nimport {eraseAcquisitionStatement}"],
 ['  const results=await env.DB.batch(statements);','  statements.push(...await connectedHealthErasureStatements(env.DB,userId,now));\n  const results=await env.DB.batch(statements);']
]);
edit('privacy-account-request-v1.js',[
 ['export async function receiveAccountDeletion',"import {connectedHealthErasureStatements} from './connected-health/privacy.mjs';\nexport async function receiveAccountDeletion"],
 ['  await DB.batch([','  const healthErasure=await connectedHealthErasureStatements(DB,userId,now);\n  await DB.batch([\n    ...healthErasure,']
]);
// Worker wrapper is selected only for this candidate; real production config stays untouched.
const proof={schema:1,productionDeployed:false,dbMigrated:false,files:changed.map(path=>({path,sha256:createHash('sha256').update(readFileSync(resolve(root,path))).digest('hex')}))};
mkdirSync(resolve(root,'connected-health-evidence'),{recursive:true});writeFileSync(resolve(root,'connected-health-evidence/integration-manifest.json'),JSON.stringify(proof,null,2)+'\n');
console.log('Prepared '+changed.length+' candidate files. No deployment or database access.');
