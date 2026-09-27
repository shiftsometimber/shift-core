const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'}});
const clean=(value,max=5000)=>String(value??'').trim().slice(0,max);
const pageKey=path=>`page:${clean(path,240)||'/'}`;

export class SiteContentState {
  constructor(state){this.storage=state.storage}
  async fetch(request){
    if(request.method!=='POST')return json({ok:false,error:'method_not_allowed'},405);
    const route=new URL(request.url).pathname;
    const body=await request.json().catch(()=>({}));
    if(route==='/read'){
      const path=clean(body.path||'/',240);
      const overrides=await this.storage.get(pageKey(path))||[];
      return json({ok:true,path,overrides});
    }
    if(route==='/read-all'){
      const rows=await this.storage.list({prefix:'page:'}),overrides=[];
      for(const [key,value] of rows.entries())for(const item of value||[])overrides.push({...item,page_path:key.slice(5)});
      return json({ok:true,overrides});
    }
    if(route==='/publish'){
      const path=clean(body.pagePath,240),contentKey=clean(body.contentKey,100);
      if(!path.startsWith('/')||!contentKey)return json({ok:false,error:'invalid_content'},400);
      const key=pageKey(path),existing=await this.storage.get(key)||[];
      const item={content_key:contentKey,css_selector:clean(body.cssSelector,300),published_text:clean(body.publishedText,5000),version:Number(body.version||1)};
      const next=existing.filter(row=>row.content_key!==contentKey);
      next.push(item);
      await this.storage.put(key,next);
      return json({ok:true,path,contentKey,version:item.version});
    }
    if(route==='/pause'){
      const path=clean(body.pagePath,240),contentKey=clean(body.contentKey,100),key=pageKey(path);
      const existing=await this.storage.get(key)||[];
      const next=existing.filter(row=>row.content_key!==contentKey);
      if(next.length)await this.storage.put(key,next);else await this.storage.delete(key);
      return json({ok:true,path,contentKey});
    }
    if(route==='/reset-synthetic'){
      await this.storage.delete(pageKey('/__synthetic-hq-closeout'));
      return json({ok:true});
    }
    return json({ok:false,error:'not_found'},404);
  }
}
