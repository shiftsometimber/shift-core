import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {initialState,seed} from './store.mjs';
class Statement{
 constructor(db,sql){this.db=db;this.sql=sql;this.args=[];}
 bind(...args){this.args=args;return this;}
 async first(){return this.db.prepare(this.sql).get(...this.args)||null;}
 async all(){return{results:this.db.prepare(this.sql).all(...this.args)};}
 async run(){const r=this.db.prepare(this.sql).run(...this.args);return{success:true,meta:{changes:Number(r.changes)}};}
}
export class SQLiteTestDB{
 constructor(path=':memory:'){this.sqlite=new DatabaseSync(path);this.sqlite.exec(readFileSync(new URL('./schema.sql',import.meta.url),'utf8'));}
 prepare(sql){return new Statement(this.sqlite,sql);}
 async batch(statements){this.sqlite.exec('BEGIN IMMEDIATE');try{const r=[];for(const s of statements)r.push(await s.run());this.sqlite.exec('COMMIT');return r;}catch(e){this.sqlite.exec('ROLLBACK');throw e;}}
 close(){this.sqlite.close();}
}
export async function fixture(t){const DB=new SQLiteTestDB();t?.after(()=>DB.close());await seed(DB,'synthetic-one');await seed(DB,'synthetic-two');return DB;}
export function busyState(now=Date.now()){
 const s=initialState();s.facts=[{id:'goal-one',key:'goal',value:'Enjoy time with the family',confirmed:true,source:'member',at:now},{id:'week-one',key:'week',value:'Three late shifts and no free evenings',confirmed:true,source:'member',at:now},{id:'focus-one',key:'focus',value:'food',confirmed:true,source:'member',at:now}];return s;
}
