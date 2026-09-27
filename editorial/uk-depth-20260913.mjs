// REC-037: original UK reporting. Publication dates must never impersonate source dates.
const s=(authority,url,date=null,tier=1)=>({authority,url,source_date:date,source_tier:tier,retrieved_at:'2026-09-13T00:00:00Z'});
const nhs=(path,date)=>s('NHS England','https://www.england.nhs.uk/'+path,date);
const rows=[];
const add=(slug,region,authority,date,headline,summary,evidence,body,unknown)=>rows.push({slug:'uk-archive-'+slug,region,authority,date,headline,summary,evidence,body,fact:summary,implication:body.split('\n\n').at(-1),unknown});

add('nhs-diabetes-remission-programme-explained','England','NHS England','2025-11-08',
'NHS diabetes remission: what the programme actually involves',
'England’s remission programme expanded in 2024/25. Its supervised treatment and follow-up matter as much as the headline enrolment figure.',
[nhs('2025/11/record-numbers-of-people-with-type-2-diabetes-benefit-from-nhs-soups-and-shakes/','2025-11-08'),nhs('diabetes/treatment-care/diabetes-remission/',null)],
`## More people started, but starting is not remission
NHS England reported that more than 13,000 people began its Type 2 Diabetes Path to Remission programme in 2024/25, compared with 6,401 the preceding year. These are enrolments, not a count of people whose diabetes went into remission.

The service includes an initial, nutritionally complete meal-replacement phase, followed by food reintroduction and support across a year. This is supervised clinical care, including review of existing medicines. It should not be copied by attempting a very low-calorie diet alone.

## Who can ask about it?
The NHS service page describes eligibility including a type 2 diabetes diagnosis within six years and BMI thresholds that differ by ethnic background. A GP or diabetes team can assess suitability and explain local referral. Eligible participants receive the NHS programme without charge.

## Look beyond the first phase
Our suggested questions concern the transition back to ordinary meals: who helps with planning, what happens if work or family circumstances change, and how are progress and medicines reviewed? Ask how appointments fit shift work and whether support is remote or in person.

A useful comparison between services should include the entire year, rather than only the initial diet. Enrolment growth shows the programme is reaching more people; it does not establish your likely outcome or how quickly your local service can offer a place.

If you already have diabetes, ask specifically about remission support. A diabetes-prevention programme serves a different group and is not an interchangeable referral.`,
'Enrolment figures do not show how many starters achieved or maintained remission.');

add('healthier-you-diabetes-prevention-million','England','NHS England','2025-12-30',
'Healthier You: understanding NHS diabetes-prevention support',
'Nearly a million people had started England’s prevention programme by December 2025. The offer is support for elevated risk, not diabetes treatment.',
[nhs('2025/12/nhs-diabetes-prevention-scheme-helps-one-million-people/','2025-12-30')],
`## What the milestone measures
NHS England reported that nearly one million people had started Healthier You since its launch. The December 2025 announcement describes a nine-month programme delivered face to face or digitally, with support around food, activity and weight.

The cumulative figure counts people starting. It should not be rewritten as a million people completing the programme, avoiding diabetes or losing a specified amount of weight. These are different outcomes that require different evidence.

## Prevention and treatment are separate routes
This programme is intended for people at increased risk of type 2 diabetes. Someone already diagnosed should ask their clinical team about diabetes care and, where appropriate, remission support. An online risk questionnaire can start a conversation but does not replace the assessment used for referral.

## What would make a referral useful?
For SHIFT readers, the practical question is whether the support can become part of an ordinary week. Ask about session times, the digital requirements, language support and how missed sessions are handled. A referral that cannot be attended is different from support a person can use.

It is also worth explaining previous attempts without treating them as failures. Which changes were manageable, which became expensive, and what happened when work became busy? Those details give the receiving service something more useful than a target weight alone.

Ask your GP team whether your results put you on the local prevention pathway. Keep this separate from any decision about weight-loss medicines: participation in a prevention programme is not itself a prescription entitlement.`,
'The national total does not establish completion, individual benefit or current local capacity.');

add('anxiety-talking-therapies-self-referral','England','NHS England','2026-02-18',
'Anxiety and NHS talking therapies: when to ask for support',
'A February 2026 NHS campaign highlighted anxiety conditions that people may overlook, including OCD, panic and post-traumatic stress.',
[nhs('2026/02/nhs-talking-therapies-completely-changed-my-life-nhs-launches-major-campaign-to-support-millions-more-people-with-anxiety/','2026-02-18'),s('NHS','https://www.nhs.uk/tests-and-treatments/talking-therapies/')],
`## Anxiety covers more than everyday worry
NHS England’s campaign highlighted obsessive-compulsive disorder, panic, post-traumatic stress, social anxiety, body dysmorphic disorder and phobias. It aimed to reach people who might not recognise that talking therapies could address their difficulties.

The accompanying survey found that some adults delayed seeking support because their problems did not feel serious enough. That is a finding about respondents’ perceptions, not a clinical assessment of everyone who answered.

## You do not need to arrive with a diagnosis
NHS information explains that adults in England can self-refer for an assessment for anxiety or depression without first obtaining a formal diagnosis. Most services accept people aged 18 or over; some accept people from 16. A referral leads to assessment, rather than a guarantee of a particular therapy.

## Make the first conversation concrete
Our suggestion is to describe what daily life has become harder: travelling, leaving home, sleeping, concentrating or managing repeated fears. You do not need to choose the correct diagnostic label before making contact.

Ask what assessment involves, which formats are offered and how the service will tell you about the next step. If phone calls are difficult, check the available online referral route and explain any communication needs.

The campaign is about England’s talking-therapies service. Other UK nations have their own arrangements. If support is urgent, use the NHS urgent mental-health route rather than waiting for a routine referral. The value of the campaign is opening a door to assessment, not promising an identical outcome for everyone who enters.`,
'Survey responses and national waiting-time figures cannot predict an individual’s assessment or outcome.');

add('globalminds-mental-health-research-invitations','UK','NHS England','2026-02-14',
'GlobalMinds: what the mental-health research invitation means',
'The NHS-backed study links volunteers’ samples, questionnaires and records. Its initial recruitment announcement covered England and Wales.',
[nhs('2026/02/thousands-recruited-for-new-era-severe-mental-illness-study/','2026-02-14')],
`## An invitation to research
In February 2026, NHS England announced invitations to almost 50,000 eligible adults for GlobalMinds. The study initially launched in England and Wales and concerns conditions including bipolar disorder, schizophrenia, psychosis and major depression.

The project brings together genetic samples, questionnaires and NHS records. It is led by Akrivia Health with Cardiff University, with NHS DigiTrials helping identify and invite eligible participants. An invitation total is not the number of completed participants or a research result.

## What participation asks of someone
The announcement describes home sampling and support for people who face digital barriers. Participation requires the person’s knowledge and permission. It does not offer an established new treatment or a genetic test that can settle an individual’s diagnosis.

## Questions before you decide
We would suggest reading the participant information with four questions in mind: what information is collected, who can use it, how long participation lasts, and what withdrawal would mean for information already used. Ask whether individual results will be returned and who to contact if a questionnaire feels difficult.

An invitation can be worthwhile without creating an obligation. Keep your usual care appointments and discuss anything unclear with the study team through its official contact details.

For SHIFT readers, the distinction is between helping researchers build better evidence and receiving a proven benefit now. The NHS announcement links to GlobalMinds’ own participation information; check that current information for participating areas and eligibility rather than assuming the initial rollout covered the whole UK.`,
'The recruitment announcement contains no evidence that GlobalMinds has already improved clinical outcomes.');

add('adult-adhd-taskforce-final-report','England','NHS England','2025-11-06',
'Adult ADHD: what England’s taskforce report changes—and leaves open',
'The November 2025 final report called for better support across health, education and work. Recommendations need to be distinguished from local delivery.',
[nhs('2025/11/nhs-england-responds-to-adhd-taskforce-final-report/','2025-11-06')],
`## The problem extends beyond a waiting list
England’s independent ADHD Taskforce published its final report in November 2025. NHS England’s response describes pressure across health, education, employment and the criminal justice system, with recommendations for more coordinated, needs-based support.

The response highlights changes to assessment models, professional training, digital tools and information. It does not announce that every recommendation has already been implemented or that an adult can now obtain an immediate assessment locally.

## Separate three practical questions
For someone waiting, it helps to distinguish referral status, support for present difficulties and the eventual diagnostic assessment. Ask the referring service who currently holds the referral, how to report a change in circumstances and what help can be accessed while waiting.

For a workplace conversation, describe the tasks or conditions causing difficulty and ask what practical support can be discussed. That conversation need not begin with an argument about a national report. Equally, an online questionnaire should not be presented as a definitive diagnosis.

## What would count as progress?
Our editorial test is whether a person encounters a clearer route, fewer repeated explanations and support they can actually use. A new policy document is a starting point for checking those things, not proof that they have happened.

This article covers England’s final report, bringing the earlier interim announcement into the same story. It deliberately avoids treating successive statements about the same taskforce as separate breakthroughs. Confirm the current local pathway with the service involved, particularly if an assessment or ongoing care is being transferred between providers.`,
'A national response does not confirm implementation dates, local assessment capacity or a particular person’s diagnosis.');

add('suicide-prevention-training-person-centred-care','England','NHS England','2025-09-11',
'Suicide prevention: the NHS shift towards person-centred support',
'New staff training announced in September 2025 focused on understanding a person’s needs and safety, rather than relying on a risk label.',
[nhs('2025/09/new-suicide-prevention-training-rolled-out-nhs-mental-health-staff/','2025-09-11')],
`## What the training is intended to improve
NHS England announced new suicide-prevention training for mental-health staff in September 2025. Available through MindEd, the course supports a person-centred approach to understanding distress, practical needs and safety.

The announcement places less emphasis on predicting what someone will do through a low, medium or high risk label. A label cannot substitute for listening to the person and making an appropriate plan with them.

## What a reader can ask about their care
Our suggested questions are practical: have I understood the plan, do I know who to contact if things change, and have the concerns that matter to me been recorded? If a trusted person is involved, discuss what role you would like them to have.

These questions are not a checklist for deciding whether someone is safe. They help clarify the support being offered and what happens between appointments. A training rollout also cannot show that every professional has completed it or that an individual service has changed its practice.

## Keep the route to immediate help clear
The NHS announcement directs people in England who need urgent mental-health support to NHS 111. If someone is in immediate danger, call 999. A routine appointment, a webpage or a staff-training announcement should not delay urgent help.

For the newsroom, the useful follow-up is whether services can explain their approach in language patients understand. We will not turn this policy announcement into an unsupported claim that suicide has been reduced, or use distressing personal details to make the story more attention-grabbing.`,
'Availability of training is not evidence of completion by every professional or a measured reduction in deaths.');

add('samh-nook-aberdeen-glasgow-mental-health','Scotland','SAMH','2026-06-17',
'The Nook: walk-in mental-health support in Aberdeen and Glasgow',
'SAMH opened its second Nook in Aberdeen in June 2026, adding another free, non-clinical place to talk without a referral.',
[s('SAMH','https://www.samh.org.uk/about-us/news-and-blogs/samh-opensthe-nook-opens-in-aberdeen','2026-06-17',2),s('SAMH','https://www.samh.org.uk/about-us/the-nook',null,2)],
`## A different doorway to support
SAMH’s Aberdeen Nook opened in Marischal Square in June 2026, following the Glasgow service in Merchant City. The charity describes free, non-clinical support, with both locations open seven days a week and no referral or appointment needed to walk in.

The offer includes a conversation with a practitioner, alongside activities and other support. Non-clinical means it should not be confused with a hospital, an emergency mental-health assessment or a prescribing clinic.

## Check the local details before travelling
The launch announcement and current network page serve different purposes. A launch records what opened; the location page is the place to check hours and arrangements before a journey. Planned future locations should not be treated as already open.

If approaching a service feels difficult, our suggestion is to ask a small first question: can I come in just to find out how this works? You can also check accessibility, privacy, whether someone can accompany you and whether a particular activity requires booking.

## What the early demand tells us
Visitor numbers can show that a service is being used. They do not establish clinical effectiveness or mean every visitor has recovered. For a walk-in service, useful measures also include whether people felt heard and could find the right next step.

This is one story about the growing Nook network, rather than separate pages repeating each opening. It gives Scottish readers a concrete support option while keeping SAMH’s charitable service distinct from NHS clinical care. For an emergency, use the appropriate urgent-care route.`,
'Opening announcements and visitor totals do not establish clinical outcomes or confirm today’s opening hours.');

add('pharmacy-cholesterol-pilot-england','England','NHS England','2026-08-31',
'Pharmacy cholesterol checks: who England’s pilot is for',
'Around 100 pharmacies are due to pilot cholesterol testing from autumn 2026. This is a limited rollout, not a service at every pharmacy.',
[nhs('2026/08/high-street-pharmacies-to-launch-seven-minute-cholesterol-checks/','2026-08-31')],
`## What was announced
NHS England announced a pilot of cholesterol checks in around 100 pharmacies, running from autumn 2026 into spring 2027. The proposed service combines a finger-prick test with a pharmacist assessment and advice on the next step.

The announcement describes eligibility including ages 40–84, no pregnancy and no blood test in the preceding year. These are pilot rules, not a reason to assume any nearby pharmacy can provide the service. Local participation needs checking.

## A quick sample still needs interpretation
The seven-minute headline concerns the test. It should not be read as a guarantee that the whole appointment, clinical interpretation and any follow-up take seven minutes. A result needs to be considered alongside the person’s wider health and existing treatment.

Our suggested questions are: what is included, who will explain the result, will my GP receive it, and who arranges follow-up if something needs attention? If you already have recent results, ask whether those can be used rather than assuming another test is needed.

## Keep the pilot in perspective
The earlier pharmacy work cited by NHS England gives a rationale for testing the approach more widely. It does not prove that national delivery is complete or that every participant needs a medicine.

For readers, this may become a convenient local route to cardiovascular assessment. Check that a pharmacy is participating before travelling, and ask your usual clinician about any existing treatment. The pilot announcement does not replace that relationship or establish SHIFT’s own testing availability.`,
'Current participating locations and an individual’s clinical follow-up cannot be inferred from the national pilot announcement.');

add('blood-pressure-checks-england-access','England','NHS England','2026-02-21',
'Blood pressure checks: turn online concern into a useful appointment',
'NHS interest in blood-pressure advice rose during 2025. England’s pharmacy checks and NHS Health Check offer practical routes to assessment.',
[nhs('2026/02/people-searching-nhs-advice-on-high-blood-pressure-skyrocketed-last-year/','2026-02-21'),s('NHS','https://www.nhs.uk/tests-and-treatments/nhs-health-check/')],
`## Search traffic is a prompt, not a diagnosis
NHS England reported that visits to its high-blood-pressure information rose in 2025. This shows increased use of an information page; it does not measure how many additional people developed hypertension.

The announcement also pointed readers towards blood-pressure checks at pharmacies and the NHS Health Check. High blood pressure often has no symptoms, so feeling well is not a reliable substitute for measurement.

## Two offers with different purposes
The NHS Health Check is a wider cardiovascular check for eligible adults aged 40–74 in England, generally offered every five years. It is different from a stand-alone blood-pressure measurement. Existing diagnoses can affect which route is appropriate.

When booking, ask which service you are receiving and whether you meet its eligibility rules. Tell the team about existing treatment or recent readings so that the appointment complements your care.

## Leave with an understandable next step
Our suggested aim is simple: know what was measured, what it means in your circumstances and whether any further monitoring is needed. Ask how you will receive the result and who will contact you if follow-up is arranged.

For someone managing weight, it can be helpful to ask about health measures beyond the scales. That does not mean a single reading can settle overall cardiovascular risk, or that medication should be changed without clinical advice.

The national announcement describes routes in England. It does not guarantee appointment availability at a particular pharmacy or extend England’s Health Check eligibility to the other UK nations.`,
'Website visits are not disease prevalence, and a national offer does not confirm local appointment availability.');

add('heartflow-nhs-coronary-scan-evidence','England','NHS England','2025-05-06',
'HeartFlow on the NHS: what the heart-scan evidence shows',
'An NHS update described wider use of CT-based heart analysis in May 2025. The research concerns diagnosis and testing, not a guaranteed survival benefit.',
[nhs('2025/05/futuristic-3d-heart-scans-speed-up-diagnosis-and-save-millions/','2025-05-06'),s('Nature Medicine — primary NHS study','https://www.nature.com/articles/s41591-025-03620-y','2025-04-04',2)],
`## A scan analysed in a different way
HeartFlow uses information from a coronary CT scan to create a model that helps clinicians assess blood flow. NHS England said the technology was available in 56 hospitals at its May 2025 update.

It is part of a clinical investigation for suspected coronary disease, rather than a general screening test to book because of a weight concern. A cardiologist interprets the information alongside the wider assessment.

## Read the comparison carefully
The linked Nature Medicine study examined NHS use of the technology and subsequent testing. NHS England described fewer invasive angiograms overall and fewer repeat heart tests. Its reported savings are estimates of service costs, not money an individual patient receives.

An implementation study also needs different interpretation from a randomised trial assigning every patient by chance. Changes in services and differences between patient groups can affect comparisons. Reduced testing is valuable only when the remaining pathway still identifies and manages the people who need treatment.

## Questions for a planned investigation
Our suggested questions are: what decision will this scan help make, could further testing still be needed, and who will explain the result? Ask whether this analysis is suitable for your situation rather than assuming every CT scan includes it.

The useful development is potentially avoiding some invasive investigations within a clinician-led pathway. This article does not claim that AI replaces the specialist, that all hospitals offer the technology, or that fewer tests automatically mean better survival. New or urgent symptoms require clinical assessment, not a search for a particular brand of scan.`,
'The service update does not establish universal access or a survival benefit caused by the technology.');

add('prostate-progress-research-invitation','England','NHS England','2026-08-01',
'Prostate Progress: understanding the NHS research invitation',
'Men with current or past prostate cancer are being invited to share their experiences and link records for research. This is not a screening invitation.',
[nhs('2026/08/nhs-inviting-500000-men-to-join-major-prostate-cancer-research-programme/','2026-08-01')],
`## Who the announcement concerns
NHS England announced plans to contact half a million men who have had, or are living with, prostate cancer. Prostate Progress is led by Prostate Cancer Research, with NHS DigiTrials supporting recruitment.

Participants are asked to complete questionnaires about life with the disease and consent to linkage with NHS records for approved research. The aim is to connect treatment information with experiences that a routine medical record may not fully capture.

## It is different from screening
This invitation is directed at men with a history of prostate cancer. It is not an offer of a test to men without a diagnosis, nor a promise of a new treatment. The half-million figure describes planned contact, not confirmed enrolment.

The programme particularly wants better representation of Black men. Representation matters to the questions research can answer; it should not become pressure on any individual to take part.

## Before agreeing to share information
Our suggested questions concern the time commitment, how data are linked, who can access them and what happens if you later withdraw. Ask whether you will receive research updates and whether individual findings will be returned.

You may also want to discuss how questionnaires handle sensitive matters such as fatigue, relationships or treatment side effects. These are reasonable questions about participation, not objections that need to be overcome.

Check the programme information linked from the NHS announcement and use its official contact route. Taking part can contribute to future evidence while remaining entirely separate from decisions about your own ongoing cancer care.`,
'Recruitment ambitions do not establish participation numbers, treatment benefits or a national screening programme.');

add('bowel-screening-fifties-england','England','NHS England','2026-07-11',
'Bowel screening in your 50s: what England’s figures mean',
'England’s July 2026 update found lower participation among younger invitees. A home screening kit is for people without symptoms.',
[nhs('2026/07/nhs-urges-people-50s-return-bowel-screening-kits-100-cancers-found-week/','2026-07-11')],
`## The gap in participation
NHS England reported that 56.2% of 54-year-olds took part in bowel screening during April 2024–March 2025, compared with 73.5% of people aged 70–74. These figures concern participation, not the proportion with cancer.

The July 2026 announcement describes England’s offer of a home FIT kit every two years for people aged 50–74. FIT looks for blood in a stool sample; a result that needs investigation is not, by itself, a cancer diagnosis.

## A kit is easier to use when the next step is clear
If a kit has arrived and been put aside, our practical suggestion is to read its instructions and choose when to complete it. If something is missing or unclear, use the contact details supplied with the kit. It is better to ask than improvise the collection instructions.

For someone who has moved, check that the GP practice has the correct address. If disability, language or another access need makes the process difficult, ask what help is available.

## Symptoms use a different route
The NHS explicitly says screening is for people without symptoms. If you are worried about possible bowel symptoms, speak to your GP rather than waiting for the next kit. A screening timetable should not become a reason to postpone that conversation.

The national results help identify who is less likely to participate. They do not tell us why any one person delayed, and blame is unlikely to make the service easier to use. This article describes England; check the relevant programme for the other UK nations.`,
'Participation data do not explain individual decisions or establish a diagnosis from a screening result.');

add('prostate-sabr-radiotherapy-england','England','NHS England','2026-06-10',
'Prostate SABR: fewer radiotherapy visits for eligible men',
'NHS England announced wider access to five-session prostate radiotherapy in June 2026. Suitability remains a specialist decision.',
[nhs('2026/06/nhs-to-offer-multi-beam-precision-radiotherapy-to-thousands-with-prostate-cancer/','2026-06-10')],
`## What the rollout offers
NHS England announced that eligible men with localised prostate cancer could be offered stereotactic ablative radiotherapy, usually shortened to SABR. It uses carefully targeted radiation and is typically delivered in five sessions, compared with at least twenty in the conventional course described in the announcement.

The potential reduction in visits matters to travel, time away from work and the demands on family or friends. It does not mean the cancer diagnosis, planning, treatment and follow-up are all completed in five appointments.

## Fewer sessions do not settle the choice
Suitability depends on the cancer and the person’s circumstances. The announcement explicitly says this approach is not appropriate for everyone with localised disease. A national rollout plan also cannot confirm when a particular centre will offer it.

Our suggested questions for the specialist team are: why is this option suitable for me, how does it compare with my other options, and which short- and longer-term side effects should we discuss? Ask separately about planning visits, treatment sessions and follow-up.

## Keep the expected benefits specific
Convenience is a real part of treatment experience, but it should not obscure informed choice. A shorter schedule does not remove the need to understand possible urinary, bowel or sexual effects and how concerns will be managed.

The NHS announcement describes expected uptake and capacity savings. Those are forecasts, not counts of men already treated or proof that every individual will experience fewer side effects. Use this story as a prompt for a personalised discussion with the team responsible for your care.`,
'Forecast uptake and appointment savings are not completed outcomes, and SABR is not suitable for everyone.');

add('young-adults-mental-health-work-report','UK','Mental Health UK','2026-05-20',
'Young adults and work: what UK mental-health research asks employers',
'A May 2026 charity report examined confidence, job-seeking and transitions into work. Its findings challenge simple assumptions about motivation.',
[s('Mental Health UK','https://mentalhealth-uk.org/news-and-insights/new-report-young-people-want-to-work-but-mental-health-and-system-gaps-are-holding-them-back/','2026-05-20',2)],
`## Listen to the people behind the label
Mental Health UK’s report draws on a survey of more than 600 people aged 15–24, alongside focus groups with young people and employers. It explores how mental health and confidence interact with entering work.

The report describes practical barriers such as the cost of travelling, unclear expectations and gaps in support when moving between education and employment. These are respondents’ experiences and the charity’s analysis, not proof that a single factor explains everyone who is out of work.

## An employer can examine the first few weeks
Our editorial suggestion is to look at the actual route into a job: does the advert explain the role, does an applicant know what the interview involves, and is there a named person to ask during induction? These are questions a small employer can consider without pretending to provide clinical treatment.

Clear expectations also matter after recruitment. Ask whether a new starter knows how feedback is given and where to raise a concern privately. Avoid assuming that quietness means disinterest or that confidence in an interview predicts wellbeing at work.

## What the report cannot promise
A survey cannot demonstrate that one induction policy will prevent mental illness or guarantee retention. Nor should findings from a selected sample be applied to every young adult in the UK.

For a reader seeking work, it may help to identify the next manageable step and the support needed for it. The report includes meaningful activity beyond paid employment, such as training and volunteering. Its value is encouraging a more specific conversation about barriers and support, rather than judging a whole generation.`,
'The report does not prove the effect of a particular employer policy or represent every young adult’s experience.');

add('ai-chatbots-mental-health-uk-survey','UK','Mental Health UK','2025-11-18',
'AI and mental health: what a UK survey can—and cannot—tell us',
'Mental Health UK’s 2025 polling found both perceived benefits and reported harms. Self-reported experience is not proof of clinical effectiveness.',
[s('Mental Health UK','https://mentalhealth-uk.org/news-and-insights/over-one-in-three-using-ai-chatbots-for-mental-health-support-as-charity-calls-for-urgent-safeguards/','2025-11-18',2)],
`## A snapshot of reported use
Mental Health UK commissioned Censuswide to survey 2,000 UK adults aged 16 and over between 27 October and 3 November 2025. The charity reported that 37% had used an AI chatbot for mental health or wellbeing, combining occasional and regular use.

Respondents described accessibility and anonymity, alongside concerns about accuracy, privacy and harmful experiences. Reported use was higher among men than women. This does not establish why each person chose a chatbot or show that using one improved their health.

## Benefit and safety need stronger tests
Feeling that a conversation helped is meaningful feedback, but it is different from a clinical outcome assessed in a controlled study. Likewise, a survey of reported harms cannot establish causation or compare the safety of individual products.

The charity called for evidence, transparency and human support. Those principles matter particularly when a tool sounds confident: fluency should not be mistaken for verification or clinical responsibility.

## Questions worth asking about any digital support
Our suggested checks are who operates it, what it is intended to do, whether claims have been independently assessed and what happens to information you enter. Ask how to reach a person and what the service does when someone needs urgent help.

Do not use a chatbot response as the sole basis for changing treatment. For SHIFT, the editorial lesson is equally relevant: a polished article still needs traceable evidence. This survey is a reason to scrutinise digital support carefully, not an endorsement of a particular chatbot or a replacement for professional care.`,
'Self-reported use and experience do not establish causation, clinical benefit or the safety of an individual product.');

add('scottish-health-survey-weight-wellbeing-2024','Scotland','Scottish Government','2025-10-21',
'Scotland’s health survey: weight and wellbeing in context',
'The 2024 survey, published in October 2025, links population health reporting with important cautions about screening measures and corrected tables.',
[s('Scottish Government','https://www.gov.scot/publications/scottish-health-survey-2024-volume-1-main-report/','2025-10-21'),s('Scottish Government — survey summary','https://www.gov.scot/publications/scottish-health-survey-2024-volume-1-main-report/pages/summary/','2025-10-21')],
`## A picture of 2024, published later
Scotland’s 2024 health survey reported that 31% of adults were living with obesity, a level described as similar to 2023. It also reported differences in mental-health screening scores between more and less deprived areas.

The year in the title is the period studied. October 2025 is the publication date; neither should be rewritten as a measurement of Scotland in September 2026. The report’s website records corrections made in March 2026, and its tables have been updated.

## Screening scores are not diagnoses
Some mental-health findings use questionnaire thresholds indicating a possible problem. They should not be described as the percentage of people with a confirmed psychiatric diagnosis. Weight classifications and wellbeing scores also describe different aspects of health.

Our reading is that the survey is useful for asking how support reaches different communities. It cannot show that a particular person’s weight caused their distress or that one policy produced a change in the figures.

## What this means for a local service
A constructive question is whether practical support matches the barriers people face: cost, transport, accessible appointments and continuity of care. A national average does not reveal how easy a service is to use in one neighbourhood.

For an individual reader, the survey is context rather than a personal assessment. If weight or wellbeing is a concern, describe what help you need to the relevant healthcare team. For the newsroom, keeping the original dates and correction notice visible matters more than presenting old statistics as a fresh discovery.`,
'Population survey measures cannot diagnose individuals or establish causes; corrected tables supersede earlier versions.');

add('wales-gambling-treatment-helpline','Wales','Welsh Government','2026-02-25',
'Wales gambling support: what the new NHS service was set up to do',
'A February 2026 announcement set out a specialist gambling service and helpline for Wales, including support for affected family members.',
[s('Welsh Government','https://media.service.gov.wales/news/gambling-helpline-and-specialist-treatment-service-to-be-launched-in-wales','2026-02-25')],
`## The planned service
The Welsh Government announced a specialist NHS gambling-treatment service and helpline scheduled to launch on 1 April 2026. Betsi Cadwaladr University Health Board was awarded annual funding to run it for Wales.

The announcement describes information and support for people experiencing gambling harms and for others affected, including family members. Treatment was designed to be accessible remotely through a secure platform, with assessment, referral and aftercare.

## A national announcement is not a local appointment
This archive item records the service design and intended launch. It does not independently establish current waiting times, staffing or the outcome of an individual referral. Check the health board’s current service information before relying on an opening announcement for contact arrangements.

Our suggested questions are whether support is available directly, what an initial conversation involves, whether family members can seek help separately and what alternatives exist for someone who cannot use a digital platform.

## Make room for the wider effects
When asking for support, it can be useful to explain which parts of life are being affected, rather than trying to decide whether the problem is serious enough to deserve help. You can ask how the service works alongside other mental-health or practical support.

The useful UK distinction is that this is a Welsh NHS pathway, not simply England’s clinic system with a different label. A service announcement creates an opportunity to check what help is available; it does not prove that every person affected has already been reached or treated successfully.`,
'The launch announcement does not independently verify current operating arrangements, waiting times or treatment outcomes.');

add('scotland-gp-walk-in-centres-data','Scotland','Public Health Scotland','2026-07-28',
'Scotland’s GP walk-in centres: access and the limits of early data',
'Public Health Scotland began reporting pilot activity in July 2026. Different opening dates and local arrangements make simple league tables misleading.',
[s('Public Health Scotland','https://publichealthscotland.scot/news/2026/july/public-health-scotland-publishes-data-on-new-gp-walk-in-centres/','2026-07-28')],
`## A new route being evaluated
Public Health Scotland began publishing activity from Scotland’s GP walk-in pilot in July 2026. The first centre opened in Wester Hailes in February, with nine operating by the end of June and more planned.

The pilot is intended to offer same-day help for urgent primary-care concerns without an appointment. It is not a replacement for every part of a person’s usual GP care, and a target for future centres should not be counted as centres already open.

## Why visit totals are not a performance ranking
Centres opened at different times, can have different hours and may serve different groups. Public Health Scotland specifically warns against direct comparisons of their activity totals. Separate evaluation is examining effectiveness, appropriateness and cost.

A busy centre may reflect local demand, access or the length of time it has been open. The number alone cannot prove that it has reduced pressure elsewhere or that one location provides better care.

## Check before making the journey
Our suggested questions are whether the centre covers your situation, what its current hours are and how information gets back to your usual practice. For an ongoing problem, also ask who is responsible for follow-up.

The PHS announcement links to NHS inform’s location and eligibility information. Use current local details rather than the original rollout plan. For readers managing long-term weight or mental-health concerns, continuity still matters: a convenient same-day consultation and an agreed ongoing care plan serve different purposes.`,
'Early activity totals cannot establish effectiveness or be used to rank centres with different operating arrangements.');

add('scotland-mat-standards-mental-health-support','Scotland','Public Health Scotland','2026-07-07',
'Scotland’s drug-treatment standards: access, choice and mental health',
'The 2025/26 MAT report examines treatment delivery across Scotland. Revised assessment criteria mean its scores cannot simply be compared with last year.',
[s('Public Health Scotland','https://publichealthscotland.scot/news/2026/july/national-report-highlights-progress-and-next-steps-for-mat-standards/','2026-07-07'),s('Public Health Scotland — MAT overview','https://publichealthscotland.scot/population-health/improving-scotlands-health/drugs/treatment/medication-assisted-treatment-mat-standards/overview/')],
`## What the report assesses
Public Health Scotland’s July 2026 report examines implementation of ten Medication Assisted Treatment standards across thirty Alcohol and Drug Partnerships. It combines process, numerical and experience evidence about how services are delivered.

The report describes progress in access, choice, outreach and keeping people engaged with treatment. It also identifies challenges involving psychological support, mental-health care, staffing, rural delivery and coordination between services.

## A changed scoring system needs care
Assessment criteria changed in October 2025. PHS therefore says the 2025/26 findings are not directly comparable with previous years. A higher or lower-looking score should not be used to manufacture a simple improvement or decline story.

The report is an official statistics in development release. It concerns implementation of standards, rather than proving a particular reduction in drug-related deaths caused by the programme.

## What someone using a service might ask
Our suggested questions are about the experience of care: how are treatment choices explained, who helps if mental-health needs arise, and what happens after a missed appointment? Ask who coordinates support when more than one team is involved.

Those questions help connect a national standards document with an individual’s day-to-day care. They are not instructions for choosing or changing medication, and a national report cannot assess personal suitability.

For SHIFT readers, this is a useful Scottish mental-health and access story because physical health, substance-use support and psychological care can otherwise be discussed separately. The test is whether the person can navigate the whole service, not simply whether a standard has been published.`,
'Changed criteria prevent direct year-on-year score comparisons; implementation findings are not proof of causal health outcomes.');

add('stamina-prostate-exercise-support','England','NIHR','2026-09-07',
'STAMINA: exercise support during prostate hormone treatment',
'An NHS trial reported better quality of life with supervised support. The related activity programme has a specific referral route, not open national enrolment.',
[s('NIHR','https://www.nihr.ac.uk/news/exercise-programme-mitigates-prostate-cancer-treatment-side-effects','2026-09-07'),s('Nuffield Health — current programme','https://www.nuffieldhealth.com/about-us/our-impact/healthy-life/cancer-activity-programme',null,2)],
`## Support alongside cancer treatment
The NIHR reported results from STAMINA, involving 700 men receiving androgen deprivation therapy across fifteen NHS hospitals in England. The intervention combined supervised exercise, dietary advice and behavioural support with ongoing cancer care.

The reported benefits concern quality of life and fatigue. This is not evidence that exercise replaces hormone treatment or cures prostate cancer. The study tested organised support, not a general instruction to join a gym and manage alone.

## What the related service currently says
Nuffield Health’s Cancer Activity Programme describes a free 24-week offer with tailored assessment and supervised sessions, followed by longer-term support. Its current page lists selected referring NHS trusts and Nuffield hospitals. It is not open self-referral from every part of the UK.

The service page also retains an older sentence anticipating trial results. The September 2026 NIHR announcement is the later source for the results; the provider page is used here for the published access arrangements.

## Questions for your clinical team
Ask whether a supported activity programme is appropriate during your treatment, whether your team can refer and how exercises would be adapted. Clarify travel, appointment frequency and what support remains after the initial programme.

For someone concerned about weight gain or loss of strength during treatment, those details may be more useful than a general fitness target. The important feature is coordination with the treating team.

The trial announcement is encouraging evidence for supportive care. It does not confirm an available place locally or justify changing cancer medication. Check the provider’s current referral list with your healthcare professional.`,
'The trial does not establish a cancer-survival benefit, and the current referral offer is limited to listed providers.');

add('severe-mental-illness-weight-support-gap','UK','University of Bristol','2025-09-23',
'Severe mental illness and weight: a UK gap in practical support',
'A study of UK GP records found greater weight gain after severe mental illness diagnoses, without a corresponding increase in structured referrals.',
[s('University of Bristol','https://www.bristol.ac.uk/primaryhealthcare/news/2025/weight-gain-in-people-with-severe-mental-illness.html','2025-09-23',2)],
`## What the records showed
Researchers examined records from 1,454 GP practices, comparing 23,025 adults with severe mental illness with 90,879 matched peers. The university’s September 2025 report describes greater weight gain in the first group, particularly during the years soon after diagnosis.

Although weight-management advice was recorded more often, referrals to structured programmes were not more likely after adjustment. Advice and access to an organised service are different measures; recording one does not demonstrate delivery of the other.

## Why the study does not explain every cause
This was observational research using routine records. Recording frequency, delays and differences between groups can affect the findings. Associations involving antipsychotic use do not establish that one medicine explains all the weight change.

The result should not become a reason to stop essential treatment. It raises a service question about whether physical-health support accompanies mental-health care early enough.

## A more specific appointment conversation
Our suggested questions are: who is monitoring physical health, what support is available if weight changes, and can someone help with a referral rather than advice alone? Ask how the mental-health and primary-care teams share responsibility.

It can also help to explain practical barriers, including fatigue, money, transport or difficulty attending a group. A programme that exists on paper may still be hard to use.

For SHIFT, this is a particularly relevant UK story because it connects weight and mental health without blaming the person. The useful response is coordinated assessment and accessible support, with medication decisions remaining with the prescribing team.`,
'Routine-record associations do not establish individual causes or the effect of changing a medicine.');

add('paxd-pramipexole-depression-uk-trial','UK','University of Oxford','2025-06-30',
'Persistent depression: what the UK pramipexole trial found',
'Oxford’s trial tested an add-on treatment for difficult-to-treat depression. Symptom improvements must be considered alongside tolerability.',
[s('University of Oxford','https://www.ox.ac.uk/news/2025-06-30-parkinson-s-drug-effective-treating-persistent-depression','2025-06-30',2)],
`## An add-on, not a replacement
Oxford reported a UK trial involving 150 people with treatment-resistant depression. Participants received pramipexole or placebo alongside their existing antidepressant treatment, with follow-up extending to 48 weeks.

The June 2025 university report describes greater symptom improvement with pramipexole, but also significant side effects. Around one in five people receiving it dropped out because of tolerability problems. Reporting the benefit without this drawback would give an incomplete picture.

## What the comparison can answer
A placebo-controlled trial provides stronger evidence about the tested add-on than an individual success story. It does not establish that the medicine is preferable to every other add-on option, works for everyone or should become a routine first treatment.

The researchers called for further work on tolerability, cost-effectiveness and comparisons with alternatives. The announcement is research evidence, not a new general prescribing instruction for readers.

## When existing treatment has not helped enough
Our suggested conversation with the treating team is about the whole history: which treatments were tried, how long they were used, what changed and which adverse effects were difficult. Ask whether a specialist review is appropriate and how the next option would be monitored.

Bring questions about the study if useful, but do not add, stop or alter medicine on the basis of an article. A trial involving selected participants cannot determine personal suitability.

The value of this UK result is that it expands the evidence available for a difficult clinical problem. Its limitations and treatment burden belong alongside the positive result, not in small print.`,
'The trial does not establish superiority over all other add-on treatments or personal prescribing suitability.');

add('northern-ireland-health-survey-weight-mental-health','Northern Ireland','Department of Health Northern Ireland','2025-11-26',
'Northern Ireland’s health survey: weight, wellbeing and unequal access',
'The 2024/25 survey offers local context for weight and mental health. Its methods matter when interpreting changes and comparing nations.',
[s('Department of Health Northern Ireland','https://www.health-ni.gov.uk/news/health-survey-ni-first-results-202425','2025-11-26')],
`## Local evidence rather than a UK average
Northern Ireland’s Department of Health published its 2024/25 survey results in November 2025. The survey included 3,243 people aged 16 and over and covered physical health, wellbeing and health-related behaviours.

It reported 30% of adults in the obesity category and 38% expressing some concern about their mental health in the preceding year. These are different measures: concern about mental health is not a confirmed diagnosis, and neither figure describes everyone in the same way.

## Why comparisons need restraint
The survey used both telephone and face-to-face interviews. The department notes a lower response rate than before the pandemic and under-representation of younger adults, addressed through weighting. Weighting improves the estimates but cannot remove every possible bias.

This is why a small apparent change should not automatically become a dramatic trend headline. Direct comparisons with Scotland or England also need attention to questions, sampling and timing.

## What readers can take from it
Our interpretation is that local evidence helps ask better service questions. Does support address both physical and mental health? Can people with limited transport, money or time use it? Are referral arrangements clear in the area where they live?

For a personal concern, use the relevant Northern Ireland healthcare route rather than assuming England’s eligibility rules apply. A national survey is useful context for planning and accountability; it cannot decide whether an individual needs treatment.

The article keeps the survey year separate from its publication date. Reusing an archive source should add explanation, not make older measurements appear newly collected.`,
'Survey mode, response and weighting limit trend and cross-nation comparisons; findings are not individual diagnoses.');

add('game-of-stones-men-weight-loss-followup','UK','NIHR','2026-05',
'Game of Stones: two-year results for men’s weight management',
'The UK trial tested supportive texts with and without incentives. Longer follow-up makes the outcome more nuanced than the original cash-reward headline.',
[s('NIHR — Macaulay and colleagues, Public Health Research 14(10), DOI 10.3310/GJPH0909','https://www.journalslibrary.nihr.ac.uk/phr/GJPH0909','2026-05',2),s('NIHR report — NCBI mirror','https://www.ncbi.nlm.nih.gov/books/NBK622229/','2026-05',2)],
`## A programme designed around men
Game of Stones recruited 585 men living with obesity in Belfast, Bristol and Glasgow. Participants were randomly allocated to supportive texts plus financial incentives, texts alone, or a waiting-list group. The financial incentive came from the study; men did not have to risk their own deposit.

The May 2026 NIHR report brings together the trial and its longer follow-up. Its original one-year results had already been reported earlier, so this is not a newly completed trial in September 2026.

## The longer view matters
At twelve months, weight loss was greater with texts plus incentives than in the control group. At twenty-four months, the between-group differences were no longer statistically significant. Follow-up reached 64% at that point, and the control group had received a shorter text intervention after its first year.

Those details make a simple claim that paying men produces lasting superior weight loss too strong. Economic modelling also depends on assumptions about what happens after observed follow-up.

## Useful design questions for support
Our interest is in how a programme fits people who do not attend conventional groups. What makes contact manageable, what happens when motivation falls, and how is support maintained after the initial period? A useful service needs answers beyond the opening incentive.

This study does not establish that a reader will be paid to lose weight or that the programme is available locally. Nor does it justify comparing its percentages directly with medicine trials involving different participants and follow-up.

Source: Macaulay and colleagues, NIHR Journals Library, Public Health Research 14(10), DOI 10.3310/GJPH0909. The report’s full title and methods are available in the evidence links below.`,
'Two-year between-group differences were not statistically significant; longer-term economic results depend on modelling assumptions.');

add('lung-cancer-screening-mobile-scans-england','England','NHS England','2026-05-25',
'NHS lung screening: what the mobile-scan milestone means',
'England’s May 2026 update reported more than 10,000 cancers detected since rollout began. The screening offer targets an assessed higher-risk group.',
[nhs('2026/05/supermarket-scans-spotting-thousands-of-cancers/','2026-05-25')],
`## A cumulative figure, not this year’s diagnoses
NHS England reported 10,678 lung cancers detected through its screening programme since launch. More than three quarters were found at stages one or two. This is a cumulative service total, not the number diagnosed during May 2026.

Mobile units in accessible community locations are part of the approach. The announcement describes checks for current and former smokers aged 55–74, with local teams assessing the appropriate investigation. It is not a walk-up scan for every person passing a supermarket.

## Early detection needs careful wording
Finding cancer earlier is an important aim. However, the proportion found at an early stage is not the same statistic as deaths prevented by the programme. A report about detection should not silently turn one into the other.

The rollout was still expanding at the time of the announcement. National ambition does not confirm whether an individual area has already invited everyone eligible.

## What to do with an invitation
Our suggested first step is to read what the appointment includes and how to confirm attendance. Ask about the location, accessibility, what happens after the initial assessment and how results are communicated.

If smoking history in your GP record is out of date, ask the practice how to correct it. If you are concerned about symptoms, seek clinical assessment rather than waiting for a screening invitation or travelling to a mobile unit without checking.

The practical value of this story is explaining the route and its limits. It should help readers understand a real NHS offer without promising a scan, an all-clear or a particular outcome.`,
'Detection totals do not directly measure deaths prevented or confirm full rollout in every area.');

add('reduce-antidepressant-review-support','UK','NIHR','2025-07',
'Antidepressant reviews: what the UK REDUCE programme teaches',
'The July 2025 research report examined supported discontinuation for selected, well patients. It does not suggest that everyone should stop treatment.',
[s('NIHR — Kendrick and colleagues, DOI 10.3310/BTBL3945','https://www.journalslibrary.nihr.ac.uk/pgfar/BTBL3945','2025-07',2)],
`## The people studied matter
REDUCE involved primary-care practices in England and Wales. The definitive trial included 330 people taking long-term antidepressants who were well, wanted to consider stopping and were not judged at high risk of relapse.

The intervention added tailored online information and telephone support to a medication review. The July 2025 report brings together the programme’s work, including results first published earlier. It should not be presented as a brand-new trial result today.

## Support helped in some ways, not every way
At six months, discontinuation rates did not differ significantly between groups. The additional-support group reported better withdrawal symptoms and mental wellbeing. This distinction matters: a supportive experience and a higher rate of stopping are not the same outcome.

The selected participants are also crucial to interpretation. The results cannot simply be extended to people with current depression, higher relapse risk or other reasons to continue medication.

## A review is a discussion, not a deadline
Our suggested questions are why treatment is continuing, what benefits and difficulties you have noticed, and when another review would be useful. If a change is appropriate, ask how the plan will be individualised and how to contact the prescriber if symptoms change.

Do not abruptly stop or create a taper from this article. The report itself emphasises the distinction between withdrawal and relapse and the role of professional support.

For SHIFT, the useful lesson is that the quality of a medication review matters more than treating discontinuation as a success target. Source: Kendrick and colleagues, Programme Grants for Applied Research 13(7), NIHR Journals Library, DOI 10.3310/BTBL3945.`,
'The selected trial population does not represent everyone taking antidepressants; stopping rates were not significantly different.');

add('transform-prostate-screening-black-men','UK','NIHR','2026-06-04',
'TRANSFORM: better representation in UK prostate screening research',
'Additional funding announced in June 2026 aims to widen Black men’s participation. Expansion is staged, with invitations rather than self-referral.',
[s('NIHR','https://www.nihr.ac.uk/news/ps18-million-boost-expand-prostate-cancer-trial-access-black-men','2026-06-04')],
`## What the funding is intended to do
The NIHR announced up to £18 million in additional funding for the TRANSFORM prostate-screening trial. The aim is to improve representation of Black men while comparing promising screening approaches.

The announcement describes staged expansion. Inviting all eligible Black men aged 45–74 into Stage 2 depends on Stage 1 succeeding. Funding approval is therefore not evidence that every eligible person has already received an invitation.

## The route into the trial
Invitations are sent through GP practices. The NIHR explicitly says men cannot volunteer directly for TRANSFORM. This is different from an open sign-up research registry and from Prostate Progress, which concerns men with current or previous prostate cancer.

A screening trial also does not establish that the tested approach should already become routine national screening. Its purpose is to examine benefits and potential harms before such decisions are made.

## What an invitation should help you understand
Our suggested questions are which tests might be offered, how allocation works, what further investigations could follow and how results will be explained. Ask about the time commitment and the support available when deciding whether to participate.

Better representation is important to the usefulness of the eventual evidence. It should be pursued through clear information and trust, not pressure on an individual to take part.

For a reader worried about prostate symptoms or personal risk now, a trial invitation should not be the only route to a conversation. Discuss those concerns with your healthcare professional. The research announcement is about building future evidence, rather than guaranteeing a test or treatment today.`,
'Stage 2 expansion is conditional, self-referral is not offered and no screening outcome is established by the funding announcement.');

add('scotland-young-people-mental-health-transitions','Scotland','Public Health Scotland','2026-08-25',
'Scotland’s mental-health employment gap after leaving school',
'An August 2026 briefing asks whether positive initial destinations turn into sustained opportunities for young people whose health limits participation.',
[s('Public Health Scotland','https://publichealthscotland.scot/news/2026/august/new-report-examines-young-people-s-health-related-economic-inactivity-in-scotland/','2026-08-25')],
`## Two measures can move in different directions
Public Health Scotland’s August 2026 briefing examines health-related economic inactivity among people aged 16–24. It describes improved initial transitions from school alongside a longer-term rise in inactivity connected with health.

Those findings are not necessarily contradictory. Moving into a job, course or training place at one point and being able to sustain participation later are different questions. The briefing brings together Scotland-specific evidence and stakeholder perspectives.

## Why the Scottish context deserves attention
The report considers inequality, place, access to opportunities and coordination between services. It argues for support that connects health with education, training and employment, including help for employers.

This is a systems briefing, not a clinical trial showing that a particular programme works. It does not diagnose everyone who is outside employment or demonstrate that mental health is the only cause.

## Ask about the handover, not just the destination
Our suggested question for a local support service is who stays involved when someone moves from school into a new setting. If the first placement ends, is there a clear route back to advice, or must the person start again with a different organisation?

For an employer or family member, it may be useful to ask what makes participation sustainable: predictable expectations, manageable travel and a known person to contact. These are practical discussion points, not guaranteed interventions.

This complements the UK charity report on job-seeking experience by examining a different question: the continuity of Scotland’s support across transitions. The distinction keeps a national briefing from becoming another page repeating the same survey percentages.`,
'The briefing does not establish the effectiveness of a particular service or a single cause of economic inactivity.');

const label=date=>date.length===7?new Date(date+'-15T12:00:00Z').toLocaleDateString('en-GB',{month:'long',year:'numeric'}):new Date(date+'T12:00:00Z').toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'});
export const archiveBatch=rows.map(row=>{
 const related={0:1,1:0,2:4,3:20,4:2,5:2,6:2,7:8,8:7,9:8,10:26,11:24,12:19,13:27,14:2,15:22,16:18,17:6,18:16,19:12,20:3,21:25,22:15,23:0,24:11,25:21,26:10,27:13};
 const other=rows[related[rows.indexOf(row)]];
 const relatedMarkdown='\n\n## Related UK reporting\n['+other.headline+'](https://shiftsometimber.co.uk/medicine-news/'+other.slug+')';
 const slug='medicine-news/'+row.slug;
 const dateLabel=label(row.date);
 return {...row,content:{headline:row.headline,standfirst:`UK archive · Original report: ${dateLabel}. ${row.summary}`,what_changed:row.summary,why_it_matters_to_uk:row.implication,known_facts:[{claim:row.fact,source_url:row.evidence[0].url}],unknowns:[row.unknown],safety:'',article_markdown:`**UK archive review · 13 September 2026. Original source: ${dateLabel}.** This article revisits a UK development; it is not a new announcement today.\n\n${row.body}${relatedMarkdown}`,destinations:['medicine_news','knowledge_links','search','sitemap'],seo:{title:row.headline,description:row.summary,slug,canonical:'https://shiftsometimber.co.uk/'+slug,image:'/assets/og-default.jpg',image_alt:'SHIFT Newsroom — UK health reporting',keywords:[row.region,'UK health news'],datePublished:'2026-09-13T00:00:00Z',dateModified:'2026-09-13T00:00:00Z',author:'SHIFT Newsroom',reviewer:'SHIFT Newsroom editorial review',source_url:row.evidence[0].url}}};
});
