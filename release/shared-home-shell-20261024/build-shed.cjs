const fs=require('fs'),r=__dirname,d='/Users/shiftsometimberltd/SST/website-review-evidence-20261023/shared-shell-20261024',master=JSON.parse(fs.readFileSync(r+'/home-master.json')),css=fs.readFileSync(r+'/home-master.css','utf8')+'\n'+fs.readFileSync(r+'/home-contract.css','utf8'),before=JSON.parse(fs.readFileSync(d+'/shed-before.json'));
const helper='const master='+JSON.stringify(master)+',css='+JSON.stringify(css)+';\n'+String.raw`export function applyHomeShell(html){
 if(!/<html\b/.test(html)||!/<\/body>/.test(html))return html;
 html=html.replace(/<header class="top"><a class="brand"[\s\S]*?<\/a>([\s\S]*?)<\/header>/,'<nav class="top" aria-label="Timber Shed account">$1</nav>');
 html=html.replace(/<footer class="footer">([\s\S]*?)<\/footer>/,'<aside class="footer" role="note">$1</aside>');
 html=html.replace(/<body([^>]*)>/,'<body$1>'+master.header+master.drawer+master.backdrop);
 html=html.replace('</head>','<style id="shift-home-shell-server">'+css+'</style></head>');
 html=html.replace('</body>',master.footer+'<script src="/assets/v42.js?v=home-shell-20261024" defer></script></body>');
 return html;
}
`;
fs.writeFileSync(r+'/server-component.mjs',helper);
const wrapper='import original from "./shed-original/'+before.entrypoint+'";\nimport {applyHomeShell} from "./server-component.mjs";\n'+String.raw`export function wrap(worker){return {...worker,async fetch(request,env,ctx){
 const response=await worker.fetch(request,env,ctx);
 const path=new URL(request.url).pathname;
 if(request.method!=='GET'||!/^\/(?:member\/)?timber-shed(?:\/|\.html)?$/.test(path)||!response.ok||!(response.headers.get('Content-Type')||'').includes('text/html'))return response;
 const html=applyHomeShell(await response.text()),headers=new Headers(response.headers);
 for(const name of ['Content-Length','Content-Encoding','ETag','Last-Modified'])headers.delete(name);
 headers.set('X-Shift-Home-Shell','homepage-master-20261024');
 return new Response(html,{status:response.status,statusText:response.statusText,headers});
}}}
export default wrap(original);
`;
fs.writeFileSync(r+'/shed-wrapper.mjs',wrapper);console.log('Built Shed wrapper; original deployed module untouched');
