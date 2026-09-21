// Exercise persisted preview identity and the actual Worker fetch transport.
// An intentionally nonexistent Apple endpoint cannot address a person's device.
import assert from 'node:assert/strict';
import {createECDH,randomBytes} from 'node:crypto';
const origin=process.env.PREVIEW_URL;
assert.equal(origin,'https://shift-my-timber-pwa-preview.matobrien.workers.dev');
let cookie;
try{
 const start=await fetch(origin+'/__preview/start',{method:'POST',headers:{Origin:origin},redirect:'manual'});
 assert.equal(start.status,303);cookie=start.headers.get('Set-Cookie').split(';')[0];
 const client=createECDH('prime256v1');client.generateKeys();
 const endpoint='https://web.push.apple.com/nonexistent-preview-probe-'+randomBytes(16).toString('hex');
 const headers={Origin:origin,Cookie:cookie,'Content-Type':'application/json'};
 const save=await fetch(origin+'/v1/my-timber-pwa/subscription',{method:'PUT',headers,body:JSON.stringify({hour:19,subscription:{endpoint,keys:{p256dh:client.getPublicKey().toString('base64url'),auth:randomBytes(16).toString('base64url')}}})});
 assert.equal(save.status,200);
 const send=await fetch(origin+'/v1/my-timber-pwa/test',{method:'POST',headers,body:JSON.stringify({endpoint})});
 const result=await send.json();
 console.log('Invalid-address transport probe:',send.status,result.error||result.status);
 assert.equal(result.error,'push_not_accepted','Expected provider rejection for nonexistent address, not a server exception');
 console.log('PASS: persisted identity, encryption and actual Worker transport reached the provider. No real device addressed.');
}finally{
 if(cookie){const finish=await fetch(origin+'/__preview/finish',{method:'POST',headers:{Origin:origin,Cookie:cookie},redirect:'manual'});assert.equal(finish.status,303);console.log('PASS: transport probe fixture removed.');}
}
