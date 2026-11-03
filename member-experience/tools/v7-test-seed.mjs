// Synthetic accounts only; public catalogue reads are the only production queries.
import fs from 'node:fs';import crypto from 'node:crypto';
import {cloudflareRequest as cf} from '/Users/shiftsometimberltd/SST/builds/apple-completion-20261024/journey-shop-release-20261031/performance-precompiled-cloudflare-client-20261103.mjs';
import {v7Offer} from '../v7-context.mjs';import {recipeNutrition} from '../v7-nutrition.mjs';
import {v7LoadGrubCatalogue as loadGrubCatalogue,v7UsableCatalogue as usableCatalogue,v7EmptyGrub as emptyGrub,v7RecommendationFor as recommendationFor,v7GrubMemberContext as grubMemberContext} from '/private/tmp/my-timber-v7-captured-programme/worker.mjs';
const A='9e5386dcf455be34c582d93f8bfc79e6',TEST='247b065f-fea4-4891-945b-b707f2417656',PROD='88f40aed-cb23-4372-8c94-8a73f48bc847';
if(TEST===PROD)throw Error('Test database isolation failed');
const query=async(db,sql,params=[])=>{if(db===PROD&&(!/^\s*SELECT\b/i.test(sql)||!sql.includes('structured_content')))throw Error('Production queries must read public structured content only');const r=await cf('/accounts/'+A+'/d1/database/'+db+'/query','POST',{sql,params});if(r.some(x=>x.success===false))throw Error('Database statement failed');return r;};
const literal=v=>v===null?'NULL':typeof v==='number'?String(v):"'"+String(v).replaceAll("'","''")+"'";
const schema=fs.readFileSync('member-experience/v7-food-schema.sql','utf8');await query(TEST,schema);
const count=await query(TEST,"SELECT content_type,COUNT(*) n FROM structured_content WHERE status='published' AND content_type IN ('recipe','exercise') GROUP BY content_type");console.log(JSON.stringify({beforePublicContent:count[0].results}));
if(process.argv.includes('--copy-public')){
 const columns=['id','content_type','title','version','status','data_json','review_json','updated_at'];let cursor='',total=0;
 for(;;){const r=await query(PROD,"SELECT "+columns.join(',')+" FROM structured_content WHERE status='published' AND content_type IN ('recipe','exercise') AND id>? ORDER BY id LIMIT 100",[cursor]),rows=r[0].results;if(!rows.length)break;
  let statements=[],bytes=0;async function flush(){if(statements.length){await query(TEST,statements.join('\n'));statements=[];bytes=0;}}
  for(const row of rows){const sql='INSERT INTO structured_content('+columns.join(',')+') VALUES('+columns.map(k=>literal(row[k])).join(',')+') ON CONFLICT(id) DO UPDATE SET '+columns.slice(1).map(k=>k+'=excluded.'+k).join(',')+';';if(bytes+sql.length>400000)await flush();statements.push(sql);bytes+=sql.length;cursor=row.id;total++;}await flush();
 }
 console.log(JSON.stringify({copiedPublishedPublicRecords:total}));
}
if(process.argv.includes('--cofid')){
 const rows=fs.readFileSync('/private/tmp/my-timber-cofid-2021.sql','utf8').split('\n').filter(s=>s.startsWith('INSERT '));
 for(let i=0;i<rows.length;i+=100)await query(TEST,rows.slice(i,i+100).join('\n'));
 console.log(JSON.stringify({publicCofidFoods:rows.length}));
}
const DB={prepare(sql){const statement={values:[],bind(...v){statement.values=v;return statement},async all(){return (await query(TEST,sql,statement.values))[0]},async first(){return (await statement.all()).results[0]||null}};return statement;}};
const recipes=usableCatalogue(await loadGrubCatalogue(DB));
const dinner=recipes.find(r=>r.meal_type==='dinner'&&recipeNutrition(r)&&r.protein_g>=44&&r.protein_g<=46&&r.minutes<=25)||recipes.find(r=>r.meal_type==='dinner'&&recipeNutrition(r));if(!dinner)throw Error('No sourced reviewed dinner found');
const helpers={emptyGrub,grubMemberContext,recommendationFor:(state,pool,context)=>pool.some(r=>r.id===dinner.id)?{recipe:dinner,reasons:['Picked because you said late finishes make dinner hard.']}:recommendationFor(state,pool,context)};
const access=JSON.parse(fs.readFileSync('/private/tmp/my-timber-v7-test-access.json','utf8')),at=new Date().toISOString(),on=at.slice(0,10);
const minus=(days)=>new Date(Date.parse(on+'T12:00:00Z')-days*86400000).toISOString().slice(0,10);
const result=[];
for(const [name,account] of Object.entries(access.cases)){
 if(!account.email.endsWith('@example.invalid')||account.id<900710001||account.id>900710003)throw Error('Synthetic account identity failed');
 const old=(await query(TEST,'SELECT email FROM users WHERE id=?',[account.id]))[0].results[0];if(old&&old.email!==account.email)throw Error('Synthetic ID is already owned by another account');
 await query(TEST,'INSERT INTO users(id,email,first_name,last_name) VALUES(?,?,?,?) ON CONFLICT(id) DO NOTHING',[account.id,account.email,'V7 synthetic',name]);
 const progress={version:3,revision:0,goalId:'personal-start',goal:'Playing football with my lad',entries:[],operations:[],v7:{version:1,preferences:{showWeight:true,lead:'weight'},days:{},milestones:{},activityReadings:[]}};
 const number=name==='milestone'?29:12;
 for(let n=1;n<=number;n++){const date=minus(n+(name==='hard-week'?8:0));progress.v7.days[date]={on:date,selected:{id:'synthetic:ordinary-step',kind:'routine',name:'An ordinary useful step'},log:{id:'synthetic-'+name+'-'+n,at:date+'T17:00:00Z',action:{id:'synthetic:ordinary-step',kind:'routine',name:'An ordinary useful step'}}};}
 const prefs={food:{protein_target:120,calorie_target:2200},grubV2:emptyGrub(),myJourney:{setup:{completedAt:at,paused:false}},movement:{minutes_per_day:20,equipment:'dumbbells'},lifeBack:{progress}};
 const offer=v7Offer(prefs,recipes,at,helpers);if(offer.action.kind==='food'&&offer.alternatives.length!==3)throw Error('Three protein-matched alternatives could not be prepared');
 progress.v7.offers={on,grubRevision:0,foodChoices:JSON.stringify(prefs.food),action:offer.action,alternatives:offer.alternatives};
 await query(TEST,'INSERT INTO member_state(user_id,preferences) VALUES(?,?) ON CONFLICT(user_id) DO UPDATE SET preferences=excluded.preferences',[account.id,JSON.stringify(prefs)]);
 await query(TEST,"INSERT INTO consents(user_id,consent_type,consent_version,granted,granted_at) VALUES(?,'my_shift_health_tracking','synthetic-v7',1,?)",[account.id,at]);
 const hash=crypto.createHash('sha256').update(account.token).digest('hex');await query(TEST,'INSERT INTO user_sessions(user_id,token_hash,expires_at) VALUES(?,?,?) ON CONFLICT(token_hash) DO UPDATE SET expires_at=excluded.expires_at,revoked_at=NULL',[account.id,hash,new Date(Date.now()+7*86400000).toISOString()]);
 result.push({case:name,account:account.email,seedLogs:number,original:offer.action.id,swaps:offer.alternatives.length});
}
fs.writeFileSync('member-experience/v7-release-evidence/test-accounts.json',JSON.stringify({syntheticOnly:true,noPurchasesOrMessages:true,accounts:result},null,2)+'\n');
console.log(JSON.stringify({syntheticAccounts:result,reviewedRecipes:recipes.length}));
