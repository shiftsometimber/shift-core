from pathlib import Path
from xml.etree import ElementTree as E
import zipfile, json, re, hashlib

root = Path('/workspace/scratch/606e6bb5bd95')
old, new = Path('/tmp/shift-backend-final-edit-606e6/current-v12-baseline'), root/'outputs/606e6bb5bd95'
inputs = json.loads(Path('/tmp/shift-backend-final-edit-606e6/checkpoint-inputs.json').read_text())
ns = {'m':'http://schemas.openxmlformats.org/spreadsheetml/2006/main', 'r':'http://schemas.openxmlformats.org/officeDocument/2006/relationships'}

def book(path):
    with zipfile.ZipFile(path) as z:
        strings = [''.join(x.itertext()) for x in E.fromstring(z.read('xl/sharedStrings.xml')).findall('m:si',ns)] if 'xl/sharedStrings.xml' in z.namelist() else []
        rels = {x.attrib['Id']:x.attrib['Target'] for x in E.fromstring(z.read('xl/_rels/workbook.xml.rels'))}
        data, formulas, features = {}, {}, {}
        for sh in E.fromstring(z.read('xl/workbook.xml')).findall('m:sheets/m:sheet',ns):
            name = sh.attrib['name']; target = rels[sh.attrib['{'+ns['r']+'}id']]
            sheet = E.fromstring(z.read(target.lstrip('/') if target.startswith('/') else 'xl/'+target))
            cells, fs = {}, {}
            for c in sheet.findall('.//m:sheetData/m:row/m:c',ns):
                address = c.attrib['r']; value = c.find('m:v',ns); formula = c.find('m:f',ns); inline = c.find('m:is',ns); kind = c.attrib.get('t','n')
                if value is not None:
                    cells[address] = ('s',strings[int(value.text)]) if kind=='s' else ('s' if kind=='str' else kind,value.text)
                elif inline is not None:
                    cells[address] = ('s',''.join(inline.itertext()))
                if formula is not None:
                    fs[address] = (formula.text,formula.attrib)
            data[name], formulas[name] = cells, fs
            features[name] = {tag:len(sheet.findall('.//m:'+tag,ns)) for tag in ['dataValidation','conditionalFormatting','tablePart','mergeCell','pane','autoFilter']}
        return data, formulas, features

before, fa, qa = book(old/'SHIFT-HQ-Launch-KPIs.xlsx')
after, fb, qb = book(new/'SHIFT-HQ-Launch-KPIs.xlsx')
assert list(before)==list(after) and fa==fb and qa==qb
for name, cells in before.items():
    allowed = inputs['workbookEdits'].get(name,{})
    for address, value in cells.items():
        if address not in allowed and address not in fa[name]:
            assert after[name].get(address)==value,(name,address,'Unrelated value changed')
for name, edits in inputs['workbookEdits'].items():
    for address, value in edits.items():
        assert after[name][address]==('s',value),(name,address)
for sheet, column, first, count, prefix in [('Launch actions','A',6,16,'A'),('Notifications','A',6,18,'E'),('KPI definitions','A',6,24,'K')]:
    assert [after[sheet][column+str(i)][1] for i in range(first,first+count)]==[prefix+str(i).zfill(2) for i in range(1,count+1)]
closed = [after['Launch actions']['A'+str(i)][1] for i in range(6,22) if after['Launch actions']['G'+str(i)][1]=='Verified']
assert closed==['A09','A16']
a, b = [(folder/'SHIFT-HQ-Backend-Audit.html').read_text() for folder in [old,new]]
def section(s):
    start=s.index('<section id="completion-current"');return s[start:s.index('</section>',start)+10]
def batch(s):
    return re.search(r'<h3>Exact communications approval batch.*?(?=<h3>Release order)',section(s),re.S).group(0)
assert batch(a)==batch(b)
def remove(s):
    for name in ['completion-1952','completion-current']:
        s=re.sub(r'<section id="'+name+'".*?</section>','',s,flags=re.S)
    return s
assert remove(a)==remove(b)
proof={'sourceVersion':12,'closedActions':closed,'formulasPreserved':sum(len(v) for v in fa.values()),'unrelatedCellsPreserved':True,'nativeFeatureCountsPreserved':True,'sameSheetNamesAndOrder':True,'actionCount':16,'triggerCount':18,'originalKpiDefinitionCount':24,'exactApprovalBatchPreserved':True,'approvalBatchSHA256':hashlib.sha256(batch(b).encode()).hexdigest(),'files':{p.name:{'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in new.iterdir() if p.suffix in ['.html','.xlsx']}}
Path('/tmp/shift-backend-final-edit-606e6/checkpoint-validation.json').write_text(json.dumps(proof,indent=2))
print(json.dumps(proof))
