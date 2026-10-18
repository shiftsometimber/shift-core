# Exact existing recipe corrections, not a new catalogue count generator.
import json,hashlib,re,os,subprocess,copy
from pathlib import Path
from decimal import Decimal,ROUND_HALF_UP,InvalidOperation
from zipfile import ZipFile
from xml.etree import ElementTree as E
ROOT=Path(__file__).resolve().parents[1]
INPUT=Path(os.environ['GRUB_CATALOGUE_REVIEW_INPUT'])
WB=Path(os.environ['COFID_2021_WORKBOOK'])
assert hashlib.sha256(WB.read_bytes()).hexdigest()=='436e9445ef2adb2a75f3d7edd51302de3adad25385f9795fc94ba58bd030e97d'
source=json.loads(INPUT.read_text());originals=source['authority']['rows']
ns={'x':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
foods={}
with ZipFile(WB) as z:
 ss=[''.join(x.itertext()) for x in E.fromstring(z.read('xl/sharedStrings.xml'))]
 for row in E.fromstring(z.read('xl/worksheets/sheet4.xml')).findall('.//x:row',ns):
  v={}
  for c in row:
   value=c.find('x:v',ns)
   if value is not None:v[re.sub('[0-9]','',c.attrib['r'])]=ss[int(value.text)] if c.get('t')=='s' else value.text
  if re.fullmatch('[0-9]{2}-[0-9]{3,4}',v.get('A','')):
   foods[v['A']]={'name':v['B'],'kcal':v.get('M'),'protein_g':v.get('J'),'fat_g':v.get('K'),'carbohydrate_g':v.get('L'),'fibre_g':v.get('Z'),'saturates_g':v.get('AB')}
foods.update(json.loads((ROOT/'evidence/grub-expansion-closeout-2026-09-16/uk-full-label-sources-20261018.json').read_text()))
known={}
for r in originals:
 for e in r['data']['ingredient_evidence']:known[e['item']]=e
nutrients=['kcal','protein_g','carbohydrate_g','fat_g','fibre_g','saturates_g']
def num(v):
 if v=='Tr':return Decimal(0)
 try:return Decimal(str(v))
 except InvalidOperation:return None
def ing(item,g,code=None,amount=None,basis=None):
 e=known.get(item,{})
 code=code or e.get('cofid_code')
 aliases={'13-879':('uk-label-smoked-paprika','smoked paprika'),'13-873':('uk-label-chilli-blend','hot chilli powder blend'),'13-878':('uk-label-oregano','dried oregano'),'13-874':('uk-label-cinnamon','ground cinnamon'),'13-880':('uk-label-black-pepper','ground black pepper'),'17-727':('uk-label-vegetable-stock','vegetable stock cube (make up to 250ml with water)')}
 if code in aliases:code,item=aliases[code];basis='Named UK product-label reference; no missing CoFID value is filled with zero.'
 if code=='14-337':code,item,g='14-277','lemon juice',g*5;basis='Actual ingredient correction: measured lemon juice replaces zest; recalculated using CoFID lemon juice.'
 assert code in foods,(item,code)
 return {'item':item,'amount':amount or f'{g:g}g','grams':g,'cofid_code':code,'source_food_name':foods[code]['name'],'mapping_basis':basis or e.get('mapping_basis','Declared generic CoFID household estimate; brands and edible yields vary.'),'mapping_limitation':e.get('mapping_limitation','Generic source estimate; product composition and cooking losses vary.')}
def plain(item,g,code):return ing(item,g,code)
def merge(items):
 out={}
 for i in items:
  k=(i['item'],i['cofid_code'])
  if k in out:out[k]['grams']+=i['grams'];out[k]['amount']=f"{out[k]['grams']:g}g"
  else:out[k]=copy.deepcopy(i)
 return list(out.values())
def add(items,item,g,code=None):
 items.append(ing(item,g,code))
def nutrition(items,servings):
 out={};unknown={}
 for n in nutrients:
  values=[num(foods[i['cofid_code']][n]) for i in items]
  if None in values:out[n]=None;unknown[n]=[i['item']for i,v in zip(items,values)if v is None]
  else:out[n]=float((sum(Decimal(str(i['grams']))*v/Decimal(str(foods[i['cofid_code']].get('reference_grams',100))) for i,v in zip(items,values))/Decimal(servings)).quantize(Decimal('.1'),rounding=ROUND_HALF_UP))
 assert all(out[n] is not None for n in nutrients[:4]),(out,[(i['item'],i['cofid_code'],foods[i['cofid_code']])for i in items if any(num(foods[i['cofid_code']][n]) is None for n in nutrients[:4])])
 return {'status':'validated',**out,'unknown_nutrients':unknown,'validation_scope':'ingredient_source_arithmetic_only','methodology':'Estimated per-serving nutrition. Ingredient weights multiplied by CoFID 2021 or explicitly named UK product-label values, preserving missing values; traces treated as zero. Declared product/cooked-state proxies remain estimates. AI author calculation, not independent human, clinical or physical cooking validation.'}
cold={'chilled':'Cover and refrigerate promptly at 0–5°C. Eat within 24 hours of assembly, or an earlier ingredient use-by/after-opening deadline. Keep chilled until eating. Home-cooked chicken or turkey must have been chilled within 2 hours and eaten within 48 hours of its original cooking; assembly does not restart that clock.'}
hot={'chilled':'Eat immediately. This recipe does not cover storing or reheating the assembled meal; follow any stricter product instructions.'}
batch={'chilled':'Cool in shallow portions and refrigerate within 2 hours at 0–5°C. Eat within 48 hours of original cooking or freeze promptly; any shorter ingredient deadline governs.','freezer':'Freeze cooled portions promptly in labelled suitable containers. Defrost completely in the fridge.','reheat':'Reheat once until steaming hot throughout. Stir and check the centre; eat immediately.'}
rice={'chilled':'Cool leftover rice quickly, ideally within 1 hour. Refrigerate at 0–5°C and eat within 24 hours of original cooking. Keep cold packed lunches chilled; any earlier ingredient deadline governs.','reheat':'Reheat rice and hot toppings once until steaming hot throughout; eat immediately. Keep salad and cold dressing separate.'}
safe=['Check every bought ingredient label for allergens, use-by dates and cooking instructions. Recipe tags are not an allergy-suitability guarantee.','Wash hands, utensils and surfaces. Wash produce unless labelled ready washed; keep raw meat and fish separate from ready-to-eat food.']
formats=['breakfast-buttie','breakfast-wrap','breakfast-hash','breakfast-toastie','sandwich','wrap','bagel','toastie','jacket-potato','meal-prep-bowl','curry','chilli','pasta','pie','traybake','stir-fry','roast','slow-cooker','burger','kebab','loaded-fries','pizza','protein-pot','dessert-pot','work-snack-box','big-feed-dessert','egg-toast','potato-hash','protein-oats','yoghurt-pot','cottage-cheese-toast','pasta-bake','rice-bowl','taco-bowl','overnight-oats','overnight-oats-pot','pasta-pot','grain-salad','pitta','wholemeal-wrap','egg-snack-box','apple-protein-snack','tuna-snack-pot','cottage-cheese-pot','bean-dip-box']
def family(r):
 f=r['data'].get('food_format') or r['data'].get('taxonomy',{}).get('food_format')
 if f:return f
 for f in sorted(formats,key=len,reverse=True):
  if f in r['id']:return f
 return 'salad'
def short(s):
 s=re.sub(r',.*','',s).lower()
 for a,b in [('100% turkey breast mince','turkey mince'),('raw skinless chicken breast','chicken'),('cooked chicken breast','chicken'),('chicken breast','chicken'),('cooked turkey breast','turkey'),('turkey breast','turkey'),('5% beef mince','beef mince'),('lean pork loin','pork'),('salmon fillet','salmon'),('firm tofu','tofu'),('lean back bacon','bacon'),('reduced-fat pork sausages','sausages'),('chicken sausages','chicken sausages'),('tuna in spring water','tuna'),('lean ham','ham'),('boiled eggs','egg'),('large eggs','egg'),('eggs without shells','egg'),('0% greek yoghurt','yoghurt'),('plain virtually fat-free yoghurt','yoghurt'),('low-fat cottage cheese','cottage cheese'),('high-protein yoghurt','yoghurt')]:s=s.replace(a,b)
 return s
def protein(items):
 for i in items:
  if re.search(r'chicken|turkey|beef|pork|salmon|prawn|tuna|ham|bacon|sausage|egg|tofu|chickpea|lentil|baked beans|mixed beans|kidney beans',i['item'],re.I):return i['item']
 return next((i['item'] for i in items if 'cottage cheese' in i['item']), 'vegetables')
def protein_step(p):
 if 'cottage cheese' in p.lower():return 'Use ready-to-eat cottage cheese. Keep it chilled and add it after the toast or other hot component is cooked.'
 if re.search(r'boiled eggs',p,re.I):return 'Use chilled, ready-boiled eggs. Peel and chop them; the timing assumes they are already cooked.'
 if re.search(r'cooked chicken|cooked turkey|cooked salmon|lean ham|tuna',p,re.I):return f'Use ready-to-eat {p}. Drain canned tuna before weighing; keep ready-to-eat fillings refrigerated until needed. Do not start this method with raw meat.'
 if re.search(r'canned|beans|lentil|chickpea',p,re.I):return f'Use ready-cooked canned or pouched {p}, drained before weighing. Rinse canned pulses if appropriate. Dry pulses cannot be substituted directly.'
 if 'tofu' in p.lower():return 'Drain and pat the firm tofu dry. Cut into 2cm cubes or 1.5cm slices and cook in the measured oil for 8–10 minutes, turning, until hot through and lightly golden.'
 if re.search(r'egg',p,re.I):return 'Beat the measured raw eggs in a bowl. Cook over a low to medium heat, stirring gently until fully set with no liquid egg remaining. Wash hands and utensils after raw egg.'
 if re.search(r'salmon|prawn',p,re.I):return f'Cook the {p} in the measured oil over medium heat: allow about 4–5 minutes per side for a salmon fillet, adjusting for thickness; prawns usually take 3–5 minutes, turning. Fish must be opaque and flake easily; prawns must be pink and opaque. Check for bones before serving.'
 if 'sausage' in p.lower():return f'Cook the {p} for the full time on their packet, turning as directed. Check they are cooked through and steaming hot in the centre; allow longer than the estimate where needed.'
 if 'bacon' in p.lower():return f'Cook the {p} in the measured oil for about 5–8 minutes, turning, until cooked through and steaming hot. The ingredient weight is the raw trimmed weight.'
 cut='Break mince apart with a spatula as it cooks' if 'mince' in p.lower() else 'Cut the meat into even strips or pieces no larger than 2cm, using a separate board'
 return f'{cut}. Cook the {p} in the measured oil for about 8–12 minutes, turning or stirring, until fully cooked; check 75°C for 30 seconds at the centre with a clean food thermometer. Allow longer if needed. Never reuse a raw-meat plate or utensils without washing them.'
yoghurt_mix={
 'garlic herb yoghurt':[('plain virtually fat-free yoghurt',40,'12-533'),('garlic powder',.5,'13-830'),('dried parsley',.3,'13-845')],
 'peri-peri yoghurt':[('plain virtually fat-free yoghurt',40,'12-533'),('paprika',1,'13-879'),('chilli powder',.2,'13-873'),('lemon juice',5,'14-277')],
 'Cajun yoghurt':[('plain virtually fat-free yoghurt',40,'12-533'),('paprika',1,'13-879'),('garlic powder',.5,'13-830'),('dried oregano',.3,'13-878')],
 'tikka yoghurt':[('plain virtually fat-free yoghurt',40,'12-533'),('medium curry paste',5,'17-720')],
 'lemon herb yoghurt':[('plain virtually fat-free yoghurt',40,'12-533'),('lemon juice',5,'14-277'),('dried parsley',.3,'13-845')],
 '0% Greek yoghurt dressing':[('plain virtually fat-free yoghurt',40,'12-533'),('lemon juice',5,'14-277')],
 'lemon yoghurt dressing':[('plain virtually fat-free yoghurt',40,'12-533'),('lemon juice',5,'14-277')],
 'lime yoghurt dressing':[('plain virtually fat-free yoghurt',40,'12-533'),('lemon juice',5,'14-277')],
 'mustard mayo':[('light mayonnaise',20,'17-679'),('wholegrain mustard',5,'17-365')],
 'smoked paprika dressing':[('plain virtually fat-free yoghurt',30,'12-533'),('smoked paprika',1,'13-879'),('cider vinegar',5,None)],
 'pickle mustard relish':[('wholegrain mustard',5,'17-365'),('tomato salsa',15,'17-354')]
}
# Curry paste is cooked according to its label, never folded uncooked into a cold sauce.
yoghurt_mix['tikka yoghurt']=[('plain virtually fat-free yoghurt',40,'12-533'),('paprika',1,'13-879'),('ground ginger',.3,None),('garlic powder',.5,'13-830')]
def normalise(r):
 out=[]
 for old,e in zip(r['data']['ingredients'],r['data']['ingredient_evidence']):
  item=old['item'];g=e.get('calculation_grams',e['grams']);code=e['cofid_code']
  item={'diced apple':'apple','apple, diced':'apple','sliced banana':'banana','banana, sliced':'banana','pineapple chunks':'pineapple'}.get(item,item)
  if item in yoghurt_mix:
   scale=g/40
   out.extend(ing(a,round(b*scale,4),c) for a,b,c in yoghurt_mix[item]);continue
  if item=='garlic mushrooms':
   out.extend([ing('mushrooms',g,'13-505'),ing('garlic powder',.3,'13-830')]);continue
  if item in ['large eggs','eggs']:
   item='eggs without shells';code='12-937'
  if item=='lean back bacon':code='19-646'
  if item=='turkey mince':item='100% turkey breast mince, raw';code='18-349'
  if item=='reduced-sugar BBQ sauce':item='barbecue sauce';g=min(g,20)
  if item=='reduced-sugar BBQ glaze':item='barbecue sauce';g=min(g,20)
  if item=='barbecue sauce':code='17-705'
  if item=='wholegrain mustard':g=min(g,10)
  if item=='light mayonnaise':g=min(g,25)
  # Existing exact canned and raw/cooked mapping remains explicitly declared.
  out.append(ing(item,g,code,basis=e.get('mapping_basis')))
 return merge(out)
def title_for_old(r,f,p):
 t=r['title']
 t=re.sub(r'^Shift\s+','',t,flags=re.I)
 for a,b in [('Nashville-Style','Paprika and pepper'),('Buffalo','Chilli and garlic'),('Dirty','Relish'),('Fully Loaded','Tomato relish'),('Weekend Big Feed','Tomato'),('Fakeaway',''),('Proper ','')]:t=t.replace(a,b)
 t=re.sub(r'\s+',' ',t).strip()
 if f=='roast' and 'mince' in p.lower():t=re.sub('Sunday-Style Roast','Meatballs with roast potatoes',t,flags=re.I)
 if f=='pie':t=t.replace('Pie','Mash-topped pie')
 if f in ['curry','stir-fry'] and any(x in t.lower()for x in ['peppercorn','teriyaki','hoisin','sweet chilli','lemon herb','garlic & herb','bbq','mediterranean']):
  t=re.sub(r'Big Curry|Curry','Rice bowl',t,flags=re.I) if f=='curry' else t
 t=t.replace('Protein Pot','Yoghurt pot' if any('yoghurt' in i['item']for i in r['data']['ingredients'])else'Snack pot').replace('Big Feed Dessert','Dessert to share').replace('Banana Split','Banana').replace('Loaded ','')
 return t[0].upper()+t[1:] if t else r['title']
def title_for(r,f,p,items):
 text=' '.join(i['item'].lower()for i in items)
 seasoning=''
 for pattern,label in [('barbecue','Barbecue'),('balti','Balti'),('madras','Madras'),('tikka|masala','Tikka'),('hoisin','Hoisin'),('teriyaki','Teriyaki'),('sweet chilli','Sweet chilli'),('curry','Spiced'),('peri-peri|piri-piri','Piri-piri'),('harissa','Harissa'),('pesto','Pesto'),('mustard','Mustard'),('caesar','Caesar'),('chilli','Chilli'),('smoked paprika|paprika|cajun','Paprika'),('garlic','Garlic'),('lemon','Lemon'),('mushroom','Mushroom'),('dried oregano|dried parsley','Herby')]:
  if re.search(pattern,text):seasoning=label;break
 pr=short(p).replace('chickpeas','chickpea').replace('sausages','sausage')
 labels={'breakfast-buttie':'breakfast bap','breakfast-wrap':'breakfast wrap','breakfast-toastie':'breakfast toastie','breakfast-hash':'potato breakfast hash','potato-hash':'potato hash','sandwich':'salad sandwich','wrap':'salad wrap','bagel':'salad bagel','toastie':'toastie','jacket-potato':'jacket potato','meal-prep-bowl':'rice lunch bowl','curry':'curry with rice'if re.search('curry|masala|balti|madras|harissa',text)else'and vegetable rice bowl','chilli':'chilli with rice','pasta':'vegetable pasta','pie':'and vegetable mash-topped pie','traybake':'with roasted potatoes and vegetables','stir-fry':'vegetable noodles','roast':'meatballs with roast potatoes'if 'mince' in p else'with roast potatoes and vegetables','slow-cooker':'slow-cooker potato and vegetable pot','burger':'burger with side salad','kebab':'salad flatbread','loaded-fries':'topped oven chips','pizza':'and pepper pizza with side salad','egg-toast':'and vegetables on toast','cottage-cheese-toast':'and tomato toast','pasta-bake':'pasta bake','rice-bowl':'rice bowl','taco-bowl':'rice and bean bowl','pasta-pot':'pasta salad','grain-salad':'couscous salad','pitta':'salad pitta','wholemeal-wrap':'salad wrap'}
 if f in labels:
  title=' '.join(x for x in [seasoning,pr,labels[f]]if x)
 else:
  fruits=[]
  for pattern,label in [(r'\bapple\b','apple'),('banana','banana'),('berries|blueberries','berries'),('cherr','cherry'),('mango','mango'),('pineapple','pineapple'),('peach','peach'),('pear','pear'),('plum','plum')]:
   if re.search(pattern,text):fruits.append(label)
  creamy='cottage cheese'if 'cottage cheese' in text else'yoghurt'if 'yoghurt' in text else'oats'if 'milk' in text and 'oats' in text else'fruit'
  flavour='chocolate'if re.search('chocolate|cocoa',text)else'peanut'if 'peanut' in text else'cinnamon'if 'cinnamon' in text else'coffee'if 'espresso' in text else'lemon'if 'lemon' in text else''
  name=' and '.join(fruits[:2])or'fruit'
  formatname='porridge'if f=='protein-oats'else'overnight oats'if 'milk' in text and 'oats' in text and ('overnight' in r['id']or any(i['grams']>=40 for i in items if 'oats' in i['item']))else'box with crackers'if 'cracker' in text else'dessert to share'if f=='big-feed-dessert'else'pot'
  if re.search('boiled eggs|tuna|chickpea',text)and not fruits:title=pr+' snack box with vegetables'
  else:title=' '.join(x for x in [name,flavour,creamy,formatname]if x)
 title=re.sub('beef mince meatballs','beef meatballs',title)
 return title[0].upper()+title[1:]

def finish(r):
 f=family(r);items=normalise(r);p=protein(items);old=r['data'];servings=old.get('servings',1);storage=batch;prep=10;cook=15;total=25;hands=20;equipment=['hob','non-stick frying pan','knife','chopping board','spatula','kitchen scales'];notes=[]
 def names():return ', '.join(i['item']for i in items)
 def has(pattern):return any(re.search(pattern,i['item'],re.I) for i in items)
 def put(item,g,code=None):
  nonlocal items
  add(items,item,g,code);items=merge(items)
 def rawkit():
  if re.search('chicken|turkey|beef|pork|bacon|sausage',p,re.I)and not re.search('cooked |ham',p,re.I):equipment.extend(['separate raw-meat board','food thermometer','clean plate'])
 if r['id'] in ['industrial-lunch-'+x for x in ['chicken-wholemeal-wrap','tuna-wholemeal-wrap','bean-wholemeal-wrap','chicken-pitta','tuna-pitta','bean-pitta']]:items=[i for i in items if i['item']!='lemon juice']
 # Correct familiar seasonings as actual measured ingredients, not title-only localisation.
 if re.search('chilli',r['title'],re.I)and not has('chilli'):put('chilli powder',.5,'13-873')
 if f=='pizza':
  # A real two-person pizza: actual mozzarella and salad, not a meat-and-base template.
  items=[i for i in items if i['item']!='individual pizza base']
  # Named UK reference label is handled below separately from CoFID.
  items.append({'item':'ready-made pizza base','amount':'150g','grams':150,'cofid_code':'sainsbury-base','source_food_name':"Sainsbury’s Pizza Bases x2 300g, per half base",'mapping_basis':'Named UK product label: 227kcal,6g protein,37.9g carbohydrate,5.3g fat,1.5g fibre,0.8g saturates per75g half-base. Other products require recalculation.','mapping_limitation':'Label-rounded household estimate. Follow the actual base packet; do not substitute raw dough.'})
  put('fresh mozzarella, drained',80,'12-360');put('lettuce',150,'13-520');put('cucumber',150,'13-523');servings=2
  prep,cook,total,hands=15,20,35,25;equipment+=['oven','oven tray','oven gloves','bowl'];rawkit();storage=hot
  method=['Preheat the oven to the temperature on the ready-made base packet. Wash and slice the peppers or other vegetables; chop the salad. Drain and pat the mozzarella dry. Use a baked ready-made base, not raw dough.',protein_step(p),'Cook any mushrooms or other firm toppings in the same pan for 4–6 minutes. Keep lettuce and cucumber raw for the side salad. Mix the measured passata with any tomato-based cooking sauce; follow a sauce label requiring separate heating. Keep yoghurt, mayonnaise and cold dressings chilled for serving.','Spread the tomato mixture thinly over the base. Add the cooked protein and cooked toppings; tear the mozzarella over the top. Bake for the full base-packet time until the base is crisp, cheese melted and centre piping hot. The 35-minute total is an estimate; a slower base or batch needs longer.','Cut the pizza in half. Serve half to each person with half the salad. Add any cold dressing at the table; all measured oil, toppings and dressing count in the two portions. Eat immediately; do not reheat if the base packet forbids it.']
 elif f in ['sandwich','wrap','bagel','pitta','wholemeal-wrap','salad']:
  prep,cook,total,hands=10,0,10,10;equipment=['knife','chopping board','bowl','fork','plate','kitchen scales'];storage=cold
  bread=next((i['item']for i in items if re.search('bread|wrap|bagel|pitta|bap',i['item'])),None)
  method=['Wash and dry the salad vegetables unless labelled ready washed. Slice thinly; keep most of a large salad portion alongside so the bread or wrap will close.',protein_step(p),'Mix any measured yoghurt, mayonnaise, herbs, lemon juice and oil as the dressing. Use ready-to-eat condiments; check that any bought dressing is labelled ready to eat. These fillings are served cold.']
  method+=[f'Prepare the {bread}: open a bagel or pitta, or lay bread/wrap flat. Add a manageable layer of filling and dressing. Serve all remaining filling, vegetables and dressing alongside.' if bread else'Arrange the filling and vegetables on a plate and spoon the measured dressing over them.','Eat now or cover, refrigerate promptly and keep chilled until eating. The timing assumes ready-to-eat cooked fillings.']
 elif f=='jacket-potato':
  prep,cook,total,hands=10,12,25,12;equipment=['microwave','microwave-safe plate','fork','knife','chopping board','bowl','spoon','oven gloves','kitchen scales'];storage=hot
  method=['Scrub and prick the potato all over. Use a microwave-safe plate; at800W allow about8–12minutes for one250–300g potato, turning halfway, then1-minute bursts until completely soft. Stand2minutes. Appliance and potato size govern.',protein_step(p),'Wash the salad vegetables; finely slice spring onion. Mix any measured yoghurt, mayonnaise, mustard, herbs and oil into the cold filling or dressing. Heat baked beans or a cooking sauce separately according to its packet; do not heat lettuce or cucumber.','Split and fluff the potato. Add the filling and dressing; serve every listed vegetable alongside. Eat immediately. An oven-only jacket needs60–90minutes plus preheating and is not the25-minute option.']
 elif f in ['protein-pot','dessert-pot','work-snack-box','big-feed-dessert','yoghurt-pot','apple-protein-snack','cottage-cheese-pot','egg-snack-box','tuna-snack-pot','bean-dip-box','overnight-oats','overnight-oats-pot']:
  prep,cook,total,hands=5,0,5,5;equipment=['bowl or lidded container','spoon','knife','chopping board','kitchen scales'];storage=cold
  overnight=has('milk')and has('oats')and ('overnight' in r['id']or any(i['grams']>=40 for i in items if 'oats' in i['item']))
  if overnight:
   prep,total,hands=10,370,10
   method=['Wash and prepare the fruit, removing cores, stones and inedible peel. Use the measured edible portions.','Mix all the measured oats, milk and any yoghurt in a clean lidded container. Stir in the fruit and measured flavourings; keep crackers or crunchy toppings separate.','Cover and refrigerate at0–5°C for at least6hours or overnight. This is preparation ahead, not a5-minute ready-to-eat meal.','Stir before eating and add the measured crunchy toppings. Eat within24hours of preparation or an earlier ingredient deadline.']
  elif has('egg|tuna|chickpea')and not has('banana|apple|berries'):
   method=['Use chilled ready-boiled eggs, canned tuna or ready-cooked canned pulses as listed. Drain canned foods before weighing; raw eggs or dry pulses need separate preparation.','Wash and prepare the vegetables. Chop eggs, flake tuna or mash pulses with a fork; mix only with the measured dressing or savoury flavourings.','Pack the filling and vegetables with the crackers or bread kept separate. Eat now or cover and refrigerate promptly; keep chilled until eating.']
   equipment+=['fork','can opener if needed']
  else:
   method=['Wash and prepare the fruit; remove cores, stones and inedible peel. The stated weights are edible portions, not a requirement to weigh each bite.','Spoon any yoghurt or cottage cheese into a bowl. Add the measured fruit and flavourings. Do not introduce an unlisted creamy base into a fruit-only pot.','Keep oats, seeds, crackers and biscuit pieces separate until eating if packing ahead. Fold them in or serve alongside just before eating.','Eat now or cover and refrigerate promptly. Keep chilled until eating and follow the shortest ingredient deadline.']
  if f=='big-feed-dessert':servings=2;notes.append('This larger recipe makes two snack/dessert portions; all ingredients and nutrition are divided by two.')
 elif f in ['protein-oats']:
  prep,cook,total,hands=5,8,15,12;equipment=['hob','saucepan','spoon','knife','chopping board','bowl','kitchen scales'];storage=cold
  method=['Wash and prepare the fruit, removing cores and stones. Put the measured oats, milk and fruit into a saucepan.','Cook gently for the packet time, usually5–8minutes, stirring until the oats are soft. Add a splash of water if needed; do not assume extra milk not listed.','Take off the heat and stir through any measured yoghurt and flavourings. Divide the whole recipe into the stated servings and eat immediately. Cool any portion promptly before refrigerating.']
 elif f in ['breakfast-buttie','breakfast-wrap','breakfast-toastie','breakfast-hash','potato-hash','egg-toast','cottage-cheese-toast']:
  prep,cook,total,hands=8,15,25,20;rawkit();storage=hot;equipment+=['toaster','plate','bowl']
  if has('potato'):equipment+=['microwave','microwave-safe bowl'];method=['Wash and dice potatoes into1–2cm pieces. Microwave with2tablespoons water in a covered microwave-safe bowl for5–7minutes, stirring halfway, until almost tender; drain.']
  else:method=['Wash and slice the vegetables. Toast the bread or warm the wrap as its packet directs while preparing the filling.']
  method+=[protein_step(p),'Cook peppers, onion, mushrooms, spinach or other cooking vegetables in the same pan until softened. Keep lettuce and other salad leaves raw for the side. Heat baked beans or cooking sauces as their packet directs; cold yoghurt/mayonnaise dressings go on after cooking.','For a hash, fold the softened potato into the pan and cook until tender throughout. For a bap, wrap or toastie, use a manageable layer of cooked filling and serve the remaining vegetables alongside.','Use every measured ingredient, including oil and dressing. Make sure raw eggs are fully set, then serve immediately. Sausage-packet times or larger batches may take longer.']
 elif f in ['toastie']:
  prep,cook,total,hands=10,10,20,15;rawkit();equipment+=['sandwich toaster or lidded frying pan','bowl','plate'];storage=hot
  method=['Wash and finely slice the vegetables. Use ready-to-eat cooked fillings and fully cooked canned beans as listed; do not put raw meat into a sandwich toaster.',protein_step(p),'Mix any cold dressing with the filling; keep excess salad or wet tomato aside to serve alongside. Fill the bread with a manageable amount of the measured filling.','Toast in a sandwich toaster, or a covered non-stick pan turning carefully, for about5–8minutes until the bread is crisp and the filling is hot throughout. Cooked-meat fillings must be steaming hot in the centre. Serve all remaining salad/filling alongside and eat immediately.']
 elif f in ['pasta','pasta-bake','pasta-pot','grain-salad','rice-bowl','meal-prep-bowl','taco-bowl']:
  prep,cook,total,hands=10,20,30,20;rawkit();equipment+=['saucepan','colander','bowl','spoon'];storage=rice if has('rice')else batch
  if has('rice'):cook=35;total=45;method=['Start the measured dry rice first, using the water quantity and cooking time on its packet. Brown rice commonly takes25–35minutes; this recipe does not claim microwave-pouch timing.']
  elif has('couscous'):cook=10;total=20;equipment+=['kettle','heatproof bowl with cover'];method=['Put the measured dry instant couscous in a heatproof bowl. Add the boiling-water quantity on its packet, cover for the packet time and fluff with a fork.']
  else:method=['Cook the measured dry pasta in boiling water for its packet time. Save a mug of the cooking water before draining.'];equipment+=['heatproof mug']
  if f in ['pasta-pot','grain-salad','meal-prep-bowl','rice-bowl']and re.search('cooked|tuna|ham|boiled|chickpea|beans',p):
   method+=[protein_step(p),'Wash and chop the vegetables. Drain canned sweetcorn or pulses. Mix the measured dressing, oil and flavourings; use ready-to-eat condiments or cook and safely cool a sauce that requires it.','For immediate serving, combine the cooked grain or pasta with the filling and dressing and eat now. For a packed lunch, cool the starch promptly before combining with chilled fillings and vegetables. Keep the meal chilled until eating; the original cooking clock is not restarted.']
  else:
   if not has('tomato|passata'):put('chopped tomatoes',150,'13-530')
   method+=[protein_step(p),'Add chopped courgette, peppers, onions or other cooking vegetables and the measured tomato ingredients to the pan. Simmer for8–10minutes until vegetables are tender. Stir through any cooking sauce for its label time. Add spinach near the end and wilt fully; serve ready-to-eat salad leaves cold.','Combine the cooked pasta or rice, cooked filling and sauce. Add a little reserved pasta water or hot water if needed. Fold in cold yoghurt/cream cheese away from the heat; add mayonnaise only as a cold dressing at serving.']
  if f=='pasta-bake':equipment+=['oven','ovenproof dish','oven gloves'];total+=15;cook+=15;method+=['Transfer the cooked pasta and filling to an ovenproof dish, add the measured cheese and bake at200°C/180°Cfan for12–15minutes until the centre is bubbling and steaming hot.']
 elif f in ['curry','chilli','pie','stir-fry','traybake','roast','slow-cooker','burger','kebab','loaded-fries']:
  rawkit();equipment+=['bowl','clean plate'];storage=batch
  if f in ['curry','chilli']:
   prep,cook,total,hands=10,35,45,25;equipment+=['saucepan','sieve','pan lid'];storage=rice
   if not has('chopped tomatoes|passata'):put('chopped tomatoes',150,'13-530')
   if not has('chilli')and f=='chilli':put('chilli powder',.5,'13-873')
   method=['Start the measured dry rice using its packet water quantity and cooking time. Brown rice takes longer than white; do not substitute a dry weight with the same weight of microwave rice.',protein_step(p),'Chop the onion, peppers and other vegetables. Add them to the pan with the measured cooking sauce, any listed tomatoes and50ml water. Simmer for10–15minutes, stirring; curry paste must cook for its full label time. Use canned ready-cooked kidney beans, chickpeas or lentils, never raw dried beans.','Fold the cooked protein or pulses into the sauce. Heat until steaming hot throughout; add spinach near the end and wilt fully. Add any yoghurt or cream cheese away from the heat. Divide with the freshly cooked rice and serve immediately.']
  elif f=='pie':
   prep,cook,total,hands=15,35,55,30;equipment+=['saucepan','colander','potato masher','oven','ovenproof dish','oven gloves']
   if not has('chopped tomatoes|passata'):put('chopped tomatoes',150,'13-530')
   method=['Heat the oven to200°C/180°Cfan. Peel and cut the measured potatoes into even pieces. Boil for15–20minutes until tender, drain and mash with a little reserved potato water; add milk or butter only if listed.',protein_step(p),'Finely chop the carrots and other filling vegetables. Simmer them with the measured tomatoes, cooking sauce and100ml water for10–15minutes until tender; add peas near the end. Stir in the cooked protein. Keep any cold dressing separate for serving.','Put the hot filling into an ovenproof dish and spread the mash over it. Add measured cheese if listed. Bake for15–20minutes until the centre is bubbling and steaming hot. Rest2minutes and serve; this is a mash-topped pie, not an unlisted pastry recipe.']
  elif f=='slow-cooker':
   servings=4
   for i in items:i['grams']*=4;i['amount']=f"{i['grams']:g}g"
   if not has('chopped tomatoes|passata'):put('chopped tomatoes',600,'13-530')
   prep,cook,total,hands=20,360,380,25;equipment+=['slow cooker','jug'];notes+=['Four portions: follow the cooker minimum/maximum-fill guidance. LOW6–8hours or HIGH3–4hours; displayed elapsed time is a6-hour author estimate, not a quick meal.']
   method=['Prepare four portions so the slow cooker meets its safe minimum fill. Cut potatoes and vegetables into even small pieces. Put them in the cooker with all measured tomato ingredients/cooking sauce and400ml water; follow cooker fill guidance.','For raw beef, turkey or other mince, brown it thoroughly in the measured oil first, breaking up lumps. For chicken or pork, brown the pieces if desired. Use clean utensils after raw meat. Add meat to the cooker; keep fish, prawns, tofu and all cold dairy dressings out for now.','Cook onLOW for6–8hours orHIGH for3–4hours, until meat is safely cooked and vegetables tender. Check75°C for30seconds at the centre of meat; cook longer if needed. Keep the lid on. A small domestic cooker or large batch may need longer.','If using salmon, add small pieces only for the final20–30minutes, until opaque and flaking; add prawns for the final10–15minutes until pink/opaque. Add tofu for the final30minutes and heat through. Do not slow-cook delicate fish for the full6hours.','Switch off. Stir in any yoghurt/cream cheese away from the heat; serve cold mayonnaise dressings separately. Divide into four equal portions; cool leftovers promptly in shallow containers and follow the storage instructions.']
  elif f in ['traybake','roast','loaded-fries']:
   prep,cook,total,hands=10,35,50,25;equipment+=['oven','oven tray','oven gloves'];storage=hot
   meat_step='Shape raw mince into small even meatballs before cooking. Pan-fry in the remaining measured oil for10–12minutes, turning, until75°C for30seconds at the centre.' if 'mince' in p else protein_step(p)
   method=['Heat the oven to200°C/180°Cfan or the oven-chip packet temperature. Cut raw potatoes into even1–2cm pieces; toss with half the measured oil. Roast for15minutes first. Oven chips follow their own packet; their stated weight is cooked weight where specified.',meat_step,'Cut carrots, broccoli, peppers and other roasting vegetables into manageable pieces. Add them to the potato tray and roast for another15–20minutes until completely tender. Keep salad leaves, cold yoghurt and mayonnaise dressings out of the oven.','Keep cooked meatballs or other cooked protein covered while the vegetables finish. Add cooked protein to the hot vegetables at the end. Warm the measured cooking sauce as its packet directs; serve cold dressing at the table.','Check every component is cooked through and hot; divide the whole recipe into the stated servings. Eat immediately. Larger trays, whole sausage timings or oven-chip instructions may extend the estimate.']
  elif f=='stir-fry':
   prep,cook,total,hands=10,15,25,25;equipment+=['saucepan','colander','pan lid'];storage=hot
   method=['Cook the measured dry noodles for their packet time. Cut broccoli into small florets and boil for3–4minutes until nearly tender; drain. Do not use the dry quantity as a ready-cooked noodle quantity.',protein_step(p),'Thinly slice the peppers and other vegetables. Add them to the pan with2tablespoons water, cover for3–4minutes and cook until tender with some bite. Stir as needed so they do not catch.','Add the drained noodles and broccoli. Stir through the measured cooking sauce for its required label time, then fold in the cooked protein. Heat until steaming hot throughout. Add cold yoghurt or mayonnaise dressing only at the table; eat immediately.']
  else:
   prep,cook,total,hands=10,20,30,25;storage=hot
   burger_step=('Shape the raw mince into an even patty before cooking. Pan-fry in the measured oil for about5–7minutes per side, longer if thick, until75°C for30seconds at the centre.' if 'mince' in p else 'For a chicken burger, flatten the breast to an even thickness and pan-fry in the measured oil for about7–8minutes per side until75°C for30seconds at the centre. For pork loin, use thin slices and cook through; for salmon or tofu, pan-cook an even piece until safely cooked and hot through.')
   method=['Wash and dry the salad vegetables, slice thinly and set aside. Prepare the measured bun or flatbread as its packet directs. Keep cold dressings chilled.',burger_step if f=='burger' else protein_step(p),'Mix the measured cold dressing ingredients; heat only a cooking sauce that requires it. Fill the bun or flatbread with a manageable portion of cooked filling and salad. Serve every remaining vegetable and all remaining filling/dressing alongside. Eat immediately.']
 else:raise AssertionError((r['id'],f))
 # Include actual oil in ingredients, shopping and nutrition wherever pan cooking needs it.
 if any('measured oil' in step for step in method) and not has('olive oil'):
  put('olive oil',4.6)
 if has('tofu') and f in ['pitta','wholemeal-wrap','wrap','sandwich','bagel','salad','jacket-potato','toastie']:
  equipment+=['hob','non-stick frying pan','spatula','clean plate']
  if cook==0:cook=10;total=prep+cook;hands=total
  method=[step.replace('herbs, lemon juice and oil as the dressing','herbs and lemon juice as the dressing').replace('The timing assumes ready-to-eat cooked fillings.','The timing includes cooking the tofu; other fillings are ready to eat.') for step in method]
 # Every method describes its actual measured ingredients; make prep-state assumptions visible.
 if has('stock cube'):
  method.insert(0,'Dissolve the measured vegetable stock cube in250ml boiling water. Use this prepared stock in place of any additional cooking water specified below; simmer until the required sauce consistency is reached.')
  equipment+=['kettle','measuring jug']
  allergens_extra=['wheat/gluten','celery']
 else:allergens_extra=[]
 if any(i['item']=='eggs without shells'for i in items):notes.append('100g edible egg is about two medium eggs without shells; individual sizes vary.')
 if has('garlic powder|ground ginger|dried parsley|dried oregano|paprika|lemon juice')and not any('dressing' in x for x in method):
  method.insert(1,'Mix the measured herbs, spices and citrus into the listed cooking sauce or dressing. Keep cold yoghurt/mayonnaise dressings for serving; dry seasonings are cooked briefly with the pan vegetables, not burnt in an empty pan.')
 equipment=list(dict.fromkeys(equipment))
 allergens=set(old.get('allergens',[]))|set(allergens_extra)
 for i in items:
  text=i['item'].lower()
  if re.search('bread|bap|bagel|bun|wrap|flatbread|pitta|pasta|noodle|cracker|biscuit|oats',text):allergens.add('wheat/gluten' if 'oats' not in text else 'oats/gluten')
  if re.search('milk|yoghurt|cheese|mozzarella|cheddar|cream',text):allergens.add('milk')
  if re.search('egg|mayonnaise',text):allergens.add('egg')
  if re.search('mustard|mayonnaise|curry paste',text):allergens.add('mustard')
  if re.search('salmon|tuna|caesar',text):allergens.add('fish')
  if 'prawn' in text:allergens.add('crustaceans')
  if re.search('soy|soya|tofu|teriyaki|hoisin',text):allergens.add('soya')
  if 'peanut' in text:allergens.add('peanuts')
  if 'pesto' in text:allergens.update(['milk','nuts'])
 # Source preparation and product uncertainty is disclosed, never zero-filled.
 allergen_note='Check the exact labels of sauces, bread, sausages and dressings: recipes are not an allergy-safe selector. Substitutions change allergens and nutrition.'
 if has('curry|tikka|masala|madras|balti|harissa'):allergen_note+=' Prepared curry sauces/pastes can contain milk, mustard, peanuts or nuts; choose a vegetarian-labelled sauce for a vegetarian filling and check the jar.'
 if has('caesar'):allergen_note+=' Caesar dressing may contain anchovies; this recipe is not offered as vegetarian.'
 # Generic ambiguous curry sauces are kept out of automatic vegetarian selection rather than promised fish-free.
 method=[re.sub(r'(?<=\d)(?=[A-Za-z])', ' ', step) for step in method]
 title=title_for(r,f,p,items)
 tags=['uk-everyday',f]+['contains '+a for a in sorted(allergens)]
 animal=has(r'\b(chicken|turkey|beef|pork|ham|bacon|sausage|salmon|tuna|prawn|fish|anchovy)\b')
 uncertain=has('curry|tikka|masala|madras|balti|teriyaki|hoisin|caesar|harissa|pesto')
 if not animal and not uncertain:tags.append('vegetarian')
 if 'vegetarian'in tags and not has('milk|yoghurt|cheese|cream|egg|honey|mayonnaise'):tags.append('vegan')
 if has('salmon|tuna|fish'):tags.append('fish')
 if uncertain:allergen_note+=' Vegetarian suitability of prepared sauces is not established; this meal is excluded from automatic vegetarian choices.'

 data={'id':r['id'],'meal_type':old['meal_type'],'food_format':f,'servings':servings,'ingredients':[{'item':i['item'],'amount':i['amount']}for i in items],'method':method,'equipment':equipment,'allergens':sorted(allergens),'allergen_note':allergen_note,'storage':storage,'food_safety':safe,'prep_minutes':prep,'cook_minutes':cook,'total_minutes':total,'hands_on_minutes':hands,'timing_is_estimate':True,'timing_note':'Author estimates, not physical cooking trials. Packet instructions and safe doneness govern; larger batches need longer.','editorial_note':' '.join(notes),'nutrition':nutrition(items,servings),'ingredient_evidence':[{'item':i['item'],'amount':i['amount'],'calculation_grams':i['grams'],'food_code':i['cofid_code'],'source_food_name':i['source_food_name'],'mapping_basis':i['mapping_basis'],'mapping_limitation':i['mapping_limitation']}for i in items],'tags':tags,'taxonomy':{'family_size':'scalable','budget':'budget-friendly'if re.search('beans|chickpea|lentil|tofu',p)else'standard'}}
 return {'id':r['id'],'title':title,'data':data,'source_sha256':None,'correction_kind':'exact_existing_recipe_revision','human_review_claimed':False,'physical_cooking_trial_claimed':False}
# Named base label uses75g per-reference values, not cooked per100g values.
foods['sainsbury-base']={'name':"Sainsbury’s Pizza Bases x2 300g",'reference_grams':75,'kcal':'227','protein_g':'6','carbohydrate_g':'37.9','fat_g':'5.3','fibre_g':'1.5','saturates_g':'.8'}
rows=[]
for r in originals:
 if r['id'].startswith('everyday-'):continue # exact seven existing quick meals already corrected and published
 rows.append(finish(r))
owner={'id':'Matt O’Brien','kind':'human','role':'owner','instruction':'Get on with it please - 56 is not acceptable at all ….. we even advertise thousands - it’s a USP, they just need to be UK consumer relevant ……','recorded_at':'2026-10-18T00:00:45+01:00','scope':'Continue authorised Grub correction and deployment, preserve thousands of UK-relevant choices and existing member features. Not an assertion of independent human review.'}
pack={'proof':'GRUB_UK_FULL_EXISTING_CORRECTIONS_20261018','status':'owner_authorised','base':'c058780e1df1ac59968e08ac1959877ab80fd034','owner':owner,'source_input_sha256':hashlib.sha256(INPUT.read_bytes()).hexdigest(),'workbook_sha256':hashlib.sha256(WB.read_bytes()).hexdigest(),'human_editorial_review_claimed':False,'physical_cooking_trial_claimed':False,'recipes':rows,'foods':{k:foods[k]for k in sorted({i['food_code']for r in rows for i in r['data']['ingredient_evidence']})}}
out=ROOT/'content/grub/uk-full-corrections-20261018.json';out.write_text(json.dumps(pack,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'corrected_existing_recipes':len(rows),'food_sources':len(pack['foods']),'new_recipe_count_inflation':False,'publication_ready':False,'file':str(out)}))
