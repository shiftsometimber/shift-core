// Loaded only when a member opens the arcade. Game modules are loaded on Play.
export async function mountArcade(root,s){
 const esc=s.esc,games=s.games,slug=new URL(s.url,location.origin).pathname.split('/')[3],game=games.find(g=>g.id===slug);let destroyed=false,clean=null;
 const style=document.createElement('style');style.textContent=`.mt-arcade-intro{padding:6px 0 16px}.mt-arcade-intro h1{font-family:MyTimberHeading,monospace;font-size:38px;margin:10px 0;color:#E7E3DA}.mt-arcade-intro p{color:#b9b7ae;margin:8px 0}.mt-arcade-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.mt-arcade-tile{border:1px solid #707762;border-radius:14px;padding:12px;background:#12140f;display:flex;flex-direction:column;gap:6px;min-width:0;text-decoration:none}.mt-arcade-tile h2{font-family:MyTimberHeading,monospace;font-size:25px;margin:0;color:#E7E3DA}.mt-arcade-tile p{margin:0;font-size:13px;color:#b9b7ae}.mt-arcade-tile .mt-arcade-play{margin-top:auto;display:block;background:#707762;color:#050505;padding:10px;border-radius:9px;text-align:center;font-weight:800}.mt-arcade-preview{height:78px;width:100%;image-rendering:pixelated;background:#0d0f0b;border-radius:8px}.mt-arcade-game-nav{display:flex;gap:12px;align-items:center;justify-content:space-between;font-size:13px;margin-bottom:10px}.mt-arcade-game-nav a{min-height:44px;display:flex;align-items:center}.mt-arcade-game-nav button{margin-left:auto;min-height:44px}.mt-arcade-game .app{height:calc(100dvh - 240px);min-height:440px;max-width:600px;width:100%;padding:0 3px;display:flex;flex-direction:column}.mt-arcade-game .gwrap{min-height:150px}.mt-arcade-game .sh{display:none!important}.mt-arcade-game canvas.game{max-width:100%}.mt-arcade-game .btns{flex-wrap:wrap}.mt-arcade-game .btns button{min-width:75px}.mt-arcade-game .hud{flex-wrap:wrap}.mt-arcade-game .tbar canvas{max-width:100%;object-fit:contain;object-position:left}.mt-arcade-game [hidden]{display:none!important}@media(min-width:700px){.mt-arcade-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}`;
 root.replaceChildren(style);
 const label=g=>s.bestLabel(g,s.session.state().bests[g.key]);
 function preview(g){const marks={ 'timber-lob':'M14 62 28 20 40 62M28 20 58 36M106 61V39H143V61','chop-shop':'M48 14 87 57M76 20H104L92 38 76 30M57 60H112','timber':'M65 15V42L52 64M65 42 86 64M65 30 45 40M65 30 91 26','stack-the-shed':'M37 65H125M45 51H117M53 37H109M61 23H101','saw-duel':'M26 38H133M35 47 43 38 51 47 59 38 67 47 75 38 83 47 91 38 99 47 107 38 115 47','timber-smash':'M23 16H137M23 29H137M23 42H137M62 66H101','over-the-shed':'M60 17 90 60M39 66H126M125 19V24'};return '<svg class="mt-arcade-preview" viewBox="0 0 160 80" role="img" aria-label="'+esc(g.name)+' pixel-style preview"><path d="'+marks[g.id]+'" stroke="#707762" stroke-width="8" fill="none" stroke-linecap="square"/><circle cx="112" cy="56" r="5" fill="#E7E3DA"/></svg>';}
 if(!game){
  const area=document.createElement('div');area.innerHTML='<header class="mt-arcade-intro"><a href="/member/dashboard#today">‹ Today</a><h1>SHED ARCADE</h1><p>A bit of a laugh. Pick a game and have a go.</p></header><div class="mt-arcade-grid">'+games.map(g=>'<a class="mt-arcade-tile" data-arcade-game="'+g.id+'" href="/member/shed-arcade/'+g.id+'">'+preview(g)+'<h2>'+esc(g.name)+'</h2><p>'+esc(g.hook)+'</p><p data-arcade-best="'+g.id+'">'+esc(label(g))+'</p><span class="mt-arcade-play">PLAY</span></a>').join('')+'</div>';root.append(area);await s.session.sync();
  for(const g of games){const n=root.querySelector('[data-arcade-best="'+g.id+'"]');if(n)n.textContent=label(g);}
 }else{
  const nav=document.createElement('nav');nav.className='mt-arcade-game-nav';nav.setAttribute('aria-label','Game navigation');nav.innerHTML='<a href="/member/dashboard#today">‹ Today</a><a href="/member/shed-arcade">All games</a><button type="button" data-arcade-pause>Pause</button>';
  const area=document.createElement('article');area.className='mt-arcade-game';area.innerHTML='<p role="status">Opening '+esc(game.name)+'…</p>';root.append(nav,area);
  const leave=()=>{destroyed=true;clean?.();};const leaving=()=>leave();document.addEventListener('mt:screen-leaving',leaving,{once:true});
  try{
   await s.session.sync();const source='/assets/member-experience/v7-arcade-'+game.id+'.mjs?v=__V7_NATIVE_ASSET_TAG__',module=await import(source);
   if(!destroyed&&root.isConnected)clean=module.mount(area,{store:{get:s.session.get,set:s.session.set},share:(text,link)=>share(text,link),pauseButton:nav.querySelector('button')});
  }catch{if(!destroyed)area.innerHTML='<h1>'+esc(game.name)+'</h1><p>This game has not been saved on this phone yet. Reconnect and tap Play.</p>';}
  root.addEventListener('mt:arcade-destroy',()=>{leave();document.removeEventListener('mt:screen-leaving',leaving);},{once:true});
 }
 async function share(text,link){
  // Fresh URL allow-list: never forwards arbitrary page queries/account data.
  const url=new URL('/member/shed-arcade/'+game.id,location.origin);
  if(game.id==='saw-duel'&&link){const h=new URLSearchParams(new URL(link,location.origin).hash.slice(1)),t=Number(h.get('t')),nickname=s.session.get('mt_saw_handle','');if(t>0&&t<=99&&/^[A-Za-z0-9_]{1,16}$/.test(nickname))url.hash=new URLSearchParams({vs:nickname,t:t.toFixed(1)}).toString();}
  const payload={title:game.name,text:String(text),url:url.href};
  // This opens only the member-controlled share sheet; no message is sent here.
  try{if(navigator.share){await navigator.share(payload);return;}}catch(e){if(e.name==='AbortError')return;}
  try{await navigator.clipboard.writeText(payload.text+' '+payload.url);s.status('Copied. Choose who to share it with.');}catch{s.status(payload.text+' '+payload.url);}
 }
 return ()=>{destroyed=true;root.dispatchEvent(new Event('mt:arcade-destroy'));clean?.();};
}
