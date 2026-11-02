// Fixed build-time data only. No request or completed member response enters here.
import {gunzipSync} from 'node:zlib';
const fixedTextValues=new WeakMap();
function decode(data){return gunzipSync(new Uint8Array(data)).toString('utf8');}
export function decodeStaticText(data){
 let value=fixedTextValues.get(data);
 if(value===undefined){value=decode(data);fixedTextValues.set(data,value);}
 return value;
}
export function parseStaticData(data){
 // Parse separately on every original literal occurrence; never share objects.
 // The decoded JSON input is temporary and is not added to a string cache.
 return JSON.parse(decode(data));
}
