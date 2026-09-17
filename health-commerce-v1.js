// Home diagnostics share products, inventory, orders and Stripe with commerce.
export const HEALTH_SKU='SH-TE';
export const HEALTH_VARIANT='One test|None';
export async function ensureHealthCommerce(DB){
 await DB.exec(`CREATE TABLE IF NOT EXISTS health_commerce_settings(product_id INTEGER PRIMARY KEY,partner TEXT NOT NULL DEFAULT '',sellable INTEGER NOT NULL DEFAULT 0,pathway_ready INTEGER NOT NULL DEFAULT 0,fulfilment_ready INTEGER NOT NULL DEFAULT 0,delivery_pence INTEGER,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);`);
 await DB.prepare(`INSERT INTO products(name,sku,product_type,price_pence,status,description) VALUES('Testosterone & Energy Check',?,'home_test',0,'draft','Home testosterone investigation; not TRT or a prescription.') ON CONFLICT(sku) DO NOTHING`).bind(HEALTH_SKU).run();
 const p=await DB.prepare('SELECT id FROM products WHERE sku=?').bind(HEALTH_SKU).first();
 await DB.prepare('INSERT OR IGNORE INTO health_commerce_settings(product_id) VALUES(?)').bind(p.id).run();
 await DB.prepare('INSERT OR IGNORE INTO commerce_inventory(product_id,size,stock_on_hand,reserved,active) VALUES(?,?,0,0,1)').bind(p.id,HEALTH_VARIANT).run();
}
export async function readHealthProduct(DB){return DB.prepare(`SELECT p.*,h.partner,h.sellable,h.pathway_ready,h.fulfilment_ready,h.delivery_pence,i.stock_on_hand,i.reserved,i.active FROM products p JOIN health_commerce_settings h ON h.product_id=p.id LEFT JOIN commerce_inventory i ON i.product_id=p.id AND i.size=? WHERE p.sku=?`).bind(HEALTH_VARIANT,HEALTH_SKU).first()}
export function healthPurchaseState(p){
 const finiteInt=v=>typeof v==='number'&&Number.isSafeInteger(v);
 const stock=p&&finiteInt(p.stock_on_hand)&&finiteInt(p.reserved)?Math.max(0,p.stock_on_hand-p.reserved):0;
 const price=p&&finiteInt(p.price_pence)&&p.price_pence>0?p.price_pence:null;
 const delivery=p&&finiteInt(p.delivery_pence)&&p.delivery_pence>=0?p.delivery_pence:null;
 const canBuy=Boolean(p&&p.status==='active'&&p.active===1&&p.sellable===1&&p.pathway_ready===1&&p.fulfilment_ready===1&&String(p.partner||'').trim()&&price!==null&&delivery!==null&&stock>0);
 return {sku:HEALTH_SKU,name:'Testosterone & Energy Check',productType:'home_test',stock,pricePence:price,deliveryPence:delivery,canBuy,message:stock===0?'No stock available today':canBuy?'Available':'Not available to order',checkoutPath:'/v1/commerce/checkout'};
}
export async function reserveHealthStock(DB,id){
 return Number((await DB.prepare(`UPDATE commerce_inventory SET reserved=reserved+1,updated_at=CURRENT_TIMESTAMP WHERE product_id=? AND size=? AND active=1 AND stock_on_hand IS NOT NULL AND stock_on_hand-reserved>=1 AND EXISTS(SELECT 1 FROM products p JOIN health_commerce_settings h ON h.product_id=p.id WHERE p.id=commerce_inventory.product_id AND p.status='active' AND p.price_pence>0 AND h.sellable=1 AND h.pathway_ready=1 AND h.fulfilment_ready=1 AND trim(h.partner)<>'' AND h.delivery_pence IS NOT NULL AND h.delivery_pence>=0)`).bind(id,HEALTH_VARIANT).run()).meta?.changes||0)===1;
}
export async function healthCheckoutSelection(DB,requested){
 if(requested.length!==1||requested[0].sku!==HEALTH_SKU||Number(requested[0].quantity??1)!==1)return {error:'invalid_health_cart',status:400};
 await ensureHealthCommerce(DB);const p=await readHealthProduct(DB),state=healthPurchaseState(p);
 if(!state.canBuy)return {error:'out_of_stock',message:state.message,status:409};
 return {item:{...p,size:'One test',colour:'None',quantity:1,inventoryKey:HEALTH_VARIANT},deliveryPence:state.deliveryPence};
}
export async function updateHealthProduct(DB,b){
 const integer=(n,min=0)=>typeof n==='number'&&Number.isSafeInteger(n)&&n>=min;
 if(!b||!integer(b.pricePence)||!integer(b.stockOnHand)||!(b.deliveryPence===null||integer(b.deliveryPence))||!['draft','active','archived'].includes(b.status)||typeof b.partner!=='string'||b.partner.length>180||!['sellable','pathwayReady','fulfilmentReady'].every(k=>typeof b[k]==='boolean'))throw Error('invalid_health_product');
 const p=await readHealthProduct(DB);if(b.stockOnHand<p.reserved)throw Error('stock_below_reserved');
 await DB.batch([
  DB.prepare('UPDATE products SET price_pence=?,status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(b.pricePence,b.status,p.id),
  DB.prepare('UPDATE health_commerce_settings SET partner=?,sellable=?,pathway_ready=?,fulfilment_ready=?,delivery_pence=?,updated_at=CURRENT_TIMESTAMP WHERE product_id=?').bind(b.partner.trim(),+b.sellable,+b.pathwayReady,+b.fulfilmentReady,b.deliveryPence,p.id),
  DB.prepare('UPDATE commerce_inventory SET stock_on_hand=?,updated_at=CURRENT_TIMESTAMP WHERE product_id=? AND size=? AND reserved<=?').bind(b.stockOnHand,p.id,HEALTH_VARIANT,b.stockOnHand)
 ]);
 return readHealthProduct(DB);
}
