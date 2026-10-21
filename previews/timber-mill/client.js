(() => {
  'use strict';
  const root = document.querySelector('[data-timber-mill-version]');
  if (!root) return;
  const tiles = [...root.querySelectorAll('[data-tm-product]')];
  const variants = [...root.querySelectorAll('[data-tm-variant]')];
  const colours = {'ash-green': 'Ash Green', cream: 'Cream', black: 'Black'};
  const categories = ['all', 'clothing', 'accessories', 'equipment'];
  const validColour = value => Object.hasOwn(colours, value) ? value : 'ash-green';

  function showColour(item, value) {
    const colour = validColour(value), label = colours[colour], slug = item.dataset.tmVariant;
    const img = item.querySelector('[data-tm-image]');
    const src = '/assets/products/' + slug + '/' + colour + '.webp?v=timber4';
    if (img.getAttribute('src') !== src) img.setAttribute('src', src);
    img.alt = item.dataset.tmName + ' in ' + label;
    item.querySelectorAll('[data-tm-colour]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.tmColour === colour)));
    item.querySelector('[data-tm-colour-name]').textContent = label;
    item.querySelectorAll('[data-tm-item-link]').forEach(a => a.setAttribute('href', '/shop?item=' + encodeURIComponent(slug) + '&colour=' + colour));
  }
  function render() {
    const url = new URL(location.href), saved = history.state?.tmColours || {};
    variants.forEach(item => showColour(item, tiles.length ? saved[item.dataset.tmVariant] : url.searchParams.get('colour')));
    if (!tiles.length) return;
    const raw = url.searchParams.get('category'), category = categories.includes(raw) ? raw : 'all';
    const expanded = url.searchParams.get('range') === 'all' || category !== 'all';
    let visible = 0;
    tiles.forEach((tile, i) => {const show = category === 'all' ? (expanded || i < 6) : tile.dataset.tmCategory === category; tile.hidden = !show; if (show) visible++;});
    root.querySelectorAll('[data-tm-filter]').forEach(a => {const current = a.dataset.tmFilter === category; a.classList.toggle('tm-selected', current); if (current) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');});
    root.querySelector('[data-tm-all]').hidden = expanded;
    root.querySelector('#tm-count').textContent = category === 'all' ? 'Showing ' + visible + ' of ' + tiles.length + ' items.' : visible + ' ' + category + ' items.';
  }
  root.addEventListener('submit', e => {
    const form = e.target.closest('[data-tm-colour-form]'), button = e.submitter;
    if (!form || !button || !Object.hasOwn(colours, button.dataset.tmColour)) return;
    e.preventDefault();
    const item = form.closest('[data-tm-variant]'), colour = button.dataset.tmColour;
    showColour(item, colour);
    if (tiles.length) {
      history.replaceState({...history.state, tmColours: {...history.state?.tmColours, [item.dataset.tmVariant]: colour}}, '', location.href);
    } else {
      const url = new URL(location.href);
      url.searchParams.set('colour', colour);
      history.replaceState(history.state, '', url.pathname + url.search + url.hash);
    }
  });
  root.addEventListener('click', e => {
    const link = e.target.closest('a[data-tm-filter],a[data-tm-all],a[data-tm-category-link]');
    if (!link || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    const next = new URL(link.href);
    history.pushState(history.state, '', next.pathname + next.search + next.hash);
    render();
    if (link.hasAttribute('data-tm-category-link')) {
      root.querySelector('#range').scrollIntoView({block: 'start', behavior: matchMedia('(prefers-reduced-motion:reduce)').matches ? 'instant' : 'smooth'});
      root.querySelector('#tm-range-title').focus({preventScroll: true});
    }
  });
  addEventListener('popstate', render);
  render();
})();
