import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

// Read-only reporting guard. A page breakdown is not interchangeable with
// property totals; preserve both and withhold attribution when they conflict.
export function reconcile(property, control, pages, independentExport = null) {
  if ([property, control, pages].some(r => !r.scope || !r.scope.country || !r.scope.brand)) throw Error('Explicit country and brand scope required');
  const signature = r => JSON.stringify([r.siteUrl, r.startDate, r.endDate, r.searchType, r.scope]);
  if (![control, pages].every(r => signature(r) === signature(property))) throw Error('Incomparable measurement scopes or windows');
  if ([property, control, pages].some(r => r.pagination?.hasMore)) throw Error('Fetch remaining rows before reconciliation');
  const totals = r => r.rows.reduce((t, row) => ({clicks:t.clicks + row.clicks, impressions:t.impressions + row.impressions}), {clicks:0, impressions:0});
  const p = totals(property), c = totals(control), b = totals(pages);
  const stable = p.clicks === c.clicks && p.impressions === c.impressions;
  const conflict = stable && p.clicks > 0 && b.clicks === 0;
  let independentDailyControlsAgree = null, independentPageControlsAgree = null;
  if (independentExport) {
    const native = independentExport.property, nativePages = independentExport.pages;
    if (![native, nativePages].every(r => signature(r) === signature(property))) throw Error('Incomparable independent export scope or window');
    if ([native, nativePages].some(r => r.pagination?.hasMore)) throw Error('Independent export has remaining rows');
    const perDate = report => {
      const daily = new Map();
      for (const row of report.rows) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(row.date || '')) throw Error('Independent reconciliation requires dated property rows');
        const total = daily.get(row.date) || {clicks:0, impressions:0};
        total.clicks += row.clicks; total.impressions += row.impressions; daily.set(row.date, total);
      }
      return [...daily].sort(([a],[b]) => a.localeCompare(b));
    };
    independentDailyControlsAgree = JSON.stringify(perDate(native)) === JSON.stringify(perDate(property));
    const n = totals(nativePages);
    independentPageControlsAgree = n.clicks === b.clicks && n.impressions === b.impressions;
  }
  return {property:p, control:c, pageBreakdown:b, propertyControlsAgree:stable,
    independentDailyControlsAgree, independentPageControlsAgree,
    pageClickAttribution:conflict ? 'unresolved' : stable ? 'reported; aggregation limits apply' : 'unresolved',
    pageCTRUsable:stable && !conflict && independentDailyControlsAgree !== false && independentPageControlsAgree !== false,
    cause:conflict ? independentDailyControlsAgree && independentPageControlsAgree ? 'Not established; discrepancy reproduced in native Google export, source-level investigation required' : 'Not established; independent Search Console export required' : null,
    outcomeClaimsAllowed:false};
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [property,control,pages] = process.argv.slice(2).map(p => JSON.parse(readFileSync(p,'utf8')));
  console.log(JSON.stringify(reconcile(property,control,pages),null,2));
}
