import {sixPageRecoveryRuntime} from './six-page-recovery.mjs';
// Reuse the serving Support/More renderer and its exact wording. The extracted
// renderer owns one content node; its old frame/bootstrap code is not included.
const lines=sixPageRecoveryRuntime.split('\n');
const one=prefix=>{const found=lines.find(line=>line.trimStart().startsWith(prefix));if(!found)throw Error('Retained utility contract missing: '+prefix);return found;};
const styleLiteral=sixPageRecoveryRuntime.match(/style\.textContent=("(?:\\.|[^"\\])*");document\.head\.append\(style\)/)?.[1];
if(!styleLiteral)throw Error('Retained Support stylesheet contract changed');
const css=JSON.parse(styleLiteral),prefix=css.slice(0,css.indexOf('{')).trim();
export const retainedUtilityStyles=[...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].filter(([,selector])=>/\.mt-r-|#mtUtility/.test(selector)&&!/#todayBrand|#mtSixNav|#mtRemembered|#mtMemory/.test(selector)).map(([,selector,body])=>selector.split(prefix).join('#mtNativeMain')+'{'+body.replace(/!important/g,'')+'}').join('\n');
let renderer=sixPageRecoveryRuntime.slice(sixPageRecoveryRuntime.indexOf(' function showUtility(){'),sixPageRecoveryRuntime.indexOf(' function clear(){'));
if(!renderer.includes('Need help? Go to Support')||!renderer.includes('WHAT WOULD HELP?'))throw Error('Retained Support routes changed');
renderer=renderer.replace(/  let host=\$\('#mtUtility'\);[^\n]*\n  if\(!host\)[^\n]*\n/,"  const host=s.root;\n");
renderer=renderer.replace('else if(window.SST_API?.logout)','else if(s.logout)').replace('await window.SST_API.logout()','await s.logout()');
renderer=renderer.replace("c.append(buttonRow(glyph,title,sub,()=>", "c.append(...(key==='stall'&&!s.weightVisible()?[]:[buttonRow(glyph,title,sub,()=>");
renderer=renderer.replace("window.scrollTo(0,0))}));c.append(el('p','mt-r-stays'", "window.scrollTo(0,0))})]));c.append(el('p','mt-r-stays'");
renderer=renderer.replace('function showUtility(){','function renderUtility(){');
export const retainedUtilitySource='function retainedUtility(s){\n'+
 "const $=selector=>s.root.querySelector(selector),ready=s.ready;\n"+
 [one('const el='),one('const paths='),one('function icon('),one('paths.wallet='),one('paths.people='),one('paths.scale='),one('const shedUrl='),one('const link=')].join('\n')+'\n'+
 "let utility=s.page==='more'?'stuff':'support',detail='',preferenceOwner=String(s.account()),headlinePreference='tap',quoteRevealed=false;try{headlinePreference=localStorage.getItem('mt:headline:'+preferenceOwner)==='off'?'off':'tap'}catch{}\n"+
 "function updateHero(){document.dispatchEvent(new CustomEvent('mt:headline-privacy'));}function clear(){s.clearAuth();}\n"+
 [one('function hero('),one('function row('),one('function buttonRow('),one('function shedRow('),one('function headlineControls('),one('const situations='),one('function urgent(')].join('\n')+'\n'+renderer+'\nconst decorate='+decorateUtility.toString()+';function showUtility(){renderUtility();decorate(s,s.root,row,icon,el,utility,detail);}' +
 "\ndocument.addEventListener('mt:privacy-changed',()=>{if(!s.weightVisible()&&detail==='stall')detail='';delete s.root.dataset.view;if(s.root.isConnected)showUtility();});document.addEventListener('mt:screen-activated',e=>{if(e.detail?.page===s.page){delete s.root.dataset.view;showUtility();}});showUtility();return {render:showUtility};\n}";

function decorateUtility(s,host,row,icon,el,utility,detail){
 const c=host.querySelector('.mt-r-content');if(!c||host.querySelector('.mt-u-group'))return;
 const group=(nodes,className='')=>{nodes=nodes.filter(Boolean);if(!nodes.length)return null;const box=el('section','mt-u-group '+className);nodes[0].before(box);box.append(...nodes);return box;};
 const heading=host.querySelector('h1');if(heading){const text=heading.textContent,part=detail==='symptoms'?'feeling unwell.':'In your corner.';const at=text.toLowerCase().indexOf(part.toLowerCase());if(at>=0){heading.replaceChildren(document.createTextNode(text.slice(0,at)),el('span','mt-u-accent',text.slice(at)));}}
 if(utility==='stuff'){
  const support=c.querySelector('.mt-r-row');support?.classList.add('mt-u-standalone');
  const mark=[...c.children].find(n=>n.textContent==='YOUR STUFF'),out=c.querySelector('.mt-r-signout'),stuff=[];
  for(let n=mark?.nextElementSibling;n&&n!==out;n=n.nextElementSibling)stuff.push(n);group(stuff);
  const quickTitle=el('div','mt-u-heading');quickTitle.append(el('p','mt-r-eyebrow','QUICK SETTINGS'),el('small','','Shortcuts into Account & settings'));out.before(quickTitle);
  const quick=el('section','mt-u-group mt-u-quick');out.before(quick);
  quick.append(row('scale','Show weight: '+(s.weightVisible()?'On':'Off'),"Turn off if you’d rather focus on strength, energy or measurements.",'/member/life-back/preferences'),row('clock','Daily check-in reminder','Optional. No health details in the notification','/member/settings#notifications'),row('help','Health tags','Saved with your consent. Never shared.','/member/settings#health-tags'),row('settings','Units','Weight and height','/member/settings#prefWeight'),row('bookmark','Privacy & data rights','Export your data, or delete your account','/member/settings#healthConsentManager'));
  const tail=[out];for(let n=out.nextElementSibling;n&&!n.classList.contains('mt-r-version');n=n.nextElementSibling)tail.push(n);group(tail);
  const privacy=c.querySelector('.mt-r-privacy');if(privacy)privacy.classList.add('mt-u-privacy');
  return;
 }
 if(detail){
  const back=c.querySelector('.mt-r-back');if(back){back.textContent='Back to Support';host.prepend(back);}
  for(const h of [...c.children].filter(n=>n.tagName==='H2')){const p=h.nextElementSibling;if(p?.tagName==='P'){const note=el('section','mt-u-note');h.before(note);note.append(h,p);}}
  group([...c.children].filter(n=>n.classList.contains('mt-r-row')));return;
 }
 const marker=[...c.children].find(n=>n.textContent==='WHAT WOULD HELP?'),intro=[];
 for(let n=c.firstElementChild;n&&n!==marker;n=n.nextElementSibling)if(n.classList.contains('mt-r-row'))intro.push(n);group(intro);
 const stays=c.querySelector('.mt-r-stays'),situations=[];for(let n=marker?.nextElementSibling;n&&n!==stays;n=n.nextElementSibling)situations.push(n);
 group(situations,'mt-u-situations');
 const savedTitle=el('div','mt-u-heading');savedTitle.append(el('p','mt-r-eyebrow','YOUR SAVED STEP'),el('small','','Private and optional'));stays.before(savedTitle);
 const saved=el('section','mt-u-group');saved.append(row('bookmark','My next step','Open my saved step and reminders','/member/support'),row('people','Mates league','Ranked on effort, never weight. Private to your crew.','/member/life-back/support/league'));stays.before(saved);
 const contact=stays.nextElementSibling;if(contact?.classList.contains('mt-r-row'))contact.classList.add('mt-u-standalone');
}
export const supportMoreRestyle=String.raw`
#mtNativeMain #mtUtility{padding:0;color:#E7E3DA;background:#050505}
#mtNativeMain #mtUtility .mt-r-hero:after{display:none!important}
#mtNativeMain #mtUtility .mt-r-hero{padding:0;background:#050505;border:0;margin:14px 0 20px}
#mtNativeMain #mtUtility .mt-r-hero h1{font:700 clamp(30px,8vw,42px)/1.02 MyTimberHeading,"Arial Narrow",Arial,sans-serif;text-transform:uppercase;letter-spacing:0;margin:8px 0}
#mtNativeMain #mtUtility .mt-r-sub{font:16px/1.45 Arial,Helvetica,sans-serif;margin:6px 0;color:#bfc0b5}
#mtNativeMain #mtUtility .mt-u-accent{color:#AEBF92;-webkit-text-fill-color:#AEBF92}
#mtNativeMain #mtUtility .mt-r-content{display:block;padding:0;background:#050505}
#mtNativeMain #mtUtility .mt-r-eyebrow{font:700 12px/1.4 Arial,Helvetica,sans-serif;letter-spacing:.12em;color:#a7ad9c;margin:18px 0 10px}
#mtNativeMain #mtUtility .mt-u-group{border:1px solid #707762;border-radius:18px;overflow:hidden;margin:14px 0;background:#050505;padding:0}
#mtNativeMain #mtUtility .mt-r-row{display:flex;align-items:center;gap:12px;padding:14px 15px;margin:0;min-height:64px;border:0;border-bottom:1px solid #272c23;border-radius:0;background:#050505;color:#E7E3DA;text-decoration:none;text-align:left;box-sizing:border-box}
#mtNativeMain #mtUtility .mt-r-row:last-child{border-bottom:0}
#mtNativeMain #mtUtility .mt-r-row>svg{width:22px;height:22px;stroke:#879174;flex:0 0 22px}
#mtNativeMain #mtUtility .mt-r-row>span{flex:1;min-width:0}
#mtNativeMain #mtUtility .mt-r-row>svg:last-child{width:18px;height:18px;flex-basis:18px;color:#bfc0b5}
#mtNativeMain #mtUtility .mt-r-row strong{display:block;font:700 16px/1.3 Arial,Helvetica,sans-serif;color:#E7E3DA}
#mtNativeMain #mtUtility .mt-r-row small{display:block;font:14px/1.4 Arial,Helvetica,sans-serif;color:#bfc0b5;margin-top:3px}
#mtNativeMain #mtUtility .mt-u-standalone{border:1px solid #707762;border-radius:18px;margin:14px 0}
#mtNativeMain #mtUtility .mt-r-urgent{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;border:0;border-radius:22px;background:#E7E3DA;color:#050505;padding:16px;margin:16px 0}
#mtNativeMain #mtUtility .mt-r-urgent h2{grid-column:1/-1;font:700 25px/1.1 MyTimberHeading,"Arial Narrow",Arial,sans-serif;text-transform:uppercase;color:#050505;margin:0}
#mtNativeMain #mtUtility .mt-r-urgent>p{grid-column:1/-1;color:#414733!important;-webkit-text-fill-color:#414733!important;background:none!important;opacity:1!important;font-size:14px;margin:0 0 4px}
#mtNativeMain #mtUtility .mt-r-urgent-call{display:block;border:0;border-radius:14px;background:#050505;color:#E7E3DA;padding:10px 8px;text-decoration:none;min-width:0}
#mtNativeMain #mtUtility .mt-r-urgent-call strong{display:block;white-space:normal!important;overflow-wrap:anywhere;min-width:0;font:700 13px/1.3 Arial,Helvetica,sans-serif;color:#E7E3DA}
#mtNativeMain #mtUtility .mt-r-urgent-call span{display:block;white-space:normal!important;overflow-wrap:anywhere;min-width:0;max-width:100%;font:12px/1.4 Arial,Helvetica,sans-serif;color:#bfc0b5;margin:5px 0 0}
#mtNativeMain #mtUtility .mt-u-situations{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;border:0;border-radius:0;background:#050505}
#mtNativeMain #mtUtility .mt-u-situations .mt-r-row{display:block;border:1px solid #272c23;border-radius:16px;background:#151713;padding:14px;min-height:140px}
#mtNativeMain #mtUtility .mt-u-situations .mt-r-row>svg:first-child{margin-bottom:10px}
#mtNativeMain #mtUtility .mt-u-situations .mt-r-row>svg:last-child{display:none}
#mtNativeMain #mtUtility .mt-u-situations .mt-r-row:last-child:nth-child(odd){grid-column:1/-1;min-height:70px;display:flex}
#mtNativeMain #mtUtility .mt-u-heading{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:20px 0 10px}
#mtNativeMain #mtUtility .mt-u-heading .mt-r-eyebrow{margin:0}
#mtNativeMain #mtUtility .mt-u-heading small{font:12px/1.4 Arial,Helvetica,sans-serif;color:#bfc0b5}
#mtNativeMain #mtUtility .mt-r-stays{border-left:3px solid #707762;padding:0 0 0 14px;font:14px/1.5 Arial,Helvetica,sans-serif;color:#bfc0b5;background:transparent;margin:20px 0}
#mtNativeMain #mtUtility .mt-r-privacy{padding:14px 16px;background:#050505;border:0;border-radius:0;color:#E7E3DA}
#mtNativeMain #mtUtility .mt-r-privacy summary{font-weight:700;min-height:28px}
#mtNativeMain #mtUtility .mt-r-privacy label{display:flex;align-items:center;gap:12px;font-size:14px;margin:10px 0}
#mtNativeMain #mtUtility .mt-r-privacy input{accent-color:#879174;min-height:24px;width:24px}
#mtNativeMain #mtUtility .mt-r-privacy p{font:13px/1.5 Arial,Helvetica,sans-serif;color:#bfc0b5}
#mtNativeMain #mtUtility .mt-r-version{font:12px/1.5 Arial,Helvetica,sans-serif;color:#a7ad9c;margin-top:20px}
#mtNativeMain #mtUtility .mt-r-back{border:0;background:transparent;color:#bfc0b5;padding:4px 0;min-height:40px;margin:0 0 8px}
#mtNativeMain #mtUtility .mt-u-note{padding-left:14px;border-left:3px solid #707762;margin:20px 0}
#mtNativeMain #mtUtility .mt-u-note h2{font:700 24px/1.1 MyTimberHeading,"Arial Narrow",Arial,sans-serif;text-transform:uppercase;margin:0 0 5px}
#mtNativeMain #mtUtility .mt-u-note p{font:16px/1.5 Arial,Helvetica,sans-serif;color:#bfc0b5;margin:0}
`;
