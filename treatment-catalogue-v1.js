export const PROPOSED_TREATMENT_STRENGTHS=Object.freeze([
  ['tirzepatide','weekly_injection','2.5 mg',16900],['tirzepatide','weekly_injection','5 mg',19900],
  ['tirzepatide','weekly_injection','7.5 mg',25900],['tirzepatide','weekly_injection','10 mg',27900],
  ['tirzepatide','weekly_injection','12.5 mg',29900],['tirzepatide','weekly_injection','15 mg',31900],
  ['semaglutide','weekly_injection','0.25 mg',9900],['semaglutide','weekly_injection','0.5 mg',11900],
  ['semaglutide','weekly_injection','1 mg',14900],['semaglutide','weekly_injection','1.7 mg',17900],
  ['semaglutide','weekly_injection','2.4 mg',19900],
  ['semaglutide','daily_tablet','1.5 mg',12900],['semaglutide','daily_tablet','4 mg',15900],
  ['semaglutide','daily_tablet','9 mg',19900],['semaglutide','daily_tablet','25 mg',22900]
]);

export async function ensureTreatmentCatalogueSchema(env){
  await env.DB.batch([
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS treatment_families (
      id INTEGER PRIMARY KEY AUTOINCREMENT, family_key TEXT NOT NULL UNIQUE, active_ingredient TEXT NOT NULL,
      governance_state TEXT NOT NULL DEFAULT 'tbc' CHECK(governance_state IN ('tbc','review','approved','withdrawn')),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS treatment_formulations (
      id INTEGER PRIMARY KEY AUTOINCREMENT, family_id INTEGER NOT NULL, formulation_key TEXT NOT NULL,
      route TEXT NOT NULL, routine TEXT NOT NULL,
      governance_state TEXT NOT NULL DEFAULT 'tbc' CHECK(governance_state IN ('tbc','review','approved','withdrawn')),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(family_id,formulation_key), FOREIGN KEY(family_id) REFERENCES treatment_families(id))`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS treatment_strengths (
      id INTEGER PRIMARY KEY AUTOINCREMENT, formulation_id INTEGER NOT NULL, strength_label TEXT NOT NULL,
      proposed_price_pence INTEGER NOT NULL CHECK(proposed_price_pence>0), selling_price_pence INTEGER,
      target_gm_bps INTEGER NOT NULL DEFAULT 6000 CHECK(target_gm_bps BETWEEN 0 AND 10000),
      actual_cost_pence INTEGER, cost_status TEXT NOT NULL DEFAULT 'tbc' CHECK(cost_status IN ('tbc','proposed','confirmed')),
      stock_state TEXT NOT NULL DEFAULT 'tbc', stock_source TEXT, stock_confirmed_at TEXT,
      content_version TEXT, clinical_review_date TEXT, claims_state TEXT NOT NULL DEFAULT 'tbc',
      cta_state TEXT NOT NULL DEFAULT 'blocked' CHECK(cta_state IN ('blocked','information_only','enabled')),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(formulation_id,strength_label), FOREIGN KEY(formulation_id) REFERENCES treatment_formulations(id))`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS treatment_offers (
      id INTEGER PRIMARY KEY AUTOINCREMENT, strength_id INTEGER NOT NULL, offer_type TEXT NOT NULL,
      availability_state TEXT NOT NULL DEFAULT 'tbc', switching_requirements TEXT, evidence_requirements TEXT,
      included_services TEXT, partner_id INTEGER, dispensing_cost_pence INTEGER, delivery_cost_pence INTEGER,
      payment_cost_pence INTEGER, expected_refund_decline_cost_pence INTEGER, direct_support_cost_pence INTEGER,
      minimum_contribution_pence INTEGER, commercial_state TEXT NOT NULL DEFAULT 'blocked',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(strength_id,offer_type), FOREIGN KEY(strength_id) REFERENCES treatment_strengths(id),
      FOREIGN KEY(partner_id) REFERENCES catalogue_suppliers(id))`)
  ]);
  for(const [family,formulation,strength,price] of PROPOSED_TREATMENT_STRENGTHS){
    await env.DB.prepare(`INSERT OR IGNORE INTO treatment_families(family_key,active_ingredient) VALUES(?,?)`).bind(family,family).run();
    const familyRow=await env.DB.prepare('SELECT id FROM treatment_families WHERE family_key=?').bind(family).first();
    const route=formulation==='daily_tablet'?'oral':'injection',routine=formulation==='daily_tablet'?'daily':'weekly';
    await env.DB.prepare(`INSERT OR IGNORE INTO treatment_formulations(family_id,formulation_key,route,routine) VALUES(?,?,?,?)`).bind(familyRow.id,formulation,route,routine).run();
    const formulationRow=await env.DB.prepare('SELECT id FROM treatment_formulations WHERE family_id=? AND formulation_key=?').bind(familyRow.id,formulation).first();
    await env.DB.prepare(`INSERT INTO treatment_strengths(formulation_id,strength_label,proposed_price_pence,target_gm_bps,cost_status,stock_state,claims_state,cta_state)
      VALUES(?,?,?,6000,'tbc','tbc','tbc','blocked')
      ON CONFLICT(formulation_id,strength_label) DO UPDATE SET proposed_price_pence=excluded.proposed_price_pence,target_gm_bps=6000,updated_at=CURRENT_TIMESTAMP`).bind(formulationRow.id,strength,price).run();
    const strengthRow=await env.DB.prepare('SELECT id FROM treatment_strengths WHERE formulation_id=? AND strength_label=?').bind(formulationRow.id,strength).first();
    for(const offer of ['new_customer','switcher','continuation_only'])await env.DB.prepare(`INSERT OR IGNORE INTO treatment_offers(strength_id,offer_type,availability_state,commercial_state) VALUES(?,?,'tbc','blocked')`).bind(strengthRow.id,offer).run();
  }
}

export function medicineRegisterSummary(){
  return PROPOSED_TREATMENT_STRENGTHS.map(([family,formulation,strength,proposedPricePence])=>({family,formulation,strength,proposedPricePence,targetGmBps:6000,costStatus:'tbc',supplierStatus:'tbc',leadTimeStatus:'tbc',pAndPStatus:'tbc',ctaState:'blocked'}));
}
