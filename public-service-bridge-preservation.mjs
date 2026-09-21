import {serviceBridgePaintStyle} from './public-navigation-policy.mjs';
// Exempt exactly the authorised paint repair from the byte-for-byte content
// comparison. A changed, missing or duplicated repair fails closed.
export function preserveServiceBridgePaint(input,{required=false}={}){
 const html=input.toString('utf8');
 if(!/<\/head>/i.test(html))return input;
 const count=html.split('data-shift-service-bridge-paint').length-1;
 if(count===0){if(required)throw Error('Missing service bridge paint repair');return input;}
 if(count!==1||!html.includes(serviceBridgePaintStyle))throw Error('Unexpected service bridge paint repair');
 return Buffer.from(html.replace(serviceBridgePaintStyle,''));
}
