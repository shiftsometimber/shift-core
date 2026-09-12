// One owner-scoped aggregate per account: a single conditional write atomically
// stores plan, shopping state, review and decision history. No shared tables changed.
export const SCHEMA=`CREATE TABLE IF NOT EXISTS programme_v1_accounts (user_id INTEGER PRIMARY KEY, revision INTEGER NOT NULL DEFAULT 0, state_json TEXT NOT NULL, updated_at TEXT NOT NULL);`;
export class ProgrammeStore{
 constructor(db){this.db=db}
 async get(userId){const row=await this.db.prepare('SELECT revision,state_json FROM programme_v1_accounts WHERE user_id=?').bind(userId).first();return row?{...JSON.parse(row.state_json),revision:row.revision}:null}
 async create(userId,state){const result=await this.db.prepare('INSERT OR IGNORE INTO programme_v1_accounts(user_id,revision,state_json,updated_at) VALUES(?,0,?,?)').bind(userId,JSON.stringify(state),new Date().toISOString()).run();return result.meta.changes===1}
 async save(userId,expected,next){const result=await this.db.prepare('UPDATE programme_v1_accounts SET revision=revision+1,state_json=?,updated_at=? WHERE user_id=? AND revision=?').bind(JSON.stringify({...next,revision:expected+1}),new Date().toISOString(),userId,expected).run();return result.meta.changes===1}
}
