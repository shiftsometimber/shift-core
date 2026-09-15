import fs from 'node:fs';
export function lifeBackPreviewAssets(){
 const root='preview/fit-grub/life-back',assets={};
 for(const [route,file,type] of [['/member/life-back','index.html','text/html'],['/life-back.css','style.css','text/css'],['/life-back-client.mjs','client.mjs','text/javascript'],['/life-back-model.mjs','model.mjs','text/javascript'],['/life-back-icons.mjs','icons.mjs','text/javascript']])assets[route]={type,body:fs.readFileSync(root+'/'+file,'utf8')};
 fs.mkdirSync('preview/fit-grub/public/life-back-images',{recursive:true});
 fs.copyFileSync('frontend/member/sst-logo-official.png','preview/fit-grub/public/life-back-images/logo.png');
 if(fs.existsSync(root+'/win.webp'))fs.copyFileSync(root+'/win.webp','preview/fit-grub/public/life-back-images/win.webp');
 assets['/life-back-phone']={type:'text/html',body:`<!doctype html><html lang="en-GB"><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Life Back · phone preview</title><style>body{background:#050505;color:#e7e3da;font:16px Arial;margin:20px}nav{display:flex;gap:12px;flex-wrap:wrap;align-items:center;justify-content:center;margin-bottom:20px}a{color:inherit}button{background:#e7e3da;color:#3e4932;padding:12px;border:0;border-radius:5px;font:inherit;cursor:pointer}iframe{display:block;width:390px;height:850px;max-width:100%;border:1px solid #707762;margin:auto}</style></head><body><nav><a href="/member/life-back">Open full preview</a><button data-width="375">375px</button><button data-width="390">390px</button><button data-width="430">430px</button></nav><iframe title="Life Back phone preview" src="/member/life-back"></iframe><script>document.querySelectorAll('[data-width]').forEach(b=>b.addEventListener('click',()=>document.querySelector('iframe').style.width=b.dataset.width+'px'));</script></body></html>`};
 return assets;
}
