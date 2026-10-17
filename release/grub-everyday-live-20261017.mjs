import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {grubRuntime} from '../member-experience/grub-runtime.mjs';
import {pathToFileURL} from 'node:url';
const sha=value=>createHash('sha256').update(value).digest('hex');
export async function verifyGrubLive({fetcher=fetch}={}){
 const rows=[],origin='https://shiftsometimber.co.uk';
 const asset=await fetcher(origin+'/assets/member-experience/grub.mjs',{headers:{'Cache-Control':'no-cache'},redirect:'manual',signal:AbortSignal.timeout(30000)});assert.equal(asset.status,200,'Serving Grub script required');assert.match(asset.headers.get('content-type')||'',/(javascript|ecmascript)/i);
 const text=await asset.text();assert.equal(text,grubRuntime,'Serving whole Grub script must match the exact qualified source');rows.push({path:'/assets/member-experience/grub.mjs',status:200,sha256:sha(text),bytes:Buffer.byteLength(text),wholeSourceMatched:true});
 for(const domain of [origin,'https://api.shiftsometimber.co.uk'])for(const path of ['/v1/grub/workspace','/v1/member/details','/v1/member/details/gp-search?q=London']){
  const response=await fetcher(domain+path,{headers:{'Cache-Control':'no-cache',Origin:domain},redirect:'manual',signal:AbortSignal.timeout(30000)});
  assert.equal(response.status,401,'Private Grub and existing GP routes require authentication');assert.match(response.headers.get('cache-control')||'',/no-store/);assert.match(response.headers.get('vary')||'',path.startsWith('/v1/grub/')?/Origin/i:/Cookie/i);
  const body=await response.json();assert.equal(body.error,'authentication_required');rows.push({origin:domain,path:path.split('?')[0],status:401,privateDenialVerified:true});
 }
 return {checks:rows,dataWrites:0,externalMessages:0,authenticatedMemberAcceptance:false,physicalDeviceAcceptance:false};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)verifyGrubLive().then(value=>console.log(JSON.stringify(value))).catch(error=>{console.error(error);process.exitCode=1;});
