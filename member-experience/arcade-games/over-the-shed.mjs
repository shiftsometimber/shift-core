const HTML="<div class=\"app\">\n<div class=\"tbar\"><div class=\"tl\"><canvas id=\"title\"></canvas></div></div>\n<div class=\"hook\">Tap to swing the plank. Time it sweet and send it over the shed.</div>\n<div class=\"hud mono\"><span class=\"chip\" id=\"hl\">OUTS 0/3</span><span class=\"chip o\" id=\"hc\">RUNS 0</span><span class=\"chip g\" id=\"ht\">STRIKES 0</span></div>\n<div class=\"gwrap\" id=\"gwrap\"><canvas class=\"game\" id=\"game\" width=\"128\" height=\"176\" aria-label=\"Over the Shed game area\" tabindex=\"0\" role=\"application\"></canvas>\n <div class=\"ov\" id=\"ov\"><div class=\"panel\"><h2 class=\"mono\" id=\"ph\">Time!</h2><div class=\"pbig mono\" id=\"pbig\">0 POINTS</div><p id=\"pp\"></p><p id=\"pp2\" style=\"font-size:11.5px;color:#9AA08A\"></p>\n <div class=\"row\"><button class=\"p\" id=\"pa\">ONE MORE GO</button><button class=\"s\" id=\"pi\">INVITE A MATE</button></div></div></div></div>\n<div class=\"bot\"><div class=\"cards\"><div class=\"card\"><div class=\"k\">Personal best</div><div class=\"v mono\" id=\"best\">Your best: 0 pts</div><div style=\"font-size:10.5px;color:#9AA08A;margin-top:1px\" id=\"bestsub\"></div></div>\n<div hidden=\"\" aria-hidden=\"true\"><span id=\"shed\"></span><span id=\"mine\"></span></div></div>\n<div class=\"btns\"><button class=\"p\" id=\"again\">ONE MORE GO</button><button class=\"s\" id=\"invite\">INVITE A MATE</button><button class=\"t\" id=\"mute\">SOUND ON</button></div></div>\n</div><div id=\"toast\"></div>\n";
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

// ===== OVER THE SHED (batting) =====
const CW=128,CH=176,HZ=50,FOC=216,CAMZ=12,CAMH=6,BOWLZ=18,FENCE=95,SHEDZ=103;
const cv=document.getElementById('game'),ctx=cv.getContext('2d');ctx.imageSmoothingEnabled=false;const $=id=>document.getElementById(id);
function proj(x,z,h){const s=FOC/Math.max(0.5,z+CAMZ);return{x:CW/2+x*s,y:HZ+(CAMH-h)*s,s};}
const PITCHES={straight:{T:1.1,arc:0.5,cv:0,wob:0,lab:''},fast:{T:0.74,arc:0.2,cv:0,wob:0,lab:'FAST ONE!'},slow:{T:1.6,arc:2.6,cv:0,wob:0,lab:'SLOW LOB'},
  curve:{T:1.05,arc:0.6,cv:1.3,wob:0,lab:'CURVER!'},wobble:{T:1.12,arc:0.5,cv:0,wob:0.35,lab:'WOBBLER!'}};
const W_PERF=0.028,W_HIT=0.13,W_SWING=0.165;
// ---- sprites
const PLANK=cnv(64,6,x=>{x.fillStyle=PAL.o;x.fillRect(0,0,64,6);x.fillStyle=PAL.w;x.fillRect(0,0,64,1);x.fillStyle=PAL.d;x.fillRect(0,5,64,1);x.fillStyle=PAL.y;for(let i=3;i<60;i+=5)x.fillRect(i,1+(i*3)%4,3,1);
  x.fillStyle=PAL.s;x.fillRect(62,1,2,4);x.fillStyle=PAL.b;x.fillRect(0,1,14,4);x.fillStyle=PAL.d;for(let i=1;i<14;i+=3)x.fillRect(i,1,1,4);});
// ---- state
let S,parts=[],pops=[],shake=0,t=0,flash=0,slowmo=0,stop=0;
let best=store.get('mt_bat_best',0),longest=store.get('mt_bat_longest',0),oversMine=store.get('mt_bat_overs',0);const SHED_EXAMPLE=0;
function reset(){S={state:'ready',runs:0,outs:0,strikes:0,bases:[0,0,0],pitchN:0,hits:0,overs:0,longHit:0,phase:'wait',pt:0,P:null,ball:null,swing:-1,swung:false,fl:null,landT:0,msgT:0,plan:null};
  parts=[];pops=[];ui();}
function pop(text,x,y,sc=1,col=PAL.f,life=1){pops.push({text,x,y,sc,col,t:0,life});}
function burst(x,y,n,cols,sp=50,g=200){for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,v=sp*(0.3+Math.random());parts.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,g,life:0.4+Math.random()*0.5,t:0,c:cols[i%cols.length]});}}
function start(){reset();S.state='play';[392,523,659].forEach((f,i)=>beep(f,0.07,'square',0.05,null,i*0.07));nextPitch(1.0);}
function pickPitch(){const n=S.pitchN;const pool=['straight','straight','slow'];if(n>=2)pool.push('fast');if(n>=4)pool.push('curve');if(n>=7)pool.push('wobble','fast');if(n>=12)pool.push('curve','wobble','fast');
  const ty=pool[Math.floor(Math.random()*pool.length)],P=PITCHES[ty],ramp=Math.max(0.8,1-n*0.01);
  const wide=n>=3&&Math.random()<0.1;return{ty,T:P.T*(ty==='slow'?1:ramp),arc:P.arc,cv:P.cv*(Math.random()<0.5?-1:1),wob:P.wob,lab:P.lab,xe:wide?(Math.random()<0.5?-1.7:1.7):(Math.random()-.5)*0.6,wide};}
function nextPitch(wait=0.9){S.phase='wind';S.pt=-wait;S.P=pickPitch();S.ball=null;S.swing=-1;S.swung=false;S.fl=null;S.pitchN++;}
// ball position during pitch: q=1 at the sweet spot (z=0.5,h=1)
function pitchPos(q){const P=S.P;const z=BOWLZ-(BOWLZ-0.5)*q,qq=Math.min(q,1);
  const h=2.2-1.2*qq+P.arc*Math.sin(Math.PI*qq)+(q>1?-(q-1)*1.5:0);
  const x=P.xe*q+P.cv*Math.sin(Math.PI*qq)*0.9+P.wob*Math.sin(q*15)*Math.sin(Math.PI*qq);return{x,z,h};}
function swing(){audio();if(S.state==='ready'){start();return;}if(S.state!=='play'||S.swung||S.phase==='flight'||S.phase==='result')return;
  if(S.phase!=='pitch'){if(S.swing<0){S.swing=0;noise(0.08,0.05,700);}return;}// practice swish before the ball leaves: no penalty
  S.swung=true;S.swing=0;noise(0.08,0.05,700);
  const te=S.pt-S.P.T;// seconds early(-) / late(+)
  if(Math.abs(te)>W_SWING){result('miss',te);return;}
  contact(te);}
function contact(te){const P=S.P,a=Math.abs(te);const pos=pitchPos(S.pt/P.T),sp=proj(pos.x,pos.z,pos.h);
  stop=0.06;shake=3;flash=0.12;noise(0.1,0.18,3200);beep(900,0.05,'square',0.06,420);burst(sp.x,sp.y,16,[PAL.w,PAL.s,PAL.y,PAL.c],70);
  if(P.wide&&a>W_PERF){outcome('foul',te,0,0);return;}
  if(a>W_HIT){outcome('foul',te,0,0);return;}
  const q=Math.max(0,1-a/W_SWING),spd=1+(1.1/P.T-1)*0.15;let d=14+112*Math.pow(q,1.2)*spd*(0.95+Math.random()*0.1);
  let ang=te/W_SWING*58;if(a<=W_PERF){d=Math.max(d,110+Math.random()*12);ang*=0.4;[784,988,1175,1568].forEach((f,i)=>beep(f,0.07,'square',0.05,null,0.05+i*0.06));}
  if(Math.abs(ang)>45){outcome('foul',te,d,ang);return;}
  let kind=d>=108&&Math.abs(ang)<16?'shed':d>=FENCE?'hr':d>=70?'triple':d>=45?'double':'single';
  if(kind==='single'&&q<0.32&&Math.random()<0.4)kind='caught';
  outcome(kind,te,d,ang);}
function outcome(kind,te,d,ang){const r=ang*Math.PI/180;S.phase='flight';S.landT=0;
  if(kind==='foul'){d=20+Math.random()*25;const side=te<0?-1:1;ang=side*(55+Math.random()*20);}
  const rr=ang*Math.PI/180,peak=kind==='caught'?14:kind==='foul'?6:3+d*0.12,dur=kind==='caught'?1.6:1.0+d/90;
  S.fl={kind,te,d,ang,dx:Math.sin(rr),dz:Math.cos(rr),peak,dur,t:0,trail:[]};
  const tim=Math.abs(te)<=W_PERF?'PERFECT!':te<0?'EARLY':'LATE';pop(tim,CW/2,150,1,Math.abs(te)<=W_PERF?PAL.F:PAL.m,0.9);
  if(kind==='hr'||kind==='shed'){slowmo=0.9;shake=kind==='shed'?7:5;}}
function land(){const f=S.fl,k=f.kind;S.phase='result';S.msgT=1.5;const lp=proj(f.dx*f.d,0.5+f.dz*f.d,0);
  if(k!=='hr'&&k!=='shed'&&k!=='caught')burst(lp.x,lp.y,8,[PAL.x,PAL.c],18,80);
  if(k==='foul'){if(S.strikes<2)S.strikes++;bigMsg('FOUL',PAL.c,S.strikes<2?'':'STILL 2 STRIKES');beep(330,0.1,'square',0.04,250);}
  else if(k==='caught'){bigMsg('CAUGHT!',PAL.R,'OUT');addOut();}
  else{S.hits++;S.longHit=Math.max(S.longHit,Math.round(f.d));const n=k==='single'?1:k==='double'?2:k==='triple'?3:4;const scored=advance(n);let bonus=0;
    if(k==='shed'){bonus=1;S.overs++;oversMine++;store.set('mt_bat_overs',oversMine);}
    S.runs+=scored+bonus;S.strikes=0;
    const lab={single:'SINGLE!',double:'DOUBLE!',triple:'TRIPLE!',hr:'HOME RUN!',shed:'OVER THE SHED!'}[k];
    bigMsg(lab,k==='shed'||k==='hr'?PAL.F:PAL.f,`${Math.round(f.d)} M${scored+bonus?` · +${scored+bonus} RUN${scored+bonus>1?'S':''}`:''}`);
    const tune=k==='shed'?[523,659,784,1046,1318]:k==='hr'?[523,659,784,1046]:[523,659,784].slice(0,n);tune.forEach((fq,i)=>beep(fq,0.1,'square',0.05,null,i*0.09));}
  ui();}
function advance(n){let runs=0;const nb=[0,0,0];for(let i=2;i>=0;i--)if(S.bases[i]){const to=i+n;if(to>=3)runs++;else nb[to]=1;}if(n>=4)runs++;else nb[n-1]=1;S.bases=nb;return runs;}
function bigMsg(a,col,b){pop(a,CW/2,a.length>10?70:66,a.length>10?1:2,col,1.5);if(b)pop(b,CW/2,84,1,PAL.c,1.5);}
function addOut(){S.outs++;S.strikes=0;shake=Math.max(shake,4);noise(0.25,0.1,500);beep(220,0.3,'sawtooth',0.05,80);if(S.outs>=3){S.msgT=1.3;S.ending=true;}ui();}
function result(kind,te){S.phase='result';S.msgT=1.2;
  if(kind==='miss'){S.strikes++;bigMsg('SWING AND A MISS',PAL.R,S.strikes>=3?'STRIKE 3 · OUT':'STRIKE '+S.strikes);}
  else if(kind==='taken'){S.strikes++;bigMsg('STRIKE!',PAL.R,S.strikes>=3?'STRIKE 3 · OUT':'TAKE A SWING');}
  else if(kind==='wide'){bigMsg('WIDE',PAL.c,'GOOD LEAVE');beep(500,0.06,'square',0.03);}
  if(S.strikes>=3)addOut();else if(kind!=='wide')beep(200,0.15,'square',0.04,150);ui();}
function gameOver(){S.state='over';const nb=S.runs>best;if(nb){best=S.runs;store.set('mt_bat_best',best);}if(S.longHit>longest){longest=S.longHit;store.set('mt_bat_longest',longest);}
  $('ph').textContent='Three outs!';$('pbig').textContent=`${S.runs} RUN${S.runs===1?'':'S'}`;$('pp').textContent='Still counts. Cracking effort.';
  $('pp2').textContent=`${S.hits} hit${S.hits===1?'':'s'} · longest ${S.longHit} m · ${S.overs} over the shed${nb&&S.runs>0?' · new personal best!':` · your best: ${best}`}`;
  setTimeout(()=>{if(S.state==='over')$('ov').classList.add('on');},500);ui();}
// ---- update
function update(dt0){t+=dt0;if(stop>0){stop-=dt0;dt0*=0.05;}let dt=dt0*(slowmo>0?0.35:1);if(slowmo>0)slowmo-=dt0;
  if(S.swing>=0){S.swing+=dt0;if(S.swing>0.45)S.swing=-1;}
  if(S.state==='play'){
    if(S.phase==='wind'){S.pt+=dt;if(S.pt>=0){S.phase='pitch';S.pt=0;if(S.P.lab)pop(S.P.lab,CW/2,40,1,PAL.f,0.8);beep(260,0.05,'triangle',0.04,380);}}
    else if(S.phase==='pitch'){S.pt+=dt;
      if(S.plan!==null&&!S.swung&&S.pt>=S.P.T+S.plan){S.plan=null;swing();}
      if(S.phase==='pitch'){const q=S.pt/S.P.T;if(q>1.18){if(S.P.wide&&!S.swung)result('wide');else if(!S.swung)result('taken');else result('miss',0);}}}
    else if(S.phase==='flight'){const f=S.fl;f.t+=dt;const p=Math.min(1,f.t/f.dur);f.trail.push(flightPos(p));if(f.trail.length>8)f.trail.shift();if(p>=1)land();}
    else if(S.phase==='result'){S.msgT-=dt0;if(S.msgT<=0){if(S.ending)gameOver();else nextPitch();}}}
  for(const p of parts){p.t+=dt;p.vy+=p.g*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;}parts=parts.filter(p=>p.t<p.life);for(const p of pops)p.t+=dt0;pops=pops.filter(p=>p.t<p.life);
  shake*=Math.pow(0.02,dt0);if(flash>0)flash-=dt0;}
function flightPos(p){const f=S.fl;return{x:f.dx*f.d*p,z:0.5+f.dz*f.d*p,h:1+4*f.peak*p*(1-p)-(f.kind==='caught'?0:0)};}
// ---- render
const TREES=[...Array(18)].map((_,i)=>({x:i*7.5-4,h:5+((i*37)%7)}));
function render(){ctx.save();if(shake>0.2)ctx.translate(Math.round((Math.random()-.5)*shake),Math.round((Math.random()-.5)*shake));
  // sky
  const g=[['#0b0d10',0],['#10140f',22],['#1b1a12',38]];for(const[c,y]of g){ctx.fillStyle=c;ctx.fillRect(0,y,CW,HZ+2-y);}
  ctx.fillStyle=PAL.c;for(let i=0;i<24;i++){ctx.globalAlpha=0.2+0.3*Math.abs(Math.sin(t*0.8+i));ctx.fillRect((i*53)%CW,(i*29)%34,1,1);}ctx.globalAlpha=1;
  ctx.fillStyle='#1a1f17';for(const tr of TREES){ctx.fillRect(Math.round(tr.x),HZ+4-tr.h,8,tr.h+2);ctx.fillRect(Math.round(tr.x)+2,HZ+2-tr.h-2,4,2);}
  // ground rows
  for(let y=HZ+1;y<CH;y++){const s=(y-HZ)/CAMH,z=FOC/s-CAMZ;const half=z*s;const band=Math.floor(z/7)%2;
    ctx.fillStyle=z>FENCE?'#1d2219':'#181c15';ctx.fillRect(0,y,CW,1);
    if(z<FENCE){ctx.fillStyle=band?'#2e3428':'#283023';const l=Math.max(0,Math.round(CW/2-half)),r=Math.min(CW,Math.round(CW/2+half));ctx.fillRect(l,y,r-l,1);
      ctx.fillStyle=PAL.c;ctx.globalAlpha=0.55;ctx.fillRect(Math.round(CW/2-half),y,1,1);ctx.fillRect(Math.round(CW/2+half),y,1,1);ctx.globalAlpha=1;}
    if(z<BOWLZ+1.5){const dw=(z<2.2?2.2:1.1)*s;ctx.fillStyle=z<2.2?'#4a3a26':'#3d3a26';ctx.fillRect(Math.round(CW/2-dw),y,Math.round(dw*2),1);}}
  // distance arcs
  for(const[dd,c]of[[45,'#3a4232'],[70,'#3a4232']]){ctx.fillStyle=c;for(let a=-44;a<=44;a+=2){const r=a*Math.PI/180,p=proj(Math.sin(r)*dd,Math.cos(r)*dd,0);ctx.fillRect(Math.round(p.x),Math.round(p.y),1,1);}}
  // fence
  for(let a=-45;a<=45;a+=1){const r=a*Math.PI/180,p=proj(Math.sin(r)*FENCE,Math.cos(r)*FENCE,0),p2=proj(Math.sin(r)*FENCE,Math.cos(r)*FENCE,1.6);ctx.fillStyle=a%6?PAL.O:PAL.d;ctx.fillRect(Math.round(p.x),Math.round(p2.y),2,Math.max(1,Math.round(p.y-p2.y)));}
  // shed
  {const a=proj(-11,SHEDZ,0),b=proj(11,SHEDZ,6),rp=proj(0,SHEDZ,10);const x0=Math.round(a.x),x1=Math.round(b.x),yb=Math.round(a.y),yt=Math.round(b.y);
    ctx.fillStyle=PAL.d;ctx.fillRect(x0,yt,x1-x0,yb-yt);ctx.fillStyle=PAL.y;for(let y=yt+1;y<yb;y+=2)ctx.fillRect(x0,y,x1-x0,1);
    ctx.fillStyle=PAL.n;ctx.beginPath();ctx.moveTo(x0-3,yt+1);ctx.lineTo(CW/2,Math.round(rp.y));ctx.lineTo(x1+3,yt+1);ctx.closePath();ctx.fill();ctx.fillStyle=PAL.c;ctx.fillRect(x0-3,yt,x1-x0+6,1);
    ctx.fillStyle='#1a120c';ctx.fillRect(CW/2-3,yb-7,6,7);ctx.fillStyle=PAL.f;ctx.fillRect(x0+5,yt+3,4,3);ctx.fillRect(x1-9,yt+3,4,3);}
  // plate + mound + bowler
  {const p=proj(0,0,0);ctx.fillStyle=PAL.c;ctx.fillRect(Math.round(p.x-6),Math.round(p.y-2),12,3);ctx.fillRect(Math.round(p.x-4),Math.round(p.y+1),8,1);
    const m=proj(0,BOWLZ,0);ctx.fillStyle='#55432c';ctx.fillRect(Math.round(m.x-10),Math.round(m.y-1),20,3);
    let bob=0;if(S.state==='play'&&S.phase==='wind')bob=Math.round(Math.sin(Math.min(1,(S.P.T*0+S.pt+0.9)/0.9)*Math.PI)*2);
    ctx.drawImage(BLOKE,Math.round(m.x-6),Math.round(m.y-17-bob));
    if(S.state==='play'&&S.phase==='wind'&&S.pt>-0.9){ctx.fillStyle=PAL.c;ctx.fillRect(Math.round(m.x+5),Math.round(m.y-14-bob),2,2);}}
  // sweet-spot target
  if(S.state==='play'&&(S.phase==='pitch'||S.phase==='wind')){const p=proj(0,0.5,1);ctx.strokeStyle=PAL.c;ctx.globalAlpha=0.25+0.15*Math.sin(t*8);ctx.lineWidth=1;ctx.strokeRect(Math.round(p.x-7)+0.5,Math.round(p.y-7)+0.5,14,14);ctx.globalAlpha=1;}
  // ball in pitch
  if(S.state==='play'&&S.phase==='pitch'){const q=S.pt/S.P.T,b=pitchPos(q),p=proj(b.x,b.z,b.h),sh=proj(b.x,b.z,0),r=Math.max(1,Math.round(0.28*p.s));
    ctx.fillStyle='#10130d';ctx.fillRect(Math.round(sh.x-r),Math.round(sh.y),r*2,Math.max(1,Math.round(r/2)));ball(p.x,p.y,r);}
  // ball in flight
  if(S.fl&&(S.phase==='flight')){const f=S.fl;f.trail.forEach((b,i)=>{const p=proj(b.x,b.z,b.h);ctx.globalAlpha=0.1+i*0.07;ctx.fillStyle=PAL.f;ctx.fillRect(Math.round(p.x),Math.round(p.y),1,1);});ctx.globalAlpha=1;
    const b=flightPos(Math.min(1,f.t/f.dur)),p=proj(b.x,b.z,b.h),sh=proj(b.x,b.z,0),r=Math.max(1,Math.round(0.28*p.s));ctx.fillStyle='#10130d';ctx.fillRect(Math.round(sh.x-r),Math.round(sh.y),r*2,1);ball(p.x,p.y,r);}
  for(const p of parts){ctx.globalAlpha=Math.max(0,1-p.t/p.life);ctx.fillStyle=p.c;ctx.fillRect(Math.round(p.x),Math.round(p.y),1,1);}ctx.globalAlpha=1;
  // plank (batter's view)
  drawPlank();
  if(flash>0){ctx.globalAlpha=flash*3;ctx.fillStyle=PAL.c;ctx.fillRect(0,0,CW,CH);ctx.globalAlpha=1;}
  // HUD in canvas: diamond + strikes
  if(S.state!=='ready'){const cx=12,cy=12;const dot=(x,y,on)=>{ctx.fillStyle=PAL.k;ctx.fillRect(x-3,y-3,7,7);ctx.fillStyle=on?PAL.f:PAL.A;ctx.fillRect(x-2,y-2,5,5);};
    dot(cx+7,cy,S.bases[0]);dot(cx,cy-7,S.bases[1]);dot(cx-7,cy,S.bases[2]);ctx.fillStyle=PAL.c;ctx.fillRect(cx-1,cy+6,3,3);
    txt(ctx,'S',CW-26,4,1,PAL.m);for(let i=0;i<3;i++){ctx.fillStyle=i<S.strikes?PAL.R:PAL.A;ctx.fillRect(CW-20+i*6,4,4,5);}
    txt(ctx,'O',CW-26,12,1,PAL.m);for(let i=0;i<3;i++){ctx.fillStyle=i<S.outs?PAL.f:PAL.A;ctx.fillRect(CW-20+i*6,12,4,5);}}
  for(const p of pops){const k=p.t/p.life;ctx.globalAlpha=k>0.75?(1-k)/0.25:1;txt(ctx,p.text,p.x,Math.round(p.y-k*6),p.sc,p.col,'center');}ctx.globalAlpha=1;
  if(S.state==='ready'){if(Math.floor(t*2)%2===0)txt(ctx,'TAP TO BAT',CW/2,100,2,PAL.c,'center');txt(ctx,'TAP AGAIN TO SWING',CW/2,118,1,PAL.m,'center');txt(ctx,'HIT IT IN THE BOX',CW/2,126,1,PAL.m,'center');}
  ctx.restore();}
function ball(x,y,r){x=Math.round(x);y=Math.round(y);ctx.fillStyle=PAL.k;ctx.fillRect(x-r-1,y-r,r*2+2,r*2);ctx.fillRect(x-r,y-r-1,r*2,r*2+2);ctx.fillStyle=PAL.c;ctx.fillRect(x-r,y-r,r*2,r*2);
  if(r>=2){ctx.fillStyle=PAL.R;ctx.fillRect(x-r+1,y-1,1,2);ctx.fillRect(x+r-2,y-1,1,2);}ctx.fillStyle='#fff';ctx.fillRect(x-r,y-r,1,1);}
function plankAngle(){const A0=-1.75,A1=-3.05;if(S.swing<0)return A0+Math.sin(t*3)*0.03;const k=S.swing;if(k<0.1)return A0+(A1-A0)*(k/0.1);if(k<0.25)return A1;return A1+(A0-A1)*Math.min(1,(k-0.25)/0.2);}
function drawPlank(){const px=96,py=174;const a=plankAngle();const draw=(ang,al)=>{ctx.save();ctx.globalAlpha=al;ctx.translate(px,py);ctx.rotate(ang);ctx.drawImage(PLANK,-6,-3);ctx.restore();};
  if(S.swing>=0&&S.swing<0.12){for(let i=1;i<=3;i++)draw(a+i*0.25,0.18);}draw(a,1);ctx.globalAlpha=1;
  ctx.fillStyle=PAL.s;ctx.fillRect(px-6,py-8,7,5);ctx.fillRect(px-2,py-4,7,4);ctx.fillStyle=PAL.r;ctx.fillRect(px-2,py-1,12,2);}
// ---- input
cv.addEventListener('pointerdown',e=>{e.preventDefault();swing();});
['touchstart','touchmove','touchend','gesturestart'].forEach(tp=>cv.addEventListener(tp,e=>e.preventDefault(),{passive:false}));
window.addEventListener('keydown',e=>{if((e.code==='Space'||e.code==='Enter')&&S.state!=='over'){e.preventDefault();if(!e.repeat)swing();}});
// ---- UI
function ui(){$('hl').textContent=`OUTS ${S.outs}/3`;$('hc').textContent=`RUNS ${S.runs}`;$('ht').textContent=`STRIKES ${S.strikes}`;
  $('best').textContent=`Your best: ${best} run${best===1?'':'s'}`;$('bestsub').textContent=longest?`Longest hit: ${longest} m`:'Clear the shed for a bonus run';
  $('shed').textContent=`${fmt(SHED_EXAMPLE+oversMine)} over the shed`;$('mine').textContent=oversMine?`incl. ${fmt(oversMine)} of yours`:'Every big one adds to it';}
$('again').onclick=$('pa').onclick=()=>{$('ov').classList.remove('on');start();};
$('invite').onclick=$('pi').onclick=()=>invite(best?`Beat my ${best} runs at Over the Shed in the My Timber Shed Arcade. Swing the plank.`:'Fancy a go at Over the Shed in the My Timber Shed Arcade? Swing the plank.');
setupMute($('mute'));pixelTitle($('title'),'OVER THE SHED');fitCanvas(cv,$('gwrap'),CW,CH);reset();
let last=performance.now(),acc=0;const STEP=1/60;
function frame(now){acc+=Math.min(0.1,(now-last)/1000);last=now;let n=0;while(acc>=STEP&&n<4){update(STEP);acc-=STEP;n++;}if(n===4)acc=0;render();requestAnimationFrame(frame);}
requestAnimationFrame(frame);
window.__bat={state:()=>({state:S.state,phase:S.phase,runs:S.runs,outs:S.outs,strikes:S.strikes,bases:S.bases,pitch:S.P&&S.P.ty,kind:S.fl&&S.fl.kind,d:S.fl&&Math.round(S.fl.d),hits:S.hits,swing:S.swing}),
  fast:n=>{for(let i=0;i<n;i++)update(STEP);render();},plan:te=>{S.plan=te;},swing,start,force:ty=>{S.P=Object.assign(pickPitch(),{ty,...PITCHES[ty],xe:0,wide:false});}};

 return ()=>{if(dead)return;dead=true;for(const id of frames)realWindow.cancelAnimationFrame(id);for(const id of timers)realWindow.clearTimeout(id);for(const [t,f,o]of listeners)realWindow.removeEventListener(t,f,o);realDocument.removeEventListener('visibilitychange',visibility);for(const [k,v]of properties){if(v.existed)realWindow[k]=v.value;else delete realWindow[k];}if(AC)AC.close().catch(()=>{});pauseButton.onclick=null;root.replaceChildren();};
}
