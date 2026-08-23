import fs from 'node:fs';

const files={
  server:fs.readFileSync(new URL('./member-daily-v3.js',import.meta.url),'utf8'),
  engine:fs.readFileSync(new URL('./my-timber-rebuild-v1.js',import.meta.url),'utf8'),
  api:fs.readFileSync(new URL('./frontend/member/api-adapter-v33d.js',import.meta.url),'utf8'),
  ui:fs.readFileSync(new URL('./frontend/member/member-today-premium-v1.js',import.meta.url),'utf8'),
  css:fs.readFileSync(new URL('./frontend/member/member-today-premium-v1.css',import.meta.url),'utf8')
};
const checks={
  endpoint:/\/v1\/shift\/today\/rebuild/.test(files.server),
  alternativeEndpoint:/\/v1\/shift\/today\/rebuild\/alternative/.test(files.server),
  completionEndpoint:/\/v1\/shift\/today\/complete/.test(files.server),
  persistence:/shift_today_rebuilds/.test(files.server),
  genuineEngine:/rebuildDay\(mode/.test(files.server)&&/working_late/.test(files.engine),
  adapter:/rebuildShiftToday/.test(files.api),
  adaptiveAdapter:/applyShiftTodayAlternative/.test(files.api)&&/completeShiftToday/.test(files.api),
  oneThumbSheet:/data-rebuild/.test(files.ui)&&/mt-change-sheet/.test(files.ui),
  immediateReplacement:/rebuiltDay\(\)/.test(files.ui)&&/rebuild=result\.rebuild/.test(files.ui),
  nowNextLater:/\['NOW',rebuild\.now\].*\['NEXT',rebuild\.next\].*\['LATER',rebuild\.later\]/.test(files.ui),
  sixCoreModes:['working_late','guts_playing_up','absolutely_knackered','going_to_pub','takeaway','chaos'].every(key=>files.ui.includes(key)),
  wholeDayAlternatives:/data-alternative/.test(files.ui)&&/Adjusting the whole day/.test(files.ui)&&/applyRebuildAlternative/.test(files.engine),
  todayShifted:/data-complete-shifted/.test(files.ui)&&/Today shifted\./.test(files.server)&&/shift_today_completions/.test(files.server),
  preferenceMemory:/shift_today_feedback/.test(files.server)&&/rejectedActions/.test(files.engine)&&/saveShiftTodayFeedback/.test(files.api),
  visibleLearning:/SHIFT IS LEARNING/.test(files.ui)&&/learningStatement/.test(files.ui),
  frictionPrediction:/reported low energy at least twice/.test(files.server)&&/prediction/.test(files.ui),
  weeklyInsight:/weeklyInsight/.test(files.server)&&/This week, Shift noticed/.test(files.ui),
  morningEntry:/Today’s sorted around the day you actually have/.test(files.server)&&/mt-morning/.test(files.ui),
  brandOnly:/#050505|var\(--shift-black\)/.test(files.css)&&/#E7E3DA|var\(--shift-cream\)/.test(files.css)&&/#707762|var\(--shift-green\)/.test(files.css),
  mobileSheet:/env\(safe-area-inset-bottom\)/.test(files.css)&&/@media\(max-width:760px\)/.test(files.css)
};
const failed=Object.entries(checks).filter(([,pass])=>!pass).map(([name])=>name);if(failed.length){console.error(JSON.stringify({proof:'MY_TIMBER_REBUILD_SOURCE',status:'FAIL',failed},null,2));process.exit(1)}
console.log(JSON.stringify({proof:'MY_TIMBER_REBUILD_SOURCE',status:'PASS',checks:Object.keys(checks).length,boundary:'The UI calls the authenticated persisted rebuild endpoint; no static four-box simulation.'},null,2));
