import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {writeFileSync,mkdirSync,readFileSync} from 'node:fs';
import {gzipSync} from 'node:zlib';
import {loadGovernedGrubCatalogue} from '../grub-expansion-authority-v1.mjs';
import {loadGovernedFitCatalogue} from '../fit-expansion-authority-v1.mjs';
import {publicHeader,publicDrawer,publicFooter} from '../public-shell-contract.mjs';
import {recipeProjection,exerciseProjection,slug} from './projection.mjs';

const directory='aeo-geo-proof';mkdirSync(directory,{recursive:true});
const account=process.env.CLOUDFLARE_ACCOUNT_ID,token=process.env.CLOUDFLARE_API_TOKEN;
const database='88f40aed-cb23-4372-8c94-8a73f48bc847';
// Only the exact existing catalogue reader is supported. No schema initialiser,
// arbitrary SQL, member table, identity or account write can reach this adapter.
const queryPattern=/^SELECT id,title,version,data_json,review_json,updated_at FROM structured_content WHERE content_type='(?:recipe|exercise)' AND status='published' AND id > \? ORDER BY id LIMIT \?$/;
let calls=0;const DB={prepare(sql){assert(queryPattern.test(sql),'Unexpected database access');return {bind(...params){return {async all(){
 calls++;
 const response=await fetch('https://api.cloudflare.com/client/v4/accounts/'+account+'/d1/database/'+database+'/query',{
  method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({sql,params}),signal:AbortSignal.timeout(45000)});
 const body=await response.json();assert(response.ok&&body.success,'Read-only catalogue snapshot failed');
 const result=body.result[0];assert(result.success&&Array.isArray(result.results));return result;
}}}}}};
let grub,fit;
if(process.env.AEO_FIXTURE){
 const fixture=JSON.parse(readFileSync(process.env.AEO_FIXTURE));({grub,fit}=fixture);
}else{
 assert.equal(account,'9e5386dcf455be34c582d93f8bfc79e6');assert(token,'Existing read credential required');
 ({authority:grub}=await loadGovernedGrubCatalogue(DB));
 ({authority:fit}=await loadGovernedFitCatalogue(DB));
}
assert.equal(grub.incomplete,false,grub.reason);assert.equal(fit.incomplete,false,fit.reason);
const eligible=grub.rows.filter(r=>r.discovery?.eligible===true);
assert(eligible.length>2000,'Unexpected governed recipe partition');
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const unique=new Map(),alias={};let incomplete=0;
for(const row of eligible){
 const recipe=recipeProjection(row);if(!recipe){incomplete++;continue;}
 // Respect the approved image suppression decision, including saved references.
 if(row.discovery?.hideImage||row.discovery?.image_policy==='suppress_until_dish_and_portion_checked')recipe.image=null;
 const identity=hash({title:recipe.title,ingredients:recipe.ingredients,method:recipe.method,servings:recipe.servings,nutrition:recipe.nutrition});
 if(unique.has(identity)){alias[row.id]=unique.get(identity).path;continue;}
 const path='/recipes/'+slug(recipe.title)+'-'+hash(row.id).slice(0,8);
 unique.set(identity,{...recipe,path,description:recipe.title+'. Ingredients, step-by-step method and estimated nutrition per serving. Save your food plans in My Timber.'});
}
const recipes=[...unique.values()].sort((a,b)=>a.title.localeCompare(b.title,'en-GB'));
const exercises=exerciseProjection(fit.rows).map(e=>({...e,path:'/exercises/'+slug(e.id),description:e.title+': written movement steps, equipment and example doses. General information to help you choose an appropriate starting point.'})).sort((a,b)=>a.title.localeCompare(b.title,'en-GB'));
assert.equal(exercises.length,300,'Do not silently drop canonical movement instructions');
const publishedAt=new Date().toISOString();
const data={publishedAt,recipes,exercises,aliases:alias};
const json=JSON.stringify(data),packed=gzipSync(json,{level:9});
writeFileSync(directory+'/public-catalogue.json',JSON.stringify(data,null,2));
writeFileSync(directory+'/data.mjs','const packed='+JSON.stringify(packed.toString('base64'))+';\nlet ready;\nexport function catalogue(){return ready??=new Response(new Blob([Uint8Array.from(atob(packed),c=>c.charCodeAt(0))]).stream().pipeThrough(new DecompressionStream("gzip"))).json();}\n');
writeFileSync(directory+'/shell.mjs','export const header='+JSON.stringify(publicHeader+publicDrawer+'<div class="drawer-backdrop" hidden></div>')+';\nexport const footer='+JSON.stringify(publicFooter)+';\n');
writeFileSync(directory+'/public-urls.csv','type,url\n'+[...recipes.map(r=>['recipe',r.path]),...exercises.map(r=>['exercise',r.path])].map(([type,path])=>type+',https://shiftsometimber.co.uk'+path).join('\n')+'\n');
const proof={at:publishedAt,source:process.env.GITHUB_SHA,readOnlyQueries:calls,memberTablesRead:0,databaseWrites:0,governedRecipes:grub.rows.length,eligibleRecipes:eligible.length,excludedRecipes:grub.rows.length-eligible.length,duplicateRecipes:eligible.length-recipes.length-incomplete,incompleteRecipes:incomplete,publicRecipes:recipes.length,recipesWithImages:recipes.filter(r=>r.image).length,governedExerciseVariants:fit.rows.length,publicExercises:exercises.length,uncompressedBytes:Buffer.byteLength(json),compressedBytes:packed.length,projectionSHA256:hash(data),independentClinicalReviewClaimed:false};
writeFileSync(directory+'/catalogue-proof.json',JSON.stringify(proof,null,2));console.log(JSON.stringify(proof));
