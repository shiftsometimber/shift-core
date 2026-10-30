// Project the unmodified saved product screenshot into the original photograph.
// No member session, account information or remote API is read.
export const screenQuad=[[1165,60],[1497,87],[1385,805],[1038,767]];
export function projectiveMatrix(points=screenQuad){
 const [tl,tr,br,bl]=points,w=430,h=920;
 const a=(tr[0]+br[0]-tl[0]-bl[0])/(2*w),b=(tr[1]+br[1]-tl[1]-bl[1])/(2*w),c=(bl[0]+br[0]-tl[0]-tr[0])/(2*h),d=(bl[1]+br[1]-tl[1]-tr[1])/(2*h);
 const e=points.reduce((n,p)=>n+p[0],0)/4-(a*w+c*h)/2,f=points.reduce((n,p)=>n+p[1],0)/4-(b*w+d*h)/2;
 return[a,b,c,d,e,f];
}
export const runtime='(()=>{const matrix='+JSON.stringify(projectiveMatrix())+';'+String.raw`
function boot(){
 const root=document.querySelector('main[data-programme-interface="programme-real-interface-20261030"]'),stage=root?.querySelector('[data-programme-screen]'),hero=root?.querySelector('.pv-hero'),mobile=root?.querySelector('.pv-photo-mobile'),screen=stage?.querySelector('.pv-real-screen');if(!stage||!hero||!mobile||!screen)return;
 screen.style.transform='matrix('+matrix.join(',')+')';
 const percent=(v,free)=>v.endsWith('%')?free*parseFloat(v)/100:parseFloat(v)||0;
 function draw(){
  const photo=mobile.querySelector(':scope > img'),isMobile=getComputedStyle(mobile).display!=='none',anchor=isMobile?mobile:hero,box=(isMobile?photo:hero).getBoundingClientRect(),style=getComputedStyle(isMobile?photo:hero);if(!box.width||!box.height)return;
  let scale,pos;
  if(isMobile){scale=Math.max(box.width/1774,box.height/887);pos=style.objectPosition;}
  else{const size=style.backgroundSize.split(',')[0].trim().split(/\s+/);if(size[0]==='cover')scale=Math.max(box.width/1774,box.height/887);else if(size[0]==='contain')scale=Math.min(box.width/1774,box.height/887);else if(size[0]==='auto'&&size[1]?.endsWith('%'))scale=box.height*parseFloat(size[1])/100/887;else if(size[0].endsWith('%')&&(size[1]==='auto'||size.length===1))scale=box.width*parseFloat(size[0])/100/1774;else return;pos=style.backgroundPosition.split(',')[0];}
  const positions=pos.trim().split(/\s+/),x=percent(positions[0],box.width-1774*scale),y=percent(positions[1]||'50%',box.height-887*scale);
  if(stage.parentElement!==anchor)anchor.append(stage);stage.style.transform='translate('+x+'px,'+y+'px) scale('+scale+')';stage.dataset.positioned='true';
 }
 const observer=new ResizeObserver(draw);observer.observe(hero);observer.observe(mobile);mobile.querySelector('img')?.addEventListener('load',draw,{once:true});window.addEventListener('resize',draw,{passive:true});draw();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();})();`;
