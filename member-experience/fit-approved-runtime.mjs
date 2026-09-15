import {fitRuntime as baseFitRuntime} from './fit-runtime.mjs';

function purpose(item = {}) {
  const detail = item.purpose || {};
  if (!item.selection_reason && !detail.focus && !detail.benefit && !detail.weightLoss) return '';
  const sources = (detail.sources || []).filter(Boolean);
  return `<div class="sf-exercise-purpose">${item.selection_reason ? `<div><small>WHY THIS IS HERE</small><p>${esc(item.selection_reason)}</p></div>` : ''}${detail.focus || detail.benefit ? `<div><small>WHAT IT WORKS</small>${detail.focus ? `<strong>${esc(detail.focus)}</strong>` : ''}${detail.benefit ? `<p>${esc(detail.benefit)}</p>` : ''}</div>` : ''}${detail.weightLoss ? `<div><small>HOW IT SUPPORTS YOUR GOALS</small><p>${esc(detail.weightLoss)}</p><p>Regular activity can support mood, sleep and mental wellbeing; one movement cannot promise an immediate mental-clarity effect.</p></div>` : ''}${sources.length ? `<details><summary>Evidence behind this guidance</summary><ul>${sources.map((url, index) => `<li><a href="${esc(url)}" target="_blank" rel="noopener">${index ? 'Weight-management guidance' : 'Activity guidance'}</a></li>`).join('')}</ul></details>` : ''}</div>`;
}

function exercise(item, index, day) {
  const metrics = [];
  if (item.sets) metrics.push(`${item.sets} SETS`);
  if (item.reps) metrics.push(`${item.reps} REPS`);
  if (item.minutes) metrics.push(`${item.minutes} MIN`);
  if (item.rest_seconds) metrics.push(`${item.rest_seconds} SEC REST`);
  return `<article class="sf-exercise mp-exercise" data-exercise-id="${esc(item.id || '')}" data-exercise-group="${esc(item.group || '')}" data-day="${day}" data-base-sets="${esc(item.sets || '')}" data-base-reps="${esc(item.reps || '')}" data-base-minutes="${esc(item.minutes || '')}" data-base-rest="${esc(item.rest_seconds || '')}"><span class="sf-number">${index + 1}</span><div class="sf-exercise-art">${art(item)}</div><div class="sf-exercise-main"><h4>${esc(item.name || 'Exercise')}</h4><div class="sf-metrics" data-sf-metrics>${metrics.map((metric) => `<span>${esc(metric)}</span>`).join('')}</div>${purpose(item)}${item.notes ? `<p>${esc(item.notes)}</p>` : ''}${(item.how || []).length ? `<details><summary>Show me how</summary><ol>${item.how.map((step) => `<li>${esc(step)}</li>`).join('')}</ol></details>` : ''}<div class="sf-completion"><button data-sf-complete="done" type="button">✓ Done</button><button data-sf-complete="skip" type="button">Skip today</button><select data-sf-skip-reason hidden aria-label="Why are you skipping this exercise?"><option value="">Choose a reason</option><option value="too_difficult">Too difficult</option><option value="pain_or_discomfort">Pain or discomfort</option><option value="no_equipment">No equipment</option><option value="ran_out_of_time">Ran out of time</option><option value="did_not_enjoy">Didn’t enjoy it</option></select></div></div><div class="sf-exercise-actions">${(item.how || []).length ? '<button data-sf-show type="button">Show me how</button>' : ''}<button data-fit-vote="nay" type="button">Swap</button></div></article>`;
}

function difficultyControl() {
  return '<div class="sf-difficulty"><label>SESSION EFFORT<select data-sf-difficulty><option value="planned">As planned</option><option value="easier">Go easier</option><option value="harder">Go harder</option></select></label><p data-sf-difficulty-note aria-live="polite">Adjusts the dose and rest for this session. It does not override your safety choices.</p></div>';
}

function adjustSession(select) {
  const session = select.closest('.sf-session');
  const level = select.value;
  const scale = level === 'easier' ? 0.8 : level === 'harder' ? 1.2 : 1;
  session.querySelectorAll('.sf-exercise').forEach((card) => {
    const base = {
      sets: Number(card.dataset.baseSets || 0),
      reps: Number(card.dataset.baseReps || 0),
      minutes: Number(card.dataset.baseMinutes || 0),
      rest: Number(card.dataset.baseRest || 0),
    };
    const metrics = [];
    if (base.sets) metrics.push(`${base.sets} SETS`);
    if (base.reps) metrics.push(`${Math.max(1, Math.round(base.reps * scale))} REPS`);
    if (base.minutes) metrics.push(`${Math.max(1, Math.round(base.minutes * scale))} MIN`);
    if (base.rest) {
      const rest = level === 'easier' ? base.rest + 15 : level === 'harder' ? Math.max(15, base.rest - 15) : base.rest;
      metrics.push(`${rest} SEC REST`);
    }
    card.querySelector('[data-sf-metrics]').innerHTML = metrics.map((metric) => `<span>${esc(metric)}</span>`).join('');
  });
  const note = session.querySelector('[data-sf-difficulty-note]');
  note.textContent = level === 'easier'
    ? 'Easier: about 20% fewer reps or minutes, with 15 seconds more rest where rest is prescribed.'
    : level === 'harder'
      ? 'Harder: about 20% more reps or minutes, with 15 seconds less rest—stop if form breaks down or anything hurts.'
      : 'Back to the approved dose and rest for this session.';
}

const approvedArt = `
  function art(item = {}) {
    const canonical = String(
      item.canonical_movement || item.visual?.canonical_movement || "",
    )
      .trim()
      .toLowerCase();
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(canonical)) return "";
    const alt =
      item.visual?.alt_text ||
      \`\${item.name || "Exercise"}: start, movement and finish positions.\`;
    return \`<img class="sf-approved-exercise-image" src="/fit-v3-images/\${esc(canonical)}.png" alt="\${esc(alt)}" loading="lazy" decoding="async" width="1280" height="720">\`;
  }
`.trimEnd();

const artBlock = /  function art\(item = \{\}\) \{[\s\S]*?\n  \}\n  function brief/;
if (!artBlock.test(baseFitRuntime)) {
  throw new Error('Fit approved-image integration could not find the legacy art renderer.');
}

let fitRuntime = baseFitRuntime.replace(
  artBlock,
  `${approvedArt}\n  function brief`,
);

const exerciseBlock = /  function exercise\(item, index, day\) \{[\s\S]*?\n  \}\n  function sessionCard/;
if (!exerciseBlock.test(fitRuntime)) {
  throw new Error('Fit purpose integration could not find the exercise renderer.');
}
fitRuntime = fitRuntime.replace(
  exerciseBlock,
  `  ${purpose.toString()}\n  ${exercise.toString()}\n  function sessionCard`,
);

const sessionHook = '</div></div>${brief(session, index)}<div class="sf-exercises">';
if (!fitRuntime.includes(sessionHook)) {
  throw new Error('Fit difficulty integration could not find the session controls hook.');
}
fitRuntime = fitRuntime.replace(
  sessionHook,
  '</div></div>${brief(session, index)}${difficultyControl()}<div class="sf-exercises">',
);

const changeHook = 'const select = event.target.closest("[data-sf-skip-reason]");';
if (!fitRuntime.includes(changeHook)) {
  throw new Error('Fit difficulty integration could not find the change handler.');
}
fitRuntime = fitRuntime.replace(
  changeHook,
  'const difficulty = event.target.closest("[data-sf-difficulty]");\n        if (difficulty) { adjustSession(difficulty); return; }\n        const select = event.target.closest("[data-sf-skip-reason]");',
);

const initHook = '  function init() {';
fitRuntime = fitRuntime.replace(
  initHook,
  `  ${difficultyControl.toString()}\n  ${adjustSession.toString()}\n${initHook}`,
);

export {fitRuntime};
