// Original SHIFT reporting, prepared 13 September 2026. Source dates are not SHIFT publication dates.
// This data prepares drafts only; approval and publication use the established HQ workflow.
const source = (authority, url, source_date, source_tier=1) => ({authority,url,source_date,source_tier,retrieved_at:'2026-09-13T12:00:00.000Z'});
const nhsAccess='https://www.england.nhs.uk/long-read/interim-commissioning-guidance-nice-ta1026-tirzepatide/';
const talking='https://www.nhs.uk/tests-and-treatments/talking-therapies/';
const rows=[
{
 slug:'uk-archive-less-processed-food-ucl-weight-loss-trial',region:'UK',authority:'UCL',date:'2025-08-04',
 headline:'Less-processed food and weight loss: what a UK trial found',
 summary:'A small UK feeding trial compared two diets that both followed healthy-eating guidance. The result deserves attention, with limits.',
 evidence:[source('UCL','https://www.ucl.ac.uk/news/2025/aug/less-processed-diet-may-be-more-beneficial-weight-loss','2025-08-04',2),source('Nature Medicine — primary UK trial','https://www.nature.com/articles/s41591-025-03842-0','2025-08-04',2)],
 body:`## What the researchers tested
UCL researchers recruited 55 adults for a trial comparing minimally processed and ultra-processed diets designed to meet the UK's Eatwell guidance. Participants received each diet for eight weeks, separated by a washout period. Food was delivered to their homes without charge.

The reported average weight reduction was 2.06% during the minimally processed diet and 1.05% during the ultra-processed diet. Fifty participants completed at least one diet period. Both approaches produced weight loss; this was not a comparison between healthy eating and unrestricted junk food.

## What the result cannot tell us
Eight weeks cannot establish whether a difference lasts for years. Free food delivery also removes costs and planning pressures that matter in an ordinary household. The trial does not establish a specific result for men or show that every processed food should be excluded.

## The useful question for everyday life
For SHIFT readers, the practical question is which affordable meals they could repeat comfortably. A workable shopping list, time to cook and food that the household enjoys are more useful starting points than a perfect-food rule. Those are our editorial questions, rather than outcomes measured by this trial.

Treat the study as a reason to examine food patterns, not a promise of a particular personal weight-loss result.`,
 fact:'The UK trial compared two diets designed around Eatwell guidance over eight-week periods.',
 implication:'UK household cost and convenience remain important questions when applying a controlled feeding study to everyday weight management.',
 unknown:'Long-term results and the effect of paying for and organising the food yourself were not established by this short trial.'
},
{
 slug:'uk-archive-glp1-use-britain-men-survey',region:'UK',authority:'UCL',date:'2026-01-08',
 headline:'Weight-loss medicine use in Britain: what the survey says about men',
 summary:'A Great Britain survey published in January 2026 offers a snapshot of medicine use, including a marked difference between men and women.',
 evidence:[source('UCL','https://www.ucl.ac.uk/news/2026/jan/16-million-uk-adults-used-weight-loss-drugs-past-year','2026-01-08',2),source('BMC Medicine — primary population study','https://link.springer.com/article/10.1186/s12916-025-04528-7','2026-01-08',2)],
 body:`## A snapshot with a specific time and place
Researchers surveyed 5,260 adults in England, Scotland and Wales between January and March 2025. Their estimate suggested around 1.6 million adults had used weight-loss medicines during the preceding year. Northern Ireland was not included, and this is not a count of users in September 2026.

Reported use for weight loss was higher among women than men: 4% compared with 1.7%. The study also found an association with psychological distress. That does not show that the medicines caused mental-health problems, or that distress caused people to use them.

## What is missing from the numbers
This was self-reported survey research, rather than a prescription audit. Researchers did not collect the BMI and clinical-history information needed to decide whether each respondent met prescribing criteria. The estimate therefore cannot establish how much prescribing was appropriate.

## Why the gap matters to SHIFT
The difference between men and women raises useful questions about awareness, cost, confidence and willingness to ask for help. The survey does not answer those questions on its own. Nor should a population estimate become pressure on an individual to start treatment.

For a reader considering support, a discussion about health, goals and existing medicines is more useful than comparing themselves with a national uptake figure.`,
 fact:'The survey covered England, Scotland and Wales in early 2025; it did not include Northern Ireland.',
 implication:'Use the findings to understand the British treatment landscape, while keeping individual clinical decisions separate from population trends.',
 unknown:'The survey cannot establish prescribing eligibility or explain the causes of the difference between men and women.'
},
{
 slug:'uk-archive-nice-support-after-weight-loss-treatment',region:'England',authority:'NICE',date:'2025-08-05',
 headline:'After weight-loss treatment: why follow-up belongs in the plan',
 summary:'NICE’s August 2025 quality standard put support after treatment in focus. NHS England’s 2026 guidance keeps that issue relevant.',
 evidence:[source('NICE — quality statement 7','https://www.nice.org.uk/guidance/qs212/chapter/Quality-statement-7-Advice-and-support-after-stopping-medicines-for-weight-management-or-completing-behavioural-interventions','2025-08-05'),source('NHS England — April 2026 commissioning guidance',nhsAccess,'2026-04-02')],
 body:`## The overlooked part of the pathway
NICE's August 2025 quality standard includes advice and support after stopping medicines for weight management or completing behavioural interventions. NHS England's April 2026 commissioning guidance refers to that statement when discussing support after deprescribing.

This is a service-quality issue, rather than an announcement of a new medicine. Starting treatment, reviewing it and planning what happens afterwards are different parts of care. A prescription alone does not describe the whole pathway.

## Questions worth asking before treatment ends
Our suggested conversation is practical: who will review progress, how can you ask for help between appointments, and what support is available if circumstances change? Ask how food, activity and wellbeing will be discussed, and whether follow-up carries a separate charge in a private service.

A written plan can also make responsibilities clearer when care moves between providers. Keep the contact details and the agreed review arrangements somewhere you can find them easily.

## What this archive item does not promise
The standard is not evidence that every local service already offers the same follow-up. NHS access and commissioning differ across the four UK nations, and a private package needs its own clear terms. This article does not recommend stopping a medicine or set a personal treatment duration; that decision belongs in a discussion with the prescribing team.`,
 fact:'NHS England’s April 2026 guidance explicitly refers to NICE quality statement 7 on support after weight-management treatment.',
 implication:'For readers in England, ask the treating service to explain its follow-up arrangements. Elsewhere in the UK, confirm the local pathway.',
 unknown:'A national quality statement does not confirm the appointments or funding available from a particular provider.'
},
{
 slug:'uk-archive-nhs-mounjaro-access-england-2026',region:'England',authority:'NHS England',date:'2026-04-02',
 headline:'NHS Mounjaro access in England: why the route still matters',
 summary:'April 2026 commissioning guidance explains phased access to tirzepatide, and why national eligibility is not the same as an immediate prescription.',
 evidence:[source('NHS England — commissioning guidance',nhsAccess,'2026-04-02'),source('NHS England — patient information','https://www.england.nhs.uk/ourwork/prevention/obesity/medicines-for-obesity/weight-management-injections/',null)],
 body:`## The rollout has more than one doorway
NHS England's April 2026 guidance distinguishes specialist weight-management services from phased primary-care access to tirzepatide, also known as Mounjaro. The obesity pathway is also separate from prescribing to manage type 2 diabetes.

Primary-care access began with a prioritised group in June 2025. The 2026/27 phase expands the BMI range for people with at least four specified weight-related conditions. Ethnicity-adjusted thresholds also apply. These are clinical criteria, not a do-it-yourself eligibility test.

## Why an old headline can mislead
A report saying the medicine is available on the NHS does not mean every adult with obesity can immediately obtain it from any GP. Local commissioning, clinical assessment and the treatment setting remain relevant. The current guidance also requires support around treatment, including nutrition and behaviour change.

## A better conversation with your local service
Ask which weight-management pathway operates in your area, whether referral to a specialist service is appropriate and what help is available while you wait. If your main treatment need is diabetes, make that clear so the relevant guidance is considered.

This article explains England's commissioning arrangements. It does not transfer those rules to Scotland, Wales or Northern Ireland, promise a prescription, or confirm stock at any provider.`,
 fact:'NHS England’s April 2026 guidance separates specialist services, phased primary-care access and the diabetes indication.',
 implication:'Check the current local NHS pathway rather than relying on the broad wording of a 2025 rollout headline.',
 unknown:'A national policy document cannot confirm an individual assessment outcome or a local appointment date.'
},
{
 slug:'uk-archive-men-talking-therapies-london',region:'England',authority:'NHS England',date:'2025-06-09',
 headline:'Men and NHS talking therapies: what London’s feedback really shows',
 summary:'Positive feedback from men who completed talking therapies is encouraging. It is a satisfaction finding, not a 92% cure rate.',
 evidence:[source('NHS England London','https://www.england.nhs.uk/london/2025/06/09/life-changing-outcomes-for-9-in-10-men-who-complete-nhs-talking-therapies-in-london/','2025-06-09'),source('NHS — talking therapies and self-referral',talking,'2025-11-05')],
 body:`## Encouraging feedback, correctly described
In June 2025, NHS London reported that 92% of male respondents who completed talking therapies felt they received the help they needed all or most of the time. It also reported that 94% felt listened to and taken seriously.

Those figures describe patient feedback from completers. They do not mean 92% of every man referred recovered, and they do not capture everyone who dropped out or never reached treatment. That distinction matters when reporting mental-health services fairly.

## You can ask for help without having the perfect words
The NHS explains that adults in England can self-refer to NHS talking therapies for problems such as anxiety and depression. A formal diagnosis is not required before asking for an assessment. Most services are for people aged 18 or over, with some accepting people from 16.

If you are unsure how to describe the problem, start with what has changed in daily life and what you would like help with. That is an editorial suggestion for beginning the conversation, not a diagnostic checklist.

## Check the service that covers you
London's feedback cannot establish outcomes elsewhere. Use the NHS self-referral information linked below to find the appropriate local route and ask about format, timing and assessment. Talking therapies is not a substitute for urgent crisis care.`,
 fact:'The London figures describe feedback from men who completed therapy, rather than a recovery rate for all referrals.',
 implication:'Men in England can use the NHS talking-therapies self-referral route to ask for an assessment; other UK nations have different arrangements.',
 unknown:'The announcement does not establish how every referral progressed or what an individual’s outcome will be.'
},
{
 slug:'uk-archive-tower-hamlets-24-hour-mental-health-centre',region:'England',authority:'NHS England',date:'2025-07-17',
 headline:'A 24-hour mental-health centre in Tower Hamlets: what changed',
 summary:'The first of six neighbourhood mental-health pilots opened in July 2025, bringing clinical and practical support into one local service.',
 evidence:[source('NHS England','https://www.england.nhs.uk/2025/07/first-nhs-round-the-clock-mental-health-unit-opens-under-10-year-health-plan/','2025-07-17'),source('DHSC — subsequent expansion announcement','https://www.gov.uk/government/news/major-expansion-of-community-mental-health-support-across-england','2026-08-05')],
 body:`## A local opening, not a nationwide service
NHS England announced the opening of a round-the-clock neighbourhood mental-health centre in Tower Hamlets in July 2025. It was the first of six pilot areas, with support aimed at people living with serious mental illness.

The model brings together clinical care, peer support and help with practical issues such as housing and employment. The announcement described access without a referral and support from a continuing team, including crisis care and short stays where needed.

## Why continuity deserves attention
For someone navigating several services, repeatedly explaining the same situation can be another burden. SHIFT's interest in this model is whether a familiar team and practical help make care easier to use. An opening announcement cannot prove that result; independent evaluation and patient experience are the next evidence to look for.

## What has happened since
The government announced a wider England expansion in August 2026, with further facilities planned from autumn 2026 into 2027. That later commitment does not turn the original six pilots into a service available in every neighbourhood today.

Check the local NHS provider for current opening and access arrangements. This archive report should not be used as a directory of immediately available crisis services outside the pilot area.`,
 fact:'The July 2025 opening was part of a six-area pilot in England.',
 implication:'The service model is relevant to continuity of care, but readers must check whether an equivalent service operates locally.',
 unknown:'The opening announcement does not establish long-term outcomes or nationwide availability.'
},
{
 slug:'uk-archive-england-community-mental-health-expansion-2026',region:'England',authority:'Department of Health and Social Care',date:'2026-08-05',
 headline:'England’s mental-health expansion: what is planned to open, and when',
 summary:'A £343 million announcement covers 100 community centres and 59 mental-health emergency departments. Many are planned facilities, rather than services open today.',
 evidence:[source('Department of Health and Social Care — updated 10 September 2026','https://www.gov.uk/government/news/major-expansion-of-community-mental-health-support-across-england','2026-08-05')],
 body:`## Two different types of facility
The government's August 2026 announcement, updated on 10 September, sets out 100 community mental-health centres and 59 mental-health emergency departments across England. Together that is 159 facilities. It is not 159 walk-in centres plus another 59 departments.

The £343 million programme describes the first openings from autumn 2026, with others planned by March 2027. Final locations remain subject to work such as design, procurement and business cases.

## Why the distinction matters
Community centres and emergency departments serve different needs. The announcement describes dedicated mental-health emergency care for people who are medically fit and do not require physical emergency treatment. It should not be read as a reason to avoid A&E when physical emergency care is needed.

## What readers should look for next
Our practical check is local: has the provider confirmed an opening, who can use it, what are its hours and how do people enter the service? A funding announcement cannot answer all four for every site.

This is useful UK news because it may change access to support in England. Credible coverage also has to distinguish a budget commitment from a staffed, operating service. We will describe those stages separately rather than treating the whole expansion as already delivered.`,
 fact:'The programme combines 100 community centres and 59 mental-health emergency departments in England.',
 implication:'Readers need a confirmed local opening and access route before relying on a planned facility.',
 unknown:'Final arrangements and opening dates for individual sites are not guaranteed by the national announcement.'
},
{
 slug:'uk-archive-england-first-mens-health-strategy',region:'England',authority:'Department of Health and Social Care',date:'2025-11-18',
 headline:'England’s first men’s health strategy: what matters beyond the launch',
 summary:'The November 2025 strategy brought men’s physical and mental health together. Its commitments still need to be judged by delivery.',
 evidence:[source('Department of Health and Social Care','https://www.gov.uk/government/news/government-unveils-englands-first-ever-mens-health-strategy','2025-11-18')],
 body:`## A broader view of men's health
England's first men's health strategy was announced in November 2025. It included funding for suicide prevention among middle-aged men, community programmes, workplace activity and training for health professionals.

The announcement set out £3.6 million over three years for suicide prevention and £3 million for community initiatives. These were programme commitments, rather than a single new service that every man could immediately book.

## One detail that needs careful reporting
The proposed home PSA testing from 2027 concerned monitoring people already diagnosed with prostate cancer and remained subject to clinical approval. It was not an announcement of general home screening for all men.

## The test is whether support becomes easier to use
For SHIFT, the most useful questions are about delivery: can men find help earlier, are services available around working life, and does an appointment leave room to discuss both physical and mental wellbeing? Those are editorial measures by which to assess progress, not outcomes already demonstrated by the strategy.

Readers should check current local services rather than wait for every national commitment to arrive. The strategy applies to England; Scotland, Wales and Northern Ireland have their own health-service arrangements. Reporting that boundary clearly is part of making the news useful.`,
 fact:'The November 2025 strategy applies to England and contains commitments across physical and mental health.',
 implication:'A national strategy provides a basis for asking what has changed locally, rather than assuming every announced service is already operating.',
 unknown:'The launch announcement does not demonstrate completed delivery or improved health outcomes.'
},
{
 slug:'uk-archive-wales-mental-health-strategy-2025-2035',region:'Wales',authority:'Welsh Government',date:'2025-04-30',
 headline:'Wales’ ten-year mental-health strategy: the plan behind the promise',
 summary:'Wales published a new mental-health and wellbeing strategy in April 2025, alongside an initial delivery plan running to 2028.',
 evidence:[source('Welsh Government — strategy, updated 20 April 2026','https://www.gov.wales/mental-health-and-wellbeing-strategy-2025-2035','2025-04-30'),source('Welsh Government — first delivery plan','https://www.gov.wales/mental-health-and-wellbeing-strategy-delivery-plan-2025-2028','2025-04-30')],
 body:`## A Welsh plan with a ten-year horizon
The Welsh Government published its Mental Health and Wellbeing Strategy 2025–2035 on 30 April 2025. It replaces the Together for Mental Health strategy and is accompanied by a first delivery plan covering 2025–2028. The strategy page was updated in April 2026.

Its stated aims are to improve wellbeing across Wales and improve outcomes for people accessing mental-health support. A strategy and a delivery plan have different jobs: one sets the direction, while the other is the place to look for the initial programme of work.

## What this means for a reader looking for help
The publication is not itself a referral service. It does not mean every appointment, therapy or community programme can be accessed through the same route. For practical support, check the Welsh NHS service that covers your area and ask how an assessment is arranged.

## How SHIFT will judge the story
Useful follow-up reporting should ask what has become easier for people to access, whose experience is being measured and where the gaps remain. Publishing a ten-year ambition is a starting point for those questions, not proof that the work is complete.

This belongs in a UK newsroom precisely because an England-only account would miss it. It gives Welsh readers the correct national policy source without presenting England's service announcements as if they automatically apply in Wales.`,
 fact:'The Welsh strategy covers 2025–2035 and has an initial delivery plan for 2025–2028.',
 implication:'Welsh readers should use Welsh service information for local access, with the strategy as context for promised improvements.',
 unknown:'The strategy publication alone cannot establish current waiting times or individual access to treatment.'
},
{
 slug:'uk-archive-scotland-mental-health-progress-2025',region:'Scotland',authority:'Scottish Government',date:'2025-06-11',
 headline:'Scotland’s mental-health progress report: why delivery needs scrutiny',
 summary:'A June 2025 update reviewed Scotland’s mental-health delivery and workforce plans, including progress and the pressures on implementation.',
 evidence:[source('Scottish Government — progress report','https://www.gov.scot/publications/mental-health-wellbeing-strategy-delivery-plan-workforce-action-plan-update-progress-next-steps/pages/1/','2025-06-11')],
 body:`## An update on delivery, not a new starting point
Scotland's June 2025 progress report reviewed work under its mental-health and wellbeing delivery plan and workforce action plan. It discussed community and primary-care support, the experience of people in crisis, stigma and the connection between physical and mental health.

The report also acknowledged pressures on resources and the workforce. That context matters: a commitment can be worthwhile while its delivery remains difficult. A progress publication should be read for both achievements and unresolved work.

## What readers can reasonably take from it
The document provides a Scottish account of the direction of services. It is not evidence that a particular local team has space, that a waiting list has disappeared or that every area offers the same support.

If you are looking for help, use your local NHS board's current information to check the assessment route. If you are already receiving care, ask which team is responsible for the next step and how to contact it.

## The next useful reporting question
SHIFT's interest is in what changes for the person using the service: clearer access, continuity and practical support. This archive item records the June 2025 update; it should not be mistaken for a September 2026 audit of all Scottish mental-health provision. Measuring delivery requires newer local evidence as well as the national plan.`,
 fact:'The June 2025 publication reviewed both mental-health delivery and workforce planning in Scotland.',
 implication:'Scottish service access should be checked with the relevant NHS board, rather than inferred from England’s programmes.',
 unknown:'This historical progress report does not establish the current capacity of every local service.'
},
{
 slug:'uk-archive-northern-ireland-obesity-service-first-phase',region:'Northern Ireland',authority:'Department of Health Northern Ireland',date:'2026-06-29',
 headline:'Northern Ireland’s obesity service: what the first phase actually covers',
 summary:'The June 2026 update set out a staged obesity-management service and a separate lifestyle programme. Their entry routes should not be confused.',
 evidence:[source('Department of Health Northern Ireland — first phase','https://www.health-ni.gov.uk/news/health-minister-announces-first-phase-nis-first-obesity-management-service','2026-06-29'),source('Department of Health Northern Ireland — original announcement','https://www.health-ni.gov.uk/news/ni-get-its-first-obesity-management-service','2025-05-21')],
 body:`## The newer announcement supersedes the original timetable
Northern Ireland announced plans for its first regional obesity-management service in May 2025. A June 2026 update described a £5 million first phase expected in early autumn 2026. The later update is the relevant reference for the planned rollout, rather than the earlier expectation of early 2026.

The first phase prioritises adults with a BMI above 45 and at least one specified weight-related condition, with clinical assessment determining appropriate care.

## Two programmes, different purposes
The announcement also describes the separate Obesity Prevention and Innovation Programme, or OPIP, aimed at lifestyle support for people with a BMI of 30–39.9. Joining a lifestyle programme must not be presented as a guaranteed route to a weight-loss prescription.

## What to check now
The practical question is whether your local service has confirmed the current referral route and opening arrangements. Ask which programme is being discussed, who assesses eligibility and what support is included. An autumn rollout expectation is not confirmation that every eligible person can book today.

This distinction matters for Northern Ireland readers who have mostly seen headlines about NHS access in England. The nations have different pathways, and an English eligibility rule cannot simply be carried across.`,
 fact:'Northern Ireland’s June 2026 update describes a regional obesity service and a separate lifestyle programme with different entry criteria.',
 implication:'Use Northern Ireland’s current local referral information; do not substitute England’s NHS prescribing rules.',
 unknown:'The announcement does not confirm an individual referral outcome or the date every part of the service becomes available.'
},
{
 slug:'uk-archive-england-mental-health-survey-2023-2024',region:'England',authority:'NHS England',date:'2025-11-27',
 headline:'England’s mental-health survey: what the newer figures can tell us',
 summary:'The 2023/24 Adult Psychiatric Morbidity Survey, published in stages during 2025, helps describe need. Its figures are not a live count for 2026.',
 evidence:[source('NHS England — Adult Psychiatric Morbidity Survey','https://digital.nhs.uk/data-and-information/publications/statistical/adult-psychiatric-morbidity-survey/survey-of-mental-health-and-wellbeing-england-2023-24','2025-11-27')],
 body:`## Keep the survey period attached to the headline
England's Adult Psychiatric Morbidity Survey collected information from March 2023 to July 2024. Results were released in stages in 2025, with the full publication dated 27 November. These are survey findings about that period, rather than a live September 2026 measure.

Among adults aged 16–64, the estimated prevalence of common mental-health conditions was 22.6%, compared with 18.9% in the 2014 survey. The publication also describes inequalities and access to treatment.

## What a national estimate cannot do
A population survey cannot diagnose a reader, establish what caused their difficulties or predict how long they will wait for help. Comparisons also need matching age groups and definitions; numbers taken from different tables may describe different populations.

The publisher has withdrawn the autism chapter because of a measurement problem. We have excluded those estimates from this article and have not treated the rest of the report as invalid because one chapter requires correction.

## Why it belongs in the archive
This is a useful baseline for examining demand for support in England. For SHIFT, the editorial question is whether services are becoming easier to reach alongside that need. Answering it requires service data and people's experiences, not simply repeating a striking prevalence figure.`,
 fact:'The underlying survey fieldwork ran in 2023–2024 and covered England.',
 implication:'Keep the geography, age range and data period visible when using national mental-health statistics.',
 unknown:'The survey is not an individual diagnosis or a current local waiting-time measure.'
},
{
 slug:'uk-archive-wegovy-tablet-mhra-approval-june-2026',region:'UK',authority:'MHRA',date:'2026-06-11',
 headline:'Wegovy tablet approval in the UK: what the June decision changed',
 summary:'The MHRA authorised oral semaglutide for weight management in June 2026. Regulatory approval, NHS funding and provider availability are separate decisions.',
 evidence:[source('MHRA','https://www.gov.uk/government/news/first-glp-1-tablet-for-weight-loss-approved-in-the-uk','2026-06-11')],
 body:`## What the regulator authorised
On 11 June 2026, the MHRA approved semaglutide tablets, marketed as Wegovy, for weight loss and weight management in eligible adults in the UK, alongside diet and physical activity measures. The treatment remains prescription-only.

The announcement describes specific instructions for taking the tablet on an empty stomach. A daily tablet and a weekly injection are not interchangeable routines, and a patient should follow the current leaflet and prescribing advice rather than improvise a switch.

## Approval does not answer every access question
The MHRA stated at the announcement that the tablet was not available through the NHS. Funding decisions follow a different process from regulatory authorisation. The announcement also does not establish whether a particular private provider has stock or offers the treatment.

## A neutral way to read the news
For readers, the useful questions are about suitability, daily routine, monitoring and the full cost of care where treatment is private. Those questions should be answered in an assessment, not inferred from a headline about a new format.

This archive report records a UK regulatory decision. It does not recommend the medicine, offer a prescription or confirm that SHIFT can supply it. Reported common side effects include nausea, vomiting, diarrhoea and constipation; the current patient leaflet contains the fuller safety information.`,
 fact:'The MHRA authorised Wegovy tablets for UK weight management on 11 June 2026.',
 implication:'Read the UK authorisation separately from current NHS commissioning and any provider’s confirmed availability.',
 unknown:'The approval announcement does not establish personal suitability, current local stock or a provider’s price.'
},
{
 slug:'uk-archive-foundayo-orforglipron-mhra-approval',region:'UK',authority:'MHRA',date:'2026-08-10',
 headline:'Foundayo approved in the UK: what the orforglipron decision means',
 summary:'The MHRA’s August 2026 decision covers weight management and type 2 diabetes. It does not by itself create NHS access or confirm private stock.',
 evidence:[source('MHRA','https://www.gov.uk/government/news/uk-first-in-europe-to-authorise-orforglipron-for-weight-management-and-type-2-diabetes','2026-08-10')],
 body:`## The UK decision
On 10 August 2026, the MHRA authorised orforglipron, marketed as Foundayo, for weight management and type 2 diabetes in eligible adults. It is a prescription-only GLP-1 medicine taken as a daily tablet.

The regulator describes a tablet without food or water timing restrictions, with treatment escalated under prescribing instructions. That is a feature of this medicine's authorised use, not a reason to apply its instructions to another tablet or injection.

## What did not follow automatically
At the time of the announcement, the MHRA said Foundayo was not available through the NHS. Regulatory approval, assessment for NHS use and commercial supply are different stages. None should be collapsed into a claim that everybody can now obtain it.

## What readers should ask
If a treatment is being considered, ask the prescribing service to explain the indication, monitoring, possible side effects and whether the total care package fits your circumstances. A new option is still an individual clinical decision.

This report records the UK announcement without recommending a brand or confirming SHIFT availability. The MHRA lists gastrointestinal effects among common side effects and warns against unregulated sellers. Use the current patient leaflet and a registered prescribing service for medicine-specific advice.`,
 fact:'The MHRA authorised orforglipron in the UK on 10 August 2026 for weight management and type 2 diabetes.',
 implication:'UK readers should distinguish authorisation from current NHS access and a particular provider’s supply arrangements.',
 unknown:'The announcement does not confirm personal eligibility, current stock or an NHS funding decision.'
},
{
 slug:'uk-archive-scotland-prevention-weight-health-framework',region:'Scotland',authority:'Scottish Government',date:'2025-06-17',
 headline:'Scotland’s prevention plans: why weight management goes beyond a prescription',
 summary:'Two ten-year frameworks published in June 2025 placed prevention, healthier food environments and care closer to home on Scotland’s agenda.',
 evidence:[source('Scottish Government','https://www.gov.scot/news/creating-a-healthier-scotland/','2025-06-17')],
 body:`## A wider approach to preventing poor health
Scotland published a Population Health Framework and a Health and Social Care Service Renewal Framework in June 2025. The announcement connected prevention with access to green spaces, activity, affordable nutritious food and support closer to home.

It also set out plans to address the promotion and placement of less healthy food. This archive article records that policy intention; it does not treat a 2025 proposal as proof of the law currently in force.

## Why this is relevant to weight management
The story broadens the discussion beyond which treatment a person might receive. Food prices, local places to be active and the convenience of care are practical parts of everyday life. A national framework can set priorities around them, but it does not show that every community has already benefited.

## What to look for locally
Our editorial questions are straightforward: which affordable activity or food-support schemes operate near you, who can use them and how easy are they to join? Ask for the current local details rather than relying on the national launch announcement.

For SHIFT's archive, this is useful Scottish context alongside medicine and mental-health reporting. It provides a basis for examining prevention work while keeping promised reform separate from measured results and services available today.`,
 fact:'Scotland published two ten-year frameworks focused on population health and service renewal in June 2025.',
 implication:'Scottish readers can use the plans as context while checking current local prevention and community-support services.',
 unknown:'The framework announcement does not establish current legal requirements or completed improvements in every area.'
},
{
 slug:'uk-archive-burnout-report-2026-workplace-mental-health',region:'UK',authority:'Mental Health UK',date:'2026-01-16',
 headline:'UK burnout research: workplace support needs to reach the working day',
 summary:'Mental Health UK’s 2026 survey highlights the gap between mental-health awareness and practical support at work.',
 evidence:[source('Mental Health UK — original YouGov survey report','https://mentalhealth-uk.org/news-and-insights/burnout-report-2026-high-stress-pushing-workers-into-sick-leave-as-just-one-in-four-feel-mental-health-is-genuinely-prioritised-and-supported-in-the-workplace/','2026-01-16',2)],
 body:`## What the UK survey reported
Mental Health UK's January 2026 Burnout Report draws on YouGov polling of more than 4,500 UK adults. It reported that one in five workers had taken sickness absence linked to stress-related poor mental health.

Only 27% of workers said mental health was prioritised with action and resources. Another finding was a gap between awareness activity and managers having enough time, training or resources to help.

## A survey is not a clinical diagnosis
These are respondents' accounts of stress, work and support. They are not a clinical assessment of every worker, and they do not prove that one specific workplace policy caused an illness or an absence. The report provides a useful signal about experience, with those limits attached.

## What useful support might be asked to deliver
SHIFT's practical questions for an employer are about the working day: is there time for a private conversation, does the manager know the route to support, and is there a clear plan when someone returns after absence? An awareness poster does not answer those questions by itself.

For an employee, ask what support is actually available and how to access it confidentially. This article reports UK workplace research; it does not diagnose burnout, give employment-law advice or imply that an employer can replace clinical care.`,
 fact:'The report is based on YouGov polling of more than 4,500 UK adults, rather than a clinical assessment of every worker.',
 implication:'The UK findings support practical questions about access to workplace mental-health support and recovery after absence.',
 unknown:'The survey does not establish a diagnosis or the effect of a specific employer policy on an individual.'
}
];
export const archiveBatch=rows.map(row=>{
 const dateLabel=new Date(row.date+'T12:00:00Z').toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'});
 const slug='medicine-news/'+row.slug;
 return {...row,content:{headline:row.headline,standfirst:`UK archive · Original report: ${dateLabel}. ${row.summary}`,what_changed:row.summary,why_it_matters_to_uk:row.implication,known_facts:[{claim:row.fact,source_url:row.evidence[0].url}],unknowns:[row.unknown],safety:'',article_markdown:`**UK archive review · 13 September 2026. Original source: ${dateLabel}.** This article revisits a UK development; it is not a new announcement today.\n\n${row.body}`,destinations:['medicine_news','knowledge_links','search','sitemap'],seo:{title:row.headline.slice(0,70),description:row.summary.slice(0,160),slug,canonical:'https://shiftsometimber.co.uk/'+slug,image:'/assets/og-default.jpg',image_alt:'SHIFT Newsroom — UK health reporting',keywords:[row.region,'UK health news',...(row.headline.match(/mental|therapies|burnout/i)?['mental health']:['weight management'])],datePublished:'2026-09-13T12:00:00.000Z',dateModified:'2026-09-13T12:00:00.000Z',author:'SHIFT Newsroom',reviewer:'SHIFT Newsroom editorial review',source_url:row.evidence[0].url}}};
});
