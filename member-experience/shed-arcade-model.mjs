// Entertainment records only. No health, food, activity or daily-action writes.
export const arcadeGames=[
 {id:'timber-lob',name:'Timber Lob',hook:'The catapult one.',key:'mt_timberlob_stars',kind:'stars',unit:'stars',progressKey:'mt_timberlob_level'},
 {id:'chop-shop',name:'Chop Shop',hook:'The chopping one.',key:'mt_chop_best',kind:'score',unit:'chopped'},
 {id:'timber',name:'Timber!',hook:'The running one.',key:'mt_timber_best',kind:'score',unit:'m'},
 {id:'stack-the-shed',name:'Stack the Shed',hook:'The stacking one.',key:'mt_stack_best',kind:'score',unit:'points'},
 {id:'saw-duel',name:'Saw Duel',hook:'The sawing one.',key:'mt_saw_best',kind:'time',unit:'s'},
 {id:'timber-smash',name:'Timber Smash',hook:'The ball one.',key:'mt_plank_best',kind:'score',unit:'points'},
 {id:'over-the-shed',name:'Over the Shed',hook:'The batting one.',key:'mt_bat_best',kind:'score',unit:'runs'},
 {id:'shed-fighter',name:'Shed Fighter',hook:'The fighting one.',key:'mt_fight_best',kind:'score',unit:'fights'}
];
export function arcadeDay(at=new Date().toISOString()){return new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/London'}).format(new Date(at));}
export function arcadeGameOfDay(on){return arcadeGames[((Math.floor(Date.parse(on+'T12:00:00Z')/86400000)%arcadeGames.length)+arcadeGames.length)%arcadeGames.length];}
export function arcadeBestLabel(game,value,bests={}){if(game.kind==='stars'){const level=Math.max(Number(bests[game.progressKey])||0,Array.isArray(value)?value.reduce((n,v,i)=>v?Math.max(n,i+1):n,0):0);return level?'Best: level '+level+' cleared':'No best yet. Have a go.';}return typeof value==='number'&&value>0?'Your best: '+value+(game.kind==='time'?'s':' '+game.unit):'No best yet. Have a go.';}

export function arcadeSnapshot(prefs={},at=new Date().toISOString()){
 const saved=prefs.shedArcade||{},on=arcadeDay(at),game=arcadeGameOfDay(on),week=Math.floor((Date.parse(on+'T12:00:00Z')/86400000+3)/7);
 return {version:1,revision:saved.revision||0,on,gameOfDay:game.id,bests:saved.bests||{},muted:saved.muted!==false,nickname:saved.nickname||'',nudge:{week,shown:(saved.nudges||[]).filter(x=>x.week===week),dismissed:!!saved.dismissed?.includes(on)}};
}
export function mergeArcade(previous={},input,at=new Date().toISOString()){
 const next=structuredClone(previous),fail=m=>{throw Object.assign(Error(m),{status:400});};
 next.bests||={};
 if(input.action==='best'){
  const game=arcadeGames.find(g=>g.id===input.game);if(!game)fail('Choose an available game.');
  const old=next.bests[game.key],v=input.value;
  if(game.kind==='stars'){
   if(!Array.isArray(v)||v.length>7||v.some(x=>!Number.isInteger(x)||x<0||x>3))fail('This result could not be saved.');
   next.bests[game.key]=Array.from({length:7},(_,i)=>Math.max(old?.[i]||0,v[i]||0));
  }else{
   if(!Number.isFinite(v)||v<0||v>(game.max??1e9)||(game.kind==='score'&&!Number.isInteger(v)))fail('This result could not be saved.');
   next.bests[game.key]=game.kind==='time'?(v>0?(old>0?Math.min(old,v):v):(old||0)):Math.max(old||0,v);
  }
 }else if(input.action==='progress'){const game=arcadeGames.find(g=>g.id===input.game&&g.progressKey);if(!game||!Number.isInteger(input.value)||input.value<0||input.value>1e9)fail('This level could not be saved.');next.bests[game.progressKey]=Math.max(next.bests[game.progressKey]||0,input.value);
 }else if(input.action==='sound'){if(typeof input.muted!=='boolean')fail('Choose a sound setting.');next.muted=input.muted;}
 else if(input.action==='nickname'){
  if(typeof input.nickname!=='string'||!/^[A-Za-z0-9_]{0,16}$/.test(input.nickname))fail('Use up to 16 letters or numbers for your game nickname.');next.nickname=input.nickname;
 }else if(input.action==='nudge-seen'){
  const snap=arcadeSnapshot({shedArcade:previous},at);if(snap.nudge.dismissed||snap.nudge.shown.some(x=>x.on===snap.on)||snap.nudge.shown.length>=2)return previous;
  next.nudges=[...snap.nudge.shown,{on:snap.on,week:snap.nudge.week}];
 }else if(input.action==='nudge-dismiss'){next.dismissed=[...new Set([...(next.dismissed||[]).slice(-13),arcadeDay(at)])];}
 else fail('Choose an available arcade action.');
 next.version=1;next.revision=(previous.revision||0)+1;next.updatedAt=at;return next;
}
