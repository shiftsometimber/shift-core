import test from 'node:test';
import assert from 'node:assert/strict';
import {Script} from 'node:vm';
import {contrastSafetyStyles,contrastSafetyVersion,contrastSafetyClient,withPublicTicker} from '../public-navigation-policy.mjs';
import {preserveReviewedContrastGuard,priorContrastSafetyClient} from '../member-experience/public-preservation.mjs';

test('audited public contrast safety stays brand-only and covers the shared collision roots',()=>{
  assert.match(contrastSafetyVersion,/^public-contrast-20260917-r\d+$/);
  for(const selector of [
    '.sst-service-bridge__limit','a.sst-service-bridge__cta','.ct-form-card',
    '.faqcard','.eu-card','.dec-panel','.ready-panel','.ready-card',
    '.resource-card-v3b2','.fifa-card','.future-card','.authority-next a',
    '.shift-guided-card','.at-composer','.sh-card__alt','.tool-intro',
    '.featured-links__eyebrow','.editorial-note-v2222','.review-status-v2222',
    'table.reta-table','table.nhsm-table','.calc-explain-card','.sh-choice-grid-v72',
    '.mmh-start-grid','details.mw-evidence'
  ]) assert.ok(contrastSafetyStyles.includes(selector),selector);
  for(const colour of contrastSafetyStyles.match(/#[0-9a-fA-F]{6}/g)||[])
    assert.ok(['#E7E3DA','#050505','#707762'].includes(colour),colour);
  assert.doesNotMatch(contrastSafetyStyles,/#fff(?:fff)?\b|#f4f1e9\b|background:\s*white\b|color:\s*white\b/i);
});

test('severe contrast guard is syntactically valid and injected once into public HTML',async()=>{
  new Script(contrastSafetyClient);
  const html='<!doctype html><html><head><title>x</title></head><body><header></header><main><p>x</p></main></body></html>';
  const req=new Request('https://shiftsometimber.co.uk/knowledge');
  const once=await(await withPublicTicker(req,new Response(html,{headers:{'Content-Type':'text/html'}}))).text();
  const twice=await(await withPublicTicker(req,new Response(once,{headers:{'Content-Type':'text/html'}}))).text();
  assert.equal((once.match(/data-shift-contrast-guard/g)||[]).length,1);
  assert.equal((twice.match(/data-shift-contrast-guard/g)||[]).length,1);
  assert.equal((once.match(/data-shift-public-contrast/g)||[]).length,1);
  assert.equal((twice.match(/data-shift-public-contrast/g)||[]).length,1);
  assert.match(once,/public-contrast-20260917-r2/);
});

test('contrast guard composites translucent panels over real ancestors',()=>{
  function run(backgrounds,colour){
    class Element {
      constructor(background,parent=null){this.parentElement=parent;this.background=background;this.colour=colour;this.childNodes=[{nodeType:3,textContent:'Readable summary'}];this.dataset={};this.writes={};this.style={setProperty:(name,value)=>{this.writes[name]=value}};}
      matches(){return false}
      getBoundingClientRect(){return {width:200,height:40}}
    }
    let node=null;for(const background of backgrounds)node=new Element(background,node);
    const context={Element,document:{readyState:'complete',documentElement:{},querySelectorAll:()=>[node]},getComputedStyle:e=>({backgroundColor:e.background,backgroundImage:'none',color:e.colour,display:'block',visibility:'visible',opacity:'1'}),setTimeout:()=>{},requestAnimationFrame:()=>{},MutationObserver:class{observe(){}}};
    new Script(contrastSafetyClient).runInNewContext(context);
    return node.writes;
  }
  // Outermost background first. White overlays do not imply a white canvas.
  assert.deepEqual(run(['rgb(23,38,29)','rgba(255,255,255,0.055)','rgba(0,0,0,0)'],'rgb(231,227,218)'),{});
  assert.equal(run(['rgb(23,38,29)','rgba(255,255,255,0.055)','rgba(0,0,0,0)'],'rgb(5,5,5)').color,'#E7E3DA');
  assert.deepEqual(run(['rgb(255,255,255)','rgba(0,0,0,0.055)','rgba(0,0,0,0)'],'rgb(5,5,5)'),{});
  assert.equal(run(['rgb(255,255,255)','rgba(0,0,0,0.055)','rgba(0,0,0,0)'],'rgb(231,227,218)').color,'#050505');
  assert.deepEqual(run(['rgb(23,38,29)','rgba(255,255,255,0.03)','rgba(255,255,255,0.03)'],'rgb(231,227,218)'),{});
});

test('public preservation admits only the exact reviewed contrast-client repair',()=>{
  const tag=client=>`<script data-shift-contrast-guard="${contrastSafetyVersion}">${client}</script>`;
  const shell=client=>Buffer.from('<html><body><main>Keep every byte.</main>'+tag(client)+'</body></html>');
  assert.deepEqual(preserveReviewedContrastGuard(shell(priorContrastSafetyClient)),preserveReviewedContrastGuard(shell(contrastSafetyClient),{required:true}));
  assert.throws(()=>preserveReviewedContrastGuard(shell(priorContrastSafetyClient),{required:true}),/missing the reviewed/);
  assert.throws(()=>preserveReviewedContrastGuard(Buffer.from('<html><body>Keep every byte.</body></html>'),{required:true}),/exactly one/);
  assert.notDeepEqual(preserveReviewedContrastGuard(shell(priorContrastSafetyClient)),preserveReviewedContrastGuard(Buffer.from('<html><body><main>Changed.</main>'+tag(contrastSafetyClient)+'</body></html>'),{required:true}));
});
