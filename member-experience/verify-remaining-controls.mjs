import fs from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';

const progress=fs.readFileSync(process.argv[2]||new URL('./member-progress-v1-candidate.js',import.meta.url),'utf8');
const recovery=fs.readFileSync(process.argv[3]||new URL('./recovery-client-candidate.js',import.meta.url),'utf8');
const esc=progress.match(/  const esc=.*;/)[0];
const pure=progress.slice(progress.indexOf('  function chartValue('),progress.indexOf('  const chartStyles='));
const f=vm.runInNewContext(esc+'\n'+pure+'\n({recentRangeLabel,periodBounds,progressChartMarkup,rangeChangeMarkup,chartValue});');
const now=Date.parse('2026-10-25T12:00:00Z');
const weight=series=>({key:'weight',label:'Weight',series});
const row=(on,value=95)=>({on,value});
const checks=[];
function check(name,fn){fn();checks.push(name);}

check('Day two and day six retain Since you started; calendar day seven becomes Last 7 days',()=>{
 assert.equal(f.recentRangeLabel([weight([row('2026-10-24'),row('2026-10-25')])],now),'Since you started');
 assert.equal(f.recentRangeLabel([weight([row('2026-10-20'),row('2026-10-25')])],now),'Since you started');
 assert.equal(f.recentRangeLabel([weight([row('2026-10-19'),row('2026-10-25')])],now),'Last 7 days');
});
check('Old invalid, nonnumeric and future rows do not age the range',()=>{
 const series=[row('2026-10-24'),row('2026-02-31'),row('not-a-date'),row('2026-10-01','95'),row('2026-10-02',NaN),row('2026-10-03',Infinity),row('2026-10-26')];
 assert.equal(f.recentRangeLabel([weight(series)],now),'Since you started');
 assert.equal(f.recentRangeLabel([],now),'Since you started');
});
check('The quick range really uses seven rolling calendar days, including Sunday and BST changes',()=>{
 assert.equal(JSON.stringify(f.periodBounds('7',now)),JSON.stringify({from:'2026-10-19',to:'2026-10-25'}));
 assert.equal(JSON.stringify(f.periodBounds('7',Date.parse('2026-10-24T23:30:00Z'))),JSON.stringify({from:'2026-10-19',to:'2026-10-25'}));
 const options=progress.match(/\[\['7',recentRangeLabel\(chartData.metrics\)\][^\n]+/g)||[];
 assert.equal(options.length,2);
 assert(!progress.includes("['week','This week']"));
});
check('What I notice precedes the weight headline and plot, and keeps a real rise and gaps',()=>{
 const h=f.progressChartMarkup(weight([row('2026-10-14',93.9),row('2026-10-18',94.8),row('2026-10-24',93.6)]),'kg','28',now);
 assert(h.indexOf('What I notice')<h.indexOf('class="shift-chart-latest"'));
 assert(h.indexOf('What I notice')<h.indexOf('<svg'));
 assert(h.includes('14 Oct 2026')&&h.includes('24 Oct 2026'));
 assert(h.includes('18 Oct 2026: 94.8 kg'));
 assert(h.includes('Missing dates are not estimated.'));
 assert.equal((h.match(/data-point="/g)||[]).length,3);
 assert(!/caused|because of|due to|constipation/.test(h));
});
check('One reading has an honest observation; duplicate days, future and out-of-window rows stay excluded',()=>{
 const h=f.progressChartMarkup(weight([row('2026-10-01'),row('2026-10-25',95.3),row('2026-10-25',95.4),row('2026-10-26',90)]),'kg','7',now);
 assert(h.includes('One saved reading on 25 Oct 2026'));
 assert(h.includes('too soon to describe a change'));
 assert(h.includes('95.4 kg'));
 assert.equal((h.match(/data-point="/g)||[]).length,1);
});
check('Stone/pound change uses pounds and does not imply a boundary reading',()=>{
 const h=f.progressChartMarkup(weight([row('2026-10-23',95),row('2026-10-25',94)]),'stone_lb','7',now);
 assert(h.includes('2.2 lb down'));
 assert(h.includes('First recorded · 23 Oct 2026'));
 assert(!h.includes('First recorded · 19 Oct 2026'));
});
check('Manual/custom range selection survives refresh; account/session clearing resets its flag',()=>{
 assert(progress.includes('chartPeriod=value;chartRangeChosen=true;'));
 assert(progress.includes("if(!chartRangeChosen&&recentRangeLabel(chartData.metrics)==='Since you started')chartPeriod='7';"));
 assert(progress.includes("chartRange=null;chartRangeChosen=false;chartPeriod='28';"));
});

const hero=recovery.slice(recovery.indexOf(' function memberHero(){'),recovery.indexOf(' function updateHero(){'));
function applyMeal({recipeId,href,label='Open Grub'}){
 const action={href,textContent:label,onclick:()=>17};
 const next={querySelector:()=>action};
 const root={querySelector:()=>next,classList:{toggle(){}}};
 const context={connected:{meal:recipeId?{recipeId}:null,next:{}},location:{origin:'https://shiftsometimber.co.uk'},URL,updateHero(){},$:selector=>selector.startsWith('#todayActions')?root:{}};
 vm.runInNewContext(hero+'\nmemberHero();',context);
 return action;
}
check('Only an actual chosen meal gets Show me this meal; the same anchor, href and handler remain',()=>{
 const href='https://shiftsometimber.co.uk/member/grub?shift=saved-step#today';
 const a=applyMeal({recipeId:'actual-recipe',href});
 assert.equal(a.textContent,'Show me this meal');assert.equal(a.href,href);assert.equal(a.onclick(),17);
 assert.equal(applyMeal({href}).textContent,'Open Grub');
 assert.equal(applyMeal({recipeId:'actual-recipe',href:'https://shiftsometimber.co.uk/member/fit',label:'Start strength'}).textContent,'Start strength');
 assert.equal(applyMeal({recipeId:'actual-recipe',href:'https://elsewhere.example/member/grub'}).textContent,'Open Grub');
});
console.log(JSON.stringify({passed:checks.length,checks,scope:'Actual source functions and control identity; not a real-account/device or production-learning test'},null,2));
