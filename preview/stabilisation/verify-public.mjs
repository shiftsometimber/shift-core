import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {reconcilePublicDocument,reconcileSitemap,relatedGuideGroups,publicHeader,publicDrawer,publicFooter} from '../../public-shell-contract.mjs';
const dir='work/staging/generated',before=JSON.parse(readFileSync(dir+'/public-baseline.json')),after=JSON.parse(readFileSync(dir+'/public-preview.json'));
const report={checkedAt:new Date().toISOString(),pages:[],linked:[],heldLegacy:['/corporate-wellbeing','/pricing-membership','/progress-centre-methodology'],productionWrites:0};
const tag=(html,name)=>html.match(new RegExp('<'+name+'\\b[^>]*>[\\s\\S]*?<\\/'+name+'>','i'))?.[0]||'';
const anchors=html=>[...html.matchAll(/<a\b[^>]*href=["']([^"']+)["']/gi)].map(m=>m[1]);
for(const b of before.pages){
 const a=after.pages.find(p=>p.path===b.path);assert(a,b.path+' missing from preview');
 const path=b.path,html=a.after;
 assert.equal((html.match(/class="site-footer"/g)||[]).length,1,path+' needs one shared footer');
 const foot=html.match(/<footer\b(?=[^>]*class=["'][^"']*site-footer)[^>]*>[\s\S]*?<\/footer>/i)?.[0]||'';
 const footLinks=anchors(foot);assert.equal(new Set(footLinks).size,footLinks.length,path+' footer duplicate');
 const drawer=html.match(/<aside\b(?=[^>]*id=["']site-drawer)[^>]*>[\s\S]*?<\/aside>/i)?.[0]||'';
 assert(anchors(drawer).includes('/shift-newsroom'),path+' drawer newsroom');
 if(path!=='/life-back'){
  assert.equal(tag(b.before,'title'),tag(html,'title'),path+' title changed');
  assert.equal(tag(b.before,'h1'),tag(html,'h1'),path+' heading changed');
  const mainBefore=tag(b.before,'main').replace(/(<a\b[^>]*href=["'])(?:https:\/\/shiftsometimber\.co\.uk)?\/medicine-news(?=[?#"'])/gi,'$1/shift-newsroom');
  const mainAfter=tag(html,'main').replace(/<section data-shift-link-repair\b[^>]*>[\s\S]*?<\/section>/i,'');
  assert.equal(mainAfter,mainBefore,path+' original main content changed');
 }
 if(path==='/contact'){
  const forms=s=>[...s.matchAll(/<form\b[^>]*>[\s\S]*?<\/form>/gi)].map(m=>m[0]);
  assert.deepEqual(forms(b.before),forms(html),'Contact form changed');
  const scriptRefs=s=>[...s.matchAll(/<script\b[^>]*src=["']([^"']+)["']/gi)].map(m=>m[1]);assert.deepEqual(scriptRefs(b.before),scriptRefs(html),'Contact scripts changed');
 }
 assert.equal(reconcilePublicDocument(html,path),html,path+' not idempotent');
 report.pages.push({path,status:a.status,mainPreserved:path!=='/life-back',workedExample:path==='/life-back',sha256:createHash('sha256').update(html).digest('hex')});
}
for(const [hub,groups]of Object.entries(relatedGuideGroups))for(const group of groups)for(const link of group.links){
 const h=after.pages.find(p=>p.path===hub);assert(h&&anchors(h.after).includes(link.path),'Missing contextual link '+hub+' -> '+link.path);
 assert(after.pages.some(p=>p.path===link.path&&p.status===200),'Linked guide not HTTP 200: '+link.path);report.linked.push({hub,path:link.path});
}
assert.equal(reconcileSitemap(before.sitemap),after.sitemap);
const urls=s=>[...s.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]);report.sitemap={before:urls(before.sitemap).length,after:urls(after.sitemap).length,removed:urls(before.sitemap).filter(u=>!urls(after.sitemap).includes(u)),added:urls(after.sitemap).filter(u=>!urls(before.sitemap).includes(u))};
assert.deepEqual(report.sitemap.removed,['https://shiftsometimber.co.uk/shift-for-work']);assert.deepEqual(report.sitemap.added,[]);
assert(!after.sitemap.includes('<loc>https://shiftsometimber.co.uk/shop</loc>'));
for(const path of ['/shift-for-work','/shop']){const page=after.pages.find(p=>p.path===path);assert(/<meta\b[^>]*name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(page.after),path+' noindex decision changed');}
report.result='pass';report.linkedMentalHealth=report.linked.filter(x=>x.path.startsWith('/mental-health/')).length;
writeFileSync(dir+'/public-proof.json',JSON.stringify(report,null,2));console.log(JSON.stringify({result:report.result,pages:report.pages.length,contextualLinks:report.linked.length,mentalHealth:report.linkedMentalHealth,sitemap:report.sitemap,held:report.heldLegacy},null,2));
