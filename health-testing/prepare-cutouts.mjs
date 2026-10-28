// Package image-editing cutouts for the site. Keep source photographs unchanged.
import {readFileSync,writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {productMedia} from './media.mjs';
const require=createRequire(import.meta.url);
const sharp=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/sharp');
const root=new URL('./',import.meta.url);
const manifest=JSON.parse(readFileSync(new URL('cutout-edits.json',root),'utf8'));
const embed={};
const imageModule=await import('./media-data.mjs');
Object.assign(embed,imageModule.productImageData);
for(const edit of manifest.edits){
 const {data,info}=await sharp(edit.path).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const {width:w,height:h}=info,n=w*h,visited=new Uint8Array(n),queue=new Int32Array(n);
 let first=0,last=0;
 const background=i=>data[i*4+3]===0||(data[i*4]>=248&&data[i*4+1]>=248&&data[i*4+2]>=248);
 const add=i=>{if(i>=0&&i<n&&!visited[i]&&background(i)){visited[i]=1;queue[last++]=i;}};
 for(let i=0;i<n;i++)if(data[i*4+3]===0)add(i);
 for(let x=0;x<w;x++){add(x);add((h-1)*w+x);}
 for(let y=0;y<h;y++){add(y*w);add(y*w+w-1);}
 while(first<last){const i=queue[first++],x=i%w;data[i*4+3]=0;if(x)add(i-1);if(x<w-1)add(i+1);add(i-w);add(i+w);}
 // Remove a one-pixel fringe before downsampling the alpha channel.
 const originalAlpha=new Uint8Array(n);for(let i=0;i<n;i++)originalAlpha[i]=data[i*4+3];
 for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){const i=y*w+x;if(originalAlpha[i])data[i*4+3]=Math.min(originalAlpha[i],originalAlpha[i-1],originalAlpha[i+1],originalAlpha[i-w],originalAlpha[i+w]);}
 let output=sharp(data,{raw:{width:w,height:h,channels:4}}).trim({background:'#00000000',threshold:10});
 const cropped=await output.png().toBuffer();
 const packed=await sharp(cropped).resize(680,680,{fit:'inside',withoutEnlargement:true}).extend({top:12,bottom:12,left:12,right:12,background:'#00000000'}).webp({quality:86,alphaQuality:100}).toBuffer();
 const key='cutout-'+edit.id;
 writeFileSync(new URL('assets/'+key+'.webp',root),packed);
 embed[key]='data:image/webp;base64,'+packed.toString('base64');
 productMedia[edit.id].gallery=[key];
 console.log(edit.id+': transparent cutout, '+packed.length+' bytes');
}
// Only one complete product view per page. All supporting instructions retain
// their original transparent source photographs.
for(const product of Object.values(productMedia))product.gallery=product.gallery.slice(0,1);
// Native transparent supplier photos need only excess canvas trimmed away.
for(const [id,product] of Object.entries(productMedia)){
 const old=product.gallery[0];if(id==='general-health-bundle'||!old.startsWith('photo-'))continue;
 const bytes=Buffer.from(embed[old].split(',')[1],'base64');
 const trimmed=await sharp(bytes).trim({background:'#00000000',threshold:5}).png().toBuffer();
 const packed=await sharp(trimmed).resize(680,680,{fit:'inside',withoutEnlargement:true}).extend({top:12,bottom:12,left:12,right:12,background:'#00000000'}).webp({quality:86,alphaQuality:100}).toBuffer();
 const key='product-'+id;writeFileSync(new URL('assets/'+key+'.webp',root),packed);embed[key]='data:image/webp;base64,'+packed.toString('base64');product.gallery=[key];
}
productMedia['general-health-bundle']={gallery:['thyroid','vitamin-d','iron','cholesterol','kidney-health'].map(id=>productMedia[id].gallery[0]),steps:{},layout:'collection'};
const used=new Set(Object.values(productMedia).flatMap(p=>[...p.gallery,...Object.values(p.steps)]));
for(const key of Object.keys(embed))if(!used.has(key))delete embed[key];
writeFileSync(new URL('media.mjs',root),'export const productMedia='+JSON.stringify(productMedia)+';\nexport const imagePath=key=>"/shift-health/assets/testing-"+key+".webp";\n');
writeFileSync(new URL('media-data.mjs',root),'// Product cutouts and original transparent instruction photographs.\nexport const productImageData='+JSON.stringify(embed)+';\n');
