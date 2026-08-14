import fs from 'node:fs';
const module=fs.readFileSync('knowledge-editorial-v1.js','utf8');
const entry=fs.readFileSync('worker-entry-v6.js','utf8');
const fail=[];const need=(ok,msg)=>{if(!ok)fail.push(msg)};
need(/knowledge_article_reviews/.test(module),'retained review table missing');
need(/WRITE_ROLES=new Set\(\['owner','admin','marketing','content'\]\)/.test(module),'content-write role boundary missing');
need(/editorial_review_required/.test(module),'publish cannot be blocked before retained approval');
need(/reviewer_name/.test(module)&&/reviewer_email/.test(module)&&/reviewed_at/.test(module),'named reviewer provenance missing');
need(/changes_requested/.test(module)&&/approved/.test(module),'review decisions missing');
need(/import \{knowledgeEditorialRoutes\} from '\.\/knowledge-editorial-v1\.js'/.test(entry),'editorial route not imported by production entry');
need(entry.indexOf('knowledgeEditorialRoutes(request,env,ctx)')<entry.indexOf('memberCommissioningRoute(request,env,ctx)'),'editorial route does not intercept legacy HQ article route before fallback');
if(fail.length){console.error(JSON.stringify({proof:'G3-006_EDITORIAL_SOURCE',fail},null,2));process.exit(1)}
console.log(JSON.stringify({proof:'G3-006_EDITORIAL_SOURCE',status:'PASS',checks:['retained review state','content-write role boundary','publish requires approval','named reviewer provenance','approve/changes-requested decisions','production route wired before legacy fallback']},null,2));
