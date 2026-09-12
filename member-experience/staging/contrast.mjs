// Diagnostic for the isolated review only. Inspect the painted text colour,
// including WebKit text fill; checking CSS `color` alone missed pale-on-pale.
export const contrastCheckClient=String.raw`
function inspectMemberText(doc){
 const css=(el,pseudo)=>doc.defaultView.getComputedStyle(el,pseudo),failures=[],unmeasured=[];let checked=0;
 const rgb=value=>{if(!/^rgba?\(/.test(value))return null;const n=value.match(/[\d.]+/g).map(Number);return [n[0],n[1],n[2],n[3]??1]};
 const over=(fg,bg)=>fg.slice(0,3).map((v,i)=>v*fg[3]+bg[i]*(1-fg[3]));
 const light=c=>c.map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0);
 for(const el of doc.querySelectorAll('main *,dialog[open] *,[role=dialog] *,.sst-member-tabs *')){
  if(!el.getClientRects().length||el.closest('[hidden],[aria-hidden="true"],button:disabled,input:disabled,textarea:disabled,select:disabled'))continue;
  if(['SCRIPT','STYLE','OPTION'].includes(el.tagName))continue;
  let text=[...el.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join(' ').trim(),style=css(el);
  if(['INPUT','TEXTAREA'].includes(el.tagName)&&!['checkbox','radio','file','range','hidden'].includes(el.type)){text=el.value||el.getAttribute('placeholder')||'';if(!el.value&&text)style=css(el,'::placeholder')}
  if(!text)continue;
  const ancestors=[];let opacity=Number(style.opacity)||0;
  for(let p=el;p;p=p.parentElement){ancestors.push(p);if(p!==el)opacity*=Number(css(p).opacity)}
  if(!opacity)continue;
  let background=[231,227,218];for(const p of ancestors.reverse()){const c=rgb(css(p).backgroundColor);if(c)background=over(c,background)}
  const fill=style.getPropertyValue('-webkit-text-fill-color')||style.color,foreground=rgb(fill);
  if(!foreground){unmeasured.push({text:text.slice(0,100),fill});continue}
  foreground[3]*=opacity;const painted=over(foreground,background),a=light(painted),b=light(background),ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);
  const size=parseFloat(style.fontSize),weight=parseFloat(style.fontWeight)||400,minimum=size>=24||(size>=18.66&&weight>=700)?3:4.5;checked++;
  if(ratio+.01<minimum)failures.push({text:text.slice(0,100),element:el.id||el.className||el.tagName,color:style.color,fill,background:background.map(Math.round),ratio:Math.round(ratio*100)/100,minimum});
 }
 return {checked,failures,unmeasured,note:'Computed text pairs only; images, gradients and overlays also need visual inspection.'};
}
document.querySelector('#check-contrast').addEventListener('click',()=>{document.querySelector('#contrast-results').textContent=JSON.stringify(inspectMemberText(document.querySelector('#layout-frame').contentDocument),null,2)});
`;
