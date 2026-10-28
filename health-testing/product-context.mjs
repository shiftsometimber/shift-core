// Original SHIFT explanations. Product facts are checked in content-audit.json;
// these links support the health context, not an endorsement of the products.
const nhs={
 testosterone:['Testosterone and symptoms','https://www.nhs.uk/conditions/male-menopause/'],
 glucose:['Understanding HbA1c and blood sugar','https://www.nhs.uk/conditions/high-blood-sugar-hyperglycaemia/'],
 psa:['The benefits and limits of PSA testing','https://www.nhs.uk/tests-and-treatments/psa-test/'],
 bowel:['FIT testing and bowel screening','https://www.nhs.uk/tests-and-treatments/bowel-cancer-screening/'],
 fertility:['Sperm count and a full fertility assessment','https://www.nhs.uk/conditions/low-sperm-count/'],
 cholesterol:['Understanding cholesterol results','https://www.nhs.uk/conditions/high-cholesterol/cholesterol-levels/'],
 vitamin:['Vitamin D: its role and supplement advice','https://www.nhs.uk/conditions/vitamins-and-minerals/vitamin-d/'],
 iron:['Iron deficiency: investigation and treatment','https://www.nhs.uk/conditions/iron-deficiency-anaemia/'],
 thyroid:['How an underactive thyroid is assessed','https://www.nhs.uk/conditions/underactive-thyroid-hypothyroidism/'],
 kidney:['Blood and urine tests for kidney health','https://www.nhs.uk/conditions/kidney-disease/diagnosis/']
};
export const productContext=Object.freeze({
 testosterone:{
  short:'A focused total-testosterone lab result to discuss alongside symptoms such as a persistent change in sex drive or energy. It does not diagnose low testosterone or include a TRT prescription.',
  what:['Testosterone is a hormone involved in sexual function, muscle and bone health. This test measures total testosterone in a finger-prick blood sample sent to a laboratory. It is a single-marker test, separate from the broader Male Hormone panel.','A result is a starting point for interpretation alongside your symptoms, medical history and other investigations. Tiredness or a change in libido can have several causes; they do not automatically mean low testosterone.'],
  why:['If you have noticed a lasting change in how you feel, a focused measurement can give a healthcare professional something more specific to discuss. It may help frame the next conversation rather than leaving you to guess.','For someone working on weight, sleep or activity, the useful question is whether a hormone check is appropriate—not whether every difficult week needs a test. You can ask your GP about assessment before paying privately.'],
  mechanism:'The laboratory analyses the blood sample and reports the total-testosterone measurement. Testosterone varies with timing, sleep and illness. Clinical guidance supports appropriately timed sampling and confirmation of a low result; follow the kit’s collection instructions and discuss timing with your clinician, particularly if you work nights.',
  limits:'One number cannot establish the cause of symptoms, confirm that treatment is needed, or assess fertility. A low or borderline result may need repeat testing and other markers. Buying this kit does not arrange a TRT consultation or prescribing.',
  advice:'If you already use testosterone, hormones or medicines that may affect results, speak to your prescriber about the right test and timing. Do not stop medication or change a dose to prepare for testing without their advice.',
  next:'Take the report and a short account of your symptoms to a GP or qualified clinician. They can decide whether a repeat sample, a broader panel or a different investigation would be useful.',
  choice:'We include a focused option for men who want to understand one hormone marker before deciding what to do next. Its place in the range is information and an informed conversation, rather than a shortcut to testosterone treatment.',
  evidence:[nhs.testosterone,['Clinical guidance on testosterone sampling','https://pmc.ncbi.nlm.nih.gov/articles/PMC10357891/']]
 },
 diabetes:{
  short:'A laboratory HbA1c check gives a view of blood sugar over roughly two to three months. Useful context for a health conversation; it is not a reading of today’s glucose.',
  what:['HbA1c measures how much glucose has attached to haemoglobin in red blood cells. It reflects blood-sugar exposure over roughly the previous two to three months, rather than the effect of one meal or one day.','This is a laboratory HbA1c test, not a finger-prick glucose meter for checking an immediate high or low. The sample is collected at home and returned for analysis.'],
  why:['It may be useful when a healthcare professional has suggested checking longer-term blood-sugar health, or when you want to discuss your diabetes risk with a clearer starting point.','If you are changing your eating or activity, HbA1c gives a longer view than the scales alone. It cannot tell you which individual habit caused a change, and testing too soon after a lifestyle change may not show its full effect.'],
  mechanism:'The laboratory measures HbA1c from the returned sample. Your report needs to be interpreted in context: a clinician may confirm a result, assess symptoms or choose another test. Some circumstances, including conditions affecting red blood cells, can make HbA1c less suitable.',
  limits:'A private result does not provide a diagnosis, prescribe treatment or replace monitoring agreed with your diabetes team. It is not suitable for deciding whether an episode of feeling unwell is an immediate glucose emergency.',
  advice:'Ask your diabetes team, GP or pharmacist which monitoring is appropriate if you already have diabetes, are pregnant or have a blood condition. Follow the collection leaflet rather than guessing whether fasting is required.',
  next:'Discuss an unexpected or raised result with a healthcare professional. If you have new symptoms such as marked thirst, frequent urination or unexplained weight loss, seek advice rather than waiting for a postal test.',
  choice:'Blood-sugar health is relevant to the wider picture many SHIFT members are working on. We include a focused lab option with a clear purpose, while keeping treatment decisions with the person responsible for your care.',
  evidence:[nhs.glucose]
 },
 'psa-lab':{
  short:'Coming soon: laboratory measurement of the PSA marker. A prostate-health discussion should come first, because PSA has important benefits and limitations.',
  what:['PSA is a protein made by the prostate. This planned laboratory test measures PSA in a blood sample collected at home and returned for analysis. It is different from the rapid Prostate Health self-test, which you run and read yourself.','A laboratory measurement can support a conversation about prostate health, but the final service specification and turnaround will be confirmed before ordering opens.'],
  why:['Someone considering PSA testing may prefer a laboratory report to discuss with their GP. Whether testing is helpful depends on personal circumstances and an informed discussion about what may follow the result.'],
  mechanism:'A laboratory analyses the sample for PSA. PSA can increase for reasons other than cancer, including an enlarged or inflamed prostate. The NHS explains that preparation and recent infection can also affect results.',
  limits:'A high PSA does not diagnose cancer; a low result does not rule it out. Testing can lead to further investigations, with benefits and downsides that should be discussed before deciding to test.',
  advice:'Speak to your GP first if you have urinary symptoms, blood in urine, a recent urine infection or are already under prostate follow-up. Follow the final preparation instructions; exercise and ejaculation can affect PSA.',
  next:'Bring the result to your GP or existing prostate-care team. They may consider symptoms, repeat measurement or further assessment. Do not wait for this coming-soon service if you need medical advice now.',
  choice:'We include it as a planned laboratory choice alongside the home self-test, with the differences made clear. We do not present PSA as a general reassurance test or a stand-alone cancer check.',
  evidence:[nhs.psa]
 },
 'male-hormone':{
  short:'Coming soon: a broader view of related hormone markers, beyond total testosterone alone. The final panel and reporting arrangements will be confirmed before launch.',
  what:['The planned panel brings together several hormone-related measurements. The currently listed range includes testosterone, free testosterone, LH, FSH, oestradiol, prolactin, SHBG and albumin. The exact final panel will be confirmed before it is available to buy.','These markers have different roles: SHBG and albumin relate to how testosterone is carried, while LH and FSH are part of the signalling involved in reproductive function. They need interpretation together, rather than a separate “good or bad” score for each.'],
  why:['A broader panel may be more useful than a single total-testosterone result when a clinician is investigating a particular concern. More markers are not automatically better; the right panel depends on the question being asked.'],
  mechanism:'The sample goes to a laboratory. Some reported values may be calculated from other measurements rather than directly measured; the final method and report details will be explained before launch.',
  limits:'This is not a complete endocrine assessment, a fertility assessment or approval for hormone treatment. Symptoms, timing, medicines and previous results all affect what the numbers mean.',
  advice:'If you use hormone treatment, are considering TRT or are trying for a baby, discuss the right investigation with a qualified clinician first. Follow the final sampling and timing instructions when the service opens.',
  next:'A clinician can explain whether any result needs confirmation and which, if any, additional investigations are appropriate. Do not use individual flags to start or change hormone treatment yourself.',
  choice:'We want a clear distinction between a focused testosterone check and a more detailed hormone conversation. This planned option provides that choice without suggesting everyone needs the largest panel.',
  evidence:[nhs.testosterone,['Clinical interpretation of testosterone and binding proteins','https://pmc.ncbi.nlm.nih.gov/articles/PMC10357891/']]
 },
 'heart-health':{
  short:'Coming soon: a laboratory lipid panel with several cholesterol measurements. It gives more detail than the home total-cholesterol band, but does not assess the whole heart.',
  what:['This planned blood test looks at the fats carried in your blood: total cholesterol, HDL, LDL, non-HDL cholesterol and triglycerides are the currently listed markers. Final panel details will be confirmed before sale.','The separate figures help explain the balance behind a total-cholesterol number. They do not measure blood pressure, show whether an artery is blocked or check your heart rhythm.'],
  why:['It may suit someone who wants a fuller cholesterol picture to discuss with a healthcare professional, especially where a family history or an earlier result has raised a question.','For the SHIFT journey, this is about understanding risk alongside everyday changes—not trying to prove your heart is healthy with one test.'],
  mechanism:'A laboratory analyses the returned blood sample. A healthcare professional interprets a lipid profile alongside factors such as blood pressure, age, smoking, diabetes and family history.',
  limits:'This panel does not calculate a complete cardiovascular assessment by itself. It cannot diagnose the cause of chest pain or replace monitoring required for prescribed cholesterol treatment.',
  advice:'If you take a statin or have known cardiovascular disease, ask your clinician which tests you need and when. Follow the final collection instructions, including any preparation requirements.',
  next:'Discuss the report with a GP or qualified clinician. They can consider your overall risk and whether lifestyle support, repeat testing or treatment is appropriate.',
  choice:'We include a planned lab option because a detailed lipid profile answers a different question from the simpler home total-cholesterol test. The distinction should help you choose the level of information you actually need.',
  evidence:[nhs.cholesterol,['NICE guidance on lipid measurement and cardiovascular risk','https://www.nice.org.uk/guidance/ng238/chapter/recommendations']]
 },
 'bowel-health':{
  short:'A home FIT test looks for blood in a stool sample that you may not see. It cannot diagnose cancer or explain a persistent change in your bowel habits.',
  what:['FIT means faecal immunochemical test. It looks for small amounts of human blood in a stool sample. The test is about detecting a marker that may need investigating, rather than identifying the reason blood is present.','This kit is run and read at home. It is separate from the NHS bowel-screening programme and does not replace a kit sent by the NHS or a FIT arranged by your GP.'],
  why:['It may provide a specific piece of information for someone considering a home stool-blood check. The useful next step is knowing what you would do with either result before you test.'],
  mechanism:'A small sample from three areas of the stool is mixed in the supplied collection tube. The prepared liquid is applied to the device and read at the stated time. Correct sampling and timing matter.',
  limits:'Blood can be present for reasons other than cancer, and a result showing no blood cannot rule cancer out. A home result cannot tell you the source of bleeding.',
  advice:'Speak to your GP about persistent changes in bowel habit, visible blood, unexplained weight loss or ongoing abdominal symptoms, regardless of a home result. Check the leaflet about circumstances that could contaminate the sample.',
  next:'A result detecting blood needs discussion with a healthcare professional. Take the test details and explain any symptoms. Continue to take part in NHS screening when invited.',
  choice:'We include a focused home check with a clear explanation of what it detects. We do not want an apparently reassuring result to delay someone getting symptoms checked.',
  evidence:[nhs.bowel]
 },
 'prostate-health':{
  short:'A rapid home check of the PSA marker using finger-prick blood. It may inform a prostate-health conversation, but cannot diagnose or rule out prostate cancer.',
  what:['This self-test checks the PSA marker in a small blood sample. PSA is made by the prostate; a raised level can be associated with different prostate conditions.','The result is read from a home test device using its guide. It does not provide the same detailed numerical report as a laboratory PSA measurement, and is separate from our coming-soon PSA Lab-test.'],
  why:['It may appeal if you are considering a home PSA check and understand its limitations. The first decision is whether PSA testing is right for you, rather than simply whether it can be done at home.'],
  mechanism:'Use the lancet and pipette to collect the sample, apply it to the device with the specified buffer, then read it after five minutes. That is the reading time after running the test, not the total preparation time.',
  limits:'A raised result does not mean you have prostate cancer. A result that is not raised does not rule it out. Other conditions and recent activities can affect PSA; further clinical assessment may be needed.',
  advice:'Discuss benefits and limitations with your GP before testing, particularly if you have symptoms or are already being monitored. A recent urine infection and preparation requirements matter; check the kit instructions and NHS advice.',
  next:'Discuss a concerning result with your GP. Seek advice about urinary symptoms or blood in urine even if the home result looks normal. Do not use this test to alter existing prostate treatment.',
  choice:'We include it as a distinct home-screening option, with its limits visible before purchase. It is an opening for a properly informed conversation, not an “all clear”.',
  evidence:[nhs.psa]
 },
 'male-fertility':{
  short:'A semen self-test checks sperm concentration—one part of fertility. It does not assess sperm movement or shape, prove fertility or confirm a vasectomy has worked.',
  what:['This kit checks sperm concentration in a semen sample as one indicator of male fertility. Concentration means the amount of sperm within a volume of semen.','A full laboratory semen analysis looks at more than concentration, including movement and shape. This home kit cannot provide that full picture or assess a partner’s fertility.'],
  why:['It may be a first information point for someone thinking about conception, provided it does not delay the appropriate fertility assessment. A result is useful only when you understand which part of the picture it covers.'],
  mechanism:'Collect the sample in the supplied cup and allow the stated one-hour preparation wait. Use 0.1 mL with the buffer as instructed; the device is then read five minutes after the prepared sample is added.',
  limits:'A result in the expected concentration range cannot guarantee pregnancy. A low result does not mean natural conception is impossible. This kit must not be used as a contraception decision or a post-vasectomy clearance test.',
  advice:'Follow the leaflet’s sample-preparation rules carefully. If you and your partner are having difficulty conceiving, a GP can arrange assessment of both partners; do not wait for a reassuring home result before asking.',
  next:'Take an unexpected result to your GP and explain how long you have been trying. A full semen analysis and, sometimes, repeat testing are more informative than repeatedly buying the same home check.',
  choice:'Men are part of the fertility conversation too. We include an accessible concentration check while being clear that fertility is broader than one number and that support may be needed for both partners.',
  evidence:[nhs.fertility]
 },
 cholesterol:{
  short:'A finger-prick self-test places total cholesterol in a colour band. It can prompt a fuller check, but does not give separate HDL, LDL or triglyceride results.',
  what:['Cholesterol is a fatty substance your body needs, but its levels and balance matter for longer-term cardiovascular health. This home test estimates a total-cholesterol band using a colour chart.','It is not a full lipid profile. You do not receive separate HDL, LDL, non-HDL or triglyceride measurements from this product.'],
  why:['It may be a convenient first check for someone who wants to start a conversation about cholesterol. You can also ask your GP or pharmacist about the right test for your circumstances.'],
  mechanism:'Apply the finger-prick sample as instructed and wait two minutes. Match the result against the sliding colour chart within the following thirty seconds. The reading window is part of the method, not an optional detail.',
  limits:'A total band cannot tell you your overall heart risk. A GP uses other information, such as blood pressure and medical history, and may need a fuller cholesterol profile.',
  advice:'If you already take cholesterol-lowering medicine, have cardiovascular disease or need a result for clinical monitoring, ask your clinician whether this home band test is appropriate. Do not change prescribed treatment from it.',
  next:'Arrange a clinical discussion if the result is outside the guide’s expected band or you are concerned. A more detailed lipid test may be the useful next step.',
  choice:'We include a simpler home option alongside the planned laboratory Heart Health panel, so you can see the difference before paying. Simpler is useful only when it answers your question.',
  evidence:[nhs.cholesterol]
 },
 'vitamin-d':{
  short:'A finger-prick vitamin D self-test offers a guide to your vitamin D status. It can inform a conversation about deficiency, but is not a personalised supplement prescription.',
  what:['Vitamin D helps the body manage calcium and phosphate, which are needed for healthy bones, teeth and muscles. This kit checks vitamin D status using a small blood sample and the supplied result guide.','It is a home result read against the product’s categories, rather than a complete nutritional assessment. It does not check every vitamin or mineral.'],
  why:['It may be useful where you have a specific reason to investigate vitamin D status. Spending less time outdoors is relevant to vitamin D, but tiredness alone cannot tell you that you are deficient.','Routine UK autumn-and-winter supplement advice does not depend on everyone buying a test first. A pharmacist or GP can help you decide whether testing adds anything in your situation.'],
  mechanism:'The prepared finger-prick sample is applied to the device with the supplied buffer. Read it after ten minutes using the guide, within the leaflet’s reading window.',
  limits:'A home category cannot establish the cause of symptoms or determine a treatment dose. A clinician may want a laboratory measurement or other investigation before treating suspected deficiency.',
  advice:'Ask for advice if you have an existing condition affecting vitamin D or calcium, are already taking prescribed vitamin D, or are considering a high-dose product. Count vitamin D already present in other supplements.',
  next:'Discuss a low, unexpected or unclear result with a healthcare professional. Do not automatically add several vitamin D products together or use repeated home tests to adjust a prescribed dose.',
  choice:'We include a targeted check so the question is clearer than “maybe I need more vitamins”. The test and the supplement are separate choices; one does not automatically mean you need the other.',
  evidence:[nhs.vitamin]
 },
 iron:{
  short:'This finger-prick self-test checks ferritin, a marker of stored iron. A low result needs its cause understood; it is not a full blood count or a reason to start iron blindly.',
  what:['Ferritin is a protein that stores iron. Checking it provides information about iron stores, which is different from counting red blood cells or measuring haemoglobin.','This kit gives a home ferritin screening result. It does not provide a full blood count, a full iron profile or an investigation of why iron might be low.'],
  why:['If you are concerned about iron status, this is a focused marker to understand. Tiredness has many possible causes, so a test should support a sensible conversation rather than turn every low-energy day into a supplement purchase.'],
  mechanism:'Collect a finger-prick sample, add it to the device and use the one drop of buffer specified for this kit. Read after five minutes and follow the supplied interpretation guide.',
  limits:'The result cannot diagnose all causes of anaemia. A result that looks normal does not explain persistent symptoms, and other clinical circumstances can affect how ferritin should be interpreted.',
  advice:'Ask your GP about suspected iron deficiency, especially in men, where finding the reason for low iron matters. If you already take iron or have an iron-storage disorder, get advice before testing or changing supplements.',
  next:'A low or concerning result is a prompt to investigate, not just to buy iron. Your GP may consider a full blood count and the cause before recommending treatment.',
  choice:'We include a targeted home check while keeping the important next question visible: why might iron stores be low? The separate iron supplement is not an automatic follow-on purchase.',
  evidence:[nhs.iron,['Ferritin and iron-deficiency investigation','https://www.nhsinform.scot/illnesses-and-conditions/nutritional/iron-deficiency-anaemia/']]
 },
 thyroid:{
  short:'A finger-prick self-test checks TSH as a possible indicator of an underactive thyroid. It does not measure the full thyroid panel or explain weight changes by itself.',
  what:['TSH is thyroid-stimulating hormone: a signal involved in controlling thyroid hormone production. This kit screens for an increased TSH level as a possible indicator of an underactive thyroid.','It does not measure the complete thyroid picture. In clinical assessment, TSH may be considered alongside thyroxine (T4), symptoms, medicines and other findings.'],
  why:['A thyroid question can be relevant where symptoms such as lasting fatigue, feeling unusually cold or unexplained changes have prompted a discussion. Those symptoms can have other causes too.','For someone working on their weight, this is not a test that tells you why a particular week’s weight has changed or whether a weight-management medicine is working.'],
  mechanism:'Apply the blood and buffer amounts specified in the kit and read the device after ten minutes. The home result indicates whether further assessment may be needed; it is not a full laboratory hormone report.',
  limits:'This test cannot diagnose every thyroid condition or rule out a problem after a normal-looking result. It is not suitable for adjusting levothyroxine or other thyroid treatment yourself.',
  advice:'If you already have thyroid disease, take thyroid medication or have persistent symptoms, ask your GP which blood tests are appropriate. Tell them about supplements and medicines you use.',
  next:'Discuss an unexpected result or continuing symptoms with your GP. They can arrange laboratory thyroid-function tests and decide what the result means for you.',
  choice:'We include a focused TSH screening option with a clear boundary: it can raise a question, but proper thyroid assessment answers it. Weight and energy should not be reduced to one test line.',
  evidence:[nhs.thyroid]
 },
 'kidney-health':{
  short:'A urine self-test looks for increased albumin, which may need a clinical check. It does not measure kidney filtration or replace blood tests and a urine ACR.',
  what:['Albumin is a protein usually kept in the blood. An increased amount in urine can be a reason for further kidney-health assessment. This kit checks for that urine marker at home.','It is not an eGFR blood test and does not calculate an albumin-to-creatinine ratio (ACR). Those clinical tests provide different information and may be used together.'],
  why:['It may be a starting point for someone with a specific question about albumin in urine. People with diabetes or high blood pressure should discuss the regular monitoring they need with their usual healthcare team.'],
  mechanism:'The absorbent tip is exposed to urine for ten to fifteen seconds as instructed. Replace the cap, lay the device flat and read it after three minutes. Urine is applied directly to the tip; no additional reagent is added.',
  limits:'A home result cannot diagnose chronic kidney disease, stage it or confirm that kidney function is normal. A single unexpected result may need a properly collected repeat or a different test.',
  advice:'Ask your GP about persistent symptoms, blood in urine or an existing kidney condition rather than relying on a self-test. Keep any blood and urine monitoring already arranged for your medicines or long-term condition.',
  next:'Discuss a concerning result with a healthcare professional. They can consider a urine ACR, creatinine/eGFR blood test and your wider health before deciding what to do.',
  choice:'We include a urine-based option because it checks a different marker from a blood panel. We make that distinction clear so a simple home check is not mistaken for a complete kidney assessment.',
  evidence:[nhs.kidney]
 },
 multivitamin:{
  short:'An optional 60-capsule multivitamin with a published one-capsule daily serving. It may help fill a dietary gap; it cannot replace meals, protein or a varied diet.',
  what:['A capsule containing a blend described as 30+ vitamins, minerals and other nutrients. The current product information states 60 capsules, a one-capsule daily serving and suitability for vegans.','A complete ingredient list, individual amounts, allergens and final warnings still need confirming before ordering opens. We will not infer a full formula from a front-label photograph.'],
  why:['Smaller meals, a restricted food range or a busy spell can make it harder to eat a varied diet. A multivitamin may be worth discussing as a way to cover particular gaps alongside improving meals.','It does not supply the protein, fibre, energy or variety that food provides. Taking a weight-management medicine does not automatically mean you need this product.'],
  mechanism:'The capsule adds nutrients to your dietary intake. The benefit depends on what you already get from food and whether a nutrient is actually lacking; more is not automatically better.',
  limits:'We do not claim this blend causes weight loss, treats a deficiency, resolves fatigue or has been proven to improve results from GLP-1 treatment. A broad formula is not a substitute for investigating persistent symptoms.',
  advice:'Check the final label and the combined amounts from anything else you take. Ask a pharmacist about medicine interactions, existing conditions or pregnancy. Do not exceed the stated serving.',
  next:'Start with the foods you are managing to eat and the gaps you want to address. A pharmacist, dietitian or clinician can help decide whether a broad supplement or a more specific approach fits.',
  choice:'We include an optional broad supplement for people who want a simple format, with food kept first. Its full formulation must be visible before anyone can make an informed purchase.',
  evidence:[['NHS guidance on vitamins and minerals','https://www.nhs.uk/conditions/vitamins-and-minerals/']]
 },
 'vitamin-d-supplement':{
  short:'60 vegan capsules of vitamin D3 at a stated 1,000 IU (25 micrograms). A targeted supplement choice, with the dose and overlap with other products checked first.',
  what:['The published product is vitamin D3, listed as vegan, with 60 capsules and a one-capsule daily serving. Its stated strength is 1,000 IU, equivalent to 25 micrograms of vitamin D.','The final full ingredients, capsule materials, allergens and warnings will be displayed before ordering opens. This is a supplement, separate from the Vitamin D self-test.'],
  why:['Vitamin D supports the regulation of calcium and phosphate for bone and muscle health. It is relevant to UK autumn-and-winter advice and to people who have limited sunlight exposure.','The standard NHS daily supplement advice for most adults is 10 micrograms. This product provides 25 micrograms, so choosing it should include checking why that strength is suitable for you.'],
  mechanism:'It adds vitamin D to your intake. That can help address inadequate intake, but a supplement should not be presented as an energy boost, a weight-loss aid or proof that other symptoms will improve.',
  limits:'This is not a personalised treatment course for diagnosed deficiency. Taking more than you need can be harmful; a higher strength is not automatically a better choice.',
  advice:'Follow the final label, check vitamin D already present in a multivitamin and seek advice if you have kidney disease, calcium problems or prescribed vitamin D. Do not add it to an existing high-dose course without checking.',
  next:'A pharmacist or clinician can help match the product and dose to your circumstances. A home test result does not, by itself, determine a treatment dose.',
  choice:'We include a targeted option with a plainly stated dose, rather than an unexplained “high strength” claim. It remains optional and should fit the individual, not become a compulsory part of the journey.',
  evidence:[nhs.vitamin]
 },
 'iron-supplement':{
  short:'60 capsules with a stated 20 mg of elemental iron as iron bisglycinate. A targeted option when iron is appropriate—not a general fix for tiredness.',
  what:['The current product information states 20 mg of elemental iron in the form of iron bisglycinate, 60 capsules, suitability for vegans and a one-capsule daily serving.','The supplier also describes added vitamin C, but its amount and the complete formula must be confirmed from the final label before sale. We will show ingredients, allergens and warnings before ordering opens.'],
  why:['Iron is needed for normal red-blood-cell and haemoglobin production. A supplement may be appropriate where a healthcare professional has identified a need to increase iron intake.','Persistent tiredness is not enough to establish that you need iron. In men, understanding the reason for low iron is particularly important; simply adding a capsule can leave the underlying issue unexplained.'],
  mechanism:'It supplies additional iron. The form and dose do not make it a substitute for a prescribed treatment plan, and we do not claim this specific product is more effective or free of digestive side effects.',
  limits:'A home ferritin result does not tell you the cause of low iron or establish the right treatment dose. More iron can be harmful when it is not needed.',
  advice:'Seek GP or pharmacist advice before using it, particularly if you have an iron-storage condition, take medicines or already use an iron-containing supplement. Keep iron products out of children’s reach; overdose can be dangerous.',
  next:'If deficiency is suspected, discuss investigation and the right replacement plan. If iron has already been prescribed, check before substituting this product or taking both.',
  choice:'We include iron as a specific, considered option—not a routine extra for low energy. Its place is alongside proper assessment of need and cause.',
  evidence:[nhs.iron]
 }
});

export const bundleContext=Object.freeze({
 'general-health-bundle':{
  short:'Five distinct self-tests for thyroid, vitamin D, ferritin, total cholesterol and urine albumin. A collection of focused checks—not a complete health MOT.',
  what:['This brings together the Thyroid, Vitamin D, Iron Deficiency, Cholesterol and Kidney Health self-tests. They use different samples and answer different questions: TSH, vitamin D status, ferritin, a total-cholesterol band and albumin in urine.'],
  why:['It may be convenient if you already have a reason to consider several of these individual checks. If only one question matters to you, buying that single test may be the more sensible choice.'],
  mechanism:'Each kit works separately. There is no combined laboratory report, shared sample or overall health score. Follow the correct sample method and reading window for each product.',
  limits:'Five screening results do not amount to a full medical assessment, and normal-looking results cannot explain every symptom. More tests can also create results that need follow-up.',
  advice:'Read the individual product pages and suitability advice before choosing the bundle. Ask a GP which investigations would answer your actual concern if you have symptoms or an existing condition.',
  next:'Keep each result with the name and date of its test. Discuss concerning results in their own context rather than treating the bundle as a pass or fail.',
  choice:'We include it for convenience where the individual checks already make sense. We will not call it a full MOT or suggest everyone needs all five.',
  evidence:[nhs.thyroid,nhs.kidney]
 },
 'general-health-combo':{
  short:'The five General Health self-tests plus a multivitamin. Testing and supplementation remain separate decisions, each with their own purpose and limits.',
  what:['The listed products are the Thyroid, Vitamin D, Iron Deficiency, Cholesterol and Kidney Health self-tests, together with the Multivitamin Supplement. The multivitamin is part of this proposed combination, rather than a separate extra.'],
  why:['It may suit someone who has considered the five checks and separately decided a broad supplement fits a dietary gap. A bundle is not a reason to test unnecessarily or take nutrients you do not need.'],
  mechanism:'The tests are performed and interpreted separately; the supplement adds nutrients to dietary intake. These five results do not tell you whether every ingredient in the multivitamin is needed.',
  limits:'There is no combined diagnosis, personalised supplement formula or guarantee of improvement. The multivitamin does not treat an unexplained result.',
  advice:'Read all six individual product pages. Check supplement overlap, medicines and the final ingredient list before use; seek advice where appropriate.',
  next:'Respond to a concerning test result with appropriate clinical advice. Treat any supplement decision as a separate suitability check, not an automatic response to a flagged result.',
  choice:'We include a combined option for people who find the products convenient together, while making the separate decisions visible. Any saving will be shown only when final prices and quantities are confirmed.',
  evidence:[['NHS vitamins and minerals advice','https://www.nhs.uk/conditions/vitamins-and-minerals/']]
 },
 'vitamin-d-combo':{
  short:'Vitamin D testing and a vitamin D supplement brought together. Final test quantities and timing will be confirmed; a result does not automatically set your dose.',
  what:['The proposed combination contains Vitamin D self-testing and the Vitamin D3 Supplement. The current pack image shows more than one test, but exact supplied quantities and any follow-up schedule will be confirmed before purchase.'],
  why:['It may be convenient if testing has a clear purpose and vitamin D supplementation is separately appropriate. Routine seasonal supplement advice does not mean everyone needs repeated private tests.'],
  mechanism:'The test gives a home screening result; the capsule supplies the stated vitamin D dose. A later test, where appropriate, is a separate measurement and not a guarantee that the supplement caused a change.',
  limits:'This is not a personalised deficiency-treatment programme or a clinician-led monitoring service. No retest interval or specific outcome is promised.',
  advice:'Check the individual test instructions and supplement label. Discuss dose, existing vitamin D products and any relevant conditions with a pharmacist or clinician.',
  next:'Get advice about a low or unclear result before deciding on treatment or repeat testing. Use the individual products’ own guidance.',
  choice:'We include the combination as an option for a considered plan, with quantities, final price and suitability made clear before ordering. It should not turn one result into an automatic supplement sale.',
  evidence:[nhs.vitamin]
 },
 'iron-combo':{
  short:'Ferritin self-testing and an iron supplement in one proposed combination. Understanding the cause of low iron comes before deciding whether to supplement.',
  what:['The proposed combination brings together the Iron Deficiency self-test and Iron Supplement. Exact test quantities and any follow-up timing remain to be confirmed before ordering opens.'],
  why:['It may be convenient where a healthcare professional has helped you decide both checking iron stores and a particular supplement are appropriate. A low-energy spell alone does not establish that need.'],
  mechanism:'The home test checks ferritin; the supplement adds elemental iron. Those are different actions. A screening result does not identify the reason for low iron or determine an individual treatment plan.',
  limits:'The combination cannot diagnose all anaemia, explain blood loss or replace investigation of an abnormal result. It is not a promised test–treat–cure course.',
  advice:'Check both product pages and seek GP or pharmacist advice before using iron, particularly if you are a man with possible deficiency, have an iron-storage condition or take other medicines.',
  next:'Investigate the cause of a concerning result and agree appropriate replacement and follow-up. Do not use repeated home tests to adjust a prescribed iron dose yourself.',
  choice:'We include a combination only as a convenient way to access the separate products when they fit. Clinical need, clear pack quantities and the final price must come before a bundle purchase.',
  evidence:[nhs.iron]
 }
});
export const contextFor=id=>productContext[id]||bundleContext[id];
