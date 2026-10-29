import {checkedAt,sources,guides,existing,answers} from './content.mjs';
const origin='https://shiftsometimber.co.uk';
const normal=q=>String(q||'').normalize('NFKC').toLowerCase().replace(/[’']/g,'').replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ');
const bySource=new Map(sources.map(s=>[s.id,s]));
const byGuide=new Map([...guides,...existing].map(g=>[g.id,g]));
const aliases={
 T01:['I am always shattered does that mean low testosterone','Does tiredness mean low testosterone'],
 T02:['Can TRT affect fertility','Does TRT affect fertility','Could TRT affect having children','Can testosterone treatment affect fertility'],
 T03:['Do testosterone tests need repeating','Why repeat a testosterone blood test'],
 T04:['What is the difference between TRT gels and injections'],
 T05:['What monitoring does TRT need','What happens at a TRT review'],
 T06:['What does private TRT cost include'],
 T07:['Can weight affect testosterone'],
 T08:['Do erection problems mean low testosterone','Does low libido mean low testosterone'],
 B01:['Can you interpret my blood results','Can you tell me whether my blood results are OK','What do blood test reference ranges mean'],
 B02:['Does a blood test check everything','What do common blood tests check'],
 B03:['Is HbA1c the same as blood glucose'],
 B04:['What do HDL LDL and triglycerides mean'],
 B05:['Is ferritin the same as a full blood count'],
 B06:['What does TSH mean','Does a home TSH test check everything'],
 B07:['What are liver and kidney blood tests for'],
 B08:['Do I need a vitamin blood test'],
 C01:['Is a home blood test the same as a lab test','What is the difference between home tests and lab tests'],
 C02:['Does a high PSA mean prostate cancer','Does high PSA mean cancer'],
 C03:['Are home tests accurate'],
 C04:['Should I fast before a blood test'],
 C05:['What is the difference between finger prick and venous blood collection'],
 C06:['Does a negative FIT rule out bowel cancer'],
 C07:['Does a urine test check all kidney function'],
 C08:['What does an invalid home test mean','Does a void result mean negative'],
 D01:['Where do I start with male fertility','When should we ask for fertility help'],
 D02:['Can a home sperm test prove I am fertile','Can a home sperm test prove Im fertile','Can I use a home sperm test after a vasectomy'],
 D03:['What does a semen analysis check','What do motility and morphology mean'],
 D04:['Can a fertility diet guarantee pregnancy'],
 D05:['Can medicines affect fertility'],
 D06:['Can I use a fertility kit for post vasectomy clearance'],
 D07:['Can anabolic steroids affect sperm'],
 D08:['Is counselling available for fertility problems'],
 E01:['My partner says I stop breathing in my sleep what next','When should I ask about sleep apnoea'],
 E02:['What happens in a home sleep assessment','What happens during a home sleep assessment'],
 E03:['When should I see a GP about insomnia'],
 E04:['How can night shift workers manage sleep'],
 E05:['Does caffeine affect sleep','Does alcohol affect sleep'],
 E06:['Who can help with an uncomfortable CPAP mask'],
 E07:['Can my sleep tracker diagnose sleep apnoea'],
 E08:['Should I drive when I am very sleepy'],
 F01:['Do I need supplements because Im taking weight management treatment','Do I need supplements on Mounjaro','Do I actually need supplements'],
 F02:['What should I check before buying a supplement','How do I compare supplements'],
 F03:['Do I need protein powder'],
 F04:['What is creatine for'],
 F05:['Should UK adults consider vitamin D in winter'],
 F06:['Should tired people take iron'],
 F07:['Do I need electrolytes'],
 F08:['What is the evidence for collagen supplements'],
 F09:['Is magnesium proven to help sleep'],
 F10:['Are testosterone boosters the same as TRT']
};

// Every group must match. Specific subjects outrank generic headings.
// These signals retrieve evidence only. Only a complete exact FAQ question
// can take the checked-answer shortcut.
const signals={
 T01:[['tired','fatigue','shattered','exhausted','testosterone symptoms','low t']],
 T02:[['trt','testosterone','hormone'],['fertility','sperm','children','baby','conceiv']],
 T03:[['testosterone','trt','shbg'],['blood','test','free','total','shbg','repeat','morning']],
 T04:[['trt','testosterone'],['gel','injection','formulation','treatment options','risks','benefits']],
 T05:[['trt','testosterone'],['monitor','review','follow up','transfer','provider','haematocrit','hematocrit']],
 T06:[['trt','testosterone'],['cost','price','fee','pay','include']],
 T07:[['testosterone','trt'],['weight','obesity','fat']],
 T08:[['libido','sex drive','erection','erectile']],
 B01:[['blood','lab','laboratory'],['result','range','report','numbers','interpret']],
 B02:[['bloods','blood test','blood panel','blood count']],
 B03:[['hba1c','a1c','blood sugar','blood glucose','glycated']],
 B04:[['cholesterol','lipid','hdl','ldl','triglyceride']],
 B05:[['ferritin','iron stores','full blood count','fbc','anaemia','anemia']],
 B06:[['thyroid','tsh','thyroxine']],
 B07:[['liver','kidney','egfr','creatinine','bilirubin'],['blood','panel','function','egfr','creatinine','bilirubin']],
 B08:[['vitamin d','b12','folate'],['test','level','deficiency','check','blood']],
 C01:[['home','self','lab','laboratory','clinic'],['test','sample','collect']],
 C02:[['psa','prostate']],
 C03:[['test','kit','result'],['accuracy','accurate','reliable','reliability','false positive','false negative','sensitivity','specificity']],
 C04:[['sample','blood','test'],['prepare','preparation','fast','timing','post','transport','before','medicines']],
 C05:[['finger prick','fingerprick','upper arm','venous','blood collection']],
 C06:[['fit test','negative fit','positive fit','bowel','poo','stool','faecal','fecal']],
 C07:[['urine albumin','acr','albuminuria','urine protein','kidney urine']],
 C08:[['test','kit','result','sample'],['invalid','unclear','void','unreadable','unexpected','inadequate']],
 D01:[['fertility','conceiv','trying for a baby','trying for children']],
 D02:[['home','self','kit','concentration only'],['sperm','semen','fertility']],
 D03:[['semen analysis','semen test','sperm test','motility','morphology','sperm concentration','sperm movement','sperm shape']],
 D04:[['fertility','sperm','conceiv','family','pregnancy'],['lifestyle','diet','food','smoking','alcohol','guarantee']],
 D05:[['fertility','conceiv','sperm'],['medicine','medication','prescription','prescriber']],
 D06:[['vasectomy','vasectomies','postvasectomy','post vasectomy','clearance']],
 D07:[['anabolic','steroid','post cycle']],
 D08:[['fertility','baby','conceiv'],['emotional','counselling','counseling','stress','relationship','coping','anxiety']],
 E01:[['snoring','apnoea','apnea','breathing pauses','stop breathing','gasping']],
 E02:[['sleep'],['study','assessment','test','recording']],
 E03:[['insomnia','cbt i','cbti','cant sleep','cannot sleep','struggling to sleep','sleep routine','bedtime routine']],
 E04:[['shift work','night shift','night work','rota','rotating shifts']],
 E05:[['sleep','bedtime','night'],['caffeine','coffee','tea','alcohol','energy drink']],
 E06:[['cpap','positive airway pressure','mask leak']],
 E07:[['wearable','sleep tracker','sleep score','sleep stages','smartwatch','sleep app']],
 E08:[['sleepy','sleepiness','drowsy','stay awake','fatigue'],['driv','work','safety','commut','machinery']],
 F01:[['supplement','vitamin','protein powder','creatine','collagen','electrolyte','magnesium']],
 F02:[['supplement','vitamin','powder','blend'],['label','compare','overlap','serving','claim','cost','price','ingredient']],
 F03:[['protein','protein bar','protein powder']],
 F04:[['creatine']],
 F05:[['vitamin d']],
 F06:[['iron'],['supplement','take','tired','fatigue','tablet','start']],
 F07:[['electrolyte','hydration','dehydration','rehydration']],
 F08:[['collagen']],
 F09:[['magnesium','sleep supplement','sleep blend']],
 F10:[['testosterone booster','testosterone supplement','testo booster','boost testosterone']]
};
const phraseMatch=(q,term)=>new RegExp('(?:^| )'+term+'[a-z]*(?: |$)').test(q);
const exactAnswer=q=>answers.find(a=>[a.question,...(aliases[a.id]||[])].some(value=>normal(value)===q));
const stopWords=new Set(['the','and','for','can','what','does','how','with','have','this','that','are','you','should','from']);
const broadSubjects=new Set(['T01','B01','B02','C01','D01','F01']);
const queryWords=q=>new Set(q.split(' ').filter(w=>w.length>2&&!stopWords.has(w)));
const passageScore=(text,words)=>[...words].reduce((n,w)=>n+(phraseMatch(normal(text),w)?1:0),0);
function sourceInfo(id,index){
 const s=bySource.get(id);
 return {id:index+1,title:s.title,url:s.url,authority:90,reviewState:'source_checked',citation:s.url,
  provenance:[{type:'primary',ref:s.url,checkedAt}],
  limitations:'General information; source checked '+checkedAt+'. Not a personal clinical assessment.'};
}
export function healthKnowledgeAnswer(message){
 const a=exactAnswer(normal(message));if(!a)return null;
 const guide=byGuide.get(a.id);
 const refs=a.sources.length?a.sources.map(sourceInfo):[{
  id:1,title:'SHIFT: '+(guide?.title||a.question),url:origin+a.path,citation:origin+a.path,
  authority:75,reviewState:'source_checked',provenance:[{type:'shift_guide',ref:origin+a.path,checkedAt}],
  limitations:'SHIFT educational guidance; not independent clinical review or a verified live price.'
 }];
 return {answer:a.answer+' '+refs.map(s=>'['+s.id+']').join('')+'\n\n'+a.next+' Read more: '+origin+a.path,
  sources:refs,keyPoints:[],nextSteps:[],followUps:[],confidence:'medium',journeyUsed:false,
  delivery:'source_checked_health_answer',limitations:'General information, not individual medical advice. Sources checked 29 October 2026; not clinician-reviewed.'};
}
export function healthKnowledgeEvidence(message,limit=4){
 const q=normal(message),words=queryWords(q),exact=exactAnswer(q);
 const selected=answers.map(a=>{
  const groups=signals[a.id]||[],matches=groups.map(group=>group.filter(term=>phraseMatch(q,term)));
  let score=exact?.id===a.id?100:groups.length&&matches.every(m=>m.length)?10+Math.min(8,matches.flat().reduce((n,t)=>n+t.split(' ').length,0))+(broadSubjects.has(a.id)?0:8):0;
  if(score)score+=Math.min(5,passageScore(byGuide.get(a.id)?.title||a.question,words));
  return {a,score};
 }).filter(x=>x.score>0).sort((a,b)=>b.score-a.score||a.a.id.localeCompare(b.a.id));
 return selected.slice(0,Math.max(1,Math.min(6,limit))).map(({a})=>{
  const guide=byGuide.get(a.id);
  // Rank relevant passages instead of repeating every guide's opener.
  const passages=(guide?.sections||[]).map((s,index)=>({s,index,score:passageScore(s[0]+' '+s[1],words)}))
   .sort((a,b)=>b.score-a.score||a.index-b.index).slice(0,2);
  const ids=[...new Set([...a.sources,...passages.flatMap(p=>p.s[2])])];
  const sourceRecords=ids.map(id=>bySource.get(id)).filter(Boolean);
  const content=[a.answer,...passages.map(p=>p.s[0]+': '+p.s[1]),a.next,
   'General education only. Do not diagnose, interpret a personal result, choose a test or dose, or infer service availability.'].join(' ');
  return {id:'health:'+a.id,sourceWorld:'source_checked_health',title:guide?.title||a.question,
   content,authority:85,reviewState:'source_checked',citation:sourceRecords[0]?.url||origin+a.path,
   provenance:[...sourceRecords.map(s=>({type:'primary',ref:s.url,checkedAt})),{type:'shift_guide',ref:origin+a.path,checkedAt}],
   limitations:'Sources checked '+checkedAt+'; general education, not clinical review. Current service pages determine availability.'};
 });
}
