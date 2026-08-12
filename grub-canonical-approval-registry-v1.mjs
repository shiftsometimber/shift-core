// Governed canonical ingredient decisions. These approvals apply once to the
// canonical ingredient identity and are inherited only by recipes using that
// exact canonical identity. Codes reference the authoritative CoFID 2021
// extract used by the industrial nutrition gate.
export const CANONICAL_APPROVALS={
 'mixed peppers':{code:'13-524',basis:'red capsicum raw is a suitable proximates proxy for a mixed fresh sweet-pepper portion',confidence:'high',limitation:'pepper colour mix can shift micronutrients'},
 'mixed berries':{code:'14-324',basis:'raw strawberry is used as a conservative single-food proximates proxy for an unsweetened fresh mixed-berry portion',confidence:'medium',limitation:'berry mix changes fibre and micronutrients; use is limited to recipe-level energy/protein/carbohydrate/fat/fibre estimation and remains labelled as a proxy'},
 'tomato passata':{code:'13-530',basis:'canned tomatoes, whole contents, are a suitable unsweetened tomato-only macro proxy for plain passata',confidence:'high',limitation:'passata water concentration varies by brand'},
 'spinach':{code:'13-521',basis:'raw baby spinach is the suitable canonical source for generic raw spinach',confidence:'high'},
 'wholemeal wrap':{code:'11-925',basis:'wheat soft tortilla is the closest CoFID analogue for a generic wholemeal wrap',confidence:'medium',limitation:'brand fibre content varies'},
 'wholemeal bap':{code:'11-986',basis:'wholemeal bread roll is the direct generic analogue',confidence:'high'},
 'wholemeal burger bun':{code:'11-986',basis:'wholemeal bread roll is the direct generic analogue',confidence:'high'},
 'wholemeal bagel':{code:'11-970',basis:'plain bagel is the closest CoFID analogue',confidence:'medium',limitation:'wholemeal formulations vary by brand'},
 'wholemeal flatbread':{code:'11-974',basis:'pitta bread is the closest generic flatbread analogue',confidence:'medium',limitation:'flatbread formulations vary'},
 'red onion':{code:'13-499',basis:'raw onion proximates are suitable for red onion',confidence:'high'},
 'carrots':{code:'13-496',basis:'raw carrot is the canonical source',confidence:'high'},
 'wholewheat pasta, dry':{code:'11-718',basis:'dried wholewheat pasta is the direct canonical source',confidence:'high'},
 'wholewheat noodles':{code:'11-719',basis:'dried egg noodle is the closest CoFID analogue',confidence:'medium',limitation:'wholewheat noodle formulations vary'},
 'firm tofu':{code:'13-570',basis:'plain tofu is the closest canonical source; firmness mainly changes water content',confidence:'high',limitation:'firmness/water content varies'},
 'chicken breast':{code:'18-488',basis:'raw uncoated chicken breast/meat is the appropriate source before recipe cooking',confidence:'high'},
 'cooked chicken breast':{code:'18-323',basis:'grilled skinless chicken breast meat-only is the appropriate cooked source',confidence:'high'},
 'turkey mince':{code:'18-354',basis:'turkey mince is the appropriate CoFID mince source for the cooked recipe ingredient',confidence:'high',limitation:'retail fat percentage varies'},
 'cooked turkey breast':{code:'18-356',basis:'grilled turkey breast fillet meat-only is the appropriate cooked source',confidence:'high'},
 'lean ham':{code:'19-496',basis:'generic ham is the closest CoFID source',confidence:'medium',limitation:'retail fat and salt vary'},
 'lean back bacon':{code:'19-499',basis:'fat-trimmed grilled back bacon is the suitable lean-back-bacon source',confidence:'high'},
 '0% Greek yoghurt':{code:'12-533',basis:'virtually fat-free plain yoghurt is the closest suitable macro analogue',confidence:'high',limitation:'Greek-style brands vary in protein concentration'},
 'high-protein yoghurt':{code:'12-533',basis:'virtually fat-free plain yoghurt is a conservative base analogue',confidence:'medium',limitation:'protein-enriched brands can contain materially more protein'},
 'sweetcorn':{code:'13-529',basis:'drained canned sweetcorn is suitable for the ready-to-use generic ingredient',confidence:'high'},
 'tuna in spring water, drained':{code:'16-416',basis:'drained canned tuna in brine is the closest macro analogue',confidence:'high',limitation:'sodium differs; sodium is outside the current five-nutrient calculation'},
 'spring onion':{code:'13-351',basis:'spring onion is the direct canonical source',confidence:'high'},
 'kidney beans':{code:'13-660',basis:'drained canned red kidney beans are suitable for the ready-to-use ingredient',confidence:'high'},
 'peas':{code:'13-527',basis:'frozen raw peas are suitable for generic peas before recipe cooking',confidence:'high'},
 'potatoes':{code:'13-489',basis:'raw potato flesh is suitable before recipe cooking',confidence:'high'},
 'baking potato':{code:'13-489',basis:'raw potato flesh is suitable before baking',confidence:'high'},
 'roast potatoes':{code:'13-619',basis:'CoFID roast potato is the closest explicit prepared source',confidence:'high',limitation:'oil type and preparation vary'},
 'wholegrain crackers':{code:'11-1134',basis:'wholemeal crackers are the closest explicit CoFID category',confidence:'high',limitation:'brand composition varies'},
 'lemon juice':{code:'14-277',basis:'lemon juice is the direct canonical source',confidence:'high'},
 'cider vinegar':{code:'17-339',basis:'cider vinegar is the direct canonical source',confidence:'high'},
 'mushrooms':{code:'13-505',basis:'raw white mushroom is suitable for generic mushrooms before cooking',confidence:'high'},
 'baked beans':{code:'13-532',basis:'baked beans are the direct canonical source',confidence:'high'},
 'tikka masala sauce':{code:'17-626',basis:'CoFID Indian cook-in korma/tikka masala sauce is the closest suitable analogue',confidence:'medium',limitation:'retail recipes vary'},
 'reduced-sugar BBQ sauce':{code:'17-705',basis:'barbecue sauce is the closest CoFID analogue',confidence:'medium',limitation:'reduced-sugar brands may be lower in carbohydrate/energy'},
 'reduced-sugar BBQ glaze':{code:'17-705',basis:'barbecue sauce is the closest CoFID analogue',confidence:'medium',limitation:'glaze concentration and reduced-sugar formulations vary'},
 'peri-peri sauce':{code:'17-719',basis:'chilli sauce is the closest CoFID analogue',confidence:'medium',limitation:'brand recipes vary'},
 'sweet chilli sauce':{code:'17-719',basis:'chilli sauce is the closest CoFID analogue',confidence:'medium',limitation:'sugar level varies by brand'}
};
for(const x of Object.values(CANONICAL_APPROVALS))x.state='approved_canonical_proxy';
export const approvalFor=item=>CANONICAL_APPROVALS[item]||null;
