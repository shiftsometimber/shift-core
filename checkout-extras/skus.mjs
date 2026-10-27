// A SHIFT tracking identity is independent of a supplier reference or a price.
export const skuSQL=`CREATE TABLE IF NOT EXISTS catalogue_skus (
 id INTEGER PRIMARY KEY AUTOINCREMENT,source_table TEXT NOT NULL,source_id TEXT NOT NULL,
 sku TEXT UNIQUE,legacy_sku TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE(source_table,source_id)
);
CREATE TRIGGER IF NOT EXISTS catalogue_sku_immutable BEFORE UPDATE OF sku,source_table,source_id ON catalogue_skus
 WHEN OLD.sku IS NOT NULL AND (NEW.sku IS NOT OLD.sku OR NEW.source_table IS NOT OLD.source_table OR NEW.source_id IS NOT OLD.source_id)
 BEGIN SELECT RAISE(ABORT,'SHIFT SKU identity cannot be changed'); END;
CREATE TRIGGER IF NOT EXISTS catalogue_sku_no_reuse BEFORE DELETE ON catalogue_skus
 BEGIN SELECT RAISE(ABORT,'Keep retired SHIFT SKUs for order tracking'); END;`;
export async function registerCatalogueSkus(DB){
 await DB.exec(skuSQL.split(/\n(?=CREATE)/).map(s=>s.replace(/\s+/g,' ')).join('\n'));
 const tables=(await DB.prepare("SELECT name FROM sqlite_master WHERE type='table'").all()).results||[];
 const sources=['products','product_variants','commerce_product_variants','medicine_products','medicine_variants','supplement_products'].filter(name=>tables.some(t=>t.name===name));
 for(const table of sources){
  const columns=(await DB.prepare('PRAGMA table_info('+table+')').all()).results||[];if(!columns.some(c=>c.name==='id'))continue;
  // Existing explicit SKUs keep their identity; supplier_sku is never reused here.
  const native=columns.some(c=>c.name==='sku')?"NULLIF(TRIM(sku),'')":'NULL';
  await DB.batch([
   DB.prepare(`INSERT OR IGNORE INTO catalogue_skus(source_table,source_id,sku,legacy_sku) SELECT ?,CAST(id AS TEXT),${native},${native} FROM ${table} ORDER BY id`).bind(table),
   DB.prepare("UPDATE catalogue_skus SET sku=printf('SST-I-%08d',id) WHERE sku IS NULL")
  ]);
  const missing=await DB.prepare(`SELECT COUNT(*) n FROM ${table} p LEFT JOIN catalogue_skus s ON s.source_table=? AND s.source_id=CAST(p.id AS TEXT) WHERE s.sku IS NULL`).bind(table).first();
  if(Number(missing.n)!==0)throw Error('Existing catalogue SKU collision requires review: '+table);
 }
 return (await DB.prepare('SELECT source_table,COUNT(*) count FROM catalogue_skus GROUP BY source_table ORDER BY source_table').all()).results||[];
}
export async function supplementSkuMap(DB){await registerCatalogueSkus(DB);return Object.fromEntries(((await DB.prepare("SELECT source_id,sku FROM catalogue_skus WHERE source_table='supplement_products'").all()).results||[]).map(p=>[p.source_id,p.sku]));}
