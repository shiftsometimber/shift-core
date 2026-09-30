// Extend the historical exact-source gates only for Matt's approved homepage insertion.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
export const HOME_BANNER_PREVIEW='a6df71e802cd6296f5f2af28fe8f347fec92ce12';
export const HOME_BANNER_RUN=36694132592;
export const HOME_BANNER_PATHS=new Set(['.github/workflows/cloudflare-production-promote.yml','release/home-banner-live.cjs','home-route-banner.mjs','home-route-font.mjs','public-startup-stability.mjs','release/member-details-preservation.mjs','release/home-banner-scope.mjs','tests/home-route-banner.test.mjs','.github/workflows/home-banner-preview.yml','preview/home-banner/banner.mjs','preview/home-banner/assets/barlow-condensed-700.ttf','preview/home-banner/assets/OFL.txt','preview/home-banner/build.mjs','preview/home-banner/worker.mjs','preview/home-banner/wrangler.jsonc','preview/home-banner/verify.cjs']);
const read=(ref,p)=>execFileSync('git',['show',ref+':'+p],{encoding:'utf8'});
export function originalHomeSpeedSource(path,source){
 if(path==='public-startup-stability.mjs')return source.replace("import {addHomeBanner} from './home-route-banner.mjs';\n",'').replace('return addHomeBanner(repairHomeSpeed(html,path,{final:true}));','return repairHomeSpeed(html,path,{final:true});');
 if(path==='release/member-details-preservation.mjs')return source.replace("import {removeHomeBanner} from '../home-route-banner.mjs';\n",'').replace("const original=body.toString('utf8');const text=path==='/'?removeHomeBanner(original):original;body=Buffer.from(text);let before=text;","const text=body.toString('utf8');let before=text;").replace("assert.equal(path==='/'?removeHomeBanner(stabilisePublicHtml(path,before)):stabilisePublicHtml(path,before),text,","assert.equal(stabilisePublicHtml(path,before),text,");
 return source;
}
export function validateHomeBanner(){
 const workflow=read('HEAD','.github/workflows/cloudflare-production-promote.yml').replace('node --test tests/home-route-banner.test.mjs tests/app-layout-live.test.mjs','node --test tests/app-layout-live.test.mjs').replace('          node release/home-banner-live.cjs\n','');
 assert.equal(workflow,read('e518a5d97b9682afb07ee932057c3414251093ab','.github/workflows/cloudflare-production-promote.yml'),'Existing production gates changed');
 for(const p of ['public-startup-stability.mjs','release/member-details-preservation.mjs'])assert.equal(originalHomeSpeedSource(p,read('HEAD',p)),read('e518a5d97b9682afb07ee932057c3414251093ab',p),'Unrelated homepage/startup change: '+p);
 for(const p of HOME_BANNER_PATHS){if(p.startsWith('preview/home-banner/')&&p!=='preview/home-banner/build.mjs'||p==='.github/workflows/home-banner-preview.yml')assert.equal(execFileSync('git',['rev-parse','HEAD:'+p],{encoding:'utf8'}),execFileSync('git',['rev-parse',HOME_BANNER_PREVIEW+':'+p],{encoding:'utf8'}),'Signed-off preview changed: '+p);}
 const font=execFileSync('git',['show',HOME_BANNER_PREVIEW+':preview/home-banner/assets/barlow-condensed-700.ttf']).toString('base64');
 assert.equal(read('HEAD','home-route-font.mjs'),'export const fontData='+JSON.stringify('data:font/ttf;base64,'+font)+';\n','Approved font bytes changed');
}
