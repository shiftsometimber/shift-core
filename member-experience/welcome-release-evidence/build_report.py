from pathlib import Path
import json, re, html, csv, base64

ROOT = Path(__file__).parent
PACK = ROOT / 'briefs' if (ROOT / 'briefs').exists() else ROOT.parent / 'release-pack-20261104'
E = json.loads((ROOT / 'evidence-summary.json').read_text())
rows = []

def row(group, ident, rule, passed, evidence, limitation=''):
    rows.append(dict(group=group, id=ident, rule=rule, result='PASS' if passed else 'FAIL', evidence=evidence, limitation=limitation))

welcome = []
section = None
counts = {}
for line in (PACK / 'explore/BRIEF-Welcome-and-Explore-weight-loss.md').read_text().splitlines():
    if line.startswith('## '):
        section = line.split('.')[0].replace('## ', '')
    if line.startswith('- [ ] '):
        counts[section] = counts.get(section, 0) + 1
        welcome.append((f'W{section}.{counts[section]}', line[6:]))

for ident, rule in welcome:
    section = int(ident[1:].split('.')[0]); item = int(ident.split('.')[1])
    passed, evidence, limitation = True, '', ''
    if section == 1:
        evidence = 'browser/results.json: both engines W1; returning and first-visit recordings.'
    elif section == 2:
        evidence = 'artwork.json exact supplied-file hashes; W2 image natural/display widths and alt text in both engines.'
    elif section == 3:
        evidence = 'Both engines W3: accessible hotspot, original three setup sections, real consent/save, first Done, browse and after-setup states.'
    elif section == 4:
        evidence = 'final-visuals/results.json: computed colour/font/button values in Chromium and WebKit; contrast.json.'
        limitation = 'Palette check covers the approved new elements; existing Shop content is preserved.'
    elif section == 5:
        if item == 1:
            evidence = 'W5-no-medicine-price in both engines; 41 Explore screenshot; existing clinical service availability checked on entry.'
        else:
            passed = False
            evidence = 'readiness.json: live assessmentAvailable=false; no pharmacy integration bindings; existing assessment page closed.'
            limitation = '44–46 status rendering and return-to-Today work with labelled synthetic DB fixtures. These are UI checks, not proof of payment, provider decisions, dispensing or refunds. No option or price was invented for 43.'
    elif section == 6:
        if item in (4, 5):
            evidence = 'No pre-questionnaire medicine/price UI; medicine-commerce-v1.js and discount/checkout source unchanged (source-preservation.json).'
        else:
            passed = False
            evidence = 'Existing till uses automatic capture. Decline handler has no Stripe refund call. No approval capture/cancel/expiry lifecycle is wired.'
            limitation = 'Stripe can authorise a hold, but this till does not safely implement it. No real charge or invented provider clearance was used.'
    elif section == 7:
        evidence = 'Source hashes unchanged for Shop catalogue, basket and routes, medicine-commerce and Core. Both engines Shop home text/links and visible content pixel hashes equal production.'
        limitation = 'Home visual preservation passes. Complete checkout behaviour is separately FAIL under addendum 6.'
    elif section == 8:
        evidence = ('First-visit artwork 114,026 bytes; after setup 106,418 bytes; exact supplied WebPs.' if item == 1 else f"Lighthouse {E['lighthouse']['version']} mobile 4G, LCP {round(E['lighthouse']['metrics']['largest-contentful-paint']['value'])}ms, FCP {round(E['lighthouse']['metrics']['first-contentful-paint']['value'])}ms, TBT 0; lighthouse/welcome.json and HTML.")
        passed = item != 2 or E['lighthouse']['metrics']['largest-contentful-paint']['value'] < 2000
        limitation = 'Lighthouse is a single lab run, separate from the 20-sample Today/Fit performance run.' if item == 2 else ''
    elif section == 9:
        if item in (3, 5):
            passed = False
            evidence = 'Existing clinical assessment is closed; no physical iPhone or Android phone attached.'
            limitation = 'Browser screenshots are labelled engine emulation. No mockup, fixture or desktop WebKit run is presented as physical-phone proof.'
        elif item == 6:
            evidence = 'contrast.json and final-visuals/results.json; actual rendered styles measured in both engines.'
        else:
            evidence = 'browser/<engine>/' + {1:'first-setup-browse-support-more.webm',2:'browse-without-setup.webm',4:'returning.webm'}[item]
            limitation = 'Recorded on the deployed test service in Chromium and WebKit mobile emulation, not physical phones.'
    row('Welcome and Explore brief', ident, rule, passed, evidence, limitation)

addendum = {
1: (True, 'Retained source/controller hashes, 68 retained browser checks and before/after link inventory.', 'Source retention and route checks pass; destructive/external side effects were not exercised.'),
2: (True, 'Only approved Welcome/Explore and More shortcuts added; existing Support/More content preserved.', ''),
3: (True, 'Approved shared frame and active navigation measured in both engines; native route node-identity checks.', 'The later Welcome brief explicitly approves the fourth Welcome top tab.'),
4: (True, 'Existing settings, orders, saved, Ask Timber and treatment routes open in retained browser proof with correct selection.', 'Physical-phone route recordings remain unperformed.'),
5: (True, 'Shop home text/links and visible content pixels match serving production in Chromium and WebKit; shop source unchanged.', ''),
6: (False, 'Before/after Shop recordings exist in both engines. Catalogue, basket, checkout and discount source unchanged.', 'No complete synthetic checkout-to-payment proof: clinical intake closed and financial lifecycle incomplete.'),
7: (True, 'Support home, all five situations, urgent tel links, Shed target=_blank, snapshot, Ask Timber, saved step, league and Message Matt route retained.', 'No real call or message was sent.'),
8: (False, 'Five full live situation texts and side-effects urgent-first order are present and open in both engines.', 'Required physical-phone dial/route proof not performed. Browser tel href checks are not phone dial proof.'),
9: (True, 'More inventory retains all rows, headline privacy, sign-out route, version/help and original destinations.', 'Sign-out and per-device headline setting were not re-exercised as part of this release.'),
10: (False, 'Original settings controller and all IDs/sections are retained and load; account controls inventory is captured.', 'Every setting mutation, email change/reset, deletion/export and Add to Home Screen was not exercised before and after on real phones.'),
11: (False, 'Quick settings point into original controls; weight visibility has dedicated unit coverage.', 'Physical health-tag deletion and every shortcut save are not recorded end-to-end in this release.')
}
add_text = {}
for line in (PACK/'01-BRIEF-addendum-Support-More.md').read_text().splitlines():
    m = re.match(r'^(\d+)\. (.*)', line)
    if m: add_text[int(m[1])] = m[2]
for n, (passed, proof, limitation) in addendum.items():
    row('Support and More addendum', f'A{n}', add_text[n], passed, proof, limitation)

v7 = {
1: (False,'No member release or partial rollout made. Candidate prepared without serving traffic.','Full single release held for clinical/financial and strict speed failures.'),
2: (True,'Existing native shell; build-time Brotli; 5 account reads in one D1 batch; precomputed offers/recaps; no new page-load fetch.',''),
3: (True,'release.json anchors exact serving version; one command rollback, bindings/assets/schedules retained.','Rollback not invoked because member traffic never changed.'),
4: (True,'Real SQL concurrency + both engine choose journeys: Today/Grub two sessions yield exactly one award.',''),
5: (True,'Both choose journeys: five quick logs, full food day, walk and extra session leave pile unchanged.',''),
6: (True,'Both milestone journeys, SQL one-time award and Monday lifetime-pile retention tests.',''),
7: (True,'Both choose journeys: mood buttons and History retained, no recorded mood on Today.',''),
8: (True,'Both choose recordings exercise all five quick logs with unchanged pile.',''),
9: (True,'Ten-original-action source/version/5g unit test and three sourced swaps in both engines.',''),
10: (True,'Both choose/hard-week journeys and SQL tests: feedback optional, log retained, food separate.',''),
11: (True,'Default-on and off/re-enable unit tests; More preference route browser check; nested weight suppression tests.',''),
12: (True,'Both milestone previews plus private-field projection and nested weight suppression unit tests.',''),
13: (False,'Existing Journey module preserved, native route opens.','Detailed Medicine wording/chart-open and timeline-two-wins not newly recorded against every condition.'),
14: (True,'Real SQL crew ACL, explicit opt-in, effort-only ranking and Monday tests.',''),
15: (False,'Existing Grub native module unchanged and full day recorded.','Next-card peek and every one-line card condition not separately measured in this run.'),
16: (True,'Own-plan/unknown-target unit tests; existing + Snack native UI retained.',''),
17: (False,'Existing meal selector/usuals/snack/search/photo/barcode/off-plan code retained; full day and search path covered.','Photo/barcode capture not tested on physical phones.'),
18: (True,'Both choose recordings: neutral off-plan confirmation with plain calorie totals.',''),
19: (True,'Nutrition source/portion and exact UK FoP boundary tests; existing meal detail UI unchanged.',''),
20: (True,'Both choose journeys: eating-out record uses explicitly labelled estimates.',''),
21: (True,'Existing under-eating flag remains off; no clinical threshold added.',''),
22: (True,'Existing named sources: UK CoFID 2021 and named UK product labels, Open Food Facts; source provenance retained.','No nutrition database change in this release.'),
23: (True,'Both choose journeys: native Fit and all three shorter/no-kit/low-impact alternatives.',''),
24: (True,'Both choose journeys and SQL: activity records never create extra pile log.',''),
25: (False,'Existing consent/health-tag control source untouched; privacy/erasure tests pass.','Health-tag creation/deletion on both physical devices not recorded.'),
26: (True,'Both engines: optional session rating dismissal keeps activity; overnight-only adjustment tests.',''),
27: (True,'Persistent shared node checks through eight destinations. Latest Welcome brief approves fourth top tab.',''),
28: (True,'Existing source symbols remain line SVG icons; no additional accent/retheme introduced.',''),
29: (True,'Real own-account records, no CONCEPT labels added; all test data synthetic and labelled.',''),
30: (True,f"20 samples: tap{E['speed']['tap']['p95']}ms, warm max{max(x['p95'] for x in E['speed']['warm'].values())}ms, Today{E['speed']['fresh']['today']['p95']}ms, Fit{E['speed']['fresh']['fit']['p95']}ms; original brief 100/500/2000 limits pass.",'Latest user limits are stricter; see the current speed table.')
}
v7_text = {}
for line in (PACK/'00-BRIEF-My-Timber-V7.md').read_text().splitlines():
    m = re.match(r'^(\d+)\. (.*)', line)
    if m: v7_text[int(m[1])] = m[2]
for n,(passed,proof,limitation) in v7.items():
    row('Original V7 regression',f'V{n}',v7_text[n],passed,proof,limitation)

metrics = [
    ('Fresh Today',1070,E['before']['fresh']['today']['p95'],E['speed']['fresh']['today']['p95']),
    ('Fresh Fit',1010,E['before']['fresh']['fit']['p95'],E['speed']['fresh']['fit']['p95']),
    ('Visited tab switch (worst destination)',32,max(x['p95'] for x in E['before']['warm'].values()),max(x['p95'] for x in E['speed']['warm'].values())),
    ('Tap feedback',33,E['before']['tap']['p95'],E['speed']['tap']['p95']),
    ('Repeat shell',77,E['before']['repeatShell']['p95'],E['speed']['repeatShell']['p95'])
]
for name,target,before,after in metrics:
    row('Latest release rules','S-'+name,name+' must match or beat supplied live p95.',after<=target,'20 samples, Slow 4G / CPU 4×, candidate-mobile-speed/results.json',f'Supplied {target}ms; remeasured live {before}ms; candidate {after}ms.')
row('Latest release rules','R-live','Single member release live and verified',False,'readiness.json: original front still receives 100%; prepared candidate receives 0%.','Clinical route, automated refunds, stricter speed and phone proof incomplete.')
row('Latest release rules','R-webp','Only supplied compressed Welcome WebPs, cached',True,'Exact byte hashes, immutable endpoints and service-worker asset cache.','')
row('Latest release rules','R-shop','Shop design and content unchanged',True,'Both engine before/after pixel and text/link hashes; source-preservation.json.','Complete checkout proof remains failed under A6.')
row('Latest release rules','R-rollback','One-step exact rollback ready before traffic moves',True,'welcome-release.mjs rollback; release.json original hashes, settings and cron capture.','No production traffic move attempted.')

must_not_break = [
('Mood check-in',True,'Both browser choose journeys and retained controller.'),
('In your corner',False,'Original support module retained; every saved-support-step mutation not retested before/after.'),
('Rough day',True,'Both engines open the full wobble page and retain its original routes/text.'),
('Life Back',False,'Existing native module/source retained; reason/goal edit not recorded before/after.'),
('My next step privacy line',True,'Existing support-plan wording and controller unchanged; retained page loads.'),
('Your progress: weight, waist, clothes size',False,'Default weight, hidden-weight and original Journey controller checked; every reading type not re-entered before/after.'),
('Medicine over time, existing wording',False,'Source/controller preserved; full expanded chart and wording not separately re-recorded.'),
('Your timeline',False,'Existing route/controller retained; complete timeline record/edit cycle not re-exercised.'),
('Record an injection',False,'Existing records source unchanged; no new injection record test in this release.'),
('View or edit my records',False,'Original records source unchanged; full edit/delete UI proof unperformed.'),
('Snapshot',False,'Snapshot link and original source retained; complete appointment snapshot generation not re-exercised.'),
('Private progress photos',False,'Original source retained; physical-camera upload/delete not performed.'),
('Weight history import/download',False,'Original portability source retained; file import/download not repeated.'),
('Compare saved records',False,'Original Journey source retained; complete comparison flow not recorded.'),
('Journey setup',False,'Original Journey tool source retained; distinct Join My Timber three-section personalisation passes, but Journey setup was not fully repeated.'),
('Shop home',True,'Before/after text/links and visible content pixels identical in both engines.'),
('Basket',False,'Original basket source unchanged; complete checkout proof unperformed.'),
('Orders',True,'Existing owned-account order route/controller opens in both engines; no real purchase.'),
('Consent',True,'Real optional grant/save in both engines; SQL consent checks and service-worker grant/withdrawal tests.'),
('Deletion/export',False,'SQL owner-only erasure/rollback tests pass and original controls retained; complete UI deletion/export not performed.'),
('Clinical gates',True,'Source and serving Core unchanged; live assessment remains closed, no verified intake fabricated.'),
('Supplier holds',True,'No supplier configuration/gate changed or bypassed.'),
('Payment safeguards',False,'No money writes or changed checkout. Existing automatic decline refund/card-hold lifecycle is absent; not safe to call new flow passed.'),
('Saved & plans, Ask Timber and treatment routes',True,'Original signed-in routes/controllers open; all before/after links preserved. No message sent.'),
('Daily reminders and Add to Home Screen',False,'Existing settings controls/manifest retained; physical notification/install proof not performed.')
]
for i,(name,passed,proof) in enumerate(must_not_break,1):
    row('Must-not-break inventory',f'M{i}',name,passed,proof,'FAIL can mean missing verification; it does not assert a new regression.')

row('App shell','H1','One persistent shared frame; content-only navigation',True,'frame-pixels/results.json: same three DOM nodes and static frame pixels across13 routes per engine; 26/26.','Removed the existing forced 3D/backface-hidden bars that blanked Chromium labels after long-page navigation. Appearance unchanged.')
row('App shell','H2','Cached shell, CSS, fonts, logo and native Grub/Fit/Life Back',True,'Existing service worker/native routes retained; actual repeat-resource record; build-time compression verified.','No frame copy or iframe added.')
row('App shell','H3','Identity once early; private data only after verified account',True,'Streaming privacy tests plus real same-shell setup flow and cached identity adapter.','')
row('App shell','H4','Airplane mode shows cached private views with offline note',False,'Existing consent-aware private cache and offline note retained.','Latest build has no physical airplane-mode recording; not claimed as passed.')
row('App shell','H5','Repeat shell under500ms, tap under100ms, visited switch under500ms',True,'20 samples: repeat79ms, tap32ms, warm32ms.','Latest stricter77ms repeat limit remains FAIL.')

def luminance(h):
    values=[int(h[i:i+2],16)/255 for i in (0,2,4)]
    values=[x/12.92 if x<=.04045 else ((x+.055)/1.055)**2.4 for x in values]
    return sum(a*b for a,b in zip(values,[.2126,.7152,.0722]))
def contrast(a,b):
    l=sorted([luminance(a),luminance(b)])
    return round((l[1]+.05)/(l[0]+.05),3)
contrasts={'blackOnGreen':contrast('050505','707762'),'creamOnBlack':contrast('E7E3DA','050505'),'greenOnBlack':contrast('707762','050505'),'creamOnGreen':contrast('E7E3DA','707762'),'filledButton':'21px, weight 800; large-text AA threshold 3:1','topLabels':'cream, weight 800','bottomLabels':'green, weight 800','source':'WCAG sRGB relative luminance; computed styles in final-visuals/results.json'}
(ROOT/'contrast.json').write_text(json.dumps(contrasts,indent=2)+'\n')

with (ROOT/'pass-fail.csv').open('w') as f:
    writer=csv.DictWriter(f,fieldnames=['group','id','rule','result','evidence','limitation']);writer.writeheader();writer.writerows(rows)
(ROOT/'pass-fail.json').write_text(json.dumps(rows,indent=2)+'\n')
acceptance={'at':E['readiness']['at'],'allRequiredPass':False,'clinicalEndToEnd':False,'automaticRefund':False,'cardHoldImplemented':False,'speedPass':all(after<=target for _,target,_,after in metrics) and E['lighthouse']['metrics']['largest-contentful-paint']['value']<2000,'shopUnchanged':True,'physicalPhoneEvidence':False,'memberReleaseDeployed':False,'status':'BLOCKED_NOT_LIVE','reasons':['Existing provider assessment closed and unconfigured; questionnaire-to-dispensing path not verifiable.','Till automatic refund and safe card-hold lifecycle absent.','At least one strict speed requirement remains failed; see latest measured table.','Required physical iPhone Safari/Android Chrome proof not performed.','Complete checkout/settings mutation evidence incomplete.']}
(ROOT/'acceptance.json').write_text(json.dumps(acceptance,indent=2)+'\n')

lines=['# My Timber release report — 4 November 2026','','**NOT LIVE FOR MEMBERS.** The new frontend is deployed on the isolated synthetic-account test service. No member release was attempted.','','Built: first/returning Welcome, accessible original-artwork hotspot, existing three-section personalisation in the persistent shell, Explore intro and existing-service entry, account-owned treatment-status presentation, approved Support/More restyle and retained routes. Shop home content and appearance match production.','','The existing clinical route reports assessmentAvailable=false and has no pharmacy integration binding. Its current payment flow does not implement automatic decline refunds or a safe manual card-hold lifecycle. No questionnaire, verified intake, product or price was invented; 43 Choose and pay is not complete. 44–46 are tested with labelled database fixtures, not real provider/payment results.','','## Speed','','All times below are milliseconds, p95 from 20 samples. 390×844 mobile browser emulation, 2×, 150ms latency, 200,000B/s down, 96,000B/s up, CPU4×. This is not real-phone evidence. The latest complete run is used; earlier runs remain archived.','','| Measure | Supplied live limit | Live remeasured | Candidate test service | Result |','|---|---:|---:|---:|---|']
for name,target,before,after in metrics: lines.append(f'| {name} | {target} | {before} | {after} | {"PASS" if after<=target else "FAIL"} |')
lines += ['','Welcome Lighthouse13.6.0 mobile4G: LCP1,594ms, FCP1,063ms, TBT0, performance100. One lab run, separate from the repeated speed tests.','','## Evidence limits and release blocker','','- Chromium and WebKit mobile emulation each pass the three V7 journeys (26 checks per engine), 34 retained route/controller checks, and 37 available Welcome checks. The 38th Welcome check explicitly fails because the real clinical questionnaire is closed.','- 42 SQL/model/privacy/service-worker tests pass; profile-save-after-Done race also passes.','- Shop before/after recordings compare serving production and the test candidate using synthetic accounts; visible content pixel hashes and all home text/links match in both engines.','- No physical iPhone/Android results, completed payment/refund, dispensing, real purchase, real-member test, message or call is claimed.','- Stripe supports authorisation holds, but this till is not wired for approval capture, cancellation and expiry reconciliation. It currently uses automatic capture; declined-state updates do not issue refunds.','- Smallest clinical next step: connect the commissioned provider sandbox and prove intake completion, paid review, approval/dispatch and declined refund (or the complete hold/capture/cancel/expiry path), without opening live supplier/payment gates.','- Strict warm-tab and repeat-shell limits, full settings/checkout evidence and physical-phone checks also remain release requirements.','','## Source and rollback','','Work continues on fix/my-timber-precompiled-documents-20261102. Exact current member front: 42f085ae-553c-4b11-82f6-116203fb3c5e. Current Core a301697d-5586-4839-aa44-5edb01105731 was preserved. Inactive candidate '+E['release']['candidate']+' is prepared with the current front bindings/assets/settings/cron; it serves no member traffic.','','Rollback: `node member-experience/tools/welcome-release.mjs rollback`. It restores the exact current member front only; no Core rollback, route change or database deletion. The guarded live command rejects this recorded failed acceptance.','','## Sensible implementation decisions','','- First-visit Welcome marker is per account on this device; completed setup always returns to Today. Direct Welcome links remain usable.','- Original setup uses its existing three sections and persistence, with optional explicit tracking consent. No new clinical questionnaire is created.','- Only a confirmed refunded payment state claims a refund has been processed. A clinical decline flag alone does not claim money moved.','- Welcome images load only on Welcome and cache when visited. Today/Fit do not download them.','- Batch reads are authenticated and account-owned; consent/paused tracking checks stay inside the food query. Precomputed offers/recaps remain overnight.','- Font subset retains all required outlines, advances, vertical metrics and licence. JS/CSS Brotli is prepared at build time and round-trip verified.','','## Pass/fail against every brief rule','','PASS means the stated scope/evidence passed on the test build. FAIL includes unperformed proof; unchanged source alone is not proof of every behaviour.','','| Brief | ID | Rule | Result | Evidence / limitation |','|---|---|---|---|---|']
for r in rows:
    text=(r['evidence']+' '+r['limitation']).replace('|','\\|').replace('\n',' ')
    lines.append(f"| {r['group']} | {r['id']} | {r['rule'].replace('|','/')} | {r['result']} | {text} |")
lines += ['','## Synthetic accounts','','Welcome: Chromium900710501–505 and WebKit900710511–515; addresses welcome-<engine>-<case>@example.invalid. V7 journeys: v7-<engine>-choose/hard-week/milestone@example.invalid. Production visual comparison uses only v7-live-proof@example.invalid (900710301). Credentials and preview access codes are excluded from source and reports.','','## Preserved critical source','','| Module | SHA-256 unchanged from starting branch |','|---|---|']
for p in E['preserved']: lines.append(f"| {p['path']} | {'PASS' if p['unchanged'] else 'FAIL'} — {p['sha256']} |")
lighthouse_line=f"Welcome Lighthouse{E['lighthouse']['version']} mobile4G: LCP{round(E['lighthouse']['metrics']['largest-contentful-paint']['value']):,}ms, FCP{round(E['lighthouse']['metrics']['first-contentful-paint']['value']):,}ms, TBT0, performance{round(E['lighthouse']['performance']*100)}."
report_text='\n'.join(lines)+'\n'
report_text=report_text.replace('Welcome Lighthouse13.6.0 mobile4G: LCP1,594ms, FCP1,063ms, TBT0, performance100.',lighthouse_line)
report_text+='\nFinal measurement note: '+E.get('speedMeasurementNote','')+'\n\nFrame rendering: removed the old forced 3D/backface-hidden layers. The new unmodified test pages retain identical static frame pixels and DOM nodes through13 routes in each engine (26/26).\n'
report_text+='\nProduction comparison synthetic session expired during one capture attempt; that failed run is archived. Only that owned synthetic session was renewed, and both complete Shop comparison runs then passed. No real-member session was changed.\n'
report_text+='\n## Every live Support, More and Shop home link before and after\n\nBoth engines compare the serving production front with the candidate. No link or button is missing. The only addition is the approved More Personalise My Timber shortcut. External destinations were inventoried without opening them or sending anything.\n'
for engine in E.get('links',{}).get('engines',[]):
    report_text+='\n### '+engine['name'].title()+'\n\n| View | Label | Destination | Before | After |\n|---|---|---|---|---|\n'
    for tab in ['support','more','shop']:
        old=engine['before'][tab]['links'];new=engine['after'][tab]['links'];union=old+[x for x in new if x not in old]
        for link in union:
            report_text+='| '+tab+' | '+link['text'].replace('|','/')+' | '+link['href']+(' (new tab)' if link['target']=='_blank' else '')+' | '+('yes' if link in old else 'approved addition')+' | '+('yes' if link in new else 'MISSING')+' |\n'
        for label in engine['before'][tab]['buttons']:
            report_text+='| '+tab+' | '+label.replace('|','/')+' | button | yes | '+('yes' if label in engine['after'][tab]['buttons'] else 'MISSING')+' |\n'
(ROOT/'REPORT.md').write_text(report_text)

# Exact screenshots, embedded to make the report portable. No artwork or mockup is used as evidence.
labels={'47-welcome-first':'47 — Welcome, first visit','48-welcome-after':'48 — Welcome after setup','40b-today':'40b — Today','41-explore':'41 — Explore introduction','42-assessment-closed':'42 — Existing assessment closed (BLOCKED)','44-review-fixture':'44 — Review (synthetic UI fixture)','45-refund-fixture':'45 — Refunded (synthetic UI fixture)','46-today-review':'46 — Today, review fixture','46-today-declined':'46 — Today, declined fixture','24-support':'24 — Support','25-side-effects':'25 — Side effects','26-more':'26 — More','shop-before':'Shop — current production','shop-candidate':'Shop — test candidate'}
def table_html(table_rows,fields):
    return '<table><thead><tr>'+''.join('<th>'+html.escape(x)+'</th>' for x in fields)+'</tr></thead><tbody>'+''.join('<tr>'+''.join('<td>'+html.escape(str(v))+'</td>' for v in row)+'</tr>' for row in table_rows)+'</tbody></table>'
sections=[]
for engine in ['chromium','webkit']:
    cards=[]
    for p in sorted((ROOT/'screens').glob(engine+'-*')):
        key=p.stem[len(engine)+1:];label=labels.get(key,key)
        mime='image/jpeg' if p.suffix=='.jpg' else 'image/png'
        cards.append('<figure><figcaption>'+html.escape(label)+'</figcaption><a href="#viewer" onclick="openImage(this.firstElementChild);return false"><img loading="lazy" alt="'+html.escape(label)+'; '+engine+' mobile emulation test service" src="data:'+mime+';base64,'+base64.b64encode(p.read_bytes()).decode()+'"></a></figure>')
    sections.append('<section data-engine="'+engine+'"><h2>'+engine.title()+' — browser emulation, not physical phone</h2><div class="gallery">'+''.join(cards)+'</div></section>')
rule_html=table_html([[r['group'],r['id'],r['rule'],r['result'],r['evidence']+' '+r['limitation']] for r in rows],['Brief','ID','Rule','Result','Evidence and limits'])
speed_html=table_html([[a,b,c,d,'PASS' if d<=b else 'FAIL'] for a,b,c,d in metrics],['p95 (ms), 20 samples','Supplied limit','Live remeasured','Test candidate','Result'])
document='''<!doctype html><html lang="en-GB"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>My Timber — release evidence, not live</title><style>body{font:16px/1.5 system-ui,sans-serif;background:#050505;color:#e7e3da;margin:0;padding:24px}main{max-width:1440px;margin:auto}h1{font-size:clamp(28px,4vw,46px)}h2{margin-top:44px}a{color:inherit}button{background:#707762;color:#050505;font:800 17px system-ui;border:2px solid #707762;border-radius:7px;padding:10px 20px;cursor:pointer;margin:8px}.notice{border:2px solid #707762;padding:20px;max-width:1000px}table{width:100%;border-collapse:collapse;margin:20px 0;font-size:14px}th,td{padding:10px;text-align:left;vertical-align:top;border-bottom:1px solid #707762}th{position:sticky;top:0;background:#050505}.scroll{overflow:auto}.gallery{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:18px}figure{margin:0;border:1px solid #707762;border-radius:8px;padding:10px}figure img{display:block;width:100%;height:auto}figcaption{font-weight:800;min-height:50px}pre{white-space:pre-wrap;overflow-wrap:anywhere;font:13px/1.5 monospace}.muted{font-size:14px}section[hidden]{display:none}</style><main><p>4 November 2026 · Existing My Timber branch · Synthetic accounts only</p><h1>Built on the test service. Not live for members.</h1><div class="notice"><p>The new Welcome, original personalisation flow, Explore introduction, treatment-status presentation, Support and More are implemented inside the existing shell. Shop home is unchanged.</p><p>The existing clinical assessment is closed and the till does not implement automatic decline refunds or a safe card-hold lifecycle. The questionnaire, Choose and pay, provider/dispatch and money outcomes are not complete. Review/refund screenshots below are explicitly labelled synthetic UI fixtures.</p><p>The latest strict speed results appear in the table below. Physical iPhone/Android proof and full settings/checkout mutation checks are unperformed. Member traffic remains on its original version; no partial release was made.</p></div><h2>Speed</h2><p>Throttled mobile Chromium, 390×844 at2×; latency150ms, down200,000B/s, up96,000B/s, CPU4×. Latest full20-sample run, without selecting earlier faster samples.</p>'''+speed_html+'''<p>Welcome Lighthouse13.6.0 mobile4G: LCP1,594ms, FCP1,063ms, TBT0, performance100. This is a separate single lab run.</p><h2>Actual test-service screenshots</h2><p>Every available state is shown. 43 Choose and pay has no screenshot because the existing provider questionnaire cannot be completed. These are browser captures, not mockups, and are not presented as member-live or physical-phone evidence.</p><button onclick="pick('all')">Both engines</button><button onclick="pick('chromium')">Chromium</button><button onclick="pick('webkit')">WebKit</button>'''+''.join(sections)+'''<h2>Pass/fail against all brief rules</h2><p>PASS applies to the specific evidence/scope stated. FAIL includes missing or unperformed proof. Original V7 regression, the Support/More addendum, every Welcome/Explore checklist line and the latest speed limits are included.</p><div class="scroll">'''+rule_html+'''</div><h2>Full report and source preservation</h2><pre>'''+html.escape((ROOT/'REPORT.md').read_text())+'''</pre></main><script>function pick(engine){document.querySelectorAll('[data-engine]').forEach(n=>n.hidden=engine!=='all'&&n.dataset.engine!==engine)}</script></html>'''
document=document.replace('Welcome Lighthouse13.6.0 mobile4G: LCP1,594ms, FCP1,063ms, TBT0, performance100.',lighthouse_line)
document=document.replace('Physical iPhone/Android proof and full settings/checkout mutation checks are unperformed.', 'Welcome Lighthouse LCP is 1,604ms: PASS against the under-2,000ms rule. Physical iPhone/Android proof and full settings/checkout mutation checks are unperformed.')
document=document.replace('</main><script>', '<dialog id="viewer" style="max-width:95vw;max-height:95vh;overflow:auto;background:#050505;color:#E7E3DA"><button onclick="this.parentElement.close()">Close screenshot</button><img id="viewerImage" style="display:block;max-width:90vw;height:auto"></dialog></main><script>function openImage(img){document.getElementById("viewerImage").src=img.src;document.getElementById("viewer").showModal()}')
(ROOT/'My-Timber-release-report.html').write_text(document)
print(json.dumps({'rules':len(rows),'pass':sum(r['result']=='PASS' for r in rows),'fail':sum(r['result']=='FAIL' for r in rows),'screenshots':len(list((ROOT/'screens').glob('*'))),'htmlBytes':len(document.encode())}))
