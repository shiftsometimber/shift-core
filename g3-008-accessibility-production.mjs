import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

const SITE = (process.env.SHIFT_SITE_BASE || 'https://shiftsometimber.co.uk').replace(/\/$/, '');
const API = (process.env.SHIFT_API_BASE || 'https://api.shiftsometimber.co.uk').replace(/\/$/, '');
const OIDC = String(process.env.SHIFT_COMMISSIONING_OIDC || '').trim();
const OUT = process.env.G3_008_EVIDENCE_DIR || 'g3-008-accessibility-evidence';

if (!OIDC) throw new Error('SHIFT_COMMISSIONING_OIDC required');
fs.mkdirSync(OUT, { recursive: true });

const password = `Sst-${randomUUID()}-Aa1!`;
const report = {
  proof: 'G3_008_AUTHENTICATED_ACCESSIBILITY_PRODUCTION_V3_AUTHORITATIVE_CSS',
  cases: [],
  failures: [],
};

const clean = (value) => String(value || '').replace(/\s+/g, ' ').trim();
const fail = (name, detail) => {
  report.failures.push({ name, detail });
  console.error(`::error title=G3-008 accessibility::${name} — ${detail}`);
};
const write = () => fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));

async function register(email) {
  const response = await fetch(`${API}/v1/auth/register`, {
    method: 'POST',
    headers: {
      Origin: SITE,
      'Content-Type': 'application/json',
      'X-Shift-Commissioning-OIDC': OIDC,
    },
    body: JSON.stringify({
      email,
      password,
      firstName: 'Accessibility',
      source: 'commissioning-g3-008',
    }),
  });
  if (response.status !== 201) {
    throw new Error(`register ${response.status} ${await response.text()}`);
  }
}

async function login(page, email) {
  await page.goto(`${SITE}/member-login`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  const result = await page.evaluate(
    async ({ api, email: memberEmail, password: memberPassword }) => {
      const response = await fetch(`${api}/v1/auth/login`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: memberEmail, password: memberPassword }),
      });
      let body = {};
      try {
        body = await response.json();
      } catch {}
      return { ok: response.ok, status: response.status, error: body.error || null };
    },
    { api: API, email, password },
  );
  if (!result.ok) throw new Error(`login ${result.status} ${result.error || ''}`);
}

async function action(page, pattern) {
  for (const candidate of [
    page.getByRole('button', { name: pattern }).first(),
    page.getByRole('link', { name: pattern }).first(),
    page.getByRole('tab', { name: pattern }).first(),
    page.getByText(pattern).first(),
  ]) {
    if ((await candidate.count()) && (await candidate.isVisible().catch(() => false))) return candidate;
  }
  return null;
}

async function ensureDashboard(page) {
  let onDashboard = false;
  try {
    onDashboard = new URL(page.url()).pathname === '/member/dashboard';
  } catch {}

  if (!onDashboard) {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        await page.goto(`${SITE}/member/dashboard`, { waitUntil: 'commit', timeout: 30000 });
        break;
      } catch (error) {
        if (attempt) throw error;
      }
    }
  }

  await page.waitForFunction(
    () => /\bToday\b[\s\S]*\bGrub\b[\s\S]*\bFit\b/i.test(document.body?.innerText || ''),
    null,
    { timeout: 20000 },
  );
}

async function openSurface(page, name) {
  await ensureDashboard(page);
  if (name === 'My Shift') return;

  const pattern = name === 'Progress' ? /^shift progress$/i : new RegExp(`^${name}$`, 'i');
  const control = await action(page, pattern);
  if (!control) throw new Error(`surface action missing ${name}`);
  await control.click();
  await page.waitForTimeout(700);
}

function auditFn() {
  return () => {
    const visible = (element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) > 0 && rect.width > 0 && rect.height > 0;
    };
    const rgba = (value) => {
      const match = String(value).match(/rgba?\((\d+(?:\.\d+)?)[, ]+\s*(\d+(?:\.\d+)?)[, ]+\s*(\d+(?:\.\d+)?)(?:[, /]+\s*(\d+(?:\.\d+)?))?\)/i);
      return match ? [+match[1], +match[2], +match[3], match[4] === undefined ? 1 : +match[4]] : null;
    };
    const luminance = (colour) => {
      const channels = colour.slice(0, 3).map((value) => {
        value /= 255;
        return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
    };
    const contrast = (a, b) => {
      const first = luminance(a);
      const second = luminance(b);
      return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
    };
    const background = (element) => {
      let current = element;
      while (current) {
        const style = getComputedStyle(current);
        const colour = rgba(style.backgroundColor);
        if (colour && colour[3] > 0.05) return colour;
        current = current.parentElement;
      }
      return [255, 255, 255, 1];
    };

    const text = [];
    for (const element of document.querySelectorAll('.mp-btn:not(.ghost),.btn.btn-primary,button.btn-primary,.member-form button[type="submit"],.eyebrow,.mp-eyebrow')) {
      if (!visible(element)) continue;
      const style = getComputedStyle(element);
      const foreground = rgba(style.color);
      if (!foreground) continue;
      const ratio = contrast(foreground, background(element));
      text.push({
        tag: element.tagName,
        cls: String(element.className || ''),
        text: String(element.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 90),
        fg: style.color,
        bg: style.backgroundColor,
        ratio: +ratio.toFixed(2),
        pass: ratio >= 4.5,
      });
    }

    const controls = [];
    for (const element of document.querySelectorAll('.member-form input,.member-form select,.member-form textarea,.mp-form input,.mp-form select,.mp-form textarea,.mp-input,.mp-select,.ask-input textarea,[role="switch"],.accessibility-toggle,.access-toggle,.mp-toggle')) {
      if (!visible(element)) continue;
      const style = getComputedStyle(element);
      const border = rgba(style.borderTopColor);
      if (!border) continue;
      const ratio = contrast(border, background(element.parentElement || element));
      controls.push({
        tag: element.tagName,
        cls: String(element.className || ''),
        border: style.borderTopColor,
        ratio: +ratio.toFixed(2),
        pass: ratio >= 3,
      });
    }

    return {
      text,
      controls,
      rootOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      main: document.querySelectorAll('main,[role="main"]').length,
      h1: document.querySelectorAll('h1').length,
      reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
    };
  };
}

async function surfaceAudit(page, row, surface) {
  await openSurface(page, surface);
  const result = await page.evaluate(auditFn());

  for (const item of result.text) {
    if (!item.pass) fail(`${row.id}-${surface}-text-contrast`, JSON.stringify(item));
  }
  for (const item of result.controls) {
    if (!item.pass) fail(`${row.id}-${surface}-control-contrast`, JSON.stringify(item));
  }
  if (result.rootOverflow > 0) fail(`${row.id}-${surface}-overflow`, `${result.rootOverflow}px`);
  if (!result.main) fail(`${row.id}-${surface}-landmark`, 'missing main');
  if (!result.h1) fail(`${row.id}-${surface}-h1`, 'missing h1');
  if (!result.reduced) fail(`${row.id}-${surface}-reduced-motion`, 'preference not active');

  await page.keyboard.press('Tab');
  const focus = await page.evaluate(() => {
    const element = document.activeElement;
    const style = element && getComputedStyle(element);
    return {
      tag: element?.tagName || '',
      id: element?.id || '',
      ok: !!element && element !== document.body && element !== document.documentElement,
      outline: style?.outlineStyle || '',
      width: style?.outlineWidth || '',
      shadow: style?.boxShadow || '',
    };
  });
  if (!focus.ok || ((focus.outline === 'none' || focus.width === '0px') && (!focus.shadow || focus.shadow === 'none'))) {
    fail(`${row.id}-${surface}-focus`, JSON.stringify(focus));
  }

  row.surfaces.push({ surface, ...result, focus });
  await page.screenshot({
    path: path.join(OUT, `${row.id}-${surface.replace(/\s+/g, '-').toLowerCase()}.png`),
    fullPage: true,
  });
}

const browser = await chromium.launch({ headless: true });
try {
  for (const [id, viewport] of Object.entries({
    desktop: { width: 1440, height: 900 },
    mobile390: { width: 390, height: 844 },
  })) {
    const row = { id, viewport, surfaces: [] };
    report.cases.push(row);
    const email = `shiftsometimber+structured-authrender-g3008-${Date.now()}-${id}@gmail.com`;
    let context;

    try {
      await register(email);
      context = await browser.newContext({ viewport, reducedMotion: 'reduce' });
      const page = await context.newPage();
      await login(page, email);
      for (const surface of ['My Shift', 'Today', 'Grub', 'Fit', 'Progress']) {
        await surfaceAudit(page, row, surface);
      }
    } catch (error) {
      fail(`${id}-exception`, clean(error?.message || error).slice(0, 1600));
    } finally {
      write();
      if (context) await context.close().catch(() => {});
    }
  }
} finally {
  await browser.close();
  write();
}

console.log(JSON.stringify(report, null, 2));
if (report.failures.length) throw new Error(`G3-008 authenticated accessibility failed ${report.failures.length}`);
console.log('PASS G3-008 authenticated accessibility: representative member surfaces at desktop + 390px meet the commissioned contrast/control/focus/landmark/reduced-motion/overflow acceptance.');
