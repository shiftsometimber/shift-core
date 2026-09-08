import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const worker = await readFile(new URL("../worker-entry-v6.js", import.meta.url), "utf8");
test("public sitemap additions never remove upstream URLs", () => {
  assert.match(worker, /PRIORITY_PUBLIC_PATHS/);
  assert.match(worker, /xml\.replace\("<\/urlset>"/);
  assert.doesNotMatch(worker, /filter\([^\n]*mental-health/i);
});
test("SHIFT Health delivers unique server-visible SEO", () => {
  for (const marker of ["SHIFT_HEALTH_SEO", "shiftHealthWithServerSeo", "rel=\"canonical\"", "og:title", "twitter:title", "application/ld+json", "<h1>"])
    assert.ok(worker.includes(marker));
});
test("legacy FAQ routes retain equity", () => {
  for (const route of ["why-do-i-have-no-motivation", "why-do-i-feel-tired-all-the-time", "how-can-i-lose-weight", "how-much-sleep-do-i-need", "what-is-a-healthy-blood-pressure", "what-is-a-healthy-bmi"])
    assert.ok(worker.includes(route));
  assert.match(worker, /legacyFaqRedirects\[path\].*301/s);
});
