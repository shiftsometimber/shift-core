import test from 'node:test';import assert from 'node:assert/strict';
import {nutritionSignposting,preserveNutritionSignposting,NUTRITION_PATHS,NUTRITION_COPY,NUTRITION_NOTE,withNutritionSignposting} from '../public-nutrition-mytimber.mjs';
test('every nutrition route gets an idempotent My Timber recipe link and keeps all reviewed body content',()=>{
 for(const path of NUTRITION_PATHS){const before='<html><h1>Nutrition</h1><p>Reviewed advice, source links and limitations.</p></html>',after=nutritionSignposting(before,path);assert(after.includes(NUTRITION_NOTE));assert.equal(nutritionSignposting(after,path),after);assert.equal(preserveNutritionSignposting(path,Buffer.from(after)).toString(),before)}
 for(const [path,pairs]of Object.entries(NUTRITION_COPY))for(const [old,next]of pairs){const before='<p>'+old+'</p>',after=nutritionSignposting(before,path);assert.equal(after,'<p>'+next+'</p>');assert.equal(preserveNutritionSignposting(path,Buffer.from(after)).toString(),before)}
});
test('nutrition navigation overlay leaves member, API, POST, errors and other documents alone',async()=>{
 for(const [path,method,status,type]of [['/member/grub','GET',200,'text/html'],['/v1/grub/workspace','GET',200,'application/json'],['/tools/protein','POST',200,'text/html'],['/tools/protein','GET',503,'text/html'],['/about','GET',200,'text/html']]){const r=new Response('unchanged',{status,headers:{'content-type':type}});assert.equal(await withNutritionSignposting(new Request('https://example.test'+path,{method}),r),r)}
});
