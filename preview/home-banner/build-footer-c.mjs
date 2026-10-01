import {mkdirSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {footerCSS} from './footer-c.mjs';
mkdirSync('preview/home-banner/generated',{recursive:true});mkdirSync('home-banner-proof',{recursive:true});
const r=await fetch('https://shiftsometimber.co.uk/');assert(r.ok);const baseline=await r.text();
const remove=/<section class="route-panel">[\s\S]*?<\/section>\s*<div class="alone-divider">[\s\S]*?<\/div>\s*<section class="home-platform" id="shift">[\s\S]*?<\/section>/;
const removed=baseline.match(remove)?.[0];assert(removed,'Expected approved two homepage blocks');
const oldFooter=baseline.match(/<footer class="site-footer">[\s\S]*?<\/footer>/)?.[0];assert(oldFooter);
const sections=oldFooter.match(/<section\b[^>]*>[\s\S]*?<\/section>/g);assert.equal(sections.length,6);
sections[0]=sections[0].replace('<p>Helping ordinary blokes feel like themselves again.</p>','');
const nav=oldFooter.match(/<nav\b[\s\S]*?<\/nav>/)[0],access=oldFooter.match(/<div aria-label="Accessibility controls"[\s\S]*?<\/div>/)[0],bottom=oldFooter.match(/<div class="footer-bottom">[\s\S]*?<\/div>/)[0],app=oldFooter.match(/<div class="my-timber-app-footer"[\s\S]*?<\/div>/)[0];
const footer='<footer class="site-footer" id="sst-footer-c"><div class="fc-main">'+sections.join('')+'</div><div class="fc-legal"><div class="fc-legal-inner">'+nav+access+bottom+app+'</div></div></footer>';

const oldRoute=baseline.match(/<div class="sst-route-inner">[\s\S]*?<\/ol><\/div>/)?.[0];assert(oldRoute,'Expected homepage route cards');
const icon=(s)=>'<svg viewBox="0 0 96 112" aria-hidden="true" focusable="false">'+s+'</svg>';
const programme=icon('<rect x="12" y="10" width="72" height="92" rx="8" fill="none" stroke="currentColor" stroke-width="7"/><path d="M26 34h18m13 0 5 5 10-13M26 57h18m13 0 5 5 10-13M26 80h18m13 0 5 5 10-13" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>');
const health=icon('<path d="M48 102 12 65C-15 35 10-1 36 17L48 27 60 17C86-1 111 35 84 65Z" fill="currentColor"/><path d="M18 56h16l8-20 12 39 9-19h16" fill="none" stroke="#E7E3DA" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>');
const timber=icon('<rect x="16" y="6" width="64" height="100" rx="10" fill="none" stroke="currentColor" stroke-width="7"/><path d="M40 17h16M42 94h12" stroke="currentColor" stroke-width="5" stroke-linecap="round"/><path d="M64 48a22 22 0 1 0 5 16M36 57l10 10 22-24" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>');
const card=(href,title,lead,body,svg,label)=>'<li><a class="hc-card" href="'+href+'"><div class="hc-top">'+svg+'<div><h3>'+title+'</h3><p class="hc-lead">'+lead+'</p></div></div><p class="hc-copy">'+body+'</p><span class="hc-link">'+label+' <span aria-hidden="true">→</span></span></a></li>';
const route='<div class="hc-wrap" id="how-shift-can-help"><h2 id="sst-home-route-title">HOW <span>SHIFT</span> CAN HELP.</h2><ol class="hc-grid"><li><a class="hc-card hc-start" href="/start-here"><h3>WEIGHT LOSS,<br>ON YOUR TERMS.</h3><p class="hc-copy">Explore your options and understand what each involves.</p><span class="hc-link">START HERE <span aria-hidden="true">→</span></span></a></li>'+card('/programme','THE PROGRAMME','Build around real life.','Food, movement and support you can keep coming back to.',programme,'Explore the programme')+card('/shift-health','SHIFT HEALTH','Understand your options.','Clear information on men’s health, home tests and treatment routes.',health,'Explore SHIFT Health')+card('/member/dashboard','MY TIMBER','Keep it going.','Your free home for meals, movement, check-ins and progress.',timber,'Explore My Timber')+'</ol></div>';
const routeCSS=`<style id="hc-style">\nhtml body main#main-content #sst-home-route .hc-wrap *{-webkit-text-fill-color:currentColor!important}
html body main#main-content #sst-home-route{background:#050505!important}
html body main#main-content #sst-home-route .hc-wrap{max-width:1500px!important;margin:auto!important;padding:32px 24px!important;color:#E7E3DA!important;scroll-margin-top:100px!important}
html body main#main-content #sst-home-route .hc-wrap h2#sst-home-route-title{font-family:Arial,Helvetica,sans-serif!important;font-size:clamp(27px,3.2vw,48px)!important;font-weight:750!important;line-height:1.15!important;letter-spacing:-.025em!important;margin:0 0 32px!important;color:#E7E3DA!important}
html body main#main-content #sst-home-route .hc-wrap h2 span{color:#707762!important}
html body main#main-content #sst-home-route .hc-grid{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:14px!important;list-style:none!important;margin:0!important;padding:0!important}
html body main#main-content #sst-home-route .hc-grid>li{grid-template-columns:none!important;display:flex!important;margin:0!important;padding:0!important;min-width:0!important;border:0!important}
html body main#main-content #sst-home-route .hc-card{box-sizing:border-box!important;display:flex!important;flex-direction:column!important;width:100%!important;padding:18px!important;background:#E7E3DA!important;color:#050505!important;border-radius:7px!important;text-decoration:none!important;min-height:220px!important;gap:0!important;justify-content:flex-start!important;border:0!important}
html body main#main-content #sst-home-route .hc-top{display:flex!important;align-items:center!important;gap:12px!important;margin-bottom:12px!important}
html body main#main-content #sst-home-route .hc-top>div{min-width:0!important}
html body main#main-content #sst-home-route .hc-top svg{width:56px!important;height:68px!important;flex:0 0 56px!important;color:#707762!important}
html body main#main-content #sst-home-route .hc-card h3{font-size:clamp(19px,1.6vw,25px)!important;line-height:1.15!important;margin:0 0 10px!important;color:#050505!important}
html body main#main-content #sst-home-route .hc-card p{font-size:16px!important;line-height:1.45!important;color:#050505!important;margin:0 0 12px!important}
html body main#main-content #sst-home-route .hc-card .hc-lead{font-weight:700!important;margin:0!important}
html body main#main-content #sst-home-route .hc-card .hc-link{font-size:16px!important;font-weight:700!important;line-height:1.35!important;display:flex!important;justify-content:space-between!important;gap:12px!important;margin-top:auto!important;padding:12px 0 6px!important;border-bottom:1px solid #050505!important}
html body main#main-content #sst-home-route .hc-start{background:#707762!important}
html body main#main-content #sst-home-route .hc-start h3{font-size:clamp(26px,2.3vw,35px)!important}
html body main#main-content #sst-home-route .hc-start .hc-link{background:#050505!important;color:#E7E3DA!important;padding:14px 16px!important;border:0!important}
html body main#main-content #sst-home-route .hc-card:focus-visible{outline:3px solid #E7E3DA!important;outline-offset:5px!important}
html body main#main-content #sst-home-route .hc-card:hover .hc-link{text-decoration:underline!important}
@media(max-width:1150px){html body main#main-content #sst-home-route .hc-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}}
@media(max-width:600px){html body main#main-content #sst-home-route .hc-wrap{padding:32px 18px!important}html body main#main-content #sst-home-route .hc-grid{grid-template-columns:1fr!important;gap:16px!important}html body main#main-content #sst-home-route .hc-card{min-height:0!important;padding:18px!important}html body main#main-content #sst-home-route .hc-wrap h2#sst-home-route-title{font-size:27px!important;margin-bottom:24px!important}html body main#main-content #sst-home-route .hc-card h3{font-size:24px!important}html body main#main-content #sst-home-route .hc-start h3{font-size:32px!important}}
</style>`;

const candidate=baseline.replace(removed,'').replace(oldFooter,footer).replace(oldRoute,route).replace('</body>',footerCSS+routeCSS+'</body>');
const links=s=>[...s.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)].map(m=>[m[1],m[2]]);
assert.deepEqual(links(footer),links(oldFooter),'Preserve every footer link and label');
assert.equal(candidate.replace(footerCSS,'').replace(routeCSS,'').replace(route,oldRoute).replace(footer,oldFooter),baseline.replace(removed,''),'No changes outside approved blocks and footer');
assert(candidate.includes('<section class="matters">'));assert(candidate.includes('/assets/seo-20260923/logo-ce5904c700ef2787.webp'));
const sha=s=>createHash('sha256').update(s).digest('hex');
writeFileSync('preview/home-banner/generated/page.mjs','export const baseline='+JSON.stringify(baseline)+';export const candidate='+JSON.stringify(candidate)+';');
writeFileSync('home-banner-proof/baseline.html',baseline);writeFileSync('home-banner-proof/candidate.html',candidate);
writeFileSync('home-banner-proof/capture.json',JSON.stringify({capturedAt:new Date().toISOString(),source:'https://shiftsometimber.co.uk/',sourceCommit:process.env.GITHUB_SHA||null,baseline:sha(baseline),candidate:sha(candidate),footerLinksPreserved:true,unapprovedMarkupUnchanged:true},null,2));
console.log('PASS: exact outside-scope preservation; all footer links retained; real logo; Pick a path retained');
