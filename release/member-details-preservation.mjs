import {addTimberShedTeaser} from '../timber-shed-public-teaser.mjs';
import {restoreHomeFont} from '../shift-coach/public-font-delivery.mjs';
import {removeCatalogueBenefits} from '../catalogue-benefits.mjs';
import {removeCreamNavigation} from '../cream-navigation.mjs';
// Reverse only the two exact owner-approved startup transforms for the existing
// full-page preservation gate. Any other byte or route change still fails.
import {removeHomeBanner} from '../home-route-banner.mjs';
import assert from 'node:assert/strict';
import {HOME_BLOCKING_STYLES} from '../home-blocking-styles.mjs';
import {stabilisePublicHtml,programmeBridge,loginReservationStyles} from '../public-startup-stability.mjs';
// This exact already-approved responsive title rule is a CSS selector, not a
// second banner. Retain it in every returned byte and full-page comparison;
// hide only that exact literal from the older substring duplicate detector.
const reviewedHomeTitleRule='html body #main-content.template-home #sst-home-route-title{font-size:clamp(24.3px,2.88vw,46.8px)!important}';
const reviewedHomeTitleMarker='/*SHIFT_REVIEWED_HOME_TITLE_RULE_20261025*/';
export function removeReviewedHomeBanner(html,options){
 assert(!html.includes(reviewedHomeTitleMarker),'Unexpected homepage preservation marker');
 const count=html.split(reviewedHomeTitleRule).length-1;assert(count<=1,'Duplicate reviewed homepage title rule');
 if(!count)return removeHomeBanner(html,options);
 const result=removeHomeBanner(html.replace(reviewedHomeTitleRule,reviewedHomeTitleMarker),options);
 assert.equal(result.split(reviewedHomeTitleMarker).length,2,'Reviewed homepage title rule must survive banner removal');
 return result.replace(reviewedHomeTitleMarker,reviewedHomeTitleRule);
}
const status='<section id="memberSessionStatus" aria-label="Account access"><p role="status">Checking your sign-in…</p></section><script src="/assets/member-experience/session.mjs"></script>';
export function preserveApprovedStartup(path,body){
 // Reverse the exact already-live catalogue copy before the older banner.
 // The banner's strict signatures and the full-page comparison still reject drift.
 const original=removeCreamNavigation(restoreHomeFont(path,removeCatalogueBenefits(body.toString('utf8'),path)));const text=path==='/'?removeReviewedHomeBanner(original):original;body=Buffer.from(text);let before=text;
 const once=(a,b='')=>{assert.equal(before.split(a).length,2,'Unexpected startup preservation signature: '+path);before=before.replace(a,b);};
 if(path==='/'&&text.includes('data-home-inline-css="/assets/my-timber-pwa.css"')){
  const css=HOME_BLOCKING_STYLES['/assets/my-timber-pwa.css'].replace(/\/\*[\s\S]*?\*\//g,c=>c.replaceAll('<','&lt;'));
  once('<style data-home-inline-css="/assets/my-timber-pwa.css">'+css+'</style>','<link rel="stylesheet" href="/assets/my-timber-pwa.css">');
 }else if(path==='/programme'&&text.includes('data-programme-layout="stable-v1"')){
  once(programmeBridge);once('<link data-programme-layout="stable-v1" rel="stylesheet" href="/assets/shift-service-bridge-v1.css?v=2">');
 }else if(path==='/member-login'&&text.includes('data-login-layout="stable-v1"')){
  once(' data-login-layout="stable-v1"');once('<style data-login-reservation>'+loginReservationStyles+'</style>');
  once('<main class="preview-wrap">'+status,'<main class="preview-wrap">');
  const match=before.match(/<body\b[^>]*>/);assert(match,'Missing original body');
  once(match[0],match[0]+status);
 }else return body;
 let replay=path==='/'?removeReviewedHomeBanner(removeCreamNavigation(stabilisePublicHtml(path,before))):removeCreamNavigation(stabilisePublicHtml(path,before));
 // The separately approved public teaser is applied after startup stability.
 // Retain the exact stylesheet and every surrounding byte; reconstruct only
 // that known transform order rather than requiring startup CSS to be last.
 if(path==='/member-login'){
  const fixture='<html><head></head><body><nav class="desktop-nav"></nav><aside id="site-drawer"><nav></nav></aside><footer class="site-footer"><h2>Support</h2><a href="/member/dashboard">My Timber</a></footer></body></html>';
  const teaser=addTimberShedTeaser(fixture,path).match(/<style id="sst-timber-shed-teaser-css">[\s\S]*?<\/style>/)?.[0],reservation='<style data-login-reservation>'+loginReservationStyles+'</style>';
  if(teaser&&text.includes(reservation+teaser)){
   assert.equal(replay.split(teaser).length,2);assert.equal(replay.split(reservation).length,2);
   replay=replay.replace(reservation,'').replace(teaser,reservation+teaser);
  }
 }
 assert.equal(replay,text,'Unknown startup transformation: '+path);
 return Buffer.from(before);
}
