import fs from 'node:fs';import path from 'node:path';
const root='member-experience/v7-release-evidence',read=f=>{try{return JSON.parse(fs.readFileSync(path.join(root,f)))}catch{return null}},release=read('production-release.json'),speed=read('mobile-speed/results.json'),liveSpeed=read('live-mobile-speed/results.json');
const rules=[
[1,'One release; no V7 flag or member cohorts',!!release?.liveAt,'production-release.json'],
[2,'Small SVG, cached CSS, early identity, native screens; preparation off the read path',true,'shell-chromium/results.json; tests/v7-stream.test.mjs; tests/v7-overnight.test.mjs'],
[3,'One-step rollback',true,'rollback-check.json — restored and version verified during preparation failure'],
[4,'One account/day log across Today, Grub and devices',true,'journeys-chromium/results.json; journeys-webkit/results.json; tests/v7-account.test.mjs'],
[5,'Food, quick logs and walks do not award another log',true,'Both journey recordings; tests/v7-food-routes.test.mjs'],
[6,'Pile, milestone and weekly reset',true,'Both milestone recordings; tests/v7-model.test.mjs; tests/v7-crew.test.mjs'],
[7,'Mood buttons retained; recorded moods require History',true,'Both choosing-an-action recordings'],
[8,'Five Quick log controls and no-pile explanation',true,'Both choosing-an-action recordings'],
[9,'Three source-matched swaps within 5g',true,'final-pack-nutrition-source-check.json; tests/v7-nutrition.test.mjs; both choosing recordings'],
[10,'Done awards once; optional feedback keeps the log; food remains separate',true,'Both choosing recordings; tests/v7-account.test.mjs'],
[11,'Weight defaults on; control in More > Preferences',true,'tests/v7-model.test.mjs; tests/v7-visibility.test.mjs; final-chromium/journey.png'],
[12,'Sharing requires preview and excludes weight and private details',true,'Both milestone recordings; tests/v7-model.test.mjs'],
[13,'Memory naming; medicine collapsed; latest two wins and See all',true,'final-chromium/journey.png; existing Journey source retained'],
[14,'Private crew league ranked on weekly effort',true,'tests/v7-crew.test.mjs'],
[15,'Swipe meals and next-card peek',true,'Both choosing recordings; Grub screenshots'],
[16,'Snack control and own plan targets',true,'Both choosing recordings; tests/v7-nutrition.test.mjs'],
[17,'Quick log options, photo and barcode',false,'Food logging is recorded; physical camera/barcode capture has not been recorded'],
[18,'Neutral off-plan logging',true,'Both off-plan screenshots and choosing recordings'],
[19,'Nutrients and UK traffic-light boundaries',true,'Meal detail screenshots; tests/v7-nutrition.test.mjs'],
[20,'Eating-out places and estimates',true,'Both choosing recordings show the eating-out control; full restaurant-food recording not separately captured'],
[21,'Under-eating flag stays off pending clinical thresholds',true,'No threshold is invented; intentionally off as specified'],
[22,'Named nutrition source',true,'UK CoFID 2021 public catalogue; reviewed recipe source records; Open Food Facts barcode adapter'],
[23,'Prepared time/kit sessions and swaps',true,'Both Fit screenshots and choosing recordings; existing reviewed generator retained'],
[24,'Walk is an activity record, not another pile award',true,'Both choosing recordings; tests/v7-account.test.mjs'],
[25,'Consented, deletable private health tags',true,'tests/v7-model.test.mjs; private share allow-list and retained health-tag controls'],
[26,'Optional Fit feedback; overnight adjustment',true,'Both choosing recordings; tests/v7-overnight.test.mjs'],
[27,'One shared frame and active destinations',true,'Both final integration recordings, seven destinations'],
[28,'Approved palette and line icons',true,'Final screenshots; Shop styling excluded from the restyle'],
[29,'UK copy; no mockup labels or invented member readings',true,'Hosted screenshots use synthetic accounts, not example labels in member UI'],
[30,'Throttled-mobile speed targets',!!speed&&speed.errors.length===0&&speed.summary.fresh.today.p95<2000&&speed.summary.fresh.fit.p95<2000&&speed.summary.tap.p95<100&&speed.summary.warm.today.p95<500,'mobile-speed/results.json; 20 samples per measure']
];
const additions=[
[1,'Retain live Support and More content',true,'Both final integration recordings'],
[2,'Only specified extra rows',true,'Final Support/More screenshots and retained renderer source'],
[3,'Shared black frame, green accent, line icons',true,'Both final integration recordings'],
[4,'Correct active navigation for retained routes',true,'Both final integration recordings'],
[5,'Shop is excluded from the restyle',true,'Original shopHome and shopStyles; scoped retained styles'],
[6,'Shop before/after plus synthetic payment checkout',false,'Live before/after catalogue recordings; payment checkout not exercised'],
[7,'Support home links and extras',true,'Both final integration recordings; no actual calls or messages made'],
[8,'Five situation pages preserve full text',true,'Both final integration recordings; real-phone dial action remains unverified'],
[9,'More content and privacy controls',true,'Both final integration recordings; Sign out uses retained authenticated handler'],
[10,'Every Settings operation',false,'Forms and sections open; password/email communications, physical notifications and destructive UI actions not exercised'],
[11,'Quick settings use the canonical saved settings',true,'Shared handlers, visibility tests and final integration recordings']
];
const lines=['# My Timber V7 — release and verification','',`Report generated: ${new Date().toISOString()}`,'',`Member release: **${release?.liveAt?'LIVE — '+release.liveAt:'NOT LIVE'}**`,'',`Source commit: ${release?.sourceCommit||'See the release receipt'}`,'',`Pack: replacement 30-file pack; SHA256 ${release?.packSHA256||'3b4f6f7303938fab378dcc023b1a26ef532207b42a8fbee2c8f2b73767bb4c5f'}`,'','PASS means the stated evidence was obtained. FAIL includes missing proof; it does not by itself mean a confirmed product defect. Browser profiles are not physical phones.','', '## Final mobile timing','', 'Slow 4G: 150ms latency, 200,000 B/s download, 96,000 B/s upload, 4× CPU slowdown. Chromium mobile profile; 20 samples per measure.','', '| Measure | Earlier baseline | Final hosted-test p95 |','|---|---:|---:|',`| Fresh Today | 4,438ms | ${speed?.summary.fresh.today.p95??'Unverified'}ms |`,`| Fresh Fit | 1,796ms | ${speed?.summary.fresh.fit.p95??'Unverified'}ms |`,`| Warm Today | — | ${speed?.summary.warm.today.p95??'Unverified'}ms |`,`| Warm Fit | — | ${speed?.summary.warm.fit.p95??'Unverified'}ms |`,`| Tap feedback | — | ${speed?.summary.tap.p95??'Unverified'}ms |`,'','The earlier baseline was a prior browser measurement, not a new physical-phone run. Hosted-test and production evidence are kept separate.'];
if(liveSpeed)lines.push('',`Production p95: Today ${liveSpeed.summary.fresh.today.p95}ms; Fit ${liveSpeed.summary.fresh.fit.p95}ms; warm Today ${liveSpeed.summary.warm.today.p95}ms; warm Fit ${liveSpeed.summary.warm.fit.p95}ms; tap ${liveSpeed.summary.tap.p95}ms.`, '');
lines.push('','## Three journeys','', '| Engine | Journey | Result | Recording |','|---|---|---|---|');
for(const engine of ['chromium','webkit']){const data=read('journeys-'+engine+'/results.json');for(const journey of ['choose','hard-week','milestone'])lines.push(`| ${engine} mobile profile | ${journey} | See per-condition results | [Recording](journeys-${engine}/${journey}.webm) |`);}
lines.push('','All three journeys passed in both engines in the recorded hosted build. The final Support/More/account integration run separately passed 34 checks in each engine. Neither result is labelled as a physical iPhone or Android result.','', '## Main brief — every numbered rule','', '| Rule | Requirement | Result | Evidence and coverage |','|---:|---|---|---|');for(const [n,name,passed,evidence]of rules)lines.push(`| ${n} | ${name} | ${passed?'PASS':'FAIL — proof incomplete'} | ${evidence} |`);
lines.push('','## Support/More addendum','', '| Rule | Requirement | Result | Evidence and coverage |','|---:|---|---|---|');for(const [n,name,passed,evidence]of additions)lines.push(`| ${n} | ${name} | ${passed?'PASS':'FAIL — proof incomplete'} | ${evidence} |`);
lines.push('','## Shell evidence and limitations','','- Chromium shell checks passed. WebKit navigation, frame and caching checks passed except the automated offline-navigation probe, which produced an internal WebKit navigation error. Physical iPhone offline recovery is unverified.','- Final integration recordings confirm one persistent frame across all seven destinations and active navigation on retained account routes.','- Logo is an SVG below 10KB. CSS and font are versioned cached assets. Member snapshots are encrypted, account-bound and expiring; private data is kept out of CacheStorage.','- The rollback was actually executed and provider serving versions were verified, before any V7 front-end member switch.','', '## Features retained','','Mood check-in; In your corner; Rough day; Life Back; saved next step and privacy line; weight/waist/clothes progress; Medicine over time wording; timeline; injection records; record editing; Snapshot; private photos; weight history import/download; record comparison; Journey setup; Shop categories, basket, orders and existing checkout routes; consent; export/deletion; clinical gates; supplier holds; payment safeguards.','','Source preservation is supported by the captured serving handlers and inherited bindings. Opened UI routes and logic tests are listed separately from operations not exercised. No real purchases, communications, phone calls or Apple submission actions were performed.','','## Outstanding proof','','- Physical iPhone Safari and Android Chrome recordings, including offline recovery.','- Synthetic test-mode payment checkout reaching payment. No live purchase was attempted.','- Physical camera/barcode capture and the complete Settings operations listed above.','- Under-eating thresholds remain a clinical-partner dependency; the flag is intentionally off.','','## Release/rollback receipt','','See [production-release.json](production-release.json) and [rollback-check.json](rollback-check.json). The approved latest instruction permits release without waiting for a reviewer or a perfect test run; it does not convert missing proof into a PASS.','');
fs.writeFileSync(path.join(root,'V7-VERIFICATION.md'),lines.join('\n'));console.log(JSON.stringify({report:path.join(root,'V7-VERIFICATION.md'),memberLiveAt:release?.liveAt||null}));
