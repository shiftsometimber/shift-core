from pathlib import Path
import re

root=Path('.')
worker=root/'worker-entry-v6.js'
s=worker.read_text()

for name in ['SHIFT_HEALTH_CHROME_PATCH','SHIFT_HEALTH_NAV_ENFORCER','SHIFT_HEALTH_NAV_GUARD','SHIFT_HEALTH_NAV_ROOT_GUARD']:
    s,n=re.subn(rf"\nconst {name} = `.*?`;\n",'\n',s,flags=re.S)
    print('deleted',name,n)
    s=re.sub(rf"\n?\$\{{{name}\}}",'',s)

if 'path === "/v1/contact" ||' not in s:
    s=s.replace('path === "/v1/continuity-interest" ||','path === "/v1/continuity-interest" ||\n    path === "/v1/contact" ||')

marker='const PUBLIC_MEDICINE_TICKER_PATCH = `'
if 'ACT2B_CONTACT_DIRECT_SUBMIT' not in s:
    direct=r'''const ACT2B_CONTACT_DIRECT_SUBMIT = `;(()=>{const paths=new Set(['/contact','/work-with-us','/partner-with-us','/advertise-with-us']);const path=location.pathname.replace(/\\.html$/,'').replace(/\\/+$/,'')||'/';if(!paths.has(path))return;const val=(form,names,sel='')=>{for(const n of names){const e=form.elements?.namedItem?.(n);if(e&&String(e.value||'').trim())return String(e.value).trim()}const e=sel?form.querySelector(sel):null;return String(e?.value||'').trim()};const infer=()=>{const q=new URLSearchParams(location.search).get('type');if(q)return q;return path.includes('partner')||path.includes('work-with')||path.includes('advertise')?'partner':'general'};document.addEventListener('submit',async e=>{const form=e.target;if(!(form instanceof HTMLFormElement))return;e.preventDefault();e.stopImmediatePropagation();const email=val(form,['email','Email'],'input[type=email]'),name=val(form,['name','Name','full_name','first_name'],'input[type=text]'),message=val(form,['message','Message','enquiry'],'textarea'),type=val(form,['type','enquiry_type','subject'],'select')||infer(),consent=!!form.querySelector('input[type=checkbox]:checked');const button=form.querySelector('button[type=submit],input[type=submit]');const old=button?.textContent||button?.value||'Send message';if(button){button.disabled=true;if(button.tagName==='BUTTON')button.textContent='Sending…';else button.value='Sending…'}let status=form.querySelector('[data-shift-contact-status]');if(!status){status=document.createElement('p');status.dataset.shiftContactStatus='1';status.setAttribute('role','status');form.append(status)}try{const r=await fetch('/v1/contact',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({name,email,type,message,consent})}),b=await r.json().catch(()=>({}));if(!r.ok)throw Error(b.message||'We could not send that.');status.textContent=b.message||'Message sent. Shift has it.';status.dataset.state='success';form.reset()}catch(err){status.textContent=err.message||'We could not send that. Please try again.';status.dataset.state='error'}finally{if(button){button.disabled=false;if(button.tagName==='BUTTON')button.textContent=old;else button.value=old}}},true)})();`;
'''
    s=s.replace(marker,direct+marker)
if '${ACT2B_CONTACT_DIRECT_SUBMIT}' not in s:
    s=s.replace('${PUBLIC_CHROME_PATCH}\\n','${PUBLIC_CHROME_PATCH}\\n${ACT2B_CONTACT_DIRECT_SUBMIT}\\n')

# Take authority over the Pages v42 asset and DELETE only SST_ENCLOSURE_NAV_V1.
if 'async function act2bV42Asset' not in s:
    helper='''\nasync function act2bV42Asset(request) {\n  const upstream = await fetch("https://projectshift.pages.dev/assets/v42.js", { headers: { "Cache-Control": "no-cache" } });\n  if (!upstream.ok) return new Response("v42 unavailable", { status: 502, headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });\n  const source = await upstream.text();\n  const cleaned = source.replace(/\\n?\\/\\/ SST_ENCLOSURE_NAV_V1[^\\n]*\\n\\(\\(\\)=>\\{[\\s\\S]*?\\n\\}\\)\\(\\);\\n?/, "\\n");\n  if (cleaned.includes("SST_ENCLOSURE_NAV_V1")) return new Response("v42 enclosure cleanup failed closed", { status: 503, headers: { "Cache-Control": "no-store" } });\n  const headers = new Headers(upstream.headers);\n  headers.set("Content-Type", "application/javascript; charset=utf-8");\n  headers.set("Cache-Control", "no-store, must-revalidate");\n  headers.set("X-Shift-Act2B-Chrome", "v42-enclosure-deleted");\n  headers.delete("Content-Length");\n  return new Response(request.method === "HEAD" ? null : cleaned, { status: 200, headers });\n}\n'''
    anchor='const REVIEWED_MENTAL_HEALTH_PATHS = ['
    s=s.replace(anchor,helper+'\n'+anchor)
if 'path === "/assets/v42.js"' not in s:
    route='''    if ((request.method === "GET" || request.method === "HEAD") && path === "/assets/v42.js")\n      return act2bV42Asset(request);\n'''
    s=s.replace('    const shiftMe3DProof = await shiftMe3DProofRoutes(request);',route+'    const shiftMe3DProof = await shiftMe3DProofRoutes(request);')
worker.write_text(s)

# Route only v42 through Worker so the deleted writer can never reach browsers.
wp=root/'wrangler.jsonc'
wcfg=wp.read_text()
if 'shiftsometimber.co.uk/assets/v42.js*' not in wcfg:
    insertion='''    {\n      "pattern": "shiftsometimber.co.uk/assets/v42.js*",\n      "zone_name": "shiftsometimber.co.uk",\n    },\n    {\n      "pattern": "www.shiftsometimber.co.uk/assets/v42.js*",\n      "zone_name": "shiftsometimber.co.uk",\n    },\n'''
    wcfg=wcfg.replace('  "routes": [\n', '  "routes": [\n'+insertion,1)
wp.write_text(wcfg)

hp=root/'frontend/member/shift-health.html'
h=hp.read_text()
h=h.replace('<header class="head">','<header class="head site-header">')
h=h.replace('<footer class="footer">','<footer class="footer site-footer">')
h=h.replace('<nav class="desktop" aria-label="Primary">','<nav class="desktop desktop-nav" aria-label="Primary">')
h=h.replace('<nav class="mobile" aria-label="Mobile primary"','<nav class="mobile site-drawer" aria-label="Mobile primary"')
hp.write_text(h)

alias_type={'partners':'partner','press':'press','support':'support','clinical':'clinical','orders':'orders','complaints':'complaint','privacy':'privacy','accounts':'accounts','finance':'finance','feedback':'feedback','hello':'general','matt':'support'}
for base in [root/'public-site',root/'frontend/member']:
    if not base.exists(): continue
    for p in base.rglob('*'):
        if not p.is_file() or p.suffix.lower() not in {'.html','.js','.mjs'}: continue
        try:x=p.read_text()
        except UnicodeDecodeError:continue
        before=x
        for alias,t in alias_type.items():
            x=re.sub(rf"mailto:{alias}@shiftsometimber\.co\.uk(?:\?[^\"'<> ]*)?",f"/contact?type={t}",x,flags=re.I)
        x=re.sub(r'(?i)(?:registered office\s*[:–-]?\s*)?38\s+Rugby\s+Drive[^<\n\r]*','',x)
        if x!=before:p.write_text(x)

w=worker.read_text()
if re.search(r'SHIFT_HEALTH_(?:CHROME_PATCH|NAV_ENFORCER|NAV_GUARD|NAV_ROOT_GUARD)',w):
    raise SystemExit('Act2B fail: runtime nav writer remains')
if 'ACT2B_CONTACT_DIRECT_SUBMIT' not in w: raise SystemExit('Act2B fail: direct submit missing')
if 'act2bV42Asset' not in w or 'v42-enclosure-deleted' not in w: raise SystemExit('Act2B fail: v42 authority missing')
if 'shiftsometimber.co.uk/assets/v42.js*' not in wp.read_text(): raise SystemExit('Act2B fail: v42 route missing')
if 'site-header' not in hp.read_text() or 'site-footer' not in hp.read_text(): raise SystemExit('Act2B fail: SHIFT Health chrome mismatch')
print('Act2B cleanup complete')
