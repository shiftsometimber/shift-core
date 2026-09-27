-- Foundayo is a visible, fully priced option, but real stock stays fail-closed
-- until a commissioned pharmacy partner confirms supply.
UPDATE medicine_inventory
SET stock_on_hand=0,reserved=0,updated_at=CURRENT_TIMESTAMP
WHERE variant_id IN (
  SELECT v.id FROM medicine_variants v
  JOIN medicine_products p ON p.id=v.medicine_id
  WHERE lower(p.name)='foundayo'
);

UPDATE medicine_variants
SET status='out_of_stock',updated_at=CURRENT_TIMESTAMP
WHERE medicine_id IN (SELECT id FROM medicine_products WHERE lower(name)='foundayo');

UPDATE medicine_products
SET status='out_of_stock',
    description='Daily GLP-1 tablet. Full SHIFT option with HQ-controlled pricing; ordering remains locked until partner supply is confirmed.',
    updated_at=CURRENT_TIMESTAMP
WHERE lower(name)='foundayo';
