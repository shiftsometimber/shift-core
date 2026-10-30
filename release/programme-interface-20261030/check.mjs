import assert from 'node:assert/strict';
import {release,assetBase,plate,stripOwned,transformHTML,mainHTML} from './layout.mjs';
import css from './styles.mjs';
import {projectiveMatrix,screenQuad,runtime} from './runtime.mjs';
export function check(before,after){
 assert.equal(stripOwned(after),stripOwned(before),'Only the approved screen layer, its marker, style and runtime may change');assert(mainHTML(after));assert(after.includes(plate));assert.equal(after.split(plate).length,2);assert(after.includes('data-programme-interface="'+release+'"'));assert.equal(transformHTML(after,css),after,'Screen replacement must be idempotent');assert(after.includes(assetBase+'today.jpg'));
 const m=projectiveMatrix();for(const [i,[x,y]]of [[0,0],[430,0],[430,920],[0,920]].entries()){assert(Math.abs(m[0]*x+m[2]*y+m[4]-screenQuad[i][0])<5);assert(Math.abs(m[1]*x+m[3]*y+m[5]-screenQuad[i][1])<5);}
 assert(!/\bfetch\s*\(|localStorage|sessionStorage|document\.cookie|SST_API/.test(runtime),'Image framing must not access member data or APIs');
 return{allOriginalPageBytesPreserved:true,allCopyAndLinksPreserved:true,onlyApprovedScreenshotAdded:true,screenCornerProjectionVerified:true,noMemberDataAccess:true,idempotent:true};
}
