// Shared, local-only image enlargement. No account, plan or tracking mutations.
export function installMemberImageViewer() {
  if (window.__sstMemberImageViewer) return;
  window.__sstMemberImageViewer = true;
  const selector = 'img.sf-approved-exercise-image,.grub-food-image img,img[src^="/assets/member-experience/food/"]';
  const style = document.createElement('style');
  style.textContent = `
button.sst-image-open{display:block!important;position:relative!important;width:100%!important;min-width:0!important;min-height:0!important;margin:0!important;padding:0!important;border:0!important;border-radius:inherit!important;background:transparent!important;cursor:zoom-in!important;line-height:normal!important;box-shadow:none!important}
button.sst-image-open:focus-visible{outline:3px solid #707762!important;outline-offset:3px!important}
.sst-image-hint{position:absolute;bottom:2px;right:2px;background:#050505;color:#E7E3DA;border-radius:4px;padding:2px 4px;font:10px/1.2 system-ui;pointer-events:none}
dialog.sst-image-viewer{box-sizing:border-box!important;position:fixed!important;inset:0!important;margin:auto!important;padding:16px!important;width:calc(100vw - 16px)!important;max-width:1024px!important;height:min(88dvh,900px)!important;max-height:calc(100dvh - 32px)!important;border:1px solid #707762!important;border-radius:16px!important;background:#E7E3DA!important;color:#050505!important;overflow:hidden!important;box-shadow:0 12px 60px #0008!important}
dialog.sst-image-viewer[open]{display:flex!important;flex-direction:column!important;gap:12px!important}
dialog.sst-image-viewer::backdrop{background:#000c}
.sst-image-viewer header{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:12px!important;flex:none!important}
.sst-image-viewer h2{margin:0!important;font:700 18px/1.3 system-ui!important;overflow-wrap:anywhere!important}
.sst-image-viewer button:not(.sst-image-open){font:600 16px/1.2 system-ui!important;background:#050505!important;color:#E7E3DA!important;border:0!important;border-radius:8px!important;padding:12px 16px!important;min-height:44px!important;cursor:pointer!important;flex:none!important}
.sst-image-stage{flex:1!important;min-height:0!important;overflow:auto!important;overscroll-behavior:contain;touch-action:pan-x pan-y pinch-zoom;background:#fff;border-radius:8px}
.sst-image-stage img{display:block!important;max-width:none!important;max-height:none!important;height:auto!important;object-fit:contain!important;margin:0!important;cursor:zoom-in}
.sst-image-viewer footer{display:flex!important;flex-wrap:wrap!important;align-items:center!important;gap:12px!important;flex:none!important;margin:0!important;padding:0!important;background:transparent!important}
.sst-image-viewer p{margin:0!important;font:14px/1.4 system-ui!important}
`;
  document.head.append(style);
  let viewer, image, zoomButton, opener, zoom = 1, fit = false;
  function sizeImage() {
    if (!viewer?.open) return;
    image.style.width = image.parentElement.clientWidth * zoom + 'px';
    zoomButton.textContent = zoom === 1 ? 'Zoom in' : 'Zoom out';
    image.style.cursor = zoom === 1 ? 'zoom-in' : 'zoom-out';
  }
  function close() { if (viewer?.open) viewer.close(); }
  function makeViewer() {
    viewer = document.createElement('dialog');
    viewer.className = 'sst-image-viewer';
    viewer.setAttribute('aria-labelledby', 'sst-image-viewer-title');
    viewer.innerHTML = '<header><h2 id="sst-image-viewer-title"></h2><button type="button" data-image-close aria-label="Close enlarged image">Close</button></header><div class="sst-image-stage"><img alt=""></div><footer><button type="button" data-image-zoom>Zoom in</button><p>Zoom in, then swipe across to see the detail.</p></footer>';
    document.body.append(viewer);
    image = viewer.querySelector('img');
    zoomButton = viewer.querySelector('[data-image-zoom]');
    viewer.querySelector('[data-image-close]').onclick = close;
    zoomButton.onclick = image.onclick = () => { zoom = zoom === 1 ? (fit ? 3 : 2) : 1; sizeImage(); };
    viewer.addEventListener('click', event => {
      if (event.target !== viewer) return;
      const r = viewer.getBoundingClientRect();
      if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) close();
    });
    viewer.addEventListener('close', () => { if (opener?.isConnected) opener.focus({preventScroll:true}); });
    image.addEventListener('error', () => { viewer.querySelector('footer p').textContent = 'Image could not load. Close and try again.'; });
    window.addEventListener('resize', sizeImage);
    window.addEventListener('hashchange', close);
  }
  function open(button) {
    const thumbnail = button.querySelector('img');
    if (!thumbnail) return;
    if (!viewer) makeViewer();
    opener = button; zoom = 1; fit = thumbnail.matches('.sf-approved-exercise-image');
    const card = button.closest('.sf-exercise,.mp-meal,.grub-recipe,.grub-meal-card,article');
    viewer.querySelector('h2').textContent = card?.querySelector('h4,h3,h2')?.textContent || thumbnail.alt || (fit ? 'Movement illustration' : 'Recipe illustration');
    viewer.querySelector('footer p').textContent = fit ? 'Zoom in, then swipe across the movement sequence.' : 'Zoom in, then swipe to see the detail. Portions are illustrative.';
    const sources = (thumbnail.getAttribute('srcset') || '').split(',').map(part => part.trim().split(/\s+/)).filter(part => part[0] && /^\d+w$/.test(part[1] || '')).sort((a,b) => parseInt(b[1]) - parseInt(a[1]));
    image.src = sources[0]?.[0] || thumbnail.src;
    image.alt = thumbnail.alt;
    viewer.showModal(); sizeImage();
    viewer.querySelector('[data-image-close]').focus();
  }
  function enhance(root) {
    const images = root.matches?.(selector) ? [root] : [...(root.querySelectorAll?.(selector) || [])];
    for (const img of images) {
      if (img.closest('.sst-image-open,.sst-image-viewer,a,button')) continue;
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'sst-image-open';
      button.setAttribute('aria-label', 'Enlarge ' + (img.alt || 'illustration'));
      button.title = 'Tap to enlarge';
      img.before(button); button.append(img);
      const hint = document.createElement('span'); hint.className = 'sst-image-hint'; hint.textContent = 'Enlarge'; hint.setAttribute('aria-hidden','true'); button.append(hint);
    }
  }
  enhance(document);
  new MutationObserver(records => {
    for (const record of records) {
      if (record.type === 'attributes') enhance(record.target);
      else for (const node of record.addedNodes) if (node.nodeType === 1) enhance(node);
    }
  }).observe(document.body, {childList:true,subtree:true,attributes:true,attributeFilter:['src','class']});
  document.addEventListener('click', event => {
    const button = event.target.closest?.('button.sst-image-open');
    if (!button) return;
    event.preventDefault(); event.stopImmediatePropagation(); open(button);
  }, true);
}
export const memberImageViewerRuntime = `\n;(${installMemberImageViewer.toString()})();\n`;
