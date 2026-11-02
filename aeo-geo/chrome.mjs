export const FRAME_SIGNATURE='function frameBody(){\n const body=document.body;';
export const FRAME_GUARD="function frameBody(){\n // aeo-cover-layout-20261102: keep the existing app padding; never wrap the signed-out cover twice.\n if(location.pathname.replace(/\\/+$/,'')==='/member/dashboard'&&document.body?.dataset.memberSession!=='ready'&&document.querySelector('#mtWelcome'))return;\n const body=document.body;";
export function repairCoverChrome(script){
 if(script.split(FRAME_SIGNATURE).length!==2)return script;
 return script.replace(FRAME_SIGNATURE,FRAME_GUARD);
}
export function repairPublicChrome(script){
 let result=repairCoverChrome(script);
 const shellStart="/* Shared homepage shell. No API, account or communications operations. */\n;(()=>{'use strict';\n";
 // The member app already supplies its own header and navigation. Running
 // this public shell there inserts and moves a second header after paint.
 if(result.includes(shellStart)&&!result.includes('aeo-member-public-shell-20261102'))result=result.replace(shellStart,shellStart+"// aeo-member-public-shell-20261102: keep the member app's own chrome.\nif(location.pathname.replace(/\\/+$/,'')==='/member/dashboard'&&document.querySelector('#mtWelcome'))return;\n");
 const start=result.indexOf('const master='),end=start<0?-1:result.indexOf(',css=',start);
 if(start>=0&&end>start){
  try{
   const raw=result.slice(start+'const master='.length,end),master=JSON.parse(raw);
   if(typeof master.footer==='string'&&!master.footer.includes('href="/recipes"')){
    master.footer=master.footer.replace('<h2>Explore</h2>','<h2>Explore</h2><a href="/recipes">Recipes</a><a href="/exercises">Exercises</a>');
    result=result.slice(0,start+'const master='.length)+JSON.stringify(master)+result.slice(end);
   }
  }catch{/* An unrelated shell format retains its original source. */}
 }
 return result;
}
