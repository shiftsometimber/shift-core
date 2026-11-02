export const FRAME_SIGNATURE='function frameBody(){\n const body=document.body;';
export const FRAME_GUARD="function frameBody(){\n // aeo-cover-layout-20261102: keep the existing app padding; never wrap the signed-out cover twice.\n if(location.pathname.replace(/\\/+$/,'')==='/member/dashboard'&&document.body?.dataset.memberSession!=='ready'&&document.querySelector('#mtWelcome'))return;\n const body=document.body;";
export function repairCoverChrome(script){
 if(script.split(FRAME_SIGNATURE).length!==2)return script;
 return script.replace(FRAME_SIGNATURE,FRAME_GUARD);
}
