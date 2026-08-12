import json, os, re, sys
p=os.environ.get('COFID_INDEX','/tmp/cofid-index.json')
foods=json.load(open(p,encoding='utf-8')).get('foods',[])
TERMS=['tomato raw','tomato passata','pepper capsicum red raw','porridge oats','spinach raw','lettuce raw','bread wholemeal average','onions raw','broccoli green raw','carrots raw','yogurt low fat plain','tofu soya bean','egg boiled','rice brown basmati raw','rice white basmati raw','noodles egg dried raw','bread pitta','bread rolls wholemeal','bagel','potato chips oven ready baked','pizza base raw','paprika','cumin ground','chilli powder','garlic powder','parsley dried','oregano dried','mustard wholegrain','mayonnaise reduced fat','tomato ketchup','lemon juice','vinegar cider','mushrooms raw','baked beans tomato sauce','cheddar reduced fat','turkey breast','turkey mince','chicken breast raw','tuna canned brine drained','sweetcorn canned drained','peas frozen raw','courgette raw','spring onions raw','olive oil']
def toks(s):return set(re.findall(r'[a-z0-9]+',s.lower()))
def score(q,n):
 q=toks(q); n=toks(n)
 return len(q&n)/max(1,len(q))-.01*max(0,len(n-q))
for q in TERMS:
 ranked=sorted(((score(q,f.get('name','')),f) for f in foods),key=lambda x:x[0],reverse=True)[:6]
 print('\n##',q)
 for s,f in ranked: print(json.dumps({'score':round(s,3),'code':f.get('code'),'name':f.get('name'),'kcal':f.get('kcal'),'protein_g':f.get('protein_g'),'fat_g':f.get('fat_g'),'carbohydrate_g':f.get('carbohydrate_g'),'fibre_g':f.get('fibre_g')}))
