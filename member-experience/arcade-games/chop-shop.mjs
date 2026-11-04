const HTML="<div class=\"app\">\n<div class=\"tbar\"><div class=\"tl\"><canvas id=\"title\"></canvas></div></div>\n<div class=\"hook\">Tap when the marker's in the sweet spot. Chain perfect chops for a bigger combo. 30 seconds a round.</div>\n<div class=\"hud mono\"><span class=\"chip\" id=\"hl\">TIMBER 0</span><span class=\"chip o\" id=\"hc\">COMBO x1</span><span class=\"chip g\" id=\"ht\">0:30</span></div>\n<div class=\"gwrap\" id=\"gwrap\"><canvas class=\"game\" id=\"game\" width=\"144\" height=\"164\" aria-label=\"Chop Shop game area\" tabindex=\"0\" role=\"application\"></canvas>\n <div class=\"ov\" id=\"ov\"><div class=\"panel\"><h2 class=\"mono\" id=\"ph\">Time!</h2><div class=\"pbig mono\" id=\"pbig\">0 CHOPPED</div><p id=\"pp\"></p><p id=\"pp2\" style=\"font-size:11.5px;color:#9AA08A\"></p>\n <div class=\"row\"><button class=\"p\" id=\"pa\">ONE MORE GO</button><button class=\"s\" id=\"pi\">INVITE A MATE</button></div></div></div></div>\n<div class=\"bot\"><div class=\"cards\"><div class=\"card\"><div class=\"k\">Personal best</div><div class=\"v mono\" id=\"best\">Your best: 0 chopped</div><div style=\"font-size:10.5px;color:#9AA08A;margin-top:1px\" id=\"bestsub\"></div></div>\n<div hidden=\"\" aria-hidden=\"true\"><span id=\"shed\"></span><span id=\"mine\"></span></div></div>\n<div class=\"btns\"><button class=\"p\" id=\"again\">ONE MORE GO</button><button class=\"s\" id=\"invite\">INVITE A MATE</button><button class=\"t\" id=\"mute\">SOUND ON</button></div></div>\n</div><div id=\"toast\"></div>\n";
const CSS="#mtNativeMain .mt-arcade-game *{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}#mtNativeMain .mt-arcade-game,#mtNativeMain .mt-arcade-game{height:100%;background:#050505;color:#E7E3DA;font-family:-apple-system,BlinkMacSystemFont,\"Segoe UI\",Roboto,Inter,Arial,sans-serif;overscroll-behavior:none}#mtNativeMain .mt-arcade-game{display:flex;justify-content:center}#mtNativeMain .mt-arcade-game .app{width:100%;max-width:460px;height:100vh;height:100dvh;display:flex;flex-direction:column;padding:0 10px env(safe-area-inset-bottom);user-select:none;-webkit-user-select:none}#mtNativeMain .mt-arcade-game .hdr{flex:0 0 auto;height:46px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #1d1f1a;padding:0 4px}#mtNativeMain .mt-arcade-game .hdr a{color:#9AA08A;text-decoration:none;font-size:14px;width:100px}#mtNativeMain .mt-arcade-game .wm{font-weight:900;font-size:18px;letter-spacing:1.5px;font-family:\"Arial Black\",\"Archivo Black\",Impact,sans-serif}#mtNativeMain .mt-arcade-game .wm i{font-style:normal;color:#707762}#mtNativeMain .mt-arcade-game .badge{width:100px;text-align:right}#mtNativeMain .mt-arcade-game .badge b{display:inline-block;border:1px solid #707762;border-radius:10px;padding:3px 7px;font-size:9.5px;letter-spacing:.5px;white-space:nowrap}#mtNativeMain .mt-arcade-game .tbar{flex:0 0 auto;display:flex;align-items:center;justify-content:space-between;padding:8px 2px 4px;gap:8px}#mtNativeMain .mt-arcade-game .tl{display:flex;flex-direction:column;gap:4px;min-width:0}#mtNativeMain .mt-arcade-game .pill{align-self:flex-start;white-space:nowrap;font-size:10px;font-weight:700;letter-spacing:.4px;color:#050505;background:#E7E3DA;border-radius:4px;padding:2px 6px}#mtNativeMain .mt-arcade-game .hook{font-size:12px;color:#b9b7ae;padding:0 2px 6px}#mtNativeMain .mt-arcade-game .mono{font-family:ui-monospace,\"SF Mono\",Menlo,Consolas,\"Courier New\",monospace;font-weight:800;letter-spacing:.5px}#mtNativeMain .mt-arcade-game .hud{flex:0 0 auto;display:flex;gap:6px;justify-content:space-between;padding-bottom:6px}#mtNativeMain .mt-arcade-game .chip{font-size:11px;background:#0d0f0b;border:2px solid #E7E3DA;border-radius:3px;padding:4px 7px;white-space:nowrap}#mtNativeMain .mt-arcade-game .chip.o{border-color:#707762;color:#E7E3DA}#mtNativeMain .mt-arcade-game .chip.g{border-color:#707762}#mtNativeMain .mt-arcade-game .gwrap{flex:1 1 auto;min-height:150px;position:relative;display:flex;align-items:flex-start;justify-content:center;padding-top:4px}#mtNativeMain .mt-arcade-game canvas.game{display:block;image-rendering:pixelated;image-rendering:crisp-edges;touch-action:none;border:3px solid #E7E3DA;border-radius:6px;box-shadow:0 0 0 3px #050505,0 0 0 5px #707762;background:#0d0f0b;cursor:crosshair}#mtNativeMain .mt-arcade-game .ov{position:absolute;inset:0;display:none;align-items:center;justify-content:center;pointer-events:none}#mtNativeMain .mt-arcade-game .ov.on{display:flex}#mtNativeMain .mt-arcade-game .panel{pointer-events:auto;background:rgba(5,5,5,.92);border:3px solid #E7E3DA;border-radius:8px;padding:16px 18px;text-align:center;max-width:290px;box-shadow:0 0 0 3px #707762}#mtNativeMain .mt-arcade-game .panel h2{font-size:18px;color:#E7E3DA;margin-bottom:6px}#mtNativeMain .mt-arcade-game .panel p{font-size:13px;color:#cfccc3;margin:4px 0}#mtNativeMain .mt-arcade-game .panel .stars{font-size:28px;letter-spacing:4px;margin:4px 0}#mtNativeMain .mt-arcade-game .panel .row{display:flex;gap:8px;margin-top:12px}#mtNativeMain .mt-arcade-game .bot{flex:0 0 auto;padding:8px 0 10px}#mtNativeMain .mt-arcade-game .cards{display:flex;gap:8px}#mtNativeMain .mt-arcade-game .card{flex:1;background:#12140f;border:1px solid #2c3027;border-radius:10px;padding:7px 10px;min-width:0}#mtNativeMain .mt-arcade-game .card .k{font-size:9.5px;letter-spacing:.6px;text-transform:uppercase;color:#9AA08A;font-weight:700}#mtNativeMain .mt-arcade-game .card .v{font-size:13px;margin-top:3px;line-height:16px}#mtNativeMain .mt-arcade-game .card.sh{background:#707762;color:#050505;border-color:#707762}#mtNativeMain .mt-arcade-game .card.sh .k{color:#050505}#mtNativeMain .mt-arcade-game .ex{font-size:8.5px;background:#050505;color:#E7E3DA;border-radius:3px;padding:1px 4px;margin-left:4px;letter-spacing:.4px;vertical-align:1px}#mtNativeMain .mt-arcade-game .btns{display:flex;gap:8px;margin-top:8px}#mtNativeMain .mt-arcade-game button{font:inherit;cursor:pointer;border:0;border-radius:8px;height:44px;flex:1;font-family:ui-monospace,\"SF Mono\",Menlo,Consolas,monospace;font-weight:800;font-size:12.5px;letter-spacing:.5px}#mtNativeMain .mt-arcade-game button.p{background:#707762;color:#050505;box-shadow:0 4px 0 #414733}#mtNativeMain .mt-arcade-game button.p:active{transform:translateY(2px);box-shadow:0 2px 0 #414733}#mtNativeMain .mt-arcade-game button.s{background:transparent;border:2px solid #E7E3DA;color:#E7E3DA}#mtNativeMain .mt-arcade-game button.t{flex:0 0 auto;padding:0 10px;background:transparent;border:2px solid #707762;color:#9AA08A;font-size:10.5px}#mtNativeMain .mt-arcade-game button:disabled{opacity:.35;cursor:default}#mtNativeMain .mt-arcade-game #toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%) translateY(20px);opacity:0;background:#E7E3DA;color:#050505;font-weight:700;font-size:13px;padding:9px 14px;border-radius:8px;transition:.2s;pointer-events:none;z-index:9}#mtNativeMain .mt-arcade-game #toast.on{opacity:1;transform:translateX(-50%)}@media (max-height:700px){#mtNativeMain .mt-arcade-game .hook{display:none}#mtNativeMain .mt-arcade-game .card .v{font-size:13px}#mtNativeMain .mt-arcade-game button{height:40px}}#mtNativeMain .mt-arcade-game .pbig{font-size:26px;margin:4px 0 6px;color:#E7E3DA}\n.mt-arcade-game .app{height:calc(100dvh - 240px)!important;min-height:440px;padding:0 3px!important;display:flex;flex-direction:column}.mt-arcade-game button{min-height:44px!important}.mt-arcade-game .sh{display:none!important}.mt-arcade-game .gwrap{min-height:150px}.mt-arcade-game #toast{z-index:1200}.mt-arcade-game :focus-visible{outline:3px solid #E7E3DA;outline-offset:3px}";

export function mount(root,bridge){
 let dead=false,paused=false;const listeners=[],frames=new Set(),timers=new Set(),properties=new Map();
 const realWindow=globalThis.window,realDocument=globalThis.document;
 const document=new Proxy(realDocument,{get(target,key){if(key==='getElementById')return id=>root.querySelector('[id="'+id+'"]');if(key==='querySelector')return q=>root.querySelector(q);const v=Reflect.get(target,key,target);return typeof v==='function'?v.bind(target):v;}});
 const window=new Proxy(realWindow,{get(target,key){if(key==='addEventListener')return (type,fn,options)=>{listeners.push([type,fn,options]);const guarded=e=>{if((type==='keydown'||type==='keyup')&&(paused||e.target?.matches?.('input,textarea,button,a')))return;fn(e)};listeners[listeners.length-1][1]=guarded;target.addEventListener(type,guarded,options)};const v=Reflect.get(target,key,target);return typeof v==='function'&&!/^[A-Z]/.test(String(key))?v.bind(target):v;},set(target,key,value){if(!properties.has(key))properties.set(key,{existed:Object.hasOwn(target,key),value:target[key]});target[key]=value;return true;}});
 const requestAnimationFrame=callback=>{let id;const tick=t=>{frames.delete(id);if(dead)return;if(paused){id=realWindow.requestAnimationFrame(tick);frames.add(id);}else callback(t);};id=realWindow.requestAnimationFrame(tick);frames.add(id);return id;};
 const setTimeout=(callback,ms,...args)=>{const id=realWindow.setTimeout(()=>{timers.delete(id);if(!dead)callback(...args);},ms);timers.add(id);return id;};
 const clearTimeout=id=>{timers.delete(id);realWindow.clearTimeout(id);};
 root.innerHTML=HTML;const style=realDocument.createElement('style');style.textContent=CSS;root.prepend(style);
 const pauseButton=bridge.pauseButton;
 function pause(value){paused=value;if(typeof AC!=='undefined'&&AC){if(paused)AC.suspend();else if(!muted)AC.resume();}pauseButton.textContent=paused?'Resume':'Pause';pauseButton.setAttribute('aria-pressed',String(paused));}
 pauseButton.onclick=()=>pause(!paused);
 const visibility=()=>{if(realDocument.hidden)pause(true);};realDocument.addEventListener('visibilitychange',visibility);
 const inputGuard=e=>{if(paused){e.preventDefault();e.stopImmediatePropagation();}};for(const type of ['pointerdown','pointermove','pointerup','touchstart','touchmove'])root.addEventListener(type,inputGuard,{capture:true,passive:false});
 const motion=realWindow.matchMedia('(prefers-reduced-motion: reduce)');
 // Game-generated artwork remains pixel art. The surrounding UI uses SHIFT colours.
 // ===== shared: palette, sprites, pixel font, audio, share, storage =====
const PAL={k:'#050505',c:'#E7E3DA',a:'#707762',A:'#4C5243',g:'#8F977E',m:'#9AA08A',o:'#C8702A',O:'#8A4A1C',w:'#D9A066',y:'#B5652A',d:'#5A3416',s:'#E2B48C',b:'#3A2A1E',r:'#B23A2A',R:'#E0563A',f:'#F2B33D',F:'#FFE08A',x:'#A9A9A0',X:'#6E6E68',u:'#2F5F8A',n:'#2B2E26',G:'#5E6650'};
function spr(rows){const h=rows.length,w=rows[0].length,c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');
  rows.forEach((r,j)=>{for(let i=0;i<w;i++){const ch=r[i];if(ch!=='.'&&PAL[ch]){x.fillStyle=PAL[ch];x.fillRect(i,j,1,1);}}});return c;}
function cnv(w,h,fn){const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');fn(x,w,h);return c;}
const BLOKE=spr(["....aaaa....","...aaaaaa...","...aAAAAa...","...sssss....","...sksks....","...sssss....","..bbbbbbb...","..bbsssbb...","...bbbbb....",".rorooroor..","roroooroor..","sroroororos.","s.rororor.s.","..AAAAAAA...","..AAA.AAA...","..AAA.AAA...","..kkk.kkk..."]);
const BLOKE_NOARM=spr(["....aaaa....","...aaaaaa...","...aAAAAa...","...sssss....","...sksks....","...sssss....","..bbbbbbb...","..bbsssbb...","...bbbbb....",".rorooroor..","roroooroor..",".roroororo..","..rororor...","..AAAAAAA...","..AAA.AAA...","..AAA.AAA...","..kkk.kkk..."]);
const LOGEND=spr(["....OOOO....","..OOwwwwOO..",".OwwyyyywwO.",".OwywwwwywO.","OwywwyywwywO","OwywyddywywO","OwywyddywywO","OwywwyywwywO",".OwywwwwywO.",".OwwyyyywwO.","..OOwwwwOO..","....OOOO...."]);
// ---- pixel font 3x5
const FONT={A:"010101111101101",B:"110101110101110",C:"011100100100011",D:"110101101101110",E:"111100110100111",F:"111100110100100",G:"011100101101011",H:"101101111101101",I:"111010010010111",J:"001001001101010",K:"101101110101101",L:"100100100100111",M:"101111111101101",N:"110101101101101",O:"010101101101010",P:"110101110100100",Q:"010101101110011",R:"110101110101101",S:"011100010001110",T:"111010010010010",U:"101101101101111",V:"101101101101010",W:"101101111111101",X:"101101010101101",Y:"101101010010010",Z:"111001010100111",
"0":"111101101101111","1":"010110010010111","2":"110001010100111","3":"110001010001110","4":"101101111001001","5":"111100110001110","6":"011100111101111","7":"111001010010010","8":"111101111101111","9":"111101111001110",
"!":"010010010000010",".":"000000000000010","'":"010010000000000",":":"000010000010000","-":"000000111000000","+":"000010111010000","/":"001001010100100","?":"110001010000010",",":"000000000010100","*":"010111010101000","@":"010101111100011","\u00d7":"000101010101000"," ":"000000000000000"};
function txtW(s,sc){return String(s).length*4*sc-sc;}
function txt(ctx,s,x,y,sc=1,col=PAL.c,align='left',sh=PAL.k){s=String(s);const u=s.replace(/x(?=\d)/g,'\u00d7').toUpperCase();const w=txtW(u,sc);
  let x0=align==='center'?Math.round(x-w/2):align==='right'?x-w:x;x0=Math.round(x0);y=Math.round(y);
  const draw=(ox,oy,c)=>{ctx.fillStyle=c;for(let i=0;i<u.length;i++){const g=FONT[u[i]]||FONT[' '];for(let k=0;k<15;k++)if(g[k]==='1')ctx.fillRect(ox+i*4*sc+(k%3)*sc,oy+Math.floor(k/3)*sc,sc,sc);}};
  if(sh){draw(x0+sc,y+sc,sh);} draw(x0,y,col);}
// ---- storage
const store=bridge.store;
// ---- audio
let AC=null,muted=store.get('mt_arcade_muted',true),noiseBuf=null;
function audio(){if(muted)return null;try{if(!AC){const C=window.AudioContext||window.webkitAudioContext;if(!C)return null;AC=new C();}
  if(AC.state==='suspended')AC.resume();return AC;}catch(e){return null;}}
function beep(f,d=0.1,type='square',v=0.06,f2=null,delay=0){const a=audio();if(!a)return;const t=a.currentTime+delay,o=a.createOscillator(),g=a.createGain();
  o.type=type;o.frequency.setValueAtTime(f,t);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+d);g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(0.0001,t+d);
  o.connect(g);g.connect(a.destination);o.start(t);o.stop(t+d+0.03);}
function noise(d=0.12,v=0.08,hp=600){const a=audio();if(!a)return;if(!noiseBuf){noiseBuf=a.createBuffer(1,a.sampleRate*0.5,a.sampleRate);const ch=noiseBuf.getChannelData(0);for(let i=0;i<ch.length;i++)ch[i]=Math.random()*2-1;}
  const s=a.createBufferSource(),g=a.createGain(),fl=a.createBiquadFilter();fl.type='lowpass';fl.frequency.value=hp;s.buffer=noiseBuf;const t=a.currentTime;
  g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(0.0001,t+d);s.connect(fl);fl.connect(g);g.connect(a.destination);s.start(t);s.stop(t+d+0.02);}
function setupMute(btn){const upd=()=>{btn.textContent=muted?'SOUND OFF':'SOUND ON';btn.setAttribute('aria-pressed',String(!muted));};upd();
  btn.addEventListener('click',()=>{muted=!muted;store.set('mt_arcade_muted',muted);upd();if(!muted)beep(660,0.08);});}
// ---- share
function toast(msg){let t=document.getElementById('toast');t.textContent=msg;t.classList.add('on');clearTimeout(t._h);t._h=setTimeout(()=>t.classList.remove('on'),2200);}
async function invite(text,link){return bridge.share(text,link);}
// ---- pixel title on canvas
function pixelTitle(el,s){const sc=4,w=txtW(s,sc)+3,h=5*sc+3;el.width=w;el.height=h;el.style.width=Math.round(w*1.15)+'px';el.style.height=Math.round(h*1.15)+'px';el.style.imageRendering='pixelated';
  const x=el.getContext('2d');txt(x,s,3,3,sc,PAL.O,'left',null);txt(x,s,0,0,sc,PAL.c,'left',null);}
// ---- fit canvas into wrapper keeping aspect
function fitCanvas(canvas,wrap,W,H){const f=()=>{const r=wrap.getBoundingClientRect();let s=Math.min(r.width/W,r.height/H);if(!(s>0))s=1;
  canvas.style.width=Math.floor(W*s)+'px';canvas.style.height=Math.floor(H*s)+'px';};window.addEventListener('resize',f);f();setTimeout(f,50);return f;}
function fmt(n){return Math.round(n).toLocaleString('en-GB');}

// ===== CHOP SHOP =====
const CW=144,CH=164,GYP=116,ROUND=30,CX=72;
const cv=document.getElementById('game'),ctx=cv.getContext('2d');ctx.imageSmoothingEnabled=false;const $=id=>document.getElementById(id);
const AXE=spr(["......................kxxxxxk...","......................kcccxxk...","......................kxxxxxxk..","......................kxxxxxxk..","..............dddd....kXXXXXXk..","OOOOOOOOOOOOOOOOOOOOOOkXXXXXXkOO","dOOOOOOOOOOOOOOOOOOOOOkXXXXXXkdd","......................kXXXXXk...","......................kkkkkkk..."]);
const GOLDAXE=spr(["......................kfffffk...","......................kFFFffk...","......................kffffffk..","......................kffffffk..","..............dddd....kooooook..","OOOOOOOOOOOOOOOOOOOOOOkoooooookOO".slice(0,32),"dOOOOOOOOOOOOOOOOOOOOOkoooooookdd".slice(0,32),"......................koooook...","......................kkkkkkk..."]);
const STUMP=spr(["..wwwwwwwwwwwwwwwwwwwwww..",".wyyyyyyyyyyyyyyyyyyyyyyw.","wyywwwwwwwwwwwwwwwwwwwwyyw",".wyyyyyyyyyyyyyyyyyyyyyyw.","OOwwwwwwwwwwwwwwwwwwwwwwOO","OdOOOOdOOOOdOOOdOOOOdOOOdO","OOOdOOOOOdOOOOOOdOOOOOOOdO","OdOOOdOOOOOdOOdOOOOdOOOOOO","dOOOOOOdOOOOOOOdOOOOOOOdOd","OOOOdOOOOOOdOOOOOOdOOOOOOO"]);
const LOG=spr(["..wwwwwwwwwwww..",".wyyyyyyyyyyyyw.","wyywwwwddwwwwyyw",".wyyyyyyyyyyyyw.","OOwwwwwwwwwwwwOO","OdOOOdOOOOdOOOdO","OOOOdOOOOOOdOOOO","OdOOOOOdOOOOOdOO","OOOdOOOOdOOOOOOO","OdOOOOOOOOdOOOdO","OOOOdOOOdOOOOOOO","OdOOOOOOOOOOdOOO","OOOOOdOOOdOOOOdO","OdOOOOOOOOOOOOOO"]);
const HALF_L=cnv(8,14,x=>x.drawImage(LOG,0,0)),HALF_R=cnv(8,14,x=>x.drawImage(LOG,-8,0));
const SPLIT=spr(["..OOOO..",".OwwwwO.","OwyyyywO","Owywwyw O".replace(' ','').slice(0,8),"OOOOOOOO"]);
// ---- state
let S,parts=[],pops=[],shake=0,t=0,flyers=[];
let best=store.get('mt_chop_best',0),mine=store.get('mt_chop_total',0);const SHED_EXAMPLE=0;
function reset(){S={state:'ready',time:ROUND,logs:0,chain:0,mult:1,bestMult:1,m:0.02,dir:1,sp:0.85,pw:0.11,c:0.5,swing:0,swingKind:null,cool:0,logDrop:0,perf:0,good:0,miss:0,lastTick:6};parts=[];pops=[];flyers=[];ui();}
function gw(){return Math.max(0.1,S.pw*2.6);}
function pop(text,x,y,sc=1,col=PAL.f,life=0.9){pops.push({text,x,y,sc,col,t:0,life});}
function burst(x,y,n,cols,sp=70){for(let i=0;i<n;i++){const a=-Math.PI*Math.random(),v=sp*(0.3+Math.random());parts.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:0.5+Math.random()*0.5,t:0,c:cols[i%cols.length],s:Math.random()<0.3?2:1});}}
function start(){reset();S.state='play';[392,523,659].forEach((f,i)=>beep(f,0.08,'square',0.05,null,i*0.08));pop('GO!',CW/2,40,3,PAL.f,0.8);ui();}
function tap(){audio();if(S.state==='ready'){start();return;}if(S.state!=='play'||S.cool>0)return;
  const d=Math.abs(S.m-S.c);let kind=d<=S.pw/2?'perfect':d<=gw()/2?'good':'miss';S.swing=0.0001;S.swingKind=kind;S.cool=kind==='miss'?0.42:0.28;}
function impact(kind){const lx=CX,ly=GYP-22;
  if(kind==='miss'){S.chain=0;S.mult=1;S.miss++;pop(['GLANCED IT!','NEARLY!','SO CLOSE!'][S.miss%3],CW/2,62,1,PAL.c);burst(lx+6,ly-2,6,[PAL.x,PAL.c],40);beep(140,0.14,'triangle',0.08,90);noise(0.06,0.04,400);shake=1.5;ui();return;}
  let add=1;
  if(kind==='perfect'){S.chain++;S.perf++;const nm=Math.min(5,1+Math.floor(S.chain/3));if(nm>S.mult){S.mult=nm;pop(`COMBO x${nm}!`,CW/2,72,1,PAL.R,1.2);[659,784,988,1319].slice(0,nm-1).forEach((f,i)=>beep(f,0.07,'square',0.05,null,0.08+i*0.06));}
    S.bestMult=Math.max(S.bestMult,S.mult);add=S.mult;pop('PROPER CHOP!',CW/2,42,2,PAL.f,0.9);pop('+'+add,CW/2,58,1,PAL.c,0.9);beep(880,0.08,'square',0.06,1320);noise(0.12,0.11,2600);shake=4;burst(lx,ly,26,[PAL.w,PAL.y,PAL.c,PAL.f,PAL.F],90);}
  else{S.good++;pop(['TIDY.','NOT BAD!','DECENT!'][S.good%3],CW/2,50,1,PAL.c,0.8);pop('+1',CW/2,60,1,PAL.c,0.8);beep(520,0.07,'square',0.05,700);noise(0.1,0.08,1500);shake=2;burst(lx,ly,12,[PAL.w,PAL.y,PAL.c],60);}
  S.logs+=add;mine+=add;store.set('mt_chop_total',mine);
  flyers.push({img:HALF_L,x:CX-8,y:GYP-24,vx:-55-Math.random()*20,vy:-70,r:0,vr:-7,t:0},{img:HALF_R,x:CX,y:GYP-24,vx:40+Math.random()*20,vy:-80,r:0,vr:8,t:0});
  S.logDrop=0.2;S.sp=Math.min(2.8,S.sp*1.05);S.pw=Math.max(0.035,S.pw*0.95);S.c=0.22+Math.random()*0.56;ui();}
function end(){S.state='over';const nb=S.logs>best;if(nb){best=S.logs;store.set('mt_chop_best',best);}
  [784,659,523,392].forEach((f,i)=>beep(f,0.12,'square',0.05,null,i*0.1));
  $('ph').textContent=nb&&S.logs>0?'New personal best!':'Time!';$('pbig').textContent=`${S.logs} CHOPPED`;
  $('pp').textContent=nb?`Cracking. Your best is now ${best}.`:`Your best: ${best} chopped. ${best-S.logs<=5?'Right on its heels.':'Every chop sharpens the timing.'}`;
  $('pp2').textContent=`Perfect chops: ${S.perf} · best combo x${S.bestMult} · added to the Shed`;$('ov').classList.add('on');ui();}
cv.addEventListener('pointerdown',e=>{e.preventDefault();tap();});
['touchstart','touchmove','touchend','gesturestart'].forEach(tp=>cv.addEventListener(tp,e=>e.preventDefault(),{passive:false}));
window.addEventListener('keydown',e=>{if(e.code==='Space'||e.code==='Enter'){if(S.state==='over')return;e.preventDefault();tap();}});
// ---- update
const AX_UP=-60*Math.PI/180,AX_DOWN=-146*Math.PI/180,AX_MISS=-118*Math.PI/180;
function axeAngle(){if(!S.swing)return AX_UP+Math.sin(t*3)*0.03;const k=S.swing;const tgt=S.swingKind==='miss'?AX_MISS:AX_DOWN;
  if(k<0.09){const e=k/0.09;return AX_UP+(tgt-AX_UP)*e*e;}if(k<0.17)return tgt+(S.swingKind==='miss'?Math.sin((k-0.09)*60)*0.15:0);const e=Math.min(1,(k-0.17)/0.15);return tgt+(AX_UP-tgt)*(1-(1-e)*(1-e));}
function update(dt){t+=dt;
  if(S.state==='play'){S.time-=dt;const sec=Math.ceil(S.time);if(sec<=5&&sec<S.lastTick&&sec>0){S.lastTick=sec;beep(1000,0.03,'square',0.04);}
    if(S.time<=0){S.time=0;end();}
    S.m+=S.dir*S.sp*dt;if(S.m>1){S.m=2-S.m;S.dir=-1;}if(S.m<0){S.m=-S.m;S.dir=1;}
    if(S.cool>0)S.cool-=dt;}
  if(S.swing){const before=S.swing;S.swing+=dt;if(before<0.09&&S.swing>=0.09)impact(S.swingKind);if(S.swing>0.32)S.swing=0;}
  if(S.logDrop>0)S.logDrop=Math.max(0,S.logDrop-dt);
  for(const f of flyers){f.t+=dt;f.vy+=320*dt;f.x+=f.vx*dt;f.y+=f.vy*dt;f.r+=f.vr*dt;}flyers=flyers.filter(f=>f.y<GYP+10&&f.t<1.2);
  for(const p of parts){p.t+=dt;p.vy+=200*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;if(p.y>GYP){p.y=GYP;p.vy*=-0.3;p.vx*=0.5;}}parts=parts.filter(p=>p.t<p.life);
  for(const p of pops)p.t+=dt;pops=pops.filter(p=>p.t<p.life);shake*=Math.pow(0.01,dt);
  if(S.state==='play'&&Math.random()<0.25)hud();}
// ---- render
const STARS=[...Array(40)].map((_,i)=>({x:(i*53)%CW,y:(i*37)%80,p:i*0.7}));
const HILLS=[...Array(25)].map((_,i)=>Math.round(6+4*Math.sin(i*0.8)+3*Math.sin(i*2.1)));
function pile(n){n=Math.min(n,28);let i=0;const rows=[7,6,5,4,3,2,1];let y=GYP-5;for(let r=0;r<rows.length&&i<n;r++){for(let k=0;k<rows[r]&&i<n;k++,i++)ctx.drawImage(SPLIT,4+r*4+k*8,y);y-=5;}}
function render(){ctx.save();if(shake>0.2)ctx.translate(Math.round((Math.random()-.5)*shake),Math.round((Math.random()-.5)*shake));
  [['#07090a',40],['#0c0f0b',35],['#11140f',25],['#161a12',20]].reduce((y,[c,h])=>{ctx.fillStyle=c;ctx.fillRect(0,y,CW,h);return y+h;},0);
  for(const s of STARS){ctx.globalAlpha=0.3+0.4*Math.abs(Math.sin(t*1.2+s.p));ctx.fillStyle=PAL.c;ctx.fillRect(s.x,s.y,1,1);}ctx.globalAlpha=1;
  ctx.fillStyle=PAL.c;ctx.fillRect(116,14,6,6);ctx.fillRect(117,13,4,8);ctx.fillRect(115,15,8,4);ctx.fillStyle='#07090a';ctx.fillRect(119,13,4,5);
  ctx.fillStyle='#232820';HILLS.forEach((h,i)=>ctx.fillRect(i*6,GYP-8-h,6,h+8));
  ctx.fillStyle='#3a2a1e';ctx.fillRect(0,GYP,CW,CH-GYP);ctx.fillStyle=PAL.A;ctx.fillRect(0,GYP,CW,2);ctx.fillStyle=PAL.d;for(let x=0;x<CW;x+=5)ctx.fillRect(x,GYP+3+(x%3),2,1);
  pile(S.logs);
  ctx.drawImage(STUMP,CX-13,GYP-10);
  if(!(S.swing&&S.swing>=0.09&&S.swing<0.2&&S.swingKind!=='miss')){const dy=S.logDrop>0?-Math.round((S.logDrop/0.2)*40):0;ctx.drawImage(LOG,CX-8,GYP-24+dy);}
  for(const f of flyers){ctx.save();ctx.translate(Math.round(f.x+4),Math.round(f.y+7));ctx.rotate(f.r);ctx.drawImage(f.img,-4,-7);ctx.restore();}
  // bloke + axe
  const bx=CX+16,by=GYP-34;ctx.drawImage(BLOKE_NOARM,bx,by,24,34);
  const a=axeAngle(),px=bx+6,py=by+20;ctx.save();ctx.translate(px,py);ctx.rotate(a);ctx.drawImage(S.bestMult>=4||best>=60?GOLDAXE:AXE,-2,-6);ctx.restore();
  ctx.fillStyle=PAL.s;ctx.fillRect(px-2,py-2,4,4);
  for(const p of parts){ctx.globalAlpha=Math.max(0,1-p.t/p.life);ctx.fillStyle=p.c;ctx.fillRect(Math.round(p.x),Math.round(p.y),p.s,p.s);}ctx.globalAlpha=1;
  // meter
  const mx=10,mw=CW-20,my=CH-24,mh=12;ctx.fillStyle=PAL.k;ctx.fillRect(mx-4,my-14,mw+8,mh+20);
  txt(ctx,'POWER',mx,my-10,1,PAL.c,'left',null);txt(ctx,'HIT THE SWEET SPOT',mx+mw,my-10,1,PAL.f,'right',null);
  ctx.fillStyle=PAL.c;ctx.fillRect(mx-2,my-2,mw+4,mh+4);ctx.fillStyle=PAL.A;ctx.fillRect(mx,my,mw,mh);
  const g=gw();ctx.fillStyle=PAL.m;ctx.fillRect(Math.round(mx+(S.c-g/2)*mw),my,Math.round(g*mw),mh);ctx.fillStyle=PAL.f;ctx.fillRect(Math.round(mx+(S.c-S.pw/2)*mw),my,Math.max(3,Math.round(S.pw*mw)),mh);
  const mkx=Math.round(mx+S.m*mw);ctx.fillStyle=PAL.k;ctx.fillRect(mkx-3,my-6,7,mh+12);ctx.fillStyle=PAL.c;ctx.fillRect(mkx-1,my-5,3,mh+10);
  for(const p of pops){const k=p.t/p.life;ctx.globalAlpha=k>0.7?(1-k)/0.3:1;txt(ctx,p.text,p.x,Math.round(p.y-k*12),p.sc,p.col,'center');}ctx.globalAlpha=1;
  if(S.state==='ready'){if(Math.floor(t*2)%2===0)txt(ctx,'TAP TO START',CW/2,36,2,PAL.c,'center');txt(ctx,`30 SECONDS. HOW MUCH TIMBER?`,CW/2,56,1,PAL.m,'center');}
  if(S.state==='play'&&S.time<5){txt(ctx,String(Math.ceil(S.time)),CW/2,14,3,PAL.R,'center');}
  ctx.restore();}
// ---- UI
function hud(){$('hl').textContent=`TIMBER ${S.logs}`;$('hc').textContent=`COMBO x${S.mult} `+'■'.repeat(S.chain%3)+'□'.repeat(S.mult>=5?0:3-S.chain%3);
  const tt=Math.ceil(S.time);$('ht').textContent=`0:${String(tt).padStart(2,'0')}`;$('ht').className='chip '+(S.state==='play'&&S.time<5?'o':'g');}
function ui(){hud();$('best').textContent=`Your best: ${best} chopped`;$('bestsub').textContent=best?'Beat it in 30 seconds':'Set one this round';
  $('shed').textContent=`${fmt(SHED_EXAMPLE+mine)} timber chops`;$('mine').textContent=mine?`incl. ${fmt(mine)} of yours`:'Every chop adds to it';}
$('again').onclick=$('pa').onclick=()=>{$('ov').classList.remove('on');start();};
$('invite').onclick=$('pi').onclick=()=>invite(best?`Beat my ${best} timber chops at Chop Shop in the My Timber Shed Arcade. 30 seconds, one axe.`:`Fancy a go at Chop Shop in the My Timber Shed Arcade? 30 seconds, one axe.`);
setupMute($('mute'));pixelTitle($('title'),'CHOP SHOP');fitCanvas(cv,$('gwrap'),CW,CH);reset();
let last=performance.now(),acc=0;const STEP=1/60;
function frame(now){acc+=Math.min(0.1,(now-last)/1000);last=now;let n=0;while(acc>=STEP&&n<4){update(STEP);acc-=STEP;n++;}if(n===4)acc=0;render();requestAnimationFrame(frame);}
requestAnimationFrame(frame);
window.__chop={state:()=>({...S}),tap,fast:n=>{for(let i=0;i<n;i++)update(STEP);render();}};

 return ()=>{if(dead)return;dead=true;for(const id of frames)realWindow.cancelAnimationFrame(id);for(const id of timers)realWindow.clearTimeout(id);for(const [t,f,o]of listeners)realWindow.removeEventListener(t,f,o);realDocument.removeEventListener('visibilitychange',visibility);for(const [k,v]of properties){if(v.existed)realWindow[k]=v.value;else delete realWindow[k];}if(AC)AC.close().catch(()=>{});pauseButton.onclick=null;root.replaceChildren();};
}
