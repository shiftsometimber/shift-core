import fs from 'node:fs';
import path from 'node:path';

export async function captureLiveReleaseFingerprint(site,outDir){
  const stamp=Date.now();
  const specs=[['dashboard',`${site}/member/dashboard?commission=${stamp}`],['shell',`${site}/member-shell-v33g.js?commission=${stamp}`],['p0css',`${site}/member-p0-v1.css?commission=${stamp}`]];
  const result={proof:'GATE1_LIVE_FRONTEND_RELEASE_FINGERPRINT',capturedAt:new Date().toISOString(),resources:{},checks:{}};
  for(const [key,url] of specs){try{const r=await fetch(url,{headers:{'Cache-Control':'no-cache'}});const text=await r.text();result.resources[key]={status:r.status,ok:r.ok,url:r.url,bytes:text.length};result.resources[key].markers={shellReferenced:key==='dashboard'?/member-shell-v33g\.js/.test(text):undefined,canonicalNav:key==='shell'?/\/member\/dashboard/.test(text):undefined,noticeNonBlocking:key==='shell'?/pointer-events:none/.test(text):undefined,drawerContained:key==='p0css'?/contain:layout paint!important/.test(text):undefined,drawerOpenRule:key==='p0css'?/\.ask-drawer\.open/.test(text):undefined};fs.writeFileSync(path.join(outDir,`live-${key}.txt`),text)}catch(e){result.resources[key]={status:0,ok:false,error:String(e?.message||e)}}}
  result.checks={dashboardLoads:!!result.resources.dashboard?.ok,shellLoads:!!result.resources.shell?.ok,cssLoads:!!result.resources.p0css?.ok,dashboardReferencesShell:result.resources.dashboard?.markers?.shellReferenced===true,shellHasCanonicalNav:result.resources.shell?.markers?.canonicalNav===true,shellHasNonBlockingNotice:result.resources.shell?.markers?.noticeNonBlocking===true,cssHasContainedClosedDrawer:result.resources.p0css?.markers?.drawerContained===true,cssHasOpenDrawerRule:result.resources.p0css?.markers?.drawerOpenRule===true};
  result.ok=Object.values(result.checks).every(Boolean);fs.writeFileSync(path.join(outDir,'live-release-fingerprint.json'),JSON.stringify(result,null,2));return result;
}
