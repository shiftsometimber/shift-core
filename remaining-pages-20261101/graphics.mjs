const esc=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const rows=(items)=>'<div class="rp-art-rows">'+items.map((s,i)=>'<div><span>'+String(i+1).padStart(2,'0')+'</span><strong>'+s+'</strong></div>').join('')+'</div>';
const tiles=(items)=>'<div class="rp-art-tiles">'+items.map((s,i)=>'<div><span>'+String(i+1).padStart(2,'0')+'</span><strong>'+s+'</strong></div>').join('')+'</div>';
const panel=(key,kicker,body,foot)=>'<div class="qr-graphic rp-art rp-art-'+key+'" data-rp-decoration aria-hidden="true"><p class="qr-micro">'+kicker+'</p>'+body+'<p class="qr-graphic-foot">'+foot+'</p></div>';
export function graphic(page,meta){
 switch(page.graphic){
 case 'decision':return panel('decision','Understand the route to the answer.',rows(['NICE criteria','NHS access','Your questions']),'No hidden recommendation score.');
 case 'readiness':return panel('readiness','Four readiness domains.',tiles(['Health information','Knowledge','Practical planning','Maintenance planning']),'Preparation is not permission.');
 case 'nhs':return panel('nhs','Two routes. Separate questions.','<div class="rp-lanes"><div><strong>NHS</strong><span>NICE criteria</span><span>Local access</span></div><div><strong>Private</strong><span>Regulation</span><span>Costs</span></div></div>','NICE criteria and NHS access are different.');
 case 'progress':return panel('progress','A record with context.',rows(['Entries','Calculations','Context']),'A record is not a diagnosis.');
 case 'surgery':return panel('surgery','Make the trade-offs visible.','<div class="rp-offset-cards">'+['Evidence','Trade-offs','Follow-up'].map((s,i)=>'<div><span>0'+(i+1)+'</span><strong>'+s+'</strong></div>').join('')+'</div>','No hidden “best surgery” score.');
 case 'overseas':return panel('overseas','Compare the whole pathway.',tiles(['Provider checks','True cost','Records','Follow-up']),'Healthcare, from start to follow-up.');
 case 'universal':return panel('universal','Compare what can be compared.','<div class="rp-category-heads"><span>Medicine</span><span>Procedure</span><span>Lifestyle</span></div><div class="rp-shared">Shared dimensions</div><div class="rp-category-foot">Category-specific detail</div>','Trade-offs, not an overall winner.');
 case 'governance':return panel('governance','Clear responsibility.',rows(['SHIFT / Information','Evidence / Sources','Provider / Clinical care']),'No borrowed authority.');
 case 'disclaimer':return panel('disclaimer','Know the boundary.','<div class="rp-big-type">Information.<br>Context.<br><em>Questions.</em></div>','Professional decisions stay with professionals.');
 case 'privacy':return panel('privacy','Choose the right action.',rows(['Export','Withdraw consent','Erase optional history','Request account deletion']),'Different actions. Different effects.');
 case 'data':return panel('data','The rules behind the service.',tiles(['Scope','Access','Retention','Accountability']),'Responsibilities made clear.');
 case 'dpia':return panel('dpia','An assessment that can change.',rows(['Identify risks','Reduce risks','Reassess changes']),'Risks stated. Safeguards explained.');
 case 'author':return panel('author','Founder / Writer / Researcher','<div class="rp-author-name">Matt<br>O’Brien<span>SHIFT SOME TIMBER</span></div>','Sources shown. Responsibility named.');
 case 'accessibility':return panel('accessibility','More ways to use the site.','<div class="rp-aa">Aa</div><div class="rp-key-row"><span>Text size</span><span>Keyboard</span><span>Motion</span></div>','Accessibility work is ongoing.');
 case 'complaints':return panel('complaints','A clear route to raise a concern.',rows(['Tell us','We investigate','A reasoned response']),'Explain what you would like us to put right.');
 case 'paper':return panel('paper','Preparation you can take with you.','<div class="rp-paper"><div class="rp-paper-rule"></div><strong>'+esc(meta.title)+'</strong><div class="rp-paper-lines">'+meta.items.slice(0,3).map(t=>'<div><i></i><span>'+esc(t.length>70?t.slice(0,67)+'…':t)+'</span></div>').join('')+'</div><div class="rp-paper-bottom"></div></div>','Print it. Take your questions.');
 default:return '';
 }
}
