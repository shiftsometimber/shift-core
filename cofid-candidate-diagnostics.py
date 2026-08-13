#!/usr/bin/env python3
import json,sys,re
p=sys.argv[1] if len(sys.argv)>1 else '/tmp/cofid-index.json'
data=json.load(open(p)); foods=data['foods']
# Highest-unlock unresolved V6 families first. Candidate output is diagnostic only:
# no match is promoted until suitability/proxy governance is explicit.
terms=[
 'toasted oat crunch','peppercorn sauce','chicken sausages','buffalo hot sauce','katsu sauce','garlic yoghurt',
 'tomato salsa','cajun seasoning','chipotle salsa','medium curry sauce','pepper tomato masala','balti sauce',
 'madras sauce','smoked chilli tomato sauce','garlic herb sauce','cajun tomato sauce','tomato olive herb sauce',
 'teriyaki sauce reduced salt','hoisin sauce','harissa tomato sauce','lemon herb sauce','light mayonnaise',
 'mustard mayonnaise','peri peri yoghurt','cajun yoghurt','caesar dressing','lemon herb yoghurt','tikka yoghurt',
 'sweet chilli sauce','smoked paprika dressing','pickle mustard relish','tomato pepper relish','house burger sauce',
 'burger relish','peri peri sauce','salt pepper seasoning','tikka sauce','kebab seasoning','hot chicken seasoning',
 'loaded burger sauce','smoked chilli relish','baked beans','hash brown','mushrooms garlic','spinach','spring onion',
 'red onion','kidney beans','peas','carrots','tomato passata','mixed peppers','broccoli','rocket','lettuce'
]
def toks(s): return set(re.findall(r'[a-z0-9]+',s.lower()))
def score(term,name):
 a=toks(term); b=toks(name)
 overlap=len(a&b)/max(1,len(a))
 phrase=1.0 if term.lower() in name.lower() else 0.0
 return overlap + phrase
for term in terms:
 ranked=sorted(((score(term,f['name']),f) for f in foods),key=lambda x:(-x[0],len(x[1]['name'])))[:10]
 print('\n##',term)
 for s,f in ranked:
  if s<=0: continue
  print(json.dumps({'score':round(s,3),**f},ensure_ascii=False))
