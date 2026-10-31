import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const source = readFileSync(new URL('./ios-store-presentation.js', import.meta.url), 'utf8');
const oldAnswer = 'Yes. Use My Timber in your browser, add the web app to your home screen, or download the Android app from Google Play. The iPhone App Store version is coming soon.';
// A deliberately small unit fixture, not a browser or physical-iPhone pass.
function fixture({origin='https://shiftsometimber.co.uk', framed=false, late=false}={}) {
  const section = {removed:false, remove(){this.removed=true;}};
  const question = {textContent:'Can I use it on my phone?'};
  const answer = {textContent:oldAnswer};
  const detail = {querySelector(selector){return selector==='summary'?question:selector==='p'?answer:null;}};
  const otherAnswer = {textContent:'Keep this personal note: Google Play. Do not change member content.'};
  const unrelated = {querySelector(selector){return selector==='summary'?{textContent:'My own note'}:otherAnswer;}};
  const notes = {value:'My saved note with Google Play in it.'};
  let inserted=!late, callback, observers=0;
  const document={querySelectorAll(selector){
    if(!inserted)return[];
    if(selector==='.mtw-apps')return section.removed?[]:[section];
    if(selector==='.mtw-faqs details')return[detail,unrelated];
    throw Error('Unexpected selector: '+selector);
  }};
  const window={};window.top=framed?{}:window;
  const context=vm.createContext({window,document,location:{origin},MutationObserver:class{
    constructor(fn){callback=fn;observers++;}
    observe(target,options){assert.equal(target,document);assert.equal(options.subtree,true);}
  }});
  const run=()=>vm.runInContext(source,context);
  return{run,section,question,answer,otherAnswer,notes,get observers(){return observers;},
    insert(){inserted=true;callback?.();},flush(){callback?.();}};
}
test('removes only the app-install section and corrects the known phone FAQ',()=>{
  const f=fixture();f.run();assert.equal(f.section.removed,true);
  assert.equal(f.answer.textContent,'Yes. Use your My Timber account in this iPhone app or in your browser. Your saved progress stays with your account.');
});
test('handles a welcome screen inserted after native document-start',()=>{
  const f=fixture({late:true});f.run();assert.equal(f.section.removed,false);
  f.insert();assert.equal(f.section.removed,true);assert.doesNotMatch(f.answer.textContent,/Google Play|coming soon/);
});
test('leaves personal notes and unrelated FAQ content untouched',()=>{
  const f=fixture();const notes=f.notes.value,other=f.otherAnswer.textContent;
  f.run();f.flush();assert.equal(f.notes.value,notes);assert.equal(f.otherAnswer.textContent,other);
});
test('does not change a different first-party phone answer',()=>{
  const f=fixture();f.answer.textContent='A newer approved phone answer.';f.run();assert.equal(f.answer.textContent,'A newer approved phone answer.');
});
test('does not run on third-party pages',()=>{
  const f=fixture({origin:'https://example.com'});f.run();assert.equal(f.observers,0);assert.equal(f.section.removed,false);assert.equal(f.answer.textContent,oldAnswer);
});
test('does not run inside an embedded tool or subframe',()=>{
  const f=fixture({framed:true});f.run();assert.equal(f.observers,0);assert.equal(f.section.removed,false);
});
test('does not install duplicate observers or rewrite repeatedly',()=>{
  const f=fixture();f.run();const answer=f.answer.textContent;f.run();f.flush();f.flush();assert.equal(f.observers,1);assert.equal(f.answer.textContent,answer);
});
test('the shipped iOS resource contains no competing-store name or URL',()=>{
  assert.doesNotMatch(source,/Google\s*Play|play\.google\.com|market:/i);
});
