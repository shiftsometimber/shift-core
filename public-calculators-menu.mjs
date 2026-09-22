// The existing v42 asset rebuilds the public drawer after server rendering.
// Use its established post-load menu hook; do not rebuild other navigation,
// observe the page indefinitely or alter independently served member menus.
export function restoreCalculatorsMenu(document,pathname){
 const path=String(pathname).replace(/\.html$/,'').replace(/\/+$/,'')||'/';
 if(/^\/(?:member(?:\/|$)|v1(?:\/|$)|hq(?:\/|$)|api(?:\/|$)|staging(?:\/|$))/.test(path))return;
 for(const nav of document.querySelectorAll('.site-drawer[data-header-v2] nav')){
  if(nav.querySelector('a[href="/tools"]'))continue;
  const contact=nav.querySelector('a[href="/contact"]');
  if(!contact)continue;
  const link=document.createElement('a');
  link.href='/tools';
  link.textContent='Calculators & Tools';
  if(path==='/tools'||path.startsWith('/tools/'))link.setAttribute('aria-current','page');
  contact.before(link);
 }
}
export const CALCULATORS_MENU_SCRIPT=';(()=>{const add=()=>('+restoreCalculatorsMenu.toString()+')(document,location.pathname);if(document.readyState===\'loading\')document.addEventListener(\'DOMContentLoaded\',add,{once:true});else add()})();';
