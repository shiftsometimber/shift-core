// A Today duration is a request to review and build, never permission to alter a saved plan.
export const fitTodayHandoffSource = String.raw`
  let fitTodayMinutes = null;
  function fitTodayTarget(search) {
    const query = new URLSearchParams(search), value = query.get('minutes');
    if (query.get('from') !== 'today' || query.getAll('from').length !== 1 || query.getAll('minutes').length !== 1 || !/^(10|20|30|45)$/.test(value || '')) return null;
    return Number(value);
  }
  function initFitTodayHandoff() {
    fitTodayMinutes = fitTodayTarget(location.search);
    if (fitTodayMinutes === null) return;
    const minutes = $('#fitMinutes');
    if (!minutes || ![...minutes.options].some(option => option.value === String(fitTodayMinutes))) { fitTodayMinutes = null; return; }
    minutes.value = String(fitTodayMinutes);
    const days = $('#fitDays'); if (days) days.value = '1';
    renderFitTodayHandoff(null);
  }
  function renderFitTodayHandoff(plan) {
    if (fitTodayMinutes === null) return;
    let banner = $('#fitTodayHandoff');
    if (!banner) {
      const builder = document.querySelector('.sf-builder'); if (!builder) return;
      banner = document.createElement('section'); banner.id = 'fitTodayHandoff'; banner.className = 'sf-coach';
      banner.setAttribute('role', 'status'); banner.setAttribute('aria-live', 'polite');
      builder.before(banner);
    }
    banner.dataset.fitTodayMinutes = String(fitTodayMinutes);
    const session = plan?.sessions?.[0], saved = Number(session?.estimated_minutes || session?.requested_minutes || plan?.minutes_per_day);
    const retained = session ? (Number.isFinite(saved) && saved > 0 ? 'Your saved ' + saved + '-minute session below is unchanged.' : 'Your saved session below is unchanged.') : 'Opening this page has not changed your saved plan.';
    const heading = document.createElement('strong'); heading.textContent = 'Today suggested up to ' + fitTodayMinutes + ' minutes.';
    const detail = document.createElement('p'); detail.textContent = retained + ' We have preselected ' + fitTodayMinutes + ' minutes. Review your place, equipment and limitations, then choose Build today’s session if you want a new plan.';
    banner.replaceChildren(heading, detail);
  }
  function finishFitTodayHandoff(result) {
    const plan = result?.plan || result;
    if (fitTodayMinutes === null || !plan?.sessions?.length) return;
    fitTodayMinutes = null; $('#fitTodayHandoff')?.remove();
    const url = new URL(location.href); url.searchParams.delete('from'); url.searchParams.delete('minutes');
    history.replaceState(history.state, '', url.pathname + url.search + url.hash);
  }
`;
