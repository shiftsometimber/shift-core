import {fitSessionCues} from './fit-session-cues.mjs';
import {fitRuntime as baseFitRuntime} from './fit-runtime.mjs';
import {fitTodayHandoffSource} from './fit-today-handoff.mjs';

function purpose(item = {}) {
  const detail = item.purpose || {};
  if (!item.selection_reason && !detail.focus && !detail.benefit && !detail.weightLoss) return '';
  const sources = (detail.sources || []).filter(Boolean);
  return `<div class="sf-exercise-purpose">${item.selection_reason ? `<div><small>WHY THIS IS HERE</small><p>${esc(item.selection_reason)}</p></div>` : ''}${detail.focus || detail.benefit ? `<div><small>WHAT IT WORKS</small>${detail.focus ? `<strong>${esc(detail.focus)}</strong>` : ''}${detail.benefit ? `<p>${esc(detail.benefit)}</p>` : ''}</div>` : ''}${detail.weightLoss ? `<div><small>HOW IT SUPPORTS YOUR GOALS</small><p>${esc(detail.weightLoss)}</p><p>Regular activity can support mood, sleep and mental wellbeing; one movement cannot promise an immediate mental-clarity effect.</p></div>` : ''}${sources.length ? `<details><summary>Evidence behind this guidance</summary><ul>${sources.map((url, index) => `<li><a href="${esc(url)}" target="_blank" rel="noopener">${index ? 'Weight-management guidance' : 'Activity guidance'}</a></li>`).join('')}</ul></details>` : ''}</div>`;
}

function exercise(item, index, day) {
  const doseLocked = item.dose_locked === true;
  const metrics = [];
  if (doseLocked) metrics.push(item.dose_text || '');
  else {
    if (item.sets) metrics.push(`${item.sets} SETS`);
    if (item.reps) metrics.push(`${item.reps} REPS`);
    if (item.minutes) metrics.push(`${item.minutes} MIN`);
    if (item.rest_seconds) metrics.push(`${item.rest_seconds} SEC REST`);
  }
  return `<article class="sf-exercise mp-exercise" data-exercise-id="${esc(item.id || '')}" data-exercise-group="${esc(item.group || '')}" data-day="${day}" data-dose-locked="${doseLocked}" data-dose-text="${esc(doseLocked ? item.dose_text || '' : '')}" data-base-sets="${esc(item.sets || '')}" data-base-reps="${esc(item.reps || '')}" data-base-minutes="${esc(item.minutes || '')}" data-base-rest="${esc(item.rest_seconds || '')}"><span class="sf-number">${index + 1}</span><div class="sf-exercise-art">${art(item)}</div><div class="sf-exercise-main"><h4>${esc(item.name || 'Exercise')}</h4><div class="sf-metrics" data-sf-metrics>${metrics.map((metric) => `<span>${esc(metric)}</span>`).join('')}</div>${purpose(item)}${item.notes ? `<p>${esc(item.notes)}</p>` : ''}${(item.how || []).length ? `<details><summary>Show me how</summary><ol>${item.how.map((step) => `<li>${esc(step)}</li>`).join('')}</ol></details>` : ''}<div class="sf-completion"><button data-sf-complete="done" type="button">✓ Done</button><button data-sf-complete="skip" type="button">Skip today</button><select data-sf-skip-reason hidden aria-label="Why are you skipping this exercise?"><option value="">Choose a reason</option><option value="too_difficult">Too difficult</option><option value="pain_or_discomfort">Pain or discomfort</option><option value="no_equipment">No equipment</option><option value="ran_out_of_time">Ran out of time</option><option value="did_not_enjoy">Didn’t enjoy it</option></select></div></div><div class="sf-exercise-actions"><button data-fit-vote="nay" type="button">Swap</button></div></article>`;
}

function difficultyControl() {
  return '<div class="sf-difficulty"><strong>SESSION EFFORT</strong><div class="sf-difficulty-options" role="group" aria-label="Session effort"><button type="button" data-sf-difficulty="easier">Go easier</button><button type="button" data-sf-difficulty="planned" class="active" aria-pressed="true">As planned</button><button type="button" data-sf-difficulty="harder">Go harder</button></div><p data-sf-difficulty-note aria-live="polite">Adjusts eligible exercises for this session. Fixed prescriptions stay as written, and your safety choices still apply.</p></div>';
}

function adjustSession(control) {
  const session = control.closest('.sf-session');
  const level = control.dataset.sfDifficulty;
  const scale = level === 'easier' ? 0.8 : level === 'harder' ? 1.2 : 1;
  let lockedCount = 0;
  let adjustableCount = 0;
  session.querySelectorAll('.sf-exercise').forEach((card) => {
    if (card.dataset.doseLocked === 'true') {
      lockedCount += 1;
      card.querySelector('[data-sf-metrics]').innerHTML = `<span>${esc(card.dataset.doseText || '')}</span>`;
      return;
    }
    adjustableCount += 1;
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
  note.textContent = lockedCount && !adjustableCount
    ? 'This session uses fixed prescriptions. Repetitions, timings and rest stay as written. Swap an exercise if needed.'
    : level === 'easier'
    ? 'Easier: about 20% fewer reps or minutes, with 15 seconds more rest where rest is prescribed.'
    : level === 'harder'
      ? 'Harder: about 20% more reps or minutes, with 15 seconds less rest—stop if form breaks down or anything hurts.'
      : 'Back to the approved dose and rest for this session.';
  if (lockedCount && adjustableCount) note.textContent += ' Fixed prescriptions stay as written.';
}

// Function#toString changes when Wrangler bundles this module. Decode the reviewed
// browser source from stable UTF-8 constants so local and deployed assets stay exact.
const decodeInjectedSource = (value) =>
  new TextDecoder().decode(Uint8Array.from(atob(value), (char) => char.charCodeAt(0)));
const exerciseSource = decodeInjectedSource('ICBmdW5jdGlvbiBwdXJwb3NlKGl0ZW0gPSB7fSkgewogIGNvbnN0IGRldGFpbCA9IGl0ZW0ucHVycG9zZSB8fCB7fTsKICBpZiAoIWl0ZW0uc2VsZWN0aW9uX3JlYXNvbiAmJiAhZGV0YWlsLmZvY3VzICYmICFkZXRhaWwuYmVuZWZpdCAmJiAhZGV0YWlsLndlaWdodExvc3MpIHJldHVybiAnJzsKICBjb25zdCBzb3VyY2VzID0gKGRldGFpbC5zb3VyY2VzIHx8IFtdKS5maWx0ZXIoQm9vbGVhbik7CiAgcmV0dXJuIGA8ZGl2IGNsYXNzPSJzZi1leGVyY2lzZS1wdXJwb3NlIj4ke2l0ZW0uc2VsZWN0aW9uX3JlYXNvbiA/IGA8ZGl2PjxzbWFsbD5XSFkgVEhJUyBJUyBIRVJFPC9zbWFsbD48cD4ke2VzYyhpdGVtLnNlbGVjdGlvbl9yZWFzb24pfTwvcD48L2Rpdj5gIDogJyd9JHtkZXRhaWwuZm9jdXMgfHwgZGV0YWlsLmJlbmVmaXQgPyBgPGRpdj48c21hbGw+V0hBVCBJVCBXT1JLUzwvc21hbGw+JHtkZXRhaWwuZm9jdXMgPyBgPHN0cm9uZz4ke2VzYyhkZXRhaWwuZm9jdXMpfTwvc3Ryb25nPmAgOiAnJ30ke2RldGFpbC5iZW5lZml0ID8gYDxwPiR7ZXNjKGRldGFpbC5iZW5lZml0KX08L3A+YCA6ICcnfTwvZGl2PmAgOiAnJ30ke2RldGFpbC53ZWlnaHRMb3NzID8gYDxkaXY+PHNtYWxsPkhPVyBJVCBTVVBQT1JUUyBZT1VSIEdPQUxTPC9zbWFsbD48cD4ke2VzYyhkZXRhaWwud2VpZ2h0TG9zcyl9PC9wPjxwPlJlZ3VsYXIgYWN0aXZpdHkgY2FuIHN1cHBvcnQgbW9vZCwgc2xlZXAgYW5kIG1lbnRhbCB3ZWxsYmVpbmc7IG9uZSBtb3ZlbWVudCBjYW5ub3QgcHJvbWlzZSBhbiBpbW1lZGlhdGUgbWVudGFsLWNsYXJpdHkgZWZmZWN0LjwvcD48L2Rpdj5gIDogJyd9JHtzb3VyY2VzLmxlbmd0aCA/IGA8ZGV0YWlscz48c3VtbWFyeT5FdmlkZW5jZSBiZWhpbmQgdGhpcyBndWlkYW5jZTwvc3VtbWFyeT48dWw+JHtzb3VyY2VzLm1hcCgodXJsLCBpbmRleCkgPT4gYDxsaT48YSBocmVmPSIke2VzYyh1cmwpfSIgdGFyZ2V0PSJfYmxhbmsiIHJlbD0ibm9vcGVuZXIiPiR7aW5kZXggPyAnV2VpZ2h0LW1hbmFnZW1lbnQgZ3VpZGFuY2UnIDogJ0FjdGl2aXR5IGd1aWRhbmNlJ308L2E+PC9saT5gKS5qb2luKCcnKX08L3VsPjwvZGV0YWlscz5gIDogJyd9PC9kaXY+YDsKfQoKICBmdW5jdGlvbiBleGVyY2lzZShpdGVtLCBpbmRleCwgZGF5KSB7CiAgY29uc3QgZG9zZUxvY2tlZCA9IGl0ZW0uZG9zZV9sb2NrZWQgPT09IHRydWU7CiAgY29uc3QgbWV0cmljcyA9IFtdOwogIGlmIChkb3NlTG9ja2VkKSBtZXRyaWNzLnB1c2goaXRlbS5kb3NlX3RleHQgfHwgJycpOwogIGVsc2UgewogICAgaWYgKGl0ZW0uc2V0cykgbWV0cmljcy5wdXNoKGAke2l0ZW0uc2V0c30gU0VUU2ApOwogICAgaWYgKGl0ZW0ucmVwcykgbWV0cmljcy5wdXNoKGAke2l0ZW0ucmVwc30gUkVQU2ApOwogICAgaWYgKGl0ZW0ubWludXRlcykgbWV0cmljcy5wdXNoKGAke2l0ZW0ubWludXRlc30gTUlOYCk7CiAgICBpZiAoaXRlbS5yZXN0X3NlY29uZHMpIG1ldHJpY3MucHVzaChgJHtpdGVtLnJlc3Rfc2Vjb25kc30gU0VDIFJFU1RgKTsKICB9CiAgcmV0dXJuIGA8YXJ0aWNsZSBjbGFzcz0ic2YtZXhlcmNpc2UgbXAtZXhlcmNpc2UiIGRhdGEtZXhlcmNpc2UtaWQ9IiR7ZXNjKGl0ZW0uaWQgfHwgJycpfSIgZGF0YS1leGVyY2lzZS1ncm91cD0iJHtlc2MoaXRlbS5ncm91cCB8fCAnJyl9IiBkYXRhLWRheT0iJHtkYXl9IiBkYXRhLWRvc2UtbG9ja2VkPSIke2Rvc2VMb2NrZWR9IiBkYXRhLWRvc2UtdGV4dD0iJHtlc2MoZG9zZUxvY2tlZCA/IGl0ZW0uZG9zZV90ZXh0IHx8ICcnIDogJycpfSIgZGF0YS1iYXNlLXNldHM9IiR7ZXNjKGl0ZW0uc2V0cyB8fCAnJyl9IiBkYXRhLWJhc2UtcmVwcz0iJHtlc2MoaXRlbS5yZXBzIHx8ICcnKX0iIGRhdGEtYmFzZS1taW51dGVzPSIke2VzYyhpdGVtLm1pbnV0ZXMgfHwgJycpfSIgZGF0YS1iYXNlLXJlc3Q9IiR7ZXNjKGl0ZW0ucmVzdF9zZWNvbmRzIHx8ICcnKX0iPjxzcGFuIGNsYXNzPSJzZi1udW1iZXIiPiR7aW5kZXggKyAxfTwvc3Bhbj48ZGl2IGNsYXNzPSJzZi1leGVyY2lzZS1hcnQiPiR7YXJ0KGl0ZW0pfTwvZGl2PjxkaXYgY2xhc3M9InNmLWV4ZXJjaXNlLW1haW4iPjxoND4ke2VzYyhpdGVtLm5hbWUgfHwgJ0V4ZXJjaXNlJyl9PC9oND48ZGl2IGNsYXNzPSJzZi1tZXRyaWNzIiBkYXRhLXNmLW1ldHJpY3M+JHttZXRyaWNzLm1hcCgobWV0cmljKSA9PiBgPHNwYW4+JHtlc2MobWV0cmljKX08L3NwYW4+YCkuam9pbignJyl9PC9kaXY+JHtwdXJwb3NlKGl0ZW0pfSR7aXRlbS5ub3RlcyA/IGA8cD4ke2VzYyhpdGVtLm5vdGVzKX08L3A+YCA6ICcnfSR7KGl0ZW0uaG93IHx8IFtdKS5sZW5ndGggPyBgPGRldGFpbHM+PHN1bW1hcnk+U2hvdyBtZSBob3c8L3N1bW1hcnk+PG9sPiR7aXRlbS5ob3cubWFwKChzdGVwKSA9PiBgPGxpPiR7ZXNjKHN0ZXApfTwvbGk+YCkuam9pbignJyl9PC9vbD48L2RldGFpbHM+YCA6ICcnfTxkaXYgY2xhc3M9InNmLWNvbXBsZXRpb24iPjxidXR0b24gZGF0YS1zZi1jb21wbGV0ZT0iZG9uZSIgdHlwZT0iYnV0dG9uIj7inJMgRG9uZTwvYnV0dG9uPjxidXR0b24gZGF0YS1zZi1jb21wbGV0ZT0ic2tpcCIgdHlwZT0iYnV0dG9uIj5Ta2lwIHRvZGF5PC9idXR0b24+PHNlbGVjdCBkYXRhLXNmLXNraXAtcmVhc29uIGhpZGRlbiBhcmlhLWxhYmVsPSJXaHkgYXJlIHlvdSBza2lwcGluZyB0aGlzIGV4ZXJjaXNlPyI+PG9wdGlvbiB2YWx1ZT0iIj5DaG9vc2UgYSByZWFzb248L29wdGlvbj48b3B0aW9uIHZhbHVlPSJ0b29fZGlmZmljdWx0Ij5Ub28gZGlmZmljdWx0PC9vcHRpb24+PG9wdGlvbiB2YWx1ZT0icGFpbl9vcl9kaXNjb21mb3J0Ij5QYWluIG9yIGRpc2NvbWZvcnQ8L29wdGlvbj48b3B0aW9uIHZhbHVlPSJub19lcXVpcG1lbnQiPk5vIGVxdWlwbWVudDwvb3B0aW9uPjxvcHRpb24gdmFsdWU9InJhbl9vdXRfb2ZfdGltZSI+UmFuIG91dCBvZiB0aW1lPC9vcHRpb24+PG9wdGlvbiB2YWx1ZT0iZGlkX25vdF9lbmpveSI+RGlkbuKAmXQgZW5qb3kgaXQ8L29wdGlvbj48L3NlbGVjdD48L2Rpdj48L2Rpdj48ZGl2IGNsYXNzPSJzZi1leGVyY2lzZS1hY3Rpb25zIj48YnV0dG9uIGRhdGEtZml0LXZvdGU9Im5heSIgdHlwZT0iYnV0dG9uIj5Td2FwPC9idXR0b24+PC9kaXY+PC9hcnRpY2xlPmA7Cn0=');
const difficultySource = decodeInjectedSource('ICBmdW5jdGlvbiBkaWZmaWN1bHR5Q29udHJvbCgpIHsKICByZXR1cm4gJzxkaXYgY2xhc3M9InNmLWRpZmZpY3VsdHkiPjxzdHJvbmc+U0VTU0lPTiBFRkZPUlQ8L3N0cm9uZz48ZGl2IGNsYXNzPSJzZi1kaWZmaWN1bHR5LW9wdGlvbnMiIHJvbGU9Imdyb3VwIiBhcmlhLWxhYmVsPSJTZXNzaW9uIGVmZm9ydCI+PGJ1dHRvbiB0eXBlPSJidXR0b24iIGRhdGEtc2YtZGlmZmljdWx0eT0iZWFzaWVyIj5HbyBlYXNpZXI8L2J1dHRvbj48YnV0dG9uIHR5cGU9ImJ1dHRvbiIgZGF0YS1zZi1kaWZmaWN1bHR5PSJwbGFubmVkIiBjbGFzcz0iYWN0aXZlIiBhcmlhLXByZXNzZWQ9InRydWUiPkFzIHBsYW5uZWQ8L2J1dHRvbj48YnV0dG9uIHR5cGU9ImJ1dHRvbiIgZGF0YS1zZi1kaWZmaWN1bHR5PSJoYXJkZXIiPkdvIGhhcmRlcjwvYnV0dG9uPjwvZGl2PjxwIGRhdGEtc2YtZGlmZmljdWx0eS1ub3RlIGFyaWEtbGl2ZT0icG9saXRlIj5BZGp1c3RzIGVsaWdpYmxlIGV4ZXJjaXNlcyBmb3IgdGhpcyBzZXNzaW9uLiBGaXhlZCBwcmVzY3JpcHRpb25zIHN0YXkgYXMgd3JpdHRlbiwgYW5kIHlvdXIgc2FmZXR5IGNob2ljZXMgc3RpbGwgYXBwbHkuPC9wPjwvZGl2Pic7Cn0KCiAgZnVuY3Rpb24gYWRqdXN0U2Vzc2lvbihjb250cm9sKSB7CiAgY29uc3Qgc2Vzc2lvbiA9IGNvbnRyb2wuY2xvc2VzdCgnLnNmLXNlc3Npb24nKTsKICBjb25zdCBsZXZlbCA9IGNvbnRyb2wuZGF0YXNldC5zZkRpZmZpY3VsdHk7CiAgY29uc3Qgc2NhbGUgPSBsZXZlbCA9PT0gJ2Vhc2llcicgPyAwLjggOiBsZXZlbCA9PT0gJ2hhcmRlcicgPyAxLjIgOiAxOwogIGxldCBsb2NrZWRDb3VudCA9IDA7CiAgbGV0IGFkanVzdGFibGVDb3VudCA9IDA7CiAgc2Vzc2lvbi5xdWVyeVNlbGVjdG9yQWxsKCcuc2YtZXhlcmNpc2UnKS5mb3JFYWNoKChjYXJkKSA9PiB7CiAgICBpZiAoY2FyZC5kYXRhc2V0LmRvc2VMb2NrZWQgPT09ICd0cnVlJykgewogICAgICBsb2NrZWRDb3VudCArPSAxOwogICAgICBjYXJkLnF1ZXJ5U2VsZWN0b3IoJ1tkYXRhLXNmLW1ldHJpY3NdJykuaW5uZXJIVE1MID0gYDxzcGFuPiR7ZXNjKGNhcmQuZGF0YXNldC5kb3NlVGV4dCB8fCAnJyl9PC9zcGFuPmA7CiAgICAgIHJldHVybjsKICAgIH0KICAgIGFkanVzdGFibGVDb3VudCArPSAxOwogICAgY29uc3QgYmFzZSA9IHsKICAgICAgc2V0czogTnVtYmVyKGNhcmQuZGF0YXNldC5iYXNlU2V0cyB8fCAwKSwKICAgICAgcmVwczogTnVtYmVyKGNhcmQuZGF0YXNldC5iYXNlUmVwcyB8fCAwKSwKICAgICAgbWludXRlczogTnVtYmVyKGNhcmQuZGF0YXNldC5iYXNlTWludXRlcyB8fCAwKSwKICAgICAgcmVzdDogTnVtYmVyKGNhcmQuZGF0YXNldC5iYXNlUmVzdCB8fCAwKSwKICAgIH07CiAgICBjb25zdCBtZXRyaWNzID0gW107CiAgICBpZiAoYmFzZS5zZXRzKSBtZXRyaWNzLnB1c2goYCR7YmFzZS5zZXRzfSBTRVRTYCk7CiAgICBpZiAoYmFzZS5yZXBzKSBtZXRyaWNzLnB1c2goYCR7TWF0aC5tYXgoMSwgTWF0aC5yb3VuZChiYXNlLnJlcHMgKiBzY2FsZSkpfSBSRVBTYCk7CiAgICBpZiAoYmFzZS5taW51dGVzKSBtZXRyaWNzLnB1c2goYCR7TWF0aC5tYXgoMSwgTWF0aC5yb3VuZChiYXNlLm1pbnV0ZXMgKiBzY2FsZSkpfSBNSU5gKTsKICAgIGlmIChiYXNlLnJlc3QpIHsKICAgICAgY29uc3QgcmVzdCA9IGxldmVsID09PSAnZWFzaWVyJyA/IGJhc2UucmVzdCArIDE1IDogbGV2ZWwgPT09ICdoYXJkZXInID8gTWF0aC5tYXgoMTUsIGJhc2UucmVzdCAtIDE1KSA6IGJhc2UucmVzdDsKICAgICAgbWV0cmljcy5wdXNoKGAke3Jlc3R9IFNFQyBSRVNUYCk7CiAgICB9CiAgICBjYXJkLnF1ZXJ5U2VsZWN0b3IoJ1tkYXRhLXNmLW1ldHJpY3NdJykuaW5uZXJIVE1MID0gbWV0cmljcy5tYXAoKG1ldHJpYykgPT4gYDxzcGFuPiR7ZXNjKG1ldHJpYyl9PC9zcGFuPmApLmpvaW4oJycpOwogIH0pOwogIGNvbnN0IG5vdGUgPSBzZXNzaW9uLnF1ZXJ5U2VsZWN0b3IoJ1tkYXRhLXNmLWRpZmZpY3VsdHktbm90ZV0nKTsKICBzZXNzaW9uLnF1ZXJ5U2VsZWN0b3JBbGwoJ1tkYXRhLXNmLWRpZmZpY3VsdHldJykuZm9yRWFjaCgoYnV0dG9uKSA9PiB7CiAgICBjb25zdCBhY3RpdmUgPSBidXR0b24uZGF0YXNldC5zZkRpZmZpY3VsdHkgPT09IGxldmVsOwogICAgYnV0dG9uLmNsYXNzTGlzdC50b2dnbGUoJ2FjdGl2ZScsIGFjdGl2ZSk7CiAgICBidXR0b24uc2V0QXR0cmlidXRlKCdhcmlhLXByZXNzZWQnLCBTdHJpbmcoYWN0aXZlKSk7CiAgfSk7CiAgbm90ZS50ZXh0Q29udGVudCA9IGxvY2tlZENvdW50ICYmICFhZGp1c3RhYmxlQ291bnQKICAgID8gJ1RoaXMgc2Vzc2lvbiB1c2VzIGZpeGVkIHByZXNjcmlwdGlvbnMuIFJlcGV0aXRpb25zLCB0aW1pbmdzIGFuZCByZXN0IHN0YXkgYXMgd3JpdHRlbi4gU3dhcCBhbiBleGVyY2lzZSBpZiBuZWVkZWQuJwogICAgOiBsZXZlbCA9PT0gJ2Vhc2llcicKICAgID8gJ0Vhc2llcjogYWJvdXQgMjAlIGZld2VyIHJlcHMgb3IgbWludXRlcywgd2l0aCAxNSBzZWNvbmRzIG1vcmUgcmVzdCB3aGVyZSByZXN0IGlzIHByZXNjcmliZWQuJwogICAgOiBsZXZlbCA9PT0gJ2hhcmRlcicKICAgICAgPyAnSGFyZGVyOiBhYm91dCAyMCUgbW9yZSByZXBzIG9yIG1pbnV0ZXMsIHdpdGggMTUgc2Vjb25kcyBsZXNzIHJlc3TigJRzdG9wIGlmIGZvcm0gYnJlYWtzIGRvd24gb3IgYW55dGhpbmcgaHVydHMuJwogICAgICA6ICdCYWNrIHRvIHRoZSBhcHByb3ZlZCBkb3NlIGFuZCByZXN0IGZvciB0aGlzIHNlc3Npb24uJzsKICBpZiAobG9ja2VkQ291bnQgJiYgYWRqdXN0YWJsZUNvdW50KSBub3RlLnRleHRDb250ZW50ICs9ICcgRml4ZWQgcHJlc2NyaXB0aW9ucyBzdGF5IGFzIHdyaXR0ZW4uJzsKfQ==');

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

const renderScrollHook = '    applyJourney();\n  }\n  const allowedLimitations';
if (!fitRuntime.includes(renderScrollHook)) throw new Error('Fit could not locate the completed programme renderer.');
fitRuntime = fitRuntime.replace(renderScrollHook, '    applyJourney();\n    output.querySelector(".sf-difficulty")?.scrollIntoView({behavior:"auto",block:"start"});\n  }\n  const allowedLimitations');
const swapEffortHook = '      card.replaceWith(holder.firstElementChild);';
if (!fitRuntime.includes(swapEffortHook)) throw new Error('Fit could not locate the exercise swap.');
fitRuntime = fitRuntime.replace(swapEffortHook, '      const effort = card.closest(".sf-session")?.querySelector(\'[data-sf-difficulty][aria-pressed="true"]\');\n      card.replaceWith(holder.firstElementChild);\n      if (effort) adjustSession(effort);');

const handoffHooks = [
  ['  function init() {', fitTodayHandoffSource + '\n  function init() {'],
  ['    button.onclick = build;', '    button.onclick = build;\n    initFitTodayHandoff();'],
  ['      fitJourney = response.fitJourney;', '      fitJourney = response.fitJourney;\n      renderFitTodayHandoff(response.plan);'],
  ['      const result = await window.SST_API.generateFit(data);', '      const result = await window.SST_API.generateFit(data);\n      finishFitTodayHandoff(result);'],
  ['    output.querySelector(".sf-difficulty")?.scrollIntoView({behavior:"auto",block:"start"});', '    (document.getElementById("fitTodayHandoff") || output.querySelector(".sf-difficulty"))?.scrollIntoView({behavior:"auto",block:"start"});'],
];
for (const [hook, replacement] of handoffHooks) {
  if (!fitRuntime.includes(hook)) throw new Error('Fit Today handoff could not find its reviewed runtime hook.');
  fitRuntime = fitRuntime.replace(hook, replacement);
}

const cueHooks=[
 ['  function init() {',fitSessionCues+'\n  function init() {'],
 ['    const start = session.querySelector("[data-sf-start]"),','    refreshSessionCue(session);\n    const start = session.querySelector("[data-sf-start]"),'],
 ['    applyJourney();\n    (document.getElementById("fitTodayHandoff")', '    applyJourney();\n    output.querySelectorAll(".sf-session").forEach(refreshSessionCue);\n    (document.getElementById("fitTodayHandoff")'],
 ['      if (effort) adjustSession(effort);','      if (effort) {adjustSession(effort);refreshSessionCue(effort.closest(".sf-session"));}'],
 ];
 for(const [hook,replacement]of cueHooks){if(!fitRuntime.includes(hook))throw Error('Fit session cue integration hook missing');fitRuntime=fitRuntime.replace(hook,replacement)}
 export {fitRuntime};
