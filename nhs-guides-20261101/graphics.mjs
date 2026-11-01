const panel=(key,kicker,body,foot)=>'<div class="qr-graphic ng-art ng-'+key+'" data-rp-decoration aria-hidden="true"><p class="qr-micro">'+kicker+'</p>'+body+'<p class="ng-foot">'+foot+'</p></div>';
const rows=items=>'<div class="ng-rows">'+items.map((s,i)=>'<div><span>0'+(i+1)+'</span><strong>'+s+'</strong></div>').join('')+'</div>';
const pair=(a,b,x,y)=>'<div class="ng-pair"><div><span>01</span><strong>'+a+'</strong><p>'+x+'</p></div><div><span>02</span><strong>'+b+'</strong><p>'+y+'</p></div></div>';
export function graphic(p){switch(p.key){
 case 'gp-vs-specialist-weight-management': return panel('care','Understand the care setting.',pair('Primary care','Specialist service','Your GP pathway','Multidisciplinary expertise'),'Different settings. A shared need for support.');
 case 'nhs-vs-private-aftercare': return panel('aftercare','Look beyond the first few months.',rows(['Monitoring','A plan for complications','Long-term maintenance']),'What happens after treatment starts?');
 case 'nhs-vs-private-medication': return panel('medication','Two routes to compare.',pair('NHS','Private','Access & local pathways','Ongoing costs & monitoring'),'Clinical suitability applies to both.');
 case 'nhs-vs-private-surgery': return panel('surgery','Compare the complete pathway.','<div class="ng-route"><span>Before</span><strong>Assessment</strong><span>During</span><strong>Procedure</strong><span>After</span><strong>Follow-up</strong></div>','Put the whole package into the comparison.');
 case 'nice-eligible-but-no-access': return panel('access','Separate the questions.',rows(['NICE criteria','Local NHS access','The next route to check']),'Ask which pathway is available locally.');
 case 'online-pharmacy-vs-clinic': return panel('provider','Look at how care is delivered.','<div class="ng-checks">'+['Assessment','Verification','Monitoring','Escalation'].map((s,i)=>'<div><span>0'+(i+1)+'</span><strong>'+s+'</strong></div>').join('')+'</div>','Provider checks go beyond convenience.');
 case 'wait-vs-pay-private': return panel('wait','Compare what you can sustain.',pair('Waiting','Paying privately','Access uncertainty','Long-term affordability'),'Include urgency, support and continuity.');
 default:throw Error('Missing scoped graphic '+p.key);
}}
