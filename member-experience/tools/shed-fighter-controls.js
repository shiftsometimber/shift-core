// A pointer belongs to the pad, not the first button it touches. Hit testing on
// every move lets one held finger slide between controls without lifting.
// Owners keep a second finger or keyboard key from being released by another.
const fightOwners=new Map(),fightPointers=new Set(),fightPad=$('pad');
function press(k,on){if(on)audio();if(on){if(!IN[k])PR[k]=true;IN[k]=true;}else IN[k]=false;const b=fightPad.querySelector('button.k[data-k="'+k+'"]');if(b)b.classList.toggle('on',!!on);}
function holdControl(owner,key){
 const previous=fightOwners.get(owner);if(previous===key)return;
 fightOwners.delete(owner);
 if(previous&&![...fightOwners.values()].includes(previous))press(previous,false);
 if(key){fightOwners.set(owner,key);press(key,true);}
}
function clearControls(){fightPointers.clear();fightOwners.clear();for(const k in IN)press(k,false);clearPR();}
function hitControl(e){const b=document.elementFromPoint(e.clientX,e.clientY)?.closest('button.k');return b&&fightPad.contains(b)?b.dataset.k:null;}
fightPad.addEventListener('pointerdown',e=>{const key=hitControl(e);if(!key||e.button>0)return;e.preventDefault();fightPointers.add(e.pointerId);holdControl('pointer:'+e.pointerId,key);try{fightPad.setPointerCapture(e.pointerId);}catch(_){}});
fightPad.addEventListener('pointermove',e=>{if(!fightPointers.has(e.pointerId))return;e.preventDefault();holdControl('pointer:'+e.pointerId,hitControl(e));});
function releasePointer(e){if(!fightPointers.delete(e.pointerId))return;holdControl('pointer:'+e.pointerId,null);}
for(const type of ['pointerup','pointercancel','lostpointercapture'])fightPad.addEventListener(type,releasePointer);
fightPad.addEventListener('contextmenu',e=>e.preventDefault());
window.addEventListener('keydown',e=>{const k=KEYS[e.code];if(!k||S.state==='over')return;e.preventDefault();if(!e.repeat)holdControl('key:'+e.code,k);});
window.addEventListener('keyup',e=>{if(KEYS[e.code])holdControl('key:'+e.code,null);});
window.addEventListener('blur',clearControls);
