from pathlib import Path
import hashlib, html, json, re, sys

inputs = json.loads(Path(sys.argv[1]).read_text())
source = Path(inputs['auditSource'])
raw = source.read_text()
assert hashlib.sha256(source.read_bytes()).hexdigest() == inputs['auditSourceSHA256']

def section_bounds(text, identity):
    start = text.index('<section id="' + identity + '"')
    return start, text.index('</section>', start) + len('</section>')

def approval_batch(section):
    return re.search(r'<h3>Exact communications approval batch.*?(?=<h3>Release order)', section, re.S).group(0)

start, end = section_bounds(raw, 'completion-current')
current = raw[start:end]
batch_hash = hashlib.sha256(approval_batch(current).encode()).hexdigest()

tables = list(re.finditer(r'<table[^>]*>.*?</table>', current, re.S))
assert len(tables) == 4
for index in reversed(range(4)):
    requests = inputs.get('auditTables', {}).get(str(index), {})
    if not requests:
        continue
    found = set()
    def row_change(match):
        row = match.group(0)
        cells = list(re.finditer(r'<td\b[^>]*>(.*?)</td>', row, re.S))
        if not cells:
            return row
        key = html.unescape(re.sub(r'<[^>]+>', '', cells[0].group(1))).strip()
        if key not in requests:
            return row
        assert key not in found
        found.add(key)
        for column, value in sorted(requests[key].items(), key=lambda x: int(x[0]), reverse=True):
            cell = cells[int(column)]
            row = row[:cell.start(1)] + html.escape(str(value)) + row[cell.end(1):]
        return row
    match = tables[index]
    replacement = re.sub(r'<tr\b[^>]*>.*?</tr>', row_change, match.group(0), flags=re.S)
    assert found == set(requests), (index, sorted(set(requests) - found))
    current = current[:match.start()] + replacement + current[match.end():]

for title, content in inputs.get('auditParagraphGroups', {}).items():
    needle = '<h3>' + title + '</h3>'
    begin = current.index(needle) + len(needle)
    finish = current.find('<h3>', begin)
    if finish == -1:
        finish = current.rindex('</section>')
    current = current[:begin] + ''.join('<p>' + html.escape(p) + '</p>' for p in content) + current[finish:]

for item in inputs.get('auditExactParagraphs', []):
    assert current.count(item['before']) == 1
    current = current.replace(item['before'], '<p>' + html.escape(item['after']) + '</p>')

if 'auditCurrentHeading' in inputs:
    current, count = re.subn(r'(<h2>).*?(</h2>)', lambda m: m[1] + html.escape(inputs['auditCurrentHeading']) + m[2], current, count=1, flags=re.S)
    assert count == 1
if 'auditCurrentDateNote' in inputs:
    current, count = re.subn(r'<p class="muted">.*?</p>', '<p class="muted">' + html.escape(inputs['auditCurrentDateNote']) + '</p>', current, count=1, flags=re.S)
    assert count == 1
if 'auditCallout' in inputs:
    current, count = re.subn(r'<div class="callout">.*?</div>', '<div class="callout">' + html.escape(inputs['auditCallout']) + '</div>', current, count=1, flags=re.S)
    assert count == 1
assert hashlib.sha256(approval_batch(current).encode()).hexdigest() == batch_hash
raw = raw[:start] + current + raw[end:]

if 'auditCheckpoint' in inputs:
    start, end = section_bounds(raw, 'completion-1952')
    title, *paragraphs = inputs['auditCheckpoint']
    replacement = '<section id="completion-1952"><h2>' + html.escape(title) + '</h2>'
    replacement += ''.join('<p>' + html.escape(p) + '</p>' for p in paragraphs) + '</section>'
    raw = raw[:start] + replacement + raw[end:]

if inputs.get('auditSupportDraft'):
    start,end=section_bounds(raw,'completion-current')
    draft=inputs['auditSupportDraft']
    extra='<h3>Provider scheduling support draft — unsent</h3>'
    for label in ['To','CC','Subject']:
        extra+='<p><strong>'+label+':</strong> '+html.escape(draft[label])+'</p>'
    extra+=''.join('<p>'+html.escape(p).replace('\n','<br>')+'</p>' for p in draft['Body'].split('\n\n'))
    extra+='<p><strong>Attachments:</strong> '+html.escape(', '.join(draft['Attachments']))+'</p>'
    extra+='<p>New private support request. No message or ticket was submitted. Matt must approve this complete exact content and attachments and expressly instruct submission. No paid support upgrade or other commitment is authorised.</p>'
    extra+='<h4>Complete attachment: '+html.escape(draft['Attachments'][0])+'</h4><p>SHA256 '+html.escape(draft['AttachmentSHA256'])+'</p><pre style="white-space:pre-wrap;overflow-wrap:anywhere">'+html.escape(draft['AttachmentContent'])+'</pre>'
    raw=raw[:end-10]+extra+raw[end-10:]

output = Path(inputs['auditOutput'])
output.parent.mkdir(parents=True, exist_ok=True)
output.write_text(raw)
print(json.dumps({'output': str(output), 'bytes': output.stat().st_size, 'approvalBatchPreserved': True, 'approvalBatchSHA256': batch_hash}))
