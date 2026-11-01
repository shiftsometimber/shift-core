// scoped-source/member-experience/performance-client.mjs
function memberPerformanceClient(options) {
  "use strict";
  options = options || {};
  if (window.__mtPerformance) return;
  window.__mtPerformance = true;
  const originalFetch = window.fetch.bind(window), reads = /* @__PURE__ */ new Map(), pendingReads = /* @__PURE__ */ new Set(), identityOrigins = /* @__PURE__ */ new Set(), originIdentities = /* @__PURE__ */ new Map();
  let version = 0, identity = null, lastOwner = null, identityAt = 0, inflight = null, controller = null;
  const authorisedOrigin = (u) => u.origin === location.origin;
  const firstParty = (u) => [location.origin, "https://api.shiftsometimber.co.uk", "https://shiftsometimber.co.uk", "https://www.shiftsometimber.co.uk"].includes(u.origin);
  function endpoint(input) {
    try {
      return new URL(input instanceof Request ? input.url : input, location.href);
    } catch {
      return null;
    }
  }
  let parentApp;
  try {
    if (parent !== window && parent.location.origin === location.origin) parentApp = parent.MT_PERFORMANCE;
  } catch {
  }
  if (window.SST_API_BASE === "null") window.SST_API_BASE = location.origin;
  const channel = typeof BroadcastChannel === "function" ? new BroadcastChannel("my-timber-session-invalidated") : null;
  function wipe(reason, broadcast = false) {
    ++version;
    identity = null;
    identityAt = 0;
    originIdentities.clear();
    controller?.abort();
    inflight = null;
    if (reason !== "background") {
      reads.clear();
      lastOwner = null;
    }
    document.dispatchEvent(new CustomEvent("mt:identity-invalidated", { detail: { reason } }));
    if (broadcast) channel?.postMessage({ invalidate: true });
  }
  async function verified(force = false) {
    if (parentApp) return parentApp.identity(force);
    if (!force && identity && Date.now() - identityAt < 15e3) return identity;
    if (inflight) return inflight;
    const epoch = version;
    controller = new AbortController();
    const job = (async () => {
      const timer = setTimeout(() => controller?.abort(), 12e3);
      try {
        const r = await originalFetch("/v1/me", { credentials: "include", cache: "no-store", signal: controller.signal });
        if (!r.ok) throw Error("Sign-in unavailable");
        const data = await r.json();
        if (data?.user?.id === void 0 || data.user.id === null) throw Error("Account missing");
        if (epoch !== version) throw Error("Account changed");
        if (lastOwner !== null && lastOwner !== String(data.user.id)) {
          wipe("account-switch");
          throw Error("Account changed");
        }
        originIdentities.clear();
        identity = data;
        lastOwner = String(data.user.id);
        identityAt = Date.now();
        return data;
      } catch (e) {
        if (epoch === version) wipe("identity-failed");
        throw e;
      } finally {
        clearTimeout(timer);
        if (epoch === version) inflight = null;
      }
    })();
    inflight = job;
    return job;
  }
  async function verifiedOrigin(origin) {
    if (!firstParty(new URL(origin)) || origin === location.origin) throw Error("Unrecognised identity origin");
    identityOrigins.add(origin);
    if (parentApp?.identityOrigin) return parentApp.identityOrigin(origin);
    const proof = await verified(), epoch = version, existing = originIdentities.get(origin);
    if (existing && existing.epoch === epoch && Date.now() - existing.at < 15e3) return existing.promise;
    const job = (async () => {
      const r = await originalFetch(origin + "/v1/me", { credentials: "include", cache: "no-store", signal: AbortSignal.timeout(12e3) }), data = await r.json();
      if (epoch !== version) throw Error("Account changed");
      if (!r.ok || String(data?.user?.id) !== String(proof.user.id)) {
        (parentApp?.invalidate || wipe)("identity-origin-mismatch", true);
        throw Error("Account changed");
      }
      return data;
    })();
    originIdentities.set(origin, { epoch, at: Date.now(), promise: job });
    try {
      return await job;
    } catch (e) {
      originIdentities.delete(origin);
      throw e;
    }
  }
  if (!parentApp) channel?.addEventListener("message", () => wipe("another-window"));
  const identityPath = (u) => authorisedOrigin(u) && u.pathname === "/v1/me";
  window.MT_MEMBER_IDENTITY = verified;
  window.fetch = async function(input, init) {
    const u = endpoint(input), method = (init?.method || (input instanceof Request ? input.method : "GET")).toUpperCase();
    if (u && firstParty(u) && u.pathname === "/v1/me" && method === "GET") {
      try {
        return new Response(JSON.stringify(await (identityPath(u) ? verified() : verifiedOrigin(u.origin))), { status: 200, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
      } catch {
        return new Response('{"error":"sign_in_required"}', { status: 401, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
      }
    }
    const tracked = u && firstParty(u) && u.pathname.startsWith("/v1/") && u.pathname !== "/v1/me" && method === "GET";
    let release;
    if (tracked) {
      const job = new Promise((r) => release = r);
      pendingReads.add(job);
      job.finally(() => pendingReads.delete(job));
    }
    try {
      const r = await originalFetch(input, init);
      if (u && firstParty(u) && u.pathname.startsWith("/v1/")) {
        if (u.pathname === "/v1/me" && r.ok) {
          const account = await r.clone().json(), proof = await verified();
          if (String(account?.user?.id) !== String(proof.user.id)) {
            (parentApp?.invalidate || wipe)("identity-origin-mismatch", true);
            throw Error("Account changed");
          }
          identityOrigins.add(u.origin);
        }
        if (r.status === 401) {
          (parentApp?.invalidate || wipe)("api-session-expired", true);
        }
        if (tracked && r.ok) {
          const body = await r.clone().text();
          reads.set(u.href, body);
        }
        if (method !== "GET" && method !== "HEAD" && r.ok && /logout|sign.?out|auth\/login|auth\/switch|privacy\/account/.test(u.pathname)) (parentApp?.invalidate || wipe)("account-operation", true);
      }
      return r;
    } finally {
      release?.();
    }
  };
  async function revalidate() {
    await Promise.allSettled([...pendingReads]);
    const before = version, proof = await verified();
    let changed = false;
    const checks = [...identityOrigins].map((origin) => verifiedOrigin(origin));
    await Promise.all([...checks, ...[...reads].map(async ([path, body]) => {
      const r = await originalFetch(path, { credentials: "include", cache: "no-store", signal: AbortSignal.timeout(12e3) });
      if (!r.ok) {
        if ([401, 403].includes(r.status)) (parentApp?.invalidate || wipe)("private-data-access-changed", true);
        throw Error("Current information unavailable");
      }
      if (await r.text() !== body) changed = true;
    })]);
    if (before !== version) throw Error("Account changed");
    return !changed;
  }
  const screenPath = (u) => authorisedOrigin(u) && ["/member/dashboard", "/member/grub", "/member/fit", "/member/life-back/journey", "/member/life-back/shop"].includes(u.pathname);
  const ready = (w) => {
    const d = w.document, b = d.body;
    if (!b || b.dataset.memberSession !== "ready" || b.dataset.accountDeleted === "1") return false;
    if (b.dataset.memberPage === "dashboard" && !d.querySelector("#previewMember.is-ready:not([hidden])")) return false;
    if (!b.hasAttribute("data-mt-shop-navigation")) return false;
    const main = d.querySelector("main");
    if (!main || w.getComputedStyle(main).display === "none") return false;
    const journey = d.querySelector("#timberJourney");
    if (journey && !journey.querySelector("[data-tj-add],[data-tj-snapshot-text],[data-tj-record-form],[data-tj-edit],[data-mt-six-weeks]")) return false;
    return ![...d.querySelectorAll('main [aria-busy="true"]')].some((e) => {
      const s = w.getComputedStyle(e), r = e.getBoundingClientRect();
      return s.display !== "none" && s.visibility !== "hidden" && r.width > 0 && r.height > 0;
    });
  };
  const touched = /* @__PURE__ */ new WeakSet();
  document.addEventListener("input", (e) => touched.add(e.target), true);
  document.addEventListener("change", (e) => touched.add(e.target), true);
  const dirty = () => [...document.querySelectorAll("input,textarea,select")].some((e) => touched.has(e) && e.isConnected && (e.type === "checkbox" || e.type === "radio" ? e.checked !== e.defaultChecked : e.value !== e.defaultValue));
  window.MT_SCREEN = { ready: () => ready(window), validate: revalidate, pending: () => pendingReads.size, dirty, hide: () => {
    document.documentElement.dataset.mtScreenLocked = "1";
  }, show: () => {
    delete document.documentElement.dataset.mtScreenLocked;
  } };
  if (options.retain === false) {
    document.addEventListener("mt:identity-invalidated", (e) => {
      const wasReady = document.body?.dataset.memberSession === "ready";
      document.documentElement.dataset.mtScreenLocked = "1";
      if (document.body) document.body.dataset.memberSession = "pending";
      if (wasReady && e.detail?.reason !== "background") {
        document.querySelectorAll("main").forEach((n) => n.replaceChildren());
        location.reload();
      }
    });
    document.addEventListener("visibilitychange", (e) => {
      e.stopImmediatePropagation();
      if (document.hidden) wipe("background");
      else (async () => {
        try {
          await verified(true);
          if (!await revalidate()) {
            location.reload();
            return;
          }
          await window.SST_MEMBER_SESSION?.check();
          delete document.documentElement.dataset.mtScreenLocked;
        } catch {
          location.reload();
        }
      })();
    }, true);
    return;
  }
  if (parentApp) {
    document.addEventListener("visibilitychange", (e) => {
      e.stopImmediatePropagation();
      if (document.hidden) window.MT_SCREEN.hide();
    }, true);
    document.documentElement.dataset.mtContainedScreen = "1";
    document.addEventListener("click", (event) => {
      const a = event.target.closest?.("a[href]");
      if (!a || event.defaultPrevented || event.button > 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || a.target === "_blank" || a.hasAttribute("download")) return;
      const u = endpoint(a.href);
      if (u && screenPath(u)) {
        event.preventDefault();
        event.stopImmediatePropagation();
        parentApp.navigate(u.href);
      } else if (u && ["https:", "http:"].includes(u.protocol)) {
        event.preventDefault();
        event.stopImmediatePropagation();
        if (u.origin === location.origin) {
          if (["/shop", "/shop.html"].includes(u.pathname)) u.pathname = "/member/life-back/shop/kit";
          else if (u.pathname === "/shift-health/supplements-nutrition") u.pathname = "/member/life-back/shop/nutrition";
          else if (u.pathname === "/shift-health/testing" || /^\/shift-health\/testing\/[a-z0-9-]{1,70}$/.test(u.pathname)) u.pathname = "/member/life-back/shop/testing" + u.pathname.slice("/shift-health/testing".length);
        }
        parent.location.assign(u.href);
      }
    }, true);
    for (const method of ["pushState", "replaceState"]) {
      const original = history[method].bind(history);
      history[method] = function(...args) {
        const result = original(...args);
        parentApp.reflect?.(window, location.href);
        return result;
      };
    }
    addEventListener("hashchange", () => parentApp.reflect?.(window, location.href));
    document.addEventListener("sst:account-changed", () => parentApp.invalidate("account-event", true));
    document.addEventListener("mt:identity-invalidated", () => {
      document.documentElement.dataset.mtScreenLocked = "1";
    });
    return;
  }
  const initial = new URL(location.href), frames = /* @__PURE__ */ new Map(), samples = [];
  let active = null, navigation = 0, internalRoute = false;
  const key = (u) => {
    const v = new URL(u);
    if (v.searchParams.get("view") === "app") v.searchParams.delete("view");
    if (v.pathname === "/member/dashboard" && ["support", "stuff"].includes(v.searchParams.get("timber"))) v.searchParams.delete("timber");
    return v.pathname + v.search;
  }, rootKey = key(initial);
  function tab(u) {
    if (u.pathname.startsWith("/member/life-back/shop")) return "shop";
    if (u.pathname.startsWith("/member/life-back/journey")) return "journey";
    if (u.pathname === "/member/grub") return "grub";
    if (u.pathname === "/member/fit") return "fit";
    return u.searchParams.get("timber") === "support" ? "support" : u.searchParams.get("timber") === "stuff" || /settings|orders|plans|saved|my-shift/.test(u.pathname) ? "more" : "today";
  }
  function select(u) {
    document.querySelectorAll("#mtShopChrome [data-mt-shop-tab]").forEach((a) => {
      if (a.dataset.mtShopTab === tab(u)) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
  }
  function status(text) {
    let n = document.getElementById("mtNavigationStatus");
    if (!n) {
      n = document.createElement("p");
      n.id = "mtNavigationStatus";
      n.setAttribute("role", "status");
      document.body.append(n);
    }
    n.textContent = text;
    n.hidden = !text;
  }
  function lock() {
    document.documentElement.dataset.mtScreenLocked = "1";
    for (const { frame } of frames.values()) {
      frame.style.visibility = "hidden";
      try {
        frame.contentWindow.MT_SCREEN?.hide();
      } catch {
      }
    }
  }
  function discard() {
    ++navigation;
    for (const { frame } of frames.values()) frame.remove();
    frames.clear();
    active = null;
    lock();
    document.dispatchEvent(new Event("sst:member-basket-clear"));
  }
  function invalidate(reason, broadcast = false) {
    wipe(reason, broadcast);
  }
  function fail() {
    discard();
    document.body.dataset.memberSession = "pending";
    document.querySelectorAll("main").forEach((n) => n.replaceChildren());
    location.reload();
  }
  function windowOf(entry) {
    return entry ? entry.frame.contentWindow : window;
  }
  async function waitUsable(entry, ticket) {
    const w = windowOf(entry), deadline = performance.now() + 2e4;
    while (performance.now() < deadline) {
      if (ticket !== navigation) throw Error("Navigation superseded");
      if (w.document?.body?.dataset.memberSession === "signed-out") throw Error("Sign-in required");
      if (ready(w) && w.MT_SCREEN?.pending() === 0) {
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
        if (ready(w) && w.MT_SCREEN?.pending() === 0) return;
      }
      await new Promise((r) => setTimeout(r, 20));
    }
    throw Error("This screen has not finished loading");
  }
  function finish(entry, u) {
    for (const e of frames.values()) e.frame.style.visibility = e === entry ? "visible" : "hidden";
    if (entry) {
      entry.frame.hidden = false;
      entry.frame.inert = false;
      entry.frame.contentWindow.MT_SCREEN?.show();
    }
    active = entry;
    delete document.documentElement.dataset.mtScreenLocked;
    document.documentElement.toggleAttribute("data-mt-overlay-screen", !!entry);
    select(u);
    status("");
    document.title = entry?.frame.contentDocument?.title || document.title;
  }
  async function navigate(href, options2 = {}) {
    const u = endpoint(href);
    if (!u || !screenPath(u)) return false;
    const ticket = ++navigation, t = performance.now(), row = { path: u.pathname + u.search, ackMs: 0, warm: false };
    status("Opening " + ({ today: "Today", journey: "Journey", shop: "Shop", grub: "Grub", fit: "Fit", support: "Support", more: "More" }[tab(u)] || "My Timber") + "\u2026");
    document.querySelector("#mtShopChrome")?.setAttribute("aria-busy", "true");
    row.ackMs = Math.round(performance.now() - t);
    document.dispatchEvent(new CustomEvent("mt:screen-start", { detail: { row, started: t } }));
    try {
      const identityStart = performance.now();
      await verified(true);
      row.identityMs = Math.round(performance.now() - identityStart);
      if (ticket !== navigation) return;
      let entry = frames.get(key(u));
      if (key(u) === rootKey && !document.documentElement.hasAttribute("data-mt-root-stale")) entry = null;
      else if (!entry) {
        const frame = document.createElement("iframe");
        frame.className = "mt-retained-screen";
        frame.title = ({ journey: "Journey", shop: "Shop", grub: "Grub", fit: "Fit" }[tab(u)] || "My Timber") + " screen";
        frame.setAttribute("aria-label", frame.title);
        frame.style.visibility = "hidden";
        frame.src = u.href;
        document.body.append(frame);
        entry = { frame, url: u.href, loaded: false };
        frames.set(key(u), entry);
      }
      row.warm = entry ? entry.loaded : true;
      const w = windowOf(entry), dataStart = performance.now();
      if (row.warm) {
        const unchanged = await w.MT_SCREEN.validate();
        if (!unchanged) {
          if (w.MT_SCREEN.dirty()) throw Error("Your draft is still here. Saved information has changed; finish or cancel the draft before reloading");
          if (entry) {
            entry.loaded = false;
            entry.frame.src = u.href;
            await new Promise((r) => setTimeout(r, 0));
          } else {
            document.documentElement.dataset.mtRootStale = "1";
            return navigate(href, options2);
          }
        }
      }
      await waitUsable(entry, ticket);
      if (ticket !== navigation) return;
      row.dataAndScreenMs = Math.round(performance.now() - dataStart);
      if (!options2.history) history.pushState({ mtRetained: true }, "", u.pathname + u.search + u.hash);
      if (!entry && u.hash !== initial.hash) {
        history.replaceState(history.state, "", u.pathname + u.search + u.hash);
        dispatchEvent(new Event("hashchange"));
      }
      if (entry && u.hash && entry.frame.contentWindow.location.hash !== u.hash) entry.frame.contentWindow.location.hash = u.hash;
      finish(entry, u);
      if (!entry) {
        internalRoute = true;
        if (window.MT_MEMBER_ROUTE_REFRESH) window.MT_MEMBER_ROUTE_REFRESH();
        else dispatchEvent(new PopStateEvent("popstate"));
        internalRoute = false;
      }
      if (entry) entry.loaded = true;
      row.usableMs = Math.round(performance.now() - t);
      row.pass = true;
      samples.push(row);
      document.dispatchEvent(new CustomEvent("mt:screen-usable", { detail: row }));
    } catch (e) {
      if (ticket !== navigation) return;
      row.error = e.message;
      samples.push(row);
      if (!identity) fail();
      else status(e.message + ". Your saved information has not changed.");
    } finally {
      if (ticket === navigation) document.querySelector("#mtShopChrome")?.removeAttribute("aria-busy");
    }
    return true;
  }
  window.MT_PERFORMANCE = { identity: verified, identityOrigin: verifiedOrigin, invalidate, navigate, samples, reflect: (source, href) => {
    const u = endpoint(href);
    if (active && source === active.frame.contentWindow && u && screenPath(u)) {
      history.replaceState(history.state, "", u.pathname + u.search + u.hash);
      select(u);
    }
  }, current: () => active?.frame.contentWindow || window };
  document.addEventListener("mt:identity-invalidated", (e) => {
    if (e.detail?.reason === "background") {
      ++navigation;
      lock();
      return;
    }
    const wasReady = document.body?.dataset.memberSession === "ready";
    discard();
    document.body && (document.body.dataset.memberSession = "pending");
    if (wasReady) {
      document.querySelectorAll("main").forEach((n) => n.replaceChildren());
      location.reload();
    }
  });
  document.addEventListener("sst:account-changed", () => {
    invalidate("account-event", true);
    window.SST_MEMBER_SESSION?.check();
  });
  document.addEventListener("click", (event) => {
    const a = event.target.closest?.("a[href]");
    if (!a || event.defaultPrevented || event.button > 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || a.target === "_blank" || a.hasAttribute("download")) return;
    const u = endpoint(a.href);
    if (!u || !screenPath(u) || !document.body?.hasAttribute("data-mt-shop-navigation")) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    navigate(u.href);
  }, true);
  addEventListener("popstate", () => {
    if (internalRoute) return;
    const u = new URL(location.href);
    if (u.pathname === initial.pathname && !active) {
      select(u);
      return;
    }
    navigate(u.href, { history: true });
  });
  document.addEventListener("visibilitychange", (event) => {
    event.stopImmediatePropagation();
    if (document.hidden) {
      lock();
      wipe("background");
    } else {
      (async () => {
        try {
          await verified(true);
          if (active) {
            const same = await active.frame.contentWindow.MT_SCREEN.validate();
            if (!same) {
              await navigate(location.href, { history: true });
              return;
            }
          } else if (!await window.MT_SCREEN.validate()) {
            document.documentElement.dataset.mtRootStale = "1";
            await navigate(location.href, { history: true });
            return;
          }
          window.SST_MEMBER_SESSION?.check();
          finish(active, new URL(location.href));
        } catch {
          fail();
        }
      })();
    }
  }, true);
  addEventListener("pagehide", () => {
    discard();
    wipe("pagehide");
  });
  addEventListener("pageshow", (event) => {
    if (event.persisted) fail();
  });
  const observe = () => {
    if (!document.body) return;
    new MutationObserver(() => {
      if (document.body.dataset.accountDeleted === "1") invalidate("deleted", true);
      if (["signed-out", "error"].includes(document.body.dataset.memberSession)) delete document.documentElement.dataset.mtScreenLocked;
      const c = document.getElementById("mtShopChrome");
      if (c) {
        c.style.zIndex = "2200";
        select(new URL(location.href));
      }
    }).observe(document.body, { childList: true, attributes: true, attributeFilter: ["data-account-deleted", "data-member-session"] });
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", observe, { once: true });
  else observe();
}
var performanceRuntime = "(" + memberPerformanceClient.toString() + ")();";
var performanceStyles = "\nhtml[data-mt-contained-screen] :is(#mtShopChrome,#mtShopPending,#mtShopLoading){visibility:hidden!important;pointer-events:none!important}\nhtml[data-mt-contained-screen] :is(header.site-header,#sst-header-c,#sst-footer-c,.site-footer,#todayBrand,.tj-brand,.mt-support-brand,#mtSixNav,#appBottomNav,nav.sst-member-tabs){display:none!important}\nhtml[data-mt-screen-locked] main,html[data-mt-screen-locked] .mt-retained-screen{visibility:hidden!important;pointer-events:none!important}\nhtml[data-mt-overlay-screen] body>main{visibility:hidden!important;pointer-events:none!important}\n.mt-retained-screen{position:fixed!important;inset:0!important;width:100%!important;height:100dvh!important;border:0!important;margin:0!important;background:#050505!important;z-index:2000!important}\n#mtShopChrome{position:relative;z-index:2200!important}\n#mtNavigationStatus{position:fixed;top:calc(108px + env(safe-area-inset-top));left:0;right:0;margin:0;padding:10px 16px;z-index:2150;background:#050505;color:#E7E3DA;font:14px/1.4 Arial,sans-serif}\n#mtNavigationStatus[hidden]{display:none!important}\n#mtShopChrome[aria-busy=true] a:active{background:#707762}\n";
var identityOnlyRuntime = "(" + memberPerformanceClient.toString() + ")({retain:false});";

// scoped-source/member-experience/performance-monitor.mjs
var performanceMetricsPath = "/v1/life-back/performance-metrics";
var screens = /* @__PURE__ */ new Set(["today", "journey", "shop", "grub", "fit", "support", "more"]);
var keys = /* @__PURE__ */ new Set(["screen", "visit", "usableMs", "serverMs", "ackMs", "accountMs", "dataMs", "outcome"]);
var readySchemas = /* @__PURE__ */ new WeakMap();
var schema = [
  "CREATE TABLE IF NOT EXISTS my_timber_performance_buckets (hour TEXT NOT NULL,screen TEXT NOT NULL,visit TEXT NOT NULL,metric TEXT NOT NULL,bucket_ms INTEGER NOT NULL,n INTEGER NOT NULL DEFAULT 0,PRIMARY KEY(hour,screen,visit,metric,bucket_ms))",
  "CREATE TABLE IF NOT EXISTS my_timber_performance_alerts (hour TEXT NOT NULL,screen TEXT NOT NULL,visit TEXT NOT NULL,reason TEXT NOT NULL,median_ms INTEGER,samples INTEGER NOT NULL,PRIMARY KEY(hour,screen,visit,reason))"
];
async function ensure(db) {
  if (!readySchemas.has(db)) readySchemas.set(db, (async () => {
    for (const sql of schema) await db.prepare(sql).run();
  })().catch((e) => {
    readySchemas.delete(db);
    throw e;
  }));
  return readySchemas.get(db);
}
var reply = (status, data) => new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store, private", "X-Content-Type-Options": "nosniff" } });
async function bounded(request) {
  const reader = request.body?.getReader();
  if (!reader) throw Error("body");
  const chunks = [];
  let n = 0;
  try {
    for (; ; ) {
      const r = await reader.read();
      if (r.done) break;
      n += r.value.byteLength;
      if (n > 1024) {
        await reader.cancel();
        throw Error("size");
      }
      chunks.push(r.value);
    }
    const all = new Uint8Array(n);
    let at = 0;
    for (const c of chunks) {
      all.set(c, at);
      at += c.length;
    }
    return JSON.parse(new TextDecoder().decode(all));
  } finally {
    reader.releaseLock();
  }
}
async function performanceMetricsRoute(request, env) {
  if (new URL(request.url).pathname !== performanceMetricsPath) return null;
  if (request.method !== "POST") return reply(405, { error: "method_not_allowed" });
  const origin = request.headers.get("Origin");
  if (!["https://shiftsometimber.co.uk", "https://www.shiftsometimber.co.uk"].includes(origin)) return reply(403, { error: "origin_not_allowed" });
  if (!(request.headers.get("Content-Type") || "").startsWith("application/json")) return reply(415, { error: "json_required" });
  let body;
  try {
    body = await bounded(request);
  } catch {
    return reply(400, { error: "invalid_metrics" });
  }
  if (!body || typeof body !== "object" || Array.isArray(body) || Object.keys(body).some((k) => !keys.has(k)) || !screens.has(body.screen) || !["fresh", "warm"].includes(body.visit) || !["usable", "timeout"].includes(body.outcome) || !Number.isInteger(body.usableMs) || body.usableMs < 0 || body.usableMs > 12e4) return reply(400, { error: "invalid_metrics" });
  for (const k of ["serverMs", "ackMs", "accountMs", "dataMs"]) if (body[k] !== void 0 && (!Number.isInteger(body[k]) || body[k] < 0 || body[k] > 12e4)) return reply(400, { error: "invalid_metrics" });
  try {
    await ensure(env.DB);
    const now = /* @__PURE__ */ new Date(), hour = now.toISOString().slice(0, 13) + ":00:00.000Z", since = new Date(now.getTime() - 864e5).toISOString(), until = now.toISOString();
    for (const metric of ["usableMs", "serverMs", "ackMs", "accountMs", "dataMs"]) {
      if (body[metric] === void 0) continue;
      const name = body.outcome === "timeout" && metric === "usableMs" ? "timeoutMs" : metric, bucket = Math.ceil(body[metric] / 25) * 25;
      await env.DB.prepare("INSERT INTO my_timber_performance_buckets(hour,screen,visit,metric,bucket_ms,n) VALUES(?,?,?,?,?,1) ON CONFLICT(hour,screen,visit,metric,bucket_ms) DO UPDATE SET n=n+1").bind(hour, body.screen, body.visit, name, bucket).run();
    }
    const rows = (await env.DB.prepare("SELECT bucket_ms,SUM(n) n FROM my_timber_performance_buckets WHERE hour>=? AND hour<=? AND screen=? AND visit=? AND metric=? GROUP BY bucket_ms ORDER BY bucket_ms").bind(since, until, body.screen, body.visit, "usableMs").all()).results || [], count = rows.reduce((n, r) => n + Number(r.n), 0);
    let median = 0, at = 0;
    for (const r of rows) {
      at += Number(r.n);
      if (at >= Math.ceil(count / 2)) {
        median = Number(r.bucket_ms);
        break;
      }
    }
    const limit = body.visit === "fresh" ? 2e3 : 500, reason = body.outcome === "timeout" ? "screen_timeout" : count >= 20 && median > limit ? "median_budget_exceeded" : null;
    if (reason) {
      const saved = await env.DB.prepare("INSERT OR IGNORE INTO my_timber_performance_alerts(hour,screen,visit,reason,median_ms,samples) VALUES(?,?,?,?,?,?)").bind(hour, body.screen, body.visit, reason, median, count).run();
      if (saved.meta?.changes) console.warn("MY_TIMBER_PERFORMANCE_BUDGET_ALERT", JSON.stringify({ screen: body.screen, visit: body.visit, reason, medianMs: median, samples: count, limitMs: limit }));
    }
    if (Math.random() < 0.02) {
      const cutoff = new Date(now.getTime() - 7 * 864e5).toISOString();
      await env.DB.prepare("DELETE FROM my_timber_performance_buckets WHERE hour<?").bind(cutoff).run();
      await env.DB.prepare("DELETE FROM my_timber_performance_alerts WHERE hour<?").bind(cutoff).run();
    }
    return reply(202, { accepted: true, budgetAlert: !!reason });
  } catch {
    return reply(503, { error: "metrics_unavailable" });
  }
}
function realUserPerformanceClient() {
  if (parent !== window || window.__MT_PERF_TEST__ || window.__mtPerformanceMonitoring) return;
  window.__mtPerformanceMonitoring = true;
  let measurement = 0;
  const visited = /* @__PURE__ */ new Set(), screen = (path) => {
    const u = new URL(path, location.origin);
    if (u.pathname === "/member/dashboard") return u.searchParams.get("timber") === "support" ? "support" : u.searchParams.get("timber") === "stuff" ? "more" : "today";
    if (u.pathname === "/member/life-back/journey") return "journey";
    if (u.pathname === "/member/life-back/shop") return "shop";
    return { "/member/grub": "grub", "/member/fit": "fit" }[u.pathname] || null;
  };
  function allowed() {
    try {
      return window.SSTConsent?.get()?.analytics === true;
    } catch {
      return false;
    }
  }
  function usable(name) {
    const w = window.MT_PERFORMANCE?.current() || window, d = w.document, b = d.body;
    if (!b || b.dataset.memberSession !== "ready" || !b.hasAttribute("data-mt-shop-navigation") || w.MT_SCREEN?.pending() > 0) return false;
    const visible = (e) => {
      if (!e) return false;
      const s = w.getComputedStyle(e), r = e.getBoundingClientRect();
      return s.visibility !== "hidden" && s.display !== "none" && r.width > 0 && r.height > 0;
    };
    if (!visible(d.querySelector("main"))) return false;
    if (name === "journey") return visible(d.querySelector("[data-tj-add],[data-tj-record-form],[data-tj-snapshot-text]"));
    if (name === "shop") return visible(d.querySelector(".mt-shop-category"));
    if (name === "support" || name === "more") return visible(d.querySelector("#mtUtility"));
    return [...d.querySelectorAll("main button,main input,main a[href]")].some(visible);
  }
  function transmit(body) {
    if (!allowed()) return;
    fetch("/v1/life-back/performance-metrics", { method: "POST", credentials: "omit", referrerPolicy: "no-referrer", cache: "no-store", keepalive: true, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then((r) => r.ok ? r.json() : null).then((r) => {
      if (r?.budgetAlert) {
        console.warn("My Timber performance budget alert", body.screen, body.visit);
        dispatchEvent(new CustomEvent("sst:performance-budget-alert", { detail: { screen: body.screen, visit: body.visit } }));
      }
    }).catch(() => {
    });
  }
  function measure(path, started, source = {}) {
    const name = screen(path);
    if (!name) return;
    const token = ++measurement;
    const visit = visited.has(name) ? "warm" : "fresh", deadline = performance.now() + 2e4;
    let stable = 0;
    const tick = () => {
      if (token !== measurement || document.hidden || ["signed-out", "error"].includes(document.body?.dataset.memberSession)) return;
      if (screen(location.href) === name && !document.querySelector("#mtShopChrome[aria-busy=true]") && usable(name)) {
        if (++stable < 2) {
          requestAnimationFrame(tick);
          return;
        }
        const w = window.MT_PERFORMANCE?.current() || window, n = w.performance.getEntriesByType("navigation")[0], body = { screen: name, visit, outcome: "usable", usableMs: Math.min(12e4, Math.round(performance.now() - started)) };
        if (n && visit === "fresh") body.serverMs = Math.max(0, Math.round(n.responseStart - n.requestStart));
        for (const [from, to] of [["ackMs", "ackMs"], ["identityMs", "accountMs"], ["dataAndScreenMs", "dataMs"]]) if (Number.isFinite(source[from])) body[to] = Math.max(0, Math.min(12e4, Math.round(source[from])));
        visited.add(name);
        transmit(body);
        return;
      }
      stable = 0;
      if (performance.now() > deadline) {
        transmit({ screen: name, visit, outcome: "timeout", usableMs: 2e4 });
        return;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
  document.addEventListener("mt:screen-start", (e) => measure(e.detail.row.path, e.detail.started, e.detail.row));
  let initial = false;
  const boot = () => {
    if (initial || !document.body) return;
    initial = true;
    measure(location.href, 0);
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
}
var performanceMonitorRuntime = "(" + realUserPerformanceClient.toString() + ")();";

// scoped-source/member-experience/performance-delivery.mjs
async function performanceDocumentText(response) {
  let body = new Uint8Array(await response.arrayBuffer());
  for (let depth = 0; depth < 2 && body[0] === 31 && body[1] === 139; depth++) body = new Uint8Array(await new Response(new Blob([body]).stream().pipeThrough(new DecompressionStream("gzip"))).arrayBuffer());
  const text = new TextDecoder("utf-8", { fatal: true }).decode(body);
  if (!/<!doctype html>/i.test(text)) throw Error("Member document is not decoded HTML");
  return text;
}
function augmentPerformanceDocument(html, assets = {}, stage = "cache") {
  if (stage === "server") return html;
  if (html.includes('data-mt-performance="20261101"')) return html;
  const boot = '<style data-mt-performance="20261101">' + performanceStyles + "</style><script>" + (stage === "identity" ? identityOnlyRuntime : performanceRuntime) + (stage === "cache" ? performanceMonitorRuntime : "") + "<\/script>";
  html = html.replace(/<head\b[^>]*>/i, (m) => m + boot);
  const seen = /* @__PURE__ */ new Set();
  return html.replace(/<(script|link)\b[^>]*(?:src|href)=["']([^"']+)["'][^>]*>(?:\s*<\/script>)?/gi, (tag, type, href) => {
    const path = href.split("?")[0], asset = assets[path];
    if (path === "/assets/member-shell-v6.js") {
      if (seen.has(path)) return "";
      seen.add(path);
    }
    if (!asset || asset.variants && !asset.variants.includes(href.replaceAll("&amp;", "&"))) return tag;
    const target = asset.servedPath || href;
    return tag.replace(href, target + (target.includes("?") ? "&amp;" : "?") + "mtv=" + asset.sha256.slice(0, 20));
  });
}
function wrapMemberPerformance(original, templates, assets, kind) {
  const finite = /^\/member\/(?:dashboard|grub|fit|orders|saved|plans|settings|check-in|my-shift|my-target|my-why|achievements|ask-timber|treatment|life-back(?:\/.*)?)$/;
  return { ...original, async fetch(request, env, ctx) {
    const u = new URL(request.url), stage = request.headers.get("X-My-Timber-Performance-Stage") || "cache", experimental = ["server", "identity", "retained"].includes(stage), read = ["GET", "HEAD"].includes(request.method);
    const enabled = kind === "documents" ? env.MY_TIMBER_V6_RELEASE_ENABLED === "true" : env.MEMBER_EXPERIENCE_V1_ENABLED === "true";
    if (enabled && kind === "programme" && u.pathname === performanceMetricsPath) return performanceMetricsRoute(request, env);
    if (enabled && read && u.pathname === "/v1/life-back/journey") {
      const r = await original.fetch(request, env, ctx), h2 = new Headers(r.headers);
      h2.set("Cache-Control", "no-store, private");
      if (!/\bcookie\b/i.test(h2.get("Vary") || "")) h2.append("Vary", "Cookie");
      return new Response(r.body, { status: r.status, statusText: r.statusText, headers: h2, encodeBody: "manual" });
    }
    if (!enabled || !read) return original.fetch(request, env, ctx);
    const asset = assets[u.pathname];
    if (asset && asset.owner === kind && (u.searchParams.get("mtv") === asset.sha256.slice(0, 20) || experimental && u.pathname === "/assets/member-experience/programme-shop-navigation.mjs") && (!experimental || u.pathname === "/assets/member-experience/programme-shop-navigation.mjs" && stage !== "server")) {
      const versioned = u.searchParams.get("mtv") === asset.sha256.slice(0, 20), headers = { "Content-Type": asset.type, "Cache-Control": experimental ? "no-store" : versioned ? "public, max-age=31536000, immutable" : "public, max-age=0, must-revalidate", "ETag": '"' + asset.sha256 + '"', "X-Content-Type-Options": "nosniff", "X-My-Timber-Performance": "20261101", "Server-Timing": "mt-static;dur=0" };
      if (request.headers.get("If-None-Match") === headers.ETag) return new Response(null, { status: 304, headers });
      return new Response(request.method === "HEAD" ? null : asset.body, { headers });
    }
    if (kind === "core" || request.method !== "GET" || !finite.test(u.pathname)) return original.fetch(request, env, ctx);
    const t = performance.now(), key = u.pathname + u.search, template = templates[key], upstream = [];
    let response;
    if (request.method === "GET" && template && template.owner === kind && request.headers.get("X-My-Timber-Profile-Original") !== "1") {
      response = new Response(template.html, { status: 200, headers: template.headers });
    } else {
      const timed = { ...env };
      for (const k of ["CORE", "SUPPORT"]) if (env[k]?.fetch) timed[k] = { fetch: async (...args) => {
        const a = performance.now(), r = await env[k].fetch(...args);
        upstream.push({ name: k.toLowerCase(), ms: performance.now() - a });
        return r;
      } };
      const upstreamHeaders = new Headers(request.headers);
      upstreamHeaders.set("Accept-Encoding", "identity");
      response = await original.fetch(new Request(request, { headers: upstreamHeaders }), timed, ctx);
    }
    if (request.method !== "GET" || !finite.test(u.pathname) || !response.ok || !response.headers.get("Content-Type")?.includes("text/html")) return response;
    const fetchMs = performance.now() - t, renderAt = performance.now(), html = augmentPerformanceDocument(await performanceDocumentText(response), experimental ? {} : assets, stage), h = new Headers(response.headers);
    for (const k of ["Content-Length", "Content-Encoding", "ETag", "Last-Modified"]) h.delete(k);
    h.set("Cache-Control", "no-store, private");
    h.append("Vary", "Cookie");
    h.set("X-My-Timber-Performance", "20261101");
    h.append("Server-Timing", "mt-document;dur=" + fetchMs.toFixed(1) + ", mt-inject;dur=" + (performance.now() - renderAt).toFixed(1) + (upstream.length ? ", " + upstream.map((x) => "mt-" + x.name + ";dur=" + x.ms.toFixed(1)).join(", ") : ""));
    return new Response(html, { status: response.status, statusText: response.statusText, headers: h });
  } };
}
export {
  augmentPerformanceDocument,
  performanceDocumentText,
  wrapMemberPerformance
};
