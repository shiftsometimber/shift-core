export function addNewsroomMenu(html) {
  return html.replace(/<aside\b[^>]*class="[^"]*site-drawer[^"]*"[^>]*>[\s\S]*?<\/aside>/gi, drawer => {
    if (drawer.includes('href="/shift-newsroom"')) return drawer;
    return drawer.replace('<a href="/shop">', '<a href="/shift-newsroom">SHIFT Newsroom</a><a href="/shop">');
  });
}
// The shared script also covers independently served member shells.
export const NEWSROOM_MENU_SCRIPT = `;(()=>{const add=()=>{for(const nav of document.querySelectorAll('.site-drawer[data-header-v2] nav')){if(nav.querySelector('a[href="/shift-newsroom"]'))continue;const next=nav.querySelector('a[href="/shop"]');if(!next)continue;const link=document.createElement('a');link.href='/shift-newsroom';link.textContent='SHIFT Newsroom';next.before(link)}};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',add,{once:true});else add()})();`;
