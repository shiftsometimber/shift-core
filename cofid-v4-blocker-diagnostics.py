import json, os, re
foods=json.load(open(os.environ.get('COFID_INDEX','/tmp/cofid-index.json'),encoding='utf-8')).get('foods',[])
terms=['tomatoes raw','berries mixed','pumpkin seeds','yogurt greek plain','wrap tortilla wholemeal','turkey mince','eggs boiled','turkey breast grilled','crackers wholemeal','rocket raw','chicken breast cooked','potato baked','salad green','noodles egg dried','chickpeas canned drained','bread rolls wholemeal','ham lean','bagel','bread pitta','red onion raw','tomato passata','oat cereal toasted','dark chocolate','peri peri sauce','eggs chicken boiled','cottage cheese low fat','chilli sauce','apple raw','peppercorn sauce','bacon back grilled','pork sausages reduced fat','chicken sausages','yogurt high protein']
def tok(s):return set(re.findall(r'[a-z0-9]+',str(s).lower()))
def score(q,n):
 q=tok(q);n=tok(n);return len(q&n)/max(1,len(q))-.02*len(n-q)
for q in terms:
 print('\n##',q)
 for s,f in sorted(((score(q,f.get('name','')),f) for f in foods),key=lambda x:x[0],reverse=True)[:10]:
  print(json.dumps({'score':round(s,3),'code':f.get('code'),'name':f.get('name'),'kcal':f.get('kcal'),'protein_g':f.get('protein_g'),'fat_g':f.get('fat_g'),'carbohydrate_g':f.get('carbohydrate_g'),'fibre_g':f.get('fibre_g')}))