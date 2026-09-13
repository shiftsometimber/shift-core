import {newsRegion} from './radar-uk-editorial-v1.js';

export const MEDICINE_FILTERS = [
  ['tirzepatide','Mounjaro / tirzepatide',/\b(mounjaro|tirzepatide|zepbound)\b/i],
  ['semaglutide','Semaglutide (Wegovy, Ozempic, Rybelsus)',/\b(semaglutide|wegovy|ozempic|rybelsus)\b/i],
  ['orforglipron','Foundayo / orforglipron',/\b(foundayo|orforglipron)\b/i],
  ['liraglutide','Liraglutide (Saxenda, Victoza)',/\b(liraglutide|saxenda|victoza)\b/i],
  ['orlistat','Orlistat',/\borlistat\b/i],
  ['retatrutide','Retatrutide',/\bretatrutide\b/i],
  ['cagrisema','CagriSema',/\bcagrisema\b/i],
  ['cagrilintide','Cagrilintide',/\bcagrilintide\b/i],
  ['glp1','GLP-1 medicines (general)',/\b(glp[- ]?1|glucagon[- ]like peptide[- ]?1)\b/i],
];
export const TOPIC_FILTERS = [
  ['access','NHS & treatment access',/\b(nhs|pharmacy|pharmacies|prescribing|access|availability|available|approval|approved|authoris\w*|licens\w*|licenc\w*)\b/i],
  ['safety','Safety & side effects',/\b(safety|side effects?|adverse|risk|warning\w*|recall\w*|falsified|pancreatitis|naion)\b/i],
  ['research','Research & clinical trials',/\b(research\w*|trial\w*|stud(?:y|ies)|cohort|preprint|meta-analysis|review)\b/i],
  ['weight','Weight, nutrition & muscle',/\b(weight|obesity|obese|overweight|nutrition\w*|diet\w*|muscle|lean mass|sarcopen\w*)\b/i],
  ['mental-health','Mental health & wellbeing',/\b(mental health|wellbeing|anxiety|depression|suicid\w*|alcohol|binge[- ]eating)\b/i],
  ['heart-metabolic','Heart & metabolic health',/\b(heart|cardiovascular|blood pressure|hypertension|cholesterol|diabetes|metabolic|kidney|liver)\b/i],
];
export function classifyNewsFilters(row={}) {
  let content={};try{content=typeof row.content_package_json==='string'?JSON.parse(row.content_package_json):row.content_package_json||{}}catch{}
  // Do not classify geography from generic UK-implications copy or the index host.
  const region=newsRegion({region:row.region},{title:row.headline});
  const regionKey=/^(UK|United Kingdom|England|Scotland|Wales|Northern Ireland)$/i.test(region)?'uk':/^(US|USA|United States|United States of America)$/i.test(region)?'us':'world';
  const text=[row.headline,content.headline,content.standfirst,content.what_changed].filter(Boolean).join(' ');
  return {region:regionKey,medicines:MEDICINE_FILTERS.filter(([, ,re])=>re.test(text)).map(([key])=>key),topics:TOPIC_FILTERS.filter(([, ,re])=>re.test(text)).map(([key])=>key)};
}
export function matchesNewsFilters(tags,filters={}) {
  return (!filters.medicine||tags.medicines.includes(filters.medicine))&&(!filters.topic||tags.topics.includes(filters.topic))&&(!filters.region||tags.region===filters.region);
}
export const NEWSROOM_FILTER_STYLE = `<style data-newsroom-filters>
.newsroom-filters{display:flex;align-items:end;gap:16px;flex-wrap:wrap;padding:20px;border:1px solid #707762;border-radius:16px;background:#10110f;margin:0 0 14px}
.newsroom-filters label{display:grid;gap:7px;flex:1 1 210px;min-width:0;font-size:.9rem;color:#e7e3da}
.newsroom-filters select{box-sizing:border-box;width:100%;min-height:44px;border:1px solid #707762;border-radius:8px;padding:10px 34px 10px 12px;background:#050505;color:#e7e3da;font:inherit;color-scheme:dark}
.newsroom-filters button,.newsroom-filter-empty button{min-height:44px;padding:10px 16px;border:1px solid #707762;border-radius:8px;background:transparent;color:#e7e3da;font:inherit;cursor:pointer}
.newsroom-filters :is(select,button):focus-visible{outline:2px solid #e7e3da;outline-offset:3px}
[data-news-card][hidden],[data-news-group][hidden],[data-news-empty][hidden],.newsroom-filters[hidden]{display:none!important}
.newsroom-filter-results{margin:12px 0 26px;color:#adb09f}.newsroom-filter-empty{padding:24px;border:1px solid #707762;border-radius:12px}
@media(max-width:560px){.newsroom-filters{padding:16px;gap:12px}.newsroom-filters label{flex-basis:100%}.newsroom-filters button,.newsroom-filter-empty button{width:100%}}
</style>`;
export const NEWSROOM_FILTER_SCRIPT = `;(()=>{
const start=()=>{
 const form=document.querySelector('[data-news-filters]');if(!form)return;
 const cards=[...document.querySelectorAll('[data-news-card]')],groups=[...document.querySelectorAll('[data-news-group]')];
 const result=document.querySelector('[data-news-results]'),empty=document.querySelector('[data-news-empty]');
 const fields=['medicine','topic','region'].map(name=>form.elements.namedItem(name));
 const apply=(writeUrl=true)=>{
  let shown=0;for(const card of cards){const visible=fields.every(field=>!field.value||(card.dataset[field.name]||'').split(' ').includes(field.value));card.hidden=!visible;if(visible)shown++;}
  for(const group of groups)group.hidden=![...group.querySelectorAll('[data-news-card]')].some(card=>!card.hidden);
  result.textContent='Showing '+shown+' of '+cards.length+' '+(cards.length===1?'story':'stories');empty.hidden=shown!==0;
  if(writeUrl&&/^https?:$/.test(location.protocol)){const params=new URLSearchParams();for(const field of fields)if(field.value)params.set(field.name,field.value);history.replaceState(null,'',location.pathname+location.search+(params.size?'#'+params:''));}
 };
 const read=()=>{const params=new URLSearchParams(location.hash.slice(1));for(const field of fields){const value=params.get(field.name)||'';field.value=[...field.options].some(option=>option.value===value)?value:'';}apply(false);};
 form.addEventListener('submit',event=>event.preventDefault());form.addEventListener('change',()=>apply());
 const clear=()=>{form.reset();apply();};form.querySelector('button').addEventListener('click',clear);
 document.querySelector('[data-news-clear-empty]').addEventListener('click',()=>{clear();fields[0].focus();});
 window.addEventListener('hashchange',read);form.hidden=false;read();
};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();})();`;
