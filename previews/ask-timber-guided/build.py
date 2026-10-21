from pathlib import Path
import json
d=Path(__file__).parent
icons={
'arrow':'<path d="M4 12h15m-6-6 6 6-6 6"/>',
'reset':'<path d="M4 9a8 8 0 1 1 0 6M4 4v5h5"/>',
'food':'<path d="M5 3v6m3-6v6M3 3v6a3 3 0 0 0 6 0V3M6 12v9M17 21V3c-4 0-5 7-2 9h2"/>',
'movement':'<path d="m7 4 4 2 2 5 6 3c3 1 2 5 0 5H4c-2 0-2-3 0-4l3-2V4Z"/><path d="m11 11-3 2m5 1-3 2M3 21h18"/>',
'weight':'<rect x="4" y="3" width="16" height="18" rx="3"/><path d="M8 8a5 5 0 0 1 8 0l-4 4-4-4Zm4 4 2-4M9 17h6"/>',
'wellbeing':'<path d="M12 21C3 16-1 9 4 5c3-2 6 0 8 2 2-2 5-4 8-2 5 4 1 11-8 16Z"/><path d="M6 12h3l2-3 2 6 2-3h3"/>',
'sources':'<path d="M12 5v15m0-15C9 2 5 3 3 4v15c3-1 6-1 9 1 3-2 6-2 9-1V4c-2-1-6-2-9 1Z"/>',
'step':'<path d="M4 18h5v-5h5V8h6M15 3h6v6"/>',
'human':'<circle cx="12" cy="7" r="4"/><path d="M4 21v-3a8 8 0 0 1 16 0v3"/>'}
def svg(key):return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+icons[key]+'</svg>'
main=(d/'main.html').read_text()
for key in icons:main=main.replace('{{'+key+'}}',svg(key))
assert '{{' not in main
(d/'content.mjs').write_text('\n'.join('export const '+k+'='+json.dumps(v,ensure_ascii=False)+';' for k,v in {'main':main,'style':(d/'style.css').read_text(),'client':(d/'client.js').read_text()}.items()))
