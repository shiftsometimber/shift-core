const FORBIDDEN = [
  /\b(?:medication|treatment|dose|jab|tablet) (?:is |isn't |has |hasn't )?(?:working|effective|ineffective)\b/i,
  /\bcaused by\b/i,
  /\b(?:increase|decrease|raise|lower|switch|stop|start) (?:your )?(?:dose|medication|treatment)\b/i,
  /\bdiagnos(?:e|ed|is)\b/i
];

export const JOURNEY_EVIDENCE = Object.freeze({
  descriptivePoints: 2,
  trendWeeks: 4,
  timingCycles: 3,
  stallWeeks: 4
});

const finite = value => Number.isFinite(Number(value)) ? Number(value) : null;
const dated = rows => [...(Array.isArray(rows) ? rows : [])]
  .filter(row => row?.confirmed === true && !Number.isNaN(Date.parse(row.date)))
  .sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
const delta = (rows, key) => {
  const points = rows.map(row => finite(row[key])).filter(value => value !== null);
  return points.length >= JOURNEY_EVIDENCE.descriptivePoints
    ? Number((points.at(-1) - points[0]).toFixed(2)) : null;
};
const phrase = (value, down, up) => value < 0 ? down : value > 0 ? up : 'broadly unchanged';

export function journeySignals(records, options = {}) {
  const rows = dated(records);
  const window = rows.slice(-Math.max(JOURNEY_EVIDENCE.trendWeeks, Number(options.windowWeeks) || 4));
  const weightDeltaKg = delta(window, 'weightKg');
  const waistDeltaCm = delta(window, 'waistCm');
  const clothesImproved = window.filter(row => ['looser', 'much_looser', 'dropped_size', 'fits_again'].includes(row.clothesFit)).length;
  const lifeBackWins = window.reduce((sum, row) => sum + (Array.isArray(row.lifeBackWins) ? row.lifeBackWins.length : 0), 0);
  const enoughForTrend = window.length >= JOURNEY_EVIDENCE.trendWeeks;
  const noiseBandKg = Math.max(0.25, finite(options.weightNoiseBandKg) ?? 0.5);
  return {
    confirmedWeeks: window.length,
    enoughForTrend,
    weightDeltaKg,
    waistDeltaCm,
    clothesImproved,
    lifeBackWins,
    weightDirection: weightDeltaKg === null ? 'unknown' : phrase(weightDeltaKg, 'down', 'up'),
    waistDirection: waistDeltaCm === null ? 'unknown' : phrase(waistDeltaCm, 'down', 'up'),
    weightBroadlySteady: enoughForTrend && weightDeltaKg !== null && Math.abs(weightDeltaKg) <= noiseBandKg,
    nonScaleProgress: (waistDeltaCm !== null && waistDeltaCm < 0) || clothesImproved > 0 || lifeBackWins > 0,
    windowStart: window[0]?.date ?? null,
    windowEnd: window.at(-1)?.date ?? null
  };
}

export function repeatedTreatmentTiming(records, symptom) {
  const rows = dated(records).filter(row => row.symptoms?.[symptom]?.severity && finite(row.symptoms[symptom].daysAfterTreatment) !== null);
  if (rows.length < JOURNEY_EVIDENCE.timingCycles) return null;
  const days = rows.map(row => finite(row.symptoms[symptom].daysAfterTreatment));
  const min = Math.min(...days), max = Math.max(...days);
  if (max - min > 1) return null;
  return {symptom, cycles: rows.length, dayRange: [min, max], statement: `${symptom} was recorded at a similar time after treatment in ${rows.length} confirmed weeks.`};
}

export function buildJourneyObservation(records, options = {}) {
  const signals = journeySignals(records, options);
  if (signals.confirmedWeeks < JOURNEY_EVIDENCE.descriptivePoints || signals.weightDeltaKg === null) return null;
  const reading = signals.enoughForTrend ? 'trend' : 'comparison';
  const what_happened = [`Across ${signals.confirmedWeeks} confirmed weeks, weight was ${signals.weightDirection} (${Math.abs(signals.weightDeltaKg)} kg).`];
  if (signals.waistDeltaCm !== null) what_happened.push(`Waist was ${signals.waistDirection} (${Math.abs(signals.waistDeltaCm)} cm).`);
  if (signals.clothesImproved) what_happened.push(`Looser clothes or a clothing milestone was recorded in ${signals.clothesImproved} week${signals.clothesImproved === 1 ? '' : 's'}.`);
  if (signals.lifeBackWins) what_happened.push(`${signals.lifeBackWins} Life Back win${signals.lifeBackWins === 1 ? '' : 's'} were recorded.`);
  const changed_alongside = [];
  const rows = dated(records).slice(-signals.confirmedWeeks);
  if (rows.filter(row => finite(row.mealConsistency) >= 3).length >= 2) changed_alongside.push('More consistent meals were recorded during this period.');
  if (rows.filter(row => finite(row.movementMinutes) > 0).length >= 2) changed_alongside.push('Movement was recorded during this period.');
  const might_have_contributed = changed_alongside.length ? ['Those recorded changes might have contributed to the overall pattern.'] : ['There is not enough recorded context to identify a possible contributor.'];
  const cannot_conclude = ['These records show timing and association, not cause.', 'My Journey cannot determine the effect of treatment, food, movement or normal fluctuation on its own.'];
  const next_move = options.mode === 'maintenance'
    ? 'Keep the easiest routine that supports your personal hold band this week.'
    : signals.nonScaleProgress && signals.weightBroadlySteady
      ? 'Keep recording waist, clothes and Life Back alongside weight next week.'
      : 'Repeat the most manageable recorded routine for one more week, then review the four-week picture.';
  return validateObservation({what_happened, changed_alongside, might_have_contributed, cannot_conclude, next_move, evidence:{...signals, reading, recordIds:rows.map(row => row.id ?? `date:${row.date}`), window:{from:signals.windowStart,to:signals.windowEnd}}, mode:options.mode === 'maintenance' ? 'maintenance' : 'loss'});
}

export function validateObservation(observation) {
  if (!observation || !Array.isArray(observation.what_happened) || !observation.what_happened.length || !Array.isArray(observation.changed_alongside) || !Array.isArray(observation.might_have_contributed) || !observation.might_have_contributed.length || !Array.isArray(observation.cannot_conclude) || !observation.cannot_conclude.length) return null;
  if (!observation.next_move || typeof observation.next_move !== 'string') return null;
  const text = [...observation.what_happened, ...observation.changed_alongside, ...observation.might_have_contributed, ...observation.cannot_conclude, observation.next_move].join(' ');
  if (FORBIDDEN.some(pattern => pattern.test(text))) throw new Error('Unsafe My Journey observation language');
  return observation;
}

export function journeyExport(records, {weeks = 12, mode = 'loss', holdBandKg = null} = {}) {
  const confirmed = dated(records).slice(-Math.max(1, Math.min(52, Number(weeks) || 12)));
  return {
    kind: weeks <= 1 ? 'my_journey_week' : 'my_journey_12_week',
    private: true,
    analyticsIdentifiers: false,
    mode: mode === 'maintenance' ? 'maintenance' : 'loss',
    holdBandKg: mode === 'maintenance' && Array.isArray(holdBandKg) ? holdBandKg.map(finite) : null,
    records: confirmed,
    observation: buildJourneyObservation(confirmed, {mode}),
    missing: ['weightKg','waistCm','clothesFit','feeling'].filter(key => !confirmed.some(row => row[key] != null)),
    disclaimer: 'A private record of confirmed entries. It does not diagnose, prove cause or assess whether treatment is working.'
  };
}
