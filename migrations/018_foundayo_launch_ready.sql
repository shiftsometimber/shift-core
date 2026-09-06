-- Foundayo launch-ready catalogue record. Prices are provisional and derived from
-- the current Wegovy tablet cost ladder. Supply and checkout remain hard-locked.
INSERT INTO medicine_products(name,active_ingredient,form,status,description,sort_order,created_at,updated_at)
SELECT 'Foundayo','orforglipron','tablet','out_of_stock','Daily GLP-1 tablet. UK-authorised; partner formulary, commercial terms and supply still require confirmation.',35,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM medicine_products WHERE lower(name)='foundayo');

UPDATE medicine_products
SET active_ingredient='orforglipron',form='tablet',status='out_of_stock',updated_at=CURRENT_TIMESTAMP
WHERE lower(name)='foundayo';

WITH ranked_base AS (
  SELECT v.cost_pence,COALESCE(v.target_margin_bps,6000) margin_bps,
         ROW_NUMBER() OVER (ORDER BY v.cost_pence,v.selling_price_pence,v.id)-1 AS ladder_index
  FROM medicine_variants v JOIN medicine_products p ON p.id=v.medicine_id
  WHERE lower(p.name) LIKE 'wegovy%' AND p.form='tablet' AND v.cost_pence>0 AND v.status!='archived'
), desired(strength_label,sort_order,ladder_index) AS (
  VALUES ('0.8 mg',1,0),('2.5 mg',2,0),('5.5 mg',3,1),('9 mg',4,2),('14.5 mg',5,3),('17.2 mg',6,3)
), priced AS (
  SELECT d.strength_label,d.sort_order,b.cost_pence,b.margin_bps,
         CAST((b.cost_pence*10000 + (10000-b.margin_bps)-1)/(10000-b.margin_bps) AS INTEGER) selling_price_pence
  FROM desired d JOIN ranked_base b ON b.ladder_index=d.ladder_index
)
INSERT INTO medicine_variants(medicine_id,strength_label,cost_pence,selling_price_pence,target_margin_bps,status,sort_order,created_at,updated_at)
SELECT p.id,x.strength_label,x.cost_pence,x.selling_price_pence,x.margin_bps,'out_of_stock',x.sort_order,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
FROM priced x JOIN medicine_products p ON lower(p.name)='foundayo'
ON CONFLICT(medicine_id,strength_label) DO UPDATE SET
  cost_pence=excluded.cost_pence,
  selling_price_pence=excluded.selling_price_pence,
  target_margin_bps=excluded.target_margin_bps,
  status='out_of_stock',
  sort_order=excluded.sort_order,
  updated_at=CURRENT_TIMESTAMP;

INSERT OR IGNORE INTO medicine_inventory(variant_id,stock_on_hand,reserved,updated_at)
SELECT v.id,0,0,CURRENT_TIMESTAMP FROM medicine_variants v JOIN medicine_products p ON p.id=v.medicine_id WHERE lower(p.name)='foundayo';

UPDATE medicine_inventory SET stock_on_hand=0,reserved=0,updated_at=CURRENT_TIMESTAMP
WHERE variant_id IN (SELECT v.id FROM medicine_variants v JOIN medicine_products p ON p.id=v.medicine_id WHERE lower(p.name)='foundayo');
