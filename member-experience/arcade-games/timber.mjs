const HTML="<div class=\"app\">\n<div class=\"tbar\"><div class=\"tl\"><canvas id=\"title\"></canvas></div></div>\n<div class=\"hook\">Leg it through the woods. Tap to jump, swipe down to duck. Beat your own ghost.</div>\n<div class=\"hud mono\"><span class=\"chip\" id=\"hl\">0 M</span><span class=\"chip o\" id=\"hc\">ACORNS 0</span><span class=\"chip g\" id=\"ht\">GHOST</span></div>\n<div class=\"gwrap\" id=\"gwrap\"><canvas class=\"game\" id=\"game\" width=\"144\" height=\"150\" aria-label=\"Timber! game area\" tabindex=\"0\" role=\"application\"></canvas>\n <div class=\"ov\" id=\"ov\"><div class=\"panel\"><h2 class=\"mono\" id=\"ph\">Time!</h2><div class=\"pbig mono\" id=\"pbig\">0 m</div><p id=\"pp\"></p><p id=\"pp2\" style=\"font-size:11.5px;color:#9AA08A\"></p>\n <div class=\"row\"><button class=\"p\" id=\"pa\">ONE MORE GO</button><button class=\"s\" id=\"pi\">INVITE A MATE</button></div></div></div></div>\n<div class=\"ctl\"><button class=\"big\" id=\"bj\">JUMP \u2191</button><button class=\"big d\" id=\"bd\">DUCK \u2193</button></div>\n<div class=\"bot\"><div class=\"cards\"><div class=\"card\"><div class=\"k\">Personal best</div><div class=\"v mono\" id=\"best\">Your best: 0 m</div><div style=\"font-size:10.5px;color:#9AA08A;margin-top:1px\" id=\"bestsub\"></div></div>\n<div hidden=\"\" aria-hidden=\"true\"><span id=\"shed\"></span><span id=\"mine\"></span></div></div>\n<div class=\"btns\"><button class=\"p\" id=\"again\">ONE MORE GO</button><button class=\"s\" id=\"invite\">INVITE A MATE</button><button class=\"t\" id=\"mute\">SOUND ON</button></div></div>\n</div><div id=\"toast\"></div>\n";
const CSS="#mtNativeMain .mt-arcade-game *{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}#mtNativeMain .mt-arcade-game,#mtNativeMain .mt-arcade-game{height:100%;background:#050505;color:#E7E3DA;font-family:-apple-system,BlinkMacSystemFont,\"Segoe UI\",Roboto,Inter,Arial,sans-serif;overscroll-behavior:none}#mtNativeMain .mt-arcade-game{display:flex;justify-content:center}#mtNativeMain .mt-arcade-game .app{width:100%;max-width:460px;height:100vh;height:100dvh;display:flex;flex-direction:column;padding:0 10px env(safe-area-inset-bottom);user-select:none;-webkit-user-select:none}#mtNativeMain .mt-arcade-game .hdr{flex:0 0 auto;height:46px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #1d1f1a;padding:0 4px}#mtNativeMain .mt-arcade-game .hdr a{color:#9AA08A;text-decoration:none;font-size:14px;width:100px}#mtNativeMain .mt-arcade-game .wm{font-weight:900;font-size:18px;letter-spacing:1.5px;font-family:\"Arial Black\",\"Archivo Black\",Impact,sans-serif}#mtNativeMain .mt-arcade-game .wm i{font-style:normal;color:#707762}#mtNativeMain .mt-arcade-game .badge{width:100px;text-align:right}#mtNativeMain .mt-arcade-game .badge b{display:inline-block;border:1px solid #707762;border-radius:10px;padding:3px 7px;font-size:9.5px;letter-spacing:.5px;white-space:nowrap}#mtNativeMain .mt-arcade-game .tbar{flex:0 0 auto;display:flex;align-items:center;justify-content:space-between;padding:8px 2px 4px;gap:8px}#mtNativeMain .mt-arcade-game .tl{display:flex;flex-direction:column;gap:4px;min-width:0}#mtNativeMain .mt-arcade-game .pill{align-self:flex-start;white-space:nowrap;font-size:10px;font-weight:700;letter-spacing:.4px;color:#050505;background:#E7E3DA;border-radius:4px;padding:2px 6px}#mtNativeMain .mt-arcade-game .hook{font-size:12px;color:#b9b7ae;padding:0 2px 6px}#mtNativeMain .mt-arcade-game .mono{font-family:ui-monospace,\"SF Mono\",Menlo,Consolas,\"Courier New\",monospace;font-weight:800;letter-spacing:.5px}#mtNativeMain .mt-arcade-game .hud{flex:0 0 auto;display:flex;gap:6px;justify-content:space-between;padding-bottom:6px}#mtNativeMain .mt-arcade-game .chip{font-size:11px;background:#0d0f0b;border:2px solid #E7E3DA;border-radius:3px;padding:4px 7px;white-space:nowrap}#mtNativeMain .mt-arcade-game .chip.o{border-color:#707762;color:#E7E3DA}#mtNativeMain .mt-arcade-game .chip.g{border-color:#707762}#mtNativeMain .mt-arcade-game .gwrap{flex:1 1 auto;min-height:150px;position:relative;display:flex;align-items:flex-start;justify-content:center;padding-top:4px}#mtNativeMain .mt-arcade-game canvas.game{display:block;image-rendering:pixelated;image-rendering:crisp-edges;touch-action:none;border:3px solid #E7E3DA;border-radius:6px;box-shadow:0 0 0 3px #050505,0 0 0 5px #707762;background:#0d0f0b;cursor:crosshair}#mtNativeMain .mt-arcade-game .ov{position:absolute;inset:0;display:none;align-items:center;justify-content:center;pointer-events:none}#mtNativeMain .mt-arcade-game .ov.on{display:flex}#mtNativeMain .mt-arcade-game .panel{pointer-events:auto;background:rgba(5,5,5,.92);border:3px solid #E7E3DA;border-radius:8px;padding:16px 18px;text-align:center;max-width:290px;box-shadow:0 0 0 3px #707762}#mtNativeMain .mt-arcade-game .panel h2{font-size:18px;color:#E7E3DA;margin-bottom:6px}#mtNativeMain .mt-arcade-game .panel p{font-size:13px;color:#cfccc3;margin:4px 0}#mtNativeMain .mt-arcade-game .panel .stars{font-size:28px;letter-spacing:4px;margin:4px 0}#mtNativeMain .mt-arcade-game .panel .row{display:flex;gap:8px;margin-top:12px}#mtNativeMain .mt-arcade-game .bot{flex:0 0 auto;padding:8px 0 10px}#mtNativeMain .mt-arcade-game .cards{display:flex;gap:8px}#mtNativeMain .mt-arcade-game .card{flex:1;background:#12140f;border:1px solid #2c3027;border-radius:10px;padding:7px 10px;min-width:0}#mtNativeMain .mt-arcade-game .card .k{font-size:9.5px;letter-spacing:.6px;text-transform:uppercase;color:#9AA08A;font-weight:700}#mtNativeMain .mt-arcade-game .card .v{font-size:13px;margin-top:3px;line-height:16px}#mtNativeMain .mt-arcade-game .card.sh{background:#707762;color:#050505;border-color:#707762}#mtNativeMain .mt-arcade-game .card.sh .k{color:#050505}#mtNativeMain .mt-arcade-game .ex{font-size:8.5px;background:#050505;color:#E7E3DA;border-radius:3px;padding:1px 4px;margin-left:4px;letter-spacing:.4px;vertical-align:1px}#mtNativeMain .mt-arcade-game .btns{display:flex;gap:8px;margin-top:8px}#mtNativeMain .mt-arcade-game button{font:inherit;cursor:pointer;border:0;border-radius:8px;height:44px;flex:1;font-family:ui-monospace,\"SF Mono\",Menlo,Consolas,monospace;font-weight:800;font-size:12.5px;letter-spacing:.5px}#mtNativeMain .mt-arcade-game button.p{background:#707762;color:#050505;box-shadow:0 4px 0 #414733}#mtNativeMain .mt-arcade-game button.p:active{transform:translateY(2px);box-shadow:0 2px 0 #414733}#mtNativeMain .mt-arcade-game button.s{background:transparent;border:2px solid #E7E3DA;color:#E7E3DA}#mtNativeMain .mt-arcade-game button.t{flex:0 0 auto;padding:0 10px;background:transparent;border:2px solid #707762;color:#9AA08A;font-size:10.5px}#mtNativeMain .mt-arcade-game button:disabled{opacity:.35;cursor:default}#mtNativeMain .mt-arcade-game #toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%) translateY(20px);opacity:0;background:#E7E3DA;color:#050505;font-weight:700;font-size:13px;padding:9px 14px;border-radius:8px;transition:.2s;pointer-events:none;z-index:9}#mtNativeMain .mt-arcade-game #toast.on{opacity:1;transform:translateX(-50%)}@media (max-height:700px){#mtNativeMain .mt-arcade-game .hook{display:none}#mtNativeMain .mt-arcade-game .card .v{font-size:13px}#mtNativeMain .mt-arcade-game button{height:40px}}#mtNativeMain .mt-arcade-game .ctl{flex:0 0 auto;display:flex;gap:8px;padding-top:8px}#mtNativeMain .mt-arcade-game button.big{height:58px;background:#E7E3DA;color:#050505;font-size:15px;box-shadow:0 4px 0 #707762;touch-action:none}#mtNativeMain .mt-arcade-game button.big.d{background:#707762;color:#050505;box-shadow:0 4px 0 #4C5243}#mtNativeMain .mt-arcade-game button.big:active{transform:translateY(2px)}#mtNativeMain .mt-arcade-game .pbig{font-size:26px;margin:4px 0 6px;color:#E7E3DA}\n.mt-arcade-game .app{height:calc(100dvh - 240px)!important;min-height:440px;padding:0 3px!important;display:flex;flex-direction:column}.mt-arcade-game button{min-height:44px!important}.mt-arcade-game .sh{display:none!important}.mt-arcade-game .gwrap{min-height:150px}.mt-arcade-game #toast{z-index:1200}.mt-arcade-game :focus-visible{outline:3px solid #E7E3DA;outline-offset:3px}";

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

// ===== TIMBER! endless runner =====
const CW=144,CH=150,GY=126,PX0=26;
const cv=document.getElementById('game'),ctx=cv.getContext('2d');ctx.imageSmoothingEnabled=false;const $=id=>document.getElementById(id);
const RUN1=BLOKE,RUN2=spr(["....aaaa....","...aaaaaa...","...aAAAAa...","...sssss....","...sksks....","...sssss....","..bbbbbbb...","..bbsssbb...","...bbbbb....","..rorooro.s.",".rorooororss","ss.oroorr...","s..rororo...","...AAAAAA...","..AAA..AAA..",".AAA....AAA.","kkk......kk."]);
const DUCK=spr(["............","....aaaa....","...aaaaaa...","...sssss....","...sksks....","..bbbbbbb...","srorooororos","s.rororor..s","..AAAAAAAA..","..AAA..AAA..","..kkk..kkk.."]);
const HAT=spr(["..c..",".aca.","aacaa","ccccc"]);
const ACORN=spr(["..d...",".OOOO.","OyOyOO",".wwww.",".wwwy.","..wy.."]);
const PINE=spr(["......AA......",".....AaaA.....","....AaaaaA....","...AaagaaaA...","....AaaaaA....","...AaagaaaA...","..AaaaaagaaA..","...AaaaaaaA...","..AaagaaaaaA..",".AaaaaaagaaaA.","..AaaaaaaaaA..",".AaagaaaaagaA.","AaaaaaagaaaaaA","AAAAAAAAAAAAAA","......dd......","......dd......","......dd......"]);
const STUMPS=spr(["..wwwwww..",".wyyyyyyw.","wyywwwwyyw","OOwwwwwwOO","OdOOOdOOdO","OOOdOOOOOO","OdOOOOdOOO","dOOOdOOOOd"]);
function trunkSprite(len){return cnv(len,6,x=>{x.fillStyle=PAL.O;x.fillRect(0,0,len,6);x.fillStyle=PAL.y;x.fillRect(0,0,len,1);x.fillStyle=PAL.d;for(let i=2;i<len;i+=4)x.fillRect(i,1+(i%4),2,1);x.fillRect(0,5,len,1);
  x.fillStyle=PAL.A;x.fillRect(0,0,10,6);x.fillStyle=PAL.a;x.fillRect(1,1,7,4);x.fillStyle=PAL.w;x.fillRect(len-2,0,2,6);});}
const TRUNK=trunkSprite(50),BRANCH=cnv(34,6,x=>{x.fillStyle=PAL.O;x.fillRect(0,1,34,4);x.fillStyle=PAL.d;x.fillRect(0,4,34,1);for(let i=3;i<34;i+=5)x.fillRect(i,2,2,1);x.fillStyle=PAL.a;x.fillRect(0,0,6,6);x.fillRect(12,0,4,2);x.fillStyle=PAL.A;x.fillRect(1,1,3,3);});
const GH=[RUN1,RUN2].map(s=>cnv(12,17,x=>{x.drawImage(s,0,0);x.globalCompositeOperation='source-in';x.fillStyle=PAL.c;x.fillRect(0,0,12,17);}));
// ---- state
let S,obs=[],acs=[],parts=[],pops=[],shake=0,t=0;
let best=store.get('mt_timber_best',0),acornsTotal=store.get('mt_timber_acorns',0),dodged=store.get('mt_timber_dodged',0);const SHED_EXAMPLE=0;
function reset(){S={state:'ready',dist:0,sp:72,y:GY,vy:0,ground:true,duck:0,acorns:0,time:0,next:120,passed:false,cause:'',anim:0};obs=[];acs=[];parts=[];pops=[];ui();}
function pop(text,x,y,sc=1,col=PAL.f,life=0.9){pops.push({text,x,y,sc,col,t:0,life});}
function burst(x,y,n,cols,sp=60){for(let i=0;i<n;i++){const a=-Math.PI*Math.random(),v=sp*(0.3+Math.random());parts.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:0.4+Math.random()*0.5,t:0,c:cols[i%cols.length]});}}
function start(){reset();S.state='play';[392,523,659].forEach((f,i)=>beep(f,0.07,'square',0.05,null,i*0.07));pop('LEG IT!',CW/2,30,2,PAL.f,0.9);}
function jump(){audio();if(S.state==='ready'){start();return;}if(S.state!=='play')return;if(S.ground){S.vy=-238;S.ground=false;S.duck=0;beep(520,0.08,'square',0.04,780);}}
function duck(hold){audio();if(S.state!=='play')return;if(S.duck<=0)beep(260,0.06,'triangle',0.04,180);S.duck=hold?99:0.8;if(!S.ground)S.vy=Math.max(S.vy,320);}
function unduck(){if(S.duck>1)S.duck=0;}
// ---- spawning (world distance in px)
function spawn(){const lvl=Math.min(1,S.time/60);const r=Math.random();let type;
  if(S.time<6)type=r<0.6?'log':'stump';else type=r<0.3?'log':r<0.5?'stump':r<0.75?'tree':'branch';
  const x=CW+30;if(type==='log')obs.push({type,x,vx:-(28+lvl*25),rot:0});
  else if(type==='stump')obs.push({type,x});
  else if(type==='branch')obs.push({type,x});
  else obs.push({type,x:CW+70,ang:-Math.PI/2,fall:false,warned:false});
  // acorns
  if(Math.random()<0.7){const n=3+Math.floor(Math.random()*3),hi=type==='log'||type==='stump'?(Math.random()<0.6):false;
    for(let i=0;i<n;i++){const ax=x-40-i*9-(type==='tree'?0:0);acs.push({x:ax+80+(hi?-36:0),y:hi?GY-30-Math.sin(i/(n-1)*Math.PI)*8:GY-9});}}
  const gap=Math.max(62,S.sp*(1.25-lvl*0.35))+Math.random()*S.sp*0.6;S.next=gap;}
// ---- collision helpers
function pbox(){const h=S.duck>0&&S.ground?10:15;return{l:PX0+3,r:PX0+9,t:S.y-h,b:S.y-1};}
function hitCirc(cx,cy,r){const b=pbox();const qx=Math.max(b.l,Math.min(cx,b.r)),qy=Math.max(b.t,Math.min(cy,b.b));return (cx-qx)**2+(cy-qy)**2<r*r;}
function hitRect(l,tp,r,bm){const b=pbox();return b.l<r&&b.r>l&&b.t<bm&&b.b>tp;}
function trunkPts(o){const px=o.x,py=GY-16,pts=[];for(let i=1;i<=12;i++){const d=i*4;pts.push([px+Math.cos(o.ang)*d,py+Math.sin(o.ang)*d]);}return pts;}
function over(cause){S.state='over';S.cause=cause;shake=6;burst(PX0+6,S.y-8,20,[PAL.w,PAL.y,PAL.c,PAL.a],80);noise(0.25,0.12,500);beep(220,0.3,'sawtooth',0.05,80);
  const m=Math.floor(S.dist/12),nb=m>best;if(nb){best=m;store.set('mt_timber_best',best);}acornsTotal+=S.acorns;store.set('mt_timber_acorns',acornsTotal);store.set('mt_timber_dodged',dodged);
  $('ph').textContent={log:'Tripped on the timber!',tree:'Timber! Got you.',branch:'Branch to the bonce!',stump:'Stubbed it!'}[cause]||'Down you go!';
  $('pbig').textContent=`${m} m`;$('pp').textContent=nb&&m>0?'New personal best! Your ghost will run there next time.':`Your best: ${best} m. ${best-m<=30?'So close. Your ghost is just ahead.':'Close one. Have another go.'}`;
  $('pp2').textContent=`${S.acorns} acorn${S.acorns===1?'':'s'} this run · ${acornsTotal>=100?'bobble hat unlocked':`${100-Math.min(100,acornsTotal)} more for the bobble hat`}`;
  setTimeout(()=>{if(S.state==='over')$('ov').classList.add('on');},500);ui();}
// ---- update
function update(dt){t+=dt;if(S.state!=='play'){upFx(dt);return;}
  S.time+=dt;S.sp=Math.min(190,72+S.time*2.7);const dx=S.sp*dt;S.dist+=dx;S.anim+=dx;
  S.next-=dx;if(S.next<=0)spawn();
  if(!S.ground){S.vy+=780*dt;S.y+=S.vy*dt;if(S.y>=GY){S.y=GY;S.vy=0;S.ground=true;burst(PX0+6,GY,4,[PAL.d,PAL.w],25);}}
  if(S.duck>0)S.duck-=dt;
  for(const o of obs){o.x-=dx;if(o.type==='log'){o.x+=o.vx*dt;o.rot-=(S.sp-o.vx)*dt/6;if(!o.dodged&&hitCirc(o.x,GY-6,5))return over('log');}
    else if(o.type==='stump'){if(hitRect(o.x+1,GY-8,o.x+9,GY))return over('stump');}
    else if(o.type==='branch'){if(hitRect(o.x,GY-16,o.x+34,GY-11))return over('branch');}
    else if(o.type==='tree'){if(!o.fall&&o.x<CW+50){o.fall=true;pop('TIMBER!',CW-40,20,2,PAL.R,1.3);beep(140,0.4,'sawtooth',0.04,70);noise(0.3,0.05,700);}
      if(o.fall&&o.ang>-Math.PI){o.av=(o.av||0)+9*dt;o.ang=Math.max(-Math.PI,o.ang-o.av*dt);if(o.ang===-Math.PI&&!o.landed){o.landed=true;shake=3;noise(0.2,0.1,300);burst(o.x-30,GY-10,14,[PAL.a,PAL.g,PAL.w],50);}}
      for(const[x,y]of trunkPts(o))if(hitCirc(x,y,3))return over('tree');}
    if(!o.dodged&&o.x<PX0-24){o.dodged=true;dodged++;}}
  obs=obs.filter(o=>o.x>-60);
  for(const a of acs){a.x-=dx;if(!a.got&&hitCirc(a.x+3,a.y+3,5)){a.got=true;S.acorns++;beep(1046,0.05,'square',0.04,1568);burst(a.x+3,a.y+3,5,[PAL.f,PAL.F],30);}}acs=acs.filter(a=>a.x>-10&&!a.got);
  const m=S.dist/12;if(!S.passed&&best>0&&m>best){S.passed=true;pop('PASSED YOUR GHOST!',CW/2,40,1,PAL.f,1.6);[659,784,988,1319].forEach((f,i)=>beep(f,0.08,'square',0.05,null,i*0.07));}
  if(Math.floor(m/100)>Math.floor((m-dx/12)/100))pop(`${Math.floor(m/100)*100} M!`,CW/2,30,1,PAL.c,1.0);
  upFx(dt);if(Math.random()<0.2)hud();}
function upFx(dt){for(const p of parts){p.t+=dt;p.vy+=200*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;}parts=parts.filter(p=>p.t<p.life);for(const p of pops)p.t+=dt;pops=pops.filter(p=>p.t<p.life);shake*=Math.pow(0.01,dt);}
// ---- render
const FAR=[...Array(14)].map((_,i)=>({x:i*13,y:66+(i*7)%9})),MID=[...Array(9)].map((_,i)=>({x:i*19,y:80+(i*5)%7}));
function render(){ctx.save();if(shake>0.2)ctx.translate(Math.round((Math.random()-.5)*shake),Math.round((Math.random()-.5)*shake));
  [['#0a0c09',40],['#10130e',36],['#161a12',34],['#1f2418',40]].reduce((y,[c,h])=>{ctx.fillStyle=c;ctx.fillRect(0,y,CW,h);return y+h;},0);
  const d=S.dist;ctx.globalAlpha=0.3;for(const p of FAR){const x=((p.x-d*0.15)%182+182)%182-20;ctx.drawImage(PINE,Math.round(x),p.y);}ctx.globalAlpha=0.6;
  for(const p of MID){const x=((p.x-d*0.4)%171+171)%171-20;ctx.drawImage(PINE,Math.round(x),p.y,21,26);}ctx.globalAlpha=1;
  ctx.fillStyle='#3a2a1e';ctx.fillRect(0,GY,CW,CH-GY);ctx.fillStyle=PAL.A;ctx.fillRect(0,GY,CW,2);ctx.fillStyle=PAL.d;for(let i=0;i<30;i++){const x=((i*11-d)%CW+CW)%CW;ctx.fillRect(Math.round(x),GY+4+(i%3)*5,3,1);}
  // ghost of best run
  if(best>0){const gx=PX0+(best*12-d);const inView=gx<CW-8;const sx=inView?gx:CW-16;if(gx>-20){ctx.globalAlpha=inView?0.38:0.25;
      const g=GH[Math.floor(t*8)%2];ctx.drawImage(g,Math.round(sx),GY-17);ctx.globalAlpha=1;
      txt(ctx,inView?'YOUR GHOST':`GHOST ${Math.max(0,Math.round(best-d/12))}M`,Math.min(CW-2,Math.round(sx+6)+ (inView?0:-14)),GY-26,1,PAL.c,inView?'center':'right');}}
  // obstacles
  for(const o of obs){if(o.type==='log'){ctx.save();ctx.translate(Math.round(o.x),GY-6);ctx.rotate(o.rot);ctx.drawImage(LOGEND,-6,-6);ctx.restore();}
    else if(o.type==='stump')ctx.drawImage(STUMPS,Math.round(o.x),GY-8);
    else if(o.type==='branch'){ctx.drawImage(PINE,Math.round(o.x+26),GY-58,28,46);ctx.drawImage(BRANCH,Math.round(o.x),GY-16);}
    else{ // tree: shadow warning, stump, trunk rotating about base
      const land=o.x-50;ctx.globalAlpha=0.35+0.25*Math.sin(t*14);ctx.fillStyle=PAL.k;ctx.fillRect(Math.round(land),GY+1,50,3);ctx.globalAlpha=1;
      if(!o.fall||o.ang>-Math.PI+0.01){ctx.fillStyle=PAL.R;if(Math.floor(t*6)%2)txt(ctx,'!',Math.round(land+20),GY-34,2,PAL.R,'left');}
      ctx.drawImage(STUMPS,Math.round(o.x-5),GY-8);ctx.drawImage(STUMPS,Math.round(o.x-5),GY-16);ctx.save();ctx.translate(Math.round(o.x),GY-16);ctx.rotate(o.ang+Math.PI);ctx.drawImage(TRUNK,-50,-3);
      ctx.drawImage(PINE,-62,-12,18,24);ctx.restore();}}
  for(const a of acs)ctx.drawImage(ACORN,Math.round(a.x),Math.round(a.y));
  // player
  const fr=S.state==='play'&&S.ground?(Math.floor(S.anim/10)%2?RUN1:RUN2):RUN2;const ducking=S.duck>0&&S.ground;
  if(S.state!=='over'||Math.floor(t*10)%2){if(ducking)ctx.drawImage(DUCK,PX0,Math.round(S.y)-11);else ctx.drawImage(S.state==='ready'?RUN1:fr,PX0,Math.round(S.y)-17);
    if(acornsTotal>=100)ctx.drawImage(HAT,PX0+3,Math.round(S.y)-(ducking?13:19));}
  if(S.state==='play'&&S.ground&&S.sp>110){ctx.fillStyle=PAL.c;ctx.globalAlpha=0.4;ctx.fillRect(PX0-8,Math.round(S.y)-10,5,1);ctx.fillRect(PX0-10,Math.round(S.y)-6,5,1);ctx.globalAlpha=1;}
  for(const p of parts){ctx.globalAlpha=Math.max(0,1-p.t/p.life);ctx.fillStyle=p.c;ctx.fillRect(Math.round(p.x),Math.round(p.y),1,1);}ctx.globalAlpha=1;
  for(const p of pops){const k=p.t/p.life;ctx.globalAlpha=k>0.7?(1-k)/0.3:1;txt(ctx,p.text,p.x,Math.round(p.y-k*8),p.sc,p.col,'center');}ctx.globalAlpha=1;
  if(S.state==='ready'){if(Math.floor(t*2)%2===0)txt(ctx,'TAP TO RUN',CW/2,28,2,PAL.c,'center');txt(ctx,'TAP: JUMP  SWIPE DOWN: DUCK',CW/2,48,1,PAL.m,'center');}
  ctx.restore();}
// ---- input
let sy0=null,swiped=false;
cv.addEventListener('pointerdown',e=>{e.preventDefault();sy0=e.clientY;swiped=false;jump();try{cv.setPointerCapture(e.pointerId);}catch(_){}});
cv.addEventListener('pointermove',e=>{if(sy0===null||swiped)return;if(e.clientY-sy0>22){swiped=true;duck();}});
cv.addEventListener('pointerup',()=>{sy0=null;});cv.addEventListener('pointercancel',()=>{sy0=null;});
['touchstart','touchmove','touchend','gesturestart'].forEach(tp=>cv.addEventListener(tp,e=>e.preventDefault(),{passive:false}));
const bj=$('bj'),bd=$('bd');[bj,bd].forEach(b=>{b.addEventListener('touchstart',e=>e.preventDefault(),{passive:false});});
bj.addEventListener('pointerdown',e=>{e.preventDefault();jump();});bd.addEventListener('pointerdown',e=>{e.preventDefault();if(S.state==='ready')start();else duck(true);});['pointerup','pointercancel','pointerleave'].forEach(ev=>bd.addEventListener(ev,unduck));
window.addEventListener('keydown',e=>{if(['Space','ArrowUp','KeyW'].includes(e.code)){e.preventDefault();if(S.state!=='over')jump();}if(['ArrowDown','KeyS'].includes(e.code)){e.preventDefault();if(!e.repeat)duck(true);}});window.addEventListener('keyup',e=>{if(['ArrowDown','KeyS'].includes(e.code))unduck();});
// ---- UI
function hud(){$('hl').textContent=`${Math.floor(S.dist/12)} M`;$('hc').textContent=`ACORNS ${S.acorns}`;$('ht').textContent=best?`GHOST ${best} M`:'NO GHOST YET';}
function ui(){hud();$('best').textContent=`Your best: ${best} m`;$('bestsub').textContent=`Acorns saved: ${acornsTotal}${acornsTotal>=100?' · bobble hat on':' · hat at 100'}`;
  $('shed').textContent=`${fmt(SHED_EXAMPLE+dodged)} trees dodged`;$('mine').textContent=dodged?`incl. ${fmt(dodged)} of yours`:'Every dodge adds to it';}
$('again').onclick=$('pa').onclick=()=>{$('ov').classList.remove('on');start();};
$('invite').onclick=$('pi').onclick=()=>invite(best?`Beat my ${best}m at Timber! in the My Timber Shift Arcade. Mind the trees.`:'Fancy a run at Timber! in the My Timber Shift Arcade? Mind the trees.');
setupMute($('mute'));pixelTitle($('title'),'TIMBER!');fitCanvas(cv,$('gwrap'),CW,CH);reset();
let last=performance.now(),acc=0;const STEP=1/60;
function frame(now){acc+=Math.min(0.1,(now-last)/1000);last=now;let n=0;while(acc>=STEP&&n<4){update(STEP);acc-=STEP;n++;}if(n===4)acc=0;render();requestAnimationFrame(frame);}
requestAnimationFrame(frame);
window.__timber={state:()=>({state:S.state,dist:S.dist,m:Math.floor(S.dist/12),y:S.y,ground:S.ground,duck:S.duck,sp:S.sp,acorns:S.acorns,cause:S.cause,obs:obs.map(o=>({type:o.type,x:o.x,ang:o.ang}))}),jump,duck,start,fast:n=>{for(let i=0;i<n;i++)update(STEP);render();}};

 return ()=>{if(dead)return;dead=true;for(const id of frames)realWindow.cancelAnimationFrame(id);for(const id of timers)realWindow.clearTimeout(id);for(const [t,f,o]of listeners)realWindow.removeEventListener(t,f,o);realDocument.removeEventListener('visibilitychange',visibility);for(const [k,v]of properties){if(v.existed)realWindow[k]=v.value;else delete realWindow[k];}if(AC)AC.close().catch(()=>{});pauseButton.onclick=null;root.replaceChildren();};
}
