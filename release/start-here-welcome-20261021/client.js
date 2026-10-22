(()=>{'use strict';
const root=document.querySelector('[data-start-welcome-version]');if(!root)return;
const $=s=>root.querySelector(s),$$=s=>[...root.querySelectorAll(s)],welcome=$('#sw-welcome'),questions=$('#sw-questions'),result=$('#sw-result');
const answers={why:['Lose weight'],med:[],access:[],budget:[]};let step=0;
const arrow='<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 12h16m-6-6 6 6-6 6"/></svg>';
const motion=()=>matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth';
const routes=$('#sw-routes');
$('a[href="#sw-routes"]').addEventListener('click',e=>{
 e.preventDefault();e.stopPropagation();
 history.pushState({},'',location.pathname+location.search+'#sw-routes');
 routes.setAttribute('tabindex','-1');routes.focus({preventScroll:true});
 routes.scrollIntoView({behavior:motion(),block:'start'});
});
function view(which,focus=true){welcome.hidden=which!=='welcome';questions.hidden=which!=='questions';result.hidden=which!=='result';document.title=which==='result'?'Your weight-loss starting point | SHIFT Some Timber':'Start Here | SHIFT Some Timber';if(focus){const el=which==='welcome'?$('#sw-title'):which==='questions'?$('[data-quick-step="'+step+'"] h2'):$('#sw-result-title');el.setAttribute('tabindex','-1');el.focus({preventScroll:true});scrollTo({top:0,behavior:'auto'});}}
function sync(){ $$('[data-quick-step]').forEach((el,i)=>el.hidden=i!==step);$('[data-quick-count]').textContent='Question '+(step+1)+' of 3';$('[role=progressbar]').setAttribute('aria-valuenow',step+1);$('[data-quick-bar]').style.width=((step+1)/3*100)+'%';$('[data-quick-back]').hidden=step===0;$('[data-quick-next]').innerHTML=(step===2?'Show my next steps':'Continue')+' '+arrow;$('[data-quick-validation]').textContent='';}
function openQuestions(){step=0;sync();view('questions');}
$$('[data-weight-start]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();history.pushState({route:'weight-loss'},'',a.getAttribute('href'));openQuestions();}));
$$('[data-welcome-back]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();history.pushState({},'','/start-here');view('welcome');}));
$$('[data-multi],[data-one]').forEach(group=>{const key=group.dataset.multi||group.dataset.one;group.querySelectorAll('button').forEach(button=>button.addEventListener('click',()=>{if(button.getAttribute('aria-disabled')==='true')return;if(group.dataset.one){group.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));}else button.setAttribute('aria-pressed',String(button.getAttribute('aria-pressed')!=='true'));answers[key]=[...group.querySelectorAll('[aria-pressed=true]')].map(b=>b.dataset.choice);$('[data-quick-validation]').textContent='';}));});
$('[data-quick-back]').addEventListener('click',()=>{step--;sync();view('questions');});
$('[data-quick-next]').addEventListener('click',()=>{if(step===1&&(!answers.med.length||!answers.access.length)){$('[data-quick-validation]').textContent='Choose a support preference and an access route to continue.';return;}if(step===2&&!answers.budget.length){$('[data-quick-validation]').textContent='Choose a budget range to see your next steps.';return;}if(step<2){step++;sync();view('questions');}else render();});
$('#sw-edit').addEventListener('click',()=>{step=0;sync();view('questions');});
function pair(label,value){const div=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=label;dd.textContent=value;div.append(dt,dd);return div;}
function render(){
const med=answers.med[0],access=answers.access[0],budget=answers.budget[0],noMed=med==='No medication',free=budget==='£0 / NHS'||access==='NHS';
$('#sw-summary').replaceChildren(pair('Your priorities',answers.why.join(', ')),pair('Your preference',med),pair('Access',access),pair('Budget',budget+' per calendar month'));
$('#sw-result-reason').textContent='You chose the weight-loss route'+(answers.why.length>1?' and told us that '+answers.why.slice(1).join(', ').toLowerCase()+' matters too.':'.')+' Here is why these starting points fit your choices.';
$('#sw-support-reason').textContent='You want support with weight loss. My Timber brings together food, movement, check-ins and progress tools, so you can begin without buying medicine.';
const title=$('#sw-route-title'),reason=$('#sw-route-reason'),link=$('#sw-route-link'),money=$('#sw-route-budget');
if(noMed){title.textContent='Build a routine without medication.';reason.textContent='You selected no medication. The Programme explains practical food, movement and ongoing support, with free My Timber tools to help you put it into practice.';link.href='/programme';link.innerHTML='Explore the Programme '+arrow;money.textContent='You do not need to spend your '+budget+' budget to begin with free My Timber.';}
else if(free){title.textContent='Explore free support and NHS routes first.';reason.textContent='You selected '+(access==='NHS'?'NHS access':'the £0 / NHS budget')+'. Read about NHS weight-management support, eligibility and local availability. Your interest in '+({Jabs:'injections',Tablets:'oral options',Either:'both oral and injection options'})[med]+' can be part of a clinical conversation; it does not establish eligibility.';link.href='/guides/nhs-weight-management-uk-guide';link.innerHTML='Understand NHS routes '+arrow;money.textContent='Free My Timber is available alongside this route. NHS eligibility and treatment availability depend on the service.';}
else{title.textContent='Understand treatment and assessment.';reason.textContent='You are open to '+({Jabs:'injections',Tablets:'tablets or capsules',Either:'both oral and injection options'})[med]+' and selected '+access.toLowerCase()+' access. Explore how assessment works, treatment formats and what to consider. A prescriber decides whether any medicine is suitable.';link.href='/treatment-centre';link.innerHTML='Explore treatment options '+arrow;money.textContent='You selected '+budget+' per calendar month. This is your spending preference, not a price match. Check the ongoing cost, strength, pack quantity and supply period before buying; a four-week charge repeats 13 times over 52 weeks.';}
const extra=answers.why.filter(x=>x!=='Lose weight');$('.sw-result-health').hidden=!extra.length;$('#sw-health-reason').textContent='You also selected '+extra.join(', ').toLowerCase()+'. SHIFT Health provides another starting point for understanding your wider health, alongside weight-loss support.';
view('result');
}
addEventListener('popstate',()=>{if(new URLSearchParams(location.search).get('route')==='weight-loss'){sync();view('questions');}else view('welcome');});
sync();view(new URLSearchParams(location.search).get('route')==='weight-loss'?'questions':'welcome',false);
})();
