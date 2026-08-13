import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const SITE = (process.env.SHIFT_SITE_BASE || 'https://shiftsometimber.co.uk').replace(/\/$/, '');
const API = (process.env.SHIFT_API_BASE || 'https://api.shiftsometimber.co.uk').replace(/\/$/, '');
const OIDC = String(process.env.SHIFT_COMMISSIONING_OIDC || '').trim();
const OUT = process.env.OVERFLOW_EVIDENCE_DIR || 'overflow-evidence';
const password = 'Shift-Commissioning-2026!';
if (!OIDC) throw new Error('SHIFT_COMMISSIONING_OIDC required');
fs.mkdirSync(OUT, { recursive: true });

const report = {
  proof: 'GATE1_AUTHENTICATED_OVERFLOW_DIAGNOSTIC_V4',
  cases: [],
  failures: [],
  navigationErrors: [],
  browserErrors: [],
};
const write = () => fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));
const clean = (v) => String(v || '').replace(/\s+/g, ' ').trim();

async function register(email) {
  const r = await fetch(`${API}/v1/auth/register`, {
    method: 'POST',
    headers: {
      Origin: SITE,
      'Content-Type': 'application/json',
      'X-Shift-Commissioning-OIDC': OIDC,
    },
    body: JSON.stringify({ email, firstName: 'Dave', password, source: 'commissioning-rendered' }),
  });
  if (r.status !== 201) throw new Error(`register ${r.status} ${await r.text()}`);
}

async function visible(p, re) {
  for (const x of [
    p.getByRole('link', { name: re }).first(),
    p.getByRole('button', { name: re }).first(),
    p.getByText(re).first(),
  ]) {
    if ((await x.count()) && (await x.isVisible().catch(() => false))) return x;
  }
  return null;
}

async function dismissCookie(p) {
  for (const re of [/necessary only/i, /accept analytics/i, /accept all/i]) {
    const x = await visible(p, re);
    if (x) {
      await x.click({ timeout: 3000 }).catch(() => {});
      await p.waitForTimeout(250);
      return true;
    }
  }
  return false;
}

async function login(p, email) {
  await p.goto(`${SITE}/member-login`, { waitUntil: 'networkidle', timeout: 45000 });
  await dismissCookie(p);
  const emailInput = p.locator('input[type="email"],input[name*="email" i]').filter({ visible: true }).first();
  const passwordInput = p.locator('input[type="password"]').filter({ visible: true }).first();
  await emailInput.fill(email);
  await passwordInput.fill(password);
  const form = emailInput.locator('xpath=ancestor::form[1]');
  const button = (await form.count() ? form : p)
    .locator('button[type="submit"],input[type="submit"],button')
    .filter({ visible: true })
    .first();
  await button.click();
  await p.waitForTimeout(700);
  await p.goto(`${SITE}/member/dashboard?release=33d#today`, { waitUntil: 'networkidle', timeout: 45000 });
  await dismissCookie(p);
}

async function inspect(p, name) {
  const d = await p.evaluate(() => {
    const root = document.documentElement;
    const vw = root.clientWidth;
    const iw = window.innerWidth;
    const sw = root.scrollWidth;
    const elements = [];
    const overlays = [];

    for (const el of document.querySelectorAll('body *')) {
      const r = el.getBoundingClientRect();
      if (!r.width && !r.height) continue;
      const c = getComputedStyle(el);
      const meta = {
        tag: el.tagName.toLowerCase(),
        id: el.id || '',
        className: String(el.className || '').slice(0, 220),
        role: el.getAttribute('role') || '',
        ariaLabel: el.getAttribute('aria-label') || '',
        text: String(el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 180),
        left: Math.round(r.left),
        right: Math.round(r.right),
        top: Math.round(r.top),
        bottom: Math.round(r.bottom),
        width: Math.round(r.width),
        height: Math.round(r.height),
        viewport: vw,
        innerWidth: iw,
        position: c.position,
        display: c.display,
        visibility: c.visibility,
        boxSizing: c.boxSizing,
        widthCss: c.width,
        minWidth: c.minWidth,
        maxWidth: c.maxWidth,
        paddingLeft: c.paddingLeft,
        paddingRight: c.paddingRight,
        marginLeft: c.marginLeft,
        marginRight: c.marginRight,
        overflowX: c.overflowX,
        whiteSpace: c.whiteSpace,
        transform: c.transform,
        zIndex: c.zIndex,
      };
      const excess = Math.max(r.right - vw, -r.left, r.width - vw);
      if (excess > 8) elements.push({ el, meta: { ...meta, excess: Math.round(excess) } });
      if ((c.position === 'fixed' || c.position === 'sticky') && c.visibility !== 'hidden') overlays.push(meta);
    }

    elements.sort((a, b) => b.meta.excess - a.meta.excess);
    overlays.sort((a, b) => (Number(b.zIndex) || 0) - (Number(a.zIndex) || 0));
    const top = elements.slice(0, 30);
    const matchedRules = [];

    for (const sheet of Array.from(document.styleSheets)) {
      let rules = [];
      try { rules = Array.from(sheet.cssRules || []); } catch { continue; }
      const walk = (rs) => {
        for (const rule of rs) {
          if (rule.cssRules) { walk(Array.from(rule.cssRules)); continue; }
          const selector = rule.selectorText;
          if (!selector) continue;
          let hit = false;
          for (const x of top) {
            try { if (x.el.matches(selector)) { hit = true; break; } } catch {}
          }
          if (!hit) continue;
          const css = String(rule.cssText || '');
          if (!/(width|min-width|max-width|margin|padding|transform|translate|overflow|white-space|position|grid|flex|left|right)/i.test(css)) continue;
          matchedRules.push({ href: sheet.href || 'inline', selector, css: css.slice(0, 1800) });
        }
      };
      walk(rules);
    }

    const ancestry = top.slice(0, 12).map((x) => {
      const chain = [];
      let el = x.el;
      for (let i = 0; el && i < 10; i++, el = el.parentElement) {
        const r = el.getBoundingClientRect();
        const c = getComputedStyle(el);
        chain.push({
          tag: el.tagName.toLowerCase(),
          id: el.id || '',
          className: String(el.className || '').slice(0, 180),
          left: Math.round(r.left),
          right: Math.round(r.right),
          width: Math.round(r.width),
          position: c.position,
          overflowX: c.overflowX,
          widthCss: c.width,
          minWidth: c.minWidth,
          maxWidth: c.maxWidth,
          transform: c.transform,
          display: c.display,
          gridTemplateColumns: c.gridTemplateColumns,
          flex: c.flex,
        });
      }
      return { offender: x.meta, chain };
    });

    const myShift = Array.from(document.querySelectorAll('a,button')).map((el) => ({
      tag: el.tagName.toLowerCase(),
      text: String(el.textContent || '').replace(/\s+/g, ' ').trim(),
      href: el instanceof HTMLAnchorElement ? el.href : '',
      ariaLabel: el.getAttribute('aria-label') || '',
    })).filter((x) => /my\s*shift/i.test(`${x.text} ${x.ariaLabel}`)).slice(0, 20);

    return {
      url: location.href,
      viewport: vw,
      innerWidth: iw,
      scrollbarWidth: iw - vw,
      scrollWidth: sw,
      overflow: sw - vw,
      bodyWidth: Math.round(document.body.getBoundingClientRect().width),
      htmlStyle: { overflowX: getComputedStyle(root).overflowX },
      bodyStyle: {
        overflowX: getComputedStyle(document.body).overflowX,
        margin: getComputedStyle(document.body).margin,
        padding: getComputedStyle(document.body).padding,
      },
      stylesheets: Array.from(document.styleSheets).map((s) => s.href || 'inline'),
      offenders: top.map((x) => x.meta),
      overlays: overlays.slice(0, 40),
      ancestry,
      matchedRules: matchedRules.slice(0, 160),
      myShift,
    };
  });

  report.cases.push({ name, ...d });
  if (d.overflow > 8) {
    report.failures.push({
      name,
      overflow: d.overflow,
      top: d.offenders.slice(0, 12),
      overlays: d.overlays.slice(0, 20),
      rules: d.matchedRules.slice(0, 40),
      ancestry: d.ancestry.slice(0, 8),
      myShift: d.myShift,
    });
  }
  await p.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: true }).catch((e) => {
    report.browserErrors.push({ name, stage: 'screenshot', error: clean(e.message).slice(0, 400) });
  });
  write();
  return d;
}

const targets = [
  ['today', /^today$|shift today/i],
  ['grub', /shift grub|\bgrub\b/i],
  ['fit', /shift fit|\bfit\b/i],
  ['progress', /shift progress|\bprogress\b/i],
  ['shift-ai', /shift ai/i],
];

const nonce = Date.now();
const users = [
  { name: 'desktop', viewport: { width: 1440, height: 900 } },
  { name: 'mobile390', viewport: { width: 390, height: 844 } },
].map((x) => ({ ...x, email: `shiftsometimber+structured-authrender-overflow-${nonce}-${x.name}@gmail.com` }));

try {
  await Promise.all(users.map((x) => register(x.email)));
} catch (e) {
  report.browserErrors.push({ stage: 'registration', error: clean(e.message).slice(0, 600) });
  write();
  throw e;
}

const browser = await chromium.launch({ headless: true });
try {
  for (const x of users) {
    const context = await browser.newContext({ viewport: x.viewport, reducedMotion: 'reduce' });
    const page = await context.newPage();
    page.on('pageerror', (e) => {
      report.browserErrors.push({ name: x.name, stage: 'pageerror', error: clean(e.message).slice(0, 600) });
      write();
    });
    page.on('console', (m) => {
      if (m.type() === 'error') {
        report.browserErrors.push({ name: x.name, stage: 'console', error: clean(m.text()).slice(0, 600) });
        write();
      }
    });

    try {
      await login(page, x.email);
      await page.waitForTimeout(900);
      await inspect(page, `${x.name}-landing`);

      for (const [key, re] of targets) {
        try {
          await page.goto(`${SITE}/member/dashboard?release=33d#today`, { waitUntil: 'networkidle', timeout: 45000 });
          await dismissCookie(page);
          const action = await visible(page, re);
          if (action) {
            await action.click({ timeout: 6000 });
            await page.waitForTimeout(900);
          } else {
            report.navigationErrors.push({ name: `${x.name}-${key}`, error: 'action not visible from canonical dashboard' });
          }
        } catch (e) {
          report.navigationErrors.push({ name: `${x.name}-${key}`, error: clean(e.message).slice(0, 700) });
          write();
        }
        await inspect(page, `${x.name}-${key}`);
      }
    } catch (e) {
      report.browserErrors.push({ name: x.name, stage: 'journey', error: clean(e.message).slice(0, 900) });
      write();
    } finally {
      await context.close();
    }
  }
} finally {
  await browser.close();
  write();
}

console.log(JSON.stringify({
  proof: report.proof,
  cases: report.cases.map((x) => ({
    name: x.name,
    url: x.url,
    overflow: x.overflow,
    top: x.offenders.slice(0, 5),
    overlays: x.overlays.slice(0, 8),
    myShift: x.myShift,
  })),
  failures: report.failures,
  navigationErrors: report.navigationErrors,
  browserErrors: report.browserErrors,
}, null, 2));

if (!report.failures.length) console.log('PASS no horizontal overflow detected across populated authenticated routes');
else console.error(`FAIL horizontal overflow remains in ${report.failures.length} inspected cases`);
