import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import test from 'node:test';
import {babyLoveRoutes,PATH} from './webhook.mjs';
function database(){
  const sqlite=new DatabaseSync(':memory:');
  const DB={
    sqlite,
    async exec(query){for(const line of query.trim().split('\n'))sqlite.exec(line);return{success:true}},
    prepare(sql){
      const args=[];
      return{
        bind(...values){args.push(...values);return this},
        async run(){const result=sqlite.prepare(sql).run(...args);return{success:true,meta:{changes:Number(result.changes)}}},
        async first(){return sqlite.prepare(sql).get(...args)||null},
        async all(){return{success:true,results:sqlite.prepare(sql).all(...args)}}
      };
    },
    async batch(statements){
      sqlite.exec('BEGIN');
      try{const results=[];for(const statement of statements)results.push(await statement.run());sqlite.exec('COMMIT');return results}
      catch(error){sqlite.exec('ROLLBACK');throw error}
    }
  };
  return DB;
}


const secret='synthetic-test-secret-with-at-least-32-characters';
const payload={id:10,title:'Test article',slug:'test-article',metaDescription:'Test summary',content_markdown:'# Test article\n\nTest content.',content_html:'<h1>Test article</h1>',heroImageUrl:'https://example.invalid/test.jpg',jsonLd:{'@type':'Article'}};
function setup(){const DB=database();DB.sqlite.exec(`CREATE TABLE knowledge_articles(id INTEGER PRIMARY KEY,title TEXT,slug TEXT UNIQUE,category TEXT,author TEXT,status TEXT,summary TEXT,body TEXT,seo_title TEXT,publish_at TEXT)`);return{DB,BABYLOVE_WEBHOOK_TOKEN:secret};}
function request(p=payload,headers={}){return new Request('https://example.invalid'+PATH,{method:'POST',headers:{Authorization:'Bearer '+secret,'Content-Type':'application/json',...headers},body:JSON.stringify(p)});}
test('unrelated routes untouched; missing config and wrong token fail closed',async()=>{assert.equal(await babyLoveRoutes(new Request('https://example.invalid/'),{}),null);assert.equal((await babyLoveRoutes(request(),{})).status,503);const env=setup();assert.equal((await babyLoveRoutes(request(payload,{Authorization:'Bearer wrong'}),env)).status,401);assert.equal(env.DB.sqlite.prepare('SELECT count(*) n FROM knowledge_articles').get().n,0);env.DB.sqlite.close();});
test('trusted documented payload auto-publishes and retains metadata',async()=>{const env=setup();try{const r=await babyLoveRoutes(request({...payload,status:'published'}),env);assert.equal(r.status,200);assert.match(r.headers.get('Content-Type'),/application\/json/);const b=await r.json();assert.equal(b.published,true);assert.equal(b.link,'/articles/test-article');const row=env.DB.sqlite.prepare('SELECT * FROM knowledge_articles').get();assert.equal(row.status,'published');assert.ok(row.publish_at);assert.equal(row.body,payload.content_markdown);const raw=JSON.parse(env.DB.sqlite.prepare('SELECT payload_json FROM babylove_receipts').get().payload_json);assert.equal(raw.heroImageUrl,payload.heroImageUrl);}finally{env.DB.sqlite.close();}});
test('identical retry succeeds without duplicate; changed content cannot overwrite',async()=>{const env=setup();try{await babyLoveRoutes(request(),env);const retry=await babyLoveRoutes(request(),env);const retryBody=await retry.json();assert.equal(retryBody.duplicate,true);assert.equal(retryBody.published,true);assert.equal((await babyLoveRoutes(request({...payload,title:'Changed'}),env)).status,409);assert.equal(env.DB.sqlite.prepare('SELECT count(*) n FROM knowledge_articles').get().n,1);assert.equal(env.DB.sqlite.prepare('SELECT title FROM knowledge_articles').get().title,payload.title);}finally{env.DB.sqlite.close();}});
test('existing live article slug stays unchanged; receipt transaction rolls back',async()=>{const env=setup();try{env.DB.sqlite.prepare("INSERT INTO knowledge_articles(title,slug,status) VALUES('Existing','test-article','published')").run();assert.equal((await babyLoveRoutes(request(),env)).status,409);assert.equal(env.DB.sqlite.prepare('SELECT title FROM knowledge_articles').get().title,'Existing');assert.equal(env.DB.sqlite.prepare('SELECT count(*) n FROM babylove_receipts').get().n,0);}finally{env.DB.sqlite.close();}});
test('invalid and oversized input rejected before storage',async()=>{const env=setup();try{for(const p of [{...payload,id:null},{...payload,slug:'../home'},{...payload,content_markdown:''},[],null])assert.equal((await babyLoveRoutes(request(p),env)).status,400);assert.equal((await babyLoveRoutes(request({...payload,extra:'x'.repeat(400001)}),env)).status,413);assert.equal((await babyLoveRoutes(request(payload,{'Content-Type':'text/plain'}),env)).status,415);}finally{env.DB.sqlite.close();}});
test('X-API-Key works only without Authorization; conflicting credentials fail',async()=>{const env=setup();try{const r=request();r.headers.delete('Authorization');r.headers.set('X-API-Key',secret);assert.equal((await babyLoveRoutes(r,env)).status,200);assert.equal((await babyLoveRoutes(request(payload,{'Authorization':'Bearer wrong','X-API-Key':secret}),env)).status,401);}finally{env.DB.sqlite.close();}});
test('database failures never acknowledged as received',async()=>{const env={BABYLOVE_WEBHOOK_TOKEN:secret,DB:{prepare(){throw new Error('offline')}}};const r=await babyLoveRoutes(request(),env);assert.equal(r.status,503);assert.equal((await r.json()).success,false);});
test('hashed verifier accepts the private token and rejects its public hash as a bearer',async()=>{const env=setup();try{const {createHash}=await import('node:crypto');env.BABYLOVE_WEBHOOK_TOKEN_SHA256=createHash('sha256').update(secret).digest('hex');delete env.BABYLOVE_WEBHOOK_TOKEN;assert.equal((await babyLoveRoutes(request(),env)).status,200);assert.equal((await babyLoveRoutes(request(payload,{Authorization:'Bearer '+env.BABYLOVE_WEBHOOK_TOKEN_SHA256}),env)).status,401);}finally{env.DB.sqlite.close();}});
test('malformed verifier fails closed even when a legacy token is available',async()=>{const env=setup();try{env.BABYLOVE_WEBHOOK_TOKEN_SHA256='invalid';assert.equal((await babyLoveRoutes(request(),env)).status,503);}finally{env.DB.sqlite.close();}});
test('metadata-only retry acknowledges the existing record without replacing reviewed content',async()=>{const env=setup();try{await babyLoveRoutes(request(),env);env.DB.sqlite.prepare("UPDATE knowledge_articles SET body='Editorial correction',status='published'").run();const result=await babyLoveRoutes(request({...payload,createdAt:'new delivery timestamp',keywords:['changed bookkeeping'],jsonLd:{updated:true}}),env);assert.equal(result.status,200);assert.equal((await result.json()).duplicate,true);assert.equal(env.DB.sqlite.prepare('SELECT body FROM knowledge_articles').get().body,'Editorial correction');assert.equal((await babyLoveRoutes(request({...payload,heroImageUrl:'https://example.invalid/changed.jpg'}),env)).status,409);}finally{env.DB.sqlite.close()}});

test('vendor can explicitly request draft without accidental publication',async()=>{const env=setup();try{const r=await babyLoveRoutes(request({...payload,status:'draft'}),env);const body=await r.json();assert.equal(body.published,false);assert.equal(env.DB.sqlite.prepare('SELECT status FROM knowledge_articles').get().status,'draft');}finally{env.DB.sqlite.close();}});
