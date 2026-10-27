// Run only as part of the coordinated Core + Health release, before new clients.
// No offers/prices/stock are invented and this cannot turn purchasing on.
import {ensureExtras} from './schema.mjs';
export async function migrateCheckoutExtras(DB){
 await ensureExtras(DB);
 const columns=(await DB.prepare('PRAGMA table_info(supplement_products)').all()).results||[];
 if(!columns.length)throw Error('Install the existing Supplements & Nutrition catalogue first.');
 if(!columns.some(p=>p.name==='checkout_recommendation'))await DB.exec('ALTER TABLE supplement_products ADD COLUMN checkout_recommendation INTEGER NOT NULL DEFAULT 0 CHECK(checkout_recommendation IN (0,1));');
 if(!columns.some(p=>p.name==='checkout_priority'))await DB.exec('ALTER TABLE supplement_products ADD COLUMN checkout_priority INTEGER NOT NULL DEFAULT 100 CHECK(checkout_priority BETWEEN 0 AND 10000);');
 // A versioned migration marker prevents reruns from overwriting HQ choices.
 await DB.exec('CREATE TABLE IF NOT EXISTS supplement_checkout_migrations (id TEXT PRIMARY KEY,applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);');
 const id='recommendations-20261027';
 await DB.batch([
  DB.prepare("UPDATE supplement_products SET checkout_recommendation=1,checkout_priority=CASE id WHEN 'whey' THEN 10 ELSE 20 END,revision=revision+1,updated_by='checkout-recommendations-20261027',updated_at=CURRENT_TIMESTAMP WHERE id IN ('whey','clear') AND NOT EXISTS(SELECT 1 FROM supplement_checkout_migrations WHERE id=?)").bind(id),
  DB.prepare("INSERT OR IGNORE INTO supplement_product_history(product_id,revision,changed_by,record_json) SELECT id,revision,'checkout-recommendations-20261027',json_object('checkout_recommendation',checkout_recommendation,'checkout_priority',checkout_priority) FROM supplement_products WHERE id IN ('whey','clear') AND updated_by='checkout-recommendations-20261027' AND NOT EXISTS(SELECT 1 FROM supplement_checkout_migrations WHERE id=?)").bind(id),
  DB.prepare('INSERT OR IGNORE INTO supplement_checkout_migrations(id) VALUES(?)').bind(id)
 ]);
}
