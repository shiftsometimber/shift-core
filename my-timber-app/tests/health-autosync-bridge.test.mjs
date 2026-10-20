import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../shared/native-health.js',import.meta.url),'utf8');
function context(path='/member/dashboard'){
 const messages=[],listeners={},window={webkit:{messageHandlers:{sstHealth:{postMessage:m=>messages.push(m)}}},addEventListener:(n,f)=>listeners[n]=f,dispatchEvent(){}};window.top=window;
 vm.runInNewContext(source,{window,location:{origin:'https://shiftsometimber.co.uk',pathname:path},crypto:{randomUUID:()=> 'bb769040-5dfa-4bb4-a4f7-a079326dfd26'},Event:class{},setTimeout,clearTimeout});return{window,messages,listeners};
}
test('automatic foreground bridge only permits compiled member paths and supported types',async()=>{
 const f=context();assert.equal(f.window.SST_NATIVE_HEALTH.automaticImportVersion,1);
 const pending=f.window.SST_NATIVE_HEALTH.requestAutomatic(1,['weight']);assert.equal(f.messages[0].action,'sync');assert.equal(f.messages[0].kinds[0],'weight');
 f.window.SST_NATIVE_HEALTH_RESULT({requestId:f.messages[0].requestId,accountId:1,readings:[]});await pending;
 await assert.rejects(f.window.SST_NATIVE_HEALTH.requestAutomatic(1,['steps']));await assert.rejects(f.window.SST_NATIVE_HEALTH.requestAutomatic(1,['weight','weight']));await assert.rejects(f.window.SST_NATIVE_HEALTH.requestAutomatic(0,['weight']));
 await assert.rejects(f.window.SST_NATIVE_HEALTH.requestAutomatic(1,['weight'],true));
 for(const path of ['/about','/member/unknown','/member/settings/../about']){const other=context(path);await assert.rejects(other.window.SST_NATIVE_HEALTH.requestAutomatic(1,['weight']));assert.equal(other.messages.length,0);}
});
test('permission setup remains settings-only and navigation cancels pending automatic data',async()=>{
 const f=context('/member/settings'),pending=f.window.SST_NATIVE_HEALTH.requestAutomatic(1,['weight','blood_pressure'],true);assert.equal(f.messages[0].action,'connect');assert.equal(f.messages[0].kinds.length,2);f.listeners.pagehide();await assert.rejects(pending,/page changed/);
});
