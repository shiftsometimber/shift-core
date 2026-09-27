import {medicines, sources} from './data.mjs';
import {readWatchHealth} from './monitor.mjs';

// Each claim has its own sources. A checked authorisation announcement cannot
// validate stock, product instructions, or an unmonitored launch PDF.
const claims = {
  mounjaro: {authorisation:['mounjaro-mhra'],nhsEngland:['mounjaro-nice','mounjaro-nhs']},
  'wegovy-injection': {authorisation:['wegovy-injection-smpc'],nhsEngland:['wegovy-weight-nice','wegovy-cardiovascular-nice']},
  'wegovy-tablet': {authorisation:['wegovy-tablet-mhra'],nhsEngland:['wegovy-tablet-mhra']},
  orlistat: {authorisation:['orlistat-nhs'],nhsEngland:['orlistat-nhs']},
  foundayo: {authorisation:['foundayo-mhra'],nhsEngland:['foundayo-nice']},
  retatrutide: {authorisation:['retatrutide-mhra'],benefit:['retatrutide-lilly']},
};
const clean = value => String(value||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
export function matchingWatchMedicines(query){
  const q=clean(query),ids=new Set();
  if(/\b(mounjaro|tirzepatide)\b/.test(q))ids.add('mounjaro');
  if(/\b(foundayo|orforglipron)\b/.test(q))ids.add('foundayo');
  if(/\b(orlistat|xenical|alli)\b/.test(q))ids.add('orlistat');
  if(/\bretatrutide\b/.test(q))ids.add('retatrutide');
  if(/\b(wegovy|semaglutide)\b/.test(q)){
    const formulation=q.split(/\b(?:and|versus|vs|with)\b/).filter(part=>/\b(wegovy|semaglutide)\b/.test(part)).join(' ');
    const oral=/\b(oral|tablet|tablets|pill|pills)\b/.test(formulation),injection=/\b(injection|injections|injectable|pen|pens)\b/.test(formulation);
    if(oral||!injection)ids.add('wegovy-tablet');
    if(injection||!oral)ids.add('wegovy-injection');
  }
  if(!ids.size&&/\b(medicines watch|peptides watch|weight loss medicines|weight management medicines)\b/.test(q))return medicines;
  return medicines.filter(m=>ids.has(m.id));
}
export function isWatchStatusQuestion(query){
  return matchingWatchMedicines(query).length>0&&/\b(approv\w*|authori[sz]\w*|licen[cs]\w*|legal|available|availability|stock|supply|nhs|access|trial\w*|research|investigational|status|latest|watch|price\w*|cost\w*|buy|purchase|launched?|released?|market)\b/i.test(query);
}
export function isWatchCopy(item){
  return /medicines[-_ ]watch/i.test(String(item.id||'')) || (item.provenance||[]).some(p=>/\/treatment-centre\/medicines-watch(?:$|[?#/])/.test(String(p.ref||'')));
}
export async function retrieveWatchKnowledge(DB,query,options={}){
  const matched=matchingWatchMedicines(query);if(!matched.length)return [];
  const health=await readWatchHealth({DB},options),byId=new Map(health.sources.map(s=>[s.id,s]));
  return matched.flatMap(medicine=>Object.entries(claims[medicine.id]||{}).map(([field,sourceIds])=>{
    const current=health.available&&sourceIds.every(id=>byId.get(id)?.status==='current');
    const label=field==='authorisation'?'UK authorisation':field==='nhsEngland'?'NHS England access':'Research evidence';
    const provenance=sourceIds.map(id=>{
      const source=sources.find(s=>s.id===id),state=byId.get(id);
      return {type:'medicines_watch',ref:source.url,sourceId:id,verifiedAt:source.reviewedAt,
        reviewedAt:source.reviewedAt,checkedAt:state?.lastSuccessAt||null,
        status:state?.status||'verification_pending',supportsCurrentClaim:current};
    });
    const value=medicine.id==='retatrutide'&&field==='authorisation'
      ?'Not authorised in the UK. MHRA confirmed this on 24 July 2026.'
      :medicine[field]||medicine.access?.[field];
    const limitations=[current?'':`${label} is not currently verified (${provenance.map(p=>p.status).join(', ')}). Do not infer it from older knowledge or model memory.`,
      'This evidence does not confirm individual suitability, a dose, pharmacy stock, private availability or price. UK authorisation, NHS funding and actual supply are separate.',
      'An automated source check is not a new editorial review.'].filter(Boolean).join(' ');
    const dates=provenance.map(p=>`${p.sourceId}: reviewed ${p.reviewedAt}; source checked ${p.checkedAt||'unavailable'}`).join('; ');
    return {id:`medicines-watch:${medicine.id}:${field}`,medicineId:medicine.id,sourceIds,sourceWorld:'medicines_watch',
      title:`Medicines Watch: ${medicine.name} — ${label}`,
      content:[medicine.name,current?`${label}: ${value}`:'',limitations,dates].filter(Boolean).join('\n'),
      limitations,reviewState:current?'verified':'unavailable',authority:current?95:0,
      score:100,provenance,citation:`ShiftBrain:medicines-watch:${medicine.id}:${field}`};
  }));
}
