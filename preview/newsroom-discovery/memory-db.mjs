import { DatabaseSync } from 'node:sqlite';
export function memoryDB(){
 const db=new DatabaseSync(':memory:');
 const wrapper={exec:async sql=>db.exec(sql),prepare(sql){let values=[];return {bind(...v){values=v;return this},async run(){const r=db.prepare(sql).run(...values);return{success:true,meta:{changes:r.changes,last_row_id:r.lastInsertRowid}}},async first(){return db.prepare(sql).get(...values)||null},async all(){return{results:db.prepare(sql).all(...values)}}}},async batch(statements){return Promise.all(statements.map(x=>x.run()))}};
 return wrapper;
}
