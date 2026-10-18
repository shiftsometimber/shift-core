// Matt authorised these three wording changes on 8 October 2026.
// OASIS 4: Wharton et al., NEJM 2025, doi:10.1056/NEJMoa2500969.
// Keep prescribing, price, availability, navigation and other trials unchanged.
export const TABLET_WORDING = [
  ['Oral semaglutide. A modern, needle-free route with specific daily instructions.', 'Once-daily oral semaglutide, with specific fasting instructions.'],
  ['Choose the medicine. Know what stays with you.', 'Understand your options. Know what support stays with you.'],
  ['Foundayo is a hero information route, not available stock.', 'Foundayo information is available; SHIFT supply is not confirmed.'],
];
export function tightenTabletWording(path, source) {
  if (!['/start-here', '/start-here.html'].includes(path)) return source;
  for (const [before, after] of TABLET_WORDING) source = source.replaceAll(before, after);
  return source;
}
export function correctOasis4(source) {
  // Exact trial pair: never change injection doses or other placebo groups.
  return source.replace("trial:[['Oral semaglutide',13.6],['Placebo',2.4]]", "trial:[['Oral semaglutide',13.6],['Placebo',2.2]]");
}
export function preserveTabletWording(path, input, {required = false} = {}) {
  if (!['/start-here', '/start-here.html'].includes(path)) return input;
  const source = input.toString('utf8');
  if (required) for (const [before, after] of TABLET_WORDING) {
    if (source.includes(before) || source.split(after).length - 1 !== 1) throw Error('Missing or duplicated approved tablet wording: ' + after);
  }
  return Buffer.from(tightenTabletWording(path, source));
}
