// The legacy client shell can rebuild the server-rendered drawer and footer.
// Restore only the two approved links through the existing post-load hook;
// do not rebuild navigation or observe the document indefinitely.
// Keep this serialized function closure-free, including nested named helpers.
export function restoreCalculatorsMenu(document,pathname){
 const path=String(pathname).replace(/\/+$/,'').replace(/\.html$/,'')||'/';
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
 for(const section of document.querySelectorAll('footer.site-footer .footer-grid section')){
  if(section.querySelector('h2')?.textContent.trim()!=='Explore')continue;
  if(section.querySelector('a[href="/tools"]'))continue;
  const ask=section.querySelector('a[href="/ask-timber"]');
  if(!ask)continue;
  const link=document.createElement('a');
  link.href='/tools';
  link.textContent='Calculators & Tools';
  if(path==='/tools'||path.startsWith('/tools/'))link.setAttribute('aria-current','page');
  ask.after(link);
 }
}
export const CALCULATORS_MENU_SCRIPT=';(()=>{const add=()=>('+restoreCalculatorsMenu.toString()+')(document,location.pathname);if(document.readyState===\'loading\')document.addEventListener(\'DOMContentLoaded\',add,{once:true});else add()})();';
