import {foundationEvidence} from './ai-foundation.mjs';
import {cachedPublicData,cachePublicData,reservePublicFetch,publicJSON} from './ai-public-retrieval.mjs';

// Only these fixed, public searches leave Shift. A member's actual question,
// results, name and journey are never sent to PubMed or included in this cache.
const topics=[
 {id:'glp1',title:'GLP-1 medicines and weight management',match:/\b(glp[ -]?1|mounjaro|wegovy|semaglutide|tirzepatide|weight[ -]loss medicine)\b/i,term:'(semaglutide[Title/Abstract] OR tirzepatide[Title/Abstract]) AND obesity[Title/Abstract]',guides:[['NICE: Overweight and obesity management','https://www.nice.org.uk/guidance/ng246','UK guidance']]},
 {id:'testosterone',title:'Testosterone and hypogonadism',match:/\b(trt|testosterone|hypogonadism)\b/i,term:'testosterone replacement[Title/Abstract] AND hypogonadism[Title/Abstract]',guides:[['NHS: The male menopause','https://www.nhs.uk/conditions/male-menopause/','NHS information']]},
 {id:'sleep-apnoea',title:'Sleep apnoea',match:/\b(apnoea|apnea|snoring|cpap)\b/i,term:'obstructive sleep apnea[Title/Abstract] AND adults[Title/Abstract]',guides:[['NHS: Sleep apnoea','https://www.nhs.uk/conditions/sleep-apnoea/','NHS information']]},
 {id:'nutrition',title:'Food, protein and strength',match:/\b(protein|nutrition|strength|resistance|muscle)\b/i,term:'protein[Title/Abstract] AND resistance training[Title/Abstract] AND adults[Title/Abstract]',foundation:'nutrition protein'},
 {id:'sleep',title:'Sleep and insomnia',match:/\b(sleep|insomnia|bedtime)\b/i,term:'insomnia[Title/Abstract] AND adults[Title/Abstract]',foundation:'sleep'},
 {id:'movement',title:'Walking and physical activity',match:/\b(walk|walking|exercise|activity|fitness|movement)\b/i,term:'walking[Title/Abstract] AND physical activity[Title/Abstract] AND adults[Title/Abstract]',foundation:'walking'},
 {id:'weight',title:'Weight management',match:/\b(weight|obesity|overweight)\b/i,term:'weight management[Title/Abstract] AND adults[Title/Abstract]',guides:[['NICE: Overweight and obesity management','https://www.nice.org.uk/guidance/ng246','UK guidance']]}
];
const filters={all:'',review:' AND (systematic review[Publication Type] OR meta-analysis[Publication Type])',trial:' AND randomized controlled trial[Publication Type]'};
const tidy=(value,max=300)=>String(value??'').replace(/<[^>]*>/g,'').replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim().slice(0,max);
export const researchTopics=topics.map(({id,title})=>({id,title}));
export function researchTopic(question){return topics.find(topic=>topic.match.test(String(question||'')))||null}
export function researchQuery(topic,type='all'){
 const known=topics.find(item=>item.id===topic?.id);if(!known)return null;
 return '('+known.term+')'+(filters[type]??filters.all)+' NOT (retracted publication[Publication Type] OR retraction of publication[Publication Type])';
}
export function researchReferences(payload,ids,checkedAt){
 const result=payload?.result;if(!result||!Array.isArray(ids))return[];
 return [...new Set(ids)].filter(id=>/^\d{1,10}$/.test(id)).flatMap(id=>{
  const row=result[id];if(String(row?.uid)!==id||!tidy(row.title))return[];
  const types=Array.isArray(row.pubtype)?row.pubtype.filter(x=>typeof x==='string'):[];
  if(types.some(x=>/retract|expression of concern|erratum|corrected and republished/i.test(x)))return[];
  const evidenceType=types.some(x=>/systematic review|meta.analysis/i.test(x))?'Evidence review':types.some(x=>/randomized controlled trial/i.test(x))?'Randomised trial':'Research article';
  return [{title:tidy(row.title),url:'https://pubmed.ncbi.nlm.nih.gov/'+id+'/',pmid:id,publisher:tidy(row.fulljournalname||row.source,180),publishedAt:tidy(row.pubdate,60)||null,evidenceType,reviewState:'external_unreviewed',checkedAt,clinicalReview:false,limitations:'Citation metadata only. Shift has not appraised the full paper, its findings or correction and retraction notices.'}];
 }).slice(0,5);
}
function guidance(topic){
 const local=topic.foundation?foundationEvidence(topic.foundation).map(item=>({title:item.title,url:item.citation,evidenceType:'NHS information',reviewState:'source_checked',checkedAt:item.provenance[0].checkedAt,publishedAt:item.provenance[0].publisherReviewedAt,clinicalReview:false})):[];
 return [...(topic.guides||[]).map(([title,url,evidenceType])=>({title,url,evidenceType,reviewState:'source_checked',checkedAt:'2026-10-31',publishedAt:null,clinicalReview:false})),...local];
}
export async function shiftResearch(env,question,{type='all',signal}={}){
 const topic=researchTopic(question),filter=Object.hasOwn(filters,type)?type:'all';
 if(!topic)return {ok:true,mode:'research',journeyUsed:false,confidence:'low',answer:'Choose a research topic: GLP-1 medicines, testosterone, nutrition, sleep, sleep apnoea, walking or weight management.',keyPoints:[],nextSteps:[],followUps:researchTopics.slice(0,4).map(t=>'Find research about '+t.title.toLowerCase()),sources:[],research:{status:'unsupported_topic',topics:researchTopics},limitations:'No external search was made. Research references do not assess your health or decide treatment.'};
 const query=researchQuery(topic,filter),key='pubmed:v1:'+topic.id+':'+filter;
 let data=null,status='unavailable';
 try{
  if(env.SHIFT_AI_RESEARCH_ENABLED!=='false'&&env.DB){
   data=await cachedPublicData(env.DB,key);
   if(data)status='cached';
   else if(await reservePublicFetch(env.DB,'pubmed',600)){
    // Every actual E-utilities call needs its own D1 reservation. At least
    // 600 ms between starts across isolates, including a delayed ESearch,
    // stays below NCBI's unauthenticated three requests/second.
    const base='https://eutils.ncbi.nlm.nih.gov/entrez/eutils/';
    const params=new URLSearchParams({db:'pubmed',retmode:'json',tool:'ShiftAI',retmax:'5',sort:'pub_date',term:query});
    const fetcher=env.SHIFT_AI_RESEARCH_FETCH||fetch;
    const found=await publicJSON(fetcher,base+'esearch.fcgi?'+params,{signal});
    if(!Array.isArray(found?.esearchresult?.idlist))throw Error('invalid_research_index');
    const ids=[...new Set((Array.isArray(found?.esearchresult?.idlist)?found.esearchresult.idlist:[]).filter(id=>typeof id==='string'&&/^\d{1,10}$/.test(id)))].slice(0,5);
    const checkedAt=new Date().toISOString();let references=[];
    if(ids.length){
     await new Promise(resolve=>setTimeout(resolve,610));
     if(signal?.aborted)throw Error('cancelled');
     if(!await reservePublicFetch(env.DB,'pubmed',600))throw Error('public_source_busy');
     const summaryParams=new URLSearchParams({db:'pubmed',retmode:'json',tool:'ShiftAI',id:ids.join(',')});
     const summary=await publicJSON(fetcher,base+'esummary.fcgi?'+summaryParams,{signal});
     if(!summary?.result||!Array.isArray(summary.result.uids))throw Error('invalid_research_index');
     references=researchReferences(summary,ids,checkedAt);
    }
    data={references,checkedAt};status='live';await cachePublicData(env.DB,key,data,21600000);
   }else status='busy';
  }
 }catch{data=null;status=signal?.aborted?'cancelled':'unavailable'}
 const references=data?.references||[],sources=[...guidance(topic),...references].map((source,index)=>({...source,id:index+1}));
 const found=references.length;
 return {ok:true,mode:'research',journeyUsed:false,confidence:'low',answer:found?`Here are ${found} research references about ${topic.title.toLowerCase()}, alongside UK information. These are starting points for reading; their titles alone do not establish what works or what is right for you.`:`Here are UK sources about ${topic.title.toLowerCase()}. ${status==='busy'?'The research index is busy. Try again shortly.':status==='live'?'No matching research references were returned.':'The live research index is unavailable just now.'} You can also open the public PubMed search below.`,keyPoints:[],nextSteps:['Open a source to read its methods, participants, results and limitations. Treatment decisions need your clinical team.'],followUps:[],sources,research:{topic:topic.id,title:topic.title,type:filter,status,checkedAt:data?.checkedAt||null,searchUrl:'https://pubmed.ncbi.nlm.nih.gov/?term='+encodeURIComponent(query)},limitations:'Research references are not clinically approved answers or an individual assessment. Only a fixed general topic is sent to PubMed; your question and private records stay out of that search. PubMed indexing does not mean NCBI or Shift endorses a paper.',attribution:{name:'PubMed / NCBI',url:'https://www.ncbi.nlm.nih.gov/home/about/policies/'}};
}
