export function feedbackOutcome(answer){return {
 helped:{state:'tried-helpful',attempted:true,helpful:true,text:'Keep this as a useful option. The sample records your report; it does not infer a health result.'},
 'not-for-me':{state:'unsuitable',attempted:null,helpful:null,text:'Try another approach. This idea has been marked unsuitable in the sample; no attempt is assumed.'},
 'tried-no-help':{state:'tried-no-benefit',attempted:true,helpful:false,text:'Trying it gave useful information. Choose another way to approach the same weekly prompt.'},
 'not-done':{state:'not-done',attempted:false,helpful:null,text:'No guilt. Make the next step smaller: choose a time to look at this week’s prompt. No attempt or completion is recorded.'}
 }[answer]||null;}
export function initSample(){
 const dataNode=document.getElementById('sample-data');if(!dataNode)return;
 const {weeks,scenarios}=JSON.parse(dataNode.textContent),query=new URL(location.href).searchParams;
 let week=/^[1-6]$/.test(query.get('week')||'')?Number(query.get('week')):1,selected=null,log=[];
 const $=s=>document.querySelector(s),feedback=$('#sample-feedback'),button=$('#sample-plan'),status=$('#sample-response');
 function renderLog(){const list=$('#sample-log');list.replaceChildren();for(const entry of log.length?log:['No sample activity yet.']){const li=document.createElement('li');li.textContent=entry;list.append(li);}}
 function scenario(){const entries=scenarios[$('#sample-scenario').value]||scenarios.family,root=$('#sample-entries');root.replaceChildren();['My reset','What I tried','My reflection'].forEach((label,i)=>{const p=document.createElement('p'),strong=document.createElement('strong');strong.textContent=label+': ';p.append(strong,document.createTextNode(entries[i]));root.append(p);});}
 function render(){document.querySelectorAll('[data-week-content]').forEach(el=>el.hidden=Number(el.dataset.weekContent)!==week);document.querySelectorAll('[data-week]').forEach(a=>{if(Number(a.dataset.week)===week)a.setAttribute('aria-current','step');else a.removeAttribute('aria-current');});selected=null;feedback.hidden=true;button.disabled=false;status.hidden=true;}
 document.querySelectorAll('[data-week]').forEach(a=>a.addEventListener('click',event=>{if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;event.preventDefault();week=Number(a.dataset.week);const url=new URL(location.href);url.searchParams.set('week',String(week));history.pushState(null,'',url.pathname+url.search);render();$('[data-week-content="'+week+'"] h2').focus({preventScroll:true});}));
 button.addEventListener('click',()=>{if(selected!==null)return;selected=week;log.push('Planned in sample: Week '+week+' — '+weeks[week-1].title+'. Not marked completed.');renderLog();button.disabled=true;feedback.hidden=false;});
 document.querySelectorAll('[data-feedback]').forEach(b=>b.addEventListener('click',()=>{if(selected===null)return;const outcome=feedbackOutcome(b.dataset.feedback);if(!outcome)return;log.push('Week '+selected+': '+outcome.state+' — '+b.textContent+'.');renderLog();status.textContent=outcome.text;status.hidden=false;feedback.hidden=true;selected=null;}));
 $('#sample-scenario').addEventListener('change',scenario);
 $('#sample-reset').addEventListener('click',()=>{week=1;selected=null;log=[];$('#sample-scenario').value='family';history.replaceState(null,'',location.pathname);render();scenario();renderLog();});
 addEventListener('popstate',()=>{const value=new URL(location.href).searchParams.get('week');week=/^[1-6]$/.test(value||'')?Number(value):1;render();});
 render();scenario();renderLog();
}
if(typeof document!=='undefined')initSample();
