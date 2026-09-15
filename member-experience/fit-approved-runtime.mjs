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
  return `<article class="sf-exercise mp-exercise" data-exercise-id="${esc(item.id || '')}" data-exercise-group="${esc(item.group || '')}" data-day="${day}" data-base-sets="${esc(item.sets || '')}" data-base-reps="${esc(item.reps || '')}" data-base-minutes="${esc(item.minutes || '')}" data-base-rest="${esc(item.rest_seconds || '')}"><span class="sf-number">${index + 1}</span><div class="sf-exercise-art">${art(item)}</div><div class="sf-exercise-main"><h4>${esc(item.name || 'Exercise')}</h4><div class="sf-metrics" data-sf-metrics>${metrics.map((metric) => `<span>${esc(metric)}</span>`).join('')}</div>${purpose(item)}${item.notes ? `<p>${esc(item.notes)}</p>` : ''}${(item.how || []).length ? `<details><summary>Show me how</summary><ol>${item.how.map((step) => `<li>${esc(step)}</li>`).join('')}</ol></details>` : ''}<div class="sf-completion"><button data-sf-complete="done" type="button">✓ Done</button><button data-sf-complete="skip" type="button">Skip today</button><select data-sf-skip-reason hidden aria-label="Why are you skipping this exercise?"><option value="">Choose a reason</option><option value="too_difficult">Too difficult</option><option value="pain_or_discomfort">Pain or discomfort</option><option value="no_equipment">No equipment</option><option value="ran_out_of_time">Ran out of time</option><option value="did_not_enjoy">Didn’t enjoy it</option></select></div></div><div class="sf-exercise-actions"><button data-fit-vote="nay" type="button">Swap</button></div></article>`;
}

function difficultyControl() {
  return '<div class="sf-difficulty"><strong>SESSION EFFORT</strong><div class="sf-difficulty-options" role="group" aria-label="Session effort"><button type="button" data-sf-difficulty="easier">Go easier</button><button type="button" data-sf-difficulty="planned" class="active" aria-pressed="true">As planned</button><button type="button" data-sf-difficulty="harder">Go harder</button></div><p data-sf-difficulty-note aria-live="polite">Adjusts the dose and rest for this session. It does not override your safety choices.</p></div>';
}

function adjustSession(control) {
  const session = control.closest('.sf-session');
  const level = control.dataset.sfDifficulty;
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
  session.querySelectorAll('[data-sf-difficulty]').forEach((button) => {
    const active = button.dataset.sfDifficulty === level;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
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
const exerciseSource = decodeInjectedSource('ICBmdW5jdGlvbiBwdXJwb3NlKGl0ZW0gPSB7fSkgewogIGNvbnN0IGRldGFpbCA9IGl0ZW0ucHVycG9zZSB8fCB7fTsKICBpZiAoIWl0ZW0uc2VsZWN0aW9uX3JlYXNvbiAmJiAhZGV0YWlsLmZvY3VzICYmICFkZXRhaWwuYmVuZWZpdCAmJiAhZGV0YWlsLndlaWdodExvc3MpIHJldHVybiAnJzsKICBjb25zdCBzb3VyY2VzID0gKGRldGFpbC5zb3VyY2VzIHx8IFtdKS5maWx0ZXIoQm9vbGVhbik7CiAgcmV0dXJuIGA8ZGl2IGNsYXNzPSJzZi1leGVyY2lzZS1wdXJwb3NlIj4ke2l0ZW0uc2VsZWN0aW9uX3JlYXNvbiA/IGA8ZGl2PjxzbWFsbD5XSFkgVEhJUyBJUyBIRVJFPC9zbWFsbD48cD4ke2VzYyhpdGVtLnNlbGVjdGlvbl9yZWFzb24pfTwvcD48L2Rpdj5gIDogJyd9JHtkZXRhaWwuZm9jdXMgfHwgZGV0YWlsLmJlbmVmaXQgPyBgPGRpdj48c21hbGw+V0hBVCBJVCBXT1JLUzwvc21hbGw+JHtkZXRhaWwuZm9jdXMgPyBgPHN0cm9uZz4ke2VzYyhkZXRhaWwuZm9jdXMpfTwvc3Ryb25nPmAgOiAnJ30ke2RldGFpbC5iZW5lZml0ID8gYDxwPiR7ZXNjKGRldGFpbC5iZW5lZml0KX08L3A+YCA6ICcnfTwvZGl2PmAgOiAnJ30ke2RldGFpbC53ZWlnaHRMb3NzID8gYDxkaXY+PHNtYWxsPkhPVyBJVCBTVVBQT1JUUyBZT1VSIEdPQUxTPC9zbWFsbD48cD4ke2VzYyhkZXRhaWwud2VpZ2h0TG9zcyl9PC9wPjxwPlJlZ3VsYXIgYWN0aXZpdHkgY2FuIHN1cHBvcnQgbW9vZCwgc2xlZXAgYW5kIG1lbnRhbCB3ZWxsYmVpbmc7IG9uZSBtb3ZlbWVudCBjYW5ub3QgcHJvbWlzZSBhbiBpbW1lZGlhdGUgbWVudGFsLWNsYXJpdHkgZWZmZWN0LjwvcD48L2Rpdj5gIDogJyd9JHtzb3VyY2VzLmxlbmd0aCA/IGA8ZGV0YWlscz48c3VtbWFyeT5FdmlkZW5jZSBiZWhpbmQgdGhpcyBndWlkYW5jZTwvc3VtbWFyeT48dWw+JHtzb3VyY2VzLm1hcCgodXJsLCBpbmRleCkgPT4gYDxsaT48YSBocmVmPSIke2VzYyh1cmwpfSIgdGFyZ2V0PSJfYmxhbmsiIHJlbD0ibm9vcGVuZXIiPiR7aW5kZXggPyAnV2VpZ2h0LW1hbmFnZW1lbnQgZ3VpZGFuY2UnIDogJ0FjdGl2aXR5IGd1aWRhbmNlJ308L2E+PC9saT5gKS5qb2luKCcnKX08L3VsPjwvZGV0YWlscz5gIDogJyd9PC9kaXY+YDsKfQoKICBmdW5jdGlvbiBleGVyY2lzZShpdGVtLCBpbmRleCwgZGF5KSB7CiAgY29uc3QgbWV0cmljcyA9IFtdOwogIGlmIChpdGVtLnNldHMpIG1ldHJpY3MucHVzaChgJHtpdGVtLnNldHN9IFNFVFNgKTsKICBpZiAoaXRlbS5yZXBzKSBtZXRyaWNzLnB1c2goYCR7aXRlbS5yZXBzfSBSRVBTYCk7CiAgaWYgKGl0ZW0ubWludXRlcykgbWV0cmljcy5wdXNoKGAke2l0ZW0ubWludXRlc30gTUlOYCk7CiAgaWYgKGl0ZW0ucmVzdF9zZWNvbmRzKSBtZXRyaWNzLnB1c2goYCR7aXRlbS5yZXN0X3NlY29uZHN9IFNFQyBSRVNUYCk7CiAgcmV0dXJuIGA8YXJ0aWNsZSBjbGFzcz0ic2YtZXhlcmNpc2UgbXAtZXhlcmNpc2UiIGRhdGEtZXhlcmNpc2UtaWQ9IiR7ZXNjKGl0ZW0uaWQgfHwgJycpfSIgZGF0YS1leGVyY2lzZS1ncm91cD0iJHtlc2MoaXRlbS5ncm91cCB8fCAnJyl9IiBkYXRhLWRheT0iJHtkYXl9IiBkYXRhLWJhc2Utc2V0cz0iJHtlc2MoaXRlbS5zZXRzIHx8ICcnKX0iIGRhdGEtYmFzZS1yZXBzPSIke2VzYyhpdGVtLnJlcHMgfHwgJycpfSIgZGF0YS1iYXNlLW1pbnV0ZXM9IiR7ZXNjKGl0ZW0ubWludXRlcyB8fCAnJyl9IiBkYXRhLWJhc2UtcmVzdD0iJHtlc2MoaXRlbS5yZXN0X3NlY29uZHMgfHwgJycpfSI+PHNwYW4gY2xhc3M9InNmLW51bWJlciI+JHtpbmRleCArIDF9PC9zcGFuPjxkaXYgY2xhc3M9InNmLWV4ZXJjaXNlLWFydCI+JHthcnQoaXRlbSl9PC9kaXY+PGRpdiBjbGFzcz0ic2YtZXhlcmNpc2UtbWFpbiI+PGg0PiR7ZXNjKGl0ZW0ubmFtZSB8fCAnRXhlcmNpc2UnKX08L2g0PjxkaXYgY2xhc3M9InNmLW1ldHJpY3MiIGRhdGEtc2YtbWV0cmljcz4ke21ldHJpY3MubWFwKChtZXRyaWMpID0+IGA8c3Bhbj4ke2VzYyhtZXRyaWMpfTwvc3Bhbj5gKS5qb2luKCcnKX08L2Rpdj4ke3B1cnBvc2UoaXRlbSl9JHtpdGVtLm5vdGVzID8gYDxwPiR7ZXNjKGl0ZW0ubm90ZXMpfTwvcD5gIDogJyd9JHsoaXRlbS5ob3cgfHwgW10pLmxlbmd0aCA/IGA8ZGV0YWlscz48c3VtbWFyeT5TaG93IG1lIGhvdzwvc3VtbWFyeT48b2w+JHtpdGVtLmhvdy5tYXAoKHN0ZXApID0+IGA8bGk+JHtlc2Moc3RlcCl9PC9saT5gKS5qb2luKCcnKX08L29sPjwvZGV0YWlscz5gIDogJyd9PGRpdiBjbGFzcz0ic2YtY29tcGxldGlvbiI+PGJ1dHRvbiBkYXRhLXNmLWNvbXBsZXRlPSJkb25lIiB0eXBlPSJidXR0b24iPuKckyBEb25lPC9idXR0b24+PGJ1dHRvbiBkYXRhLXNmLWNvbXBsZXRlPSJza2lwIiB0eXBlPSJidXR0b24iPlNraXAgdG9kYXk8L2J1dHRvbj48c2VsZWN0IGRhdGEtc2Ytc2tpcC1yZWFzb24gaGlkZGVuIGFyaWEtbGFiZWw9IldoeSBhcmUgeW91IHNraXBwaW5nIHRoaXMgZXhlcmNpc2U/Ij48b3B0aW9uIHZhbHVlPSIiPkNob29zZSBhIHJlYXNvbjwvb3B0aW9uPjxvcHRpb24gdmFsdWU9InRvb19kaWZmaWN1bHQiPlRvbyBkaWZmaWN1bHQ8L29wdGlvbj48b3B0aW9uIHZhbHVlPSJwYWluX29yX2Rpc2NvbWZvcnQiPlBhaW4gb3IgZGlzY29tZm9ydDwvb3B0aW9uPjxvcHRpb24gdmFsdWU9Im5vX2VxdWlwbWVudCI+Tm8gZXF1aXBtZW50PC9vcHRpb24+PG9wdGlvbiB2YWx1ZT0icmFuX291dF9vZl90aW1lIj5SYW4gb3V0IG9mIHRpbWU8L29wdGlvbj48b3B0aW9uIHZhbHVlPSJkaWRfbm90X2Vuam95Ij5EaWRu4oCZdCBlbmpveSBpdDwvb3B0aW9uPjwvc2VsZWN0PjwvZGl2PjwvZGl2PjxkaXYgY2xhc3M9InNmLWV4ZXJjaXNlLWFjdGlvbnMiPjxidXR0b24gZGF0YS1maXQtdm90ZT0ibmF5IiB0eXBlPSJidXR0b24iPlN3YXA8L2J1dHRvbj48L2Rpdj48L2FydGljbGU+YDsKfQ==');
const difficultySource = decodeInjectedSource('ICBmdW5jdGlvbiBkaWZmaWN1bHR5Q29udHJvbCgpIHsKICByZXR1cm4gJzxkaXYgY2xhc3M9InNmLWRpZmZpY3VsdHkiPjxzdHJvbmc+U0VTU0lPTiBFRkZPUlQ8L3N0cm9uZz48ZGl2IGNsYXNzPSJzZi1kaWZmaWN1bHR5LW9wdGlvbnMiIHJvbGU9Imdyb3VwIiBhcmlhLWxhYmVsPSJTZXNzaW9uIGVmZm9ydCI+PGJ1dHRvbiB0eXBlPSJidXR0b24iIGRhdGEtc2YtZGlmZmljdWx0eT0iZWFzaWVyIj5HbyBlYXNpZXI8L2J1dHRvbj48YnV0dG9uIHR5cGU9ImJ1dHRvbiIgZGF0YS1zZi1kaWZmaWN1bHR5PSJwbGFubmVkIiBjbGFzcz0iYWN0aXZlIiBhcmlhLXByZXNzZWQ9InRydWUiPkFzIHBsYW5uZWQ8L2J1dHRvbj48YnV0dG9uIHR5cGU9ImJ1dHRvbiIgZGF0YS1zZi1kaWZmaWN1bHR5PSJoYXJkZXIiPkdvIGhhcmRlcjwvYnV0dG9uPjwvZGl2PjxwIGRhdGEtc2YtZGlmZmljdWx0eS1ub3RlIGFyaWEtbGl2ZT0icG9saXRlIj5BZGp1c3RzIHRoZSBkb3NlIGFuZCByZXN0IGZvciB0aGlzIHNlc3Npb24uIEl0IGRvZXMgbm90IG92ZXJyaWRlIHlvdXIgc2FmZXR5IGNob2ljZXMuPC9wPjwvZGl2Pic7Cn0KCiAgZnVuY3Rpb24gYWRqdXN0U2Vzc2lvbihjb250cm9sKSB7CiAgY29uc3Qgc2Vzc2lvbiA9IGNvbnRyb2wuY2xvc2VzdCgnLnNmLXNlc3Npb24nKTsKICBjb25zdCBsZXZlbCA9IGNvbnRyb2wuZGF0YXNldC5zZkRpZmZpY3VsdHk7CiAgY29uc3Qgc2NhbGUgPSBsZXZlbCA9PT0gJ2Vhc2llcicgPyAwLjggOiBsZXZlbCA9PT0gJ2hhcmRlcicgPyAxLjIgOiAxOwogIHNlc3Npb24ucXVlcnlTZWxlY3RvckFsbCgnLnNmLWV4ZXJjaXNlJykuZm9yRWFjaCgoY2FyZCkgPT4gewogICAgY29uc3QgYmFzZSA9IHsKICAgICAgc2V0czogTnVtYmVyKGNhcmQuZGF0YXNldC5iYXNlU2V0cyB8fCAwKSwKICAgICAgcmVwczogTnVtYmVyKGNhcmQuZGF0YXNldC5iYXNlUmVwcyB8fCAwKSwKICAgICAgbWludXRlczogTnVtYmVyKGNhcmQuZGF0YXNldC5iYXNlTWludXRlcyB8fCAwKSwKICAgICAgcmVzdDogTnVtYmVyKGNhcmQuZGF0YXNldC5iYXNlUmVzdCB8fCAwKSwKICAgIH07CiAgICBjb25zdCBtZXRyaWNzID0gW107CiAgICBpZiAoYmFzZS5zZXRzKSBtZXRyaWNzLnB1c2goYCR7YmFzZS5zZXRzfSBTRVRTYCk7CiAgICBpZiAoYmFzZS5yZXBzKSBtZXRyaWNzLnB1c2goYCR7TWF0aC5tYXgoMSwgTWF0aC5yb3VuZChiYXNlLnJlcHMgKiBzY2FsZSkpfSBSRVBTYCk7CiAgICBpZiAoYmFzZS5taW51dGVzKSBtZXRyaWNzLnB1c2goYCR7TWF0aC5tYXgoMSwgTWF0aC5yb3VuZChiYXNlLm1pbnV0ZXMgKiBzY2FsZSkpfSBNSU5gKTsKICAgIGlmIChiYXNlLnJlc3QpIHsKICAgICAgY29uc3QgcmVzdCA9IGxldmVsID09PSAnZWFzaWVyJyA/IGJhc2UucmVzdCArIDE1IDogbGV2ZWwgPT09ICdoYXJkZXInID8gTWF0aC5tYXgoMTUsIGJhc2UucmVzdCAtIDE1KSA6IGJhc2UucmVzdDsKICAgICAgbWV0cmljcy5wdXNoKGAke3Jlc3R9IFNFQyBSRVNUYCk7CiAgICB9CiAgICBjYXJkLnF1ZXJ5U2VsZWN0b3IoJ1tkYXRhLXNmLW1ldHJpY3NdJykuaW5uZXJIVE1MID0gbWV0cmljcy5tYXAoKG1ldHJpYykgPT4gYDxzcGFuPiR7ZXNjKG1ldHJpYyl9PC9zcGFuPmApLmpvaW4oJycpOwogIH0pOwogIGNvbnN0IG5vdGUgPSBzZXNzaW9uLnF1ZXJ5U2VsZWN0b3IoJ1tkYXRhLXNmLWRpZmZpY3VsdHktbm90ZV0nKTsKICBzZXNzaW9uLnF1ZXJ5U2VsZWN0b3JBbGwoJ1tkYXRhLXNmLWRpZmZpY3VsdHldJykuZm9yRWFjaCgoYnV0dG9uKSA9PiB7CiAgICBjb25zdCBhY3RpdmUgPSBidXR0b24uZGF0YXNldC5zZkRpZmZpY3VsdHkgPT09IGxldmVsOwogICAgYnV0dG9uLmNsYXNzTGlzdC50b2dnbGUoJ2FjdGl2ZScsIGFjdGl2ZSk7CiAgICBidXR0b24uc2V0QXR0cmlidXRlKCdhcmlhLXByZXNzZWQnLCBTdHJpbmcoYWN0aXZlKSk7CiAgfSk7CiAgbm90ZS50ZXh0Q29udGVudCA9IGxldmVsID09PSAnZWFzaWVyJwogICAgPyAnRWFzaWVyOiBhYm91dCAyMCUgZmV3ZXIgcmVwcyBvciBtaW51dGVzLCB3aXRoIDE1IHNlY29uZHMgbW9yZSByZXN0IHdoZXJlIHJlc3QgaXMgcHJlc2NyaWJlZC4nCiAgICA6IGxldmVsID09PSAnaGFyZGVyJwogICAgICA/ICdIYXJkZXI6IGFib3V0IDIwJSBtb3JlIHJlcHMgb3IgbWludXRlcywgd2l0aCAxNSBzZWNvbmRzIGxlc3MgcmVzdOKAlHN0b3AgaWYgZm9ybSBicmVha3MgZG93biBvciBhbnl0aGluZyBodXJ0cy4nCiAgICAgIDogJ0JhY2sgdG8gdGhlIGFwcHJvdmVkIGRvc2UgYW5kIHJlc3QgZm9yIHRoaXMgc2Vzc2lvbi4nOwp9');

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

const clickHook = 'const reviewButton = event.target.closest("[data-sf-save-review]");';
if (!fitRuntime.includes(clickHook)) {
  throw new Error('Fit difficulty integration could not find the click handler.');
}
fitRuntime = fitRuntime.replace(
  clickHook,
  'const difficulty = event.target.closest("[data-sf-difficulty]");\n        if (difficulty) { event.preventDefault(); adjustSession(difficulty); return; }\n        const reviewButton = event.target.closest("[data-sf-save-review]");',
);

const initHook = '  function init() {';
fitRuntime = fitRuntime.replace(
  initHook,
  `${difficultySource}\n${initHook}`,
);

export {fitRuntime};
