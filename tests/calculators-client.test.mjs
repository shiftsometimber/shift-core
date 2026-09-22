import test from 'node:test';
import assert from 'node:assert/strict';
import {runInNewContext} from 'node:vm';
import {restoreCalculatorsMenu,CALCULATORS_MENU_SCRIPT} from '../public-calculators-menu.mjs';
import {NEWSROOM_MENU_SCRIPT} from '../radar-newsroom-menu-v1.js';

function fixture({existing=false,contact=true,readyState='complete'}={}){
 const paths=['/start-here','/programme','/shift-health','/treatment-centre','/member/dashboard','/about','/ask-timber',...(existing?['/tools']:[]),...(contact?['/contact']:[]),'/shift-newsroom','/shop'];
 const links=paths.map(href=>({href}));
 const nav={querySelector(selector){return links.find(link=>selector==='a[href="'+link.href+'"]')||null;}};
 for(const item of links)item.before=link=>links.splice(links.indexOf(item),0,link);
 const events=[];
 const document={readyState,querySelectorAll:()=>[nav],createElement:()=>({setAttribute(key,value){this[key]=value;}}),addEventListener:(...args)=>events.push(args)};
 return {document,links,paths,events};
}
test('the public browser menu gains one calculators link before Contact, retaining every other entry',()=>{
 const f=fixture();
 restoreCalculatorsMenu(f.document,'/');
 assert.equal(f.links.filter(link=>link.href==='/tools').length,1);
 const index=f.links.findIndex(link=>link.href==='/tools');
 assert.equal(f.links[index-1].href,'/ask-timber');
 assert.equal(f.links[index+1].href,'/contact');
 assert.equal(f.links[index].textContent,'Calculators & Tools');
 assert.deepEqual(f.links.filter(link=>link.href!=='/tools').map(link=>link.href),f.paths);
 restoreCalculatorsMenu(f.document,'/');
 assert.equal(f.links.length,f.paths.length+1);
});
test('already-restored server navigation is not duplicated or rewritten',()=>{
 const f=fixture({existing:true});
 const original=[...f.links];
 restoreCalculatorsMenu(f.document,'/');
 assert.deepEqual(f.links,original);
});
test('the browser repair respects the existing private-route boundary',()=>{
 for(const path of ['/member','/member/dashboard','/member/orders','/v1/profile','/api/foo','/hq','/staging/example']){
  const f=fixture();restoreCalculatorsMenu(f.document,path);
  assert.deepEqual(f.links.map(link=>link.href),f.paths,path);
 }
});
test('the hub and child tools have an accessible current-page marker',()=>{
 for(const path of ['/tools','/tools/','/tools.html','/tools/bmi']){
  const f=fixture();restoreCalculatorsMenu(f.document,path);
  assert.equal(f.links.find(link=>link.href==='/tools')['aria-current'],'page',path);
 }
});
test('missing expected menu structure is left alone',()=>{
 const f=fixture({contact:false});restoreCalculatorsMenu(f.document,'/');
 assert.deepEqual(f.links.map(link=>link.href),f.paths);
});
test('the serialized production script waits for the existing menu initialization',()=>{
 const f=fixture({readyState:'loading'});
 runInNewContext(CALCULATORS_MENU_SCRIPT,{document:f.document,location:{pathname:'/'}});
 assert.equal(f.links.length,f.paths.length);
 assert.equal(f.events.length,1);
 assert.equal(f.events[0][0],'DOMContentLoaded');
 assert.equal(f.events[0][2].once,true);
 f.events[0][1]();
 assert.equal(f.links.length,f.paths.length+1);
});
test('the actual combined v42 hook restores calculators even when Newsroom is already present',()=>{
 const f=fixture();
 runInNewContext(NEWSROOM_MENU_SCRIPT,{document:f.document,location:{pathname:'/'}});
 assert.equal(f.links.filter(link=>link.href==='/tools').length,1);
 assert.equal(f.links.filter(link=>link.href==='/shift-newsroom').length,1);
});
