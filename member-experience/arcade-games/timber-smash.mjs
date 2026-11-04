const HTML="<div class=\"app\">\n<div class=\"tbar\"><div class=\"tl\"><canvas id=\"title\"></canvas></div></div>\n<div class=\"hook\">Slide the plank, keep the ball up, smash the timber. Crack a crate for a goodie.</div>\n<div class=\"hud mono\"><span class=\"chip\" id=\"hl\">LEVEL 1</span><span class=\"chip o\" id=\"hc\">SCORE 0</span><span class=\"chip g\" id=\"ht\">BALLS 3</span></div>\n<div class=\"gwrap\" id=\"gwrap\"><canvas class=\"game\" id=\"game\" width=\"128\" height=\"176\" aria-label=\"Timber Smash game area\" tabindex=\"0\" role=\"application\"></canvas>\n <div class=\"ov\" id=\"ov\"><div class=\"panel\"><h2 class=\"mono\" id=\"ph\">Time!</h2><div class=\"pbig mono\" id=\"pbig\">0 POINTS</div><p id=\"pp\"></p><p id=\"pp2\" style=\"font-size:11.5px;color:#9AA08A\"></p>\n <div class=\"row\"><button class=\"p\" id=\"pa\">ONE MORE GO</button><button class=\"s\" id=\"pi\">INVITE A MATE</button></div></div></div></div>\n<div class=\"bot\"><div class=\"cards\"><div class=\"card\"><div class=\"k\">Personal best</div><div class=\"v mono\" id=\"best\">Your best: 0 pts</div><div style=\"font-size:10.5px;color:#9AA08A;margin-top:1px\" id=\"bestsub\"></div></div>\n<div hidden=\"\" aria-hidden=\"true\"><span id=\"shed\"></span><span id=\"mine\"></span></div></div>\n<div class=\"btns\"><button class=\"p\" id=\"again\">ONE MORE GO</button><button class=\"s\" id=\"invite\">INVITE A MATE</button><button class=\"t\" id=\"mute\">SOUND ON</button></div></div>\n</div><div id=\"toast\"></div>\n";
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

// ===== TIMBER SMASH (breakout) =====
const CW=128,CH=176,COLS=8,BW=14,BHH=6,BX0=4,BY0=20,PY=CH-16,PH=4,PW0=24,PWL=36,BR=1.5;
const cv=document.getElementById('game'),ctx=cv.getContext('2d');ctx.imageSmoothingEnabled=false;const $=id=>document.getElementById(id);
const LEVELS=[
 ["tttttttt","tttttttt","ctttttc.".replace('.','t'),"tttttttt"],
 ["...cc...","..cttc..",".cttttc.","cttttttc","tt.oo.tt"],
 ["oooooooo","c.c.c.c.",".t.t.t.t","tttttttt","cccccccc"],
 ["t.t.t.t.",".c.c.c.c","t.t.t.t.",".c.c.c.c","oooooooo","tttttttt"],
 ["...oo...","..tcct..",".tcttct.","tcttttct",".tcttct.","..tcct..","...tt..."],
 ["oo.cc.oo","otttttto","ottccto".padEnd(8,'o'),"otttttto","cccccccc","tttttttt"]];
const KIND={t:{hp:1,pts:10},c:{hp:2,pts:20},o:{hp:3,pts:30}};
const DROPS={L:{c:PAL.f,txt:'LONGER PLANK!'},M:{c:PAL.R,txt:'MULTI-BALL!'},S:{c:PAL.m,txt:'SLOW BALL'}};
// ---- sprites
const imgCache={};
function plankImg(w,h,base,top,dark,end){const key=[w,h,base].join();if(imgCache[key])return imgCache[key];return imgCache[key]=cnv(w,h,x=>{x.fillStyle=base;x.fillRect(0,0,w,h);x.fillStyle=top;x.fillRect(0,0,w,1);
  x.fillStyle=dark;x.fillRect(0,h-1,w,1);for(let i=2;i<w-3;i+=4)x.fillRect(i,1+(i*3)%Math.max(1,h-2),2,1);x.fillStyle=end;x.fillRect(0,1,1,h-2);x.fillRect(w-1,1,1,h-2);});}
function brickImg(k,hp){const key='b'+k+hp;if(imgCache[key])return imgCache[key];return imgCache[key]=cnv(BW,BHH,x=>{
  if(k==='t'){x.drawImage(plankImg(BW,BHH,PAL.o,PAL.w,PAL.y,PAL.s),0,0);}
  else if(k==='c'){x.fillStyle=PAL.y;x.fillRect(0,0,BW,BHH);x.fillStyle=PAL.w;x.fillRect(0,0,BW,1);x.fillRect(0,BHH-1,BW,1);x.fillRect(0,0,1,BHH);x.fillRect(BW-1,0,1,BHH);
    x.fillStyle=PAL.d;for(let i=1;i<BW-1;i++){const yy=Math.round(1+(i-1)*(BHH-3)/(BW-3));x.fillRect(i,yy,1,1);x.fillRect(i,BHH-1-yy,1,1);}}
  else{x.fillStyle=PAL.d;x.fillRect(0,0,BW,BHH);x.fillStyle=PAL.y;x.fillRect(0,0,BW,1);x.fillStyle=PAL.b;x.fillRect(0,BHH-1,BW,1);x.fillStyle=PAL.O;x.fillRect(3,2,2,2);x.fillRect(9,2,3,1);x.fillRect(8,3,1,1);x.fillStyle=PAL.x;x.fillRect(0,2,BW,1);}
  // cracks when damaged
  x.fillStyle=PAL.k;const dmg=KIND[k].hp-hp;if(dmg>=1){x.fillRect(5,1,1,2);x.fillRect(6,3,1,2);x.fillRect(7,2,1,1);}if(dmg>=2){x.fillRect(10,2,1,3);x.fillRect(2,3,2,1);}});}
// ---- state
let S,parts=[],pops=[],shake=0,t=0,keys={l:false,r:false};
let best=store.get('mt_plank_best',0),smashedMine=store.get('mt_plank_smashed',0);const SHED_EXAMPLE=0;
function reset(){S={state:'ready',level:1,score:0,lives:3,hits:0,smashed:0,chain:0,bestChain:0,px:CW/2-PW0/2,pw:PW0,long:0,slow:0,balls:[],drops:[],bricks:[],held:true,heldT:0,lvlT:0};
  parts=[];pops=[];loadLevel(1);newBall();ui();}
function loadLevel(n){const L=LEVELS[(n-1)%LEVELS.length];S.bricks=[];L.forEach((row,j)=>[...row].forEach((ch,i)=>{if(KIND[ch])S.bricks.push({x:BX0+i*(BW+1),y:BY0+j*(BHH+1),k:ch,hp:KIND[ch].hp,fl:0});}));}
function newBall(){S.balls=[{x:S.px+S.pw/2,y:PY-BR,vx:0,vy:0,trail:[]}];S.held=true;S.heldT=0;S.chain=0;}
function speedFor(){return Math.min(165,82+(S.level-1)*9+S.hits*0.35)*(S.slow>0?0.7:1);}
function retune(){const v=speedFor();for(const b of S.balls){const m=Math.hypot(b.vx,b.vy);if(m>0){b.vx*=v/m;b.vy*=v/m;}}}
function launch(){if(!S.held||S.state!=='play')return;S.held=false;const b=S.balls[0],a=(Math.random()-.5)*0.7,v=speedFor();b.vx=Math.sin(a)*v;b.vy=-Math.cos(a)*v;beep(520,0.06,'square',0.04,780);}
function pop(text,x,y,sc=1,col=PAL.f,life=1){pops.push({text,x,y,sc,col,t:0,life});}
function burst(x,y,n,cols,sp=50,up=false){for(let i=0;i<n;i++){const a=up?-Math.PI*Math.random():Math.random()*Math.PI*2,v=sp*(0.3+Math.random());parts.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:0.4+Math.random()*0.5,t:0,c:cols[i%cols.length]});}}
function start(){reset();S.state='play';[392,523,659].forEach((f,i)=>beep(f,0.07,'square',0.05,null,i*0.07));pop('LEVEL 1',CW/2,96,2,PAL.f,1.4);}
function clampP(){S.px=Math.max(1,Math.min(CW-1-S.pw,S.px));}
function movePlank(dx){S.px+=dx;clampP();}
function movePlankTo(x){S.px=x-S.pw/2;clampP();}
function setWidth(w){const c=S.px+S.pw/2;S.pw=w;S.px=c-w/2;clampP();}
// ---- hits
function hitPlank(b){const off=Math.max(-1,Math.min(1,(b.x-(S.px+S.pw/2))/(S.pw/2+BR))),ang=off*1.05,v=speedFor();b.vx=Math.sin(ang)*v;b.vy=-Math.cos(ang)*v;b.y=PY-BR;
  S.chain=0;beep(180+Math.abs(off)*120,0.06,'square',0.05,120);noise(0.04,0.05,900);shake=Math.max(shake,1);burst(b.x,PY,4,[PAL.w,PAL.s],30,true);}
function hitBrick(k,b){k.hp--;k.fl=0.1;S.hits++;S.chain++;S.bestChain=Math.max(S.bestChain,S.chain);const cx=k.x+BW/2,cy=k.y+BHH/2;
  if(k.hp<=0){S.bricks.splice(S.bricks.indexOf(k),1);const pts=KIND[k.k].pts+Math.min(S.chain-1,8)*5;S.score+=pts;S.smashed++;smashedMine++;
    burst(cx,cy,14,k.k==='o'?[PAL.d,PAL.y,PAL.O]:k.k==='c'?[PAL.y,PAL.w,PAL.d]:[PAL.o,PAL.w,PAL.s],60);noise(0.12,0.1,1400);beep(300+Math.min(S.chain,12)*45,0.07,'square',0.05);shake=Math.max(shake,k.k==='o'?3:2);
    pop('+'+pts,cx,cy-2,1,S.chain>=3?PAL.F:PAL.c,0.7);if(S.chain>=3&&S.chain%3===0)pop('CHAIN x'+S.chain,CW/2,108,2,PAL.f,0.9);
    const chance=k.k==='c'?0.4:k.k==='o'?0.25:0.07;if(S.drops.length<2&&Math.random()<chance){const ty=['L','M','S'][Math.floor(Math.random()*3)];S.drops.push({x:cx,y:cy,ty,vy:34});}}
  else{burst(cx,cy,5,[PAL.w,PAL.s],35);noise(0.06,0.07,2200);beep(140,0.05,'square',0.04,90);shake=Math.max(shake,1.2);}
  retune();ui();}
function catchDrop(d){const D=DROPS[d.ty];pop(D.txt,CW/2,118,1,D.c,1.2);[659,880,1175].forEach((f,i)=>beep(f,0.06,'square',0.05,null,i*0.05));burst(d.x,PY,10,[D.c,PAL.c],45,true);
  if(d.ty==='L'){setWidth(PWL);S.long=12;}
  else if(d.ty==='S'){S.slow=8;retune();}
  else{if(S.held)launch();const src=S.balls[0],v=speedFor();for(const a of[-0.55,0.55]){S.balls.push({x:src.x,y:src.y,vx:Math.sin(a)*v,vy:-Math.cos(a)*v,trail:[]});}}}
function stepBall(b,dt){b.trail.push([b.x,b.y]);if(b.trail.length>5)b.trail.shift();
  const n=Math.max(1,Math.ceil(Math.hypot(b.vx,b.vy)*dt/1.2)),h=dt/n;
  for(let i=0;i<n;i++){b.x+=b.vx*h;b.y+=b.vy*h;
    if(b.x<1+BR){b.x=1+BR;b.vx=Math.abs(b.vx);beep(760,0.02,'square',0.02);}
    if(b.x>CW-1-BR){b.x=CW-1-BR;b.vx=-Math.abs(b.vx);beep(760,0.02,'square',0.02);}
    if(b.y<1+BR){b.y=1+BR;b.vy=Math.abs(b.vy);beep(760,0.02,'square',0.02);}
    if(b.vy>0&&b.y+BR>=PY&&b.y-BR<=PY+PH&&b.x>=S.px-BR&&b.x<=S.px+S.pw+BR){hitPlank(b);continue;}
    if(b.y>CH+4){b.dead=true;return;}
    for(const k of S.bricks){if(b.x+BR>k.x&&b.x-BR<k.x+BW&&b.y+BR>k.y&&b.y-BR<k.y+BHH){
      const ox=Math.min(b.x+BR-k.x,k.x+BW-(b.x-BR)),oy=Math.min(b.y+BR-k.y,k.y+BHH-(b.y-BR));
      if(ox<oy)b.vx=b.x<k.x+BW/2?-Math.abs(b.vx):Math.abs(b.vx);else b.vy=b.y<k.y+BHH/2?-Math.abs(b.vy):Math.abs(b.vy);
      hitBrick(k,b);break;}}}}
function loseBall(){S.lives--;shake=5;noise(0.3,0.12,500);beep(220,0.35,'sawtooth',0.05,70);setWidth(PW0);S.long=0;S.slow=0;S.drops=[];
  if(S.lives<=0){gameOver();return;}pop('BALL LOST',CW/2,96,2,PAL.R,1.2);newBall();ui();}
function levelClear(){const bonus=50*S.level;S.score+=bonus;S.level++;pops=[];pop('LEVEL CLEAR!',CW/2,70,2,PAL.f,1.6);pop('+'+bonus+' BONUS',CW/2,88,1,PAL.c,1.6);pop('LEVEL '+S.level,CW/2,104,1,PAL.m,1.6);
  [523,659,784,1046].forEach((f,i)=>beep(f,0.1,'square',0.05,null,i*0.09));shake=3;S.drops=[];S.slow=0;loadLevel(S.level);newBall();S.heldT=-0.8;ui();}
function gameOver(){S.state='over';S.balls=[];store.set('mt_plank_smashed',smashedMine);const nb=S.score>best;if(nb){best=S.score;store.set('mt_plank_best',best);}
  $('ph').textContent='Out of balls!';$('pbig').textContent=`${S.score} POINTS`;$('pp').textContent='Still counts. Cracking effort.';
  $('pp2').textContent=`Level ${S.level} · ${S.smashed} timber smashed · best chain ${S.bestChain}${nb&&S.score>0?' · new personal best!':` · your best: ${best}`}`;
  setTimeout(()=>{if(S.state==='over')$('ov').classList.add('on');},700);ui();}
// ---- update
function update(dt){t+=dt;
  if(S.state==='play'){
    if(keys.l)movePlank(-150*dt);if(keys.r)movePlank(150*dt);
    if(S.long>0){S.long-=dt;if(S.long<=0)setWidth(PW0);}
    if(S.slow>0){S.slow-=dt;if(S.slow<=0)retune();}
    if(S.held){const b=S.balls[0];b.x=S.px+S.pw/2;b.y=PY-BR;b.trail=[];S.heldT+=dt;if(S.heldT>3)launch();}
    else{for(const b of S.balls)stepBall(b,dt);S.balls=S.balls.filter(b=>!b.dead);if(S.state==='play'&&!S.balls.length)loseBall();}
    for(const d of S.drops){d.y+=d.vy*dt;if(d.y+3>=PY&&d.y-3<=PY+PH&&d.x+4>=S.px&&d.x-4<=S.px+S.pw){d.got=true;catchDrop(d);}}S.drops=S.drops.filter(d=>!d.got&&d.y<CH+6);
    if(S.state==='play'&&!S.bricks.length)levelClear();}
  for(const k of(S.bricks||[]))if(k.fl>0)k.fl-=dt;
  for(const p of parts){p.t+=dt;p.vy+=220*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;}parts=parts.filter(p=>p.t<p.life);for(const p of pops)p.t+=dt;pops=pops.filter(p=>p.t<p.life);shake*=Math.pow(0.01,dt);}
// ---- render
function render(){ctx.save();if(shake>0.2)ctx.translate(Math.round((Math.random()-.5)*shake),Math.round((Math.random()-.5)*shake));
  // shed wall: vertical boards
  ctx.fillStyle='#0d0f0b';ctx.fillRect(0,0,CW,CH);for(let i=0;i<CW;i+=16){ctx.fillStyle=i%32?'#11140e':'#0f120c';ctx.fillRect(i,0,16,CH);ctx.fillStyle='#070806';ctx.fillRect(i,0,1,CH);}
  ctx.fillStyle='#161a12';for(let i=8;i<CW;i+=16)ctx.fillRect(i,12,1,1),ctx.fillRect(i,CH-40,1,1);
  // floor / sawdust pit
  ctx.fillStyle='#1b1610';ctx.fillRect(0,PY+PH+6,CW,CH);ctx.fillStyle=PAL.A;ctx.fillRect(0,PY+PH+6,CW,1);
  ctx.fillStyle='#2a2015';for(let i=0;i<CW;i+=5)ctx.fillRect(i+(i*7)%3,PY+PH+8+(i*3)%4,2,1);
  // bricks
  for(const k of S.bricks){ctx.drawImage(brickImg(k.k,k.hp),k.x,k.y);if(k.fl>0){ctx.globalAlpha=0.7;ctx.fillStyle=PAL.c;ctx.fillRect(k.x,k.y,BW,BHH);ctx.globalAlpha=1;}}
  // drops
  for(const d of S.drops){const D=DROPS[d.ty],x=Math.round(d.x-4),y=Math.round(d.y-3);ctx.fillStyle=PAL.k;ctx.fillRect(x-1,y-1,11,9);ctx.fillStyle=D.c;ctx.fillRect(x,y,9,7);txt(ctx,d.ty,x+3,y+1,1,PAL.k,'left',null);}
  // plank
  const pw=Math.round(S.pw),px=Math.round(S.px);if(S.state!=='over'||S.lives>0){ctx.drawImage(plankImg(pw,PH,PAL.o,PAL.w,PAL.y,PAL.s),px,PY);
    if(S.long>0&&(S.long>2||Math.floor(t*8)%2)){ctx.fillStyle=PAL.f;ctx.fillRect(px,PY-1,pw,1);}ctx.fillStyle=PAL.d;ctx.fillRect(px+1,PY+PH,pw-2,1);}
  // balls
  for(const b of S.balls){b.trail.forEach(([x,y],i)=>{ctx.globalAlpha=0.08+i*0.06;ctx.fillStyle=S.slow>0?PAL.m:PAL.f;ctx.fillRect(Math.round(x-1),Math.round(y-1),2,2);});ctx.globalAlpha=1;
    const x=Math.round(b.x-1.5),y=Math.round(b.y-1.5);ctx.fillStyle=PAL.k;ctx.fillRect(x-1,y,5,3);ctx.fillRect(x,y-1,3,5);ctx.fillStyle=PAL.c;ctx.fillRect(x,y,3,3);ctx.fillStyle=PAL.F;ctx.fillRect(x,y,1,1);}
  for(const p of parts){ctx.globalAlpha=Math.max(0,1-p.t/p.life);ctx.fillStyle=p.c;ctx.fillRect(Math.round(p.x),Math.round(p.y),p.c===PAL.d?2:1,1);}ctx.globalAlpha=1;
  for(const p of pops){const k=p.t/p.life;ctx.globalAlpha=k>0.7?(1-k)/0.3:1;txt(ctx,p.text,p.x,Math.round(p.y-k*8),p.sc,p.col,'center');}ctx.globalAlpha=1;
  // in-canvas status
  if(S.state!=='ready'){txt(ctx,'LEVEL '+S.level,3,3,1,PAL.m);for(let i=0;i<S.lives;i++){ctx.fillStyle=PAL.c;ctx.fillRect(CW-6-i*6,4,3,3);}
    if(S.long>0||S.slow>0){const s=(S.long>0?'LONG ':'')+(S.slow>0?'SLOW':'');txt(ctx,s.trim(),CW/2,3,1,PAL.f,'center');}}
  if(S.state==='ready'){if(Math.floor(t*2)%2===0)txt(ctx,'TAP TO START',CW/2,96,2,PAL.c,'center');txt(ctx,'SLIDE THE PLANK',CW/2,116,1,PAL.m,'center');txt(ctx,'SMASH THE TIMBER',CW/2,124,1,PAL.m,'center');}
  else if(S.state==='play'&&S.held&&Math.floor(t*2.5)%2===0)txt(ctx,'TAP TO LAUNCH',CW/2,PY-14,1,PAL.c,'center');
  ctx.restore();}
// ---- input
let drag=null;const toX=cx=>{const r=cv.getBoundingClientRect();return(cx-r.left)/r.width*CW;};
cv.addEventListener('pointerdown',e=>{e.preventDefault();audio();try{cv.setPointerCapture(e.pointerId);}catch(_){}
  const wasPlay=S.state==='play';if(S.state==='ready')start();drag={id:e.pointerId,lx:toX(e.clientX),type:e.pointerType,wasPlay};if(e.pointerType==='mouse'&&S.state==='play')movePlankTo(toX(e.clientX));});
cv.addEventListener('pointermove',e=>{const x=toX(e.clientX);if(e.pointerType==='mouse'){if(S.state==='play')movePlankTo(x);return;}
  if(!drag||drag.id!==e.pointerId)return;const dx=x-drag.lx;drag.lx=x;if(S.state==='play')movePlank(dx*1.3);});
const up=e=>{if(drag&&drag.id===e.pointerId){if(drag.wasPlay&&S.held)launch();drag=null;}};cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',e=>{drag=null;});
['touchstart','touchmove','touchend','gesturestart'].forEach(tp=>cv.addEventListener(tp,e=>e.preventDefault(),{passive:false}));
window.addEventListener('keydown',e=>{const c=e.code;if(c==='ArrowLeft'||c==='KeyA'){keys.l=true;e.preventDefault();}if(c==='ArrowRight'||c==='KeyD'){keys.r=true;e.preventDefault();}
  if((c==='Space'||c==='Enter')&&S.state!=='over'){e.preventDefault();audio();if(S.state==='ready')start();else launch();}});
window.addEventListener('keyup',e=>{const c=e.code;if(c==='ArrowLeft'||c==='KeyA')keys.l=false;if(c==='ArrowRight'||c==='KeyD')keys.r=false;});
// ---- UI
function ui(){$('hl').textContent=`LEVEL ${S.level}`;$('hc').textContent=`SCORE ${S.score}`;$('ht').textContent=`BALLS ${Math.max(0,S.lives)}`;
  $('best').textContent=`Your best: ${best} pts`;$('bestsub').textContent='Crate +20 · oak +30 · chains add more';
  $('shed').textContent=`${fmt(SHED_EXAMPLE+smashedMine)} timber smashed`;$('mine').textContent=smashedMine?`incl. ${fmt(smashedMine)} of yours`:'Every smash adds to it';}
$('again').onclick=$('pa').onclick=()=>{$('ov').classList.remove('on');start();};
$('invite').onclick=$('pi').onclick=()=>invite(best?`Beat my ${best} points at Timber Smash in the My Timber Shed Arcade. Keep the ball up.`:'Fancy a go at Timber Smash in the My Timber Shed Arcade? Keep the ball up.');
setupMute($('mute'));pixelTitle($('title'),'TIMBER SMASH');fitCanvas(cv,$('gwrap'),CW,CH);reset();
let last=performance.now(),acc=0;const STEP=1/60;
function frame(now){acc+=Math.min(0.1,(now-last)/1000);last=now;let n=0;while(acc>=STEP&&n<4){update(STEP);acc-=STEP;n++;}if(n===4)acc=0;render();requestAnimationFrame(frame);}
requestAnimationFrame(frame);
window.__plank={state:()=>({state:S.state,level:S.level,score:S.score,lives:S.lives,bricks:S.bricks.length,balls:S.balls.map(b=>({x:b.x,y:b.y,vx:b.vx,vy:b.vy})),px:S.px,pw:S.pw,held:S.held,smashed:S.smashed}),
  fast:n=>{for(let i=0;i<n;i++)update(STEP);render();},auto:on=>{window.__auto=on;},track:()=>{const b=S.balls.filter(b=>b.vy>0).sort((a,c)=>c.y-a.y)[0]||S.balls[0];if(b)movePlankTo(b.x+(Math.random()-.5)*S.pw*0.6);},
  drop:ty=>S.drops.push({x:S.px+S.pw/2,y:PY-20,ty,vy:34}),launch,start};

 return ()=>{if(dead)return;dead=true;for(const id of frames)realWindow.cancelAnimationFrame(id);for(const id of timers)realWindow.clearTimeout(id);for(const [t,f,o]of listeners)realWindow.removeEventListener(t,f,o);realDocument.removeEventListener('visibilitychange',visibility);for(const [k,v]of properties){if(v.existed)realWindow[k]=v.value;else delete realWindow[k];}if(AC)AC.close().catch(()=>{});pauseButton.onclick=null;root.replaceChildren();};
}
