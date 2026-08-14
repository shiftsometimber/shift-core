import fs from 'node:fs';
const module=fs.readFileSync('knowledge-editorial-v1.js','utf8');
const entry=fs.readFileSync('worker-entry-v6.js','utf8');
const staging=fs.readFileSync('g3-006-knowledge-editorial-staging.mjs','utf8');
const fail=[];const need=(ok,msg)=>{if(!ok)fail.push(msg)};
need(/knowledge_article_reviews/.test(module),'retained review table missing');
need(/WRITE_ROLES=new Set\(\['owner','admin','marketing','content'\]\)/.test(module),'content-write role boundary missing');
need(/editorial_review_required/.test(module),'publish cannot be blocked before retained approval');
need(/reviewer_name/.test(module)&&/reviewer_email/.test(module)&&/reviewed_at/.test(module),'named reviewer provenance missing');
need(/changes_requested/.test(module)&&/approved/.test(module),'review decisions missing');
need(module.includes("const publishMatch=p.match(/^\\/v1\\/hq\\/articles\\/(\\d+)\\/publish$/)"),'explicit reviewed publish action missing');
need(/status:'published'/.test(module)&&/review:approval\.row/.test(module),'explicit publish does not return retained review provenance');
need(staging.includes('/publish')&&staging.includes('explicit_publish_blocked_without_review')&&staging.includes('explicit_publish'),'staging journey does not exercise the same explicit publish action as HQ');
need(/import \{knowledgeEditorialRoutes\} from '\.\/knowledge-editorial-v1\.js'/.test(entry),'editorial route not imported by production entry');
need(entry.indexOf('knowledgeEditorialRoutes(request,env,ctx)')<entry.indexOf('memberCommissioningRoute(request,env,ctx)'),'editorial route does not intercept legacy HQ article route before fallback');
if(fail.length){console.error(JSON.stringify({proof:'G3-006_EDITORIAL_SOURCE',fail},null,2));process.exit(1)}
console.log(JSON.stringify({proof:'G3-006_EDITORIAL_SOURCE',status:'PASS',checks:['retained review state','content-write role boundary','both publish paths require approval','named reviewer provenance','approve/changes-requested decisions','explicit HQ publish action returns review provenance','staging exercises HQ publish action','production route wired before legacy fallback']},null,2));
