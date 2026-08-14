import fs from 'node:fs';

const read=p=>fs.readFileSync(new URL(`./${p}`,import.meta.url),'utf8');
const route=read('shift-me-v1.js');
const entry=read('worker-entry-shift-me-v1.js');
const canonicalEntry=read('worker-entry-v6.js');
const config=read('wrangler-shift-me.jsonc');
const canonicalConfig=read('wrangler.jsonc');
const browser=read('frontend/member/shift-me-api-v1.js');
const creator=read('frontend/member/member-shift-me-premium-v1.js');
const creatorCss=read('frontend/member/member-shift-me-premium-v1.css');
const shell=read('frontend/member/member-shell-v33g.js');
const spec=read('STORYBOARD-LOCKED-PRODUCTION-SPEC.md');

const checks=[
  ['storyboard is explicit immutable acceptance authority',spec.includes('IMMUTABLE VISUAL AUTHORITY')&&spec.includes('Storyboard is an acceptance test, not inspiration')],
  ['consent required',route.includes('consent_required')],
  ['authenticated via existing me route',route.includes("new URL('/v1/me'")],
  ['approved image types bounded',route.includes('image/jpeg')&&route.includes('image/png')&&route.includes('image/webp')&&route.includes('MAX_BYTES=3_000_000')],
  ['ordinary bloke prompt guard',route.includes('ordinary bloke')&&route.includes('fitness model')],
  ['same-member identity lock is explicit',route.includes('SAME adult man')&&route.includes('Identity lock is the highest priority')&&route.includes('recognisable facial identity')],
  ['model guard excludes bodybuilder/model drift',route.includes('bodybuilder')&&route.includes('fashion model')&&route.includes('six pack')],
  ['silent beautify/slim/muscularise/de-age drift forbidden',route.includes('Do not beautify, slim, muscularise, de-age')],
  ['subtle apparel S sizing locked',route.includes('28–30mm')&&spec.includes('Apparel: 28–30 mm')],
  ['source photo not persisted',!route.includes('source_image_base64')&&!route.includes('source_photo_base64')&&route.includes('sourcePhotoStored:false')],
  ['all persisted reads are member-scoped',route.includes('WHERE user_id=? AND deleted_at IS NULL LIMIT 1')],
  ['generated write is member-scoped unique',route.includes('user_id INTEGER NOT NULL UNIQUE')&&route.includes('ON CONFLICT(user_id) DO UPDATE')],
  ['deletion is member-scoped',route.includes("UPDATE shift_me_v1 SET deleted_at=CURRENT_TIMESTAMP,image_base64='' WHERE user_id=? AND deleted_at IS NULL")],
  ['deleted asset bytes are cleared',route.includes("image_base64=''" )],
  ['generated image response is private/no-store',route.includes("'Cache-Control':'private, no-store'")&&route.includes("'X-Content-Type-Options':'nosniff'" )],
  ['all commissioned creator controls are backend-authoritative',['build','bodyShape','face','hair','hairline','facial','skin','eyes','glasses','top','bottom','accessory'].every(k=>route.includes(`${k}:[`))],
  ['rerender route uses the retained member Shift Me',route.includes("path==='/v1/shift-me/rerender'")&&route.includes("'existing-shift-me'")],
  ['compatibility wrapper composes without replacing base implementation',entry.includes("import base from './worker-entry-v6.js'")&&entry.includes('shiftMeRoutes')],
  ['canonical production Worker dispatches Shift Me',canonicalEntry.includes("import {shiftMeRoutes} from './shift-me-v1.js'")&&canonicalEntry.includes('const shiftMe=await shiftMeRoutes(request,env,ctx)')],
  ['canonical member CORS recognises Shift Me',canonicalEntry.includes("path.startsWith('/v1/shift-me')")],
  ['deploy config keeps AI binding',config.includes('"ai"')&&config.includes('"binding":"AI"')],
  ['deploy config keeps D1 binding',config.includes('"binding":"DB"')],
  ['browser adapter uses authenticated cookies',browser.includes("credentials:'include'")],
  ['browser adapter sends appearance',browser.includes("form.append('appearance'")],
  ['browser adapter has bounded render timeout',browser.includes('90000')&&browser.includes('AbortController')],
  ['browser adapter exposes render/rerender/read/delete',browser.includes('renderShiftMe')&&browser.includes('rerenderShiftMe')&&browser.includes('getShiftMe')&&browser.includes('deleteShiftMe')],
  ['member shell loads Shift Me API and premium creator',shell.includes("SHIFT_ME_API_SRC='/shift-me-api-v1.js?v=1'")&&shell.includes("SHIFT_ME_PREMIUM_SRC='/member-shift-me-premium-v1.js?v=1'")&&shell.includes("SHIFT_ME_PREMIUM_CSS='/member-shift-me-premium-v1.css?v=1'")&&shell.includes('ensureShiftMePremium()')],
  ['creator is integrated as an existing dashboard panel',creator.includes("tab.dataset.panel='shiftme'")&&creator.includes("panel.id='panel-shiftme'")&&creator.includes("className='mp-panel'")],
  ['creator performs real photo render',creator.includes("type=\"file\"")&&creator.includes('renderShiftMe(file,appearance(panel))')],
  ['creator exposes every commissioned control',['build','bodyShape','face','hair','hairline','facial','skin','eyes','glasses','top','bottom','accessory'].every(k=>creator.includes(`${k}:[`))],
  ['creator performs control rerender',creator.includes('rerenderShiftMe(appearance(panel))')&&creator.includes('data-shift-me-control')],
  ['creator reloads persisted member Shift Me',creator.includes('getShiftMe()')&&creator.includes('shiftMeImageUrl')&&creator.includes('Saved to your Shift account')],
  ['creator exposes real deletion lifecycle',creator.includes('deleteShiftMe()')&&creator.includes('Delete my Shift Me')],
  ['creator refuses a fake placeholder person',creator.includes('No fake mannequin.')&&!creator.includes('placeholder-avatar')],
  ['creator carries privacy and non-clinical boundary copy',creator.includes('source photo is used for the render and is not retained')&&creator.includes('not identity verification')&&creator.includes('not a body scan')&&creator.includes('not a health assessment')],
  ['premium creator has mobile layout contract',creatorCss.includes('@media(max-width:640px)')&&creatorCss.includes('.sm-control-grid{grid-template-columns:1fr}')&&creatorCss.includes('min-height:46px')],
  ['premium creator keeps forest/cream visual constitution',creatorCss.includes('--sm-forest:#17261d')&&creatorCss.includes('--sm-cream:#f4f1e8')],
  ['canonical Worker serves all Shift Me member assets',canonicalEntry.includes("'/shift-me-api-v1.js'")&&canonicalEntry.includes("'/member-shift-me-premium-v1.js'")&&canonicalEntry.includes("'/member-shift-me-premium-v1.css'")],
  ['canonical deploy routes all Shift Me assets on both hosts',['shift-me-api-v1.js','member-shift-me-premium-v1.js','member-shift-me-premium-v1.css'].every(a=>canonicalConfig.includes(`shiftsometimber.co.uk/${a}*`)&&canonicalConfig.includes(`www.shiftsometimber.co.uk/${a}*`))],
  ['compatibility deploy routes all Shift Me assets on both hosts',['shift-me-api-v1.js','member-shift-me-premium-v1.js','member-shift-me-premium-v1.css'].every(a=>config.includes(`shiftsometimber.co.uk/${a}*`)&&config.includes(`www.shiftsometimber.co.uk/${a}*`))],
];
const failed=checks.filter(([,ok])=>!ok);
for(const [name,ok]of checks)console.log(`${ok?'PASS':'FAIL'} ${name}`);
if(failed.length){console.error(`Shift Me source gate failed: ${failed.map(([n])=>n).join(', ')}`);process.exit(1);}
console.log(JSON.stringify({proof:'SHIFT_ME_STORYBOARD_LOCKED_MEMBER_JOURNEY_SOURCE_V2',status:'PASS',checks:checks.length,acceptanceBoundary:'Source/product wiring only. Production PASS still requires real authenticated photo -> generated same-member image -> selected control change -> rerender -> retained return, plus visual fidelity against the approved storyboard.'},null,2));
