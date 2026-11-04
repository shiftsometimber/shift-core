"""Endless progression adapters for the approved game engines.
Bounded level generation keeps an unlimited run from growing saved arrays.
"""
import re
def endless_game(slug,script):
    if slug=='shed-fighter':
        script=script.replace("S.diff=[0.3,0.55,0.85][Math.min(S.ladder,2)];","S.diff=Math.min(.95,[.3,.55,.85][S.ladder%LADDER]+.08*Math.log2(1+Math.floor(S.ladder/LADDER)));")
        script=script.replace("S.opps[S.ladder]","S.opps[S.ladder%LADDER]")
        script=script.replace("S.rt=45;S.state='intro';","const cycle=Math.floor(S.ladder/LADDER);if(cycle){const scale=1+.06*Math.log2(cycle+1);S.C.D={...S.C.D,pow:S.C.D.pow*scale,spd:S.C.D.spd*Math.min(1.2,scale)};S.C.hp=S.C.max=S.C.show=Math.round(S.C.D.hp*scale);}S.rt=45;S.state='intro';")
        script=script.replace("if(S.ladder>=LADDER){clears++;store.set('mt_fight_clears',clears);finish(true);return;}","if(S.ladder%LADDER===0){clears++;store.set('mt_fight_clears',clears);}")
        script=re.sub(r"pop\(\x60FIGHT .*?,CW/2,30,1,PAL.m,1.0\)","pop('FIGHT '+(S.ladder+1),CW/2,30,1,PAL.m,1.0)",script)
        script=re.sub(r"\$\('hl'\)\.textContent=.*?;\$\('hc'\)","$('hl').textContent='FIGHT '+(S.ladder+1);$('hc')",script)
        script=re.sub(r"\$\('best'\)\.textContent=.*?;\$\('bestsub'\)\.textContent=.*?;","$('best').textContent='Your best: '+best+' fights';$('bestsub').textContent='Ladder '+(Math.floor(S.ladder/LADDER)+1)+' · keep climbing';",script)
        script=script.replace("function finish(champ)","function finish()").replace("finish(false)","finish()").replace("champ?'Champion of the Shed!':'Floored!'","'Floored!'")
        script=re.sub(r"\$\('pbig'\)\.textContent=.*?;\$\('pp'\)\.textContent=.*?;","$('pbig').textContent=S.won+' FIGHTS WON';$('pp').textContent='Still counts. Cracking effort.';",script)
        script=script.replace("of $"+"{LADDER}","").replace("OF $"+"{LADDER}","")
        a=script.index("$('invite').onclick=");b=script.index("setupMute(",a)
        script=script[:a]+"$('invite').onclick=$('pi').onclick=()=>invite(best?'I won '+best+' fights at Shed Fighter in Shift Arcade. Your go.':'Fancy a go at Shed Fighter in Shift Arcade?');\n"+script[b:]
    elif slug=='timber-lob':
        a=script.index('// ---- state')
        levels=r"""// Unlimited deterministic stages from the seven approved physics layouts.
const stageCache=new Map();
function levelAt(i){
 if(i<LEVELS.length)return LEVELS[i];
 if(stageCache.has(i))return stageCache.get(i);
 const cycle=Math.floor(i/LEVELS.length),base=LEVELS[(i*5)%LEVELS.length],mirror=cycle%2,shift=.18*Math.sin(i*1.17);
 const level={...base,name:'Round '+(cycle+1),tough:(base.tough||6)+4*(1-1/(1+cycle/4)),b:base.b.map(([t,x,h])=>[t,(mirror?23-x:x)+shift,h])};
 stageCache.set(i,level);if(stageCache.size>8)stageCache.delete(stageCache.keys().next().value);return level;
}
"""
        script=script[:a]+levels+script[a:]
        a=script.index("const SHED_EXAMPLE=",script.index('let starsBest='))
        script=script[:a]+"let bestLevel=Math.max(store.get('mt_timberlob_level',0),starsBest.reduce((n,v,i)=>v?Math.max(n,i+1):n,0));\n"+script[a:]
        script=script.replace("const lv=LEVELS[i]","const lv=levelAt(i)").replace("LEVELS[L]","levelAt(L)")
        script=script.replace("if(st>prev){starsBest[L]=st;store.set('mt_timberlob_stars',starsBest);}","if(L<LEVELS.length&&st>prev){starsBest[L]=st;store.set('mt_timberlob_stars',starsBest);}bestLevel=Math.max(bestLevel,L+1);store.set('mt_timberlob_level',bestLevel);")
        script=script.replace("return i===0||(starsBest[i-1]||0)>0;","return i>=0&&i<=bestLevel;")
        script=re.sub(r"\$\('best'\)\.textContent=.*?;\$\('bestsub'\)\.textContent=.*?;","$('best').textContent=bestLevel?'Your best: level '+bestLevel+' cleared':'No best yet. Have a go.';$('bestsub').textContent='There is always another level';",script)
        script=script.replace("!(L<LEVELS.length-1&&unlocked(L+1))","!unlocked(L+1)")
        script=script.replace("LEVELS.forEach((l,i)=>{","Array.from({length:7},(_,j)=>Math.max(0,L-3)+j).forEach(i=>{const l=levelAt(i);")
        script=re.sub(r"\$\('pn'\)\.style.display=L<LEVELS.length-1\?'':'none';\$\('pp2'\)\.textContent=.*?;","$('pn').style.display='';$('pp2').textContent='Next up: level '+(L+2);",script)
        script=script.replace("if(L<LEVELS.length-1&&unlocked(L+1))","if(unlocked(L+1))")
        script=re.sub(r"\$\('invite'\)\.onclick=.*?;\nsetupMute","$('invite').onclick=()=>invite('I cleared level '+bestLevel+' at Timber Lob in Shift Arcade. Your go.');\nsetupMute",script)
        a=script.index('let startL=0;');b=script.index('\nrequestAnimationFrame(frame);',a)
        script=script[:a]+"loadLevel(bestLevel);"+script[b:]
    return script
