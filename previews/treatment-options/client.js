const root=document.querySelector('[data-treatment-options-preview]');
if(root){
 const links=[...root.querySelectorAll('[data-format]')],cards=[...root.querySelectorAll('[data-format-type]')],count=root.querySelector('[data-options-count]');
 function filter(format){let n=0;for(const c of cards){c.hidden=format!=='all'&&c.dataset.formatType!==format;if(!c.hidden)n++;}for(const a of links){if(a.dataset.format===format)a.setAttribute('aria-current','true');else a.removeAttribute('aria-current');}if(count)count.textContent=n+' options';}
 for(const a of links)a.addEventListener('click',e=>{if(e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;e.preventDefault();const u=new URL(a.href);history.pushState({},'',u);filter(a.dataset.format);});
 addEventListener('popstate',()=>filter(new URLSearchParams(location.search).get('format')||'all'));
 const price=root.querySelector('[data-selected-price]');for(const input of root.querySelectorAll('[data-price]'))input.addEventListener('change',()=>{if(price)price.textContent=input.dataset.price;});
}
