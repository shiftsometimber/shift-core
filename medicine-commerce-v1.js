const ALLOWED_ORIGINS = new Set([
  "https://shiftsometimber.co.uk",
  "https://www.shiftsometimber.co.uk",
]);
const CURRENCY = "gbp";
const DELIVERY_PENCE = 0;

const clean = (value, max = 300) =>
  String(value ?? "")
    .trim()
    .slice(0, max);
const now = () => new Date().toISOString();
const json = (body, status = 200, headers = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
      ...headers,
    },
  });
function cors(request) {
  const origin = request.headers.get("Origin") || "";
  return ALLOWED_ORIGINS.has(origin)
    ? {
        "access-control-allow-origin": origin,
        "access-control-allow-credentials": "true",
        "access-control-allow-methods": "GET, POST, OPTIONS",
        "access-control-allow-headers": "Content-Type",
        vary: "Origin",
      }
    : {};
}
function siteUrl(env) {
  return String(env.PUBLIC_SITE_URL || "https://shiftsometimber.co.uk").replace(
    /\/$/,
    "",
  );
}
function sessionTokens(request) {
  const tokens = [];
  for (const match of (request.headers.get("Cookie") || "").matchAll(
    /(?:^|;\s*)sst_session=([^;]+)/g,
  )) {
    try {
      const token = decodeURIComponent(match[1]);
      if (token && !tokens.includes(token)) tokens.push(token);
    } catch {}
  }
  return tokens.slice(0, 4);
}
async function sha256(value) {
  const bytes = new Uint8Array(
    await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(String(value)),
    ),
  );
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
async function member(request, env) {
  for (const token of sessionTokens(request)) {
    const row = await env.DB.prepare(
      `SELECT u.id,u.email,u.first_name,u.last_name,a.email_verified,s.expires_at,s.revoked_at FROM user_sessions s JOIN users u ON u.id=s.user_id LEFT JOIN user_auth a ON a.user_id=u.id WHERE s.token_hash=?`,
    )
      .bind(await sha256(token))
      .first();
    if (
      row &&
      !row.revoked_at &&
      Date.parse(row.expires_at) > Date.now()
    )
      return row;
  }
  return null;
}
async function body(request) {
  const text = await request.text();
  if (new TextEncoder().encode(text).length > 8192) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
function orderNumber() {
  return `SST-MED-${crypto.randomUUID().replaceAll("-", "").slice(0, 12).toUpperCase()}`;
}
function hex(value) {
  return /^[a-f0-9]{64}$/i.test(value)
    ? Uint8Array.from(value.match(/.{2}/g), (x) => Number.parseInt(x, 16))
    : null;
}
function equal(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  let different = 0;
  for (let i = 0; i < a.length; i++) different |= a[i] ^ b[i];
  return different === 0;
}
async function validSignature(payload, header, secret) {
  const parts = String(header || "")
      .split(",")
      .map((x) => x.split("=", 2)),
    timestamp = Number(parts.find(([k]) => k === "t")?.[1] || 0),
    signatures = parts
      .filter(([k]) => k === "v1")
      .map(([, v]) => hex(v))
      .filter(Boolean);
  if (
    !timestamp ||
    Math.abs(Math.floor(Date.now() / 1000) - timestamp) > 300 ||
    !signatures.length
  )
    return false;
  const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    ),
    expected = new Uint8Array(
      await crypto.subtle.sign(
        "HMAC",
        key,
        new TextEncoder().encode(`${timestamp}.${payload}`),
      ),
    );
  return signatures.some((x) => equal(x, expected));
}

async function schema(env) {
  await env.DB.batch([
    env.DB.prepare(
      `CREATE TABLE IF NOT EXISTS medicine_inventory (variant_id INTEGER PRIMARY KEY,stock_on_hand INTEGER NOT NULL DEFAULT 0,reserved INTEGER NOT NULL DEFAULT 0,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(variant_id) REFERENCES medicine_variants(id))`,
    ),
    env.DB.prepare(
      `CREATE TABLE IF NOT EXISTS medicine_orders (id INTEGER PRIMARY KEY AUTOINCREMENT,order_number TEXT NOT NULL UNIQUE,user_id INTEGER NOT NULL,email TEXT NOT NULL,medicine_id INTEGER NOT NULL,variant_id INTEGER NOT NULL,medicine_name TEXT NOT NULL,strength_label TEXT NOT NULL,unit_price_pence INTEGER NOT NULL,discount_code TEXT,discount_pence INTEGER NOT NULL DEFAULT 0,total_pence INTEGER NOT NULL,currency TEXT NOT NULL DEFAULT 'GBP',status TEXT NOT NULL DEFAULT 'pending',stripe_checkout_session_id TEXT UNIQUE,stripe_payment_intent_id TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
    ),
    env.DB.prepare(
      `CREATE TABLE IF NOT EXISTS medicine_stripe_events (stripe_event_id TEXT PRIMARY KEY,event_type TEXT NOT NULL,received_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,processed_at TEXT,processing_error TEXT)`,
    ),
  ]);
  await env.DB.prepare(`ALTER TABLE medicine_orders ADD COLUMN stripe_error_json TEXT`).run().catch(()=>{});
}

async function catalogue(env) {
  await schema(env);
  const rows =
    (
      await env.DB.prepare(
        `SELECT m.id medicine_id,m.name,m.active_ingredient,m.form,m.description,m.status medicine_status,v.id variant_id,v.strength_label,v.selling_price_pence,v.status variant_status,COALESCE(i.stock_on_hand,0) stock_on_hand,COALESCE(i.reserved,0) reserved FROM medicine_products m JOIN medicine_variants v ON v.medicine_id=m.id LEFT JOIN medicine_inventory i ON i.variant_id=v.id WHERE m.status NOT IN ('draft','archived') AND v.status!='archived' ORDER BY m.sort_order,m.name,v.sort_order,v.id`,
      ).all()
    ).results || [];
  const products = [];
  for (const row of rows) {
    const medicineName = String(row.name || "").trim().toLowerCase();
    const originalLabel = String(row.strength_label || "").trim();
    if (
      medicineName === "liraglutide" &&
      /^(?:0\.6|1\.2|3)(?:\s*mg)?$/i.test(originalLabel)
    )
      continue;
    const strengthLabel =
      medicineName === "orlistat" && /^\d+$/.test(originalLabel)
        ? `120 mg · ${originalLabel} capsules`
        : originalLabel;
    let product = products.find((x) => x.id === row.medicine_id);
    if (!product) {
      product = {
        id: row.medicine_id,
        name: row.name,
        activeIngredient: row.active_ingredient,
        form: row.form,
        description: row.description,
        status: row.medicine_status,
        variants: [],
      };
      products.push(product);
    }
    const remaining = Math.max(
      0,
      Number(row.stock_on_hand) - Number(row.reserved),
    );
    const duplicate = product.variants.find(
      (variant) => variant.strengthLabel.toLowerCase() === strengthLabel.toLowerCase(),
    );
    if (duplicate) continue;
    product.variants.push({
      id: row.variant_id,
      strengthLabel,
      pricePence: Number(row.selling_price_pence),
      status:
        remaining > 0 &&
        row.medicine_status === "available" &&
        row.variant_status === "available"
          ? "available"
          : "out_of_stock",
      remaining,
    });
  }
  return products;
}

async function discount(env, code, subtotal) {
  const key = clean(code, 60).toUpperCase();
  if (!key) return { code: "", amount: 0 };
  const row = await env.DB.prepare(
    `SELECT * FROM commerce_discount_codes WHERE upper(code)=? AND active=1`,
  )
    .bind(key)
    .first()
    .catch(() => null);
  const stamp = Date.now();
  if (
    !row ||
    (row.starts_at && Date.parse(row.starts_at) > stamp) ||
    (row.ends_at && Date.parse(row.ends_at) < stamp) ||
    Number(row.minimum_subtotal_pence || 0) > subtotal
  )
    return null;
  const amount =
    row.discount_type === "percent"
      ? Math.floor((subtotal * Math.min(100, Number(row.discount_value))) / 100)
      : Math.min(subtotal, Number(row.discount_value));
  return { code: key, amount: Math.max(0, amount) };
}

function stripeForm(order, item, user, env) {
  const form = new URLSearchParams(),
    put = (k, v) => form.append(k, String(v));
  put("mode", "payment");
  put("managed_payments[enabled]", "false");
  put("payment_method_types[0]", "card");
  put(
    "success_url",
    `${siteUrl(env)}/order-success.html?medicine=1&session_id={CHECKOUT_SESSION_ID}`,
  );
  put("cancel_url", `${siteUrl(env)}/treatment-order?checkout=cancelled`);
  put("client_reference_id", order.orderNumber);
  put("customer_creation", "always");
  put("customer_email", user.email);
  put("billing_address_collection", "required");
  put("metadata[order_number]", order.orderNumber);
  put("metadata[order_type]", "medicine");
  put("metadata[user_id]", user.id);
  put("payment_intent_data[metadata][order_number]", order.orderNumber);
  put("payment_intent_data[metadata][order_type]", "medicine");
  put("line_items[0][price_data][currency]", CURRENCY);
  put("line_items[0][price_data][unit_amount]", order.totalPence);
  put(
    "line_items[0][price_data][product_data][name]",
    `${item.name} ${item.strength_label}`,
  );
  put(
    "line_items[0][price_data][product_data][description]",
    "Shift Some Timber treatment order",
  );
  put("line_items[0][quantity]", "1");
  return form;
}

async function checkout(request, env) {
  const user = await member(request, env);
  if (!user)
    return json(
      {
        ok: false,
        error: "account_required",
        message: "Create or sign in to My Shift before ordering.",
      },
      401,
      cors(request),
    );
  if (Number(user.email_verified || 0) !== 1)
    return json(
      { ok: false, error: "email_verification_required" },
      403,
      cors(request),
    );
  if (!env.STRIPE_SECRET_KEY)
    return json(
      { ok: false, error: "payments_not_configured" },
      503,
      cors(request),
    );
  const mode = String(env.STRIPE_MODE || "test").toLowerCase(),
    key = String(env.STRIPE_SECRET_KEY);
  if (
    (mode === "test" && !key.startsWith("sk_test_")) ||
    (mode === "live" && !key.startsWith("sk_live_"))
  )
    return json(
      { ok: false, error: "stripe_mode_mismatch" },
      503,
      cors(request),
    );
  await schema(env);
  const input = await body(request),
    variantId = Number(input?.variantId);
  if (!Number.isInteger(variantId) || variantId < 1)
    return json({ ok: false, error: "invalid_variant" }, 400, cors(request));
  const item = await env.DB.prepare(
    `SELECT v.id variant_id,v.medicine_id,v.strength_label,v.selling_price_pence,v.status variant_status,m.name,m.status medicine_status,COALESCE(i.stock_on_hand,0) stock_on_hand,COALESCE(i.reserved,0) reserved FROM medicine_variants v JOIN medicine_products m ON m.id=v.medicine_id LEFT JOIN medicine_inventory i ON i.variant_id=v.id WHERE v.id=?`,
  )
    .bind(variantId)
    .first();
  if (
    !item ||
    item.medicine_status !== "available" ||
    item.variant_status !== "available"
  )
    return json(
      { ok: false, error: "out_of_stock", message: "Currently out of stock." },
      409,
      cors(request),
    );
  const held = await env.DB.prepare(
    `UPDATE medicine_inventory SET reserved=reserved+1,updated_at=? WHERE variant_id=? AND stock_on_hand-reserved>0`,
  )
    .bind(now(), variantId)
    .run();
  if (Number(held.meta?.changes || 0) !== 1)
    return json(
      { ok: false, error: "out_of_stock", message: "Currently out of stock." },
      409,
      cors(request),
    );
  const offer = await discount(
    env,
    input?.discountCode,
    Number(item.selling_price_pence),
  );
  if (input?.discountCode && !offer) {
    await env.DB.prepare(
      `UPDATE medicine_inventory SET reserved=MAX(0,reserved-1),updated_at=? WHERE variant_id=?`,
    )
      .bind(now(), variantId)
      .run();
    return json(
      { ok: false, error: "invalid_discount_code" },
      400,
      cors(request),
    );
  }
  const order = {
    orderNumber: orderNumber(),
    totalPence: Number(item.selling_price_pence) - Number(offer?.amount || 0),
  };
  const stamp = now();
  const inserted = await env.DB.prepare(
    `INSERT INTO medicine_orders(order_number,user_id,email,medicine_id,variant_id,medicine_name,strength_label,unit_price_pence,discount_code,discount_pence,total_pence,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)`,
  )
    .bind(
      order.orderNumber,
      user.id,
      user.email,
      item.medicine_id,
      variantId,
      item.name,
      item.strength_label,
      item.selling_price_pence,
      offer?.code || null,
      offer?.amount || 0,
      order.totalPence,
      stamp,
      stamp,
    )
    .run();
  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        authorization: `Bearer ${key}`,
        "content-type": "application/x-www-form-urlencoded",
        "idempotency-key": order.orderNumber,
      },
      body: stripeForm(order, item, user, env),
    }),
    session = await response.json().catch(() => null);
  if (!response.ok || !session?.id || !session?.url) {
    await env.DB.batch([
      env.DB.prepare(
        `UPDATE medicine_inventory SET reserved=MAX(0,reserved-1),updated_at=? WHERE variant_id=?`,
      ).bind(now(), variantId),
      env.DB.prepare(
        `UPDATE medicine_orders SET status='failed',updated_at=? WHERE id=?`,
      ).bind(now(), inserted.meta.last_row_id),
    ]);
    const stripeError={status:response.status,type:clean(session?.error?.type||'unknown',100),code:clean(session?.error?.code||'',100),param:clean(session?.error?.param||'',160),message:clean(session?.error?.message||'Stripe did not create a checkout session.',300),keyMode:key.startsWith('sk_live_')?'live':key.startsWith('sk_test_')?'test':'invalid'};
    console.error('medicine_stripe_checkout_create_failed',{orderNumber:order.orderNumber,...stripeError});
    await env.DB.prepare(`UPDATE medicine_orders SET stripe_error_json=?,updated_at=? WHERE id=?`).bind(JSON.stringify(stripeError),now(),inserted.meta.last_row_id).run().catch(()=>{});
    return json(
      { ok: false, error: "checkout_unavailable",...(mode==='test'?{diagnostic:stripeError}:{}) },
      502,
      cors(request),
    );
  }
  await env.DB.prepare(
    `UPDATE medicine_orders SET stripe_checkout_session_id=?,updated_at=? WHERE id=?`,
  )
    .bind(session.id, now(), inserted.meta.last_row_id)
    .run();
  return json(
    {
      ok: true,
      checkoutUrl: session.url,
      orderNumber: order.orderNumber,
      totalPence: order.totalPence,
    },
    201,
    cors(request),
  );
}

async function webhook(request, env, ctx) {
  const payload = await request.clone().text(),
    event = JSON.parse(payload || "null");
  if (event?.data?.object?.metadata?.order_type !== "medicine") return null;
  if (
    !env.STRIPE_WEBHOOK_SECRET ||
    !(await validSignature(
      payload,
      request.headers.get("stripe-signature"),
      env.STRIPE_WEBHOOK_SECRET,
    ))
  )
    return json({ ok: false, error: "invalid_signature" }, 400);
  await schema(env);
  const inserted = await env.DB.prepare(
    `INSERT OR IGNORE INTO medicine_stripe_events(stripe_event_id,event_type,received_at) VALUES(?,?,?)`,
  )
    .bind(clean(event.id, 200), clean(event.type, 100), now())
    .run();
  if (Number(inserted.meta?.changes || 0) !== 1)
    return json({ ok: true, duplicate: true });
  const session = event.data.object,
    number = clean(
      session.metadata?.order_number || session.client_reference_id,
      80,
    ),
    order = await env.DB.prepare(
      "SELECT * FROM medicine_orders WHERE order_number=?",
    )
      .bind(number)
      .first();
  if (!order) return json({ ok: true, ignored: true });
  try {
    if (
      [
        "checkout.session.completed",
        "checkout.session.async_payment_succeeded",
      ].includes(event.type) &&
      session.payment_status === "paid"
    ) {
      await env.DB.batch([
        env.DB.prepare(
          `UPDATE medicine_orders SET status='paid',stripe_payment_intent_id=?,updated_at=? WHERE id=?`,
        ).bind(clean(session.payment_intent, 200), now(), order.id),
        env.DB.prepare(
          `UPDATE medicine_inventory SET reserved=MAX(0,reserved-1),stock_on_hand=MAX(0,stock_on_hand-1),updated_at=? WHERE variant_id=?`,
        ).bind(now(), order.variant_id),
      ]);
    } else if (
      [
        "checkout.session.expired",
        "checkout.session.async_payment_failed",
        "payment_intent.payment_failed",
      ].includes(event.type)
    ) {
      await env.DB.batch([
        env.DB.prepare(
          `UPDATE medicine_orders SET status='failed',updated_at=? WHERE id=?`,
        ).bind(now(), order.id),
        env.DB.prepare(
          `UPDATE medicine_inventory SET reserved=MAX(0,reserved-1),updated_at=? WHERE variant_id=?`,
        ).bind(now(), order.variant_id),
      ]);
    }
    await env.DB.prepare(
      "UPDATE medicine_stripe_events SET processed_at=? WHERE stripe_event_id=?",
    )
      .bind(now(), event.id)
      .run();
  } catch (error) {
    await env.DB.prepare(
      "UPDATE medicine_stripe_events SET processing_error=? WHERE stripe_event_id=?",
    )
      .bind(clean(error?.message, 1000), event.id)
      .run();
    throw error;
  }
  return json({ ok: true });
}

async function orderStatus(request, env) {
  const id = clean(new URL(request.url).searchParams.get("session_id"), 200);
  if (!/^cs_(test|live)_[A-Za-z0-9_]+$/.test(id))
    return json({ ok: false, error: "invalid_session" }, 400, cors(request));
  await schema(env);
  const order = await env.DB.prepare(
    "SELECT order_number,status FROM medicine_orders WHERE stripe_checkout_session_id=?",
  )
    .bind(id)
    .first();
  return order
    ? json(
        { ok: true, orderNumber: order.order_number, status: order.status },
        200,
        cors(request),
      )
    : json({ ok: false, error: "order_not_found" }, 404, cors(request));
}

export async function medicineCommerceRoutes(request, env, ctx) {
  const path = new URL(request.url).pathname.replace(/\/+$/, "") || "/";
  if (request.method === "OPTIONS" && path === "/v1/commerce/medicine-checkout")
    return new Response(null, { status: 204, headers: cors(request) });
  if (request.method === "GET" && path === "/v1/catalogue/medicines") {
    if (!env.DB) return json({ ok: true, products: [] }, 200, cors(request));
    return json(
      { ok: true, products: await catalogue(env) },
      200,
      cors(request),
    );
  }
  if (request.method === "GET" && path === "/v1/commerce/medicine-order-status")
    return orderStatus(request, env);
  if (request.method === "POST" && path === "/v1/commerce/medicine-checkout")
    return checkout(request, env);
  if (request.method === "POST" && path === "/v1/commerce/stripe/webhook")
    return webhook(request, env, ctx);
  return null;
}
