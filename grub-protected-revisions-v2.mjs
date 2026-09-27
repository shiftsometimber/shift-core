// Twelve insertion-only successors. Original accepted V1 rows remain immutable.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {digest,recalculateNutrition,EXPANSION_MAPPING_OVERRIDES} from './grub-expansion-repairs-v1.mjs';
import {DEFAULT_COFID_INDEX} from './grub-expansion-review-pack.mjs';

export const PROTECTED_REVISION_PROOF = 'GRUB_PROTECTED_RECIPE_REVISIONS_V2';
export const PROTECTED_REVISION_AUTHOR = '/root/grub_closeout';
const must = (ok,message) => { if (!ok) throw new Error(message); };
const unique = values => [...new Set(values)];
export const protectedRevisionContentHash = candidate => digest({id:candidate.id,original_id:candidate.original_id,expected_source_content_hash:candidate.expected_source_content_hash,item:candidate.structured_item_draft});

function proteinStep(item) {
  const safety = 'Check the thickest part with a clean food thermometer: it must reach 70°C and remain there for 2 minutes.';
  if (item === 'lean back bacon') return `Trim visible fat and weigh the listed 90g bacon raw, then cut into bite-size pieces. In the second frying pan, use 2ml of the measured olive oil and cook over a medium heat, turning for about 6–8 minutes until fully cooked. ${safety} Transfer to a clean plate while the vegetables cook.`;
  if (item === 'reduced-fat pork sausages') return `In the second frying pan, use 2ml of the measured olive oil and cook the listed sausages following their packet time, usually about 15–20 minutes, turning regularly so they cook through without burning. ${safety} Slice after cooking and transfer to a clean plate while the vegetables cook.`;
  if (item === 'chicken breast') return `Cut the listed 100g raw chicken breast into thin strips on a separate board. Wash hands and utensils after handling it. In the second frying pan, use 2ml of the measured olive oil and cook over a medium heat for about 8–10 minutes, turning regularly. ${safety} The centre should have no pink flesh and the juices should be clear. Transfer to a clean plate while the vegetables cook.`;
  if (item === 'large eggs') return 'Crack the eggs, discard the shells and weigh 100g of edible egg into a clean bowl, then beat it. The gram amount governs the portion; two eggs is only an approximation. After cooking the vegetables as described above, add the reserved 2ml olive oil and the beaten eggs to that pan. Stir gently over a medium heat until both white and yolk are fully set, keeping the mixture moist rather than browned.';
  if (item === 'cooked turkey breast') return 'Keep the listed already-cooked turkey refrigerated until the vegetables have softened as described above. Slice it thinly, then add it to those vegetables with the reserved 2ml olive oil and stir over a medium heat until steaming hot all the way through. This uses the single reheating of the cooked turkey: assemble and eat immediately.';
  if (item === 'baked beans') return 'Use the listed ready-cooked canned baked beans. After softening the vegetables as described above, add the beans and reserved 2ml olive oil to that pan. Heat gently, stirring, until steaming hot throughout; do not brown or dry out the beans.';
  throw new Error(`unsupported protected protein: ${item}`);
}

export function buildProtectedRevisionCandidates({proposalPack,foods,mappings,retainedGrams}) {
  must(proposalPack?.proof === 'GRUB_PROTECTED_QUANTITY_REVISION_PACK_V1' && proposalPack.revisions?.length === 12,'twelve retained quantity proposals required');
  const seen = new Set();
  const candidates = proposalPack.revisions.map(proposal => {
    const {correction_digest,...originalProposal} = proposal;
    must(digest(originalProposal) === correction_digest,'original proposal digest mismatch');
    must(proposal.proof === 'GRUB_PROTECTED_QUANTITY_CORRECTION_V1' && !seen.has(proposal.source_id),'original proposal identity mismatch');
    seen.add(proposal.source_id);
    must(digest(proposal.proposed_content) === proposal.proposed_content_hash,'original proposed content hash mismatch');
    const originalContent = structuredClone(proposal.proposed_content);
    originalContent.ingredients = originalContent.ingredients.map(row => {
      const change = proposal.changes.find(change => change.item === row.item);
      return change ? {...row,amount:change.before_amount} : row;
    });
    originalContent.nutrition = proposal.before_nutrition;
    must(digest(originalContent) === proposal.expected_current_content_hash,'accepted original content hash mismatch');
    const match = proposal.source_id.match(/^industrial-v3-breakfast-(buttie|wrap)-hash-brown-(bacon|sausage|egg|chicken-sausage|turkey|beans)$/);
    must(match,'protected correction outside exact twelve hash-brown IDs');
    const source = structuredClone(proposal.proposed_content), [protein,base] = source.ingredients;
    must(source.ingredients.length === 7 && source.ingredients.find(row => row.item === 'olive oil')?.amount === '10ml' && source.ingredients.find(row => row.item === 'baby potatoes')?.amount === '120g' && source.ingredients.find(row => row.item === 'onion')?.amount === '20g','unexpected retained ingredient identity/quantity');
    const buttie = match[1] === 'buttie', late = ['large eggs','cooked turkey breast','baked beans'].includes(protein.item);
    if (protein.item === 'large eggs') protein.amount = '100g without shell (about 2 eggs)';
    const veg = buttie ? '90g tomato' : '90g mixed peppers';
    const method = [
      `Peel the baby potatoes and weigh 120g of the raw peeled flesh, then dice it into roughly 1cm pieces. Peel and finely grate the measured 20g onion, chop the ${veg}, and wash the 90g spinach. Keep raw-meat preparation separate from these vegetables.`,
      'Put the diced potatoes into a saucepan of boiling water. Simmer for about 8–10 minutes until a fork passes easily through the centre. Drain thoroughly in a colander, leave to steam dry for 2 minutes, then roughly mash with a fork. Mix in the finely grated onion and press into two small, thin potato patties, about 1cm thick.',
      'Heat 6ml of the measured 10ml olive oil in a non-stick frying pan over a medium heat. Fry the potato patties for about 6–8 minutes on each side, turning carefully with a wide spatula, until golden and crisp and the onion is soft. Lower the heat if they darken before the onion cooks. While they cook, prepare the protein and vegetables in the second pan using the steps below. Keep the finished patties warm on a clean plate until assembly.',
      ...(!late ? [proteinStep(protein.item)] : []),
      `In the second frying pan, heat 2ml of the measured oil over a medium heat. Cook the chopped ${buttie ? 'tomato' : 'mixed peppers'} for ${buttie ? '3–4' : '5–7'} minutes until softened, then add the spinach and stir until wilted. ${!late ? 'Return the cooked protein and its juices to the vegetables just before assembling, keeping everything hot.' : 'Finish the protein as described in the next step.'}`,
      ...(late ? [proteinStep(protein.item)] : []),
      buttie
        ? `Split and toast the measured ${base.amount} wholemeal bap. Put one crisp potato patty and a manageable amount of hot protein and vegetables inside. Serve the second patty and all remaining filling alongside; the nutrition includes the complete listed portion.`
        : `Warm the measured ${base.amount} wholemeal wrap in a clean dry pan for 20–30 seconds so it bends easily. Add a manageable amount of the hot filling and crumbled crisp potato, fold the sides in and roll firmly. Briefly place it seam-side down in the dry pan to seal. Serve all remaining potato and filling alongside; the nutrition includes the complete listed portion.`,
      protein.item === 'cooked turkey breast' ? 'Eat immediately. Do not cool and reheat the turkey filling or assembled meal again.' : 'Serve immediately while the potato is crisp. For preparing ahead, follow the component storage instructions; assemble only when ready to eat.'
    ];
    const equipment = ['hob','saucepan','colander','two-frying-pans','bowl','knife','peeler','chopping-board','grater','fork-or-potato-masher','wide-spatula','spoon','clean-plate','measuring-spoon','kitchen-scales'];
    if (buttie) equipment.push('toaster');
    if (protein.item === 'chicken breast') equipment.push('separate-raw-meat-chopping-board');
    if (['lean back bacon','reduced-fat pork sausages','chicken breast'].includes(protein.item)) equipment.push('food-thermometer');
    const storage = protein.item === 'cooked turkey breast'
      ? {chilled:'Keep the already-cooked turkey refrigerated until preparing this meal. Eat the finished meal immediately; do not store it for later reheating.',freezer:'Do not freeze the finished meal containing reheated turkey.',reheat:'The preparation already reheats cooked turkey once. Do not cool and reheat it again.'}
      : {chilled:'For preparing ahead, divide cooked components into small portions, cool promptly and refrigerate in covered containers within two hours of cooking. Keep the fridge at 0–5°C. Eat within 24 hours, or sooner if an ingredient use-by date requires it. Assemble just before eating.',freezer:'Do not freeze the assembled bap or wrap; these instructions cover fresh preparation and up to 24 hours refrigerated component storage.',reheat:'Reheat chilled cooked components once only until steaming hot throughout, then assemble and eat immediately.'};
    const food_safety = ['Wash hands and prevent cross-contamination between raw meat and ready-to-eat food.','Cook raw animal proteins fully; follow the specific method and packet instructions.','Check actual product labels for allergens and the shortest use-by date; recipe tags do not guarantee allergy suitability.',...(protein.item === 'baked beans' ? ['Use ready-cooked canned baked beans, not raw dried beans.'] : []),...(protein.item === 'cooked turkey breast' ? ['The already-cooked turkey is reheated during preparation; do not reheat it again.'] : [])];
    const ingredientMappings = {...mappings,...(protein.item === 'lean back bacon' ? {'lean back bacon':EXPANSION_MAPPING_OVERRIDES['lean back bacon']} : {})};
    const nutrition = recalculateNutrition(source,foods,ingredientMappings,retainedGrams);
    const data = {meal_type:source.meal_type,servings:source.servings,ingredients:source.ingredients,method,equipment,allergens:unique(source.allergens || []),storage,food_safety,
      nutrition:{status:'validated',...nutrition.nutrition,methodology:'CoFID 2021 ingredient-level exact decimal calculation; 10ml oil and raw trimmed bacon identity where applicable'},ingredient_evidence:nutrition.ingredient_evidence,
      prep_minutes:15,cook_minutes:45,rest_minutes:0,total_minutes:60,timing_is_estimate:true,timing_basis:'Conservative estimate including potato preparation, two-pan cooking and assembly; packet instructions and doneness checks govern cooking.',food_format:buttie?'breakfast-buttie':'breakfast-wrap',tags:['breakfast','hash-brown',buttie?'buttie':'wrap'],taxonomy:{meal_type:'breakfast',food_format:buttie?'breakfast-buttie':'breakfast-wrap',prep_band:'standard'},
      shift_says:'Keep the potato patties thin and let the surface turn golden before flipping. Serve any filling that will not fit comfortably alongside.'};
    const id = `${proposal.source_id}--hash-brown-repair-v2`;
    const candidate = {id,original_id:proposal.source_id,expected_source_content_hash:proposal.expected_current_content_hash,prior_quantity_proposal_digest:proposal.correction_digest,
      author_ids:[PROTECTED_REVISION_AUTHOR],correction_scope:['compound_oil_quantity','raw_peeled_potato_identity','complete_potato_cooking','protein_specific_method','measured_oil_allocation','equipment','single_reheat_storage','serving_metadata',...(protein.item==='lean back bacon'?['raw_bacon_nutrition_identity']:[]),...(protein.item==='large eggs'?['egg_edible_weight_identity']:[])],
      structured_item_draft:{id,contentType:'recipe',title:source.title,version:2,status:'draft',data,review:{status:'pending',scope:'exact_protected_recipe_revision',author_ids:[PROTECTED_REVISION_AUTHOR],human_review_claimed:false}},
      source_unchanged:true,publication_ready:false};
    candidate.content_hash = protectedRevisionContentHash(candidate);
    return candidate;
  });
  return {proof:PROTECTED_REVISION_PROOF,revision_version:2,source_cohort:798,revision_count:12,insertion_only:true,original_rows_mutated:false,publication_ready:false,
    source_urls:['https://www.gov.uk/government/publications/cooking-your-food/cooking-your-food','https://www.gov.uk/government/publications/home-food-fact-checker/home-food-fact-checker','https://www.gov.uk/government/publications/how-to-chill-freeze-and-defrost-food-safely/how-to-chill-freeze-and-defrost-food-safely','https://www.gov.uk/government/publications/composition-of-foods-integrated-dataset-cofid'],
    candidates,candidate_digest:digest(candidates.map(row=>({id:row.id,original_id:row.original_id,expected_source_content_hash:row.expected_source_content_hash,content_hash:row.content_hash}))) };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  process.env.COFID_INDEX ||= DEFAULT_COFID_INDEX;
  const {APPROVED,grams} = await import('./industrial-grub-systemic-v3.mjs');
  const directory='evidence/grub-expansion-closeout-2026-09-16';
  const result=buildProtectedRevisionCandidates({proposalPack:JSON.parse(fs.readFileSync(`${directory}/protected-quantity-revisions.json`)),foods:new Map(JSON.parse(fs.readFileSync(process.env.COFID_INDEX)).foods.map(row=>[String(row.code),row])),mappings:APPROVED,retainedGrams:grams});
  fs.writeFileSync(`${directory}/protected-revisions-v2.json`,JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify({count:result.revision_count,candidate_digest:result.candidate_digest,insertion_only:result.insertion_only}));
}
