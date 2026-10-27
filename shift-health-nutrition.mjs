import range from './content/commerce/olivit-range-draft.json' with {type:'json'};

// Read-only preparation: these candidates are deliberately separate from the sale catalogue.
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const nutritionRange = range;
export function renderNutritionSection() {
  return '<section class="snh" id="supplements-nutrition" aria-labelledby="snh-title" data-nutrition-state="preparing">' +
    '<div class="snh-heading"><div><p class="snh-kicker">SUPPLEMENTS &amp; NUTRITION</p><h2 id="snh-title">Food first.<br>Useful extras, if they fit.</h2></div>' +
    '<p class="snh-intro">Ordinary food does the heavy lifting. We’re preparing a range of optional extras for the days when convenience helps.</p></div>' +
    '<p class="snh-status"><strong>Range in preparation.</strong> Browse the products we’re considering. Ordering is not open yet.</p>' +
    '<div class="snh-groups">' + range.groups.map((group, i) =>
      '<details class="snh-group" id="nutrition-' + esc(group.id) + '"><summary><span class="snh-number">0' + (i + 1) + '</span><span>' + esc(group.label) + '</span><span class="snh-toggle" aria-hidden="true">+</span></summary>' +
      '<div class="snh-group-body"><p>' + esc(group.intro) + '</p><div class="snh-products">' +
      group.products.map(product => '<article class="snh-product"><p class="snh-brand">' + esc(product.brand) + '</p><h3>' + esc(product.name) + '</h3>' +
        (product.supplierPack ? '<p class="snh-pack">Supplier pack: ' + esc(product.supplierPack) + '</p>' : '<p class="snh-pack">Pack size to be confirmed.</p>') +
        '<p class="snh-product-state">Under consideration · not available to order</p></article>').join('') +
      '</div><p class="snh-detail-note">Flavours, ingredients, allergens, serving sizes and pack details will be checked before ordering opens.</p></div></details>'
    ).join('') + '</div>' +
    '<div class="snh-footer"><p>You do not need to buy anything to use My Timber. Food planning, movement and ongoing support stay free.</p>' +
    '<a class="snh-link" href="/member/grub">Start with Grub <span aria-hidden="true">↗</span></a></div>' +
    '<details class="snh-questions"><summary>What to know before choosing</summary><p>Taking weight-management medicine does not mean you need supplements. For treatment or side-effect questions, speak to your own prescriber or pharmacist.</p>' +
    '<p>Before products go on sale, each listing will show its ingredients, allergens, exact pack and price including VAT. Delivery charges and any separate parcels will be clear before payment.</p>' +
    '<p>Supplier packs can contain several bars or tubes. The pack offered by SHIFT will be stated clearly; a case will not be presented as one individual item.</p></details></section>';
}
export function addNutritionSection(main) {
  const marker = '<section class="shv-more">';
  if (main.split(marker).length !== 2 || main.includes('id="supplements-nutrition"')) throw new Error('nutrition_hub_slot_changed');
  return main.replace(marker, () => renderNutritionSection() + marker);
}
export const nutritionStyle = String.raw`
html body main#main-content.shv .snh{margin-top:32px!important;padding:32px!important;border:1px solid #707762!important;border-radius:10px!important;background:#050505!important;color:#e7e3da!important;scroll-margin-top:100px}
html body main#main-content.shv .snh-heading{display:grid!important;grid-template-columns:1.3fr 1fr!important;gap:32px!important;align-items:end!important;margin-bottom:24px!important}
html body main#main-content.shv .snh .snh-kicker{color:#e7e3da!important;font-size:11px!important;letter-spacing:.14em!important;font-weight:700!important;margin-bottom:14px!important}
html body main#main-content.shv .snh h2{font-size:clamp(30px,4vw,48px)!important;line-height:1.05!important;letter-spacing:-.04em!important}
html body main#main-content.shv .snh .snh-intro{font-size:17px!important;line-height:1.6!important}
html body main#main-content.shv .snh .snh-status{padding:14px 18px!important;margin-bottom:22px!important;background:#e7e3da!important;color:#050505!important;font-size:15px!important;border-radius:5px!important}
html body main#main-content.shv .snh-group{border:0!important;border-bottom:1px solid #707762!important;border-radius:0!important;background:#050505!important;margin:0!important;padding:0!important;color:#e7e3da!important}
html body main#main-content.shv .snh summary{cursor:pointer!important;min-height:56px!important;list-style:none!important;color:#e7e3da!important;font-weight:700!important}
html body main#main-content.shv .snh summary::-webkit-details-marker{display:none}
html body main#main-content.shv .snh-group>summary{display:grid!important;grid-template-columns:36px 1fr 24px!important;align-items:center!important;gap:12px!important;padding:18px 0!important;font-size:23px!important}
html body main#main-content.shv .snh-number{font-size:12px!important;font-weight:400!important}
html body main#main-content.shv .snh-toggle{text-align:center!important;font-size:27px!important;line-height:1!important}
html body main#main-content.shv .snh-group[open]>summary .snh-toggle{transform:rotate(45deg)}
html body main#main-content.shv .snh-group-body{padding-bottom:24px!important}
html body main#main-content.shv .snh-group-body>p{font-size:16px!important;margin-bottom:18px!important}
html body main#main-content.shv .snh-products{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:14px!important}
html body main#main-content.shv .snh-product{background:#e7e3da!important;color:#050505!important;border-radius:6px!important;padding:22px!important;min-width:0!important}
html body main#main-content.shv .snh-product .snh-brand{font-size:12px!important;font-weight:700!important;letter-spacing:.04em!important;margin-bottom:12px!important}
html body main#main-content.shv .snh-product h3{color:#050505!important;font-size:23px!important;line-height:1.2!important;margin:0 0 16px!important;letter-spacing:-.02em!important;overflow-wrap:anywhere!important}
html body main#main-content.shv .snh-product .snh-pack{font-size:14px!important;margin-bottom:14px!important}
html body main#main-content.shv .snh-product .snh-product-state{font-size:12px!important;border-top:1px solid #707762!important;padding-top:12px!important}
html body main#main-content.shv .snh .snh-detail-note{font-size:13px!important;margin:16px 0 0!important}
html body main#main-content.shv .snh-footer{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:24px!important;padding:24px 0!important}
html body main#main-content.shv .snh-footer>p{font-size:15px!important;max-width:650px!important}
html body main#main-content.shv .snh .snh-link{display:inline-flex!important;gap:20px!important;align-items:center!important;justify-content:space-between!important;flex-shrink:0!important;background:#e7e3da!important;color:#050505!important;border-radius:5px!important;padding:13px 18px!important;min-height:48px!important;font-size:14px!important;font-weight:700!important}
html body main#main-content.shv .snh-questions{border:1px solid #707762!important;border-radius:6px!important;padding:0 18px!important;background:#050505!important}
html body main#main-content.shv .snh-questions>summary{display:flex!important;align-items:center!important;text-decoration:underline!important;font-size:14px!important}
html body main#main-content.shv .snh-questions>p{font-size:14px!important;margin-bottom:16px!important}
html body main#main-content.shv .snh :is(a,summary):focus-visible{outline:3px solid #e7e3da!important;outline-offset:4px!important}
@media(max-width:700px){html body main#main-content.shv .snh{padding:23px!important}html body main#main-content.shv .snh-heading{grid-template-columns:1fr!important;gap:18px!important}html body main#main-content.shv .snh-products{grid-template-columns:1fr!important}html body main#main-content.shv .snh-footer{display:block!important}html body main#main-content.shv .snh .snh-link{margin-top:18px!important}html body main#main-content.shv .snh-group>summary{font-size:20px!important;grid-template-columns:24px 1fr 20px!important}}
`;
