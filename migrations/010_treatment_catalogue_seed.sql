-- R1 Foundation: idempotent proposed treatment ladder.
-- Deployment-owned seed: request handlers must never write or re-price this catalogue.
INSERT OR IGNORE INTO treatment_families(family_key,active_ingredient) VALUES
  ('tirzepatide','tirzepatide'),
  ('semaglutide','semaglutide');

INSERT OR IGNORE INTO treatment_formulations(family_id,formulation_key,route,routine)
SELECT id,'weekly_injection','injection','weekly' FROM treatment_families WHERE family_key='tirzepatide';
INSERT OR IGNORE INTO treatment_formulations(family_id,formulation_key,route,routine)
SELECT id,'weekly_injection','injection','weekly' FROM treatment_families WHERE family_key='semaglutide';
INSERT OR IGNORE INTO treatment_formulations(family_id,formulation_key,route,routine)
SELECT id,'daily_tablet','oral','daily' FROM treatment_families WHERE family_key='semaglutide';

INSERT OR IGNORE INTO treatment_strengths(formulation_id,strength_label,proposed_price_pence,target_gm_bps,cost_status,stock_state,claims_state,cta_state)
SELECT f.id,'2.5 mg',16900,6000,'tbc','tbc','tbc','blocked' FROM treatment_formulations f JOIN treatment_families tf ON tf.id=f.family_id WHERE tf.family_key='tirzepatide' AND f.formulation_key='weekly_injection';
INSERT OR IGNORE INTO treatment_strengths(formulation_id,strength_label,proposed_price_pence,target_gm_bps,cost_status,stock_state,claims_state,cta_state)
SELECT f.id,'5 mg',19900,6000,'tbc','tbc','tbc','blocked' FROM treatment_formulations f JOIN treatment_families tf ON tf.id=f.family_id WHERE tf.family_key='tirzepatide' AND f.formulation_key='weekly_injection';
INSERT OR IGNORE INTO treatment_strengths(formulation_id,strength_label,proposed_price_pence,target_gm_bps,cost_status,stock_state,claims_state,cta_state)
SELECT f.id,'7.5 mg',25900,6000,'tbc','tbc','tbc','blocked' FROM treatment_formulations f JOIN treatment_families tf ON tf.id=f.family_id WHERE tf.family_key='tirzepatide' AND f.formulation_key='weekly_injection';
INSERT OR IGNORE INTO treatment_strengths(formulation_id,strength_label,proposed_price_pence,target_gm_bps,cost_status,stock_state,claims_state,cta_state)
SELECT f.id,'10 mg',27900,6000,'tbc','tbc','tbc','blocked' FROM treatment_formulations f JOIN treatment_families tf ON tf.id=f.family_id WHERE tf.family_key='tirzepatide' AND f.formulation_key='weekly_injection';
INSERT OR IGNORE INTO treatment_strengths(formulation_id,strength_label,proposed_price_pence,target_gm_bps,cost_status,stock_state,claims_state,cta_state)
SELECT f.id,'12.5 mg',29900,6000,'tbc','tbc','tbc','blocked' FROM treatment_formulations f JOIN treatment_families tf ON tf.id=f.family_id WHERE tf.family_key='tirzepatide' AND f.formulation_key='weekly_injection';
INSERT OR IGNORE INTO treatment_strengths(formulation_id,strength_label,proposed_price_pence,target_gm_bps,cost_status,stock_state,claims_state,cta_state)
SELECT f.id,'15 mg',31900,6000,'tbc','tbc','tbc','blocked' FROM treatment_formulations f JOIN treatment_families tf ON tf.id=f.family_id WHERE tf.family_key='tirzepatide' AND f.formulation_key='weekly_injection';
INSERT OR IGNORE INTO treatment_strengths(formulation_id,strength_label,proposed_price_pence,target_gm_bps,cost_status,stock_state,claims_state,cta_state)
SELECT f.id,'0.25 mg',9900,6000,'tbc','tbc','tbc','blocked' FROM treatment_formulations f JOIN treatment_families tf ON tf.id=f.family_id WHERE tf.family_key='semaglutide' AND f.formulation_key='weekly_injection';
INSERT OR IGNORE INTO treatment_strengths(formulation_id,strength_label,proposed_price_pence,target_gm_bps,cost_status,stock_state,claims_state,cta_state)
SELECT f.id,'0.5 mg',11900,6000,'tbc','tbc','tbc','blocked' FROM treatment_formulations f JOIN treatment_families tf ON tf.id=f.family_id WHERE tf.family_key='semaglutide' AND f.formulation_key='weekly_injection';
INSERT OR IGNORE INTO treatment_strengths(formulation_id,strength_label,proposed_price_pence,target_gm_bps,cost_status,stock_state,claims_state,cta_state)
SELECT f.id,'1 mg',14900,6000,'tbc','tbc','tbc','blocked' FROM treatment_formulations f JOIN treatment_families tf ON tf.id=f.family_id WHERE tf.family_key='semaglutide' AND f.formulation_key='weekly_injection';
INSERT OR IGNORE INTO treatment_strengths(formulation_id,strength_label,proposed_price_pence,target_gm_bps,cost_status,stock_state,claims_state,cta_state)
SELECT f.id,'1.7 mg',17900,6000,'tbc','tbc','tbc','blocked' FROM treatment_formulations f JOIN treatment_families tf ON tf.id=f.family_id WHERE tf.family_key='semaglutide' AND f.formulation_key='weekly_injection';
INSERT OR IGNORE INTO treatment_strengths(formulation_id,strength_label,proposed_price_pence,target_gm_bps,cost_status,stock_state,claims_state,cta_state)
SELECT f.id,'2.4 mg',19900,6000,'tbc','tbc','tbc','blocked' FROM treatment_formulations f JOIN treatment_families tf ON tf.id=f.family_id WHERE tf.family_key='semaglutide' AND f.formulation_key='weekly_injection';
INSERT OR IGNORE INTO treatment_strengths(formulation_id,strength_label,proposed_price_pence,target_gm_bps,cost_status,stock_state,claims_state,cta_state)
SELECT f.id,'1.5 mg',12900,6000,'tbc','tbc','tbc','blocked' FROM treatment_formulations f JOIN treatment_families tf ON tf.id=f.family_id WHERE tf.family_key='semaglutide' AND f.formulation_key='daily_tablet';
INSERT OR IGNORE INTO treatment_strengths(formulation_id,strength_label,proposed_price_pence,target_gm_bps,cost_status,stock_state,claims_state,cta_state)
SELECT f.id,'4 mg',15900,6000,'tbc','tbc','tbc','blocked' FROM treatment_formulations f JOIN treatment_families tf ON tf.id=f.family_id WHERE tf.family_key='semaglutide' AND f.formulation_key='daily_tablet';
INSERT OR IGNORE INTO treatment_strengths(formulation_id,strength_label,proposed_price_pence,target_gm_bps,cost_status,stock_state,claims_state,cta_state)
SELECT f.id,'9 mg',19900,6000,'tbc','tbc','tbc','blocked' FROM treatment_formulations f JOIN treatment_families tf ON tf.id=f.family_id WHERE tf.family_key='semaglutide' AND f.formulation_key='daily_tablet';
INSERT OR IGNORE INTO treatment_strengths(formulation_id,strength_label,proposed_price_pence,target_gm_bps,cost_status,stock_state,claims_state,cta_state)
SELECT f.id,'25 mg',22900,6000,'tbc','tbc','tbc','blocked' FROM treatment_formulations f JOIN treatment_families tf ON tf.id=f.family_id WHERE tf.family_key='semaglutide' AND f.formulation_key='daily_tablet';

INSERT OR IGNORE INTO treatment_offers(strength_id,offer_type,availability_state,commercial_state)
SELECT id,'new_customer','tbc','blocked' FROM treatment_strengths;
INSERT OR IGNORE INTO treatment_offers(strength_id,offer_type,availability_state,commercial_state)
SELECT id,'switcher','tbc','blocked' FROM treatment_strengths;
INSERT OR IGNORE INTO treatment_offers(strength_id,offer_type,availability_state,commercial_state)
SELECT id,'continuation_only','tbc','blocked' FROM treatment_strengths;
