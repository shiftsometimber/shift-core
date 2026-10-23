// Public shell placeholder only. No destination, activation flag or data access.
export const causesLabel = '<span class="sst-causes-teaser" role="link" aria-disabled="true">Our Causes &amp; Partners</span>';
const css = '<style id="sst-causes-teaser-css">.sst-causes-teaser{color:#8b8b86!important;cursor:default;pointer-events:none;text-decoration:none!important;font:inherit;display:block;padding:12px 0}.site-drawer .sst-causes-teaser{font-weight:700;border-top:1px solid #707762}footer.site-footer .sst-causes-teaser{padding:6px 0;font-size:12px;font-weight:700}.sst-global-menu .sst-causes-teaser{padding:15px;border-bottom:1px solid rgba(5,5,5,.2)}</style>';
export function addCausesTeaser(html, path='/') {
  if(typeof html!=='string'||!/<html\b/i.test(html)||!/<\/head>/i.test(html)||!/<\/body>/i.test(html))return html;
  if(/^\/(?:v1|api|hq|staging)(?:\/|$)/.test(path)||html.includes('id="sst-causes-teaser-css"'))return html;
  let changed=false;
  const add=block=>{if(block.includes('sst-causes-teaser'))return block;changed=true;return block.replace(/<\/nav>/i,causesLabel+'</nav>');};
  let next=html.replace(/<aside\b[^>]*id=["']site-drawer["'][^>]*>[\s\S]*?<\/aside>/i,add);
  next=next.replace(/<nav\b[^>]*class=["'][^"']*\bsst-global-menu\b[^"']*["'][^>]*>[\s\S]*?<\/nav>/i,add);
  next=next.replace(/<footer\b[^>]*(?:class=["'][^"']*\bsite-footer\b[^"']*["']|id=["']sst-footer-c["'])[^>]*>[\s\S]*?<\/footer>/i,block=>{
    if(block.includes('sst-causes-teaser')||!/<h2>Support<\/h2>/.test(block))return block;
    changed=true;return block.replace(/(<h2>Support<\/h2>)/,'$1'+causesLabel);
  });
  return changed?next.replace('</head>',css+'</head>'):html;
}
export async function withCausesTeaser(request,response){
  if(request.method!=='GET'||!response?.ok||!response.headers.get('content-type')?.includes('text/html'))return response;
  const path=new URL(request.url).pathname;
  if(/^\/(?:v1|api|hq|staging)(?:\/|$)/.test(path))return response;
  const original=await response.text(),next=addCausesTeaser(original,path);
  const headers=new Headers(response.headers);
  if(next!==original)for(const name of ['content-length','etag','last-modified','content-encoding'])headers.delete(name);
  return new Response(next,{status:response.status,statusText:response.statusText,headers});
}
