import hq from "./hq-ai-v2.js";

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });
const clean = (value, max = 500) =>
  String(value ?? "")
    .trim()
    .slice(0, max);
const now = () => new Date().toISOString();
export function calculateMargin(costPence, sellingPence) {
  const cost = Math.max(0, Math.round(Number(costPence) || 0)),
    selling = Math.max(0, Math.round(Number(sellingPence) || 0)),
    marginPence = selling - cost,
    marginPercent = selling
      ? Math.round((marginPence / selling) * 10000) / 100
      : 0;
  return { costPence: cost, sellingPence: selling, marginPence, marginPercent };
}
export function defaultSellingPrice(costPence) {
  const cost = Math.max(0, Math.round(Number(costPence) || 0));
  return Math.ceil(cost / 0.4);
}

async function ensureSchema(DB) {
  await DB.batch([
    DB.prepare(
      `CREATE TABLE IF NOT EXISTS commerce_product_images (product_id INTEGER PRIMARY KEY,mime_type TEXT NOT NULL,image_base64 TEXT NOT NULL,alt_text TEXT NOT NULL,updated_by INTEGER,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
    ),
    DB.prepare(
      `CREATE TABLE IF NOT EXISTS medicine_products (id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL,active_ingredient TEXT NOT NULL,form TEXT NOT NULL CHECK(form IN ('injection','tablet','capsule')),status TEXT NOT NULL DEFAULT 'out_of_stock' CHECK(status IN ('draft','out_of_stock','available','archived')),description TEXT NOT NULL DEFAULT '',sort_order INTEGER NOT NULL DEFAULT 0,created_by INTEGER,updated_by INTEGER,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
    ),
    DB.prepare(
      `CREATE TABLE IF NOT EXISTS medicine_variants (id INTEGER PRIMARY KEY AUTOINCREMENT,medicine_id INTEGER NOT NULL,strength_label TEXT NOT NULL,cost_pence INTEGER NOT NULL DEFAULT 0,selling_price_pence INTEGER NOT NULL DEFAULT 0,status TEXT NOT NULL DEFAULT 'out_of_stock' CHECK(status IN ('out_of_stock','available','archived')),sort_order INTEGER NOT NULL DEFAULT 0,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,UNIQUE(medicine_id,strength_label),FOREIGN KEY(medicine_id) REFERENCES medicine_products(id))`,
    ),
    DB.prepare(
      `CREATE TABLE IF NOT EXISTS medicine_inventory (variant_id INTEGER PRIMARY KEY,stock_on_hand INTEGER NOT NULL DEFAULT 0,reserved INTEGER NOT NULL DEFAULT 0,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(variant_id) REFERENCES medicine_variants(id))`,
    ),
  ]);
  await DB.prepare(`UPDATE medicine_variants SET status='archived',updated_at=CURRENT_TIMESTAMP WHERE medicine_id IN (SELECT id FROM medicine_products WHERE lower(name)='liraglutide') AND trim(lower(strength_label)) IN ('0.6','0.6 mg','1.2','1.2 mg','1.8','2.4','3','3 mg')`).run();
  await DB.prepare(`UPDATE medicine_variants SET status='archived',updated_at=CURRENT_TIMESTAMP WHERE medicine_id IN (SELECT id FROM medicine_products WHERE lower(name)='orlistat') AND trim(lower(strength_label)) IN ('42','84')`).run();
  await DB.prepare(`UPDATE medicine_variants SET strength_label='120 mg · 168 capsules',updated_at=CURRENT_TIMESTAMP WHERE medicine_id IN (SELECT id FROM medicine_products WHERE lower(name)='orlistat') AND trim(lower(strength_label))='168'`).run();
}
async function actor(request, env, ctx) {
  const response = await hq.fetch(
    new Request(new URL("/v1/hq/me", request.url), {
      headers: request.headers,
    }),
    env,
    ctx,
  );
  if (!response.ok) return { response };
  return { user: (await response.json()).user };
}
const canManage = (user) =>
  ["owner", "admin", "operations"].includes(user?.role);
async function audit(env, user, action, type, id, metadata = {}) {
  try {
    await env.DB.prepare(
      "INSERT INTO hq_audit(hq_user_id,action,entity_type,entity_id,metadata,created_at) VALUES(?,?,?,?,?,?)",
    )
      .bind(
        user?.id || null,
        action,
        type,
        String(id || ""),
        JSON.stringify(metadata),
        now(),
      )
      .run();
  } catch {}
}

function portal() {
  return new Response(
    `<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Products & medicines · Shift HQ</title><style>body{margin:0;background:#050505;color:#e7e3da;font:16px/1.5 system-ui}main{max-width:1180px;margin:auto;padding:28px}.panel{border:1px solid #707762;border-radius:16px;padding:20px;margin:18px 0}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px}label{display:grid;gap:5px;font-weight:750}input,select,textarea{box-sizing:border-box;width:100%;padding:11px;border:1px solid #707762;border-radius:8px;background:#e7e3da;color:#050505;font:inherit}button,.button{display:inline-block;border:1px solid #707762;border-radius:9px;padding:11px 15px;background:#707762;color:#050505;font-weight:850;text-decoration:none}.item{padding:16px 0;border-top:1px solid #34372f}.thumb{width:120px;height:120px;object-fit:cover;border:1px solid #707762;background:#111}.muted{color:#adb09f}.saved{color:#b9d58c}</style></head><body><main><p class="muted">SHIFT HQ</p><h1>Products, images & medicines</h1><p><a class="button" href="/hq/commerce-content-controls">Discounts & website edits</a></p><section class="panel"><h2>Product images</h2><p class="muted">Upload JPG, PNG or WebP up to 1.5 MB and supply useful alt text.</p><form id="imageForm" class="grid"><label>Product<select name="productId" id="productSelect" required></select></label><label>Image<input name="image" type="file" accept="image/jpeg,image/png,image/webp" required></label><label>Alt text<input name="altText" required maxlength="180"></label><div><button>Upload image</button></div></form><p id="imageStatus" role="status"></p><div id="productList"></div></section><section class="panel"><h2>Medicine catalogue</h2><p class="muted">Manage medicines, strengths, costs, prices and real stock. A strength is buyable only when both medicine and strength are Available and stock is above zero.</p><form id="medicineForm" class="grid"><label>Name<input name="name" required placeholder="Mounjaro"></label><label>Active ingredient<input name="activeIngredient" required placeholder="tirzepatide"></label><label>Form<select name="form"><option value="injection">Injection</option><option value="tablet">Tablet</option><option value="capsule">Capsule</option></select></label><label>Status<select name="status"><option value="out_of_stock">Out of stock</option><option value="draft">Draft</option><option value="available">Available</option></select></label><label>Description<textarea name="description"></textarea></label><div><button>Add medicine</button></div></form><p id="medicineStatus" role="status"></p><div id="medicineList"></div></section></main><script>const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));const sel=(value,option)=>String(value)===option?' selected':'';async function api(url,o={}){const r=await fetch(url,{credentials:'include',headers:{'content-type':'application/json'},...o}),b=await r.json().catch(()=>({}));if(!r.ok)throw Error(b.message||b.error||'Request failed');return b}const pounds=p=>'£'+(Number(p||0)/100).toFixed(2);async function products(){const b=await api('/v1/hq/catalogue/products'),s=document.querySelector('#productSelect'),h=document.querySelector('#productList');s.innerHTML=b.products.map(x=>'<option value="'+x.id+'">'+esc(x.name)+' · '+esc(x.sku)+'</option>').join('');h.innerHTML=b.products.map(x=>'<div class="item">'+(x.hasImage?'<img class="thumb" src="/v1/catalogue/product-images/'+x.id+'?v='+encodeURIComponent(x.imageUpdatedAt||'')+'" alt="'+esc(x.imageAlt||'Product image')+'">':'<span class="muted">No image</span>')+' <strong>'+esc(x.name)+'</strong> · '+esc(x.status)+'</div>').join('')}async function medicines(){const b=await api('/v1/hq/medicines'),h=document.querySelector('#medicineList');h.innerHTML=b.medicines.map(m=>'<article class="item"><form class="medicine-edit grid" data-id="'+m.id+'"><label>Name<input name="name" value="'+esc(m.name)+'" required></label><label>Active ingredient<input name="activeIngredient" value="'+esc(m.activeIngredient)+'" required></label><label>Form<select name="form"><option value="injection"'+sel(m.form,'injection')+'>Injection</option><option value="tablet"'+sel(m.form,'tablet')+'>Tablet</option><option value="capsule"'+sel(m.form,'capsule')+'>Capsule</option></select></label><label>Status<select name="status"><option value="out_of_stock"'+sel(m.status,'out_of_stock')+'>Out of stock</option><option value="draft"'+sel(m.status,'draft')+'>Draft</option><option value="available"'+sel(m.status,'available')+'>Available</option><option value="archived"'+sel(m.status,'archived')+'>Archived</option></select></label><label>Description<textarea name="description">'+esc(m.description)+'</textarea></label><div><button>Save medicine</button></div><p class="saved" role="status"></p></form><h3>Strengths</h3><form class="variant grid" data-id="'+m.id+'"><label>Strength / mg<input name="strengthLabel" required placeholder="2.5 mg"></label><label>Cost (£)<input name="cost" type="number" min="0.01" step="0.01" required></label><label>Selling price (£)<input name="selling" type="number" min="0.01" step="0.01" placeholder="Blank = 60% margin"></label><label>Stock<input name="stock" type="number" min="0" step="1" value="0" required></label><label>Status<select name="status"><option value="out_of_stock">Out of stock</option><option value="available">Available</option></select></label><div><button>Add strength</button></div></form><div>'+m.variants.map(v=>'<form class="variant-edit grid" data-id="'+v.id+'"><label>Strength<input value="'+esc(v.strengthLabel)+'" disabled></label><label>Cost (£)<input name="cost" type="number" min="0.01" step="0.01" value="'+(v.costPence/100).toFixed(2)+'" required></label><label>Selling price (£)<input name="selling" type="number" min="0.01" step="0.01" value="'+(v.sellingPricePence/100).toFixed(2)+'" required></label><label>Stock<input name="stock" type="number" min="0" step="1" value="'+v.stockOnHand+'" required></label><label>Status<select name="status"><option value="out_of_stock"'+sel(v.status,'out_of_stock')+'>Out of stock</option><option value="available"'+sel(v.status,'available')+'>Available</option><option value="archived"'+sel(v.status,'archived')+'>Archived</option></select></label><div><button>Save strength</button></div><p class="saved" role="status">Margin '+pounds(v.marginPence)+' ('+v.marginPercent+'%) · reserved '+v.reserved+'</p></form>').join('')+'</div></article>').join('');h.querySelectorAll('.medicine-edit').forEach(f=>f.onsubmit=async e=>{e.preventDefault();const d=Object.fromEntries(new FormData(f));await api('/v1/hq/medicines/'+f.dataset.id,{method:'PATCH',body:JSON.stringify(d)});f.querySelector('[role=status]').textContent='Medicine saved.';medicines()});h.querySelectorAll('.variant').forEach(f=>f.onsubmit=async e=>{e.preventDefault();const d=new FormData(f);await api('/v1/hq/medicines/'+f.dataset.id+'/variants',{method:'POST',body:JSON.stringify({strengthLabel:d.get('strengthLabel'),costPence:Math.round(+d.get('cost')*100),sellingPricePence:d.get('selling')?Math.round(+d.get('selling')*100):null,stockOnHand:+d.get('stock'),status:d.get('status')})});medicines()});h.querySelectorAll('.variant-edit').forEach(f=>f.onsubmit=async e=>{e.preventDefault();const d=new FormData(f);const b=await api('/v1/hq/medicine-variants/'+f.dataset.id,{method:'PATCH',body:JSON.stringify({costPence:Math.round(+d.get('cost')*100),sellingPricePence:Math.round(+d.get('selling')*100),stockOnHand:+d.get('stock'),status:d.get('status')})});f.querySelector('[role=status]').textContent='Saved · margin '+pounds(b.marginPence)+' ('+b.marginPercent+'%)';medicines()})}document.querySelector('#imageForm').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target),file=f.get('image');if(!file||file.size>1572864){document.querySelector('#imageStatus').textContent='Choose an image no larger than 1.5 MB.';return}const data=await new Promise((ok,no)=>{const r=new FileReader;r.onload=()=>ok(String(r.result).split(',')[1]);r.onerror=no;r.readAsDataURL(file)});try{await api('/v1/hq/catalogue/products/'+f.get('productId')+'/image',{method:'PUT',body:JSON.stringify({mimeType:file.type,imageBase64:data,altText:f.get('altText')})});document.querySelector('#imageStatus').textContent='Product image saved.';e.target.reset();products()}catch(x){document.querySelector('#imageStatus').textContent=x.message}};document.querySelector('#medicineForm').onsubmit=async e=>{e.preventDefault();const f=Object.fromEntries(new FormData(e.target));try{await api('/v1/hq/medicines',{method:'POST',body:JSON.stringify(f)});document.querySelector('#medicineStatus').textContent='Medicine added.';e.target.reset();medicines()}catch(x){document.querySelector('#medicineStatus').textContent=x.message}};Promise.all([products(),medicines()]).catch(x=>document.body.innerHTML='<main><h1>Shift HQ sign-in required</h1><p>'+esc(x.message)+'</p></main>');</script></body></html>`,
    {
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store",
        "x-robots-tag": "noindex, nofollow",
      },
    },
  );
}

export async function hqCatalogueRoutes(request, env, ctx) {
  const path = new URL(request.url).pathname.replace(/\/+$/, "") || "/",
    method = request.method;
  if (path === "/hq/catalogue-controls")
    return method === "GET"
      ? portal()
      : json({ ok: false, error: "method_not_allowed" }, 405);
  if (
    !path.startsWith("/v1/hq/catalogue") &&
    !path.startsWith("/v1/hq/medicines") &&
    !path.startsWith("/v1/hq/medicine-variants") &&
    !path.startsWith("/v1/catalogue/product-images")
  )
    return null;
  await ensureSchema(env.DB);
  const publicImage = path.match(/^\/v1\/catalogue\/product-images\/(\d+)$/);
  if (method === "GET" && publicImage) {
    const row = await env.DB.prepare(
      "SELECT mime_type,image_base64,updated_at FROM commerce_product_images WHERE product_id=?",
    )
      .bind(Number(publicImage[1]))
      .first();
    if (!row) return new Response("Not found", { status: 404 });
    const bytes = Uint8Array.from(atob(row.image_base64), (c) =>
      c.charCodeAt(0),
    );
    return new Response(bytes, {
      headers: {
        "content-type": row.mime_type,
        "cache-control": "public, max-age=300, must-revalidate",
        "x-content-type-options": "nosniff",
        etag: `"${row.updated_at}"`,
      },
    });
  }
  const auth = await actor(request, env, ctx);
  if (auth.response) return auth.response;
  if (!canManage(auth.user))
    return json({ ok: false, error: "forbidden" }, 403);
  if (method === "GET" && path === "/v1/hq/catalogue/products") {
    const rows =
      (
        await env.DB.prepare(
          `SELECT p.id,p.name,p.sku,p.status,i.alt_text image_alt,i.updated_at image_updated_at,CASE WHEN i.product_id IS NULL THEN 0 ELSE 1 END has_image FROM products p LEFT JOIN commerce_product_images i ON i.product_id=p.id ORDER BY p.name`,
        ).all()
      ).results || [];
    return json({
      ok: true,
      products: rows.map((x) => ({
        id: x.id,
        name: x.name,
        sku: x.sku,
        status: x.status,
        hasImage: Boolean(x.has_image),
        imageAlt: x.image_alt || "",
        imageUpdatedAt: x.image_updated_at || "",
      })),
    });
  }
  const image = path.match(/^\/v1\/hq\/catalogue\/products\/(\d+)\/image$/);
  if (method === "PUT" && image) {
    const b = await request.json().catch(() => ({})),
      mime = clean(b.mimeType, 80),
      base64 = String(b.imageBase64 || "").trim(),
      alt = clean(b.altText, 180);
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(mime) ||
      !alt ||
      !/^[A-Za-z0-9+/]+={0,2}$/.test(base64) ||
      base64.length > 2097152
    )
      return json(
        {
          ok: false,
          error: "invalid_product_image",
          message:
            "Use a JPG, PNG or WebP no larger than 1.5 MB and provide alt text.",
        },
        400,
      );
    const product = await env.DB.prepare("SELECT id FROM products WHERE id=?")
      .bind(Number(image[1]))
      .first();
    if (!product) return json({ ok: false, error: "product_not_found" }, 404);
    await env.DB.prepare(
      `INSERT INTO commerce_product_images(product_id,mime_type,image_base64,alt_text,updated_by,updated_at) VALUES(?,?,?,?,?,?) ON CONFLICT(product_id) DO UPDATE SET mime_type=excluded.mime_type,image_base64=excluded.image_base64,alt_text=excluded.alt_text,updated_by=excluded.updated_by,updated_at=excluded.updated_at`,
    )
      .bind(product.id, mime, base64, alt, auth.user.id, now())
      .run();
    await audit(
      env,
      auth.user,
      "product.image_updated",
      "product",
      product.id,
      { mime, alt },
    );
    return json({
      ok: true,
      imageUrl: `/v1/catalogue/product-images/${product.id}`,
    });
  }
  if (method === "GET" && path === "/v1/hq/medicines") {
    const medicines =
        (
          await env.DB.prepare(
            "SELECT * FROM medicine_products ORDER BY sort_order,name",
          ).all()
        ).results || [],
      variants =
        (
          await env.DB.prepare(
            "SELECT v.*,COALESCE(i.stock_on_hand,0) stock_on_hand,COALESCE(i.reserved,0) reserved FROM medicine_variants v LEFT JOIN medicine_inventory i ON i.variant_id=v.id ORDER BY v.medicine_id,v.sort_order,v.id",
          ).all()
        ).results || [];
    return json({
      ok: true,
      medicines: medicines.map((m) => ({
        ...m,
        activeIngredient: m.active_ingredient,
        variants: variants
          .filter((v) => v.medicine_id === m.id)
          .map((v) => ({
            id: v.id,
            strengthLabel: v.strength_label,
            status: v.status,
            stockOnHand: v.stock_on_hand,
            reserved: v.reserved,
            costPence: v.cost_pence,
            sellingPricePence: v.selling_price_pence,
            ...calculateMargin(v.cost_pence, v.selling_price_pence),
          })),
      })),
    });
  }
  if (method === "POST" && path === "/v1/hq/medicines") {
    const b = await request.json().catch(() => ({})),
      name = clean(b.name, 160),
      ingredient = clean(b.activeIngredient, 160),
      form = clean(b.form, 30),
      status = clean(b.status, 30) || "out_of_stock";
    if (
      !name ||
      !ingredient ||
      !["injection", "tablet", "capsule"].includes(form) ||
      !["draft", "out_of_stock", "available", "archived"].includes(status)
    )
      return json({ ok: false, error: "invalid_medicine" }, 400);
    const r = await env.DB.prepare(
      `INSERT INTO medicine_products(name,active_ingredient,form,status,description,sort_order,created_by,updated_by,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?)`,
    )
      .bind(
        name,
        ingredient,
        form,
        status,
        clean(b.description, 5000),
        Math.max(0, Number(b.sortOrder || 0)),
        auth.user.id,
        auth.user.id,
        now(),
        now(),
      )
      .run();
    await audit(
      env,
      auth.user,
      "medicine.created",
      "medicine",
      r.meta?.last_row_id,
      { name, status },
    );
    return json({ ok: true, id: r.meta?.last_row_id }, 201);
  }
  const medicineEdit = path.match(/^\/v1\/hq\/medicines\/(\d+)$/);
  if (method === "PATCH" && medicineEdit) {
    const current = await env.DB.prepare(
      "SELECT * FROM medicine_products WHERE id=?",
    )
      .bind(Number(medicineEdit[1]))
      .first();
    if (!current) return json({ ok: false, error: "medicine_not_found" }, 404);
    const b = await request.json().catch(() => ({})),
      name = clean(b.name ?? current.name, 160),
      ingredient = clean(b.activeIngredient ?? current.active_ingredient, 160),
      form = clean(b.form ?? current.form, 30),
      status = clean(b.status ?? current.status, 30);
    if (
      !name ||
      !ingredient ||
      !["injection", "tablet", "capsule"].includes(form) ||
      !["draft", "out_of_stock", "available", "archived"].includes(status)
    )
      return json({ ok: false, error: "invalid_medicine" }, 400);
    await env.DB.prepare(
      "UPDATE medicine_products SET name=?,active_ingredient=?,form=?,status=?,description=?,updated_by=?,updated_at=? WHERE id=?",
    )
      .bind(
        name,
        ingredient,
        form,
        status,
        clean(b.description ?? current.description, 5000),
        auth.user.id,
        now(),
        current.id,
      )
      .run();
    await audit(env, auth.user, "medicine.updated", "medicine", current.id, {
      name,
      status,
    });
    return json({ ok: true, id: current.id });
  }
  const variant = path.match(/^\/v1\/hq\/medicines\/(\d+)\/variants$/);
  if (method === "POST" && variant) {
    const b = await request.json().catch(() => ({})),
      medicineId = Number(variant[1]),
      strength = clean(b.strengthLabel, 80),
      cost = Math.round(Number(b.costPence)),
      selling =
        b.sellingPricePence === null ||
        b.sellingPricePence === "" ||
        b.sellingPricePence === undefined
          ? defaultSellingPrice(cost)
          : Math.round(Number(b.sellingPricePence)),
      status = clean(b.status, 30) || "out_of_stock",
      stock = Math.round(Number(b.stockOnHand ?? 0));
    if (
      !strength ||
      !Number.isFinite(cost) ||
      cost <= 0 ||
      !Number.isFinite(selling) ||
      selling <= cost ||
      !Number.isInteger(stock) ||
      stock < 0 ||
      !["out_of_stock", "available", "archived"].includes(status)
    )
      return json(
        {
          ok: false,
          error: "invalid_medicine_variant",
          message:
            "Enter a positive cost and a selling price above cost. Leave selling price blank to apply the default 60% gross margin.",
        },
        400,
      );
    const medicine = await env.DB.prepare(
      "SELECT id FROM medicine_products WHERE id=?",
    )
      .bind(medicineId)
      .first();
    if (!medicine) return json({ ok: false, error: "medicine_not_found" }, 404);
    const stamp = now(),
      effective =
        stock > 0 && status === "available" ? "available" : "out_of_stock";
    await env.DB.prepare(
      `INSERT INTO medicine_variants(medicine_id,strength_label,cost_pence,selling_price_pence,status,sort_order,created_at,updated_at) VALUES(?,?,?,?,?,0,?,?) ON CONFLICT(medicine_id,strength_label) DO UPDATE SET cost_pence=excluded.cost_pence,selling_price_pence=excluded.selling_price_pence,status=excluded.status,updated_at=excluded.updated_at`,
    )
      .bind(medicineId, strength, cost, selling, effective, stamp, stamp)
      .run();
    const saved = await env.DB.prepare(
      "SELECT id FROM medicine_variants WHERE medicine_id=? AND strength_label=?",
    )
      .bind(medicineId, strength)
      .first();
    await env.DB.prepare(
      `INSERT INTO medicine_inventory(variant_id,stock_on_hand,reserved,updated_at) VALUES(?,?,0,?) ON CONFLICT(variant_id) DO UPDATE SET stock_on_hand=excluded.stock_on_hand,updated_at=excluded.updated_at`,
    )
      .bind(saved.id, stock, stamp)
      .run();
    await audit(
      env,
      auth.user,
      "medicine.variant_saved",
      "medicine",
      medicineId,
      {
        strength,
        stockOnHand: stock,
        ...calculateMargin(cost, selling),
        status: effective,
      },
    );
    return json(
      {
        ok: true,
        id: saved.id,
        stockOnHand: stock,
        status: effective,
        ...calculateMargin(cost, selling),
      },
      201,
    );
  }
  const variantEdit = path.match(/^\/v1\/hq\/medicine-variants\/(\d+)$/);
  if (method === "PATCH" && variantEdit) {
    const id = Number(variantEdit[1]),
      current = await env.DB.prepare(
        "SELECT * FROM medicine_variants WHERE id=?",
      )
        .bind(id)
        .first();
    if (!current)
      return json({ ok: false, error: "medicine_variant_not_found" }, 404);
    const b = await request.json().catch(() => ({})),
      cost = Math.round(Number(b.costPence ?? current.cost_pence)),
      selling = Math.round(
        Number(b.sellingPricePence ?? current.selling_price_pence),
      ),
      status = clean(b.status ?? current.status, 30),
      stock = Math.round(Number(b.stockOnHand ?? 0));
    if (
      !Number.isFinite(cost) ||
      cost <= 0 ||
      !Number.isFinite(selling) ||
      selling <= cost ||
      !Number.isInteger(stock) ||
      stock < 0 ||
      !["out_of_stock", "available", "archived"].includes(status)
    )
      return json(
        {
          ok: false,
          error: "invalid_medicine_variant",
          message:
            "Cost must be positive, selling price must exceed cost, and stock must be a whole number of zero or more.",
        },
        400,
      );
    const effective =
        status === "archived"
          ? "archived"
          : stock > 0 && status === "available"
            ? "available"
            : "out_of_stock",
      stamp = now();
    await env.DB.batch([
      env.DB.prepare(
        "UPDATE medicine_variants SET cost_pence=?,selling_price_pence=?,status=?,updated_at=? WHERE id=?",
      ).bind(cost, selling, effective, stamp, id),
      env.DB.prepare(
        `INSERT INTO medicine_inventory(variant_id,stock_on_hand,reserved,updated_at) VALUES(?,?,0,?) ON CONFLICT(variant_id) DO UPDATE SET stock_on_hand=excluded.stock_on_hand,updated_at=excluded.updated_at`,
      ).bind(id, stock, stamp),
    ]);
    await audit(
      env,
      auth.user,
      "medicine.variant_updated",
      "medicine_variant",
      id,
      {
        stockOnHand: stock,
        status: effective,
        ...calculateMargin(cost, selling),
      },
    );
    return json({
      ok: true,
      id,
      stockOnHand: stock,
      status: effective,
      ...calculateMargin(cost, selling),
    });
  }
  return json({ ok: false, error: "not_found" }, 404);
}
