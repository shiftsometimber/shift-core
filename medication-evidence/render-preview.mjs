import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {transformMedicationDocument} from './transform.mjs';
import {recipes} from './recipes.mjs';
const root=fileURLToPath(new URL('../../medication-audit/',import.meta.url));mkdirSync(root+'after',{recursive:true});
const report=[];for(const [path,recipe] of Object.entries(recipes)){
 const name=path.slice(1).replaceAll('/','--'),before=readFileSync(root+'before/'+name+'.html','utf8'),out=await transformMedicationDocument(before,path);writeFileSync(root+'after/'+name+'.html',out.html);
 report.push({path,state:out.state,beforeBytes:Buffer.byteLength(before),afterBytes:Buffer.byteLength(out.html),mainSha256:recipe.mainAfterSha256});
}
writeFileSync(root+'render-proof.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report.map(({path,state,beforeBytes,afterBytes})=>({path,state,beforeBytes,afterBytes})),null,2));
