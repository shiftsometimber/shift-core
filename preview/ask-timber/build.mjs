import {mkdirSync,writeFileSync,readFileSync,copyFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {withSessionState} from '../../member-experience/session-state.mjs';
import {memberExperienceEntry} from '../../member-experience/entry.mjs';
import {reconcilePublicDocument} from '../../public-shell-contract.mjs';
const dir='preview/ask-timber/generated';mkdirSync(dir+'/assets/assets',{recursive:true});mkdirSync(dir+'/evidence',{recursive:true});
const queries={
 legacy:"SELECT c.id,c.document_id,c.content,d.title,d.source_uri,d.trust_tier,d.status FROM ai_knowledge_chunks c JOIN ai_knowledge_documents d ON d.id=c.document_id WHERE d.status='approved' ORDER BY d.trust_tier,c.id LIMIT 3000",
 graph:"SELECT n.id,n.label,n.domain,n.data_json,n.updated_at,s.source_type,s.source_ref,s.authority,s.verified_at,s.expires_at,s.provenance_json FROM shift_knowledge_nodes n LEFT JOIN shift_knowledge_sources s ON s.node_id=n.id WHERE n.status='active' ORDER BY COALESCE(s.authority,50) DESC,n.updated_at DESC LIMIT 3000",
 watch:'SELECT * FROM medicines_watch_checks'
};
const snapshot={};
for(const [name,sql] of Object.entries(queries)){
 const r=await fetch(`https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/d1/database/88f40aed-cb23-4372-8c94-8a73f48bc847/query`,{method:'POST',headers:{Authorization:'Bearer '+process.env.CLOUDFLARE_API_TOKEN,'Content-Type':'application/json'},body:JSON.stringify({sql}),signal:AbortSignal.timeout(30000)});
 const data=await r.json();if(!r.ok||!data.success)throw Error('Read-only public evidence snapshot failed: '+name+' '+r.status);
 snapshot[name]=data.result[0].results;
}
const sha256=s=>createHash('sha256').update(s).digest('hex');
const page=await fetch('https://0da69833.projectshift.pages.dev/ask-timber');if(!page.ok)throw Error('Pinned Pages unavailable');
let html=await page.text();const pageHash=sha256(html);
html=html.replace(/<head([^>]*)>/i,'<head$1><meta name="robots" content="noindex,nofollow"><script>window.SST_API_BASE=location.origin;</script>');
html=html.replace(/<body([^>]*)>/i,'<body$1><aside style="padding:12px;background:#e7e3da;color:#050505;text-align:center">Ask Timber repair preview — public information only. No member account or saved history is connected.</aside>');
writeFileSync(dir+'/assets/index.html',html);
for(const name of ['ask-timber-v1.js','ask-timber-v1.css','ask-timber-intent-v2.js'])copyFileSync('frontend/member/assets/'+name,dir+'/assets/assets/'+name);
copyFileSync('frontend/member/api-adapter-v33d.js',dir+'/assets/api-adapter-v33d.js');
const loginSource=readFileSync('frontend/member/my-timber-preview.html','utf8');
writeFileSync(dir+'/assets/login.html',reconcilePublicDocument(withSessionState(loginSource),'/member-login'));
const dashboard=await memberExperienceEntry(new Request('https://shiftsometimber.co.uk/member/dashboard'),{MEMBER_EXPERIENCE_V1_ENABLED:'true'},new Response(withSessionState(loginSource),{headers:{'Content-Type':'text/html'}}));
writeFileSync(dir+'/assets/dashboard.html',await dashboard.text());
const memberAssetNames=[...new Set([...loginSource.matchAll(/(?:src|href)=["']\/([^"'?]+)(?:\?[^"']*)?["']/g)].map(m=>m[1]).filter(path=>/\.(?:css|js)$/.test(path)&&!path.includes('/')))];
for(const name of memberAssetNames){try{copyFileSync('frontend/member/'+name,dir+'/assets/'+name)}catch{/* Unowned public assets retain the pinned Pages origin. */}}
writeFileSync(dir+'/snapshot.json',JSON.stringify(snapshot));
const identity={createdAt:new Date().toISOString(),commit:process.env.GITHUB_SHA,pages:'0da69833-83f7-4c70-9c7a-bceab7de1660',pageSha256:pageHash,publicSnapshotSha256:sha256(JSON.stringify(snapshot)),counts:Object.fromEntries(Object.entries(snapshot).map(([k,v])=>[k,v.length])),productionWrites:0,privateRecords:0,preview:'https://shift-ask-timber-preview.matobrien.workers.dev'};
writeFileSync(dir+'/identity.json',JSON.stringify(identity));writeFileSync(dir+'/evidence/identity.json',JSON.stringify(identity,null,2));console.log(JSON.stringify(identity));
const question='I need to loose weight fast. Help me';
for(const useJourney of [true,false]){
 try{const r=await fetch('https://api.shiftsometimber.co.uk/v1/ai/chat',{method:'POST',headers:{Origin:'https://shiftsometimber.co.uk','Content-Type':'application/json'},body:JSON.stringify({message:question,useJourney}),signal:AbortSignal.timeout(70000)});writeFileSync(dir+'/evidence/production-'+useJourney+'.json',JSON.stringify({at:new Date().toISOString(),status:r.status,body:await r.text()}));}catch(e){writeFileSync(dir+'/evidence/production-'+useJourney+'.json',JSON.stringify({error:e.name}));}
}
