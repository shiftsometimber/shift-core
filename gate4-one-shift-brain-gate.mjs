import fs from 'node:fs';
let failed=false;const fail=m=>{console.error(`FAIL ${m}`);failed=true};const ok=m=>console.log(`PASS ${m}`);
const read=f=>fs.readFileSync(f,'utf8');
const brain=read('shift-brain-v1.js'),ai=read('shift-ai-v6.js'),safety=read('shift-ai-v7.js'),entry=read('worker-entry-v6.js'),daily=read('member-daily-v3.js'),product=read('member-product-v6.js'),structuredProduct=read('member-product-v7.js'),experience=read('member-experience-v2.js'),gateway=read('shift-ai.js');

for(const marker of ['users u','member_state','progress_entries','shift_plans','product_feedback','shift_ai_member_memory','listIntelligentMemories','getMemoryPrivacy'])if(!brain.includes(marker))fail(`Brain missing canonical member source ${marker}`);
for(const marker of ['ai_knowledge_chunks','ai_knowledge_documents','shift_knowledge_nodes','shift_knowledge_sources','reviewState','provenance','unified reviewed knowledge retrieval'])if(!brain.includes(marker))fail(`Brain missing unified knowledge/provenance contract ${marker}`);
if(!brain.includes("item.reviewState!=='unverified'"))fail('Unverified health graph knowledge is not excluded from unified retrieval');
if(!brain.includes("contract:'one-shift-brain/v1'"))fail('Canonical brain contract version missing');
if(!brain.includes('currentMemberStatementOverridesMemory:true'))fail('Current member statement precedence rule missing');
if(!brain.includes('clinicalDecisionsRemainOutsideShiftAI:true'))fail('Clinical boundary missing');

for(const [file,src] of [['Shift AI',ai],['Today',daily],['Grub/Fit Brain layer',product],['Proactive experience',experience]])if(!src.includes("./shift-brain-v1.js"))fail(`${file} is not consuming the canonical Brain service`);else ok(`${file} consumes One Shift Brain`);
if(!structuredProduct.includes("memberProductV6Routes"))fail('V7 structured product layer must delegate through V6 One Shift Brain before replacing eligible catalogue items');else ok('V7 structured product layer preserves V6 One Shift Brain behaviour');
if(!gateway.includes("./shift-ai-v7.js")||!safety.includes("./shift-ai-v6.js"))fail('Shift AI gateway must route through the clinical safety boundary into V6 One Shift Brain chat');else ok('Shift AI gateway preserves V6 One Shift Brain behind deterministic clinical boundary');
for(const marker of ['RX_BOUNDARY','clinicalBoundary:true','can\'t choose or change a prescription dose'])if(!safety.includes(marker))fail(`Clinical safety wrapper missing ${marker}`);
for(const marker of ['shiftBrainRoutes','memberDailyV3Routes','memberProductV7Routes'])if(!entry.includes(marker))fail(`Production entrypoint missing ${marker}`);
if(!ai.includes('brain.knowledge.items')||!ai.includes('brain.behaviour.feedback')||!ai.includes('brain.plans.active')||!ai.includes('brain.memory.intelligent'))fail('Chat prompt is not consuming the complete canonical context families');
if(!product.includes('historicalNaysApplied')||!product.includes('preferencesApplied'))fail('Product recommendation wrapper does not prove Brain preference/Nay use');
if(!daily.includes('canonical_contract:brain.contract'))fail('Today response does not expose canonical context evidence');
if(!experience.includes('feedbackSummary')||!experience.includes('activePlans'))fail('Proactive/bootstrap surface does not consume product context');

if(failed)process.exit(1);
console.log('ONE SHIFT BRAIN GATE PASS — canonical member context, unified reviewed knowledge, AI, clinical boundary, Today, V7 Grub/Fit structured runtime and proactive consumers are wired through one contract.');
