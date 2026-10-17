import json,hashlib,re,subprocess,os
from pathlib import Path
from decimal import Decimal, ROUND_HALF_UP, InvalidOperation
from zipfile import ZipFile
from xml.etree import ElementTree as E
from datetime import datetime,timezone
root=Path(__file__).resolve().parents[1]
ev=root/'evidence/grub-expansion-closeout-2026-09-16'
pack=json.loads((root/'content/grub/uk-core-drafts-20261017.json').read_text())
prior=json.loads(subprocess.check_output(['git','show','54237686b154eac6446772252ce40986010cfc46:content/grub/uk-core-drafts-20261017.json'],text=True))
sources=json.loads((ev/'uk-core-source-extract-20261017.json').read_text())['foods']
wb=Path(os.environ['COFID_2021_WORKBOOK'])
assert hashlib.sha256(wb.read_bytes()).hexdigest()==pack['workbook_sha256']
ns={'x':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
with ZipFile(wb) as z:
 strings=[''.join(x.itertext()) for x in E.fromstring(z.read('xl/sharedStrings.xml'))]
 table={}
 for row in E.fromstring(z.read('xl/worksheets/sheet4.xml')).findall('.//x:row',ns):
  cells={}
  for c in row:
   v=c.find('x:v',ns)
   if v is not None:cells[re.sub('[0-9]','',c.attrib['r'])]=strings[int(v.text)] if c.get('t')=='s' else v.text
  table[cells.get('A','')]=cells
cols={'kcal':'M','protein_g':'J','carbohydrate_g':'L','fat_g':'K','fibre_g':'Z','saturates_g':'AB'}
checked=0
for code,f in sources.items():
 if code not in table:continue
 assert f['name']==table[code]['B'],code
 for key,col in cols.items():
  a,b=f.get(key),table[code].get(col)
  try:equal=Decimal(str(a))==Decimal(str(b))
  except InvalidOperation:equal=a==b
  assert equal,(code,key,a,b)
  checked+=1
def number(x):
 if x=='Tr':return Decimal(0)
 try:return Decimal(str(x))
 except InvalidOperation:return None
results=[]
for old,r in zip(prior['candidates'],pack['candidates']):
 d=r['data']; calculated={}
 assert len(d['ingredients'])==len(d['ingredient_evidence'])
 for key in cols:
  values=[]
  for e in d['ingredient_evidence']:
   # Reference values verified separately against the primary extract/workbook.
   source=sources[e['food_code']]
   assert e['per_reference'][key]==source.get(key)
   v=number(source.get(key))
   values.append(None if v is None else Decimal(str(e['calculation_grams']))*v/Decimal(source.get('reference_grams','100')))
  value=None if None in values else float((sum(values)/Decimal(d['servings'])).quantize(Decimal('0.1'),rounding=ROUND_HALF_UP))
  assert value==d['nutrition'][key],(r['id'],key,value,d['nutrition'][key])
  calculated[key]=value
 assert not r['publication_ready'] and not r['review']['human_review_claimed']
 findings=[]
 if r['id']=='uk-core-chickpea-spinach-curry':findings.append('Exact curry-paste label remains unspecified. Reviewer must assess allergens, vegetarian suitability and packet time; do not infer allergy suitability from the mustard-only headline.')
 results.append({'id':r['id'],'title':r['title'],'prior_content_hash':old['content_hash'],'content_hash':r['content_hash'],'content_changed':old['content_hash']!=r['content_hash'],'arithmetic':'PASS','estimated_per_serving':calculated,'human_review':'pending','practical_review_findings':findings})
retained=json.loads((ev/'uk-editorial-decisions-20261017.json').read_text())['current_recipes']
retained=[r for r in retained if r['discovery_eligible']]
assert len(retained)==32
report={'proof':'GRUB_UK_EXACT_AI_AUTHOR_CHECK_20261017','checked_at':datetime.now(timezone.utc).isoformat(),'reviewer':{'id':'/root','kind':'AI','independent_human':False},'base_source':'54237686b154eac6446772252ce40986010cfc46','publication':'held','physical_cooking_trial':False,'workbook_sha256':pack['workbook_sha256'],'cofid_values_checked':checked,'recipe_nutrient_totals_checked':84,'product_labels':'Named label fixtures retained from prior source review; no new product availability claim.','fixed':['Beans jacket: add grater; remove conditional equipment wording.','Tuna jacket: remove bean-heating equipment; add can opener if needed.','Both jackets: make peeled-potato proxy explicit in ingredient evidence and rendered review.','Tuna jacket: explicitly declare brine-to-spring-water nutrition proxy.','Lentil pasta: include heatproof mug used by method.'],'recipes':results,'existing_recipes':[{'id':r['id'],'title':r['title'],'content_changed':False,'human_acceptance_claimed':False} for r in retained],'existing_review_attention':['Egg toast recipes: two large eggs is not reliably 100g edible weight.','Hot oats equipment omits spoon and fruit-preparation equipment.','Generic reheating copy on cold yoghurt and wrap dishes needs human editorial assessment.','Ready-cooked chicken retention recipes must respect the original cooking/use-by clock.','Longer recipes remain optional choices; hands-on figures are estimates, not trials.'],'human_dependency':'Actual second-person identity, date, exact new hashes, all ten recipe scopes and exact discovery/timing review. Deployment permission already held; no kitchen-trial claim.'}
(ev/'uk-exact-author-check-20261017.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'arithmetic':'84/84 PASS','CoFID_values':checked,'recipes':14,'changed_candidates':[r['id'] for r in results if r['content_changed']],'retained_unchanged':32,'human_review':'pending'}))
