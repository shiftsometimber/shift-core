import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

// Read-only reporting guard. A page breakdown is not interchangeable with
// property totals; preserve both and withhold attribution when they conflict.
export function reconcile(property, control, pages) {
  if ([property, control, pages].some(r => !r.scope || !r.scope.country || !r.scope.brand)) throw Error('Explicit country and brand scope required');
  const signature = r => JSON.stringify([r.siteUrl, r.startDate, r.endDate, r.searchType, r.scope]);
  if (![control, pages].every(r => signature(r) === signature(property))) throw Error('Incomparable measurement scopes or windows');
  if ([property, control, pages].some(r => r.pagination?.hasMore)) throw Error('Fetch remaining rows before reconciliation');
  const totals = r => r.rows.reduce((t, row) => ({clicks:t.clicks + row.clicks, impressions:t.impressions + row.impressions}), {clicks:0, impressions:0});
  const p = totals(property), c = totals(control), b = totals(pages);
  const stable = p.clicks === c.clicks && p.impressions === c.impressions;
  const conflict = stable && p.clicks > 0 && b.clicks === 0;
  return {property:p, control:c, pageBreakdown:b, propertyControlsAgree:stable,
    pageClickAttribution:conflict ? 'unresolved' : stable ? 'reported; aggregation limits apply' : 'unresolved',
    pageCTRUsable:stable && !conflict,
    cause:conflict ? 'Not established; independent Search Console export required' : null,
    outcomeClaimsAllowed:false};
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [property,control,pages] = process.argv.slice(2).map(p => JSON.parse(readFileSync(p,'utf8')));
  console.log(JSON.stringify(reconcile(property,control,pages),null,2));
}
