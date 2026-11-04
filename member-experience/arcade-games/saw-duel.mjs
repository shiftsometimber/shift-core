const HTML="<div class=\"app\">\n<div class=\"tbar\"><div class=\"tl\"><canvas id=\"title\"></canvas></div></div>\n<div class=\"hook\">Saw left, right, left, right. Race a mate's ghost, then send yours back.</div>\n<div class=\"hud mono\"><span class=\"chip\" id=\"hl\">STROKES 0/80</span><span class=\"chip o\" id=\"hc\">YOU 0.0s</span><span class=\"chip g\" id=\"ht\">GHOST 14.2s</span></div>\n<div class=\"gwrap\" id=\"gwrap\"><canvas class=\"game\" id=\"game\" width=\"128\" height=\"144\" aria-label=\"Saw Duel game area\" tabindex=\"0\" role=\"application\"></canvas>\n <div class=\"ov\" id=\"ov\"><div class=\"panel\"><h2 class=\"mono\" id=\"ph\">You win this one!</h2><div class=\"pbig mono\" id=\"pbig\">0.0s</div><p id=\"pp\"></p><p id=\"pp2\" style=\"font-size:11.5px;color:#9AA08A\"></p>\n <div class=\"row\"><button class=\"p\" id=\"pi\">SEND IT BACK</button><button class=\"s\" id=\"pa\">REMATCH</button></div></div></div></div>\n<div class=\"ctl\"><button class=\"big\" id=\"bl\">\u25c0 SAW</button><button class=\"big\" id=\"br\">SAW \u25b6</button></div>\n<div class=\"bot\"><div class=\"cards\"><div class=\"card\"><div class=\"k\" id=\"cfrom\">Friendly challenge</div><div style=\"font-size:12px;font-weight:600;margin-top:3px\" id=\"cq\"></div><div class=\"mono\" style=\"font-size:11px;margin-top:3px;color:#9AA08A\" id=\"best\"></div>\n<label class=\"hand\">You: @<input id=\"handle\" maxlength=\"16\" autocomplete=\"off\" spellcheck=\"false\"></label></div>\n<div hidden=\"\" aria-hidden=\"true\"><span id=\"sbar\"></span><span id=\"shed\"></span><span id=\"mine\"></span></div></div>\n<div class=\"btns\"><button class=\"p\" id=\"again\">ONE MORE GO</button><button class=\"s\" id=\"invite\">INVITE A MATE</button><button class=\"t\" id=\"mute\">SOUND ON</button></div></div>\n</div><div id=\"toast\"></div>\n";
const CSS="#mtNativeMain .mt-arcade-game *{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}#mtNativeMain .mt-arcade-game,#mtNativeMain .mt-arcade-game{height:100%;background:#050505;color:#E7E3DA;font-family:-apple-system,BlinkMacSystemFont,\"Segoe UI\",Roboto,Inter,Arial,sans-serif;overscroll-behavior:none}#mtNativeMain .mt-arcade-game{display:flex;justify-content:center}#mtNativeMain .mt-arcade-game .app{width:100%;max-width:460px;height:100vh;height:100dvh;display:flex;flex-direction:column;padding:0 10px env(safe-area-inset-bottom);user-select:none;-webkit-user-select:none}#mtNativeMain .mt-arcade-game .hdr{flex:0 0 auto;height:46px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #1d1f1a;padding:0 4px}#mtNativeMain .mt-arcade-game .hdr a{color:#9AA08A;text-decoration:none;font-size:14px;width:100px}#mtNativeMain .mt-arcade-game .wm{font-weight:900;font-size:18px;letter-spacing:1.5px;font-family:\"Arial Black\",\"Archivo Black\",Impact,sans-serif}#mtNativeMain .mt-arcade-game .wm i{font-style:normal;color:#707762}#mtNativeMain .mt-arcade-game .badge{width:100px;text-align:right}#mtNativeMain .mt-arcade-game .badge b{display:inline-block;border:1px solid #707762;border-radius:10px;padding:3px 7px;font-size:9.5px;letter-spacing:.5px;white-space:nowrap}#mtNativeMain .mt-arcade-game .tbar{flex:0 0 auto;display:flex;align-items:center;justify-content:space-between;padding:8px 2px 4px;gap:8px}#mtNativeMain .mt-arcade-game .tl{display:flex;flex-direction:column;gap:4px;min-width:0}#mtNativeMain .mt-arcade-game .pill{align-self:flex-start;white-space:nowrap;font-size:10px;font-weight:700;letter-spacing:.4px;color:#050505;background:#E7E3DA;border-radius:4px;padding:2px 6px}#mtNativeMain .mt-arcade-game .hook{font-size:12px;color:#b9b7ae;padding:0 2px 6px}#mtNativeMain .mt-arcade-game .mono{font-family:ui-monospace,\"SF Mono\",Menlo,Consolas,\"Courier New\",monospace;font-weight:800;letter-spacing:.5px}#mtNativeMain .mt-arcade-game .hud{flex:0 0 auto;display:flex;gap:6px;justify-content:space-between;padding-bottom:6px}#mtNativeMain .mt-arcade-game .chip{font-size:11px;background:#0d0f0b;border:2px solid #E7E3DA;border-radius:3px;padding:4px 7px;white-space:nowrap}#mtNativeMain .mt-arcade-game .chip.o{border-color:#707762;color:#E7E3DA}#mtNativeMain .mt-arcade-game .chip.g{border-color:#707762}#mtNativeMain .mt-arcade-game .gwrap{flex:1 1 auto;min-height:150px;position:relative;display:flex;align-items:flex-start;justify-content:center;padding-top:4px}#mtNativeMain .mt-arcade-game canvas.game{display:block;image-rendering:pixelated;image-rendering:crisp-edges;touch-action:none;border:3px solid #E7E3DA;border-radius:6px;box-shadow:0 0 0 3px #050505,0 0 0 5px #707762;background:#0d0f0b;cursor:crosshair}#mtNativeMain .mt-arcade-game .ov{position:absolute;inset:0;display:none;align-items:center;justify-content:center;pointer-events:none}#mtNativeMain .mt-arcade-game .ov.on{display:flex}#mtNativeMain .mt-arcade-game .panel{pointer-events:auto;background:rgba(5,5,5,.92);border:3px solid #E7E3DA;border-radius:8px;padding:16px 18px;text-align:center;max-width:290px;box-shadow:0 0 0 3px #707762}#mtNativeMain .mt-arcade-game .panel h2{font-size:18px;color:#E7E3DA;margin-bottom:6px}#mtNativeMain .mt-arcade-game .panel p{font-size:13px;color:#cfccc3;margin:4px 0}#mtNativeMain .mt-arcade-game .panel .stars{font-size:28px;letter-spacing:4px;margin:4px 0}#mtNativeMain .mt-arcade-game .panel .row{display:flex;gap:8px;margin-top:12px}#mtNativeMain .mt-arcade-game .bot{flex:0 0 auto;padding:8px 0 10px}#mtNativeMain .mt-arcade-game .cards{display:flex;gap:8px}#mtNativeMain .mt-arcade-game .card{flex:1;background:#12140f;border:1px solid #2c3027;border-radius:10px;padding:7px 10px;min-width:0}#mtNativeMain .mt-arcade-game .card .k{font-size:9.5px;letter-spacing:.6px;text-transform:uppercase;color:#9AA08A;font-weight:700}#mtNativeMain .mt-arcade-game .card .v{font-size:13px;margin-top:3px;line-height:16px}#mtNativeMain .mt-arcade-game .card.sh{background:#707762;color:#050505;border-color:#707762}#mtNativeMain .mt-arcade-game .card.sh .k{color:#050505}#mtNativeMain .mt-arcade-game .ex{font-size:8.5px;background:#050505;color:#E7E3DA;border-radius:3px;padding:1px 4px;margin-left:4px;letter-spacing:.4px;vertical-align:1px}#mtNativeMain .mt-arcade-game .btns{display:flex;gap:8px;margin-top:8px}#mtNativeMain .mt-arcade-game button{font:inherit;cursor:pointer;border:0;border-radius:8px;height:44px;flex:1;font-family:ui-monospace,\"SF Mono\",Menlo,Consolas,monospace;font-weight:800;font-size:12.5px;letter-spacing:.5px}#mtNativeMain .mt-arcade-game button.p{background:#707762;color:#050505;box-shadow:0 4px 0 #414733}#mtNativeMain .mt-arcade-game button.p:active{transform:translateY(2px);box-shadow:0 2px 0 #414733}#mtNativeMain .mt-arcade-game button.s{background:transparent;border:2px solid #E7E3DA;color:#E7E3DA}#mtNativeMain .mt-arcade-game button.t{flex:0 0 auto;padding:0 10px;background:transparent;border:2px solid #707762;color:#9AA08A;font-size:10.5px}#mtNativeMain .mt-arcade-game button:disabled{opacity:.35;cursor:default}#mtNativeMain .mt-arcade-game #toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%) translateY(20px);opacity:0;background:#E7E3DA;color:#050505;font-weight:700;font-size:13px;padding:9px 14px;border-radius:8px;transition:.2s;pointer-events:none;z-index:9}#mtNativeMain .mt-arcade-game #toast.on{opacity:1;transform:translateX(-50%)}@media (max-height:700px){#mtNativeMain .mt-arcade-game .hook{display:none}#mtNativeMain .mt-arcade-game .card .v{font-size:13px}#mtNativeMain .mt-arcade-game button{height:40px}}#mtNativeMain .mt-arcade-game .pbig{font-size:26px;margin:4px 0 6px;color:#E7E3DA}#mtNativeMain .mt-arcade-game .ctl{flex:0 0 auto;display:flex;gap:8px;padding-top:8px}#mtNativeMain .mt-arcade-game button.big{height:60px;background:#E7E3DA;color:#050505;font-size:15px;box-shadow:0 4px 0 #707762;touch-action:none}#mtNativeMain .mt-arcade-game button.big:active{transform:translateY(2px);box-shadow:0 2px 0 #707762}#mtNativeMain .mt-arcade-game .hand{display:flex;white-space:nowrap;align-items:center;gap:3px;margin-top:4px;font-size:10.5px;color:#9AA08A}#mtNativeMain .mt-arcade-game .hand input{width:100%;min-width:0;background:#050505;border:1px solid #2c3027;color:#E7E3DA;border-radius:4px;padding:2px 4px;font:inherit;font-size:16px;height:24px;flex:1}#mtNativeMain .mt-arcade-game .bar2{height:6px;background:#050505;border-radius:2px;margin-top:4px;overflow:hidden}#mtNativeMain .mt-arcade-game .bar2 i{display:block;height:100%;background:#E7E3DA}\n.mt-arcade-game .app{height:calc(100dvh - 240px)!important;min-height:440px;padding:0 3px!important;display:flex;flex-direction:column}.mt-arcade-game button{min-height:44px!important}.mt-arcade-game .sh{display:none!important}.mt-arcade-game .gwrap{min-height:150px}.mt-arcade-game #toast{z-index:1200}.mt-arcade-game :focus-visible{outline:3px solid #E7E3DA;outline-offset:3px}";

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

// ===== SAW DUEL =====
const CW=128,CH=144,N=80,LH=70;
const cv=document.getElementById('game'),ctx=cv.getContext('2d');ctx.imageSmoothingEnabled=false;const $=id=>document.getElementById(id);
function longLog(w,h){return cnv(w,h,x=>{x.fillStyle=PAL.O;x.fillRect(0,0,w,h);x.fillStyle=PAL.y;x.fillRect(0,0,w,1);x.fillStyle=PAL.d;x.fillRect(0,h-1,w,1);for(let i=3;i<w-6;i+=5)x.fillRect(i,2+(i*3)%(h-4),3,1);
  x.fillStyle=PAL.w;x.fillRect(w-4,0,4,h);x.fillStyle=PAL.y;x.fillRect(w-3,2,2,h-4);x.fillStyle=PAL.w;x.fillRect(w-2,4,1,h-8);x.fillStyle=PAL.d;x.fillRect(w-2,Math.floor(h/2),1,1);
  x.clearRect(0,0,1,1);x.clearRect(0,h-1,1,1);x.clearRect(w-1,0,1,1);x.clearRect(w-1,h-1,1,1);});}
const LOGW=84,LOGH=14,LOGX=22,CUTX=64;
const LOGIMG=longLog(LOGW,LOGH);
const SAW=spr(["........................oo....","XxXxXxXxXxXxXxXxXxXxXxXxooOo..".slice(0,30),"xxxxxxxxxxxxxxxxxxxxxxxxoOOo..".slice(0,30),"xxxxxxxxxxxxxxxxxxxxxxxxoo....".slice(0,30),"XXXXXXXXXXXXXXXXXXXXXXXXo.....".slice(0,30)].map(r=>r.padEnd(30,'.')));
const SAWF=cnv(30,5,x=>{x.save();x.scale(1,-1);x.drawImage(SAW,0,-5);x.restore();});
const HORSE=spr(["dddddddddddd","..d......d..",".d........d.",".d........d.","d..........d"]);
function silh(s){return cnv(s.width,s.height,x=>{x.drawImage(s,0,0);x.globalCompositeOperation='source-in';x.fillStyle=PAL.m;x.fillRect(0,0,s.width,s.height);});}
const G_LOG=silh(LOGIMG),G_SAW=silh(SAWF),G_BLOKE=silh(BLOKE);
// ---- challenge from link
function clean(n){return String(n||'').replace(/[^A-Za-z0-9_]/g,'').slice(0,16);}
function readChallenge(){const h=new URLSearchParams(location.hash.slice(1));const t=parseFloat(h.get('t'));const n=clean(h.get('vs'));
  if(t>=0.1&&t<=99&&n)return{name:n,t:Math.round(t*10)/10,fromLink:true};return{name:'Practice',t:14.2,fromLink:false};}
let CH_=readChallenge();
let handle=clean(store.get('mt_saw_handle',''));
let best=store.get('mt_saw_best',0),sawn=store.get('mt_saw_sawn',0);const SHED_EXAMPLE=0,SHED_TARGET=15000;
// ---- state
let S,parts=[],pops=[],shake=0,t=0;
function reset(){S={state:'ready',count:0,tr:0,k:0,last:null,saw:0,sawT:0,ghostDone:false,done:false,T:0,split:0,gsplit:0,wrong:0};parts=[];pops=[];ui();}
function pop(text,x,y,sc=1,col=PAL.f,life=0.9){pops.push({text,x,y,sc,col,t:0,life});}
function burst(x,y,n,cols,sp=50){for(let i=0;i<n;i++){const a=-Math.PI*Math.random(),v=sp*(0.3+Math.random());parts.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:0.3+Math.random()*0.5,t:0,c:cols[i%cols.length]});}}
function start(){reset();S.state='count';S.count=2.4;$('ov').classList.remove('on');beep(440,0.1,'square',0.05);}
function stroke(side){audio();if(S.state==='ready'||S.state==='done'&&false){start();return;}if(S.state!=='race')return;
  if(S.last===side){S.wrong++;pop('ALTERNATE!',CW/2,LH+24,1,PAL.R,0.6);beep(150,0.06,'square',0.04);S.sawT=side==='L'?-2:2;return;}
  S.last=side;S.k++;S.sawT=side==='L'?-7:7;noise(0.05,0.06,2200+Math.random()*800);if(S.k%8===0)beep(600+S.k*4,0.03,'square',0.025);
  burst(CUTX+(side==='L'?-2:2),LH+4+34+Math.min(LOGH,S.k/N*LOGH),3,[PAL.w,PAL.F,PAL.c],40);
  if(S.k>=N)finish();}
function finish(){S.state='done';S.T=Math.round(S.tr*10)/10;S.split=0.001;shake=4;burst(CUTX,LH+4+40,24,[PAL.w,PAL.y,PAL.c,PAL.f],80);noise(0.25,0.12,900);
  sawn++;store.set('mt_saw_sawn',sawn);const nb=!best||S.T<best;if(nb){best=S.T;store.set('mt_saw_best',best);}const win=S.T<CH_.t;
  (win?[523,659,784,1046]:[523,659,523]).forEach((f,i)=>beep(f,0.1,'square',0.05,null,i*0.09));
  $('ph').textContent=win?'You win this one!':`@${CH_.name} edges it`;$('pbig').textContent=`${S.T.toFixed(1)}s`;
  $('pp').textContent=win?`vs @${CH_.name}'s ${CH_.t.toFixed(1)}s. Send it back and they'll race your ghost.`:`${CH_.t.toFixed(1)}s to beat. ${S.T-CH_.t<1.5?'Right on their heels.':'Rematch?'}`;
  $('pp2').textContent=(nb?'New personal best! ':`Your best: ${best.toFixed(1)}s · `)+`${S.wrong?S.wrong+' stuck saw'+(S.wrong>1?'s':''):'clean strokes'}`;
  setTimeout(()=>{if(S.state==='done')$('ov').classList.add('on');},800);ui();}
// ---- update
function update(dt){t+=dt;
  if(S.state==='count'){const before=Math.ceil(S.count);S.count-=dt;const now=Math.ceil(S.count);if(now<before&&now>0)beep(440,0.1,'square',0.05);if(S.count<=0){S.state='race';beep(880,0.25,'square',0.06);pop('SAW!',CW/2,LH-12,3,PAL.f,0.8);}}
  if(S.state==='race'){S.tr+=dt;if(!S.ghostDone&&S.tr>=CH_.t){S.ghostDone=true;S.gsplit=0.001;pop(`@${CH_.name.toUpperCase()} IS THROUGH`,CW/2,30,1,PAL.c,1.4);noise(0.15,0.06,700);}
    if(S.tr>90){S.k=N;finish();}}
  if(S.state==='done'&&!S.ghostDone&&S.T>0){/* ghost still sawing */S.tr+=dt;if(S.tr>=CH_.t){S.ghostDone=true;S.gsplit=0.001;}}
  S.saw+=(S.sawT-S.saw)*Math.min(1,dt*30);
  if(S.split)S.split=Math.min(1,S.split+dt*2.5);if(S.gsplit)S.gsplit=Math.min(1,S.gsplit+dt*2.5);
  for(const p of parts){p.t+=dt;p.vy+=200*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;}parts=parts.filter(p=>p.t<p.life);for(const p of pops)p.t+=dt;pops=pops.filter(p=>p.t<p.life);shake*=Math.pow(0.01,dt);
  if(Math.random()<0.25)hud();}
function ghostProg(){if(S.state==='ready'||S.state==='count')return 0;const f=Math.min(1,S.tr/CH_.t);return f;}
// ---- render
function lane(y0,ghost,prog,split,sawOff){ctx.fillStyle=ghost?'#0e110c':'#141912';ctx.fillRect(0,y0,CW,LH);ctx.fillStyle=ghost?'#1c2018':'#2e3428';ctx.fillRect(0,y0+56,CW,LH-56);ctx.fillStyle=PAL.a;ctx.fillRect(0,y0+56,CW,1);
  const ly=y0+34,a=ghost?0.55:1;ctx.globalAlpha=a;
  ctx.drawImage(HORSE,LOGX+6,y0+48+3);ctx.drawImage(HORSE,LOGX+LOGW-18,y0+48+3);
  const L=ghost?G_LOG:LOGIMG;const cutw=CUTX-LOGX;
  ctx.drawImage(L,0,0,cutw,LOGH,LOGX,ly,cutw,LOGH);
  if(split){ctx.save();ctx.translate(CUTX,ly+LOGH);ctx.rotate(split*0.35);ctx.drawImage(L,cutw,0,LOGW-cutw,LOGH,0+split*6,-LOGH+split*4,LOGW-cutw,LOGH);ctx.restore();}
  else ctx.drawImage(L,cutw,0,LOGW-cutw,LOGH,CUTX,ly,LOGW-cutw,LOGH);
  const depth=Math.round(Math.min(1,prog)*LOGH);if(!split&&depth>0){ctx.fillStyle=PAL.k;ctx.fillRect(CUTX-1,ly,2,depth);}
  if(!split){const sx=Math.round(CUTX-13+sawOff),sy=ly-4+depth;ctx.drawImage(ghost?G_SAW:SAWF,sx,sy);ctx.drawImage(ghost?G_BLOKE:BLOKE,sx+30,y0+56-17);}
  else ctx.drawImage(ghost?G_BLOKE:BLOKE,CUTX+24,y0+56-17);
  ctx.globalAlpha=1;
  // progress bar
  ctx.fillStyle=PAL.k;ctx.fillRect(3,y0+13,CW-6,6);ctx.fillStyle=ghost?PAL.m:PAL.o;ctx.fillRect(4,y0+14,Math.round((CW-8)*Math.min(1,prog)),4);}
function render(){ctx.save();if(shake>0.2)ctx.translate(Math.round((Math.random()-.5)*shake),Math.round((Math.random()-.5)*shake));
  const gp=ghostProg();const gOff=S.state==='race'||(!S.ghostDone&&S.state==='done')?Math.sin(S.tr*Math.PI*N/CH_.t/2)*7:0;
  lane(0,true,gp,S.gsplit,gOff);lane(LH+4,false,S.k/N,S.split,S.saw);
  ctx.fillStyle=PAL.c;ctx.fillRect(0,LH,CW,4);ctx.fillStyle=PAL.o;ctx.fillRect(CW/2-10,LH-3,20,10);ctx.fillStyle=PAL.k;ctx.fillRect(CW/2-9,LH-2,18,8);txt(ctx,'VS',CW/2,LH,1,PAL.f,'center',null);
  txt(ctx,`GHOST @${CH_.name}`.toUpperCase(),3,4,1,PAL.c,'left');txt(ctx,`${CH_.t.toFixed(1)}S`,CW-3,4,1,PAL.m,'right');
  txt(ctx,`YOU @${handle}`.toUpperCase(),3,LH+8,1,PAL.f,'left');txt(ctx,`${(S.state==='done'?S.T:S.tr).toFixed(1)}S`,CW-3,LH+8,1,PAL.c,'right');
  for(const p of parts){ctx.globalAlpha=Math.max(0,1-p.t/p.life);ctx.fillStyle=p.c;ctx.fillRect(Math.round(p.x),Math.round(p.y),1,1);}ctx.globalAlpha=1;
  if(S.state==='count')txt(ctx,String(Math.ceil(S.count)),CW/2,LH+26,3,PAL.f,'center');
  if(S.state==='ready'){if(Math.floor(t*2)%2===0)txt(ctx,'TAP TO START',CW/2,24,2,PAL.c,'center');txt(ctx,'LEFT, RIGHT, LEFT, RIGHT...',CW/2,42,1,PAL.f,'center');}
  for(const p of pops){const k=p.t/p.life;ctx.globalAlpha=k>0.7?(1-k)/0.3:1;txt(ctx,p.text,p.x,Math.round(p.y-k*8),p.sc,p.col,'center');}ctx.globalAlpha=1;
  ctx.restore();}
// ---- input
cv.addEventListener('pointerdown',e=>{e.preventDefault();const r=cv.getBoundingClientRect();if(S.state==='ready'){start();return;}stroke(e.clientX-r.left<r.width/2?'L':'R');});
['touchstart','touchmove','touchend','gesturestart'].forEach(tp=>cv.addEventListener(tp,e=>e.preventDefault(),{passive:false}));
[['bl','L'],['br','R']].forEach(([id,sd])=>{const b=$(id);b.addEventListener('touchstart',e=>e.preventDefault(),{passive:false});b.addEventListener('pointerdown',e=>{e.preventDefault();if(S.state==='ready')start();else stroke(sd);});});
window.addEventListener('keydown',e=>{if(e.repeat)return;if(['ArrowLeft','KeyA'].includes(e.code)){e.preventDefault();S.state==='ready'?start():stroke('L');}if(['ArrowRight','KeyD'].includes(e.code)){e.preventDefault();S.state==='ready'?start():stroke('R');}});
// ---- UI
function link(T){return location.href.split('#')[0]+'#vs='+encodeURIComponent(handle)+'&t='+T.toFixed(1);}
function hud(){$('hl').textContent=`STROKES ${S.k}/${N}`;$('hc').textContent=`YOU ${(S.state==='done'?S.T:S.tr).toFixed(1)}s`;$('ht').textContent=`GHOST ${CH_.t.toFixed(1)}s`;}
function ui(){hud();$('cfrom').textContent=CH_.fromLink?`Friendly challenge from @${CH_.name}`:'Practice ghost';$('cq').textContent=CH_.fromLink?`"Bet you can't beat ${CH_.t.toFixed(1)}s, mate."`:`Practice target: ${CH_.t.toFixed(1)}s`;
  $('best').textContent=best?`Your best: ${best.toFixed(1)}s`:'Your best: none yet';
  const tot=SHED_EXAMPLE+sawn;$('shed').textContent=`${fmt(tot)} / ${fmt(SHED_TARGET)} saws`;$('sbar').style.width=Math.min(100,tot/SHED_TARGET*100)+'%';$('mine').textContent=sawn?`incl. ${fmt(sawn)} of yours`:'Every bit of timber you saw adds to it';}
$('handle').value=handle;$('handle').addEventListener('input',e=>{const v=clean(e.target.value);handle=v;store.set('mt_saw_handle',handle);});
$('again').onclick=$('pa').onclick=()=>start();
$('pi').onclick=()=>invite(`I sawed through in ${S.T.toFixed(1)}s at Saw Duel in the My Timber Shift Arcade. Your go: race my ghost.`,link(S.T));
$('invite').onclick=()=>best?invite(`My best at Saw Duel is ${best.toFixed(1)}s. Race my ghost in the My Timber Shift Arcade.`,link(best)):invite('Fancy a Saw Duel in the My Timber Shift Arcade? Left, right, left, right.',location.href.split('#')[0]);
window.addEventListener('hashchange',()=>{CH_=readChallenge();reset();});
setupMute($('mute'));pixelTitle($('title'),'SAW DUEL');fitCanvas(cv,$('gwrap'),CW,CH);reset();
let last=performance.now(),acc=0;const STEP=1/60;
function frame(now){acc+=Math.min(0.1,(now-last)/1000);last=now;let n=0;while(acc>=STEP&&n<4){update(STEP);acc-=STEP;n++;}if(n===4)acc=0;render();requestAnimationFrame(frame);}
requestAnimationFrame(frame);
window.__saw={state:()=>({state:S.state,k:S.k,tr:S.tr,T:S.T,last:S.last,ghost:CH_,wrong:S.wrong}),stroke,start,link,fast:n=>{for(let i=0;i<n;i++)update(STEP);render();}};

 return ()=>{if(dead)return;dead=true;for(const id of frames)realWindow.cancelAnimationFrame(id);for(const id of timers)realWindow.clearTimeout(id);for(const [t,f,o]of listeners)realWindow.removeEventListener(t,f,o);realDocument.removeEventListener('visibilitychange',visibility);for(const [k,v]of properties){if(v.existed)realWindow[k]=v.value;else delete realWindow[k];}if(AC)AC.close().catch(()=>{});pauseButton.onclick=null;root.replaceChildren();};
}
