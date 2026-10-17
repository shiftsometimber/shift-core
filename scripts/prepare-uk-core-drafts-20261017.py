# Authoring only. No production writes, no publication authority.
import json, hashlib, re, html, os, subprocess
from pathlib import Path
from zipfile import ZipFile
from xml.etree import ElementTree as E
from decimal import Decimal, ROUND_HALF_UP
ROOT=Path(__file__).resolve().parents[1]
WORKBOOK=Path(os.environ['COFID_2021_WORKBOOK'])
assert hashlib.sha256(WORKBOOK.read_bytes()).hexdigest()=='436e9445ef2adb2a75f3d7edd51302de3adad25385f9795fc94ba58bd030e97d'
ns={'x':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
z=ZipFile(WORKBOOK);ss=[''.join(i.itertext()) for i in E.fromstring(z.read('xl/sharedStrings.xml'))]
foods={}
for row in E.fromstring(z.read('xl/worksheets/sheet4.xml')).findall('.//x:row',ns):
 vals={}
 for c in row:
  v=c.find('x:v',ns)
  if v is not None:vals[re.sub(r'\d','',c.attrib['r'])]=ss[int(v.text)] if c.get('t')=='s' else v.text
 if re.fullmatch(r'\d\d-\d{3,4}',vals.get('A','')):
  foods[vals['A']]={'code':vals['A'],'name':vals['B'],**{k:vals.get(col) for k,col in [('kcal','M'),('protein_g','J'),('fat_g','K'),('carbohydrate_g','L'),('fibre_g','Z'),('saturates_g','AB')]},'source':'CoFID 2021, 1.3 Proximates'}
# Product data describe one named UK label. Other brands require recalculation.
foods['tesco-pepperoni']={'code':'tesco-pepperoni','name':'Tesco Pepperoni Slices 130g','kcal':'386','protein_g':'17.6','fat_g':'34.5','carbohydrate_g':'1.3','fibre_g':'0','saturates_g':'13.3','salt_g':'3.73','source':'https://www.tesco.com/shop/en-GB/products/266510588','checked_at':'2026-10-17','limitation':'Reference label only; listed as out of stock at retrieval. Other pepperoni brands differ. No availability or supplier recommendation.'}
# Per half-base label values are tied to half of a 150g base as sold.
foods['sainsbury-base']={'code':'sainsbury-base','name':"Sainsbury's Pizza Bases x2 300g, half a base",'reference_grams':'75','kcal':'227','protein_g':'6.0','fat_g':'5.3','carbohydrate_g':'37.9','fibre_g':'1.5','saturates_g':'0.8','salt_g':'0.69','source':'https://www.sainsburys.co.uk/groceries/product/sainsburys-pizza-bases-x2-300g','checked_at':'2026-10-17','limitation':'Uses per half-base consumed label for half the corresponding base as sold. Label-rounded household estimate, not the per100g cooked value. Other bases require recalculation; may contain milk.'}
def ing(item,grams,code,amount=None,basis=None):
 return {'item':item,'amount':amount or f'{grams}g','calculation_grams':grams,'food_code':code,**({'basis':basis} if basis else {})}
def I(item,g,code):return ing(item,g,code)
cold={'chilled':'Cover and refrigerate promptly at 0–5°C. Eat within 24 hours of preparation or any earlier use-by/after-opening deadline. Keep chilled until eating.'}
hot={'chilled':'Eat immediately. These instructions do not cover storing or reheating the finished meal.'}
batch={'chilled':'Cool in shallow portions and refrigerate within 2 hours at 0–5°C. Eat within 48 hours of original cooking or freeze promptly. Follow any earlier ingredient deadline.','freezer':'Freeze cooled portions promptly in suitable labelled containers. Defrost completely in the fridge before reheating.','reheat':'Reheat once until steaming hot throughout. Stir where possible, check the centre and eat immediately.'}
safe=['Check all ingredient labels for allergens and use-by dates. Substitutions change nutrition and allergens; these recipes do not guarantee allergy suitability.','Wash hands, utensils and surfaces; wash fresh produce unless labelled ready washed. Keep ready-to-eat food separate from raw meat.']
rows=[]
def add(key,title,meal,servings,ingredients,method,allergens,prep,cook,total,hands_on,equipment,storage=hot,**extra):
 rows.append({'id':'uk-core-'+key,'title':title,'version':1,'status':'draft','data':{'meal_type':meal,'servings':servings,'ingredients':ingredients,'method':method,'allergens':allergens,'food_safety':safe,'equipment':equipment+['kitchen scales'],'storage':storage,'prep_minutes':prep,'cook_minutes':cook,'total_minutes':total,'hands_on_minutes':hands_on,'timing_is_estimate':True,'timing_note':'Author estimates; no physical cooking or timing trial. Packet instructions and doneness govern.','image':None,**extra},'review':{'status':'pending','author_ids':['/root'],'independent_review_claimed':False,'human_review_claimed':False,'physical_kitchen_trial_claimed':False},'publication_ready':False})
pizza_common=[I('ready-made pizza base',150,'sainsbury-base'),I('tomato purée',30,'13-531'),I('fresh mozzarella, drained',80,'12-360'),I('lettuce',100,'13-520'),I('cucumber',100,'13-523'),I('tomato',100,'13-517')]
pizza_methods=[
 'Preheat the oven to the temperature on the ready-made base packet; prepare the toppings while it heats. Use one 150g ready-made base, not raw dough. Allow longer if your base requires longer cooking.',
 'Mix the tomato purée with 30ml water and spread thinly over the base. Pat the drained mozzarella dry, tear it into small pieces and space them over the sauce.',
 'TOPPING',
 'Cook for the full time on the base packet, until the base is crisp, the cheese has melted and the centre is piping hot. The reference base takes 7–9 minutes at 200°C/180°C fan; follow your own packet. Do not put a glass board in the oven.',
 'Wash and dry the lettuce, cucumber and tomato; chop and divide between two plates. Cut the pizza in half and serve half with each salad. All toppings, cheese and salad are included in the two portions. Eat immediately; the reference base instructs not to reheat once cooled.'
]
for key,title,topping,method in [
 ('margherita-pizza','Margherita pizza with side salad',[I('fresh basil',2,'13-804')],'Keep the fresh basil aside and scatter it over the cooked pizza immediately before serving.'),
 ('pepperoni-pizza','Pepperoni pizza with side salad',[I('pepperoni slices',40,'tesco-pepperoni')],'Spread the pepperoni evenly over the cheese in a single layer; do not pile it in the centre.'),
 ('ham-pineapple-pizza','Ham and pineapple pizza with side salad',[I('ready-to-eat ham',60,'19-496'),I('fresh pineapple, edible flesh',80,'14-376')],'Cut the ham into small pieces and the pineapple into small chunks. Pat the pineapple dry with kitchen paper and spread both evenly over the cheese.'),
 ('mushroom-pizza','Mushroom pizza with side salad',[I('mushrooms',100,'13-505')],'Wipe or wash and dry the mushrooms, slice them very thinly and spread in a single layer over the cheese so they cook without soaking the base.')
]:
 add(key,title,'dinner',2,pizza_common+topping,[s.replace('TOPPING',method) for s in pizza_methods],['wheat/gluten','milk'],10,10,25,12,['oven','oven shelf or tray as packet directs','chopping board','knife','bowl','spoon','oven gloves'],food_format='pizza',editorial_note='Recognisable pizza. Portion includes vegetables; pepperoni and ham options are occasional processed-meat choices, not everyday default recommendations. A cold or optional frozen substitution requires its own safe preparation and recalculation.',leftovers_note='Use the remaining mozzarella, tomato purée, salad and toppings in another meal within their labels; freeze unused bases only if their packet permits.')
bread=I('wholemeal bread',160,'11-981')
add('egg-mayonnaise-sandwich','Egg mayonnaise sandwich','lunch',2,[bread,I('ready-boiled eggs, peeled',200,'12-940'),I('light mayonnaise',30,'17-679'),I('lettuce',40,'13-520')],
 ['Use four chilled, ready-boiled medium eggs, about 200g after peeling. The 5-minute timing assumes they are already cooked; raw eggs require separate boiling and safe cooling. Use four slices of bread weighing 160g in total.',
  'Chop the eggs and mix with the mayonnaise. Wash and dry the lettuce. Divide the filling and lettuce between two sandwiches; serve any filling that will not fit alongside. Keep chilled.'],
 ['egg','wheat/gluten','mustard'],5,0,5,5,['knife','chopping board','bowl','fork','two plates'],cold,food_format='sandwich')
add('cheese-tomato-sandwich','Cheese and tomato sandwich','lunch',2,[bread,I('reduced-fat Cheddar',60,'12-548'),I('tomato',160,'13-517'),I('lettuce',40,'13-520')],
 ['Use four bread slices weighing 160g in total. Wash and dry the tomato and lettuce. Slice the tomato and thinly slice or grate the Cheddar.',
  'Divide the cheese, tomato and lettuce between two sandwiches. Put the lettuce against the bread to help keep it dry. Eat now or wrap and chill; avoid packing warm ingredients.'],
 ['wheat/gluten','milk'],5,0,5,5,['knife','chopping board','grater if needed','two plates'],cold,food_format='sandwich')
pot=I('baking potatoes, skin on',600,'13-489')
for key,title,toppings,method,allergens in [
 ('jacket-beans-cheese','Jacket potato with beans and cheese',[I('baked beans',400,'13-532'),I('reduced-fat Cheddar',40,'12-548')],'Heat the baked beans in a small saucepan or microwave-safe bowl following their packet, stirring until steaming hot throughout. Grate the Cheddar.',['milk']),
 ('jacket-tuna-mayo','Jacket potato with tuna mayonnaise',[I('tuna in spring water, drained',200,'16-416'),I('light mayonnaise',30,'17-679')],'Drain and weigh the tinned tuna, flake it and mix with the mayonnaise. Keep chilled until the potatoes are ready.',['fish','egg','mustard'])
]:
 add(key,title,'lunch',2,[pot,*toppings,I('lettuce',100,'13-520'),I('tomato',160,'13-517')],
 ['Use two potatoes about 300g each. Scrub and prick them all over. Put on a microwave-safe plate and follow your appliance guide; at 800W allow about 12–16 minutes for two, turning halfway, then continue in 1-minute bursts until completely soft. Stand for 2 minutes. Appliances and potato size vary; the centre must be tender.',
  method,'Wash and dry the lettuce and tomato and divide between two plates. Split and fluff each potato, add half the topping to each and serve the salad alongside. Eat immediately. For an oven-only option, allow 60–90 minutes plus preheating; this is a separate longer choice.'],
 allergens,5,18,25,10,['microwave','microwave-safe plate','fork','oven gloves','knife','chopping board','bowl','spoon','saucepan or microwave-safe bowl if heating beans'],food_format='jacket-potato',nutrition_limitations=['Potato source is peeled raw flesh; skin-on portions have different fibre. Actual brand/edible weight and cooking loss vary.'])
add('tomato-lentil-pasta','Tomato and lentil pasta','dinner',2,
 [I('wholewheat pasta, dry',150,'11-718'),I('ready-cooked green lentils, drained',240,'13-661'),I('tinned chopped tomatoes',400,'13-530'),I('spinach',100,'13-521'),I('tomato purée',30,'13-531'),ing('olive oil',4.6,'17-038','5ml', '0.92g/ml household volume estimate')],
 ['Bring a saucepan of water to the boil. Cook the pasta for its packet time until tender; reserve a mug of cooking water before draining.',
  'Put the measured oil, chopped tomatoes and tomato purée in a large non-stick frying pan. Stir and simmer for 8–10 minutes, until the sauce thickens slightly.',
  'Add the drained, ready-cooked lentils. Simmer for 3–5 minutes until steaming hot. Wash the spinach, add it in handfuls and stir until fully wilted. Use canned or pouched cooked lentils; dry lentils cannot be substituted directly.',
  'Toss in the drained pasta. Add a little reserved pasta water if needed so the sauce coats it. Divide evenly between two bowls and serve.'],
 ['wheat/gluten'],5,15,20,15,['hob','saucepan','large non-stick frying pan','colander','spoon','two bowls'],batch,food_format='pasta',substitutions='Swap spinach for frozen spinach only after cooking it fully according to the packet. Recalculate nutrition and check the lentil and pasta labels for substitutions.')
add('chickpea-spinach-curry','Chickpea and spinach curry with rice','dinner',2,
 [I('chickpeas, canned, drained',240,'13-670'),I('tinned chopped tomatoes',400,'13-530'),I('spinach',120,'13-521'),I('medium curry paste',40,'17-720'),I('basmati rice, dry',120,'11-857'),ing('olive oil',4.6,'17-038','5ml')],
 ['Start the measured dry rice in a saucepan, following the water quantity and cooking time on its packet. Keep it covered briefly while finishing the curry and serve immediately.',
  'Heat the oil gently in a non-stick pan. Stir in the curry paste for the time on its label; add the chopped tomatoes, bring to a simmer and cook for 5 minutes. Stir and lower the heat if it catches.',
  'Add drained and rinsed canned chickpeas and simmer for another 5 minutes, until steaming hot. Wash the spinach and stir it in until fully wilted. If the paste label requires longer cooking, allow the extra time.',
  'Divide the freshly cooked rice and curry between two bowls. This method uses ready-cooked chickpeas, not dry ones.'],
 ['mustard (may be in curry paste; check the exact jar)'],5,15,20,15,['hob','two saucepans, one with lid','spoon','sieve or colander','two bowls'],
 {'chilled':'Cool any leftover rice quickly, ideally within 1 hour. Refrigerate at 0–5°C and use within 24 hours of cooking. Do not leave rice in a pan at room temperature.','reheat':'Reheat once until steaming hot throughout and eat immediately; stir to distribute heat.'},
 food_format='curry',allergen_note='Curry paste may contain mustard, nuts, peanuts, milk, fish or other allergens. The exact jar label governs; the recipe is not an allergy-safe selector.')
add('chicken-vegetable-noodles','Chicken and vegetable noodles','dinner',2,
 [I('raw skinless chicken breast',300,'18-488'),I('dried egg noodles',120,'11-719'),I('red pepper',160,'13-524'),I('broccoli',160,'13-502'),I('reduced-salt soy sauce',20,'17-722'),ing('olive oil',9.2,'17-038','10ml')],
 ['Bring a saucepan of water to the boil. Cut the broccoli into small florets and cook for 3–4 minutes, then lift out with a slotted spoon. Cook the noodles in the same water for their packet time, then drain.',
  'Deseed and thinly slice the pepper. On a separate board, cut the raw chicken into thin strips about 1cm thick; wash hands, knife and board after raw chicken.',
  'Heat the measured oil in a large non-stick frying pan or wok over medium-high heat. Cook the chicken strips for about 7–10 minutes, turning, until cooked throughout; a clean thermometer should read 75°C for 30 seconds. If crowded, cook in batches and allow extra time. Put on a clean plate.',
  'Cook the pepper in the same pan for 3–4 minutes. Add cooked broccoli, drained noodles, soy sauce and 30ml water. Toss for 1–2 minutes, then return the chicken and any juices. Heat until steaming hot throughout, divide between two bowls and serve.'],
 ['egg','wheat/gluten','soya'],8,12,25,23,['hob','saucepan','large non-stick frying pan or wok','knife','separate chopping boards','colander','slotted spoon','spatula','clean plate','food thermometer','two bowls'],batch,food_format='stir-fry',timing_note='25-minute estimated total for two, with overlapping noodle cooking. Batches or slow chopping take longer; not presented as a 5-minute meal.')
add('vegetable-omelette','Vegetable omelette with toast','dinner',2,
 [I('eggs, without shells',200,'12-937'),I('mushrooms',160,'13-505'),I('tomato',160,'13-517'),I('reduced-fat Cheddar',40,'12-548'),I('wholemeal bread',80,'11-981'),ing('olive oil',9.2,'17-038','10ml')],
 ['Use four medium eggs, approximately 200g edible weight, and two slices of bread weighing 80g in total. Wash and slice the mushrooms and tomatoes; grate the cheese. Beat the eggs in a bowl and wash hands after raw eggs.',
  'Heat half the oil in a large non-stick frying pan over medium heat. Cook the mushrooms for 4–5 minutes until softened and their released moisture has evaporated.',
  'Add the remaining oil, then the eggs and tomatoes. Move the set edges gently towards the middle so liquid egg runs into the gaps. Lower the heat, sprinkle over the cheese and cover for 3–5 minutes until the egg is fully set throughout, with no liquid egg remaining.',
  'Meanwhile toast the bread. Divide the fully cooked omelette into two and serve with a slice of toast each. If your pan is small, cook two omelettes and allow extra time.'],
 ['egg','milk','wheat/gluten'],5,12,20,17,['hob','large non-stick frying pan with lid','bowl','fork','spatula','knife','chopping board','grater','toaster','two plates'],food_format='omelette')
add('apple-yoghurt','Apple and yoghurt','snack',1,[I('apple, edible flesh and skin',120,'14-319'),I('plain low-fat yoghurt',150,'12-533')],
 ['Wash and core a small apple, then slice; 120g is an edible-portion estimate, not a requirement to weigh each slice.',
  'Serve the apple with the chilled yoghurt. Check the yoghurt label for allergens and eat now or keep chilled as described below.'],
 ['milk'],3,0,3,3,['knife','chopping board','bowl','spoon'],cold,food_format='fruit-and-yoghurt')
add('apple-peanut-butter','Apple with peanut butter','snack',1,[I('apple, edible flesh and skin',120,'14-319'),I('peanut butter',15,'14-892')],
 ['Wash and core a small apple, then slice. The stated apple weight excludes the core.',
  'Put a measured 15g spoonful of peanut butter on a plate for dipping. Eat now; do not give this as a nut-free option.'],
 ['peanuts'],3,0,3,3,['knife','chopping board','plate','spoon'],hot,food_format='fruit-and-nuts')
# Resolve source identity gaps against primary labels; keep the initial draft history separate.
foods['tesco-basil']={'code':'tesco-basil','name':'Tesco Basil 15g, fresh','kcal':'40','protein_g':'2.5','fat_g':'0.6','carbohydrate_g':'4.3','fibre_g':'3.9','saturates_g':'0.1','source':'https://www.tesco.com/shop/en-GB/products/302225353','checked_at':'2026-10-17','limitation':'Reference fresh-basil label; not an availability claim. Other products vary.'}
foods['tesco-cooked-noodles']={'code':'tesco-cooked-noodles','name':'Tesco Egg Noodles 300g, cooked, when microwaved as directed','kcal':'123','protein_g':'4.0','fat_g':'1.2','carbohydrate_g':'22.7','fibre_g':'2.5','saturates_g':'0.1','source':'https://www.tesco.com/shop/en-GB/products/290981391','checked_at':'2026-10-17','limitation':'Cooked egg noodles with oil already included in the product. Use the full 300g pack and microwave as directed. This is not a dry-noodle value; all recipe frying oil is separately included.'}
for r in rows:
 if r['id']=='uk-core-margherita-pizza':
  for i in r['data']['ingredients']:
   if i['item']=='fresh basil':i['food_code']='tesco-basil'
 if r['id']=='uk-core-chicken-vegetable-noodles':
  d=r['data']
  for i in d['ingredients']:
   if i['item']=='dried egg noodles':i.update(item='ready-cooked egg noodles',amount='300g',calculation_grams=300,food_code='tesco-cooked-noodles')
   if i['item']=='reduced-salt soy sauce':i.update(item='soy sauce',food_code='17-721',basis='CoFID generic soy sauce; exact brand salt and allergens vary. No reduced-salt claim.')
   if i['item']=='raw skinless chicken breast':i['basis']='CoFID raw chicken meat average is a declared proxy for raw skinless breast. Exact fat and energy vary with the cut and pack.'
  d['method']=[
   'Wash and slice the pepper and cut the broccoli into small florets. On a separate board, cut the raw chicken into strips about 1cm thick; wash hands, knife and board after raw chicken.',
   'Heat the measured oil in a large non-stick pan over medium-high heat. Cook the chicken for about 7–10 minutes, turning, until cooked through; check 75°C for 30 seconds with a clean thermometer. Cook in batches if crowded and allow extra time. Transfer to a clean plate.',
   'Put the pepper and broccoli in the same pan with 60ml water. Cover and cook for 4–6 minutes until tender with some bite. Meanwhile microwave the full 300g pack of ready-cooked noodles exactly as its packet directs, including standing time. The reference pack takes 2 minutes 30 seconds at 800W plus 1 minute standing. Do not use 300g dry noodles.',
   'Add the hot noodles, measured soy sauce and cooked chicken with its juices to the vegetables. Toss for 1–2 minutes until the whole dish is steaming hot. Divide between two bowls and eat immediately; the reference noodle pack says not to reheat once cooled.'
  ]
  d['equipment']=['hob','large non-stick pan with lid','microwave','microwave-safe plate','knife','separate chopping boards','spatula','clean plate','food thermometer','two bowls','kitchen scales']
  d['storage']=hot
  d['timing_note']='25-minute estimate for two. Pre-cooked noodles reduce washing-up. Chicken batches or slow preparation take longer; no 5-minute claim.'
 if r['id']=='uk-core-apple-yoghurt':
  r['data']['ingredients'][1]['item']='plain virtually fat-free yoghurt'

# Verify food identity and every ingredient calculation, retaining all unknowns.
nutrients=['kcal','protein_g','carbohydrate_g','fat_g','fibre_g','saturates_g']
def val(v):
 if v=='Tr':return Decimal('0')
 try:return Decimal(str(v))
 except:return None
for r in rows:
 d=r['data']; evidence=[]
 for i in d['ingredients']:
  f=foods[i['food_code']]
  evidence.append({**i,'source_food_name':f['name'],'source':f['source'],'per_reference':{n:f.get(n) for n in nutrients},'reference_grams':f.get('reference_grams','100'),'limitations':f.get('limitation',i.get('basis','Generic source estimate; brands and edible weights vary.'))})
 nutrition={};unknown={}
 for n in nutrients:
  values=[val(e['per_reference'][n]) for e in evidence]
  if any(v is None for v in values):
   nutrition[n]=None;unknown[n]=[e['item'] for e,v in zip(evidence,values) if v is None]
  else:
   total=sum((v*Decimal(str(e['calculation_grams']))/Decimal(e['reference_grams']) for e,v in zip(evidence,values)),Decimal(0))/Decimal(d['servings'])
   nutrition[n]=float(total.quantize(Decimal('.1'),rounding=ROUND_HALF_UP))
 d['nutrition']={'status':'calculated_draft',**nutrition,'methodology':'Ingredient-by-ingredient CoFID 2021 or explicitly named UK product-label calculation. Per serving; unrounded decimal inputs, final values rounded to 0.1. Traces treated as zero; N/blank retained as unknown, never zero-filled.','unknown_nutrients':unknown,'precision_note':'Estimates. Products, portion weights and cooking losses vary. Product proxy and missing-value limitations are in ingredient evidence.'}
 d['ingredient_evidence']=evidence
 r['required_review']=['Independent editorial review of this exact content','Human second-person review under docs/SHIFT-MEMBER-HUMANNESS-STANDARD.md','Resolve missing nutrient values/source identity limitations before publication','Exact immutable publication binding; existing owner batches are not inherited']
 r['content_hash']=hashlib.sha256(json.dumps(r,ensure_ascii=False,separators=(',',':')).encode()).hexdigest()
pack={'proof':'GRUB_UK_CORE_AUTHORING_DRAFT_20261017','source':'a32be98c67fe0ddb857017650fab02f996bc98e0','publication_ready':False,'independent_review':False,'human_review':False,'physical_cooking_trials':False,'sources':['https://www.nhs.uk/live-well/eat-well/food-guidelines-and-food-labels/the-eatwell-guide/','https://www.gov.uk/government/publications/cooking-your-food/cooking-your-food','https://www.gov.uk/government/publications/how-to-chill-freeze-and-defrost-food-safely/how-to-chill-freeze-and-defrost-food-safely','https://www.gov.uk/government/publications/composition-of-foods-integrated-dataset-cofid'],'workbook_sha256':hashlib.sha256(WORKBOOK.read_bytes()).hexdigest(),'candidates':rows}
out=ROOT/'content/grub/uk-core-drafts-20261017.json';out.write_text(json.dumps(pack,ensure_ascii=False,indent=2)+'\n')
subprocess.run(['node','--input-type=module','-e',"import fs from 'node:fs';import{createHash}from'node:crypto';const f=process.argv[1],p=JSON.parse(fs.readFileSync(f));for(const r of p.candidates){const{content_hash,...b}=r;r.content_hash=createHash('sha256').update(JSON.stringify(b)).digest('hex')}fs.writeFileSync(f,JSON.stringify(p,null,2)+String.fromCharCode(10));",str(out)],check=True)
source=ROOT/'evidence/grub-expansion-closeout-2026-09-16/uk-core-source-extract-20261017.json';source.write_text(json.dumps({'workbook_sha256':pack['workbook_sha256'],'foods':{k:foods[k] for k in sorted({i['food_code'] for r in rows for i in r['data']['ingredients']})}},ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'drafts':len(rows),'file':str(out),'names':[r['title'] for r in rows],'source_gaps':{r['id']:r['data']['nutrition']['unknown_nutrients'] for r in rows if r['data']['nutrition']['unknown_nutrients']},'published':0}))
