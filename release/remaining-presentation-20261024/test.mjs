import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const root=new URL('./',import.meta.url);
function read(path){return fs.readFileSync(new URL(path,root),'utf8')}
test('Bloods inverse admits only consent loader at its root HTML page',()=>{
 const before=read('shift-bloods-public/before-main.mjs'),after=read('shift-bloods-public/main.mjs');
 const added=after.split('\n').filter(x=>x.includes('consent-v4a.js'));
 assert.equal(added.length,1);assert.equal(after.replace(added[0]+'\n',''),before);
 const fn=new Function('url','html',added[0]+';return html;');
 const old='<html><head></head><body><main>Approved content</main></body></html>';
 const changed=fn(new URL('https://shiftsometimber.co.uk/shift-health/blood-tests'),old);
 assert.equal(changed.replace('<script src="/consent-v4a.js" defer></script>',''),old);
 assert.equal(fn(new URL('https://shiftsometimber.co.uk/shift-health/blood-tests'),changed),changed);
 for(const p of ['/shift-health','/shift-health/blood-tests/baseline','/shift-health/blood-tests/not-real'])assert.equal(fn(new URL('https://shiftsometimber.co.uk'+p),old),old);
 assert.equal(fn(new URL('https://shiftsometimber.co.uk/shift-health/blood-tests/'),old),changed);
});
test('Shop inverse admits only icon/manifest handlers, preserving catalogue and interactions',()=>{
 const before=read('shift-timber-mill-presentation-20261021/before-main.mjs'),after=read('shift-timber-mill-presentation-20261021/main.mjs');
 const prefix=".on('link[rel=\"apple-touch-icon\"]'";
 const start=after.indexOf(prefix),end=after.indexOf(".on('title'",start);
 const oldStart=before.indexOf(".on('head'"),oldEnd=before.indexOf(".on('title'",oldStart);
 assert(start>0&&end>start);
 const inverse=after.slice(0,start)+before.slice(oldStart,oldEnd)+after.slice(end);
 assert.equal(inverse.replace('const selected=selectedContent(url),icons={apple:false,manifest:false};','const selected=selectedContent(url);'),before);
});
test('Shop adds each missing declaration once and keeps existing declarations',()=>{
 const s=read('shift-timber-mill-presentation-20261021/main.mjs');
 const start=s.indexOf(".on('link[rel=\"apple-touch-icon\"]'"),end=s.indexOf(".on('title'",start);
 for(const existing of [[],['apple'],['manifest'],['apple','manifest']]){
  const handlers=new Map(),box={icons:{apple:false,manifest:false},style:'approved-style',builder:{on(sel,handler){handlers.set(sel,handler);return this;}}};
  vm.createContext(box);vm.runInContext('builder'+s.slice(start,end),box);
  const injected=[];let callback;handlers.get('head').element({append(){},onEndTag(fn){callback=fn}});
  if(existing.includes('apple'))handlers.get('link[rel="apple-touch-icon"]').element({});
  if(existing.includes('manifest'))handlers.get('link[rel="manifest"]').element({});
  callback({before(html){injected.push(html)}});
  assert.equal(injected.filter(x=>x.includes('apple-touch-icon')).length,existing.includes('apple')?0:1);
  assert.equal(injected.filter(x=>x.includes('rel="manifest"')).length,existing.includes('manifest')?0:1);
 }
});
