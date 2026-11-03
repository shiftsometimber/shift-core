import{createHash}from'node:crypto';
import{performanceRuntime}from'./performance-client.mjs';
import{performanceMonitorRuntime}from'./performance-monitor.mjs';
const hash=s=>createHash('sha256').update(s).digest('hex');
export function optimiseV7Contrast(html){
 const before="function scan(){for(const el of document.querySelectorAll('body *'))fix(el)}\n  let queued=false;function queue(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;scan()})}";
 const after="const dirty=new Set();\n  function scan(root=document.body){if(!root)return;fix(root);for(const el of root.querySelectorAll('*'))fix(el)}\n  let queued=false;function queue(records){for(const r of records||[]){if(r.target.closest?.('style')||[...r.addedNodes||[]].some(n=>n.nodeType===1&&['STYLE','LINK'].includes(n.tagName)))dirty.add(document.body);else if(r.type==='attributes')dirty.add(r.target);else for(const n of r.addedNodes||[])if(n.nodeType===1)dirty.add(n);}if(queued||!dirty.size)return;queued=true;requestAnimationFrame(()=>{queued=false;const roots=[...dirty].filter(Boolean);dirty.clear();for(const root of roots)if(root.isConnected&&!roots.some(other=>other!==root&&other.contains(root)))scan(root)})}";
 return html.includes(before)?html.replace(before,after):html;
}
export function rewriteV7Document(input,assets,{owner='programme',logoPath='/assets/header-logo-20261103-v7.svg'}={}){
 let html=input;const styles=[],matches=[...html.matchAll(/<style\b([^>]*)>([\s\S]*?)<\/style>/gi)].filter(m=>/data-app-preview-style|data-approved-member-design/.test(m[1]));
 if(matches.length){
  // Preserve both style markers and the original CSS order. These two blocks
  // are adjacent in the serving documents; fail if a later source changes that contract.
  const between=html.slice(matches[0].index+matches[0][0].length,matches.at(-1).index);
  if(matches.length>1&&between.trim())throw Error('Approved stylesheet blocks are no longer adjacent.');
  const css=matches.map(m=>m[2]).join('\n'),sha256=hash(css),path='/assets/member-experience/v7-screen-'+sha256.slice(0,20)+'.css';
  if(/url\(\s*['"]?(?!data:|https?:|\/|#)[a-zA-Z]/i.test(css))throw Error('Relative CSS asset requires an explicit source-path rewrite.');
  assets[path]={body:css,type:'text/css; charset=utf-8',sha256,owner:'programme',variants:[path],rewrite:true};
  let first=true;html=html.replace(/<style\b([^>]*)>([\s\S]*?)<\/style>/gi,(whole,attrs)=>/data-app-preview-style|data-approved-member-design/.test(attrs)?(first?(first=false,'<link rel="stylesheet" href="'+path+'?mtv='+sha256.slice(0,20)+'">'):'')+'<style'+attrs+'></style>':whole);
  styles.push({path,sha256,bytes:Buffer.byteLength(css),sourceBlocks:matches.length});
 }
 html=optimiseV7Contrast(html);
 let performanceBoots=0;
 html=html.replace(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi,(whole,attrs,code)=>{
  if(!attrs.includes('src=')&&code.includes('MT_MEMBER_IDENTITY')&&code.includes('MT_PERFORMANCE')){performanceBoots++;return '<script'+attrs+'>'+performanceRuntime+performanceMonitorRuntime+'</script>';}
  return whole;
 });
 if(performanceBoots>1)throw Error('Duplicate identity/performance bootstrap.');
 html=html.replaceAll('/assets/header-logo-20261020-v2.svg',logoPath);
 // The complete document is now available, including assets appended by retained wrappers.
 html=html.replace(/<(?:script|link)\b[^>]*(?:src|href)=["']([^"']+)["'][^>]*>/gi,(tag,href)=>{
  const raw=href.replaceAll('&amp;','&'),u=new URL(raw,'https://shiftsometimber.co.uk'),a=assets[u.pathname];
  if(!a||a.rewrite===false||!['shiftsometimber.co.uk'].includes(u.hostname))return tag;
  u.searchParams.set('mtv',a.sha256.slice(0,20));return tag.replace(href,(u.pathname+u.search+u.hash).replaceAll('&','&amp;'));
 });
 return {html,styles,performanceBoots};
}
