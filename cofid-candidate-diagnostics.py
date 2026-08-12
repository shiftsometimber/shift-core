#!/usr/bin/env python3
import json,sys,re
p=sys.argv[1] if len(sys.argv)>1 else '/tmp/cofid-index.json'
data=json.load(open(p)); foods=data['foods']
terms=['eggs whole boiled','eggs whole raw','turkey breast grilled','chicken breast grilled','lettuce raw','chick peas canned','red onion raw','cottage cheese low fat','apple eating raw','bacon back grilled','pork sausages reduced fat','chicken sausages','baked beans canned tomato','milk semi skimmed','cheddar reduced fat','tomato salsa','cucumber raw','wholemeal wrap','wholemeal bagel','tofu','turkey mince','noodles','roast potatoes','bread rolls wholemeal','pitta wholemeal','oven chips','pizza base','curry sauce','tomato sauce','teriyaki','hoisin','sweet chilli','harissa','turkey breast','king prawns','lentils','sweetcorn','stock','oats','berries','yogurt greek','tuna canned','spinach raw','mixed salad']
def score(term,name):
 a=set(re.findall(r'[a-z0-9]+',term.lower())); b=set(re.findall(r'[a-z0-9]+',name.lower())); return len(a&b)/max(1,len(a))
for term in terms:
 ranked=sorted(((score(term,f['name']),f) for f in foods),key=lambda x:(-x[0],len(x[1]['name'])))[:8]
 print('\n##',term)
 for s,f in ranked:
  if s<=0: continue
  print(json.dumps({'score':round(s,3),**f},ensure_ascii=False))
