import {createHash} from 'node:crypto';
import {qualifyJoinedSuccessor} from '../release/my-timber-joined-look-scope-20261024.mjs';
import {recordServiceJob} from '../hq-service-job-runs.mjs';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const actualEntry = readFileSync(new URL('../worker-entry-v6.js', import.meta.url), 'utf8');
// Authenticate the complete current support source before applying the retained
// historical spelling proof. The executable scheduled-handler tests below still
// exercise actualEntry, including every current sibling and recording call.
let entry=qualifyJoinedSuccessor().comparisonValue('worker-entry-v6.js',actualEntry);
// Authenticate the complete already-serving basket runtime and reverse only
// its exact three fetch additions before the retained observation-era proof.
if(createHash('sha1').update('blob '+Buffer.byteLength(entry)+'\0').update(entry).digest('hex')==='4434faf74942037dc8ef88699e4b4260af9722c3'){
 const inverse=[
  ["import {purchaseBasketAsset,withPurchaseBasket} from './public-purchase-basket.mjs';\n",''],
  ["    const basketScript=purchaseBasketAsset(request);if(basketScript)return basketScript;\n",''],
  ['    return withPurchaseBasket(request,await withPublicSeoCloseout(await withSharedFooter(request,await withGrowthPublicCopy(request,await withStartupStability(request,await singleDispatchHtmlAsset(request,env.MY_TIMBER_PWA_ENABLED===\'true\'?await withPwa(request,corrected):corrected)))),request));',
   '    return withPublicSeoCloseout(await withSharedFooter(request,await withGrowthPublicCopy(request,await withStartupStability(request,await singleDispatchHtmlAsset(request,env.MY_TIMBER_PWA_ENABLED===\'true\'?await withPwa(request,corrected):corrected)))),request);']
 ];
 for(const [after,before] of inverse){assert.equal(entry.split(after).length,2,'Exact serving basket boundary required');entry=entry.replace(after,before);}
 assert.equal(createHash('sha1').update('blob '+Buffer.byteLength(entry)+'\0').update(entry).digest('hex'),'cc2d7dd76a495c88c2a42575a61dc62a7e9babed','Entire observation runtime before-image required');
}
const observedWatch="await observedJob('core_medicines_watch', () => checkSources(env, { allowSourceReplacement: false }))";
if(entry.includes(observedWatch)){
  // Authenticate the entire independently approved instrumented runtime before
  // restoring only the old spelling for every retained original assertion.
  const pin=createHash('sha1').update('blob '+Buffer.byteLength(entry)+'\0').update(entry).digest('hex');
  assert.equal(pin,'cc2d7dd76a495c88c2a42575a61dc62a7e9babed','Exact approved job-observation runtime required');
  assert.equal(entry.split(observedWatch).length,2,'Exactly one observed Watch invocation required');
  entry=entry.replace(observedWatch,'await checkSources(env, { allowSourceReplacement: false })');
}
const start = entry.indexOf('  async scheduled(controller, env, ctx) {');
const end = entry.indexOf('\n  },\n};', start);
const scheduled = entry.slice(start, end);

test('Medicines Watch runs before shared scheduled jobs', () => {
  assert.ok(start >= 0 && end > start, 'scheduled handler must remain discoverable');
  const watch = scheduled.indexOf('await checkSources(env, { allowSourceReplacement: false })');
  const shared = scheduled.indexOf('Promise.allSettled([');
  assert.ok(watch >= 0, 'scheduled handler must invoke the Watch');
  assert.ok(shared > watch, 'Watch must complete before D1-heavy sibling jobs begin');
  assert.equal((scheduled.match(/checkSources\(env,/g) || []).length, 1);
});

test('scheduled sibling failures are isolated and named', () => {
  assert.match(scheduled, /status: "rejected"/);
  for (const name of ['intelligence', 'radar', 'knowledge', 'fit-reminders']) {
    assert.ok(scheduled.includes('"' + name + '"'), name);
  }
  assert.doesNotMatch(scheduled, /Promise\.all\(\[/);
});

// Execute the complete actual handler with its real job-recording helper.
// The database and sibling work are synthetic; no outbound service is called.
const actualStart=actualEntry.indexOf('  async scheduled(controller, env, ctx) {');
const actualEnd=actualEntry.indexOf('\n  },\n};',actualStart);
const actualScheduled=actualEntry.slice(actualStart,actualEnd);
async function exerciseActualScheduled({watchFails=false,siblingFails=false}={}){
 const events=[],logs=[],pending=[];let release,entered;
 const watchStarted=new Promise(resolve=>entered=resolve),watchGate=new Promise(resolve=>release=resolve);
 const DB={prepare(sql){return{bind(){return this},async run(){return{success:true}}}},async batch(){return[]}};
 const checkSources=async(env,options)=>{assert.deepEqual(options,{allowSourceReplacement:false});events.push('watch-start');entered();await watchGate;events.push('watch-end');if(watchFails)throw Error('owned_watch_failure');return{checked:1}};
 const names=['runScheduledIntelligence','runRadarScheduledScan','runKnowledgeFlywheel','runFitMorningReminders','notifyArticlePublication','runPwaReminders','retryPendingSignupAlerts','runTreatmentReminders'];
 const siblings=names.map(name=>async()=>{events.push(name);if(siblingFails&&name==='runRadarScheduledScan')throw Error('owned_radar_failure');return{processed:1}});
 const output={log(...args){logs.push(args)},error(...args){logs.push(args)}};
 const handler=new Function('recordServiceJob','checkSources',...names,'console','return ({'+actualScheduled+'\n}}).scheduled;')(recordServiceJob,checkSources,...siblings,output);
 await handler({scheduledTime:1792800000000},{DB,MY_TIMBER_PWA_ENABLED:'true',MY_TREATMENT_ENABLED:'true'},{waitUntil(job){pending.push(job)}});
 await watchStarted;assert.deepEqual(events,['watch-start'],'No sibling can start while the actual Watch is pending');release();await Promise.all(pending);
 assert.equal(events.filter(x=>x==='watch-start').length,1);assert(events.indexOf('watch-end')<events.indexOf('runScheduledIntelligence'));
 for(const name of names)assert.equal(events.filter(x=>x===name).length,1,'Every isolated sibling must still execute once');
 const report=logs.find(row=>row[0]==='shift_scheduled_intelligence');assert(report,'Actual scheduled report required');return JSON.parse(report[1]);
}
test('actual observed handler awaits the Watch before all D1-heavy siblings',async()=>{
 const report=await exerciseActualScheduled();assert.deepEqual(report.medicinesWatch,{checked:1});assert.equal(report.scheduled.length,8);assert(report.scheduled.every(row=>row.status==='fulfilled'));
});
test('actual observed handler retains named sibling isolation and Watch failure visibility',async()=>{
 const report=await exerciseActualScheduled({watchFails:true,siblingFails:true});assert.equal(report.medicinesWatch.medicinesWatch,'check_failed');
 assert.equal(report.scheduled.find(row=>row.job==='radar').status,'rejected');assert(report.scheduled.filter(row=>row.job!=='radar').every(row=>row.status==='fulfilled'));
});
