// Source reads only. Never retry access denials or publication/notification writes.
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
export function retryDelay(response, attempt, now = Date.now()) {
 if (![429, 502, 503, 504].includes(response.status)) return null;
 const value = response.headers.get('retry-after');
 const parsed = value == null ? NaN : /^\d+(?:\.\d+)?$/.test(value.trim())
  ? Number(value) * 1000 : Date.parse(value) - now;
 const wait = Math.max(1000 * (2 ** attempt), Number.isFinite(parsed) ? parsed : 0);
 // A provider asking for longer must wait for the next scan, not an early retry.
 return wait <= 10000 ? wait : null;
}
export function createRadarSourceFetch({fetchImpl = (...args) => fetch(...args), sleep = delay, now = Date.now} = {}) {
 const origins = new Map();
 return async function sourceFetch(input, init = {}) {
  if (init.method && init.method.toUpperCase() !== 'GET') throw Error('radar_source_get_only');
  const url = new URL(String(input));
  const gap = url.hostname === 'eutils.ncbi.nlm.nih.gov' ? 400 : url.hostname === 'news.google.com' ? 1000 : 0;
  let state = origins.get(url.origin);
  if (!state) { state = {tail: Promise.resolve(), next: 0}; origins.set(url.origin, state); }
  const previous = state.tail;
  let release;
  state.tail = new Promise(resolve => { release = resolve; });
  await previous;
  try {
   for (let attempt = 0; attempt < 3; attempt++) {
    if (state.next > now()) await sleep(state.next - now());
    const response = await fetchImpl(input, {...init, signal: init.signal || AbortSignal.timeout(15000)});
    state.next = now() + gap;
    const wait = attempt < 2 ? retryDelay(response, attempt, now()) : null;
    if (wait === null) return response;
    await response.body?.cancel();
    await sleep(wait);
   }
  } finally { release(); }
 };
}
