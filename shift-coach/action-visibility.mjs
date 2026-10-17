// Browser-side readiness includes both real choices and rejects covered controls.
export function installActionReadiness(){
 const geometry=()=>['accept','decline'].map(action=>{
  const button=document.querySelector('#shiftCoach [data-coach-action='+action+']');
  if(!button)return {action,present:false,onScreen:false};
  const r=button.getBoundingClientRect(),inside=r.width>0&&r.height>0&&r.left>=0&&r.top>=0&&r.right<=innerWidth&&r.bottom<=innerHeight;
  const inset=Math.min(8,r.width/4,r.height/4),points=[[r.left+r.width/2,r.top+r.height/2],[r.left+inset,r.top+inset],[r.right-inset,r.top+inset],[r.left+inset,r.bottom-inset],[r.right-inset,r.bottom-inset]];
  const uncovered=inside&&points.every(([x,y])=>{const hit=document.elementFromPoint(x,y);return hit===button||button.contains(hit)});
  return {action,present:true,enabled:!button.disabled,cssVisible:button.checkVisibility({checkVisibilityCSS:true}),rect:{x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom,right:r.right},inside,uncovered,onScreen:!button.disabled&&button.checkVisibility({checkVisibilityCSS:true})&&inside&&uncovered};
 });
 window.__shiftCoachActionGeometry=geometry;
 window.__shiftCoachActionOnScreen=()=>geometry().every(button=>button.onScreen);
 const tick=()=>{if(performance.getEntriesByName('shift-coach-ready').length&&window.__shiftCoachActionOnScreen()){window.__shiftCoachVisibleReady=performance.now();return}requestAnimationFrame(tick)};
 requestAnimationFrame(tick);
}
