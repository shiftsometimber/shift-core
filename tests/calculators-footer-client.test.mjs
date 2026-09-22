import test from 'node:test';
import assert from 'node:assert/strict';
import {restoreCalculatorsMenu} from '../public-calculators-menu.mjs';

function fixture({existing=false,heading='Explore',ask=true}={}){
 const paths=['/explore-knowledge',...(ask?['/ask-timber']:[]),...(existing?['/tools']:[]),'/shop','/shift-newsroom'];
 const links=paths.map(href=>({href}));
 for(const item of links)item.after=link=>links.splice(links.indexOf(item)+1,0,link);
 const section={querySelector(selector){if(selector==='h2')return {textContent:heading};return links.find(link=>selector==='a[href="'+link.href+'"]')||null;}};
 const document={querySelectorAll:selector=>selector==='footer.site-footer .footer-grid section'?[section]:[],createElement:()=>({setAttribute(key,value){this[key]=value;}})};
 return {document,links,paths};
}
test('legacy footer gets exactly one tools link after Ask Timber without changing any other link',()=>{
 const f=fixture();
 restoreCalculatorsMenu(f.document,'/tools');
 const link=f.links.find(a=>a.href==='/tools');
 assert.equal(link.textContent,'Calculators & Tools');
 assert.equal(link['aria-current'],'page');
 assert.equal(f.links[f.links.indexOf(link)-1].href,'/ask-timber');
 assert.deepEqual(f.links.filter(a=>a.href!=='/tools').map(a=>a.href),f.paths);
 restoreCalculatorsMenu(f.document,'/tools');
 assert.equal(f.links.filter(a=>a.href==='/tools').length,1);
});
test('server-restored footer is not rewritten or duplicated',()=>{
 const f=fixture({existing:true});const original=[...f.links];
 restoreCalculatorsMenu(f.document,'/');assert.deepEqual(f.links,original);
});
test('private routes and unrelated footer groups remain unchanged',()=>{
 for(const path of ['/member/dashboard','/member/orders','/api/foo','/hq']){
  const f=fixture();restoreCalculatorsMenu(f.document,path);assert.deepEqual(f.links.map(a=>a.href),f.paths);
 }
 for(const options of [{heading:'Trust'},{ask:false}]){
  const f=fixture(options);restoreCalculatorsMenu(f.document,'/');assert.deepEqual(f.links.map(a=>a.href),f.paths);
 }
});
test('HTML and trailing-slash aliases receive the same current marker',()=>{
 for(const path of ['/tools/','/tools.html','/tools.html/','/tools/bmi']){
  const f=fixture();restoreCalculatorsMenu(f.document,path);assert.equal(f.links.find(a=>a.href==='/tools')['aria-current'],'page',path);
 }
});
