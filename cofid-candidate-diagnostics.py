#!/usr/bin/env python3
import json,sys,re
p=sys.argv[1] if len(sys.argv)>1 else '/tmp/cofid-index.json'
data=json.load(open(p)); foods=data['foods']
terms=[
 'tofu','turkey mince','turkey breast','noodles','wholewheat noodles','roast potatoes','bread rolls wholemeal','pitta wholemeal','flatbread','oven chips','pizza base','passata','chopped tomatoes',
 'curry sauce','curry tomato onion sauce','tomato sauce','tomato based sauce','chilli sauce','peri peri sauce','peppercorn sauce','garlic sauce','lemon sauce','herb sauce','harissa','teriyaki','hoisin','sweet chilli',
 'king prawns','lentils','sweetcorn','stock','oats','berries','yogurt greek','tuna canned','spinach raw','mixed salad','boiled egg','wholemeal wrap','wholemeal bagel','baked beans','ham'
]
def score(term,name):
 a=set(re.findall(r'[a-z0-9]+',term.lower())); b=set(re.findall(r'[a-z0-9]+',name.lower())); return len(a&b)/max(1,len(a))
for term in terms:
 ranked=sorted(((score(term,f['name']),f) for f in foods),key=lambda x:(-x[0],len(x[1]['name'])))[:10]
 print('\n##',term)
 for s,f in ranked:
  if s<=0: continue
  print(json.dumps({'score':round(s,3),**f},ensure_ascii=False))
