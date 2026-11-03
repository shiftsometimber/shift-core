import {readFileSync,writeFileSync,readdirSync,mkdirSync} from 'node:fs';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url),toolRoot='/workspace/scratch/05ae9eb2f253/medication-build-tools/node_modules';
const {PurgeCSS}=require(toolRoot+'/purgecss'),{Resvg}=require(toolRoot+'/@resvg/resvg-js'),{transform}=require(toolRoot+'/esbuild');
const root=fileURLToPath(new URL('.',import.meta.url)),audit=fileURLToPath(new URL('../../medication-audit/',import.meta.url));
const recipes=JSON.parse(readFileSync(root+'recipes.json','utf8')),before=readdirSync(audit+'before').filter(n=>n.endsWith('.html')).map(n=>readFileSync(audit+'before/'+n,'utf8'));
const scriptDir=audit+'scripts';let scripts='';try{scripts=readdirSync(scriptDir).filter(n=>!n.startsWith('medication-')).map(n=>readFileSync(scriptDir+'/'+n,'utf8')).join('\n')}catch{}
const revised=Object.entries(recipes).map(([path,r])=>{const raw=readFileSync(audit+'before/'+path.slice(1).replaceAll('/','--')+'.html','utf8');return raw.replace(/<main\b[\s\S]*?<\/main>/i,()=>r.main)});
const content=revised.map(s=>s.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,'')).join('\n')+'\n'+scripts;
const cssMap=new Map();for(const [i,html] of revised.entries())if(Object.values(recipes)[i].kind!=='benchmark')for(const m of html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi))if(m[1].length>3000)cssMap.set(createHash('sha256').update(m[1]).digest('hex'),m[1]);
const critical={},proof=[];
for(const [sha,css] of cssMap){
 const [purged]=await new PurgeCSS().purge({content:[{raw:content,extension:'html'}],css:[{raw:css}],safelist:{standard:[/^is-/,/^has-/,/^(open|active|visible|selected|hidden|loading)$/],greedy:[/cookie/i,/basket/i,/menu/i,/drawer/i,/ticker/i,/header/i,/footer/i,/feedback/i,/modal/i,/dialog/i,/toast/i,/timber/i]},keyframes:false,fontFace:false,variables:false});
 const minified=await transform(purged.css,{loader:'css',minify:true,target:'es2020'});critical[sha]=minified.code.trim();proof.push({sha256:sha,before:Buffer.byteLength(css),after:Buffer.byteLength(critical[sha])});
}
writeFileSync(root+'critical.mjs','export const criticalStyles='+JSON.stringify(critical)+';\n');writeFileSync(audit+'css-proof.json',JSON.stringify(proof,null,2));
const images={},assetProof=[];mkdirSync(audit+'images',{recursive:true});
for(const [path,recipe] of Object.entries(recipes)){
 if(!recipe.image)continue;const slug=path.slice(1).replaceAll('/','--'),svg=readFileSync(root+'artwork/'+slug+'.svg','utf8');
 const png=new Resvg(svg,{font:{defaultFontFamily:'DejaVu Sans',loadSystemFonts:true}}).render().asPng(),sha256=createHash('sha256').update(png).digest('hex');
 writeFileSync(audit+'images/'+slug+'.png',png);images[recipe.image]={base64:png.toString('base64'),sha256};assetProof.push({path:recipe.image,width:1200,height:630,bytes:png.length,sha256});
}
writeFileSync(root+'images.mjs','export const images='+JSON.stringify(images)+';\n');writeFileSync(audit+'image-proof.json',JSON.stringify(assetProof,null,2));console.log(JSON.stringify({criticalCSS:proof,images:assetProof.length,imageBytes:assetProof.reduce((a,x)=>a+x.bytes,0)}));
