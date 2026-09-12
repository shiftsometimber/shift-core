import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {build} from 'esbuild';
test('bundled recipe renderer runs in the browser without server bundle helpers',async()=>{
 const bundle=await build({entryPoints:['member-experience/grub-client.mjs'],bundle:true,format:'esm',keepNames:true,write:false});
 const module=await import('data:text/javascript;base64,'+Buffer.from(bundle.outputFiles[0].text).toString('base64'));
 const html=vm.runInNewContext('('+module.recipeSource+')(meal)',{esc:x=>String(x??''),meal:{name:'Chicken noodles',servings:2,ingredients:[{amount:'100g',item:'chicken'},{amount:'60g',item:'noodles'}],method:['Cook the chicken.','Serve with noodles.'],minutes:20,protein_g:31.6,kcal:410}});
 assert.match(html,/<summary>Ingredients &amp; cooking instructions/);assert.match(html,/100g.*chicken/);assert.match(html,/<li>Cook the chicken\.<\/li>/);assert.match(html,/31.6g protein/);assert.doesNotMatch(html,/Preview result|READY TO GO|25g protein/);
});
