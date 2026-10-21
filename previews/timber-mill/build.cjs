const fs = require('fs'), path = require('path');
const r = __dirname;
const products = JSON.parse(fs.readFileSync(path.join(r, 'products.json')));
const colours = [{id: 'ash-green', name: 'Ash Green'}, {id: 'cream', name: 'Cream'}, {id: 'black', name: 'Black'}];
const arrow = '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 12h16m-6-6 6 6-6 6"/></svg>';
const backArrow = '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M20 12H4m6-6-6 6 6 6"/></svg>';
const escape = s => s.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const image = (p, colour = 'ash-green') => '/assets/products/' + p.slug + '/' + colour + '.webp?v=timber4';
const itemURL = (p, colour = 'ash-green') => '/shop?item=' + p.slug + '&amp;colour=' + colour;
const template = fs.readFileSync(path.join(r, 'main.html'), 'utf8'), detail = fs.readFileSync(path.join(r, 'detail.html'), 'utf8');
const categories = ['all', 'clothing', 'accessories', 'equipment'];
const labels = {all: 'All', clothing: 'Clothing', accessories: 'Accessories', equipment: 'Equipment'};

function swatches(p, selected = 'ash-green') {
  return '<form class="tm-colours" action="/shop" method="get" data-tm-colour-form aria-label="Colour for ' + escape(p.name) + '">' +
    '<input type="hidden" name="item" value="' + p.slug + '">' +
    '<div class="tm-swatches" role="group" aria-label="Choose a colour">' + colours.map(c =>
      '<button class="tm-swatch" type="submit" name="colour" value="' + c.id + '" data-tm-colour="' + c.id + '" aria-label="' + c.name + '" aria-pressed="' + (c.id === selected) + '" title="' + c.name + '"><span class="tm-swatch-dot tm-' + c.id + '" aria-hidden="true"></span></button>'
    ).join('') + '</div><p class="tm-colour-label" aria-live="polite" aria-atomic="true">Colour: <span data-tm-colour-name>' + colours.find(c => c.id === selected).name + '</span></p></form>';
}

function catalogue(category = 'all', expanded = false) {
  let count = 0;
  const tiles = products.map((p, i) => {
    const visible = category === 'all' ? (expanded || i < 6) : p.category === category;
    if (visible) count++;
    return '<article class="tm-product" data-tm-product data-tm-category="' + p.category + '" data-tm-variant="' + p.slug + '" data-tm-name="' + escape(p.name) + '"' + (visible ? '' : ' hidden') + '>' +
      '<a class="tm-item" data-tm-item-link href="' + itemURL(p) + '"><div class="tm-product-art"><img data-tm-image src="' + image(p) + '" alt="' + escape(p.name) + ' in Ash Green" width="1254" height="1254" loading="lazy"></div><h3>' + escape(p.name) + '</h3></a>' +
      swatches(p) + '<a class="tm-item-link" data-tm-item-link href="' + itemURL(p) + '">View item ' + arrow + '</a></article>';
  }).join('\n');
  const filters = categories.map(c => '<a href="/shop?category=' + c + (c === 'all' ? '&amp;range=all' : '') + '#range" data-tm-filter="' + c + '"' + (c === category ? ' class="tm-selected" aria-current="true"' : '') + '>' + labels[c] + '</a>').join('');
  return template.replaceAll('{{arrow}}', arrow).replace('{{filters}}', filters).replace('{{products}}', tiles).replace('{{count}}', category === 'all' ? 'Showing ' + count + ' of ' + products.length + ' items.' : count + ' ' + category + ' items.').replace('{{allhidden}}', expanded || category !== 'all' ? ' hidden' : '');
}
function item(p, colour = 'ash-green') {
  return detail.replaceAll('{{name}}', escape(p.name)).replaceAll('{{slug}}', p.slug)
    .replace('{{category}}', labels[p.category]).replace('{{description}}', escape(p.description))
    .replace('{{image}}', image(p, colour)).replace('{{colourName}}', colours.find(c => c.id === colour).name)
    .replace('{{swatches}}', swatches(p, colour)).replaceAll('{{arrow}}', arrow).replace('{{backArrow}}', backArrow);
}
const categoryPages = Object.fromEntries(categories.map(c => [c, catalogue(c, c !== 'all')]));
const detailPages = Object.fromEntries(products.map(p => [p.slug, item(p)]));
const detailColourPages = Object.fromEntries(products.map(p => [p.slug, Object.fromEntries(colours.map(c => [c.id, item(p, c.id)]))]));
const images = Object.fromEntries(['hero.webp', 'feature.webp'].map(n => [n, fs.readFileSync(path.join(r, 'assets', n)).toString('base64')]));
const data = {main: categoryPages.all, fullMain: catalogue('all', true), categoryPages, detailPages, detailColourPages, colours, products, style: fs.readFileSync(path.join(r, 'style.css'), 'utf8'), client: fs.readFileSync(path.join(r, 'client.js'), 'utf8'), images};
fs.writeFileSync(path.join(r, 'content.mjs'), Object.entries(data).map(([k, v]) => 'export const ' + k + '=' + JSON.stringify(v) + ';').join('\n') + '\n');
