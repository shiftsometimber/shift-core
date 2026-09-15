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

// Function#toString changes when Wrangler bundles this module. Decode the reviewed
// browser source from stable UTF-8 constants so local and deployed assets stay exact.
const decodeInjectedSource = (value) =>
  new TextDecoder().decode(Uint8Array.from(atob(value), (char) => char.charCodeAt(0)));
const exerciseSource = decodeInjectedSource('ICBmdW5jdGlvbiBwdXJwb3NlKGl0ZW0gPSB7fSkgewogIGNvbnN0IGRldGFpbCA9IGl0ZW0ucHVycG9zZSB8fCB7fTsKICBpZiAoIWl0ZW0uc2VsZWN0aW9uX3JlYXNvbiAmJiAhZGV0YWlsLmZvY3VzICYmICFkZXRhaWwuYmVuZWZpdCAmJiAhZGV0YWlsLndlaWdodExvc3MpIHJldHVybiAnJzsKICBjb25zdCBzb3VyY2VzID0gKGRldGFpbC5zb3VyY2VzIHx8IFtdKS5maWx0ZXIoQm9vbGVhbik7CiAgcmV0dXJuIGA8ZGl2IGNsYXNzPSJzZi1leGVyY2lzZS1wdXJwb3NlIj4ke2l0ZW0uc2VsZWN0aW9uX3JlYXNvbiA/IGA8ZGl2PjxzbWFsbD5XSFkgVEhJUyBJUyBIRVJFPC9zbWFsbD48cD4ke2VzYyhpdGVtLnNlbGVjdGlvbl9yZWFzb24pfTwvcD48L2Rpdj5gIDogJyd9JHtkZXRhaWwuZm9jdXMgfHwgZGV0YWlsLmJlbmVmaXQgPyBgPGRpdj48c21hbGw+V0hBVCBJVCBXT1JLUzwvc21hbGw+JHtkZXRhaWwuZm9jdXMgPyBgPHN0cm9uZz4ke2VzYyhkZXRhaWwuZm9jdXMpfTwvc3Ryb25nPmAgOiAnJ30ke2RldGFpbC5iZW5lZml0ID8gYDxwPiR7ZXNjKGRldGFpbC5iZW5lZml0KX08L3A+YCA6ICcnfTwvZGl2PmAgOiAnJ30ke2RldGFpbC53ZWlnaHRMb3NzID8gYDxkaXY+PHNtYWxsPkhPVyBJVCBTVVBQT1JUUyBZT1VSIEdPQUxTPC9zbWFsbD48cD4ke2VzYyhkZXRhaWwud2VpZ2h0TG9zcyl9PC9wPjxwPlJlZ3VsYXIgYWN0aXZpdHkgY2FuIHN1cHBvcnQgbW9vZCwgc2xlZXAgYW5kIG1lbnRhbCB3ZWxsYmVpbmc7IG9uZSBtb3ZlbWVudCBjYW5ub3QgcHJvbWlzZSBhbiBpbW1lZGlhdGUgbWVudGFsLWNsYXJpdHkgZWZmZWN0LjwvcD48L2Rpdj5gIDogJyd9JHtzb3VyY2VzLmxlbmd0aCA/IGA8ZGV0YWlscz48c3VtbWFyeT5FdmlkZW5jZSBiZWhpbmQgdGhpcyBndWlkYW5jZTwvc3VtbWFyeT48dWw+JHtzb3VyY2VzLm1hcCgodXJsLCBpbmRleCkgPT4gYDxsaT48YSBocmVmPSIke2VzYyh1cmwpfSIgdGFyZ2V0PSJfYmxhbmsiIHJlbD0ibm9vcGVuZXIiPiR7aW5kZXggPyAnV2VpZ2h0LW1hbmFnZW1lbnQgZ3VpZGFuY2UnIDogJ0FjdGl2aXR5IGd1aWRhbmNlJ308L2E+PC9saT5gKS5qb2luKCcnKX08L3VsPjwvZGV0YWlscz5gIDogJyd9PC9kaXY+YDsKfQogIGZ1bmN0aW9uIGV4ZXJjaXNlKGl0ZW0sIGluZGV4LCBkYXkpIHsKICBjb25zdCBtZXRyaWNzID0gW107CiAgaWYgKGl0ZW0uc2V0cykgbWV0cmljcy5wdXNoKGAke2l0ZW0uc2V0c30gU0VUU2ApOwogIGlmIChpdGVtLnJlcHMpIG1ldHJpY3MucHVzaChgJHtpdGVtLnJlcHN9IFJFUFNgKTsKICBpZiAoaXRlbS5taW51dGVzKSBtZXRyaWNzLnB1c2goYCR7aXRlbS5taW51dGVzfSBNSU5gKTsKICBpZiAoaXRlbS5yZXN0X3NlY29uZHMpIG1ldHJpY3MucHVzaChgJHtpdGVtLnJlc3Rfc2Vjb25kc30gU0VDIFJFU1RgKTsKICByZXR1cm4gYDxhcnRpY2xlIGNsYXNzPSJzZi1leGVyY2lzZSBtcC1leGVyY2lzZSIgZGF0YS1leGVyY2lzZS1pZD0iJHtlc2MoaXRlbS5pZCB8fCAnJyl9IiBkYXRhLWV4ZXJjaXNlLWdyb3VwPSIke2VzYyhpdGVtLmdyb3VwIHx8ICcnKX0iIGRhdGEtZGF5PSIke2RheX0iIGRhdGEtYmFzZS1zZXRzPSIke2VzYyhpdGVtLnNldHMgfHwgJycpfSIgZGF0YS1iYXNlLXJlcHM9IiR7ZXNjKGl0ZW0ucmVwcyB8fCAnJyl9IiBkYXRhLWJhc2UtbWludXRlcz0iJHtlc2MoaXRlbS5taW51dGVzIHx8ICcnKX0iIGRhdGEtYmFzZS1yZXN0PSIke2VzYyhpdGVtLnJlc3Rfc2Vjb25kcyB8fCAnJyl9Ij48c3BhbiBjbGFzcz0ic2YtbnVtYmVyIj4ke2luZGV4ICsgMX08L3NwYW4+PGRpdiBjbGFzcz0ic2YtZXhlcmNpc2UtYXJ0Ij4ke2FydChpdGVtKX08L2Rpdj48ZGl2IGNsYXNzPSJzZi1leGVyY2lzZS1tYWluIj48aDQ+JHtlc2MoaXRlbS5uYW1lIHx8ICdFeGVyY2lzZScpfTwvaDQ+PGRpdiBjbGFzcz0ic2YtbWV0cmljcyIgZGF0YS1zZi1tZXRyaWNzPiR7bWV0cmljcy5tYXAoKG1ldHJpYykgPT4gYDxzcGFuPiR7ZXNjKG1ldHJpYyl9PC9zcGFuPmApLmpvaW4oJycpfTwvZGl2PiR7cHVycG9zZShpdGVtKX0ke2l0ZW0ubm90ZXMgPyBgPHA+JHtlc2MoaXRlbS5ub3Rlcyl9PC9wPmAgOiAnJ30keyhpdGVtLmhvdyB8fCBbXSkubGVuZ3RoID8gYDxkZXRhaWxzPjxzdW1tYXJ5PlNob3cgbWUgaG93PC9zdW1tYXJ5PjxvbD4ke2l0ZW0uaG93Lm1hcCgoc3RlcCkgPT4gYDxsaT4ke2VzYyhzdGVwKX08L2xpPmApLmpvaW4oJycpfTwvb2w+PC9kZXRhaWxzPmAgOiAnJ308ZGl2IGNsYXNzPSJzZi1jb21wbGV0aW9uIj48YnV0dG9uIGRhdGEtc2YtY29tcGxldGU9ImRvbmUiIHR5cGU9ImJ1dHRvbiI+4pyTIERvbmU8L2J1dHRvbj48YnV0dG9uIGRhdGEtc2YtY29tcGxldGU9InNraXAiIHR5cGU9ImJ1dHRvbiI+U2tpcCB0b2RheTwvYnV0dG9uPjxzZWxlY3QgZGF0YS1zZi1za2lwLXJlYXNvbiBoaWRkZW4gYXJpYS1sYWJlbD0iV2h5IGFyZSB5b3Ugc2tpcHBpbmcgdGhpcyBleGVyY2lzZT8iPjxvcHRpb24gdmFsdWU9IiI+Q2hvb3NlIGEgcmVhc29uPC9vcHRpb24+PG9wdGlvbiB2YWx1ZT0idG9vX2RpZmZpY3VsdCI+VG9vIGRpZmZpY3VsdDwvb3B0aW9uPjxvcHRpb24gdmFsdWU9InBhaW5fb3JfZGlzY29tZm9ydCI+UGFpbiBvciBkaXNjb21mb3J0PC9vcHRpb24+PG9wdGlvbiB2YWx1ZT0ibm9fZXF1aXBtZW50Ij5ObyBlcXVpcG1lbnQ8L29wdGlvbj48b3B0aW9uIHZhbHVlPSJyYW5fb3V0X29mX3RpbWUiPlJhbiBvdXQgb2YgdGltZTwvb3B0aW9uPjxvcHRpb24gdmFsdWU9ImRpZF9ub3RfZW5qb3kiPkRpZG7igJl0IGVuam95IGl0PC9vcHRpb24+PC9zZWxlY3Q+PC9kaXY+PC9kaXY+PGRpdiBjbGFzcz0ic2YtZXhlcmNpc2UtYWN0aW9ucyI+JHsoaXRlbS5ob3cgfHwgW10pLmxlbmd0aCA/ICc8YnV0dG9uIGRhdGEtc2Ytc2hvdyB0eXBlPSJidXR0b24iPlNob3cgbWUgaG93PC9idXR0b24+JyA6ICcnfTxidXR0b24gZGF0YS1maXQtdm90ZT0ibmF5IiB0eXBlPSJidXR0b24iPlN3YXA8L2J1dHRvbj48L2Rpdj48L2FydGljbGU+YDsKfQ==');
const difficultySource = decodeInjectedSource('ICBmdW5jdGlvbiBkaWZmaWN1bHR5Q29udHJvbCgpIHsKICByZXR1cm4gJzxkaXYgY2xhc3M9InNmLWRpZmZpY3VsdHkiPjxsYWJlbD5TRVNTSU9OIEVGRk9SVDxzZWxlY3QgZGF0YS1zZi1kaWZmaWN1bHR5PjxvcHRpb24gdmFsdWU9InBsYW5uZWQiPkFzIHBsYW5uZWQ8L29wdGlvbj48b3B0aW9uIHZhbHVlPSJlYXNpZXIiPkdvIGVhc2llcjwvb3B0aW9uPjxvcHRpb24gdmFsdWU9ImhhcmRlciI+R28gaGFyZGVyPC9vcHRpb24+PC9zZWxlY3Q+PC9sYWJlbD48cCBkYXRhLXNmLWRpZmZpY3VsdHktbm90ZSBhcmlhLWxpdmU9InBvbGl0ZSI+QWRqdXN0cyB0aGUgZG9zZSBhbmQgcmVzdCBmb3IgdGhpcyBzZXNzaW9uLiBJdCBkb2VzIG5vdCBvdmVycmlkZSB5b3VyIHNhZmV0eSBjaG9pY2VzLjwvcD48L2Rpdj4nOwp9CiAgZnVuY3Rpb24gYWRqdXN0U2Vzc2lvbihzZWxlY3QpIHsKICBjb25zdCBzZXNzaW9uID0gc2VsZWN0LmNsb3Nlc3QoJy5zZi1zZXNzaW9uJyk7CiAgY29uc3QgbGV2ZWwgPSBzZWxlY3QudmFsdWU7CiAgY29uc3Qgc2NhbGUgPSBsZXZlbCA9PT0gJ2Vhc2llcicgPyAwLjggOiBsZXZlbCA9PT0gJ2hhcmRlcicgPyAxLjIgOiAxOwogIHNlc3Npb24ucXVlcnlTZWxlY3RvckFsbCgnLnNmLWV4ZXJjaXNlJykuZm9yRWFjaCgoY2FyZCkgPT4gewogICAgY29uc3QgYmFzZSA9IHsKICAgICAgc2V0czogTnVtYmVyKGNhcmQuZGF0YXNldC5iYXNlU2V0cyB8fCAwKSwKICAgICAgcmVwczogTnVtYmVyKGNhcmQuZGF0YXNldC5iYXNlUmVwcyB8fCAwKSwKICAgICAgbWludXRlczogTnVtYmVyKGNhcmQuZGF0YXNldC5iYXNlTWludXRlcyB8fCAwKSwKICAgICAgcmVzdDogTnVtYmVyKGNhcmQuZGF0YXNldC5iYXNlUmVzdCB8fCAwKSwKICAgIH07CiAgICBjb25zdCBtZXRyaWNzID0gW107CiAgICBpZiAoYmFzZS5zZXRzKSBtZXRyaWNzLnB1c2goYCR7YmFzZS5zZXRzfSBTRVRTYCk7CiAgICBpZiAoYmFzZS5yZXBzKSBtZXRyaWNzLnB1c2goYCR7TWF0aC5tYXgoMSwgTWF0aC5yb3VuZChiYXNlLnJlcHMgKiBzY2FsZSkpfSBSRVBTYCk7CiAgICBpZiAoYmFzZS5taW51dGVzKSBtZXRyaWNzLnB1c2goYCR7TWF0aC5tYXgoMSwgTWF0aC5yb3VuZChiYXNlLm1pbnV0ZXMgKiBzY2FsZSkpfSBNSU5gKTsKICAgIGlmIChiYXNlLnJlc3QpIHsKICAgICAgY29uc3QgcmVzdCA9IGxldmVsID09PSAnZWFzaWVyJyA/IGJhc2UucmVzdCArIDE1IDogbGV2ZWwgPT09ICdoYXJkZXInID8gTWF0aC5tYXgoMTUsIGJhc2UucmVzdCAtIDE1KSA6IGJhc2UucmVzdDsKICAgICAgbWV0cmljcy5wdXNoKGAke3Jlc3R9IFNFQyBSRVNUYCk7CiAgICB9CiAgICBjYXJkLnF1ZXJ5U2VsZWN0b3IoJ1tkYXRhLXNmLW1ldHJpY3NdJykuaW5uZXJIVE1MID0gbWV0cmljcy5tYXAoKG1ldHJpYykgPT4gYDxzcGFuPiR7ZXNjKG1ldHJpYyl9PC9zcGFuPmApLmpvaW4oJycpOwogIH0pOwogIGNvbnN0IG5vdGUgPSBzZXNzaW9uLnF1ZXJ5U2VsZWN0b3IoJ1tkYXRhLXNmLWRpZmZpY3VsdHktbm90ZV0nKTsKICBub3RlLnRleHRDb250ZW50ID0gbGV2ZWwgPT09ICdlYXNpZXInCiAgICA/ICdFYXNpZXI6IGFib3V0IDIwJSBmZXdlciByZXBzIG9yIG1pbnV0ZXMsIHdpdGggMTUgc2Vjb25kcyBtb3JlIHJlc3Qgd2hlcmUgcmVzdCBpcyBwcmVzY3JpYmVkLicKICAgIDogbGV2ZWwgPT09ICdoYXJkZXInCiAgICAgID8gJ0hhcmRlcjogYWJvdXQgMjAlIG1vcmUgcmVwcyBvciBtaW51dGVzLCB3aXRoIDE1IHNlY29uZHMgbGVzcyByZXN04oCUc3RvcCBpZiBmb3JtIGJyZWFrcyBkb3duIG9yIGFueXRoaW5nIGh1cnRzLicKICAgICAgOiAnQmFjayB0byB0aGUgYXBwcm92ZWQgZG9zZSBhbmQgcmVzdCBmb3IgdGhpcyBzZXNzaW9uLic7Cn0=');

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
  `${exerciseSource}\n  function sessionCard`,
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
  `${difficultySource}\n${initHook}`,
);

export {fitRuntime};
