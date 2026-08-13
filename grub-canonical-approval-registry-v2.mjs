import {CANONICAL_APPROVALS as V1} from './grub-canonical-approval-registry-v1.mjs';

// Second governed proxy wave. These are deliberately limited to ingredients
// where CoFID 2021 provides a defensible macro-level analogue. Ambiguous items
// remain quarantined rather than being forced through a weak match.
const WAVE2={
  'reduced-salt teriyaki sauce':{code:'17-629',basis:'CoFID Chinese stir-fry sauce is the closest prepared Chinese savoury sauce macro analogue for a generic reduced-salt teriyaki portion',confidence:'medium',limitation:'teriyaki sweetness and sodium vary by formulation; sodium is outside the current five-nutrient calculation'},
  'hoisin-style sauce':{code:'17-629',basis:'CoFID Chinese stir-fry sauce is the closest prepared Chinese savoury sauce macro analogue for a generic hoisin-style portion',confidence:'medium',limitation:'hoisin sugar and bean-paste content vary materially by brand'},
  'lemon zest':{code:'14-337',basis:'lemon peel is the direct food-composition source for grated lemon zest at recipe quantities',confidence:'medium',limitation:'whole peel can contain more pith than culinary zest'},
  'crushed wholegrain biscuit':{code:'11-1034',basis:'wholemeal homemade biscuit is the closest explicit wholegrain-style biscuit analogue in CoFID',confidence:'medium',limitation:'retail wholegrain biscuit fat and sugar vary by brand'},
  'light cream cheese':{code:'12-537',basis:'plain reduced-fat cheese spread is the closest CoFID analogue for generic light cream cheese',confidence:'medium',limitation:'cream-cheese and cheese-spread formulations differ by brand'},
  'mixed beans, drained':{code:'13-660',basis:'drained canned red kidney beans are a conservative ready-to-use pulse proxy for an unspecified drained mixed-bean portion',confidence:'medium',limitation:'bean mix changes fibre, protein and carbohydrate modestly'},
  'salad leaves':{code:'13-520',basis:'raw lettuce is a suitable macro proxy for a generic mixed salad-leaf portion',confidence:'high',limitation:'leaf mix changes micronutrients more than the calculated macros'},
  '0% Greek yoghurt dressing':{code:'12-533',basis:'virtually fat-free plain yoghurt is the dominant macro component of a generated 0% Greek-yoghurt dressing',confidence:'medium',limitation:'seasoning additions are not separately represented'},
  'wholemeal pitta':{code:'11-974',basis:'plain pitta bread is the closest CoFID pitta analogue for a generic wholemeal pitta',confidence:'medium',limitation:'wholemeal formulations can contain more fibre'},
  'lemon yoghurt dressing':{code:'12-533',basis:'virtually fat-free plain yoghurt is the dominant macro component of the generated lemon-yoghurt dressing',confidence:'medium',limitation:'lemon and seasoning additions are not separately represented'},
  'lime yoghurt dressing':{code:'12-533',basis:'virtually fat-free plain yoghurt is the dominant macro component of the generated lime-yoghurt dressing',confidence:'medium',limitation:'lime and seasoning additions are not separately represented'},
  'tomato pesto':{code:'17-623',basis:'CoFID red pesto is the direct prepared-family analogue for tomato-led pesto',confidence:'high',limitation:'tomato, cheese and oil proportions vary by brand'},
  'medium curry paste':{code:'17-720',basis:'CoFID curry paste is the direct prepared-family analogue for a generic medium curry paste',confidence:'high',limitation:'brand heat, oil and salt vary'},
  'reduced-salt soy sauce':{code:'17-721',basis:'CoFID soy sauce light/dark varieties is the closest direct family analogue for reduced-salt soy sauce',confidence:'medium',limitation:'reduced-salt products contain less sodium; sodium is outside the current five-nutrient calculation'},
  'smoked paprika':{code:'13-879',basis:'paprika is the direct spice-family source; smoking changes flavour rather than the five calculated macros materially',confidence:'high'},
  'pineapple chunks':{code:'14-376',basis:'raw pineapple is a suitable unsweetened fruit macro analogue when generated pineapple chunks do not specify syrup',confidence:'medium',limitation:'canned-in-syrup products would be higher in carbohydrate and energy'},
  'cooked salmon':{code:'16-359',basis:'baked salmon is the closest generic cooked-salmon CoFID source',confidence:'high',limitation:'cooking method and retained moisture vary'}
};

for(const x of Object.values(WAVE2))x.state='approved_canonical_proxy';
export const CANONICAL_APPROVALS={...V1,...WAVE2};
export const approvalFor=item=>CANONICAL_APPROVALS[item]||null;
