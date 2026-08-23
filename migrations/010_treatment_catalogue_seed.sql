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

INSERT OR IGNORE INTO treatment_strengths(
  formulation_id,strength_label,proposed_price_pence,target_gm_bps,
  cost_status,stock_state,claims_state,cta_state
)
SELECT f.id,v.strength,v.price,6000,'tbc','tbc','tbc','blocked'
FROM treatment_formulations f
JOIN treatment_families tf ON tf.id=f.family_id
JOIN (
  SELECT 'tirzepatide' family_key,'weekly_injection' formulation_key,'2.5 mg' strength,16900 price
  UNION ALL SELECT 'tirzepatide','weekly_injection','5 mg',19900
  UNION ALL SELECT 'tirzepatide','weekly_injection','7.5 mg',25900
  UNION ALL SELECT 'tirzepatide','weekly_injection','10 mg',27900
  UNION ALL SELECT 'tirzepatide','weekly_injection','12.5 mg',29900
  UNION ALL SELECT 'tirzepatide','weekly_injection','15 mg',31900
  UNION ALL SELECT 'semaglutide','weekly_injection','0.25 mg',9900
  UNION ALL SELECT 'semaglutide','weekly_injection','0.5 mg',11900
  UNION ALL SELECT 'semaglutide','weekly_injection','1 mg',14900
  UNION ALL SELECT 'semaglutide','weekly_injection','1.7 mg',17900
  UNION ALL SELECT 'semaglutide','weekly_injection','2.4 mg',19900
  UNION ALL SELECT 'semaglutide','daily_tablet','1.5 mg',12900
  UNION ALL SELECT 'semaglutide','daily_tablet','4 mg',15900
  UNION ALL SELECT 'semaglutide','daily_tablet','9 mg',19900
  UNION ALL SELECT 'semaglutide','daily_tablet','25 mg',22900
) v ON v.family_key=tf.family_key AND v.formulation_key=f.formulation_key;

INSERT OR IGNORE INTO treatment_offers(strength_id,offer_type,availability_state,commercial_state)
SELECT id,'new_customer','tbc','blocked' FROM treatment_strengths;
INSERT OR IGNORE INTO treatment_offers(strength_id,offer_type,availability_state,commercial_state)
SELECT id,'switcher','tbc','blocked' FROM treatment_strengths;
INSERT OR IGNORE INTO treatment_offers(strength_id,offer_type,availability_state,commercial_state)
SELECT id,'continuation_only','tbc','blocked' FROM treatment_strengths;
