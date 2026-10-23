(() => {
  const root = document.querySelector('[data-gtt-pathway]');
  if (!root) return;
  const fields = ['gtt-changed', 'gtt-impact', 'gtt-support', 'gtt-want'];
  const labels = ['What has changed and for how long', 'What is harder in daily life', 'Existing support or treatment', 'What I would like help with'];
  const status = root.querySelector('#gtt-tool-status');
  const notes = () => fields.map((id, i) => ({label: labels[i], value: document.getElementById(id).value.trim()})).filter(x => x.value);
  const asText = entries => 'My notes for a conversation\n\n' + entries.map(x => x.label + '\n' + x.value).join('\n\n') + '\n\nThese are my own notes, not a diagnosis or clinical assessment.';
  function openTarget() {
    const target = document.getElementById(location.hash.slice(1));
    if (target?.tagName === 'DETAILS') target.open = true;
  }
  root.addEventListener('click', e => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;
    const target = document.getElementById(link.getAttribute('href').slice(1));
    if (target?.tagName === 'DETAILS') target.open = true;
  });
  window.addEventListener('hashchange', openTarget); openTarget();
  root.querySelector('[data-gtt-copy]').addEventListener('click', async () => {
    const entries = notes();
    if (!entries.length) {status.textContent = 'Add a note first. You can leave any question blank.'; return;}
    try {await navigator.clipboard.writeText(asText(entries)); status.textContent = 'Notes copied. Only share them with someone you choose.';}
    catch {status.textContent = 'Your browser could not copy the notes. Select and copy the text in each box yourself.';}
  });
  root.querySelector('[data-gtt-print]').addEventListener('click', () => {
    const entries = notes();
    if (!entries.length) {status.textContent = 'Add a note before printing.'; return;}
    document.querySelector('.gtt-print-only')?.remove();
    const sheet = document.createElement('section');sheet.className = 'gtt-print-only';
    const title = document.createElement('h1');title.textContent = 'My notes for a conversation';sheet.append(title);
    const text = document.createElement('div');text.textContent = asText(entries).split('\n\n').slice(1).join('\n\n');sheet.append(text);document.body.append(sheet);
    document.body.classList.add('gtt-printing');
    const clean = () => {document.body.classList.remove('gtt-printing');sheet.remove();};
    window.addEventListener('afterprint', clean, {once:true});
    try {window.print();} catch {clean();status.textContent='Printing is unavailable. You can copy your notes instead.';}
  });
  function clear() {fields.forEach(id => {document.getElementById(id).value = '';}); document.querySelector('.gtt-print-only')?.remove();document.body.classList.remove('gtt-printing');}
  root.querySelector('[data-gtt-clear]').addEventListener('click', () => {clear();status.textContent='Your notes have been cleared.';});
  window.addEventListener('pagehide', clear);
  window.addEventListener('pageshow', e => {if(e.persisted)clear();});
})();
