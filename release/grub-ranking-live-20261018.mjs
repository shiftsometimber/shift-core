import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {memberExperienceRoutes} from '../member-experience/entry.mjs';
import {withStartupStability} from '../public-startup-stability.mjs';
import {pathToFileURL} from 'node:url';
const sha=value=>createHash('sha256').update(value).digest('hex');
const origin='https://shiftsometimber.co.uk',assetPath='/assets/member-experience/grub.mjs';
// The unchanged serving entry returns the qualified raw asset, then the actual
// public startup adapter invokes the approved book-voice adapter for this JS.
// Expected bytes follow that original pipeline; actual network bytes never
// enter the transformation or receive normalisation.
export async function expectedGrubAssetResponse(){
 const request=new Request(origin+assetPath,{method:'GET',headers:{'Cache-Control':'no-cache'}});
 const raw=memberExperienceRoutes(request,{MEMBER_EXPERIENCE_V1_ENABLED:'true'});assert(raw);assert.equal(raw.status,200);
 return withStartupStability(request,raw);
}
export async function verifyGrubLive({fetcher=fetch}={}){
 const rows=[],expected=await expectedGrubAssetResponse(),expectedBody=await expected.text();
 const asset=await fetcher(origin+assetPath,{headers:{'Cache-Control':'no-cache'},redirect:'manual',signal:AbortSignal.timeout(30000)});assert.equal(asset.status,200,'Serving Grub script required');assert.equal(asset.headers.get('content-type'),expected.headers.get('content-type'),'Original serving asset content type required');
 const text=await asset.text();assert.equal(text,expectedBody,'Serving whole Grub script must match the exact qualified source through the original public presentation pipeline');assert.equal(asset.headers.get('X-Shift-Book-Voice'),expected.headers.get('X-Shift-Book-Voice'),'Original owner-approved book voice policy header required');assert.match(asset.headers.get('cache-control')||'',/no-store/);
 rows.push({path:assetPath,status:200,sha256:sha(text),bytes:Buffer.byteLength(text),wholeSourceMatched:true,expectedPipeline:'memberExperienceRoutes → withStartupStability → withBookVoice',bookVoice:expected.headers.get('X-Shift-Book-Voice')});
 for(const domain of [origin,'https://api.shiftsometimber.co.uk'])for(const path of ['/v1/grub/workspace','/v1/member/details','/v1/member/details/gp-search?q=London']){
  const response=await fetcher(domain+path,{headers:{'Cache-Control':'no-cache',Origin:domain},redirect:'manual',signal:AbortSignal.timeout(30000)});
  assert.equal(response.status,401,'Private Grub and existing GP routes require authentication');assert.match(response.headers.get('cache-control')||'',/no-store/);assert.match(response.headers.get('vary')||'',path.startsWith('/v1/grub/')?/Origin/i:/Cookie/i);
  const body=await response.json();assert.equal(body.error,'authentication_required');rows.push({origin:domain,path:path.split('?')[0],status:401,privateDenialVerified:true});
 }
 return {checks:rows,dataWrites:0,externalMessages:0,authenticatedMemberAcceptance:false,physicalDeviceAcceptance:false};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)verifyGrubLive().then(value=>console.log(JSON.stringify(value))).catch(error=>{console.error(error);process.exitCode=1;});
