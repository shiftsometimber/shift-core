// Source-checked education; editorial review is not clinical review.
import {expansionSources,expansionGuides,expansionAnswers} from './expansion-content.mjs';
const FIRST_RELEASE_KNOWLEDGE = {
  "version": "2026-10-29-v1",
  "checkedAt": "2026-10-29",
  "sources": [
    {
      "id": "S01",
      "title": "NHS: tiredness and fatigue",
      "url": "https://www.nhs.uk/symptoms/tiredness-and-fatigue/",
      "purpose": "General fatigue and routes to a GP.",
      "checked": "2026-10-29",
      "checkedAt": "2026-10-29",
      "reviewState": "source_checked"
    },
    {
      "id": "S02",
      "title": "NHS: the ‘male menopause’",
      "url": "https://www.nhs.uk/conditions/male-menopause/",
      "purpose": "Symptoms, alternative causes and assessment.",
      "checked": "2026-10-29",
      "checkedAt": "2026-10-29",
      "reviewState": "source_checked"
    },
    {
      "id": "S03",
      "title": "Endocrine Society: testosterone therapy guideline",
      "url": "https://www.endocrine.org/clinical-practice-guidelines/testosterone-therapy",
      "purpose": "Diagnosis, repeat testing and fertility-related treatment considerations.",
      "checked": "2026-10-29",
      "checkedAt": "2026-10-29",
      "reviewState": "source_checked"
    },
    {
      "id": "S04",
      "title": "NHS: blood tests",
      "url": "https://www.nhs.uk/tests-and-treatments/blood-tests/",
      "purpose": "Different tests, preparation and discussion of results.",
      "checked": "2026-10-29",
      "checkedAt": "2026-10-29",
      "reviewState": "source_checked"
    },
    {
      "id": "S05",
      "title": "NHS: PSA test",
      "url": "https://www.nhs.uk/tests-and-treatments/psa-test/",
      "purpose": "Benefits, limitations and clinical follow-up.",
      "checked": "2026-10-29",
      "checkedAt": "2026-10-29",
      "reviewState": "source_checked"
    },
    {
      "id": "S06",
      "title": "NHS: low sperm count",
      "url": "https://www.nhs.uk/conditions/low-sperm-count/",
      "purpose": "Semen analysis and when to seek assessment.",
      "checked": "2026-10-29",
      "checkedAt": "2026-10-29",
      "reviewState": "source_checked"
    },
    {
      "id": "S07",
      "title": "NHS: sleep apnoea",
      "url": "https://www.nhs.uk/conditions/sleep-apnoea/",
      "purpose": "Symptoms, assessment and treatment background.",
      "checked": "2026-10-29",
      "checkedAt": "2026-10-29",
      "reviewState": "source_checked"
    },
    {
      "id": "S08",
      "title": "DVLA: excessive sleepiness and fitness to drive",
      "url": "https://www.gov.uk/guidance/miscellaneous-conditions-assessing-fitness-to-drive",
      "purpose": "Current driving safety guidance.",
      "checked": "2026-10-29",
      "checkedAt": "2026-10-29",
      "reviewState": "source_checked"
    },
    {
      "id": "S09",
      "title": "DHSC: food supplements guidance",
      "url": "https://www.gov.uk/government/publications/food-supplements-guidance-for-consumers/food-supplements-guidance",
      "purpose": "Diet, suitability, medicines and claims.",
      "checked": "2026-10-29",
      "checkedAt": "2026-10-29",
      "reviewState": "source_checked"
    },
    {
      "id": "S10",
      "title": "ASA/CAP: sports supplements",
      "url": "https://www.asa.org.uk/advice-online/food-sports-supplements-and-associated-products.html",
      "purpose": "Marketing claims and conditions of use.",
      "checked": "2026-10-29",
      "checkedAt": "2026-10-29",
      "reviewState": "source_checked"
    },
    {
      "id": "S11",
      "title": "Google Search Central: AI features and your website",
      "url": "https://developers.google.com/search/docs/appearance/ai-features",
      "purpose": "Ordinary SEO requirements, useful text, internal links and matching structured data.",
      "checked": "2026-10-29",
      "checkedAt": "2026-10-29",
      "reviewState": "source_checked"
    },
    {
      "id": "S12",
      "title": "SHIFT: male fertility self-test product information",
      "url": "https://shiftsometimber.co.uk/shift-health/testing/male-fertility",
      "purpose": "Scope of the particular proposed kit; primary kit leaflet must be rechecked before product-specific publication.",
      "checked": "2026-10-29",
      "checkedAt": "2026-10-29",
      "reviewState": "source_checked"
    },
    {
      "id": "S13",
      "title": "NHS: diagnosis of infertility",
      "url": "https://www.nhs.uk/conditions/infertility/diagnosis/",
      "checkedAt": "2026-10-29",
      "reviewState": "source_checked"
    },
    {
      "id": "S14",
      "title": "Manchester University NHS Foundation Trust: reference ranges",
      "url": "https://mft.nhs.uk/the-trust/other-departments/laboratory-medicine/biochemistry/reference-ranges/",
      "checkedAt": "2026-10-29",
      "reviewState": "source_checked"
    },
    {
      "id": "S15",
      "title": "NHS: understanding cholesterol levels",
      "url": "https://www.nhs.uk/conditions/high-cholesterol/cholesterol-levels/",
      "checkedAt": "2026-10-29",
      "reviewState": "source_checked"
    },
    {
      "id": "S16",
      "title": "NHS: vitamins and minerals",
      "url": "https://www.nhs.uk/conditions/vitamins-and-minerals/",
      "checkedAt": "2026-10-29",
      "reviewState": "source_checked"
    },
    {
      "id": "S17",
      "title": "NHS: eating a balanced diet",
      "url": "https://www.nhs.uk/live-well/eat-well/how-to-eat-a-balanced-diet/eating-a-balanced-diet/",
      "checkedAt": "2026-10-29",
      "reviewState": "source_checked"
    },
    {
      "id": "S18",
      "title": "NICE NG202: diagnostic tests for sleep apnoea",
      "url": "https://www.nice.org.uk/guidance/ng202/chapter/1-obstructive-sleep-apnoeahypopnoea-syndrome",
      "checkedAt": "2026-10-29",
      "reviewState": "source_checked"
    },
    {
      "id": "S19",
      "title": "University Hospitals Dorset NHS: post-vasectomy semen analysis",
      "url": "https://www.uhd.nhs.uk/services/pathology/andrology/patient-portal",
      "checkedAt": "2026-10-29",
      "reviewState": "source_checked"
    },
    {
      "id": "S20",
      "title": "British Society for Sexual Medicine: testosterone deficiency guideline",
      "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC10307648/",
      "checkedAt": "2026-10-29",
      "reviewState": "source_checked"
    },
    {
      "id": "S21",
      "title": "NICE NG257: investigation of fertility problems",
      "url": "https://www.nice.org.uk/guidance/ng257/chapter/Investigation-of-fertility-problems-and-management-strategies",
      "checkedAt": "2026-10-29",
      "reviewState": "source_checked"
    },
    {
      "id": "S22",
      "title": "North West London Pathology NHS: HbA1c",
      "url": "https://www.nwlpathology.nhs.uk/test/glycated-haemoglobin-hba1c/",
      "checkedAt": "2026-10-29",
      "reviewState": "source_checked"
    }
  ],
  "guides": [
    {
      "id": "T02",
      "topic": "testosterone",
      "title": "TRT and fertility: the conversation to have before treatment",
      "summary": "Understand why plans for children belong in a testosterone assessment, and what to ask before or during treatment.",
      "answer": "Testosterone treatment can reduce sperm production. Tell the clinician about plans for children before starting treatment, including if you are unsure about the future. If you already use TRT, ask your prescriber for advice rather than changing treatment yourself.",
      "answerSources": [
        "S03",
        "S20"
      ],
      "sections": [
        [
          "Why this matters",
          "TRT means testosterone replacement therapy. Its role is to treat an appropriately diagnosed deficiency when a clinician judges treatment suitable. It is not a fertility treatment. The Endocrine Society advises against starting testosterone therapy in men planning fertility in the near term. The British Society for Sexual Medicine also highlights the effect of externally supplied testosterone on sperm production.",
          [
            "S03",
            "S20"
          ]
        ],
        [
          "A testosterone result and a fertility assessment answer different questions",
          "A hormone blood test does not show whether sperm can move normally or what shape they are. A laboratory semen analysis assesses several features of semen. Someone investigating symptoms of low testosterone and someone investigating difficulty conceiving may need different assessments, or a coordinated assessment of both concerns.",
          [
            "S06"
          ]
        ],
        [
          "Before an appointment",
          "Write down what has changed, any previous hormone use, and whether having children matters now, later or possibly in future. Bring a complete list of medicines and supplements. You do not need to arrive knowing which treatment to request. A useful opening is: “I want help with these symptoms, and I also want to understand what any treatment could mean for having children.”",
          []
        ],
        [
          "If you already use TRT",
          "Tell the responsible prescriber about your plans and ask whether fertility-specialist input is appropriate. Do not build a hormone combination, add an online ‘fertility booster’ or copy someone else’s stopping plan. Options depend on the cause of the problem and your circumstances. The clinical team should explain realistic expectations and follow-up.",
          [
            "S20"
          ]
        ],
        [
          "Questions worth taking with you",
          "Ask: What is the assessment trying to establish? How could the options affect sperm production? Would a semen analysis or specialist referral help? Who follows up the results? What would care cost over time? These questions help you compare the whole care arrangement, rather than just the price of testosterone.",
          []
        ]
      ],
      "sources": [
        "S03",
        "S20",
        "S06"
      ],
      "related": [
        "T01",
        "D01",
        "D02"
      ],
      "service": "/shift-health/testosterone-energy",
      "slug": "trt-and-fertility",
      "path": "/guides/trt-and-fertility"
    },
    {
      "id": "B01",
      "topic": "bloods",
      "title": "Blood test results explained: numbers, ranges and context",
      "summary": "Make sense of the report’s labels and prepare useful questions for the professional who arranged your test.",
      "answer": "A result needs to be read alongside the test, units, laboratory range, symptoms and reason for testing. Ask the professional who arranged it to explain what it means for you and what happens next. Ask Timber can explain general terms, but cannot assess your personal report.",
      "answerSources": [
        "S04",
        "S14"
      ],
      "sections": [
        [
          "Start with the question the test was meant to answer",
          "Keep the report together with the reason you had the test. “Could this help investigate persistent tiredness?” is more useful context than a number on its own. A blood test may investigate symptoms, help assess risk or monitor an existing condition; those are different jobs.",
          [
            "S04"
          ]
        ],
        [
          "Read the unit and the laboratory’s own range",
          "A reference range is guidance, not a complete verdict on your health. Manchester University NHS Foundation Trust explains that methods and units vary between laboratories and that the range printed on the report should be used. Age, sampling time and other circumstances may affect interpretation. A result just outside a range is not, by itself, a diagnosis.",
          [
            "S14"
          ]
        ],
        [
          "Comparing results over time",
          "Keep the original date, unit and laboratory details with each result. If two reports look different, ask whether they can be compared directly. Do not silently convert a unit, remove a laboratory comment or assume the same name means the same method. A simple record can help the results conversation without turning you into your own laboratory interpreter.",
          []
        ],
        [
          "If the report leaves you unsure",
          "Ask who is responsible for explaining it and when that discussion will happen. If symptoms continue, raise them even when a result appears within range. NHS guidance notes that further tests can sometimes be needed depending on why the blood test was requested.",
          [
            "S04"
          ]
        ],
        [
          "Take these questions to the results conversation",
          "Which results matter to the original concern? Is anything likely to need confirmation or further investigation? Is a repeat needed, and under what preparation instructions? What symptoms should prompt earlier contact? Who should I contact if I have not heard back? Avoid starting supplements or changing medicines solely because a box is highlighted.",
          []
        ]
      ],
      "sources": [
        "S04",
        "S14"
      ],
      "related": [
        "B02",
        "C01",
        "T01"
      ],
      "service": "/shift-health/blood-tests",
      "slug": "blood-test-results-explained",
      "path": "/guides/blood-test-results-explained"
    },
    {
      "id": "B02",
      "topic": "bloods",
      "title": "What do common blood tests actually check?",
      "summary": "A practical introduction to blood sugar, cholesterol, blood count, thyroid and other common test names.",
      "answer": "Different blood tests measure different things. A useful panel answers a defined question; it does not check every possible cause of symptoms. Start with what is being investigated, then ask what each included marker adds and who will explain the result.",
      "answerSources": [
        "S04"
      ],
      "sections": [
        [
          "Blood sugar: glucose and HbA1c",
          "Blood glucose measures glucose in a blood sample. HbA1c is a different measurement, used in the diagnosis and monitoring of diabetes in appropriate circumstances. It reflects glucose exposure over the life of red blood cells, so it is not interchangeable with a current glucose reading. Some conditions affect its interpretation.",
          [
            "S04",
            "S22"
          ]
        ],
        [
          "Cholesterol: look beyond the headline number",
          "A cholesterol test may report total cholesterol and separate measures such as HDL and non-HDL. Your GP considers the results alongside factors including blood pressure, age and existing health conditions. A home indicator of total cholesterol does not provide the same information as a fuller lipid profile.",
          [
            "S15"
          ]
        ],
        [
          "Blood count, thyroid and the rest of the panel",
          "A full blood count looks at blood cells. TSH is used in thyroid assessment. Other panels examine substances relevant to kidney or liver assessment. These names describe different investigations; no one of them is a universal explanation for low energy or weight change.",
          [
            "S04"
          ]
        ],
        [
          "Vitamins, minerals and hormones",
          "A vitamin, iron-storage or testosterone measurement is a focused question, not a complete health assessment. Ask exactly which marker is included. ‘Iron’, ‘thyroid’ and ‘hormones’ can be shorthand for different products, sample methods and reporting arrangements. Read the actual panel list rather than relying on the bundle name.",
          []
        ],
        [
          "Choosing something useful",
          "Before paying, ask what the panel covers, what it leaves out, whether the sample method is suitable and whether professional interpretation is included. A larger panel may collect more information without being more appropriate for your concern. If you have symptoms, speak with a healthcare professional about assessment rather than using the number of markers as your decision rule.",
          []
        ],
        [
          "What this means within SHIFT",
          "SHIFT’s broader blood-panel information and its focused home/laboratory-test range are separate descriptions. Their collection methods, service arrangements and availability may differ. Use the current service page for those facts. A guide does not mean that a test is available to order today.",
          []
        ]
      ],
      "sources": [
        "S04",
        "S15",
        "S22"
      ],
      "related": [
        "B01",
        "C01"
      ],
      "service": "/shift-health/blood-tests",
      "slug": "common-blood-tests-explained",
      "path": "/guides/common-blood-tests-explained"
    },
    {
      "id": "C01",
      "topic": "testing",
      "title": "Home self-test, home sample or clinic test: what is the difference?",
      "summary": "Understand where a sample is taken, where it is analysed and who helps you understand the result.",
      "answer": "‘Home’ can mean collecting a sample at home or running and reading a self-test there. A home-collected sample can still be analysed in a laboratory. Check the specific test’s method, what it measures and what professional follow-up is included.",
      "answerSources": [],
      "sections": [
        [
          "A self-test you run and read",
          "With a home self-test, you carry out the test and read it using that product’s instructions. The result might be a band, indicator or other limited output rather than a full laboratory report. Different tests use different sample types and reading methods. Use the leaflet supplied with the exact kit, rather than instructions for a similar-looking product.",
          []
        ],
        [
          "A sample collected at home for a laboratory",
          "With a home-sampling service, you collect the requested sample and return it for analysis. ‘Collected at home’ describes the collection location; it does not mean you read the result yourself. Ask how the sample is returned, how you receive the report and whether a clinical conversation is included.",
          []
        ],
        [
          "A professionally collected sample",
          "A professional may take a blood sample in a clinic or another agreed setting. NHS blood-test information describes samples commonly taken from the arm, with finger-prick collection used for some tests. Suitability depends on the investigation and service. Do not assume that every panel supports every collection method.",
          [
            "S04"
          ]
        ],
        [
          "The questions that matter before buying",
          "What exact marker or condition is this test intended to investigate? Is it suitable for someone with my concern? What preparation does this kit require? Who handles an insufficient or invalid sample? Is a repeat included? Who explains an unexpected result? What is the total price, including collection, delivery and follow-up?",
          []
        ],
        [
          "If symptoms are the reason you are looking",
          "A product comparison is not a clinical assessment. Persistent or worrying symptoms deserve a healthcare conversation, even after an apparently reassuring home result. If a result concerns you, take the report and instructions to the appropriate healthcare professional. Buying another kit is not automatically the next step.",
          []
        ],
        [
          "How SHIFT describes the options",
          "The Testing & Wellbeing page separates self-tests from home-collected laboratory tests. The broader SHIFT Bloods pages describe proposed panels and collection options. Check those current pages for availability. Reading this guide does not arrange a sample, create a clinical review or book an appointment.",
          []
        ]
      ],
      "sources": [
        "S04"
      ],
      "serviceSources": [
        [
          "SHIFT: Testing & Wellbeing",
          "https://shiftsometimber.co.uk/shift-health/testing"
        ],
        [
          "SHIFT: Bloods",
          "https://shiftsometimber.co.uk/shift-health/blood-tests"
        ]
      ],
      "related": [
        "B01",
        "B02",
        "D02"
      ],
      "service": "/shift-health/testing",
      "slug": "home-tests-and-laboratory-tests",
      "path": "/guides/home-tests-and-laboratory-tests"
    },
    {
      "id": "C02",
      "topic": "testing",
      "title": "PSA tests explained: benefits, limits and next steps",
      "summary": "Understand what prostate-specific antigen testing can add, and why the results need a clinical conversation.",
      "answer": "A high PSA result does not by itself mean prostate cancer. Other prostate conditions can raise it, and testing has benefits and limitations. Discuss whether testing is appropriate and what any result means with your GP or the clinician arranging it.",
      "answerSources": [
        "S05"
      ],
      "sections": [
        [
          "What is PSA?",
          "PSA stands for prostate-specific antigen. A PSA blood test measures this marker and can help investigate prostate conditions. It is one part of an assessment, rather than a stand-alone cancer diagnosis. NHS guidance recommends discussing the benefits and risks with a GP when deciding whether to have a test.",
          [
            "S05"
          ]
        ],
        [
          "Why a higher result needs explaining",
          "The NHS notes that a high PSA can occur for reasons other than cancer, including an enlarged prostate. Further assessment may be needed, sometimes beginning with another test. The correct next step depends on your history and the clinical assessment; a number alone does not decide it.",
          [
            "S05"
          ]
        ],
        [
          "A home indicator and a laboratory measurement",
          "The proposed SHIFT range describes both a rapid prostate-health self-test and a laboratory PSA option. Check the actual method and output on the product page. Do not treat a threshold indicator as though it were a complete laboratory result, or assume a private kit includes a consultation.",
          []
        ],
        [
          "Preparation is part of a useful test",
          "Read the current instructions and ask the clinician what applies to your test. NHS PSA guidance explains that factors including a urinary infection and some recent activities can affect the result. Do not guess a preparation rule from a different blood test.",
          [
            "S05"
          ]
        ],
        [
          "Useful questions for the appointment",
          "Why might PSA testing help in my circumstances? What are the possible downsides of testing? How will the result be interpreted? Who will contact me, and when? If further assessment is needed, who arranges it? These questions are useful whether you are using an NHS or private route.",
          []
        ],
        [
          "If you are concerned about symptoms",
          "Tell your GP about urinary changes, blood in your urine or other new concerns; do not wait for a kit to become available. A home result should not become a reason to put off that conversation. The purpose of information is to make the assessment easier to understand, not to replace it.",
          [
            "S05"
          ]
        ]
      ],
      "sources": [
        "S05"
      ],
      "related": [
        "C01",
        "B01"
      ],
      "service": "/shift-health/testing",
      "slug": "psa-tests-explained",
      "path": "/guides/psa-tests-explained"
    },
    {
      "id": "D01",
      "topic": "fertility",
      "title": "Male fertility: where to start and when to ask for help",
      "summary": "Understand the assessment, the limits of home tests and how to prepare for a useful conversation.",
      "answer": "Fertility assessment can involve both partners. If you are having difficulty conceiving, a GP can discuss your history and arrange appropriate investigations. A home sperm-concentration result is one piece of information, rather than a replacement for that assessment.",
      "answerSources": [
        "S13",
        "S06"
      ],
      "sections": [
        [
          "When to start the conversation",
          "NHS advice is to seek help after a year of regular sex without contraception without conceiving. Ask sooner if the partner trying to become pregnant is 36 or over, or there is another concern, such as previous cancer treatment or a possible STI. You can ask for an initial conversation without deciding which test to buy.",
          [
            "S06",
            "S13"
          ]
        ],
        [
          "What the GP may ask",
          "Expect questions about how long you have been trying, medical history, medicines, previous contraception and any difficulty with sex. Both partners matter in the assessment. Bring a list of prescribed medicines, supplements and past hormone or anabolic steroid use. An awkward conversation can still be a useful one; you do not need perfect medical words.",
          [
            "S13"
          ]
        ],
        [
          "What a semen analysis can add",
          "The NHS describes semen analysis as the main test for investigating low sperm count. It looks at sperm amount, movement and shape. A testosterone blood test answers a different question. A finding that needs confirmation may lead to a repeat or specialist assessment; your clinical team explains the plan.",
          [
            "S06"
          ]
        ],
        [
          "A home check has a narrower job",
          "The concentration-only kit described on SHIFT’s product page does not assess all the features of semen analysis. It cannot tell you whether a pregnancy will happen or assess a partner’s fertility. If you are already concerned about conceiving, the useful next step may be assessment rather than a purchase.",
          []
        ],
        [
          "Take a short set of notes",
          "Write down when you started trying, any earlier pregnancies or fertility assessments you want to mention, relevant treatment and the questions you want answered. Ask who will arrange the next investigation, how the result will reach you and what happens if you need another appointment. Keep the plan simple enough that both of you know the next step.",
          []
        ],
        [
          "Keep the wider support around you",
          "Trying for a baby can take up a lot of headspace. You can ask for support with the emotional or relationship side as well as the investigations. Free My Timber information and Good to Talk do not depend on buying a test. Neither replaces a fertility service.",
          []
        ]
      ],
      "sources": [
        "S13",
        "S06"
      ],
      "related": [
        "D02",
        "T02",
        "C01"
      ],
      "service": "/shift-health/testing/male-fertility",
      "slug": "male-fertility-where-to-start",
      "path": "/guides/male-fertility-where-to-start"
    },
    {
      "id": "D02",
      "topic": "fertility",
      "title": "Can a home sperm test tell me whether I am fertile?",
      "summary": "Understand a concentration-only kit, full semen analysis and why a reassuring result cannot settle the whole question.",
      "answer": "The concentration-only kit described by SHIFT checks one part of the picture. It does not assess sperm movement or shape, guarantee pregnancy or provide post-vasectomy clearance. If you are having difficulty conceiving, discuss a full assessment with your GP.",
      "answerSources": [
        "S12",
        "S06",
        "S19"
      ],
      "sections": [
        [
          "Start with what the particular kit measures",
          "Some products called ‘male fertility tests’ have a limited purpose. The kit described by SHIFT measures sperm concentration: the amount of sperm within a volume of semen. Its product description does not claim to assess movement or shape. Read the exact kit information rather than assuming every home product measures the same things.",
          [
            "S12"
          ]
        ],
        [
          "How full semen analysis differs",
          "NHS information describes semen analysis as assessing sperm amount, movement and shape. NICE guidance gives separate measures for several aspects of semen, and notes that its reference values apply to the specified laboratory methods. A threshold result from a particular self-test is not interchangeable with that assessment.",
          [
            "S06",
            "S21"
          ]
        ],
        [
          "What a result cannot promise",
          "A result within a kit’s expected concentration band cannot guarantee a pregnancy. A low result does not mean natural conception is impossible. The NHS explains that pregnancy may still be possible with a low sperm count, and that assessment and treatment options can help. Follow-up depends on the wider circumstances.",
          [
            "S06"
          ]
        ],
        [
          "After a vasectomy, use the correct follow-up",
          "A general sperm-concentration kit is not a substitute for the semen testing arranged after a vasectomy. NHS laboratory guidance describes a specific follow-up process, with the clinician communicating the result and any repeat required. Continue to follow the vasectomy service’s contraception advice until it has given you clearance.",
          [
            "S19"
          ]
        ],
        [
          "Before using a kit",
          "Check the intended use, sample-preparation rules, reading window and what an unclear result means. Follow the supplied leaflet. Tell a healthcare professional about concerns rather than delaying assessment while repeating home checks. A product page can explain a kit’s scope; it cannot assess you or your partner.",
          []
        ],
        [
          "Questions that make a purchase decision clearer",
          "Would this result change the next useful step? Is a full assessment already appropriate? What does this kit leave out? Is professional interpretation included? Could the kit create reassurance about something it has not measured? You are allowed to decide that a GP conversation is the better starting point.",
          []
        ]
      ],
      "sources": [
        "S12",
        "S06",
        "S21",
        "S19"
      ],
      "related": [
        "D01",
        "T02",
        "C01"
      ],
      "service": "/shift-health/testing/male-fertility",
      "slug": "home-sperm-tests-explained",
      "path": "/guides/home-sperm-tests-explained"
    },
    {
      "id": "E02",
      "topic": "sleep",
      "title": "What happens during a home sleep assessment?",
      "summary": "Understand how a clinical sleep study differs from a questionnaire or consumer sleep score.",
      "answer": "A sleep service may arrange equipment to record breathing and other measurements overnight, often at home. The service explains how to use it, interprets the recording and discusses next steps. A questionnaire or wearable sleep score cannot replace the appropriate diagnostic assessment.",
      "answerSources": [
        "S07",
        "S18"
      ],
      "sections": [
        [
          "The assessment starts with your experience",
          "Tell the GP about breathing pauses, gasping, snoring, unrefreshing sleep and daytime tiredness. If someone has witnessed symptoms, their observations can help the conversation. NHS guidance recommends a GP assessment for the main symptoms of sleep apnoea; you do not need to buy a gadget first.",
          [
            "S07"
          ]
        ],
        [
          "What the home study is for",
          "NICE recommends home respiratory polygraphy for suspected obstructive sleep apnoea. Other investigations may be used when that is impractical or additional information is needed. The study helps the clinical service establish whether sleep apnoea is present and how severe it is. It is not simply a score for how ‘well’ you slept.",
          [
            "S18"
          ]
        ],
        [
          "What the night may involve",
          "The NHS describes overnight devices checking measurements such as breathing and heartbeat. The service should explain how to fit and return its particular equipment. Follow those instructions and ask what to do if a sensor comes loose or the recording fails. Do not substitute instructions from a different device or claim a consumer wearable is the same test.",
          [
            "S07"
          ]
        ],
        [
          "What happens after the recording",
          "Ask who analyses the study, how the result is explained and who handles follow-up. NICE recommends considering further investigation where symptoms continue despite a negative result from some initial tests. An apparently reassuring recording should therefore be discussed in the context of continuing symptoms.",
          [
            "S18"
          ]
        ],
        [
          "Driving and safety cannot wait for the result",
          "If excessive sleepiness affects or is likely to affect driving, do not drive and seek medical advice. The DVLA has specific rules about sleepiness and sleep apnoea. Tell the assessing service about safety-critical work and near misses. Do not rely on coffee or a normal wearable score to make driving safe.",
          [
            "S08"
          ]
        ],
        [
          "Before paying for any private route",
          "Ask what assessment is included, who is responsible for interpretation, what happens after an inconclusive recording and whether treatment and follow-up cost extra. SHIFT’s service page describes its current availability. This guide does not create a booking, promise a provider or provide clinical monitoring in My Timber.",
          []
        ]
      ],
      "sources": [
        "S07",
        "S18",
        "S08"
      ],
      "related": [
        "E01",
        "T01"
      ],
      "service": "/shift-health/sleep-apnoea",
      "slug": "home-sleep-assessment",
      "path": "/guides/home-sleep-assessment"
    },
    {
      "id": "F01",
      "topic": "supplements",
      "title": "Do I actually need supplements?",
      "summary": "Start with the job you need help with, then consider food, evidence, suitability and cost.",
      "answer": "Supplements are optional extras, not an automatic requirement for using My Timber or taking weight-management medicine. Start with food and your circumstances. Some people need particular nutrients or advice; a qualified professional can help when illness, medicines or poor intake make the decision more complicated.",
      "answerSources": [
        "S09",
        "S16"
      ],
      "sections": [
        [
          "Give the product a job before giving it your money",
          "A practical gap is easier to assess than a vague promise to ‘optimise’ everything. Are you looking for a convenient snack, trying to understand a nutrient recommendation, or concerned that you are not eating enough? Those questions need different kinds of help. A product earns its place by fitting a defined need, not by appearing in a large bundle.",
          []
        ],
        [
          "Food is the starting point",
          "NHS information says most people should get the nutrients they need through a varied, balanced diet, although some people need extra supplements. Meals also provide more than the isolated nutrient on a capsule label. Start by considering the food you can actually obtain, prepare and eat, rather than treating supplements as a replacement for meals.",
          [
            "S16",
            "S17"
          ]
        ],
        [
          "Different products do different things",
          "A protein powder is a food option; a vitamin capsule provides particular nutrients. A branded ‘sleep’ or ‘energy’ product needs its ingredients and claims checked rather than being treated as a category of treatment. The purpose, formulation and quantity matter more than a dramatic name on the front.",
          []
        ],
        [
          "When advice is useful",
          "Government guidance recommends checking with a healthcare professional when you have a condition or take regular prescribed medicines. Tell them what you already take, including other supplements. A label and your own medicine list are more useful than asking whether ‘vitamins’ in general are safe.",
          [
            "S09"
          ]
        ],
        [
          "If treatment has changed your eating",
          "Ask your prescriber for advice if medicine effects are making eating difficult or you feel unwell. Buying a supplement does not resolve the clinical question. Use practical food support alongside that conversation where appropriate. Taking weight-management treatment does not automatically create a need to buy something extra from SHIFT.",
          []
        ],
        [
          "A sensible decision can be ‘not today’",
          "Check the total price, serving count, ingredients, warnings and overlap with other products. If the benefit is unclear, you can leave it. My Timber’s food planning, movement and check-ins remain available without a supplement purchase. A test result and a supplement purchase should be separate decisions, with professional advice where needed.",
          []
        ]
      ],
      "sources": [
        "S09",
        "S16",
        "S17"
      ],
      "related": [
        "F02"
      ],
      "service": "/shift-health/supplements-nutrition",
      "slug": "do-i-need-supplements",
      "path": "/guides/do-i-need-supplements"
    },
    {
      "id": "F02",
      "topic": "supplements",
      "title": "Before you buy a supplement: labels, overlap and claims",
      "summary": "Compare what is in the pack, what a serving means and whether the claims deserve your money.",
      "answer": "Compare the amount per stated daily serving, ingredients, warnings, overlap and full cost. Check with a pharmacist or clinician about suitability alongside medicines or health conditions. Food supplements should not be presented as treatments for disease.",
      "answerSources": [
        "S09",
        "S10"
      ],
      "sections": [
        [
          "Read the serving, not just the biggest number",
          "A large quantity on the front may describe the whole pack, an ingredient blend or several capsules. Find the daily-serving instructions and the amount of each relevant ingredient in that serving. Compare equivalent quantities. A bigger tub is not automatically better value if its servings or formulation differ.",
          []
        ],
        [
          "Keep the units straight",
          "NHS information distinguishes milligrams, micrograms and international units. A milligram is 1,000 micrograms; IU conversions depend on the vitamin. Do not compare numbers without checking the unit, and do not use a guessed conversion to decide your dose.",
          [
            "S16"
          ]
        ],
        [
          "Check what is already in your cupboard",
          "Put the labels of your existing products beside the proposed one. A multivitamin and another blend may contain the same nutrients. Share the complete list with a pharmacist or clinician if you need advice about suitability. Government guidance warns against taking more than recommended and highlights the need for advice with prescribed medicines or medical conditions.",
          [
            "S09"
          ]
        ],
        [
          "Look behind the promise",
          "ASA guidance says health claims for food and supplements must use permitted claims and meet their conditions of use. A general promise about wellbeing still needs appropriate support. A permitted claim about an ingredient does not prove that the whole product will treat a symptom or produce a particular result for you.",
          [
            "S10"
          ]
        ],
        [
          "Turn price into something comparable",
          "Calculate the number of stated daily servings, then compare the total delivered cost for that period. Check allergens, ingredients you want to avoid, the format and whether you would actually use it. Convenience and taste can matter, but they are different from evidence of a health benefit.",
          []
        ],
        [
          "A short buying checklist",
          "Can I explain what this product is for? Do I know what is in one daily serving? Have I checked warnings and overlap? Does the claim match the evidence? Do I understand the total cost? If a symptom or test result is driving the decision, have I had the right professional conversation first? You do not need a full shelf of products to make progress.",
          []
        ]
      ],
      "sources": [
        "S09",
        "S10",
        "S16"
      ],
      "related": [
        "F01"
      ],
      "service": "/shift-health/supplements-nutrition",
      "slug": "how-to-compare-supplements",
      "path": "/guides/how-to-compare-supplements"
    }
  ],
  "existing": [
    {
      "id": "T01",
      "topic": "testosterone",
      "title": "Low testosterone symptoms: what else could explain them?",
      "summary": "Symptoms, other explanations and preparing for a proper assessment.",
      "path": "/shift-health/low-testosterone-symptoms"
    },
    {
      "id": "E01",
      "topic": "sleep",
      "title": "Snoring, sleep apnoea and weight: when to ask for help",
      "summary": "Breathing pauses, daytime tiredness and the assessment route.",
      "path": "/articles/sleep-apnoea-weight-men"
    },
    {
      "id": "T03",
      "topic": "testosterone",
      "title": "Testosterone blood tests: preparation and results",
      "summary": "Morning samples, repeat testing, total and free testosterone.",
      "path": "/shift-health/testosterone-blood-tests"
    },
    {
      "id": "T04",
      "topic": "testosterone",
      "title": "TRT explained: assessment, benefits, risks and follow-up",
      "summary": "Understand treatment and the care that belongs around it.",
      "path": "/shift-health/trt-explained"
    },
    {
      "id": "T06",
      "topic": "testosterone",
      "title": "Private TRT costs: compare the whole care arrangement",
      "summary": "Testing, appointments, medication and ongoing care.",
      "path": "/shift-health/trt-costs-uk"
    },
    {
      "id": "T07",
      "topic": "testosterone",
      "title": "Weight and testosterone in men",
      "summary": "Understand the connection without assuming hormones explain every change.",
      "path": "/articles/testosterone-weight-men"
    },
    {
      "id": "B04",
      "topic": "bloods",
      "title": "Cholesterol for blokes: the basics",
      "summary": "Cholesterol and its place in the wider heart-health picture.",
      "path": "/articles/cholesterol-men"
    },
    {
      "id": "F03",
      "topic": "supplements",
      "title": "Protein for men managing their weight",
      "summary": "Practical food choices, fullness and muscle.",
      "path": "/articles/protein-for-men-weight-management"
    }
  ],
  "topics": [
    {
      "id": "testosterone",
      "name": "Testosterone & energy",
      "intro": "Understand symptoms, testing, TRT and the care around it.",
      "health": "/shift-health/testosterone-energy"
    },
    {
      "id": "bloods",
      "name": "Bloods & understanding results",
      "intro": "Understand what is being checked, why it matters and what comes next.",
      "health": "/shift-health/blood-tests"
    },
    {
      "id": "testing",
      "name": "Home & laboratory testing",
      "intro": "Compare the methods, prepare properly and understand the limits.",
      "health": "/shift-health/testing"
    },
    {
      "id": "fertility",
      "name": "Fertility & planning a family",
      "intro": "A clearer starting point for questions about sperm, testing and getting help.",
      "health": "/shift-health/fertility"
    },
    {
      "id": "sleep",
      "name": "Sleep & snoring",
      "intro": "From a better routine to understanding when proper assessment matters.",
      "health": "/shift-health/sleep-apnoea"
    },
    {
      "id": "supplements",
      "name": "Supplements & nutrition",
      "intro": "Food first. Understand the ingredients, evidence and cost before choosing extras.",
      "health": "/shift-health/supplements-nutrition"
    }
  ],
  "answers": [
    {
      "id": "T01",
      "question": "I’m always shattered. Does that mean low testosterone?",
      "answer": "Tiredness has several possible causes, including sleep problems, stress, medicines and other health conditions. It does not establish low testosterone. If it has lasted a few weeks or affects everyday life, book a GP appointment. Note what changed and when.",
      "sources": [
        "S01",
        "S02"
      ],
      "next": "Read the existing low-testosterone symptoms guide, or prepare notes for your GP.",
      "live": "https://shiftsometimber.co.uk/shift-health/low-testosterone-symptoms",
      "status": "source_checked",
      "eligible_for_retrieval": false,
      "path": "/shift-health/low-testosterone-symptoms"
    },
    {
      "id": "T02",
      "question": "Could TRT affect having children?",
      "answer": "Testosterone treatment can reduce sperm production. Tell the clinician about plans for children before treatment, including if you are unsure about the future. If you already use TRT and want children, speak to your prescriber about appropriate assessment and options.",
      "sources": [
        "S03",
        "S20"
      ],
      "next": "Read the fertility section in the existing TRT guide and add family plans to your appointment notes.",
      "live": "https://shiftsometimber.co.uk/shift-health/trt-explained",
      "status": "source_checked",
      "eligible_for_retrieval": false,
      "path": "/guides/trt-and-fertility"
    },
    {
      "id": "B01",
      "question": "Can you tell me whether my blood results are OK?",
      "answer": "I can explain general test terms, but a clinician needs to interpret your results alongside your symptoms and history. Ask the professional who arranged the test to explain the report and next steps. You do not need to paste personal results here.",
      "sources": [
        "S04"
      ],
      "next": "Use the general results explainer once published; contact the professional who arranged your test.",
      "live": null,
      "status": "source_checked",
      "eligible_for_retrieval": false,
      "path": "/guides/blood-test-results-explained"
    },
    {
      "id": "B02",
      "question": "Does a blood test check everything?",
      "answer": "Different blood tests measure different things. The useful test depends on the question, your symptoms, conditions and medicines. Ask what is being checked and who will explain the result. More markers do not automatically make a panel the right choice.",
      "sources": [
        "S04"
      ],
      "next": "Compare the published panel descriptions for information, or ask your GP which assessment is appropriate.",
      "live": "https://shiftsometimber.co.uk/shift-health/blood-tests",
      "status": "source_checked",
      "eligible_for_retrieval": false,
      "path": "/guides/common-blood-tests-explained"
    },
    {
      "id": "C01",
      "question": "Is a home blood test the same as a lab test?",
      "answer": "‘Home’ can describe where you collect a sample or where you read a result. Some kits are self-tests; others need a sample returned to a laboratory. Check the particular product’s method, what it measures and who explains the result.",
      "sources": [],
      "next": "Read the published explanation of home self-tests and laboratory tests.",
      "live": "https://shiftsometimber.co.uk/shift-health/testing",
      "internal_evidence": "Published SHIFT Testing & Wellbeing guide reviewed 29 October 2026. Recheck the exact kit instructions before product-specific answers.",
      "status": "source_checked",
      "eligible_for_retrieval": false,
      "path": "/guides/home-tests-and-laboratory-tests"
    },
    {
      "id": "C02",
      "question": "Does a high PSA mean prostate cancer?",
      "answer": "A high PSA result does not by itself mean cancer; other prostate conditions can raise it. Discuss the result with your GP or the clinician who arranged the test. They can explain whether further assessment is needed.",
      "sources": [
        "S05"
      ],
      "next": "Discuss benefits, limitations and follow-up with your GP; a home kit does not replace that conversation.",
      "live": null,
      "status": "source_checked",
      "eligible_for_retrieval": false,
      "path": "/guides/psa-tests-explained"
    },
    {
      "id": "D01",
      "question": "We’re trying for a baby. When should we ask for help?",
      "answer": "NHS advice is to see a GP after a year of regular sex without contraception without conceiving. Ask sooner if your partner is 36 or over, or there is a known fertility concern. Assessment can involve both partners; a home test should not delay that conversation.",
      "sources": [
        "S13",
        "S06"
      ],
      "next": "Read NHS fertility advice and prepare questions for the GP. The final guide must cover circumstances needing earlier assessment.",
      "live": null,
      "status": "source_checked",
      "eligible_for_retrieval": false,
      "path": "/guides/male-fertility-where-to-start"
    },
    {
      "id": "D02",
      "question": "Can a home sperm test prove I’m fertile?",
      "answer": "The concentration-only kit described by SHIFT checks one part of the picture. It does not assess sperm movement or shape. A reassuring result cannot guarantee pregnancy, and this kit is not a post-vasectomy clearance test. Speak to a GP about difficulty conceiving.",
      "sources": [
        "S06",
        "S12"
      ],
      "next": "Read the existing product explanation for its limits, or seek a full fertility assessment.",
      "live": "https://shiftsometimber.co.uk/shift-health/testing/male-fertility",
      "status": "source_checked",
      "eligible_for_retrieval": false,
      "path": "/guides/home-sperm-tests-explained"
    },
    {
      "id": "E01",
      "question": "My partner says I stop breathing in my sleep. What next?",
      "answer": "Breathing pauses, gasping and loud snoring can be signs of sleep apnoea. Arrange a GP assessment; a questionnaire cannot confirm the diagnosis. If sleepiness affects your driving, do not drive and seek medical advice.",
      "sources": [
        "S07",
        "S08"
      ],
      "next": "Read the existing sleep guide and arrange appropriate assessment.",
      "live": "https://shiftsometimber.co.uk/articles/sleep-apnoea-weight-men",
      "status": "source_checked",
      "eligible_for_retrieval": false,
      "path": "/articles/sleep-apnoea-weight-men"
    },
    {
      "id": "E02",
      "question": "What happens in a home sleep assessment?",
      "answer": "A sleep service may arrange equipment to record breathing and other measurements overnight, often at home. The service explains how to use it, interprets the results and discusses next steps. Ask who provides the assessment and follow-up before paying.",
      "sources": [
        "S07",
        "S18"
      ],
      "next": "Read the assessment information. SHIFT’s published route is currently proposed and cannot be booked.",
      "live": "https://shiftsometimber.co.uk/shift-health/sleep-apnoea",
      "status": "source_checked",
      "eligible_for_retrieval": false,
      "path": "/guides/home-sleep-assessment"
    },
    {
      "id": "F01",
      "question": "Do I need supplements because I’m taking weight-management treatment?",
      "answer": "Taking a medicine does not automatically mean you need a supplement. Start with food and your own circumstances. If treatment affects what you can eat or how you feel, speak to your prescriber. Ask a pharmacist or clinician about supplement suitability alongside medicines.",
      "sources": [
        "S09"
      ],
      "next": "Use free food-planning support in My Timber; treatment questions go to your own prescriber.",
      "live": "https://shiftsometimber.co.uk/shift-health/supplements-nutrition",
      "internal_evidence": "The current SHIFT supplements page explicitly states that treatment does not mean supplements are necessary.",
      "status": "source_checked",
      "eligible_for_retrieval": false,
      "path": "/guides/do-i-need-supplements"
    },
    {
      "id": "F02",
      "question": "What should I check before buying a supplement?",
      "answer": "Look at the ingredients, amount per daily serving, warnings and overlap with anything you already take. Check with a pharmacist or clinician if you take medicines or have a condition. Food supplements should not be presented as treatments for disease.",
      "sources": [
        "S09",
        "S10"
      ],
      "next": "Compare the product label and practical purpose before deciding whether it earns a place in your routine.",
      "live": "https://shiftsometimber.co.uk/shift-health/supplements-nutrition",
      "status": "source_checked",
      "eligible_for_retrieval": false,
      "path": "/guides/how-to-compare-supplements"
    }
  ]
};
export const HEALTH_KNOWLEDGE={
 ...FIRST_RELEASE_KNOWLEDGE,
 version:'2026-10-29-v2',
 sources:[...FIRST_RELEASE_KNOWLEDGE.sources,...expansionSources],
 guides:[...FIRST_RELEASE_KNOWLEDGE.guides,...expansionGuides],
 answers:[...FIRST_RELEASE_KNOWLEDGE.answers,...expansionAnswers].map(a=>({
  ...a,status:'source_checked',eligible_for_retrieval:true,
  ...(a.id==='D01'?{next:'Prepare questions for the GP; ask sooner where NHS advice indicates earlier assessment.'}:{}),
  ...(a.id==='E02'?{next:'Ask who provides and interprets the assessment; check the current service page for availability.'}:{})
 }))
};
export const {version,checkedAt,sources,guides,existing,topics,answers}=HEALTH_KNOWLEDGE;
