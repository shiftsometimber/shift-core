import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const root=new URL('../',import.meta.url),read=p=>readFileSync(new URL(p,root),'utf8');
function context({origin='https://shiftsometimber.co.uk',path='/member/settings',frame=false}={}){
 const messages=[],listeners={},win={webkit:{messageHandlers:{sstHealth:{postMessage:m=>messages.push(m)}}},addEventListener:(n,f)=>listeners[n]=f,dispatchEvent(){}};win.top=frame?{}:win;
 vm.runInNewContext(read('shared/native-health.js'),{window:win,location:{origin,pathname:path},crypto:{randomUUID:()=> 'bb769040-5dfa-4bb4-a4f7-a079326dfd26'},Event:class{},setTimeout,clearTimeout});return{win,messages,listeners};
}
test('foreign origins and subframes get no bridge; public pages cannot request health reads',async()=>{
 for(const options of [{origin:'https://shiftsometimber.co.uk.evil.example'},{origin:'http://shiftsometimber.co.uk'},{frame:true}])assert.equal(context(options).win.SST_NATIVE_HEALTH,undefined);
 const f=context({path:'/about'});await assert.rejects(f.win.SST_NATIVE_HEALTH.request(1));assert.equal(f.messages.length,0);
});
test('native replies bind to request and account; repeat clicks cannot read twice; navigation clears unsaved preview',async()=>{
 const f=context(),pending=f.win.SST_NATIVE_HEALTH.request(1);assert.equal(f.messages.length,1);await assert.rejects(f.win.SST_NATIVE_HEALTH.request(1));
 f.win.SST_NATIVE_HEALTH_RESULT({requestId:f.messages[0].requestId,accountId:2,readings:[]});
 f.win.SST_NATIVE_HEALTH_RESULT({requestId:f.messages[0].requestId,accountId:1,readings:[{kind:'weight',weightKg:90}]});assert.equal((await pending).readings[0].weightKg,90);
 const cancelled=f.win.SST_NATIVE_HEALTH.request(1);f.listeners.pagehide();await assert.rejects(cancelled,/page changed/);
});
test('platform readers use read-only bounded foreground APIs for the three authorised metrics',()=>{
 const swift=read('ios/Sources/HealthBridge.swift'),kotlin=read('android/app/src/main/java/uk/co/shiftsometimber/mytimber/HealthBridge.kt'),manifest=read('android/app/src/main/AndroidManifest.xml');
 assert.match(swift,/frameInfo\.isMainFrame/);assert.match(swift,/trusted\(message.frameInfo.request.url\)/);assert.match(swift,/toShare:\[\]/);assert.match(swift,/body.count==3/);assert.match(swift,/limit:50/);assert.match(swift,/\.bodyMass/);
 assert.match(kotlin,/!isMainFrame/);assert.match(kotlin,/setOf\("https:\/\/shiftsometimber.co.uk"\)/);assert.match(kotlin,/getGrantedPermissions/);assert.match(kotlin,/pageSize=50/);assert.match(kotlin,/WeightRecord/);
 assert.deepEqual([...manifest.matchAll(/android.permission.health.(READ_\w+)/g)].map(x=>x[1]).sort(),['READ_BLOOD_PRESSURE','READ_HEART_RATE','READ_WEIGHT']);
 for(const body of [swift,kotlin,manifest])assert.doesNotMatch(body,/WRITE_HEALTH|WRITE_WEIGHT|WRITE_BLOOD|WRITE_HEART|enableBackgroundDelivery|READ_HEALTH_DATA_IN_BACKGROUND|insertRecords\(|save\(.*HKSample/);
 assert.match(manifest,/START_VIEW_PERMISSION_USAGE/);assert.match(manifest,/HEALTH_PERMISSIONS/);
});
