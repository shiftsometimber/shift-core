// Project the unmodified saved product screenshot into the original photograph.
// No member session, account information or remote API is read.
export const screenQuad=[[1165,60],[1497,87],[1385,805],[1038,767]];
export function projectiveMatrix(points=screenQuad){
 const source=[[0,0],[430,0],[430,920],[0,920]],rows=[];
 for(let i=0;i<4;i++){const [x,y]=source[i],[u,v]=points[i];rows.push([x,y,1,0,0,0,-u*x,-u*y,u],[0,0,0,x,y,1,-v*x,-v*y,v]);}
 for(let col=0;col<8;col++){let pivot=col;for(let r=col+1;r<8;r++)if(Math.abs(rows[r][col])>Math.abs(rows[pivot][col]))pivot=r;[rows[col],rows[pivot]]=[rows[pivot],rows[col]];const k=rows[col][col];if(Math.abs(k)<1e-12)throw new Error('Invalid screen geometry');for(let c=col;c<=8;c++)rows[col][c]/=k;for(let r=0;r<8;r++)if(r!==col){const m=rows[r][col];for(let c=col;c<=8;c++)rows[r][c]-=m*rows[col][c];}}
 const [a,c,e,b,d,f,g,h]=rows.map(r=>r[8]);return[a,b,0,g,c,d,0,h,0,0,1,0,e,f,0,1];
}
export const runtime='(()=>{const matrix='+JSON.stringify(projectiveMatrix())+';'+String.raw`
function boot(){
 const root=document.querySelector('main[data-programme-interface="programme-real-interface-20261030"]'),stage=root?.querySelector('[data-programme-screen]'),hero=root?.querySelector('.pv-hero'),mobile=root?.querySelector('.pv-photo-mobile'),screen=stage?.querySelector('.pv-real-screen');if(!stage||!hero||!mobile||!screen)return;
 screen.style.transform='matrix3d('+matrix.join(',')+')';
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
