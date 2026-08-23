const DEFAULT_TARGET_GM_BPS = 6000;

const PHYSICAL_SKUS = [
  'SST-TEE-BLACK-V1','SST-HEAVY-TEE','SST-PERF-TEE','SST-CLASSIC-TEE',
  'SST-HOODIE','SST-VEST','SST-QUARTER-ZIP','SST-POLO','SST-JOGGERS',
  'SST-SHORTS','SST-GUTS-TEE','SST-GUTS-HOODIE','SST-CAP','SST-CREW-SOCKS',
  'SST-GYM-BAG','SST-BOTTLE','SST-SHAKER'
];

export function provisionalCostCeilingPence(salePricePence,targetGmBps=DEFAULT_TARGET_GM_BPS){
  const price=Number(salePricePence),gm=Number(targetGmBps);
  if(!Number.isInteger(price)||price<0||!Number.isInteger(gm)||gm<0||gm>10000)throw new TypeError('invalid_margin_input');
  return Math.floor(price*(10000-gm)/10000);
}

export async function ensureCommercialCatalogueSchema(env){
  await env.DB.batch([
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS catalogue_suppliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      legal_name TEXT,
      trading_name TEXT,
      registered_address TEXT,
      fulfilment_address TEXT,
      contact_name TEXT,
      contact_email TEXT,
      contact_phone TEXT,
      website TEXT,
      company_number TEXT,
      vat_number TEXT,
      status TEXT NOT NULL DEFAULT 'tbc' CHECK(status IN ('tbc','review','approved','suspended')),
      evidence_json TEXT,
      confirmed_at TEXT,
      reviewed_at TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS catalogue_commercial_control (
      product_id INTEGER PRIMARY KEY,
      supplier_id INTEGER,
      supplier_sku TEXT,
      actual_cost_pence INTEGER CHECK(actual_cost_pence IS NULL OR actual_cost_pence>=0),
      actual_cost_status TEXT NOT NULL DEFAULT 'tbc' CHECK(actual_cost_status IN ('tbc','proposed','confirmed')),
      cost_basis TEXT NOT NULL DEFAULT 'tbc',
      vat_treatment TEXT NOT NULL DEFAULT 'tbc',
      p_and_p_cost_pence INTEGER CHECK(p_and_p_cost_pence IS NULL OR p_and_p_cost_pence>=0),
      p_and_p_cost_status TEXT NOT NULL DEFAULT 'tbc' CHECK(p_and_p_cost_status IN ('tbc','proposed','confirmed')),
      payment_cost_pence INTEGER CHECK(payment_cost_pence IS NULL OR payment_cost_pence>=0),
      expected_refund_decline_cost_pence INTEGER CHECK(expected_refund_decline_cost_pence IS NULL OR expected_refund_decline_cost_pence>=0),
      direct_support_cost_pence INTEGER CHECK(direct_support_cost_pence IS NULL OR direct_support_cost_pence>=0),
      contribution_cost_status TEXT NOT NULL DEFAULT 'tbc' CHECK(contribution_cost_status IN ('tbc','proposed','confirmed')),
      lead_time_min_days INTEGER CHECK(lead_time_min_days IS NULL OR lead_time_min_days>=0),
      lead_time_max_days INTEGER CHECK(lead_time_max_days IS NULL OR lead_time_max_days>=lead_time_min_days),
      lead_time_status TEXT NOT NULL DEFAULT 'tbc' CHECK(lead_time_status IN ('tbc','proposed','confirmed')),
      target_gm_bps INTEGER NOT NULL DEFAULT 6000 CHECK(target_gm_bps BETWEEN 0 AND 10000),
      minimum_contribution_pence INTEGER,
      commercial_state TEXT NOT NULL DEFAULT 'blocked' CHECK(commercial_state IN ('blocked','review','approved','suspended')),
      source_reference TEXT,
      approver TEXT,
      effective_at TEXT,
      next_review_at TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(product_id) REFERENCES products(id),
      FOREIGN KEY(supplier_id) REFERENCES catalogue_suppliers(id)
    )`),
    env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_catalogue_commercial_state ON catalogue_commercial_control(commercial_state)'),
    env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_catalogue_supplier_state ON catalogue_suppliers(status)')
  ]);
  for(const sku of PHYSICAL_SKUS){
    await env.DB.prepare(`INSERT OR IGNORE INTO catalogue_commercial_control(product_id,target_gm_bps,commercial_state)
      SELECT id,6000,'blocked' FROM products WHERE sku=?`).bind(sku).run();
  }
}

export function evaluateCommercialGate(row){
  if(!row)return {ok:false,reason:'commercial_record_missing'};
  if(row.commercial_state!=='approved')return {ok:false,reason:'commercial_not_approved'};
  if(row.actual_cost_status!=='confirmed'||row.actual_cost_pence===null)return {ok:false,reason:'cost_unconfirmed'};
  if(row.p_and_p_cost_status!=='confirmed'||row.p_and_p_cost_pence===null)return {ok:false,reason:'fulfilment_cost_unconfirmed'};
  if(row.contribution_cost_status!=='confirmed'||row.payment_cost_pence===null||row.expected_refund_decline_cost_pence===null||row.direct_support_cost_pence===null||row.minimum_contribution_pence===null)return {ok:false,reason:'contribution_inputs_unconfirmed'};
  if(row.lead_time_status!=='confirmed'||row.lead_time_min_days===null||row.lead_time_max_days===null)return {ok:false,reason:'lead_time_unconfirmed'};
  if(row.supplier_status!=='approved')return {ok:false,reason:'supplier_unapproved'};
  const sale=Number(row.price_pence),cost=Number(row.actual_cost_pence);
  if(!Number.isInteger(sale)||sale<=0||!Number.isInteger(cost)||cost<0)return {ok:false,reason:'commercial_values_invalid'};
  const productGmBps=Math.floor(((sale-cost)/sale)*10000);
  if(productGmBps<Number(row.target_gm_bps))return {ok:false,reason:'gross_margin_below_target',productGmBps};
  const contributionPence=sale-cost-Number(row.p_and_p_cost_pence)-Number(row.payment_cost_pence)-Number(row.expected_refund_decline_cost_pence)-Number(row.direct_support_cost_pence);
  if(contributionPence<Number(row.minimum_contribution_pence))return {ok:false,reason:'contribution_below_minimum',productGmBps,contributionPence};
  return {ok:true,productGmBps,contributionPence};
}

export async function commercialGateForProduct(env,productId){
  const row=await env.DB.prepare(`SELECT p.price_pence,c.*,s.status supplier_status
    FROM products p LEFT JOIN catalogue_commercial_control c ON c.product_id=p.id
    LEFT JOIN catalogue_suppliers s ON s.id=c.supplier_id WHERE p.id=?`).bind(productId).first();
  return evaluateCommercialGate(row);
}

export const commercialCatalogueDefaults={targetGmBps:DEFAULT_TARGET_GM_BPS,physicalSkus:[...PHYSICAL_SKUS]};
