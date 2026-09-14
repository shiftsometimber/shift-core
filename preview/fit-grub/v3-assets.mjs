import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const root='preview/fit-grub/v3';
export function approvedFitPack(){
 const pack=JSON.parse(fs.readFileSync(root+'/approval.json'));
 assert.equal(pack.records.length,300);
 assert.equal(new Set(pack.records.map(r=>r.id)).size,300);
 assert.equal(pack.records.filter(r=>r.status==='approved').length,255);
 assert.equal(pack.records.filter(r=>r.status==='held').length,45);
 assert.equal(pack.records.reduce((n,r)=>n+r.variants.length,0),2688);
 for(const r of pack.records){
  assert.match(r.id,/^[a-z0-9-]+$/);
  if(r.status==='held'){assert.equal(r.image,null);assert.ok(r.reason);continue;}
  assert.equal(r.image,`/fit-v3-images/${r.id}.png`);
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync(`${root}/images/${r.id}.png`)).digest('hex'),r.sha256,`Approval bytes changed: ${r.id}`);
 }
 return pack;
}
export function bindApprovedFit(records,pack=approvedFitPack()){
 const images=new Map(pack.records.map(r=>[r.id,r]));
 return records.map(r=>{
  if(r.kind!=='movement')return r;
  const m=images.get(r.id);assert.ok(m,`Missing v3 movement: ${r.id}`);
  if(m.status!=='approved')return {...r,image:undefined,status:'held'};
  return {...r,status:'approved-visual',image:{url:m.image,alt:`${r.title} — three-panel movement illustration`,note:'Visual approved by Matt. Base movement illustration; use the original written instructions for your selected variant.',scope:'canonical-example',productionApproved:false,sourceHash:r.sourceHash,imageHash:m.sha256}};
 });
}
export function fitV3Assets(){
 const pack=approvedFitPack(),outDir='preview/fit-grub/public/fit-v3-images';
 fs.rmSync(outDir,{recursive:true,force:true});fs.mkdirSync(outDir,{recursive:true});
 for(const r of pack.records.filter(r=>r.status==='approved'))fs.copyFileSync(`${root}/images/${r.id}.png`,`${outDir}/${r.id}.png`);
 const html=`<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>SHIFT Fit · Approved visual catalogue</title><link rel="stylesheet" href="/catalogue.css"><style>
 .fit-written{max-width:820px;margin:24px auto}.fit-written h3{margin:24px 0 6px}.fit-written p{white-space:pre-line;line-height:1.6}.fit-written select{max-width:100%;width:100%;background:#050505;color:#e7e3da;padding:12px;border:1px solid #707762;font:inherit}.fit-written a{color:#e7e3da}.fit-dose{font-weight:bold}.fit-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:24px}.fit-card{min-width:0;border:1px solid #707762;border-radius:16px;overflow:hidden}.fit-card img{display:block;width:100%;height:auto}.fit-card .copy{padding:20px}.fit-card h2{font-size:24px;margin:0 0 12px}.fit-card button{background:#e7e3da;color:#050505;border:0;border-radius:30px;padding:12px 20px;font:inherit;cursor:pointer}.fit-card.held{padding:22px}.fit-card.held p{margin-bottom:0}.fit-meta{display:flex;gap:12px;flex-wrap:wrap;margin:24px 0}.fit-meta span{border:1px solid #707762;border-radius:30px;padding:8px 16px}.fit-filters{display:grid;grid-template-columns:2fr 1fr;gap:20px;margin-bottom:20px}.fit-filters label{display:grid;gap:8px}.fit-filters input,.fit-filters select{box-sizing:border-box;width:100%;min-width:0;background:#050505;color:#e7e3da;border:1px solid #707762;border-radius:10px;padding:12px;font:inherit}#fit-count{margin:16px 0}#fit-dialog{width:min(1180px,94vw);max-width:94vw;max-height:92vh;padding:24px;box-sizing:border-box;background:#050505;color:#e7e3da;border:1px solid #707762;border-radius:16px}#fit-dialog::backdrop{background:rgb(5 5 5 / .85)}#fit-close{float:right;position:sticky;top:0;background:#e7e3da;color:#050505;border:0;border-radius:30px;padding:10px 20px;font:inherit;cursor:pointer}.fit-large{width:100%;height:auto;display:block;margin:20px 0}.fit-panels{display:none}.fit-panel{position:relative;overflow:hidden;aspect-ratio:1280/2160}.fit-panel img{position:absolute;top:0;width:300%;height:100%;max-width:none}.fit-pager{display:flex;align-items:center;justify-content:center;gap:20px;margin-top:30px}.fit-pager button{background:#e7e3da;color:#050505;border-radius:30px;padding:12px 20px;font:inherit}.fit-pager button:disabled{opacity:.45}button:focus-visible,a:focus-visible,input:focus-visible,select:focus-visible{outline:3px solid #e7e3da;outline-offset:4px}[hidden]{display:none!important}@media(max-width:650px){.fit-grid,.fit-filters{grid-template-columns:1fr}.fit-large{display:none}.fit-panels{display:grid;gap:16px;margin-top:20px}.fit-panels figure{margin:0}.fit-panels figcaption{padding:8px 0}#fit-dialog{padding:16px}.fit-pager{gap:10px}.fit-pager button{padding:10px 14px}}
 </style></head><body><header><a class="brand" href="/member/fit">SHIFT <span>FIT</span></a><nav aria-label="Preview navigation"><a href="/member/fit">Fit programme</a><a href="/catalogue">Fit & Grub catalogue</a></nav><p class="preview">PREVIEW ONLY · Live website unchanged</p></header><main><p class="eyebrow">Made for ordinary blokes.</p><h1>Movement you can see.</h1><p>Explore all 300 movement guides, with setup, technique cues, common mistakes and exact source protocols. Open a guide to see the images and instructions together.</p><div class="fit-meta"><span>255 approved images</span><span>45 held for correction</span><span>300 movements · 2,688 mapped variants</span></div><div class="fit-filters"><label>Find a movement<input type="search" id="fit-search" placeholder="Try walking, squat or curl"></label><label>Show<select id="fit-status"><option value="approved">Approved images</option><option value="held">Held for correction</option><option value="all">All movements</option></select></label></div><p id="fit-count" role="status"></p><section id="fit-cards" class="fit-grid" aria-label="Movement images"></section><div class="fit-pager"><button id="fit-prev" type="button">Previous</button><span id="fit-page"></span><button id="fit-next" type="button">Next</button></div><p class="footnote">Visual approval is recorded for the exact images supplied. Written guidance and review status are preserved from the source workbook. Draft protocols require technique and suitability review before member release.</p></main><dialog id="fit-dialog" aria-labelledby="fit-title"><button id="fit-close" type="button">Close</button><div id="fit-detail"></div></dialog><script id="fit-data" type="application/json">${JSON.stringify(pack.records).replaceAll('<','\\u003c')}</script><script src="/fit-v3.js"></script></body></html>`;
 return {'/fit-v3':{type:'text/html',body:html},'/fit-v3.js':{type:'text/javascript',body:fs.readFileSync('preview/fit-grub/v3-client.js','utf8')},'/fit-v3-approval.json':{type:'application/json',body:JSON.stringify(pack)}};
}
