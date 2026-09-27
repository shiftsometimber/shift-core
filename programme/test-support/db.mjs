import {DatabaseSync} from 'node:sqlite';
export function sqliteAdapter(filename=':memory:'){
 const sqlite=new DatabaseSync(filename);sqlite.exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;');
 return {sqlite,prepare(sql){let values=[];const statement=sqlite.prepare(sql);const api={bind(...v){values=v;return api},async first(){return statement.get(...values)||null},async all(){return {results:statement.all(...values)}},async run(){const r=statement.run(...values);return {success:true,meta:{changes:Number(r.changes)}}}};return api}};
}
