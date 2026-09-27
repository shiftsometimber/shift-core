import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {classifyNewsFilters, matchesNewsFilters, NEWSROOM_FILTER_SCRIPT} from '../radar-newsroom-filters-v1.js';

test('medicine comparisons match either ingredient and geography ignores UK boilerplate',()=>{
  const tags=classifyNewsFilters({headline:'Mounjaro and semaglutide safety study',region:'US',content_package_json:JSON.stringify({why_it_matters_to_uk:'Relevant to NHS readers'})});
  assert.equal(matchesNewsFilters(tags,{medicine:'tirzepatide',topic:'safety',region:'us'}),true);
  assert.equal(matchesNewsFilters(tags,{medicine:'semaglutide',topic:'research',region:'us'}),true);
  assert.equal(matchesNewsFilters(tags,{medicine:'tirzepatide',region:'uk'}),false);
  assert.equal(classifyNewsFilters({headline:'Semaglutide study',region:'GLOBAL',regulator:'PubMed / NLM'}).region,'world');
  assert.equal(classifyNewsFilters({headline:'SURMOUNT-REAL UK',region:'GLOBAL'}).region,'uk');
});

test('combined filters, empty state and clear operate through the shipped event handlers',()=>{
  const events={},fields=['medicine','topic','region'].map(name=>({name,value:'',options:[{value:''},...({medicine:['tirzepatide'],topic:['safety'],region:['uk','us','world']}[name]).map(value=>({value}))],focus(){}}));
  const cards=[{dataset:{medicine:'tirzepatide',topic:'safety research',region:'uk'}},{dataset:{medicine:'semaglutide',topic:'research',region:'us'}}];
  const groups=cards.map(card=>({querySelectorAll:()=>[card]}));
  const reset={addEventListener:(name,fn)=>events.reset=fn},emptyReset={addEventListener:(name,fn)=>events.emptyReset=fn};
  const form={hidden:true,elements:{namedItem:name=>fields.find(field=>field.name===name)},querySelector:()=>reset,addEventListener:(name,fn)=>events[name]=fn,reset(){fields.forEach(field=>field.value='')}};
  const result={},empty={};let lastUrl='';
  const document={readyState:'complete',querySelector:selector=>({'[data-news-filters]':form,'[data-news-results]':result,'[data-news-empty]':empty,'[data-news-clear-empty]':emptyReset}[selector]),querySelectorAll:selector=>selector==='[data-news-card]'?cards:groups};
  vm.runInNewContext(NEWSROOM_FILTER_SCRIPT,{document,window:{addEventListener:(name,fn)=>events[name]=fn},location:{protocol:'https:',pathname:'/shift-newsroom',search:'',hash:'#medicine=tirzepatide&topic=safety&region=uk'},history:{replaceState:(a,b,url)=>lastUrl=url},URLSearchParams});
  assert.equal(form.hidden,false);assert.deepEqual(cards.map(card=>card.hidden),[false,true]);assert.equal(result.textContent,'Showing 1 of 2 stories');
  fields[2].value='us';events.change();assert.ok(cards.every(card=>card.hidden));assert.equal(empty.hidden,false);assert.ok(groups.every(group=>group.hidden));
  events.emptyReset();assert.ok(cards.every(card=>!card.hidden));assert.equal(empty.hidden,true);assert.equal(result.textContent,'Showing 2 of 2 stories');assert.equal(lastUrl,'/shift-newsroom');
});
