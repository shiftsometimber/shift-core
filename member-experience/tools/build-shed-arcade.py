"""Convert the supplied games into isolated, lazy native content modules.

Preserves the supplied game mechanics; scopes CSS, storage and lifecycle to a
single shared-shell content node. No eval, iframe, external library or network.
"""
from pathlib import Path
import re,json,hashlib,sys
from lxml import html

source=Path(sys.argv[1]);output=Path(sys.argv[2]);output.mkdir(parents=True,exist_ok=True)
records={}
def scoped(css):
    out=[];at=0
    while at<len(css):
        start=css.find('{',at)
        if start<0:break
        head=css[at:start].strip();depth=1;end=start+1
        while end<len(css) and depth:
            depth+=(css[end]=='{')-(css[end]=='}');end+=1
        body=css[start+1:end-1]
        if head.startswith('@media'):out.append(head+'{'+scoped(body)+'}')
        else:
            selectors=[]
            for selector in head.split(','):
                selector=selector.strip()
                selectors.append('.mt-arcade-game' if selector in ['html','body'] else '.mt-arcade-game '+selector)
            out.append(','.join(selectors)+'{'+body+'}')
        at=end
    return ''.join(out)

runtime=r'''
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
 /* ORIGINAL_GAME */
 return ()=>{if(dead)return;dead=true;for(const id of frames)realWindow.cancelAnimationFrame(id);for(const id of timers)realWindow.clearTimeout(id);for(const [t,f,o]of listeners)realWindow.removeEventListener(t,f,o);realDocument.removeEventListener('visibilitychange',visibility);for(const [k,v]of properties){if(v.existed)realWindow[k]=v.value;else delete realWindow[k];}if(AC)AC.close().catch(()=>{});pauseButton.onclick=null;root.replaceChildren();};
}
'''
for path in sorted(source.glob('*-3nov.html')):
    slug=path.stem.removesuffix('-3nov');text=path.read_text();doc=html.fromstring(text)
    css='\n'.join(doc.xpath('//style/text()'))
    css=scoped(css).replace('.mt-arcade-game','#mtNativeMain .mt-arcade-game').replace('#C8702A','#707762').replace('#8A4A1C','#414733').replace('#F2B33D','#E7E3DA')
    css+='\n.mt-arcade-game .app{height:calc(100dvh - 240px)!important;min-height:440px;padding:0 3px!important;display:flex;flex-direction:column}.mt-arcade-game button{min-height:44px!important}.mt-arcade-game .sh{display:none!important}.mt-arcade-game .gwrap{min-height:150px}.mt-arcade-game #toast{z-index:1200}.mt-arcade-game :focus-visible{outline:3px solid #E7E3DA;outline-offset:3px}'
    script='\n'.join(doc.xpath('//script/text()'))
    for node in doc.xpath('//script|//div[contains(concat(" ",normalize-space(@class)," ")," hdr ")]|//span[contains(concat(" ",normalize-space(@class)," ")," pill ")]'):
        node.getparent().remove(node)
    for node in doc.xpath('//div[contains(concat(" ",normalize-space(@class)," ")," sh ")]'):
        ids=node.xpath('.//*[@id]/@id');node.clear();node.set('hidden','');node.set('aria-hidden','true')
        for identity in ids:
            span=html.Element('span',id=identity);node.append(span)
    for node in doc.xpath('//canvas[contains(@class,"game")]'):
        node.set('tabindex','0');node.set('role','application')
    markup=''.join(html.tostring(node,encoding='unicode') for node in doc.find('body'))
    script=re.sub(r'const store=\{get\(k,d\).*?\n', 'const store=bridge.store;\n',script,count=1)
    script=script.replace("muted=store.get('mt_arcade_muted',false)","muted=store.get('mt_arcade_muted',true)")
    a=script.index('async function invite(');b=script.index('// ---- pixel title',a)
    script=script[:a]+"async function invite(text,link){return bridge.share(text,link);}\n"+script[b:]
    script=re.sub(r'SHED_EXAMPLE=\d+','SHED_EXAMPLE=0',script)
    script=script.replace('mt_loglob_','mt_timberlob_')
    script=script.replace('Shed Arcade','Shift Arcade').replace('SHED ARCADE','SHIFT ARCADE')
    if slug=='saw-duel':
        script=script.replace('if(t>=3&&t<=99&&n)', 'if(t>=0.1&&t<=99&&n)')
        script=script.replace("return{name:'SawdustSteve',t:14.2,fromLink:false}","return{name:'Practice',t:14.2,fromLink:false}")
        script=script.replace("store.get('mt_saw_handle','ShedMate'))||'ShedMate'","store.get('mt_saw_handle',''))")
        script=script.replace("handle=v||'ShedMate'","handle=v")
        script=script.replace("$('cfrom').textContent=`Friendly challenge from @${CH_.name}`;", "$('cfrom').textContent=CH_.fromLink?`Friendly challenge from @${CH_.name}`:'Practice ghost';")
        script=script.replace("$('cq').textContent=`\"Bet you can't beat ${CH_.t.toFixed(1)}s, mate.\"`;", "$('cq').textContent=CH_.fromLink?`\"Bet you can't beat ${CH_.t.toFixed(1)}s, mate.\"`:`Practice target: ${CH_.t.toFixed(1)}s`;")
    # Avoid unsolicited shake effects for reduced-motion users without changing mechanics.
    script=script.replace('ctx.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake)', 'ctx.translate(motion.matches?0:(Math.random()-.5)*shake,motion.matches?0:(Math.random()-.5)*shake)')
    module='const HTML='+json.dumps(markup)+';\nconst CSS='+json.dumps(css)+';\n'+runtime.replace('/* ORIGINAL_GAME */',script)
    (output/(slug+'.mjs')).write_text(module)
    records[slug]={'sourceSHA256':hashlib.sha256(text.encode()).hexdigest(),'moduleSHA256':hashlib.sha256(module.encode()).hexdigest(),'bytes':len(module.encode())}
assets='// Generated from the approved 3 November handover; do not hand-edit.\nexport const arcadeAssets='+json.dumps({p.stem:p.read_text() for p in sorted(output.glob('*.mjs'))},ensure_ascii=False)+';\n'
(output.parent/'shed-arcade-assets.mjs').write_text(assets)
(output.parent/'arcade-source-manifest.json').write_text(json.dumps(records,indent=2)+'\n')
print(json.dumps({'games':len(records),'moduleBytes':sum(x['bytes'] for x in records.values())}))
