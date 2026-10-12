import fs from 'node:fs';
import path from 'node:path';
const dir=path.dirname(new URL(import.meta.url).pathname);
const read=name=>fs.readFileSync(path.join(dir,name),'utf8');
const html=read('index.html');
const main=html.match(/<main id="top">([\s\S]*?)<\/main>/)[1];
const nav=html.match(/<nav class="nav"[\s\S]*?<\/nav>/)[0];
const dialog='';
const reset='<div class="guide-controls"><button id="reset" class="text-button">Reset my choices</button></div>';
const markup='<main id="shift-food-guide"><div id="top"></div>'+nav+main.replace('This preview doesn’t connect to your account.','Your takeaway is not saved automatically to your account.').replace('This private version has not had an external clinical review.','This guide has not had an external clinical review.').replace('No account, tracking or health details needed.','No account or health details needed.')+reset+'</main>'+dialog+'<div class="guide-announcer" id="announcer" role="status" aria-live="polite"></div>';
function selector(s){
 s=s.trim();
 if(s===':root')return '#shift-food-guide, #detail-dialog';
 if(s==='*')return ':where(#shift-food-guide,#detail-dialog), :where(#shift-food-guide,#detail-dialog) *';
 if(s==='html')return 'html:has(#shift-food-guide)';
 if(s==='body')return '#shift-food-guide';
 if(s.startsWith('dialog'))return s.replace(/^dialog/,'#detail-dialog');
 return ':is(#shift-food-guide,#detail-dialog) '+s;
}
function scope(css){
 let out='',pos=0;
 while(pos<css.length){
  const open=css.indexOf('{',pos);if(open<0){out+=css.slice(pos);break;}
  const head=css.slice(pos,open);let depth=1,end=open+1;
  for(;end<css.length&&depth;end++){if(css[end]==='{')depth++;else if(css[end]==='}')depth--;}
  if(depth)throw Error('Unclosed CSS rule');
  const body=css.slice(open+1,end-1);
  // The accepted shell uses important theme rules. Override presentation only
  // inside this guide, while retaining the global contrast/consent runtime.
  const declarations=body.split(';').map(x=>x.trim()&&!x.includes('!important')?x+'!important':x).join(';');
  out+=head.trim().startsWith('@')?head+'{'+scope(body)+'}':head.split(',').map(selector).join(',')+'{'+declarations+'}';
  pos=end;
 }
 return out;
}
const css=scope(read('styles.css'))+'\n#shift-food-guide{max-width:none!important;width:100%!important;padding:0!important}#shift-food-guide .goal:not(.active)>*,#shift-food-guide .meal-tabs button:not(.active){color:#050505!important;-webkit-text-fill-color:#050505!important}#shift-food-guide .goal.active>*,#shift-food-guide .meal-tabs button:not(.active){color:#e7e3da!important;-webkit-text-fill-color:#e7e3da!important}#shift-food-guide .meal-tabs button.active{color:#050505!important;-webkit-text-fill-color:#050505!important}#shift-food-guide .guide-controls{max-width:1148px;margin:auto;padding:0 36px 28px}.guide-announcer{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)}@media print{.site-header,.site-drawer,#sst-footer-c,body>nav{display:none!important}}';
const sectionFix='#shift-food-guide section{background:transparent!important}#shift-food-guide>#start,#shift-food-guide>#shopping,#shift-food-guide>#evidence,#shift-food-guide>.hero{background:#e7e3da!important;color:#050505!important}#shift-food-guide>#food{background:#050505!important;color:#e7e3da!important}#shift-food-guide>#next{background:#d5d8c9!important;color:#050505!important}#shift-food-guide .hero-card{background:#e7e3da!important}';
const resetStyles='#shift-food-guide :is(section,div,article,aside,details){background:transparent!important;color:inherit!important}';
const textFix='#shift-food-guide p,#shift-food-guide .eyebrow{color:#050505!important;-webkit-text-fill-color:#050505!important}#shift-food-guide #food p,#shift-food-guide #food .eyebrow{color:#e7e3da!important;-webkit-text-fill-color:#e7e3da!important}#shift-food-guide #food .meal-output p,#shift-food-guide #food .meal-output .eyebrow{color:#050505!important;-webkit-text-fill-color:#050505!important}';
const printStyles='@media print{body>*{display:none!important}body>#print-takeaway{display:block!important;white-space:pre-wrap;overflow-wrap:anywhere;font:11px/1.5 Arial,Helvetica,sans-serif;color:#050505;background:#fff;margin:0;padding:0}}';
const listTextFix='#shift-food-guide #food .meal-output :is(li,strong,span),#shift-food-guide #shopping :is(li,strong,span,small){color:#050505!important;-webkit-text-fill-color:#050505!important}';
const exports={guideMarkup:markup,guideStyles:resetStyles+css+sectionFix+textFix+listTextFix+printStyles,guideData:read('data.js'),guideRuntime:read('guide.js')};
fs.writeFileSync(path.join(dir,'content.mjs'),'// Generated from the four preserved guide files; run build-content.mjs.\n'+Object.entries(exports).map(([key,v])=>'export const '+key+'='+JSON.stringify(v)+';').join('\n')+'\n');
