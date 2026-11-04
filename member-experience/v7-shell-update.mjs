// Updates are explicit and preserve the running screen. Never reload an active
// form, basket or game, clear a private snapshot, or create another worker.
export function shellUpdates(s){
 const current='__V7_NATIVE_ASSET_TAG__',sw=navigator.serviceWorker;
 let registration=null,pending=null,lastCheck=Date.now();
 const canShow=()=>s.ready()&&s.main.dataset.mtContent!=='shop'&&!s.main.querySelector('form,canvas.game')&&!document.querySelector('dialog[open],[aria-modal=true]');
 function show(){
  if(!pending||!canShow()||document.getElementById('mtShellUpdate'))return;
  const note=document.createElement('p');note.id='mtShellUpdate';note.className='mt-native-update';note.setAttribute('role','status');
  const label=document.createElement('span');label.textContent='My Timber has been updated. ';
  const link=document.createElement('a'),url=new URL(location.href);url.searchParams.set('mt-rollback','1');
  link.href=url.href;link.textContent='Open latest version';link.dataset.mtReload='';
  link.addEventListener('click',e=>{e.preventDefault();if(!s.ready())return;s.persist();location.replace(link.href);});
  note.append(label,link);s.main.prepend(note);
 }
 function notice(version){if(typeof version!=='string'||!version||version===current)return;pending=version;show();}
 async function check(force=false){if(!sw||document.hidden||!navigator.onLine||(!force&&Date.now()-lastCheck<90000))return;lastCheck=Date.now();try{registration||=await sw.getRegistration('/member/');await registration?.update();}catch{}}
 function server(version){if(version&&version!==current){notice(version);check(true);}}
 function start(){
  if(!sw)return;
  sw.addEventListener('message',e=>{if(e.data?.type==='MT_SHELL_UPDATED')notice(e.data.version);});
  sw.addEventListener('controllerchange',()=>{sw.controller?.postMessage({type:'MT_SHELL_VERSION'});});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden){check();show();}});
  document.addEventListener('mt:screen-activated',show);
  sw.register('/treatment-sw.js',{scope:'/member/',updateViaCache:'none'}).then(r=>{registration=r;}).catch(()=>{});
 }
 return {start,server,check};
}
