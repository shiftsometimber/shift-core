// My Timber quick log. Existing authenticated APIs, consent and saved records
// remain authoritative. No health data is written to browser storage.
export function quickLogPayload(values, today) {
  const fail = message => { throw new Error(message); };
  const date = String(values.recordedOn || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date + 'T12:00:00Z')) || new Date(date + 'T12:00:00Z').toISOString().slice(0, 10) !== date || date > today) fail('Choose today or a valid earlier date.');
  const body = { recordedOn: date, source: 'my_timber_quick_log' };
  const optional = (name, label, { integer = false, positive = false, max = Infinity } = {}) => {
    const raw = String(values[name] ?? '').trim();
    if (!raw) return undefined;
    if (!/^(?:\d+(?:\.\d+)?|\.\d+)$/.test(raw)) fail('Check ' + label + '. Use a number.');
    const value = Number(raw);
    if (!Number.isFinite(value) || value < 0 || positive && value === 0 || value > max || integer && !Number.isInteger(value)) fail('Check ' + label + (integer ? '. Use a whole number.' : '.'));
    return value;
  };
  let weight;
  if (values.weightUnit === 'stone_lb') {
    const stone = optional('weightStone', 'stone', { integer: true });
    const pounds = optional('weightPounds', 'pounds', { max: 13.999999 });
    if (stone !== undefined || pounds !== undefined) weight = ((stone ?? 0) * 14 + (pounds ?? 0)) * 0.45359237;
  } else {
    const value = optional('weight', 'weight', { positive: true });
    if (value !== undefined) {
      if (!['kg', 'lb'].includes(values.weightUnit)) fail('Choose the units for this weight.');
      weight = values.weightUnit === 'lb' ? value * 0.45359237 : value;
    }
  }
  if (weight !== undefined) {
    weight = Math.round(weight * 1000) / 1000;
    if (weight < 20 || weight > 400) fail('Check the weight and units. Supported weights are 20–400 kg or the equivalent.');
    body.weightKg = weight;
  }
  for (const [name, label, options] of [
    ['waistCm', 'waist measurement', { positive: true }],
    ['systolic', 'top blood-pressure number', { integer: true, positive: true }],
    ['diastolic', 'bottom blood-pressure number', { integer: true, positive: true }],
    ['restingHr', 'resting pulse', { integer: true, positive: true }],
    ['steps', 'steps', { integer: true }], ['proteinG', 'protein', {}],
    ['sleepHours', 'sleep hours', { max: 24 }]
  ]) {
    const value = optional(name, label, options);
    if (value !== undefined) body[name] = value;
  }
  const notes = String(values.notes ?? '').trim();
  if (notes.length > 4000) fail('Keep your note to 4,000 characters or fewer.');
  if (notes) body.notes = notes;
  if (Object.keys(body).length === 2) fail('Add one reading or a note. Everything else can stay blank.');
  return body;
}

// Separates an acknowledged POST from refreshing its summary. A failed refresh
// must never turn Retry into a duplicate insert. Unknown POST outcomes are held.
export function createQuickLogFlow(services) {
  let owner = null, generation = 0, busy = false, receipt = null, uncertain = false, opening = null;
  const error = (code, message) => Object.assign(new Error(message), { code });
  const currentContext = (expected, version) => owner === expected && generation === version;
  const staleOutcome = () => error('stale_operation', 'This save belongs to an earlier page or account. Its outcome cannot be confirmed here. Check the original account before retrying.');
  const requireContext = (expected, version) => { if (!currentContext(expected, version)) throw staleOutcome(); };
  const identity = async () => {
    const me = await services.getMe();
    const id = me?.user?.id ?? me?.id;
    if (id === undefined || id === null || String(id) === '') throw error('session_required', 'Sign in again before saving your private log.');
    return String(id);
  };
  const clear = () => { owner = null; ++generation; receipt = null; uncertain = false; services.onClear?.(); };
  const sameOwner = async (expected, version) => {
    if (version !== generation) throw error('stale_operation', 'Reopen Log your day to check your current account.');
    const current = await identity();
    if (version !== generation) throw error('stale_operation', 'Reopen Log your day to check your current account.');
    if (current !== expected || owner !== expected) {
      clear(); throw error('account_changed', 'Your account changed. Reopen Log your day before adding anything.');
    }
  };
  const checkTracking = async () => {
    const result = await services.getConsents();
    if (!Array.isArray(result?.consents)) throw error('health_consent_unavailable', 'Your tracking choice could not be checked. Nothing was saved.');
    const choices = result.consents.filter(row => row?.consent_type === 'my_shift_health_tracking');
    if (choices.some(row => !Number.isSafeInteger(Number(row.id)) || Number(row.id) < 1)) throw error('health_consent_unavailable', 'Your tracking choice could not be checked. Nothing was saved.');
    const latest = choices.sort((a, b) => Number(b.id) - Number(a.id))[0];
    if (Number(latest?.granted) !== 1) throw error('health_consent_required', 'Nothing saved. Review your current health-tracking choice in Settings.');
    const resultJourney = await services.getJourney();
    if (!resultJourney?.journey || typeof resultJourney.journey !== 'object') throw error('health_consent_unavailable', 'Your tracking settings could not be checked. Nothing was saved.');
    if (resultJourney.journey.setup?.paused === true) throw error('health_tracking_paused', 'Nothing saved. Health tracking is paused. You can review this in Settings.');
  };
  const requireTracking = async () => {
    if (typeof services.ensureConsent !== 'function' || !await services.ensureConsent()) throw error('health_consent_required', 'Nothing saved. Optional health tracking is your choice.');
    await checkTracking();
  };
  const refresh = async () => {
    if (!receipt) throw error('no_save_receipt', 'There is no confirmed save to refresh.');
    const expected = owner, version = generation, savedReceipt = receipt;
    try {
      if (services.canPresent?.() === false) throw error('summary_deferred', 'Your log is saved. Reopen My Timber to refresh it.');
      await sameOwner(expected, version);
      await checkTracking();
      requireContext(expected, version);
      const summary = await services.getSummary();
      requireContext(expected, version);
      if (services.canPresent?.() === false) throw error('summary_deferred', 'Your log is saved. Reopen My Timber to refresh it.');
      await checkTracking();
      await sameOwner(expected, version);
      const progress = summary?.progress ?? summary;
      if (!progress || !['empty', 'ready'].includes(progress.state) || !Array.isArray(progress.metrics)) throw error('summary_unavailable', 'The updated summary could not be checked.');
      return { saved: true, refreshed: true, owner: expected, recordedOn: savedReceipt.recordedOn, progress };
    } catch (cause) {
      if (!currentContext(expected, version)) { if (cause.code === 'account_changed') throw cause; throw staleOutcome(); }
      if (cause.code === 'stale_operation') throw cause;
      if (cause.code === 'account_changed' || cause.status === 401 || cause.code === 'session_required') { clear(); throw cause; }
      return { saved: true, refreshed: false, recordedOn: savedReceipt.recordedOn, message: 'Your log is saved. The updated summary could not load. Retry the summary or return to My Timber; this will not save the log again.' };
    }
  };
  return {
    get owner() { return owner; }, get busy() { return busy; },
    get saved() { return !!receipt; }, get unconfirmed() { return uncertain; },
    clear,
    open() {
      if (opening) return opening;
      const version = ++generation;
      const pending = (async () => {
        const id = await identity();
        if (version !== generation) throw error('stale_operation', 'Reopen Log your day to check your current account.');
        if (owner && owner !== id) { receipt = null; uncertain = false; services.onClear?.(); }
        owner = id;
        let units = null;
        try { const result = await services.getUnits(); if (['kg', 'stone_lb', 'lb'].includes(result?.units?.weight)) units = result.units.weight; } catch {}
        await sameOwner(id, version);
        return { owner: id, units };
      })();
      opening = pending;
      pending.finally(() => { if (opening === pending) opening = null; }).catch(() => {});
      return pending;
    },
    async save(payload) {
      if (busy) throw error('save_in_progress', 'Your save is already in progress.');
      if (!owner) throw error('session_required', 'Reopen Log your day to check your sign-in.');
      if (receipt) { busy = true; try { return await refresh(); } finally { busy = false; } }
      if (uncertain) throw error('save_unconfirmed', 'Check your saved records before trying the save again.');
      busy = true;
      const expected = owner, version = generation;
      let started = false;
      try {
        await sameOwner(expected, version);
        await requireTracking();
        await sameOwner(expected, version);
        started = true;
        const result = await services.saveProgress(payload);
        // A late response must not re-create cleared state or bind its receipt
        // to a subsequent account. The original POST may still have completed.
        requireContext(expected, version);
        if (result?.ok !== true) throw error('save_unconfirmed', 'The server did not confirm whether your log saved.');
        receipt = { recordedOn: payload.recordedOn };
        return await refresh();
      } catch (cause) {
        // Rejected old requests are just as stale as positive acknowledgements:
        // they cannot mark the new owner's draft uncertain or clear its session.
        if (!currentContext(expected, version)) { if (cause.code === 'account_changed') throw cause; throw staleOutcome(); }
        if (cause.code === 'account_changed' || cause.status === 401 || cause.code === 'session_required') { clear(); throw cause; }
        if (started && !receipt && ![400, 403, 409, 422, 429].includes(cause.status)) uncertain = true;
        throw cause;
      } finally { busy = false; }
    },
    allowCheckedRetry() { if (!busy && uncertain) uncertain = false; },
    startAnother() { if (!busy) { receipt = null; uncertain = false; } }
  };
}

export const quickLogStyles = String.raw`
html body[data-member-design="20261001"] #mtQuickLog{color:#E7E3DA;background:#050505;border:1px solid #707762;border-radius:18px;width:min(580px,calc(100% - 24px));max-height:calc(100dvh - 24px);padding:0;overflow:auto;box-sizing:border-box;font:16px/1.5 Arial,Helvetica,sans-serif}
#mtQuickLog::backdrop{background:#050505}
#mtQuickLog *{box-sizing:border-box}
#mtQuickLog [hidden]{display:none!important}
#mtQuickLog .mtql-top{display:flex;justify-content:space-between;gap:12px;padding:10px 18px;border-bottom:1px solid #707762;align-items:center}
#mtQuickLog .mtql-top strong{font-size:13px;letter-spacing:.12em}
#mtQuickLog .mtql-heading{padding:18px 18px 0;background:#707762;color:#050505}
#mtQuickLog h2{font:800 clamp(28px,6vw,36px)/1.08 Arial,sans-serif;margin:0 0 8px;letter-spacing:-.035em}
#mtQuickLog .mtql-heading p{margin:0 -18px;padding:14px 18px 0;background:#050505;color:#E7E3DA;font-size:15px}
#mtQuickLog form{padding:18px}
#mtQuickLog label{display:grid;gap:5px;font-weight:700;font-size:14px;min-width:0}
#mtQuickLog .mtql-optional{font-weight:400}
#mtQuickLog input,#mtQuickLog select,#mtQuickLog textarea{width:100%;min-height:44px;padding:9px 10px;font:16px/1.4 Arial,sans-serif;background:#050505;color:#E7E3DA;border:1px solid #707762;border-radius:9px;color-scheme:dark}
#mtQuickLog select{appearance:none;-webkit-appearance:none;padding-right:32px;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='%23E7E3DA' stroke-width='1.5'%3E%3Cpath d='m4 6 4 4 4-4'/%3E%3C/svg%3E");background-repeat:no-repeat;background-size:16px;background-position:right 10px center}
#mtQuickLog textarea{min-height:94px;resize:vertical}
#mtQuickLog .mtql-weight{padding:16px 0;margin:14px 0;border-top:1px solid #707762;border-bottom:1px solid #707762}
#mtQuickLog .mtql-weight-top{display:grid;grid-template-columns:1fr 148px;gap:12px;align-items:center;margin-bottom:12px}
#mtQuickLog .mtql-pair,#mtQuickLog .mtql-metrics{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
#mtQuickLog details{border-bottom:1px solid #707762;margin:0;padding:0 0 10px}
#mtQuickLog summary{cursor:pointer;min-height:48px;padding:12px 0;font-weight:700;font-size:15px}
#mtQuickLog .mtql-metrics{padding:4px 0 10px}
#mtQuickLog .mtql-actions{display:flex;flex-wrap:wrap;gap:8px;margin:18px 0 0}
#mtQuickLog button,#mtQuickLog .mtql-link{min-height:44px;padding:9px 12px;border:1px solid #707762;border-radius:9px;font:700 14px/1.4 Arial,sans-serif;color:#E7E3DA;background:#050505;display:inline-flex;align-items:center;justify-content:center;gap:8px;cursor:pointer;text-decoration:none}
#mtQuickLog .mtql-primary{background:#707762;color:#050505;flex:1 1 100%;font-size:19px;line-height:1.2}
#mtQuickLog .mtql-secondary{flex:1}
#mtQuickLog :is(a,button,input,select,textarea,summary):focus-visible{outline:3px solid #E7E3DA;outline-offset:3px}
#mtQuickLog :disabled{cursor:wait;opacity:.7}
#mtQuickLog .mtql-status{margin:12px 0 0;font-size:14px;line-height:1.5}
#mtQuickLog .mtql-privacy{font-size:12px;margin:12px 0 0}
html body[data-member-design="20261001"] #mtQuickLogRecovery{max-width:1040px;margin:12px auto;padding:14px 18px;background:#050505;color:#E7E3DA;border:1px solid #707762;border-radius:10px;font:15px/1.5 Arial,sans-serif}
#mtQuickLogRecovery :is(a,button){display:inline-flex;align-items:center;min-height:44px;padding:9px 12px;border:1px solid #707762;border-radius:8px;background:#050505;color:#E7E3DA;font:700 14px/1.4 Arial,sans-serif}
html body[data-member-design="20261001"] #mtQuickLogSavedStatus{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 14px;margin:0 0 16px;background:#050505;color:#E7E3DA;border:1px solid #707762;border-radius:10px;font:14px/1.5 Arial,sans-serif}
#mtQuickLogSavedStatus p{margin:0!important;color:#E7E3DA!important}
#mtQuickLogSavedStatus a{display:inline-flex;align-items:center;min-height:44px;color:#E7E3DA!important;text-underline-offset:3px;white-space:nowrap}
@media(max-width:380px){#mtQuickLog .mtql-weight-top{grid-template-columns:1fr}#mtQuickLog form{padding:16px}}
`;

function quickLogBrowser(makePayload, makeFlow) {
  'use strict';
  if (document.body.dataset.memberDesign !== '20261001' || window.SST_QUICK_LOG) return;
  const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  let dialog, form, message, save, retry, returnLink, trigger, draft = null, openVersion = 0, restoring = false, previousWeightUnit = '', opening = false;
  const api = name => {
    const fn = window.SST_API?.[name];
    if (typeof fn !== 'function') throw new Error('My Timber is still loading. Please try again shortly.');
    return fn.bind(window.SST_API);
  };
  const flow = makeFlow({
    getMe: () => api('getMe')(), getConsents: () => api('getConsents')(),
    getJourney: () => api('getMyJourney')(), saveProgress: payload => api('saveProgress')(payload),
    getSummary: () => api('getProgressSummary')(),
    canPresent: () => !document.hidden,
    ensureConsent: () => {
      if (typeof window.SST_HEALTH_CONSENT?.ensure !== 'function') throw new Error('Health-tracking choices are still loading. Please try again shortly.');
      return window.SST_HEALTH_CONSENT.ensure();
    },
    getUnits: async () => {
      const response = await fetch('/v1/settings/units', { credentials: 'same-origin', cache: 'no-store' });
      if (!response.ok) throw new Error('Saved units could not load.');
      return response.json();
    },
    onClear: () => { draft = null; document.getElementById('mtQuickLogSavedStatus')?.remove(); if (form) form.reset(); if (dialog?.open) dialog.close(); }
  });
  const values = () => Object.fromEntries(new FormData(form));
  const capture = () => { if (form && flow.owner && !restoring && !flow.saved) draft = { owner: flow.owner, values: values() }; };
  const announce = value => { message.textContent = value; };
  const recovery = (error, opener = trigger) => {
    document.getElementById('mtQuickLogRecovery')?.remove();
    const notice = document.createElement('section'); notice.id = 'mtQuickLogRecovery'; notice.setAttribute('role', 'alert');
    const text = document.createElement('p');
    const signIn = error.status === 401 || error.code === 'session_required';
    text.textContent = signIn ? 'Please sign in again before adding to your private log.' : error.message || 'Log your day could not open. Please try again.';
    notice.append(text);
    if (signIn) { const link = document.createElement('a'); link.href = '/member-login?returnTo=%2Fmember%2Fdashboard'; link.textContent = 'Sign in to My Timber'; notice.append(link); }
    else { const button = document.createElement('button'); button.type = 'button'; button.textContent = 'Reopen Log your day'; button.onclick = () => open(opener); notice.append(button); }
    const brand = document.getElementById('todayBrand'); if (brand) brand.after(notice); else document.body.prepend(notice);
  };
  const savedStatus = () => {
    document.getElementById('mtQuickLogSavedStatus')?.remove();
    const todayPanel = document.getElementById('panel-today');
    if (!todayPanel) return;
    const notice = document.createElement('section'); notice.id = 'mtQuickLogSavedStatus'; notice.setAttribute('role', 'status');
    const text = document.createElement('p'); text.textContent = 'Your log is saved.';
    const link = document.createElement('a'); link.href = '/member/dashboard#visualise'; link.textContent = 'View Journey';
    link.addEventListener('click', event => { const tab = document.querySelector('.mp-tab[data-panel="visualise"]'); if (tab) { event.preventDefault(); tab.click(); if (location.hash !== '#visualise') location.hash = '#visualise'; } });
    notice.append(text, link); todayPanel.prepend(notice);
  };
  const showWeight = () => {
    form.querySelector('[data-mtql-stone]').hidden = form.elements.weightUnit.value !== 'stone_lb';
    form.querySelector('[data-mtql-single]').hidden = form.elements.weightUnit.value === 'stone_lb';
    form.querySelector('[data-mtql-weight-label]').textContent = form.elements.weightUnit.value === 'lb' ? 'Weight (lb)' : form.elements.weightUnit.value === 'kg' ? 'Weight (kg)' : 'Weight';
  };
  const setBusy = busy => {
    form.setAttribute('aria-busy', String(busy));
    for (const control of form.querySelectorAll('input,select,textarea,button')) control.disabled = busy;
    dialog.querySelector('[data-mtql-close]').disabled = busy;
    if (!busy && (flow.saved || flow.unconfirmed)) { save.disabled = flow.unconfirmed; form.querySelectorAll('input,select,textarea').forEach(control => { control.disabled = true; }); }
  };
  const returnToday = () => {
    if (flow.busy) return;
    if (flow.saved) { draft = null; flow.startAnother(); form.reset(); }
    else capture();
    dialog.close();
    if (/^\/member\/dashboard(?:\.html)?\/?$/.test(location.pathname)) {
      document.querySelector('.mp-tab[data-panel="today"]')?.click();
      if (location.hash !== '#today') location.hash = '#today';
    } else location.assign('/member/dashboard#today');
  };
  const build = () => {
    if (dialog) return;
    dialog = document.createElement('dialog'); dialog.id = 'mtQuickLog';
    dialog.setAttribute('aria-labelledby', 'mtQuickLogTitle');
    dialog.innerHTML = '<div class="mtql-top"><strong>MY TIMBER</strong><button type="button" data-mtql-close>Back</button></div>' +
      '<header class="mtql-heading"><h2 id="mtQuickLogTitle">Log your day.</h2><p>As much or as little as you like.<br>One reading or a note is enough.</p></header>' +
      '<form novalidate autocomplete="off"><label>Date<input name="recordedOn" type="date" required></label>' +
      '<section class="mtql-weight" aria-label="Optional weight"><div class="mtql-weight-top"><strong>Weight <span class="mtql-optional">(optional)</span></strong><label>Units<select name="weightUnit"><option value="">Choose units</option><option value="kg">kg</option><option value="stone_lb">st / lb</option><option value="lb">lb</option></select></label></div>' +
      '<label data-mtql-single><span data-mtql-weight-label>Weight (kg)</span><input name="weight" type="number" inputmode="decimal" step="any" min="0" autocomplete="off"></label>' +
      '<div class="mtql-pair" data-mtql-stone hidden><label>Stone<input name="weightStone" type="number" inputmode="numeric" step="1" min="0" autocomplete="off"></label><label>Pounds<input name="weightPounds" type="number" inputmode="decimal" step="any" min="0" max="13.999999" autocomplete="off"></label></div></section>' +
      '<details><summary>Add another reading</summary><div class="mtql-metrics">' +
      [['waistCm', 'Waist (cm)', 'any'], ['systolic', 'Blood pressure — top', '1'], ['diastolic', 'Blood pressure — bottom', '1'], ['restingHr', 'Resting pulse (bpm)', '1'], ['steps', 'Steps', '1'], ['proteinG', 'Protein (g)', 'any'], ['sleepHours', 'Sleep (hours)', 'any']].map(([name, label, step]) => '<label>' + label + '<input name="' + name + '" type="number" inputmode="' + (step === '1' ? 'numeric' : 'decimal') + '" min="0" step="' + step + '"' + (name === 'sleepHours' ? ' max="24"' : '') + ' autocomplete="off"></label>').join('') +
      '</div></details><details><summary>Add a note</summary><label>Anything you want to remember<textarea name="notes" maxlength="4000" rows="3" autocomplete="off"></textarea></label></details>' +
      '<p class="mtql-status" role="status" aria-live="polite" tabindex="-1"></p><div class="mtql-actions"><button class="mtql-primary" type="submit">Save &amp; back to My Timber</button><button type="button" class="mtql-secondary" data-mtql-cancel>Back without saving</button>' +
      '<button type="button" data-mtql-checked hidden>I checked — allow another save</button><a class="mtql-link" href="/member/dashboard#visualise" data-mtql-records hidden>Check saved records</a></div><p class="mtql-privacy">Private to your signed-in account. This is not clinical monitoring.</p></form>';
    document.body.append(dialog); form = dialog.querySelector('form'); message = dialog.querySelector('.mtql-status'); save = form.querySelector('[type="submit"]'); retry = form.querySelector('[data-mtql-checked]'); returnLink = form.querySelector('[data-mtql-records]');
    dialog.querySelector('[data-mtql-close]').onclick = () => { if (!flow.busy) { capture(); dialog.close(); } };
    form.querySelector('[data-mtql-cancel]').onclick = () => { if (flow.saved) returnToday(); else { capture(); dialog.close(); } };
    dialog.addEventListener('cancel', event => { if (flow.busy) event.preventDefault(); else capture(); });
    dialog.addEventListener('keydown', event => {
      if (event.key !== 'Tab') return;
      const controls = [...dialog.querySelectorAll('a[href],button,input:not([type="hidden"]),select,textarea,summary,[tabindex]:not([tabindex="-1"])')].filter(control => {
        if (control.disabled || !control.getClientRects().length || getComputedStyle(control).visibility === 'hidden') return false;
        // WebKit can report boxes for descendants of closed details. Their
        // summary remains available; collapsed fields must not enter Tab order.
        const closed = control.closest('details:not([open])');
        return !closed || control.tagName === 'SUMMARY' && control.parentElement === closed;
      });
      event.preventDefault();
      if (!controls.length) { dialog.focus(); return; }
      const index = controls.indexOf(document.activeElement), step = event.shiftKey ? -1 : 1;
      // Explicit order also keeps Safari's reduced keyboard-navigation setting
      // from skipping the dialog's action buttons and escaping to browser chrome.
      controls[index < 0 ? (event.shiftKey ? controls.length - 1 : 0) : (index + step + controls.length) % controls.length].focus();
    });
    dialog.addEventListener('close', () => { if (!document.hidden && trigger?.isConnected) trigger.focus({ preventScroll: true }); });
    form.addEventListener('input', capture); form.addEventListener('change', capture);
    form.elements.weightUnit.addEventListener('change', () => {
      const next = form.elements.weightUnit.value, prior = previousWeightUnit;
      if (!next && prior) { form.elements.weightUnit.value = prior; announce('Choose kg, stone and pounds, or pounds.'); return; }
      if (prior && next && next !== prior) {
        const sample = { recordedOn: today(), weightUnit: prior, weight: form.elements.weight.value, weightStone: form.elements.weightStone.value, weightPounds: form.elements.weightPounds.value };
        const hasWeight = prior === 'stone_lb' ? sample.weightStone !== '' || sample.weightPounds !== '' : sample.weight !== '';
        if (hasWeight) {
          try {
            const kg = makePayload(sample, today()).weightKg;
            form.elements.weight.value = form.elements.weightStone.value = form.elements.weightPounds.value = '';
            if (next === 'stone_lb') { const total = kg / 0.45359237; let stone = Math.floor(total / 14), pounds = Math.round((total - stone * 14) * 1000) / 1000; if (pounds >= 14) { ++stone; pounds = 0; } form.elements.weightStone.value = String(stone); form.elements.weightPounds.value = String(pounds); }
            else form.elements.weight.value = String(Math.round((next === 'lb' ? kg / 0.45359237 : kg) * 1000) / 1000);
          } catch (error) { form.elements.weightUnit.value = prior; announce('Check your existing weight before changing its units. ' + error.message); showWeight(); return; }
        } else form.elements.weight.value = form.elements.weightStone.value = form.elements.weightPounds.value = '';
      }
      previousWeightUnit = next; showWeight(); capture();
    });
    retry.onclick = () => { flow.allowCheckedRetry(); retry.hidden = returnLink.hidden = true; setBusy(false); announce('Your draft is ready. Save only if you have checked that this entry is missing.'); };
    form.addEventListener('submit', async event => {
      event.preventDefault(); if (flow.busy || flow.unconfirmed) return;
      let payload;
      try { if (!flow.saved) payload = makePayload(values(), today()); } catch (error) { announce(error.message); message.focus(); return; }
      capture(); setBusy(true); announce(flow.saved ? 'Refreshing your saved summary…' : 'Saving your private log…');
      try {
        const result = await flow.save(payload);
        if (document.hidden) return;
        if (!dialog.open) return;
        if (!result.refreshed) { announce(result.message); save.textContent = 'Retry summary'; form.querySelector('[data-mtql-cancel]').textContent = 'Back to My Timber'; return; }
        document.dispatchEvent(new CustomEvent('sst:progress-saved', { detail: { recordedOn: result.recordedOn, summaryRefreshed: true, progress: result.progress } }));
        document.dispatchEvent(new CustomEvent('sst:treatment-refresh'));
        document.dispatchEvent(new CustomEvent('sst:refresh-today'));
        announce('Your log is saved.');
        savedStatus();
        draft = null;
        setBusy(false); returnToday();
      } catch (error) {
        if (document.hidden) return;
        if (!dialog.open) { recovery(error); return; }
        if (flow.unconfirmed) { announce('We could not confirm whether that saved. Check your saved records before saving it again. Your draft is kept here.'); retry.hidden = returnLink.hidden = false; }
        else announce(error.status === 401 || error.code === 'session_required' ? 'Your sign-in expired. Sign in again before saving.' : error.message || 'Your log could not save. Your draft is still here.');
        message.focus();
      } finally { if (dialog.open) setBusy(false); }
    });
  };
  async function open(opener) {
    // Embedded Grub/Fit routes use the owning dashboard's one dialog and draft.
    try { if (window.parent !== window && parent.location.origin === location.origin && parent.SST_QUICK_LOG) { parent.SST_QUICK_LOG.open(parent.document.activeElement); return; } } catch {}
    if (flow.busy || opening) return;
    if (dialog?.open) { dialog.focus(); return; }
    opening = true; build(); document.getElementById('mtQuickLogSavedStatus')?.remove(); trigger = opener || document.activeElement; const version = ++openVersion;
    try {
      const result = await flow.open();
      if (version !== openVersion || document.hidden) return;
      restoring = true; form.reset();
      form.elements.recordedOn.value = today(); form.elements.recordedOn.max = today();
      if (draft?.owner === result.owner) { for (const [name, value] of Object.entries(draft.values)) if (form.elements[name]) form.elements[name].value = value; }
      else form.elements.weightUnit.value = result.units || '';
      previousWeightUnit = form.elements.weightUnit.value;
      restoring = false; showWeight(); retry.hidden = returnLink.hidden = !flow.unconfirmed;
      save.textContent = flow.saved ? 'Retry summary' : 'Save & back to My Timber';
      form.querySelector('[data-mtql-cancel]').textContent = flow.saved ? 'Back to My Timber' : 'Back without saving';
      announce(flow.saved ? 'Your log is already saved. Retry only the summary.' : flow.unconfirmed ? 'The last save could not be confirmed. Check your saved records before trying again.' : result.units ? '' : 'Saved units could not load. Choose units if adding weight; you can still add another reading or a note.');
      document.getElementById('mtQuickLogRecovery')?.remove();
      setBusy(false); dialog.showModal(); form.elements.recordedOn.focus();
    } catch (error) {
      restoring = false;
      if (version === openVersion && !document.hidden) recovery(error, opener);
    } finally { opening = false; }
  }
  window.SST_QUICK_LOG = { open, clear: () => { ++openVersion; flow.clear(); } };
  document.addEventListener('click', event => { const opener = event.target.closest?.('[data-mt-quick-log]'); if (opener) { event.preventDefault(); open(opener); } if (event.target.closest?.('[data-member-logout],.member-nav-logout')) window.SST_QUICK_LOG.clear(); });
  document.addEventListener('sst:quick-log-open', () => open(document.activeElement));
  addEventListener('pagehide', () => { ++openVersion; flow.clear(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) { ++openVersion; document.getElementById('mtQuickLogSavedStatus')?.remove(); capture(); if (dialog?.open) dialog.close(); if (form) form.reset(); } });
  new MutationObserver(() => { if (document.body.dataset.accountDeleted === '1' || ['signed-out', 'error', 'pending'].includes(document.body.dataset.memberSession)) window.SST_QUICK_LOG.clear(); }).observe(document.body, { attributes: true, attributeFilter: ['data-member-session', 'data-account-deleted'] });
}

export const quickLogClient = '(' + quickLogBrowser.toString() + ')(' + quickLogPayload.toString() + ',' + createQuickLogFlow.toString() + ');';
