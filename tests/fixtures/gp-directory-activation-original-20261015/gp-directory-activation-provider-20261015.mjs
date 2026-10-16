import assert from 'node:assert/strict';
import {gpActivationBindingsSha256} from './gp-directory-activation-contract-20261015.mjs';
export function assertGpHqUnaffectedBindings(version,expected){assert.match(expected.otherBindingsSha256||'',/^[a-f0-9]{64}$/,'Literal accepted predecessor binding digest required');assert.equal(gpActivationBindingsSha256(version.resources?.bindings),expected.otherBindingsSha256,'Every other HQ provider binding must remain identical to accepted GP-code source');}
export function assertActivatedGpProviderBindings(version,expected){const bindings=version.resources?.bindings;assert(Array.isArray(bindings),'Actual provider bindings required');const flags=bindings.filter(b=>b.name==='MEMBER_GP_DIRECTORY_V2_ENABLED');assert.equal(flags.length,1,'One explicit V2 directory flag required');assert.equal(flags[0].type,'plain_text','Opaque V2 flag refused');assert.equal(flags[0].text,'true','V2 directory flag is not actually on');assertGpHqUnaffectedBindings(version,expected);return{gpEnabled:true,otherBindingsPreserved:true};}
// The original kernel still verifies exact deployment, version, whole bundle,
// traffic and the existing partner binding. Only the one newly approved V2
// binding is authenticated before its removal from an isolated proof copy.
export function assertActivatedGpHqProviderSnapshot(snapshot,expected,originalOffKernel){
 assert.equal(typeof originalOffKernel,'function','Retained flags-OFF HQ provider kernel required');
 assertActivatedGpProviderBindings(snapshot.version,expected);
 const version=structuredClone(snapshot.version);version.resources.bindings=version.resources.bindings.filter(b=>b.name!=='MEMBER_GP_DIRECTORY_V2_ENABLED');
 const result=originalOffKernel({...snapshot,version},expected);assert.equal(result.gpEnabled,false);assert.equal(result.partnersEnabled,true);
 return{...result,gpEnabled:true};
}
