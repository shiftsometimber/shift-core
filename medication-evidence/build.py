from pathlib import Path
from html.parser import HTMLParser
import json,re,html,hashlib,base64,subprocess,shutil
ROOT=Path(__file__).parent; AUDIT=ROOT.parent.parent/'medication-audit'; OUT=AUDIT/'after';OUT.mkdir(exist_ok=True)
D=json.loads((ROOT/'evidence.json').read_text());M=D['medicines'];S=D['studies'];SRC=D['sources'];DATE=D['date'];VERSION='medicine-evidence-20261103-v1'
esc=lambda x:html.escape(str(x),quote=True)
sha=lambda s:hashlib.sha256(s.encode()).hexdigest()
slug=lambda p:p.strip('/').replace('/','--')
plain=lambda s:html.unescape(re.sub('<[^>]+>',' ',s)).strip()

def ref(key):return '<a class="mm-ref" href="#mm-source-'+esc(key)+'">Source</a>'
def refs(keys):return ' '.join(ref(k) for k in dict.fromkeys(keys))
def svg(m,prefix='hero',share=False):
 targets=m['targets'];n=len(targets);cx=260;positions=[(260,270)] if n==1 else ([(130,270),(390,270)] if n==2 else [(90,270),(260,270),(430,270)])
 title=prefix+'-'+m['id']+'-title';desc=prefix+'-'+m['id']+'-desc'
 lines=''.join(f'<path d="M260 136 L{x} {y-48}" stroke="#9CA38F" stroke-width="2" fill="none"/>' for x,y in positions)
 nodes=''.join(f'<circle cx="{x}" cy="{y}" r="49" fill="#171A13" stroke="#AEB69E" stroke-width="2"/><text x="{x}" y="{y+8}" text-anchor="middle" font-size="{24 if len(t[0])<10 else 19}" fill="#E7E3DA" font-weight="700">{esc(t[0])}</text><text x="{x}" y="{y+75}" text-anchor="middle" font-size="19" fill="#E7E3DA">{esc(t[1])}</text>' for (x,y),t in zip(positions,targets))
 label=m['name'].split(' / ')[0];size=29 if len(label)<17 else 23
 return f'<svg class="mm-mechanism" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 375" role="img" aria-labelledby="{title} {desc}"><title id="{title}">{esc(label)}: pathway schematic</title><desc id="{desc}">{esc(label)}: '+esc('; '.join(t[0]+' '+t[1] for t in targets))+f'. This is a receptor or enzyme schematic, not a molecular structure or a forecast of benefit.</desc><circle cx="260" cy="120" r="95" fill="#707762" opacity=".14"/>{lines}<rect x="80" y="72" width="360" height="86" rx="43" fill="#E7E3DA"/><text x="260" y="125" text-anchor="middle" fill="#050505" font-size="{size}" font-weight="750">{esc(label)}</text>{nodes}</svg>'

def mechanism(m,prefix='hero'):
 return f'<figure class="mm-mechanism-figure">{svg(m,prefix)}<figcaption>Original SHIFT schematic. {esc(m["summary"])} {refs(m["sources"][:1])}</figcaption></figure>'

def num(v,unit):
 if isinstance(v,list):return '–'.join(f'{x:.1f}' for x in v)+('%' if unit.startswith('%') else ' '+unit)
 text=f'{v:.1f}' if isinstance(v,float) else str(v)
 return ('−'+text[1:] if text.startswith('-') else '+'+text if v>0 and unit=='signed%' else text)+('%' if unit.startswith('%') or unit=='signed%' else ' '+unit)

def chart(st,prefix='study'):
 signed=st.get('signed',False);allvals=[v for r in st['rows'] for v in (r['value'] if isinstance(r['value'],list) else [r['value']])]
 lo=-30 if signed else 0;hi=5 if signed else (100 if st['unit']=='% of participants' else 30 if st['unit']=='%' else 10)
 at=lambda x:100*(x-lo)/(hi-lo)
 rows=[]
 for i,r in enumerate(st['rows']):
  v=r['value'];span=isinstance(v,list);a,b=v if span else (min(0,v),max(0,v));left=at(a);width=at(b)-at(a)
  label=num(v,'signed%' if signed else st['unit']);barclass='mm-bar-range' if span else ('mm-bar-placebo' if 'placebo' in r['label'].lower() else 'mm-bar-active')
  rows.append(f'<div class="mm-plot-row"><div class="mm-plot-label"><span>{esc(r["label"])}</span><strong>{esc(label)}</strong></div><div class="mm-track"><span class="mm-zero" style="left:{at(0):.3f}%"></span><span class="mm-bar {barclass}" style="left:{left:.3f}%;width:{max(width,.35):.3f}%"></span></div></div>')
 unitlabel='% change from baseline; negative means loss' if signed else st['unit']
 caption=f'{st["title"]} · {st["weeks"]} weeks · {st["measure"]}'
 ticks=[lo+(hi-lo)*i/5 for i in range(6)];axis=''.join(f'<span>{v:g}</span>' for v in ticks)
 table=''.join(f'<tr><th scope="row">{esc(r["label"])}</th><td>{esc(num(r["value"],"signed%" if signed else st["unit"]))}</td></tr>' for r in st['rows'])
 total=f' · {st["randomised"]:,} participants in the whole study' if st.get('randomised') else ''
 return f'<article class="mm-study" data-mm-panel="{esc(st["id"])}"><p class="mm-eyebrow">{esc(st["title"])} · {st["weeks"]} weeks</p><h3>{esc(st["measure"])}</h3><p class="mm-study-context">{esc(st["population"])}{esc(total)}</p><span class="mm-tag">{esc(st["analysis"])}</span><figure class="mm-chart" role="img" aria-label="{esc(caption)}"><div class="mm-plot">'+''.join(rows)+f'</div><div class="mm-axis" aria-hidden="true">{axis}</div><figcaption>{esc(unitlabel)}. Values reproduced from the named source. {ref(st["source"])}</figcaption></figure><details class="mm-number-table"><summary>Read the numbers as a table</summary><div class="mm-table-scroll"><table><caption>{esc(caption)}</caption><thead><tr><th scope="col">Group</th><th scope="col">Reported result</th></tr></thead><tbody>{table}</tbody></table></div></details><p class="mm-note">{esc(st["note"])}</p><p class="mm-small">Funded by {esc(st["sponsor"])}. {'The displayed band spans regimens; it is not an uncertainty interval.' if st.get('range') else 'Point estimates shown; confidence intervals are not plotted.'}</p></article>'

def studies_panel(ids):
 if not ids:return ''
 buttons=''.join(f'<button type="button" data-mm-switch="{esc(id)}" aria-controls="mm-panel-{esc(id)}" aria-pressed="{str(i==0).lower()}">{esc(S[id]["title"])}</button>' for i,id in enumerate(ids))
 charts=[]
 for i,id in enumerate(ids):
  body=chart(S[id]);body=body.replace('<article class="mm-study"','<article id="mm-panel-'+esc(id)+'" '+('hidden ' if i else '')+'class="mm-study"',1);charts.append(body)
 return '<section class="mm-studies" data-mm-study-group><div class="mm-section-title"><p class="mm-eyebrow">Evidence, with its label attached</p><h2>The study, in context.</h2></div>'+('<div class="mm-controls" role="group" aria-label="Choose the study or outcome">'+buttons+'</div>' if len(ids)>1 else '')+''.join(charts)+'</section>'

def access():
 items=[('Authorised use','Which medicine, formulation and indication has the regulator authorised?'),('NHS decision','Does the relevant guidance recommend it for this use and group?'),('Local access','Which service and pathway apply where you live?'),('Actual supply','Can the responsible pharmacy supply the prescribed product now?')]
 return '<section class="mm-access"><p class="mm-eyebrow">Four different questions</p><h2>Approval is only one part of access.</h2><div class="mm-access-grid">'+''.join(f'<article><span class="mm-access-no">0{i+1}</span><h3>{a}</h3><p>{b}</p></article>' for i,(a,b) in enumerate(items))+'</div><p class="mm-small">An answer to one does not settle the others. NHS systems and local services differ. '+refs(['glp1-mhra','nice','nhs-pathway'])+'</p></section>'

def source_list(keys):
 return '<section class="mm-sources"><h2>Sources for this visual update</h2><p class="mm-small">Checked 3 November 2026 unless a different check date is shown. Source checking is not independent clinical review. Older sections keep their own dates.</p><ol>'+''.join(f'<li id="mm-source-{esc(k)}"><a href="{esc(SRC[k]["url"])}">{esc(SRC[k]["label"])}</a><span>{esc(SRC[k]["kind"])} · checked {esc(SRC[k]["checked"])}</span></li>' for k in dict.fromkeys(keys))+'</ol></section>'

def card(m,prefix='card'):
 return f'<article class="mm-med-card" data-mm-med="{esc(m["id"])}"><p class="mm-eyebrow">{esc(m["ingredient"])}</p><h3>{esc(m["name"])}</h3><span class="mm-tag">{esc(m["status"])}</span><p>{esc(m["route"])}</p>{mechanism(m,prefix)}<p>{esc(m["answer"])}</p><p class="mm-small">{esc(m["safety"])}</p><a class="mm-text-link" href="{esc(m["path"])}">Read the full guide</a></article>'

def brand_map():
 ids=['wegovy-injection','wegovy-tablet','ozempic','rybelsus'];return '<section><p class="mm-eyebrow">Same ingredient does not mean the same product</p><h2>Four semaglutide products. Check the purpose.</h2><div class="mm-brand-grid">'+''.join(f'<article><h3>{esc(M[k]["name"])}</h3><p>{esc(M[k]["route"])}</p><strong>{"Weight-management indication" if k.startswith("wegovy") else "Type 2 diabetes indication"}</strong></article>' for k in ids)+'</div><p class="mm-small">This map is about the named UK indications, not personal suitability, dose conversion or permission to switch. '+refs(['glp1-mhra','oral-approval'])+'</p></section>'

def comparison_panel(ids,trial_ids=()):
 a,b=[M[x] for x in ids];has_direct=bool(trial_ids)
 desc='A directly studied comparison is shown below, with its population and limitations.' if has_direct else 'The sources used here do not establish a direct weight-loss trial for this exact pair of products. Separate studies are not a shared league table.'
 keys=list(dict.fromkeys(a['sources']+b['sources']+[S[t]['source'] for t in a['studies']+b['studies']+list(trial_ids)]+['glp1-mhra','nice','nhs-pathway']))
 routine='<section class="mm-routines"><p class="mm-eyebrow">What changes in an ordinary week?</p><h2>Compare the routine, too.</h2><div class="mm-pair">'+''.join(f'<article><h3>{esc(m["name"])}</h3><strong>{esc(m["route"])}</strong><p>{esc(m["summary"])}</p></article>' for m in [a,b])+'</div></section>'
 return '<div class="mm-evidence" data-mm-controller><section class="mm-answer"><p class="mm-eyebrow">A clearer comparison</p><h2>Are we comparing like with like?</h2><p>'+desc+'</p></section><div class="mm-pair">'+card(a,'compare-a')+card(b,'compare-b')+'</div>'+routine+studies_panel(trial_ids)+access()+source_list(keys)+'</div>'

def medicine_panel(ids):
 m=M[ids[0]];trials=[t for id in ids for t in M[id]['studies']];keys=list(dict.fromkeys([k for id in ids for k in M[id]['sources']]+[S[t]['source'] for t in trials]+['glp1-mhra','nice','nhs-pathway']))
 if m['id']=='ozempic':keys.append('oral-approval')
 q='Is Ozempic licensed for weight loss in the UK?' if m['id']=='ozempic' else ('What does the UK position mean for '+m['name']+'?' if m.get('research') else 'What is the UK position for '+m['name']+'?')
 notes=''
 if m['id']=='foundayo':notes='<aside class="mm-source-note"><h3>Keep two primary summaries separate.</h3><p>The published ATTAIN-1 treatment-regimen analysis reports 11.2% mean reduction versus 2.1% with placebo at 72 weeks. The UK product information’s summary gives 12.4% versus 0.9%. The chart uses the published analysis and labels it explicitly; these are not interchangeable figures.</p><p>'+refs(['attain1','foundayo-label'])+'</p></aside>'
 if m['id']=='amycretin':notes='<aside class="mm-source-note"><h3>There is newer research, in a different population.</h3><p>The 2026 phase 2 zenagamtide paper studied 262 adults with type 2 diabetes over 36 weeks. Its primary outcome was HbA1c. It does not turn the early obesity comparison below into a phase 3 weight-loss result.</p><p>'+refs(['amy-diabetes'])+'</p></aside>'
 if m['id']=='cagrisema':notes='<aside class="mm-source-note"><h3>A direct comparison also exists.</h3><p>In the manufacturer-reported, open-label REDEFINE 4 study, CagriSema did not meet its non-inferiority endpoint versus tirzepatide at 84 weeks. The report gives treatment-regimen results of 20.2% and 23.6%, respectively. This is a different study from REDEFINE 1 below.</p><p>'+refs(['redefine4'])+'</p></aside>'
 rows=''.join(f'<div><span>{label}</span><strong>{esc(value)}</strong></div>' for label,value in [('Medicine',m['ingredient']),('Routine',m['route']),('UK position',m['status'])])
 choices=('<p class="mm-note">The injection and tablet views below are separate studies, not a head-to-head trial or a dose conversion.</p>' if len(ids)>1 else '')
 return '<div class="mm-evidence" data-mm-controller><div class="mm-facts">'+rows+'</div><section class="mm-answer"><p class="mm-eyebrow">The short answer</p><h2>'+esc(q)+'</h2><p>'+esc(m['answer'])+' '+refs(m['sources'][:1])+'</p></section>'+notes+choices+(brand_map() if m['id']=='ozempic' else '')+studies_panel(trials)+'<section class="mm-safety"><p class="mm-eyebrow">Read safety beside results</p><h2>What else belongs in the decision?</h2><p>'+esc(m['safety'])+' '+refs(m['sources'][:1])+'</p><p>Ask who handles medicine questions, when the treatment review happens and what support continues if care changes. My Timber supports everyday routines; your prescribing team remains responsible for treatment.</p></section>'+access()+source_list(keys)+'</div>'

def map_table(ids):
 return '<div class="mm-table-scroll" tabindex="0" role="region" aria-label="Medicine identity and UK position"><table><caption>Identity, routine and UK position — not an efficacy ranking</caption><thead><tr><th scope="col">Medicine</th><th scope="col">Routine</th><th scope="col">UK position in checked sources</th><th scope="col">Read</th></tr></thead><tbody>'+''.join(f'<tr><th scope="row">{esc(M[k]["name"])}</th><td>{esc(M[k]["route"])}</td><td>{esc(M[k]["status"])}</td><td><a href="{esc(M[k]["path"])}">Guide</a></td></tr>' for k in ids)+'</tbody></table></div>'

def framework():
 items=[('People','Was the study population relevant to the question?'),('Time','Was follow-up 36, 52, 68, 72 or 80 weeks?'),('Analysis','Were people counted after stopping treatment?'),('Outcome','Mean weight change, responder share and adverse events use different denominators.')]
 return '<section><p class="mm-eyebrow">Read the label on the evidence</p><h2>Four checks before comparing a number.</h2><div class="mm-access-grid">'+''.join(f'<article><span class="mm-access-no">0{i+1}</span><h3>{a}</h3><p>{b}</p></article>' for i,(a,b) in enumerate(items))+'</div><p class="mm-small">A diagram or trial average cannot select treatment for an individual. Read the primary source and discuss suitability with the responsible clinician.</p></section>'

def hub_panel(cfg):
 ids=cfg.get('medicines',[]);keys=list(dict.fromkeys([k for id in ids for k in M[id]['sources']]+[S[t]['source'] for id in ids for t in M[id]['studies']]+['glp1-mhra','oral-approval','foundayo-approval','nice','nhs-pathway']))
 extra=('<div class="mm-hub-cards">'+''.join(card(M[k],'hub') for k in ids)+'</div>'+map_table(ids)) if ids else ''
 return '<div class="mm-evidence" data-mm-controller>'+framework()+extra+access()+source_list(keys)+'</div>'

def comparison_tool(path,cfg,original):
 ids=cfg['medicines'];ids=sorted(ids,key=lambda k:M[k]['name']);default=['retatrutide','cagrisema'] if cfg['mode']=='all' else ['mounjaro','wegovy-injection'];selects=[]
 for side,selected in zip(['a','b'],default):
  options=''.join(f'<option value="{esc(k)}"'+(' selected' if k==selected else '')+'>'+esc(M[k]['name'])+'</option>' for k in ids)
  cards=''.join(card(M[k],side).replace('data-mm-med=',('hidden ' if k!=selected else '')+'data-mm-med=',1) for k in ids)
  selects.append(f'<section data-mm-side="{side}"><label for="mm-select-{side}">Option {side.upper()}</label><select id="mm-select-{side}" data-mm-select>{options}</select><div>{cards}</div></section>')
 title='Compare the evidence.<br>Keep the differences clear.' if cfg['mode']=='all' else 'Compare the routine.<br>Then read the evidence.'
 keys=list(dict.fromkeys([k for id in ids for k in M[id]['sources']]+[S[t]['source'] for id in ids for t in M[id]['studies']]+['glp1-mhra','nice','nhs-pathway','surmount5','step8']))
 original_ids=re.findall(r'\bid=["\']([^"\']+)',original);aliases=''.join('<span class="mm-anchor" id="'+esc(x)+'" aria-hidden="true"></span>' for x in dict.fromkeys(original_ids) if x!='main-content' and not x.startswith('mm-'))
 current='This comparison includes current and investigational medicines. Research results do not establish UK authorisation or a buying route.' if cfg['mode']=='all' else 'Compare authorised products by identity, routine and evidence. Ozempic and Rybelsus are included to explain their diabetes-licence distinction.'
 return '<main id="main-content" data-mm-release="'+VERSION+'" class="mm-tool"><section class="mm-tool-hero"><p class="mm-eyebrow">SHIFT medication evidence</p><h1>'+title+'</h1><p>'+current+'</p><p class="mm-small">Visual evidence update · 3 November 2026. Informational comparison; not a prescribing recommendation.</p></section><div class="mm-evidence" data-mm-controller><section class="mm-answer"><h2>Different studies are not a head-to-head result.</h2><p>The two cards compare product facts. They do not turn separate trial averages into a league table. Read the named population, duration, formulation and analysis before drawing conclusions.</p></section><div class="mm-chooser">'+''.join(selects)+'</div><p class="mm-same" data-mm-same hidden>You have selected the same option twice. Choose a different second option to compare product facts.</p>'+map_table(ids)+framework()+studies_panel(['surmount5','step8'])+access()+'<section class="mm-safety"><h2>Support can continue when treatment changes.</h2><p>My Timber is free to use without a medicine purchase or a change of prescribing service. For food, movement and ordinary routines, start with the support hub. Take medicine decisions to your prescriber.</p><a class="mm-text-link" href="/weight-loss-support-for-men">Explore free support</a><p>For other routes, explore the <a href="/treatment-centre">treatment centre</a> and <a href="/comparisons/lifestyle/lifestyle-vs-medication">lifestyle comparison</a>.</p></section>'+source_list(keys)+aliases+'</div></main>'

CSS='''
[data-mm-release]{--mm-black:#050505;--mm-cream:#E7E3DA;--mm-green:#707762;--mm-ink:#272A23}
[data-mm-release] .mm-evidence,[data-mm-release].mm-tool{font-family:Arial,Helvetica,sans-serif!important;color:#050505!important;background:#E7E3DA!important;line-height:1.65!important}
[data-mm-release] .mm-evidence{width:min(1180px,calc(100% - 48px))!important;margin:0 auto!important;padding:28px 0 48px!important;box-sizing:border-box!important}
[data-mm-release] .mm-evidence *,[data-mm-release] .mm-mechanism-figure *{box-sizing:border-box}
[data-mm-release] .mm-evidence h2{font-size:clamp(27px,3.1vw,42px)!important;line-height:1.12!important;letter-spacing:-.035em!important;margin:10px 0 20px!important;color:#050505!important;font-weight:750!important}
[data-mm-release] .mm-evidence h3{font-size:22px!important;line-height:1.25!important;color:#050505!important;margin:8px 0 14px!important}
[data-mm-release] .mm-evidence p{font-size:17px!important;line-height:1.65!important;color:#272A23!important;margin:12px 0!important;max-width:82ch!important}
[data-mm-release] .mm-evidence a{color:#050505!important;text-decoration:underline!important;text-underline-offset:3px!important}
[data-mm-release] .mm-eyebrow{font-size:11px!important;letter-spacing:.17em!important;text-transform:uppercase!important;font-weight:750!important;line-height:1.5!important;margin:0 0 12px!important}
[data-mm-release] .qr-hero{background:#050505!important;color:#E7E3DA!important;display:grid!important;grid-template-columns:minmax(0,1.05fr) minmax(0,.95fr)!important;align-items:center!important;gap:36px!important;padding:clamp(32px,5vw,64px)!important;border-radius:0!important;min-height:0!important}
[data-mm-release] .qr-hero h1{font-size:clamp(38px,4.8vw,66px)!important;line-height:1.02!important;letter-spacing:-.045em!important;max-width:16ch!important;margin:12px 0 24px!important;color:#E7E3DA!important}
[data-mm-release] .qr-hero p,[data-mm-release] .qr-hero a,[data-mm-release] .qr-hero .accent,[data-mm-release] .qr-hero span{color:#E7E3DA!important}
[data-mm-release] .qr-hero .qr-hero-copy>p{font-size:17px!important;line-height:1.6!important;max-width:64ch!important}
[data-mm-release] .qr-hero .authority-byline,[data-mm-release] .qr-hero .byline-v12,[data-mm-release] .qr-hero .fa-meta{font-size:12px!important;line-height:1.55!important;opacity:.85}
[data-mm-release] .mm-mechanism-figure{margin:0!important;min-width:0!important;width:100%!important;background:#050505!important;padding:14px!important;border-radius:18px!important;color:#E7E3DA!important}
[data-mm-release] .mm-mechanism{width:100%!important;max-width:100%!important;height:auto!important;max-height:390px!important;display:block!important;overflow:visible!important}
[data-mm-release] .mm-mechanism-figure figcaption{font-size:13px!important;line-height:1.55!important;color:#E7E3DA!important;margin:10px 6px 0!important}
[data-mm-release] .mm-mechanism-figure .mm-ref{color:#E7E3DA!important}
[data-mm-release] .mm-facts{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;border-bottom:1px solid #9A9B90!important;padding-bottom:28px!important;gap:20px!important}
[data-mm-release] .mm-facts span{display:block!important;text-transform:uppercase!important;letter-spacing:.13em!important;font-size:11px!important;margin-bottom:8px!important}
[data-mm-release] .mm-facts strong{display:block!important;font-size:18px!important;line-height:1.35!important}
[data-mm-release] .mm-answer{border-left:5px solid #707762!important;padding:16px 24px!important;margin:32px 0!important;background:#F5F2EC!important;border-radius:0 12px 12px 0!important}
[data-mm-release] .mm-answer h2{font-size:27px!important}
[data-mm-release] .mm-studies,[data-mm-release] .mm-access,[data-mm-release] .mm-safety,[data-mm-release] .mm-sources,[data-mm-release] .mm-routines{margin:44px 0!important}
[data-mm-release] .mm-section-title{max-width:700px!important}
[data-mm-release] .mm-study{background:#F6F3ED!important;border:1px solid #9D9F92!important;border-radius:18px!important;padding:clamp(22px,3vw,40px)!important;margin-top:18px!important;min-width:0!important}
[data-mm-release] [hidden]{display:none!important}
[data-mm-release] .mm-controls{display:flex!important;flex-wrap:wrap!important;gap:9px!important;margin:20px 0!important}
[data-mm-release] .mm-controls button{appearance:none!important;border:1px solid #050505!important;color:#050505!important;background:transparent!important;padding:12px 17px!important;border-radius:999px!important;min-height:44px!important;font-family:inherit!important;font-size:14px!important;line-height:1.3!important;cursor:pointer!important;box-shadow:none!important;transform:none!important;white-space:normal!important;text-align:left!important}
[data-mm-release] .mm-controls button[aria-pressed=true]{background:#050505!important;color:#E7E3DA!important}
[data-mm-release] .mm-controls button:focus-visible,[data-mm-release] select:focus-visible{outline:3px solid #707762!important;outline-offset:4px!important}
[data-mm-release] .mm-study-context{font-size:15px!important;max-width:75ch!important}
[data-mm-release] .mm-tag{display:inline-block!important;padding:6px 11px!important;margin:4px 0 10px!important;border:1px solid #707762!important;border-radius:6px!important;font-size:12px!important;line-height:1.4!important;color:#050505!important;background:#E7E3DA!important}
[data-mm-release] .mm-chart{margin:26px 0!important;max-width:none!important}
[data-mm-release] .mm-plot-row{margin:24px 0!important}
[data-mm-release] .mm-plot-label{display:flex!important;align-items:start!important;justify-content:space-between!important;gap:18px!important;font-size:16px!important;line-height:1.4!important;margin-bottom:10px!important}
[data-mm-release] .mm-plot-label strong{white-space:nowrap!important;font-size:20px!important;font-variant-numeric:tabular-nums!important}
[data-mm-release] .mm-track{height:25px!important;position:relative!important;background:repeating-linear-gradient(to right,#DDDAD0 0,#DDDAD0 1px,transparent 1px,transparent 20%)!important;border-bottom:1px solid #CBC9BD!important;overflow:hidden!important;border-radius:3px!important}
[data-mm-release] .mm-bar{position:absolute!important;height:22px!important;display:block!important;top:0!important;border-radius:3px!important}
[data-mm-release] .mm-bar-active{background:#707762!important}
[data-mm-release] .mm-bar-placebo{background:#B8B4AA!important}
[data-mm-release] .mm-bar-range{background:repeating-linear-gradient(45deg,#707762,#707762 5px,#A8AE9A 5px,#A8AE9A 10px)!important;border:1px solid #49503C!important}
[data-mm-release] .mm-zero{position:absolute!important;top:0!important;bottom:0!important;width:1px!important;background:#777B6E!important}
[data-mm-release] .mm-axis{display:flex!important;justify-content:space-between!important;font-size:11px!important;color:#505348!important;margin-top:8px!important;font-variant-numeric:tabular-nums!important}
[data-mm-release] .mm-chart figcaption{font-size:13px!important;line-height:1.55!important;margin-top:16px!important;color:#34372E!important}
[data-mm-release] .mm-ref{font-size:12px!important;font-weight:700!important;white-space:nowrap!important}
[data-mm-release] .mm-note,[data-mm-release] .mm-source-note{padding:18px 20px!important;border:1px solid #9DA18F!important;border-radius:10px!important;margin:22px 0!important;font-size:15px!important;background:#E7E3DA!important}
[data-mm-release] .mm-source-note h3{font-size:20px!important}
[data-mm-release] .mm-small,[data-mm-release] p.mm-small{font-size:13px!important;line-height:1.6!important;color:#484C40!important}
[data-mm-release] .mm-number-table{border-top:1px solid #BBBDAF!important;margin-top:24px!important;padding-top:18px!important}
[data-mm-release] .mm-number-table summary{font-weight:700!important;font-size:15px!important;cursor:pointer!important;min-height:35px!important}
[data-mm-release] .mm-table-scroll{max-width:100%!important;overflow-x:auto!important;margin:26px 0!important}
[data-mm-release] .mm-evidence table{width:100%!important;border-collapse:collapse!important;font-size:14px!important;line-height:1.5!important;margin:0!important;background:transparent!important;color:#050505!important}
[data-mm-release] .mm-evidence th,[data-mm-release] .mm-evidence td{padding:14px!important;border:1px solid #A9AD9C!important;text-align:left!important;vertical-align:top!important;white-space:normal!important}
[data-mm-release] .mm-evidence th{font-weight:700!important;background:#DADDCF!important;color:#050505!important}
[data-mm-release] .mm-evidence caption{padding:0 0 10px!important;text-align:left!important;font-size:12px!important;font-weight:700!important;color:#34372D!important}
[data-mm-release] .mm-access-grid,[data-mm-release] .mm-brand-grid{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:18px!important;margin:26px 0!important}
[data-mm-release] .mm-access-grid article,[data-mm-release] .mm-brand-grid article{padding:22px!important;background:#F4F1E9!important;border:1px solid #A4A895!important;border-radius:12px!important;min-width:0!important}
[data-mm-release] .mm-access-no{font-size:31px!important;color:#515A3F!important;line-height:1!important;font-weight:750!important}
[data-mm-release] .mm-access-grid p{font-size:15px!important;margin-bottom:0!important}
[data-mm-release] .mm-pair,[data-mm-release] .mm-chooser{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:22px!important;margin:30px 0!important}
[data-mm-release] .mm-med-card{padding:24px!important;background:#F5F2EB!important;border:1px solid #999E8C!important;border-radius:14px!important;min-width:0!important;overflow:hidden!important}
[data-mm-release] .mm-med-card h3{font-size:28px!important;letter-spacing:-.025em!important}
[data-mm-release] .mm-med-card .mm-mechanism-figure{margin:18px 0!important}
[data-mm-release] .mm-med-card .mm-mechanism{max-height:300px!important}
[data-mm-release] .mm-med-card p{font-size:15px!important}
[data-mm-release] .mm-hub-cards{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:22px!important;margin:34px 0!important}
[data-mm-release] .mm-text-link{display:inline-block!important;font-weight:700!important;padding:8px 0!important;margin:5px 0!important}
[data-mm-release] .mm-sources{border-top:1px solid #919A80!important;padding-top:28px!important}
[data-mm-release] .mm-sources ol{margin:20px 0!important;padding-left:24px!important}
[data-mm-release] .mm-sources li{font-size:14px!important;margin:15px 0!important;overflow-wrap:anywhere!important}
[data-mm-release] .mm-sources li span{display:block!important;font-size:12px!important;color:#4A4F40!important;margin-top:3px!important}
[data-mm-release].mm-tool{max-width:none!important;padding:0!important}
[data-mm-release] .mm-tool-hero{background:#050505!important;color:#E7E3DA!important;padding:clamp(32px,6vw,76px)!important;min-height:0!important}
[data-mm-release] .mm-tool-hero h1{font-size:clamp(38px,5.5vw,72px)!important;line-height:1.02!important;letter-spacing:-.045em!important;max-width:19ch!important;color:#E7E3DA!important;margin:18px 0 26px!important}
[data-mm-release] .mm-tool-hero p{max-width:74ch!important;font-size:18px!important;line-height:1.6!important;color:#E7E3DA!important}
[data-mm-release] .mm-chooser label{display:block!important;font-weight:700!important;font-size:13px!important;letter-spacing:.1em!important;text-transform:uppercase!important;margin-bottom:10px!important}
[data-mm-release] .mm-chooser select{width:100%!important;padding:14px 16px!important;font-size:17px!important;background:#F6F3ED!important;border:1px solid #050505!important;border-radius:7px!important;color:#050505!important;min-height:52px!important;margin-bottom:18px!important}
[data-mm-release] .mm-chooser section{min-width:0!important}
[data-mm-release] .mm-same{padding:18px!important;border:1px solid #707762!important;border-radius:8px!important}
[data-mm-release] .mm-anchor{display:block!important;height:0!important}
@media(max-width:700px){[data-mm-release] .qr-hero{grid-template-columns:1fr!important;gap:24px!important;padding:30px 24px!important}[data-mm-release] .qr-hero h1{font-size:43px!important;max-width:18ch!important}[data-mm-release] .qr-hero .mm-mechanism{max-height:270px!important}[data-mm-release] .mm-evidence{width:calc(100% - 36px)!important;padding-top:22px!important}[data-mm-release] .mm-facts{grid-template-columns:1fr!important;gap:14px!important}[data-mm-release] .mm-facts>div{border-bottom:1px solid #CCCDBF!important;padding-bottom:12px!important}[data-mm-release] .mm-facts>div:last-child{border:0!important}[data-mm-release] .mm-facts strong{font-size:17px!important}[data-mm-release] .mm-access-grid,[data-mm-release] .mm-brand-grid,[data-mm-release] .mm-pair,[data-mm-release] .mm-hub-cards,[data-mm-release] .mm-chooser{grid-template-columns:1fr!important;gap:18px!important}[data-mm-release] .mm-answer{padding:16px 18px!important}[data-mm-release] .mm-answer h2{font-size:25px!important}[data-mm-release] .mm-study{padding:22px 18px!important}[data-mm-release] .mm-study h3{font-size:23px!important}[data-mm-release] .mm-plot-label{font-size:14px!important;gap:12px!important}[data-mm-release] .mm-plot-label strong{font-size:17px!important}[data-mm-release] .mm-med-card{padding:20px!important}[data-mm-release] .mm-table-scroll table{min-width:480px!important}[data-mm-release] .mm-number-table .mm-table-scroll table{min-width:0!important}[data-mm-release] .mm-controls button{font-size:13px!important;padding:12px 14px!important}[data-mm-release] .mm-tool-hero{padding:34px 24px!important}[data-mm-release] .mm-tool-hero h1{font-size:43px!important}[data-mm-release] .mm-tool-hero p{font-size:17px!important}}
@media print{[data-mm-release] .mm-study[hidden],[data-mm-release] .mm-number-table{display:block!important}[data-mm-release] .mm-controls,[data-mm-release] .mm-chooser select{display:none!important}[data-mm-release] .mm-evidence{width:100%!important}[data-mm-release] .mm-study{break-inside:avoid!important}}
'''
# Existing public closeout CSS uses seven repeated IDs to reset all descendants.
# Scope the new evidence styles above that reset without changing old content.
CSS=CSS.replace('[data-mm-release]', ':is('+ '#main-content'*8 +',[data-mm-release])[data-mm-release]')
CONTROLLER='''(()=>{for(const root of document.querySelectorAll('[data-mm-controller]')){if(root.dataset.mmBound)continue;root.dataset.mmBound='true';for(const group of root.querySelectorAll('[data-mm-study-group]')){for(const button of group.querySelectorAll('[data-mm-switch]'))button.addEventListener('click',()=>{for(const panel of group.querySelectorAll('[data-mm-panel]'))panel.hidden=panel.dataset.mmPanel!==button.dataset.mmSwitch;for(const control of group.querySelectorAll('[data-mm-switch]'))control.setAttribute('aria-pressed',String(control===button));});}const sync=()=>{const picks=[];for(const side of root.querySelectorAll('[data-mm-side]')){const select=side.querySelector('[data-mm-select]');picks.push(select.value);for(const card of side.querySelectorAll('[data-mm-med]'))card.hidden=card.dataset.mmMed!==select.value;}const same=root.querySelector('[data-mm-same]');if(same)same.hidden=picks.length!==2||picks[0]!==picks[1];};for(const select of root.querySelectorAll('[data-mm-select]'))select.addEventListener('change',sync);sync();}})();'''

class Nodes(HTMLParser):
 VOID={'area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'}
 def __init__(self,s):super().__init__(convert_charrefs=False);self.s=s;self.lineStarts=[0];self.nodes=[];self.stack=[];self.lineStarts+=[m.end() for m in re.finditer('\n',s)];self.feed(s)
 def pos(self):l,c=self.getpos();return self.lineStarts[l-1]+c
 def handle_starttag(self,t,a):
  start=self.pos();n=dict(tag=t,attrs=dict(a),start=start,openend=start+len(self.get_starttag_text()),end=None);self.nodes.append(n)
  if t not in self.VOID:self.stack.append(n)
  else:n['end']=n['openend']
 def handle_startendtag(self,t,a):self.handle_starttag(t,a);self.nodes[-1]['end']=self.nodes[-1]['openend'];self.stack=[x for x in self.stack if x is not self.nodes[-1]]
 def handle_endtag(self,t):
  for i in range(len(self.stack)-1,-1,-1):
   if self.stack[i]['tag']==t:
    self.stack[i]['end']=self.s.find('>',self.pos())+1;self.stack=self.stack[:i];break

def main_of(s):
 m=re.search(r'<main\b[\s\S]*?</main>',s,re.I);assert m,'One main required';return m.group(0)
def get_sources(cfg):
 ids=cfg.get('medicines',[]);return list(dict.fromkeys([k for id in ids for k in M[id]['sources']]+[S[t]['source'] for t in cfg.get('studies',[])]))
def improve_main(p,old,cfg):
 if cfg['kind']=='benchmark':return old
 if cfg['kind']=='comparison-tool':return comparison_tool(p,cfg,old).replace('</main>','<script data-mm-controller-script>'+CONTROLLER+'</script></main>')
 s=old
 if cfg['kind']=='comparison':
  a,b=[M[k] for k in cfg['medicines']]
  rows=[('Active ingredient',a['ingredient'],b['ingredient']),('Routine',a['route'],b['route']),('UK position',a['status'],b['status']),('Pathway schematic','; '.join(' '.join(x) for x in a['targets']),'; '.join(' '.join(x) for x in b['targets'])),('Evidence anchor',S[a['studies'][0]]['title'] if a['studies'] else 'Read the product indication',S[b['studies'][0]]['title'] if b['studies'] else 'Read the product indication')]
  table='<table><caption>Product facts; not an efficacy scorecard</caption><thead><tr><th scope="col">Question</th><th scope="col">'+esc(a['name'])+'</th><th scope="col">'+esc(b['name'])+'</th></tr></thead><tbody>'+''.join('<tr><th scope="row">'+esc(x)+'</th><td>'+esc(y)+'</td><td>'+esc(z)+'</td></tr>' for x,y,z in rows)+'</tbody></table>'
  s=re.sub(r'<table\b[\s\S]*?</table>',lambda _:table,s,count=1)
 if p=='/medication-comparison-methodology':s=s.replace('anchor relative efficacy','explain reported outcomes')
 nodes=Nodes(s);hero=next((n for n in nodes.nodes if n['tag']=='section' and 'qr-hero' in n['attrs'].get('class','').split()),None)
 panel=medicine_panel(cfg['medicines']) if cfg['kind']=='medicine' else comparison_panel(cfg['medicines'],cfg.get('studies',[])) if cfg['kind']=='comparison' else hub_panel(cfg)
 if hero:
  block=s[hero['start']:hero['end']]
  if cfg['kind']=='medicine':
   med=M[cfg['medicines'][0]]
   if med.get('hero'):block=re.sub(r'(<h1\b[^>]*>)[\s\S]*?</h1>',lambda m:m[1]+esc(med['hero'][0])+'<br><span>'+esc(med['hero'][1])+'</span></h1>',block,count=1)
   decor=next((n for n in Nodes(block).nodes if n['tag']=='div' and 'qr-graphic' in n['attrs'].get('class','').split()),None)
   if decor and decor['end']:block=block[:decor['start']]+mechanism(med)+block[decor['end']:]
  elif cfg['kind']=='comparison':
   decor=next((n for n in Nodes(block).nodes if n['tag']=='div' and 'qr-graphic' in n['attrs'].get('class','').split()),None)
   if decor and decor['end']:
    a,b=[M[id] for id in cfg['medicines']];art='<figure class="mm-mechanism-figure"><svg class="mm-mechanism" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 300" role="img" aria-labelledby="mm-compare-art-title"><title id="mm-compare-art-title">Compare identity, routine and evidence</title><rect x="20" y="35" width="480" height="98" rx="18" fill="#E7E3DA"/><rect x="20" y="165" width="480" height="98" rx="18" fill="#707762"/><text x="45" y="78" fill="#050505" font-size="28" font-weight="700">'+esc(a['name'])+'</text><text x="45" y="111" fill="#050505" font-size="19">'+esc(a['route'])+'</text><text x="45" y="208" fill="#FFFFFF" font-size="28" font-weight="700">'+esc(b['name'])+'</text><text x="45" y="241" fill="#FFFFFF" font-size="19">'+esc(b['route'])+'</text></svg><figcaption>Product routines, not a ranking of clinical benefit.</figcaption></figure>'
    block=block[:decor['start']]+art+block[decor['end']:]
  s=s[:hero['start']]+block+panel+s[hero['end']:]
 else:
  h=re.search(r'<h1\b[\s\S]*?</h1>',s);assert h;s=s[:h.end()]+panel+s[h.end():]
 # Resolve an existing label/paper ambiguity explicitly, rather than repeating a mismatched analysis.
 if p=='/foundayo':
  before='In the intention-to-treat results reported in the UK product information, average weight loss was 12.4% in the highest-dose trial group and 0.9% with placebo.'
  after='The UK product information summarises average weight loss as 12.4% in the highest-dose trial group and 0.9% with placebo. The published treatment-regimen analysis reports 11.2% and 2.1%; the visual evidence panel above keeps those primary-source summaries separate.'
  assert before in s;s=s.replace(before,after)
 # A mathematical personal-weight conversion is not needed to understand a trial average.
 if p=='/guides/cagrisema-uk-guide':
  s=re.sub(r'<p>For context only, somebody starting at 20 stone[\s\S]*?</p>','<p>A trial average is not a personal weight-loss target. Read the population, analysis, adverse events and follow-up together.</p>',s,count=1)
 s=re.sub(r'<main\b',f'<main data-mm-release="{VERSION}"',s,count=1)
 return s.replace('</main>','<script data-mm-controller-script>'+CONTROLLER+'</script></main>')

records={};changes=[];art=ROOT/'artwork';art.mkdir(exist_ok=True)
descriptions={
'/future-medicines-comparison':'Compare current and investigational medicines by identity, research stage and routine. Read study limits beside trial results and dated UK status.',
'/medication-comparison-centre':'Compare UK medicine formulations, daily routines, licensed uses and named trial evidence. Read direct comparisons without invented efficacy scores.',
'/compare-weight-loss-treatments':'Explore UK weight-management routes and the differences between oral medicines. Compare practical questions, evidence, safety and access.',
'/weight-loss-tablets-for-men':'Understand UK weight-loss tablets: Wegovy tablets, Foundayo and orlistat, with product-specific routines, evidence, safety and licence distinctions.',
'/weight-loss-injections-for-men':'Understand UK weight-loss injections: Mounjaro, Wegovy and Saxenda. Read the routine, trial context, safety questions and access distinctions.',
'/glp1-knowledge-centre':'Understand GLP-1 medicines, receptor pathways and UK product differences. Use sourced visual explanations and links to medicine-specific evidence.',
'/guides/glp1-ultimate-uk-guide':'A UK guide to weight-management medicines, formulations and practical support, with evidence labels, safety context and clear access questions.',
'/treatments/emerging':'Read emerging weight-management research with its stage, population and limits attached. Trial results do not establish UK authorisation or supply.',
'/treatments/medication':'Explore UK weight-management medicines: ingredients, formulations, routines and evidence. Understand how authorisation, NHS access and supply differ.',
'/treatments/compare':'Compare weight-management routes and prepare questions about medicines, lifestyle and procedures. Keep evidence, safety, practical needs and access together.',
'/medication-comparison-methodology':'How SHIFT compares medicine evidence: populations, timeframes, analyses and outcomes, with primary sources and no invented clinical scorecards.',
'/guides/nhs-weight-loss-medication-pathways':'Understand NHS weight-loss medicine pathways, licence criteria and local access. A recommendation, prescription and available supply are separate checks.'}
for p,cfg in D['pages'].items():
 f=AUDIT/'before'/(slug(p)+'.html');before=f.read_text();old=main_of(before);new=improve_main(p,old,cfg)
 headline=re.sub(r'\s+',' ',plain(re.search(r'<h1\b[^>]*>([\s\S]*?)</h1>',new)[1])).strip()
 sourcekeys=list(dict.fromkeys(re.findall(r'\bid="mm-source-([^"\s]+)"',new)))
 if cfg['kind']=='medicine':
  med=M[cfg['medicines'][0]];title=med['name'].split(' / ')[0]+' UK: Evidence, Safety and Access | SHIFT';description='Understand '+med['name']+' in the UK: its identity, routine, named research, safety questions and the difference between authorisation and access.'
 elif cfg['kind']=='comparison':
  a,b=[M[k] for k in cfg['medicines']];title=a['name']+' vs '+b['name']+' UK: Evidence and Routine | SHIFT';description='Compare '+a['name']+' and '+b['name']+': ingredients, routines, UK indications, safety questions and the limits of the named trial evidence.'
 else:title=html.unescape(re.search(r'<title>([\s\S]*?)</title>',before)[1]);description=descriptions.get(p,'Read UK medication information with clear sources, evidence labels, safety context and access questions.')
 if cfg['kind']=='comparison-tool':title=('Future Medicines: Research, UK Status and Evidence | SHIFT' if cfg['mode']=='all' else 'UK Medication Comparison: Evidence, Routine and Safety | SHIFT')
 image=None;imagealt=None
 if cfg['kind']!='benchmark':
  import textwrap
  image='/assets/medicine-evidence-20261103/'+slug(p)+'.png';imagealt='Original SHIFT information graphic for '+headline+'; not product packaging or a promise of results.'
  label=M[cfg['medicines'][0]]['name'] if cfg.get('medicines') and cfg['kind']=='medicine' else headline
  lines=textwrap.wrap(label,width=24)[:4];heading=''.join(f'<text x="62" y="{160+i*58}" fill="#E7E3DA" font-size="48" font-weight="750">{esc(line)}</text>' for i,line in enumerate(lines))
  if cfg['kind']=='medicine':drawing=svg(M[cfg['medicines'][0]],'share').replace('viewBox="0 0 520 375"','x="660" y="92" width="480" height="385" viewBox="0 0 520 375"')
  else:drawing=''.join(f'<rect x="700" y="{120+i*90}" width="420" height="64" rx="14" fill="{["#E7E3DA","#707762"][i%2]}"/><text x="725" y="{162+i*90}" font-size="25" font-weight="700" fill="{["#050505","#FFFFFF"][i%2]}">{label}</text>' for i,label in enumerate(['Identity','Evidence','Safety','Access']))
  share='<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><rect width="1200" height="630" fill="#050505"/><text x="62" y="67" font-size="20" letter-spacing="3" fill="#CBD0BC">SHIFT SOME TIMBER</text>'+heading+'<text x="62" y="490" font-size="24" fill="#E7E3DA">Evidence and everyday questions.</text><path d="M62 540H1138" stroke="#707762"/><text x="62" y="587" font-size="20" fill="#CBCFBF">shiftsometimber.co.uk · UK information</text>'+drawing+'</svg>'
  (art/(slug(p)+'.svg')).write_text(share)
 records[p]={'kind':cfg['kind'],'baselineMainSha256':sha(old),'mainAfterSha256':sha(new),'main':new,'sources':sourcekeys,'sourceUrls':[SRC[k]['url'] for k in sourcekeys],'beforeTitle':re.search(r'<title>([\s\S]*?)</title>',before)[1],'headline':headline,'title':title,'description':description,'image':image,'imageAlt':imagealt}
 changes.append({'path':p,'kind':cfg['kind'],'changed':new!=old,'beforeMainBytes':len(old.encode()),'afterMainBytes':len(new.encode())})
(ROOT/'recipes.json').write_text(json.dumps(records,ensure_ascii=False,separators=(',',':'))+'\n')
(ROOT/'recipes.mjs').write_text('export const recipes='+json.dumps(records,ensure_ascii=False,separators=(',',':'))+';\n')
(ROOT/'styles.mjs').write_text('export const styles='+json.dumps(CSS)+';\n')
(ROOT/'registry.mjs').write_text('export const registry='+json.dumps(D,ensure_ascii=False,separators=(',',':'))+';\n')
(AUDIT/'changes.json').write_text(json.dumps(changes,indent=2))
print(json.dumps({'prepared':sum(c['changed'] for c in changes),'benchmarkPreserved':sum(not c['changed'] for c in changes),'recipeBytes':(ROOT/'recipes.mjs').stat().st_size}))
