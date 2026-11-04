from pathlib import Path
import base64, collections, csv, datetime, html, json, sys

root = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).parent
read = lambda name: json.loads((root / name).read_text())
release = read('interface-live-release.json')
live = read('live-screens/results.json')
speed = read('live-mobile-speed/results.json')
rows = read('pass-fail.json')
by_id = {row['id']: row for row in rows}

def update(key, result, evidence, limitation=''):
    by_id[key].update(result=result, evidence=evidence, limitation=limitation)

update('V1', 'PASS', 'interface-live-release.json: all approved member interface source deployed at 100% in version ' + release['candidate'] + '.', 'No feature flag or staged rollout. Complete clinical acceptance and strict speed targets remain failed separately.')
update('V3', 'PASS', 'Original exact member version 42f085ae-553c-4b11-82f6-116203fb3c5e captured before deployment; node member-experience/tools/welcome-release.mjs rollback.', 'Rollback not invoked: post-deployment navigation and Shop preservation checks passed. Existing clinical gate remains closed.')
update('R-live', 'PASS', 'interface-live-release.json and live-screens/results.json: member interface deployed and live-verified in Chromium and WebKit, 14/14 checks each.', 'This is not a claim that the clinical purchase journey or complete acceptance brief passes.')
update('R-rollback', 'PASS', 'One-step exact front rollback prepared before the 19:14 GMT deployment; Core version and schedules preserved.', 'No member issue was observed in the recorded live checks, so rollback was not invoked.')
limits = [
    ('Fresh Today', 1070, speed['summary']['fresh']['today']['p95']),
    ('Fresh Fit', 1010, speed['summary']['fresh']['fit']['p95']),
    ('Visited tab switch (worst destination)', 32, max(v['p95'] for v in speed['summary']['warm'].values())),
    ('Tap feedback', 33, speed['summary']['tap']['p95']),
    ('Repeat shell', 77, speed['summary']['repeatShell']['p95']),
]
for name, target, measured in limits:
    update('S-' + name, 'PASS' if measured <= target else 'FAIL', 'live-mobile-speed/results.json; 20 samples per metric on actual production, rounded p95 milliseconds.', f'Supplied live limit {target}ms; latest actual-live measurement {measured}ms. Chromium mobile emulation, not a physical phone.')
for row in rows:
    if row['id'].startswith(('V4', 'V5', 'V6', 'V7', 'V8', 'V9', 'V10', 'V18', 'V23', 'V26')) and row['result'] == 'PASS':
        row['evidence'] += ' Confirmed in the restored-source 4 November 19:34/19:35 GMT journey rerun, 26/26 conditions per engine.'
    if row['id'] == 'W3.1':
        row['limitation'] = 'Prepared synthetic setup accounts on the hosted test service; not a claim that a bare new registration or real member was exercised.'

counts = dict(collections.Counter(row['result'] for row in rows))
acceptance = {
    'at': datetime.datetime.now(datetime.timezone.utc).isoformat(),
    'status': 'INTERFACE_LIVE_ACCEPTANCE_INCOMPLETE',
    'memberReleaseDeployed': True, 'liveVersion': release['candidate'], 'liveAt': release['liveAt'],
    'allRequiredPass': False, 'clinicalEndToEnd': False, 'automaticRefund': False,
    'cardHoldImplemented': False, 'speedPass': all(m <= t for _, t, m in limits),
    'shopUnchanged': True, 'physicalPhoneEvidence': False, 'checks': counts,
    'reasons': ['Existing assessment closed; provider connection is not configured.',
                'Automatic decline-refund and a safe authorise/capture/cancel/expiry card-hold lifecycle are not implemented in this till.',
                'Four of the five latest strict speed targets are missed.',
                'Physical iPhone Safari / Android Chrome and complete settings/checkout mutation proof are not performed.'],
}
(root / 'acceptance.json').write_text(json.dumps(acceptance, indent=2) + '\n')
(root / 'pass-fail.json').write_text(json.dumps(rows, indent=2, ensure_ascii=False) + '\n')
with (root / 'pass-fail.csv').open('w', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=['group', 'id', 'rule', 'result', 'evidence', 'limitation'])
    writer.writeheader(); writer.writerows(rows)
escape = lambda value: html.escape(str(value), quote=True)

speed_table = '<table><thead><tr><th>Metric</th><th>Supplied limit, p95</th><th>Latest live, p95</th><th>Result</th></tr></thead><tbody>'
for name, target, measured in limits:
    result = 'PASS' if measured <= target else 'FAIL'
    speed_table += f'<tr><td>{escape(name)}</td><td>{target} ms</td><td>{measured} ms</td><td class="{result}">{result}</td></tr>'
speed_table += '</tbody></table>'

gallery = ''
labels = {'welcome': 'Welcome, completed setup', 'explore': 'Explore introduction', 'existing-clinical-gate': 'Existing assessment closed', 'support': 'Support home', 'support-ending': 'Treatment changing or ending', 'support-stall': 'Scales have gone quiet', 'support-wobble': 'Having a wobble', 'support-cost': 'Worried about the cost', 'support-side-effects': 'Side effects or feeling unwell', 'more': 'More', 'preferences': 'Preferences', 'today': 'Today', 'shop': 'Shop, unchanged', 'grub': 'Grub', 'fit': 'Fit', 'journey': 'Journey'}
for engine in live['engines']:
    for name in dict.fromkeys(engine['shots']):
        image_path = root / 'live-screens' / name
        uri = 'data:image/jpeg;base64,' + base64.b64encode(image_path.read_bytes()).decode()
        label = labels.get(name[len(engine['name'])+1:-4], name)
        gallery += f'<figure data-engine="{engine["name"]}"><figcaption>{escape(label)}<small>{escape(engine["name"])} · live production</small></figcaption><button class="screenshot" aria-label="Enlarge {escape(label)}"><img loading="lazy" src="{uri}" alt="Actual live {escape(label)} screenshot, {engine["name"]}"></button></figure>'

journeys = ''
for engine in ['chromium', 'webkit']:
    data = read('v7-journeys-' + engine + '/results.json')
    for journey in data['journeys']:
        checks = journey['checks']; total = len(checks); passed = sum(c['result'] == 'PASS' for c in checks)
        journeys += f'<details><summary>{escape(engine)} · {escape(journey["name"])} · {passed}/{total} PASS</summary><p>Synthetic account: {escape(journey["testAccount"])}. Hosted isolated test service; identical restored source; no real member or payment.</p><ul>'
        for check in checks:
            journeys += f'<li><b>{escape(check["result"])}</b> — {escape(check["condition"])}</li>'
        journeys += '</ul></details>'

rules_table = '<table id="rules"><thead><tr><th>Rule</th><th>Result</th><th>Exact condition</th><th>Evidence and limits</th></tr></thead><tbody>'
for row in rows:
    rules_table += f'<tr data-result="{row["result"]}"><td><b>{escape(row["id"])}</b><small>{escape(row["group"])}</small></td><td class="{row["result"]}">{escape(row["result"])}</td><td>{escape(row["rule"])}</td><td>{escape(row["evidence"])}<p>{escape(row["limitation"])}</p></td></tr>'
rules_table += '</tbody></table>'

doc = '''<!doctype html><html lang="en-GB"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>My Timber — LIVE release proof, 4 November 2026</title><style>
*{box-sizing:border-box}body{margin:0;background:#050505;color:#e7e3da;font:16px/1.5 system-ui,sans-serif}main{max-width:1240px;margin:auto;padding:28px}h1,h2{line-height:1.15}h1{font-size:36px}h2{margin-top:44px}a{color:inherit}.notice{border:1px solid #707762;border-radius:16px;padding:20px;background:#151812}.facts{display:flex;gap:12px;flex-wrap:wrap}.facts span{padding:10px 16px;border:1px solid #707762;border-radius:10px}.PASS{font-weight:800;color:#b1c29a}.FAIL{font-weight:800;color:#e7e3da;text-decoration:underline;text-decoration-style:dotted}small{display:block;font-size:12px;color:#bdbbb3}.table-wrap{overflow-x:auto}table{width:100%;border-collapse:collapse}td,th{padding:12px;text-align:left;vertical-align:top;border-bottom:1px solid #454b3d}th{background:#1b2018}td p{font-size:14px;color:#c6c4bb}input,select{font:inherit;padding:10px;background:#151812;border:1px solid #707762;color:#e7e3da;border-radius:8px;margin:0 8px 14px 0}.gallery{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:18px}figure{margin:0;border:1px solid #454b3d;border-radius:12px;overflow:hidden}figcaption{padding:12px;background:#151812}.screenshot{padding:0;border:0;background:#050505;width:100%;height:600px;overflow:auto;cursor:zoom-in}.screenshot img{display:block;width:100%;height:auto}details{padding:14px;border:1px solid #454b3d;border-radius:10px;margin:10px 0}summary{font-weight:700;cursor:pointer}dialog{padding:0;border:1px solid #707762;background:#050505;max-width:95vw;max-height:95vh}dialog img{display:block;max-width:90vw;width:780px;height:auto}dialog button{position:fixed;right:4vw;top:3vh;font:inherit;padding:8px 18px;border-radius:8px;background:#e7e3da;color:#050505;border:2px solid #050505}dialog::backdrop{background:#000d}footer{margin:40px 0;color:#bdbbb3}@media(max-width:600px){main{padding:18px}h1{font-size:29px}td,th{min-width:110px;font-size:14px}#rules td:nth-child(3),#rules td:nth-child(4){min-width:260px}}
</style><main>'''
doc += '<h1>My Timber — it’s live</h1><p>Welcome, the Explore introduction, Support and More are deployed for members. Live since <b>4 November 2026, 19:14:40 GMT</b>.</p>'
doc += '<p><a href="https://shiftsometimber.co.uk/member/dashboard/welcome">Open live My Timber →</a></p>'
doc += f'<div class="notice"><b>Interface live. Full acceptance incomplete.</b><p>The existing clinical assessment remains closed. Questionnaire → checkout → prescribing → dispatch is not proved or enabled. Automatic decline-refunds and safe card holds are not implemented. Four strict speed limits and physical-phone evidence remain failed or unperformed. Nothing below labels a synthetic payment/status fixture as real clinical proof.</p><p>Live front version: <code>{escape(release["candidate"])}</code><br>Source: <code>{escape(release["source"])}</code>. All member traffic, no new feature flag or staged rollout. Existing clinical and supplier gates were preserved.</p></div>'
doc += f'<div class="facts"><span>Live: 28/28 browser checks</span><span>Three journeys: 52/52 conditions</span><span>Unit/model: 42/42 tests</span><span>Full table: {counts.get("PASS",0)} PASS / {counts.get("FAIL",0)} FAIL</span></div>'
doc += '<h2>Latest actual-live speed</h2><p>Chromium, 390 × 844 mobile emulation, 2× display; 150 ms latency, 200,000 bytes/s down, 96,000 bytes/s up, CPU 4× slowdown. Twenty samples per metric. Rounded p95 shown, with raw samples retained. These are not physical iPhone or Android measurements. Limits are Matt’s supplied current-live numbers, not a redefined baseline.</p>'
doc += '<div class="table-wrap">' + speed_table + '</div><p>The older 2-second fresh-screen / 500-ms warm-screen requirements pass. The latest, stricter no-regression limits above do not all pass. No uncaught error was observed in the live navigation or speed runs.</p>'
doc += '<h2>Live screenshots — every available new UI state, plus retained screens</h2><p>Captured from production using owned synthetic account <b>v7-live-proof@example.invalid (900710301)</b>. Chromium and WebKit on the Mac; neither is a physical phone. Full-page captures include the fixed bars once at their actual viewport position. Questionnaire/pay/review outcomes are not represented as live completed clinical screens because the existing assessment gate is closed.</p><label>Engine <select id="engine"><option value="all">Both engines</option><option>chromium</option><option>webkit</option></select></label><div class="gallery">' + gallery + '</div>'
doc += '<h2>Three complete test journeys</h2><p>Freshly reset, dedicated synthetic accounts on the isolated hosted test service, 4 November at 19:34–19:36 GMT. Source was restored to the same qualified source used in the live member version before these reruns. All six recordings and both live navigation recordings are in <b>My-Timber-LIVE-recordings.zip</b>. No real member, purchase, payment, message or phone call was made.</p>' + journeys
doc += '<h2>Pass/fail against the briefs</h2><p>W: Welcome/Explore brief. A: Support/More addendum. V: original V7 brief. M: must-not-break list. H: shell. S/R: latest release and speed instructions. FAIL includes missing required verification; it does not by itself assert a new defect. Retained source/routes are distinguished from exercised destructive or financial operations.</p><input id="search" type="search" placeholder="Search rules or evidence" aria-label="Search rules"><select id="result"><option value="all">All results</option><option>PASS</option><option>FAIL</option></select><div class="table-wrap">' + rules_table + '</div>'
doc += '<h2>Clinical boundary and smallest remaining step</h2><p>Connect the existing authorised prescribing/dispensing route, then implement and prove the decline-refund lifecycle in its existing till using synthetic provider/payment events before opening clinical intake. Stripe supports authorisation holds, but this till currently uses automatic capture and does not safely implement hold/capture/cancel/expiry. No medicine checkout was enabled as part of the member interface release.</p><h2>Rollback and preservation</h2><p>One command restores exact previous member front version <code>42f085ae-553c-4b11-82f6-116203fb3c5e</code>: <code>node member-experience/tools/welcome-release.mjs rollback</code>. Core version <code>a301697d-5586-4839-aa44-5edb01105731</code>, bindings and schedules stayed unchanged at deployment. Shop home text and links match the captured pre-release version in both live engines; earlier test-site before/after visual recordings are separately retained. Complete payment/settings mutation proof is not claimed.</p><p>No Apple submission, real member test, external communication, purchase or spending occurred.</p><footer>Evidence generated from the recorded deployment, current live screenshots and raw timing results. This report supersedes the earlier NOT LIVE checkpoint report.</footer></main><dialog id="zoom"><button id="close">Close</button><img alt="Enlarged actual live screenshot"></dialog><script>const q=s=>document.querySelector(s);q("#engine").onchange=e=>document.querySelectorAll("figure").forEach(f=>f.hidden=e.target.value!=="all"&&f.dataset.engine!==e.target.value);function filter(){const term=q("#search").value.toLowerCase(),state=q("#result").value;document.querySelectorAll("#rules tbody tr").forEach(r=>r.hidden=!r.innerText.toLowerCase().includes(term)||(state!=="all"&&r.dataset.result!==state));}q("#search").oninput=filter;q("#result").onchange=filter;document.querySelectorAll(".screenshot").forEach(b=>b.onclick=()=>{q("#zoom img").src=b.querySelector("img").src;q("#zoom").showModal();});q("#close").onclick=()=>q("#zoom").close();</script></html>'
(root / 'My-Timber-LIVE-Report.html').write_text(doc)
(root / 'LATEST-20261104.md').write_text(f'''# My Timber live interface release — 4 November 2026\n\nMember front is live at 100% since {release['liveAt']}; version {release['candidate']}; source {release['source']}. Core unchanged at deployment.\n\n28/28 live browser checks, 52/52 freshly reset test-site journey conditions, 42/42 unit/model tests. No physical-phone proof.\n\nFull acceptance incomplete: existing assessment closed/unconfigured; automatic decline-refund and safe card holds absent; four strict speed limits missed. Latest p95: Today 1379ms; Fit 1372ms; visited tab worst 33ms; tap 33ms; repeat shell 82ms. Twenty samples each on actual live throttled Chromium mobile profile.\n\nShop home source/text/links/appearance preserved, no clinical gate enabled, no financial or real-member testing. One-step rollback: node member-experience/tools/welcome-release.mjs rollback.\n\nSee My-Timber-LIVE-Report.html, pass-fail.json/CSV, interface-live-release.json, live-screens/, live-mobile-speed/ and v7-journeys-* results and recordings.\n''')
print(json.dumps({'reportBytes': (root / 'My-Timber-LIVE-Report.html').stat().st_size, 'rules': len(rows), 'counts': counts, 'live': release['candidate']}))
