// Server-visible rendering of the retained SHIFT Health catalogue; no new clinical claims or review dates.
const PRODUCTS = {
  "health-mot": {
    code: "SH-MOT",
    name: "SHIFT Health MOT",
    family: "Home blood test",
    job: "A clearer picture of what is happening under the bonnet.",
    intro:
      "A home blood test covering the markers that matter to your wider health, returned by post and explained in plain English.",
    positives: [
      "Taken at home and returned by post",
      "Brings key health markers into one understandable picture",
      "Creates one useful next step instead of a wall of numbers",
    ],
    negatives: [
      "A blood test is a snapshot, not a guarantee that everything is fine",
      "Some results need follow-up with a clinician or your GP",
      "Home samples occasionally need to be repeated",
    ],
    potential:
      "A useful baseline for your heart, metabolic health, energy and longer-term Journey.",
    for: "Men who want to understand their wider health without starting with a diagnosis.",
    not: "Urgent symptoms or anyone who needs immediate medical care.",
    steps: [
      "Choose the test",
      "Complete the health questions",
      "Receive and return your home kit",
      "See your results and next step in My Timber",
    ],
  },
  "testosterone-energy": {
    code: "SH-TE",
    name: "Testosterone & Energy Check",
    family: "Home blood test",
    job: "Investigate properly. Do not guess.",
    intro:
      "A home testing route for men concerned about energy, mood, strength or sex drive. It investigates the picture; it is not a ticket to TRT.",
    positives: [
      "Looks beyond symptoms and guesswork",
      "Keeps testosterone in the context of sleep, weight and general health",
      "A private, measured first step",
    ],
    negatives: [
      "One testosterone result does not diagnose a condition",
      "Timing and personal context affect interpretation",
      "Testing can lead to repeat tests or further clinical review",
    ],
    potential:
      "Clarity about whether lifestyle support, repeat testing or a proper clinical conversation is the sensible next move.",
    for: "Adult men with persistent energy, libido, mood or strength concerns.",
    not: "Anyone seeking bodybuilding drugs, instant TRT or emergency care.",
    steps: [
      "Read what the panel can and cannot show",
      "Complete the health questions",
      "Take and return the home sample",
      "Receive an explained result and one next step",
    ],
  },
  "blood-pressure-monitor": {
    code: "SH-BP",
    name: "Validated blood pressure monitor",
    family: "Health device",
    job: "Home readings you can trust and actually use.",
    intro:
      "A validated upper-arm monitor selected for reliable home readings, with a simple route into your My Timber health record.",
    positives: [
      "Validated model rather than a random marketplace gadget",
      "Builds a useful trend over time",
      "Connects heart health with weight, waist and lifestyle",
    ],
    negatives: [
      "Poor cuff fit or technique can produce misleading readings",
      "Checking too often can create unnecessary anxiety",
      "It does not diagnose the cause of a high reading",
    ],
    potential:
      "A better record for your own Next Shift and for conversations with a healthcare professional.",
    for: "Men who want consistent home blood-pressure readings.",
    not: "A substitute for urgent assessment when serious symptoms are present.",
    steps: [
      "Choose the correct cuff size",
      "Follow the measurement guide",
      "Record three morning readings",
      "Track the pattern in My Timber",
    ],
  },
  "digital-scales": {
    code: "SH-SCALE",
    name: "Reliable digital scales",
    family: "Journey equipment",
    job: "Boring, dependable weighing. Exactly as it should be.",
    intro:
      "Straightforward scales for consistent weekly tracking through losing, maintaining and coming off treatment.",
    positives: [
      "Simple and consistent",
      "Supports weekly Journey tracking",
      "Works naturally with waist measurement",
    ],
    negatives: [
      "Daily weight naturally moves up and down",
      "Frequent weighing is not helpful for everyone",
      "Consumer body-fat estimates are not clinical measurements",
    ],
    potential: "A calmer view of the trend rather than a daily verdict.",
    for: "Men who want reliable home weight tracking.",
    not: "Anyone for whom weighing is harmful or clinically discouraged.",
    steps: [
      "Place on a firm, level floor",
      "Choose one regular weekly time",
      "Record the reading in My Timber",
      "Follow the trend, not one number",
    ],
  },
  "resistance-bands": {
    code: "SH-BANDS",
    name: "Resistance bands set",
    family: "Movement support",
    job: "An easier way to keep strength in the picture.",
    intro:
      "A practical set of resistance bands linked to simple SHIFT Fit sessions for home, travel and low-barrier strength work.",
    positives: [
      "Compact and accessible",
      "Several resistance levels",
      "Connects directly to guided movement",
    ],
    negatives: [
      "Bands wear and must be checked for damage",
      "Poor technique can cause injury",
      "Not suitable for every existing injury or condition",
    ],
    potential:
      "A realistic first strength habit while losing weight or maintaining progress.",
    for: "Men wanting approachable resistance exercise.",
    not: "Acute injury or where a clinician has advised against resistance work.",
    steps: [
      "Choose a comfortable resistance",
      "Check the band before every use",
      "Open the linked SHIFT Fit session",
      "Record the session in My Timber",
    ],
  },
  "shift-measure": {
    code: "SH-MEASURE",
    name: "The SHIFT Measure",
    family: "SHIFT tool",
    job: "Measure what matters without making it a judgement.",
    intro:
      "A proper waist tape with a direct route into My Timber for waist, weight, blood pressure, energy, sleep and Life Back.",
    positives: [
      "Simple and useful",
      "Makes progress visible beyond the scales",
      "Connects a physical tool to your ongoing Journey",
    ],
    negatives: [
      "Measurement technique must stay consistent",
      "A single measurement is not a health diagnosis",
      "Body measurements can feel difficult for some people",
    ],
    potential:
      "A more rounded view of progress through losing, maintaining and coming off treatment.",
    for: "Anyone who wants waist change included in their health picture.",
    not: "Anyone who would find body measurement unhelpful or distressing.",
    steps: [
      "Follow the respectful measuring guide",
      "Take the measurement consistently",
      "Scan into My Timber",
      "Choose the next useful check-in",
    ],
  },
  "erectile-dysfunction": {
    code: "SH-ED",
    name: "Erection & confidence pathway",
    family: "Men's health",
    job: "Private, proper help without the hard sell.",
    intro:
      "A discreet route to understand erection difficulties, health context and appropriate treatment options.",
    positives: [
      "Starts with the problem, not a pill",
      "Private and straightforward",
      "Considers wider cardiovascular and metabolic signals",
    ],
    negatives: [
      "Treatment is not suitable for everybody",
      "Some symptoms require wider medical investigation",
      "Medicines can interact with other treatments",
    ],
    potential:
      "A safe route from a difficult concern to an appropriate next step.",
    for: "Adult men experiencing persistent erection difficulties or related confidence concerns.",
    not: "Emergency symptoms or purchasing prescription medicine without assessment.",
    steps: [
      "Understand the possible causes",
      "Complete a private assessment",
      "Verify suitability before payment",
      "Follow the agreed care and review route",
    ],
  },
  "hair-loss": {
    code: "SH-HAIR",
    name: "Hair-loss pathway",
    family: "Men's health",
    job: "Understand the change before choosing treatment.",
    intro:
      "A proper route through common patterns, realistic expectations and clinically appropriate options.",
    positives: [
      "Private assessment",
      "Clear expectations",
      "Legitimate options rather than miracle claims",
    ],
    negatives: [
      "Results vary and take time",
      "Some treatments require continued use",
      "Not every form of hair loss responds to standard treatment",
    ],
    potential:
      "A clearer decision about whether treatment, monitoring or medical review makes sense.",
    for: "Adult men concerned about ongoing hair thinning or loss.",
    not: "Sudden, patchy or medically concerning hair loss without appropriate clinical review.",
    steps: [
      "Describe what has changed",
      "Review the likely pattern and red flags",
      "Verify suitability before any treatment",
      "Track progress realistically",
    ],
  },
  "stop-smoking": {
    code: "SH-NRT",
    name: "Stop-smoking pathway",
    family: "Health pathway",
    job: "Proven help for a realistic quit attempt.",
    intro:
      "A practical route through licensed stop-smoking options and behavioural support—without pouches or gimmicks.",
    positives: [
      "Uses established support options",
      "Builds a quit attempt around the individual",
      "Connects treatment with ongoing check-ins",
    ],
    negatives: [
      "Cravings and setbacks still happen",
      "The right option depends on health and smoking pattern",
      "Medicines and nicotine products require correct use",
    ],
    potential:
      "A properly supported quit attempt with progress kept inside My Timber.",
    for: "Adults ready to reduce or stop smoking.",
    not: "A nicotine lifestyle shop or a substitute for urgent medical advice.",
    steps: [
      "Record the current pattern",
      "Choose a realistic quit approach",
      "Verify the appropriate support",
      "Use recurring My Timber check-ins",
    ],
  },
  "sleep-apnoea": {
    code: "SH-SLEEP",
    name: "Sleep & apnoea pathway",
    family: "Specialist pathway",
    job: "Take persistent poor sleep seriously.",
    intro:
      "A structured route for snoring, daytime exhaustion and possible sleep apnoea, with appropriate home assessment where suitable.",
    positives: [
      "Connects sleep with energy, weight and wider health",
      "Starts with recognised symptoms and risk",
      "Creates a route to proper assessment",
    ],
    negatives: [
      "A questionnaire alone cannot diagnose sleep apnoea",
      "Home studies are not suitable for every situation",
      "Serious daytime sleepiness can create immediate safety risks",
    ],
    potential:
      "A clearer route from “always shattered” to appropriate assessment and support.",
    for: "Adults with persistent snoring, unrefreshing sleep or daytime sleepiness.",
    not: "An emergency service or a gadget-led self-diagnosis.",
    steps: [
      "Complete the sleep check-in",
      "Review risks and urgent safety advice",
      "Use the appropriate assessment route",
      "Bring the outcome back into My Timber",
    ],
  },
};
const JOURNEY = {
  "health-mot": [
    "Under the bonnet",
    "Results become a baseline beside weight, waist, sleep and energy.",
    "Review the explained picture and act on the one marker or habit that matters most.",
  ],
  "testosterone-energy": [
    "Live better",
    "Adds energy, sleep, mood and investigation results without turning testosterone into a product pitch.",
    "Discuss the result in context; repeat, refer or work on the relevant Programme priority.",
  ],
  "blood-pressure-monitor": [
    "Under the bonnet",
    "Stores a useful run of readings beside weight, waist and metabolic markers.",
    "Log three properly taken morning readings, then use the appropriate health door if the pattern is high.",
  ],
  "digital-scales": [
    "Lose it → Keep it off",
    "Builds a calm weekly trend across treatment, maintenance and coming off.",
    "Complete one weekly weigh-in and respond to the trend—not a noisy daily change.",
  ],
  "resistance-bands": [
    "Live better",
    "Connects the delivered kit to SHIFT Fit and the aim of keeping strength while weight changes.",
    "Complete one suitable strength session and reflect on how it felt.",
  ],
  "shift-measure": [
    "Lose it → Keep it off",
    "Adds waist change to weight, blood pressure, energy, sleep and Life Back.",
    "Record one consistent waist measurement and choose what progress means beyond the scales.",
  ],
  "erectile-dysfunction": [
    "Sort the other stuff",
    "Keeps the private concern, assessment status and follow-up inside the same trusted relationship.",
    "Complete the private check-in; the next action follows suitability, not an upsell.",
  ],
  "hair-loss": [
    "Sort the other stuff",
    "Records the concern, chosen approach and realistic review point without creating a separate clinic identity.",
    "Capture the starting point and review change at a sensible interval.",
  ],
  "stop-smoking": [
    "Live better",
    "Turns a quit attempt into a continuing Journey with cravings, slips and progress recorded without judgement.",
    "Choose a realistic quit step and complete the next check-in.",
  ],
  "sleep-apnoea": [
    "Under the bonnet",
    "Connects sleep symptoms and assessment outcomes with weight, energy, heart health and daily safety.",
    "Complete the sleep check-in and follow the correct assessment or urgent-safety route.",
  ],
};
const FAQ = {
  "health-mot": [
    [
      "Does it diagnose everything?",
      "No. It provides a structured snapshot. Results, symptoms and medical history still need to be considered together.",
    ],
    [
      "What if a result is outside range?",
      "The result journey explains the appropriate next door, including routine or urgent clinical follow-up where needed.",
    ],
  ],
  "testosterone-energy": [
    [
      "Does a low result mean I need TRT?",
      "No. A result can require context and repeat testing. Treatment is never decided from one number alone.",
    ],
    [
      "Why include energy?",
      "Poor sleep, weight change, stress, nutrition and other health conditions can overlap with symptoms blamed on testosterone.",
    ],
  ],
  "blood-pressure-monitor": [
    [
      "Why upper arm?",
      "The selected product route is built around an independently validated upper-arm model and correct cuff fit.",
    ],
    [
      "How often should I check?",
      "Follow the supplied guidance or advice from your healthcare professional. My Timber encourages a useful pattern, not compulsive checking.",
    ],
  ],
  "digital-scales": [
    [
      "Should I weigh every day?",
      "Not necessarily. SHIFT is designed around a consistent weekly trend unless your care plan says otherwise.",
    ],
    [
      "Does it measure body fat?",
      "Consumer estimates can vary significantly. SHIFT does not present them as clinical truth.",
    ],
  ],
  "resistance-bands": [
    [
      "Is this suitable for beginners?",
      "The route starts conservatively and links to accessible sessions, but existing injuries and conditions still matter.",
    ],
    [
      "What if a band looks damaged?",
      "Stop using it. The safety check comes before every session.",
    ],
  ],
  "shift-measure": [
    [
      "Why measure waist as well as weight?",
      "Waist change can add useful context to the health and progress picture.",
    ],
    [
      "Where is the measurement stored?",
      "It is recorded privately in My Timber as part of your ongoing Journey.",
    ],
  ],
  "erectile-dysfunction": [
    [
      "Why ask wider-health questions?",
      "Erection difficulties can overlap with medicines, cardiovascular health, metabolic health, stress and other factors.",
    ],
    [
      "Can I just choose a tablet?",
      "Suitability is verified first. The product never jumps ahead of the health assessment.",
    ],
  ],
  "hair-loss": [
    [
      "How quickly might things change?",
      "Hair treatments and natural hair cycles take time. The page sets a realistic review point rather than promising a quick transformation.",
    ],
    [
      "Is every type treated the same way?",
      "No. Sudden, patchy or unusual loss can need a different medical route.",
    ],
  ],
  "stop-smoking": [
    [
      "Does a setback mean failure?",
      "No. The Journey records what happened and creates the next manageable step.",
    ],
    [
      "Do you sell nicotine pouches?",
      "No. This route is limited to established, appropriate stop-smoking support.",
    ],
  ],
  "sleep-apnoea": [
    [
      "Can an online questionnaire diagnose apnoea?",
      "No. It can identify signs and guide the appropriate assessment route.",
    ],
    [
      "Why does daytime sleepiness matter?",
      "Severe sleepiness can affect driving and workplace safety, so the Journey includes clear safety guidance.",
    ],
  ],
};
const MEDIA = Object.fromEntries(
  Object.keys(PRODUCTS).map((key) => [key, `/assets/shift-health/${key}.webp`]),
);
const EVIDENCE = {
  "health-mot": [
    [
      "Risk works as a picture",
      "The NHS Health Check combines measurements and questions to estimate cardiovascular risk; no single blood marker tells the whole story.",
      "NHS Health Check",
      "https://www.nhs.uk/conditions/nhs-health-check/what-is-an-nhs-health-check-new/",
    ],
    [
      "Silent problems are real",
      "High blood pressure and early kidney disease can exist without obvious symptoms, which is why appropriate measurement and follow-up matter.",
      "NHS: chronic kidney disease",
      "https://www.nhs.uk/conditions/kidney-disease/",
    ],
  ],
  "testosterone-energy": [
    [
      "Symptoms overlap",
      "The NHS notes that low mood, poor sleep, diet, exercise, alcohol and other health issues can produce symptoms sometimes blamed on a ‘male menopause’.",
      "NHS: the ‘male menopause’",
      "https://www.nhs.uk/conditions/male-menopause/",
    ],
    [
      "One result is not the finish line",
      "A testosterone result needs symptoms, timing, medical history and—where appropriate—confirmation to be interpreted properly.",
      "Society for Endocrinology",
      "https://www.endocrinology.org/clinical-practice/clinical-guidance/",
    ],
  ],
  "blood-pressure-monitor": [
    [
      "Use a proper home series",
      "NICE recommends two consecutive seated measurements, twice daily, for at least 4 days and ideally 7 when home monitoring is used to confirm hypertension.",
      "NICE NG136",
      "https://www.nice.org.uk/guidance/ng136/chapter/recommendations",
    ],
    [
      "Validation matters",
      "The British and Irish Hypertension Society maintains a list of monitors independently validated for accuracy.",
      "BIHS validated monitors",
      "https://bihs.org.uk/bp-monitors/",
    ],
  ],
  "digital-scales": [
    [
      "Follow the trend",
      "Body weight naturally fluctuates. A consistent method and repeatable interval make the trend more useful than reacting to one reading.",
      "NHS Better Health",
      "https://www.nhs.uk/better-health/lose-weight/",
    ],
    [
      "Weight is not the whole picture",
      "NICE recommends considering waist-to-height ratio alongside BMI in adults with BMI below 35 kg/m².",
      "NICE NG246",
      "https://www.nice.org.uk/guidance/ng246/chapter/Recommendations",
    ],
  ],
  "resistance-bands": [
    [
      "Strength belongs in the week",
      "UK Chief Medical Officers advise adults to do activities that develop or maintain strength on at least 2 days each week.",
      "UK physical activity guidelines",
      "https://www.gov.uk/government/publications/physical-activity-guidelines-uk-chief-medical-officers-report",
    ],
    [
      "Start from your actual level",
      "The same guidance stresses building activity gradually and adapting it to ability and health.",
      "UK Chief Medical Officers",
      "https://www.gov.uk/government/publications/physical-activity-guidelines-uk-chief-medical-officers-report",
    ],
  ],
  "shift-measure": [
    [
      "A simple useful target",
      "NICE advises adults to try to keep their waist to less than half their height, while recognising that measurements are part of a wider assessment.",
      "NICE NG246",
      "https://www.nice.org.uk/guidance/ng246/chapter/Recommendations",
    ],
    [
      "Use it with BMI, not instead of everything",
      "Waist-to-height ratio helps estimate central adiposity; it does not diagnose a disease or replace clinical judgement.",
      "NICE NG246",
      "https://www.nice.org.uk/guidance/ng246/chapter/Recommendations",
    ],
  ],
  "erectile-dysfunction": [
    [
      "It can be a wider-health signal",
      "Persistent erection problems can be associated with high blood pressure, high cholesterol, diabetes, anxiety, hormone problems or medicines.",
      "NHS: erection problems",
      "https://www.nhs.uk/conditions/erection-problems-erectile-dysfunction/",
    ],
    [
      "Assessment comes before tablets",
      "Treatment choice depends on the likely cause, other medicines and cardiovascular safety—not simply which tablet is cheapest.",
      "NHS: erection problems",
      "https://www.nhs.uk/conditions/erection-problems-erectile-dysfunction/",
    ],
  ],
  "hair-loss": [
    [
      "Recognised options have limits",
      "The NHS identifies finasteride and minoxidil as the main treatments for male-pattern baldness, but says they do not work for everyone.",
      "NHS: hair loss",
      "https://www.nhs.uk/symptoms/hair-loss/",
    ],
    [
      "Ongoing means ongoing",
      "The NHS states these treatments only work for as long as they are used—important context before anybody starts.",
      "NHS: hair loss",
      "https://www.nhs.uk/symptoms/hair-loss/",
    ],
  ],
  "stop-smoking": [
    [
      "Licensed help, not wellness theatre",
      "NICE NG209 covers behavioural support and licensed stop-smoking interventions, including nicotine replacement therapy.",
      "NICE NG209",
      "https://www.nice.org.uk/guidance/ng209",
    ],
    [
      "Match support to the person",
      "NHS guidance explains that NRT comes in different forms and can be used to manage cravings as part of a quit attempt.",
      "NHS Better Health: NRT",
      "https://www.nhs.uk/better-health/quit-smoking/ready-to-quit-smoking/quit-with-nicotine-replacement-therapies-nrt/",
    ],
  ],
  "sleep-apnoea": [
    [
      "A questionnaire is not a diagnosis",
      "NICE recommends respiratory polygraphy—at home or in hospital—for people with suspected obstructive sleep apnoea/hypopnoea syndrome.",
      "NICE NG202",
      "https://www.nice.org.uk/guidance/ng202/chapter/1-Obstructive-sleep-apnoeahypopnoea-syndrome",
    ],
    [
      "Sleepiness has immediate consequences",
      "NICE assessment considers excessive sleepiness and safety-critical work because untreated symptoms can affect driving and workplace safety.",
      "NICE NG202",
      "https://www.nice.org.uk/guidance/ng202",
    ],
  ],
};
const DETAILS = {
  "health-mot": {
    understand:
      "A joined-up home health check for the markers that commonly sit behind weight, heart and metabolic risk. It is designed to turn a laboratory report into a useful conversation and a sensible next step.",
    included: [
      "A home sample kit with clear collection and return instructions",
      "Core heart, metabolic, liver and kidney context",
      "Results presented in plain English",
      "A record inside My Timber so the result is not lost in an email",
    ],
    choices: [
      "Complete the health questions before sampling",
      "Collect the sample at home and return it as directed",
      "Review each result in context rather than chasing one number",
      "Escalate anything needing clinical attention through the advised route",
    ],
    redFlags:
      "Chest pain, severe breathlessness, fainting, new weakness or confusion need urgent medical help. A postal blood test is never the right first step for acute symptoms.",
    decision:
      "Choose this when you want a broad baseline. Choose the Testosterone & Energy Check when persistent energy, libido or strength concerns are the main question.",
  },
  "testosterone-energy": {
    understand:
      "This is an investigation route, not a shortcut to testosterone treatment. Symptoms overlap with sleep, stress, weight change, medicines and other health conditions, so the result must be read in context.",
    included: [
      "A focused symptom and health check",
      "A home sample route designed around appropriate timing",
      "Testosterone and relevant wider-health context",
      "An explained outcome: review, repeat, refer or work on another priority",
    ],
    choices: [
      "Use the collection window stated in the kit",
      "Declare medicines, supplements and recent illness honestly",
      "Expect confirmation or repeat testing where appropriate",
      "Do not change hormones or medicines from a single result",
    ],
    redFlags:
      "Sudden severe testicular pain, a new testicular lump, severe headache with visual change or acute mental-health risk needs prompt medical assessment—not a routine hormone check.",
    decision:
      "Best for persistent symptoms where testosterone is one possible explanation. It is not designed for bodybuilding, performance enhancement or self-directed TRT.",
  },
  "blood-pressure-monitor": {
    understand:
      "One clinic reading can be distorted by nerves, rushing or poor technique. A validated upper-arm monitor helps build a calmer home pattern that can be shared with a healthcare professional.",
    included: [
      "A validated upper-arm device route",
      "Cuff-fit and positioning guidance",
      "A simple repeat-reading protocol",
      "My Timber logging beside weight, waist and metabolic results",
    ],
    choices: [
      "Check that the cuff range fits your arm",
      "Sit quietly with feet supported before measuring",
      "Use the same arm and similar time for a short series",
      "Record the numbers; do not repeatedly test for reassurance",
    ],
    redFlags:
      "Very high readings with chest pain, breathlessness, weakness, confusion, severe headache or visual symptoms require urgent medical advice. Do not wait for an online response.",
    decision:
      "Choose a monitor for an ongoing home trend. Choose the Health MOT if you also want blood sugar, cholesterol and broader metabolic context.",
  },
  "digital-scales": {
    understand:
      "These are for a consistent weight trend, not a daily scorecard. The useful signal comes from using the same scales, in the same place, at a repeatable time.",
    included: [
      "Straightforward digital weight tracking",
      "Setup and consistent-weighing guidance",
      "Weekly My Journey logging",
      "A view that pairs weight with waist and Life Back progress",
    ],
    choices: [
      "Use a hard, level floor",
      "Pick one repeatable weekly time",
      "Treat short-term movement as normal",
      "Pause weighing if it becomes distressing or clinically unhelpful",
    ],
    redFlags:
      "Rapid unexplained weight change, swelling, severe dehydration symptoms or weight loss with concerning illness symptoms needs healthcare advice rather than more frequent weighing.",
    decision:
      "Choose these for dependable weekly tracking. They do not pretend consumer body-composition estimates are a clinical diagnosis.",
  },
  "resistance-bands": {
    understand:
      "A low-fuss way to keep strength work in the week at home or while travelling. The point is repeatable movement—not turning the spare room into a punishment chamber.",
    included: [
      "A range of useful resistance levels",
      "A pre-use safety check",
      "Beginner-friendly SHIFT Fit session links",
      "Journey prompts that track consistency and confidence",
    ],
    choices: [
      "Start lighter than your ego suggests",
      "Anchor and grip the band securely",
      "Stop if the band is split, perished or damaged",
      "Work around injuries only with appropriate advice",
    ],
    redFlags:
      "Stop with sharp pain, chest pain, dizziness or unusual breathlessness. Acute injury or medical restrictions need professional guidance before resistance exercise.",
    decision:
      "Choose bands when access and convenience are the barrier. They complement walking and general movement; they do not replace rehabilitation for an injury.",
  },
  "shift-measure": {
    understand:
      "Weight is only one part of progress. A consistent waist measurement adds useful context, especially when the scales are noisy or body shape is changing.",
    included: [
      "A purpose-made flexible waist measure",
      "A clear, respectful measuring guide",
      "Direct recording in My Timber",
      "Progress viewed beside weight, blood pressure, energy and Life Back",
    ],
    choices: [
      "Measure at the same anatomical point each time",
      "Keep the tape level and comfortably snug",
      "Use a consistent time and method",
      "Focus on the longer trend, never one reading",
    ],
    redFlags:
      "A tape measure cannot assess abdominal pain, swelling, a new lump or unexplained physical change. Those concerns need healthcare advice.",
    decision:
      "Choose this when you want progress beyond the scales. Pair it with reliable scales for the clearest home trend.",
  },
  "erectile-dysfunction": {
    understand:
      "Erection difficulty is common, but it can be linked to circulation, diabetes, medicines, hormones, stress or relationship factors. A proper route checks the wider picture before discussing treatment.",
    included: [
      "A discreet symptom and health assessment",
      "Checks for medicines, heart risk and important exclusions",
      "Clear explanation of legitimate options",
      "Private follow-up recorded in My Timber",
    ],
    choices: [
      "Describe onset and pattern honestly",
      "List all prescribed, recreational and online medicines",
      "Complete suitability checks before any treatment",
      "Use review rather than silently repeating an option that is not working",
    ],
    redFlags:
      "Chest pain during sex, an erection lasting four hours, penile injury, severe pain or sudden neurological symptoms need urgent medical help.",
    decision:
      "Start here for persistent erection difficulty or related confidence concerns. This is a private health pathway, not a one-click tablet shelf.",
  },
  "hair-loss": {
    understand:
      "Different patterns of hair loss have different causes. The first job is to establish what changed, how quickly and whether the pattern looks typical before weighing up treatment.",
    included: [
      "A structured history of the change",
      "Pattern and red-flag review",
      "Realistic explanation of recognised options",
      "A consistent baseline and sensible review point in My Timber",
    ],
    choices: [
      "Record when it began and how it progressed",
      "Use clear baseline photographs in consistent light",
      "Understand that results take months, not days",
      "Review side effects and ongoing commitment before choosing treatment",
    ],
    redFlags:
      "Sudden, patchy or inflamed hair loss, scalp scarring, systemic illness or hair loss in a child needs appropriate medical assessment rather than a standard online route.",
    decision:
      "Best for adult men with gradual, ongoing thinning. It avoids miracle language and makes the time, limitations and maintenance commitment clear.",
  },
  "stop-smoking": {
    understand:
      "Stopping is easier with a plan that matches how and when you smoke. Licensed nicotine-replacement options can reduce withdrawal while behaviour support deals with the routines around it.",
    included: [
      "A smoking-pattern and readiness check",
      "A route through established stop-smoking options",
      "A realistic quit or reduction plan",
      "Craving, slip and progress check-ins inside My Timber",
    ],
    choices: [
      "Record cigarettes, triggers and first smoke of the day",
      "Choose a realistic start point",
      "Use licensed products exactly as directed",
      "Treat a slip as information for the next step—not proof you failed",
    ],
    redFlags:
      "Chest pain, coughing blood, severe breathlessness or new neurological symptoms need prompt medical attention. Stop-smoking support does not assess acute illness.",
    decision:
      "Choose this for a supported attempt using established routes. SHIFT does not sell nicotine pouches as a lifestyle product.",
  },
  "sleep-apnoea": {
    understand:
      "Loud snoring, pauses in breathing, morning headaches and serious daytime sleepiness can point towards obstructive sleep apnoea. A questionnaire can identify risk; diagnosis needs an appropriate sleep assessment.",
    included: [
      "A structured sleep and risk check",
      "Clear driving and workplace-safety prompts",
      "An appropriate home-assessment route where suitable",
      "Results and follow-up connected to weight, energy and heart health",
    ],
    choices: [
      "Include observations from someone who has seen you sleep, if available",
      "Be honest about drowsy driving or near misses",
      "Complete the recommended assessment rather than buying a sleep gadget",
      "Bring the result back into your ongoing Journey",
    ],
    redFlags:
      "Do not drive if you are dangerously sleepy. Severe breathing difficulty, chest pain, collapse or confusion needs urgent medical help.",
    decision:
      "Choose this when snoring comes with unrefreshing sleep, witnessed pauses or daytime sleepiness. General insomnia without those signs may need a different route.",
  },
};
const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );

export const healthProducts=PRODUCTS;
export const productStyle="[data-shift-health]{\n        --b: #050505;\n        --c: #e7e3da;\n        --g: #707762;\n        --l: #a7af94;\n      }\n[data-shift-health] *{\n        box-sizing: border-box;\n      }\n[data-shift-health]{\n        margin: 0;\n        background: var(--b);\n        color: var(--c);\n        font:\n          16px/1.55 Arial,\n          sans-serif;\n      }\n[data-shift-health] a{\n        color: inherit;\n      }\n[data-shift-health] .wrap{\n        width: min(1160px, calc(100% - 36px));\n        margin: auto;\n      }\n[data-shift-health] .head{\n        border-bottom: 1px solid var(--g);\n      }\n[data-shift-health] .headin{\n        min-height: 72px;\n        display: flex;\n        align-items: center;\n        justify-content: space-between;\n      }\n[data-shift-health] .brand{\n        font-size: 20px;\n        font-weight: 1000;\n        text-decoration: none;\n      }\n[data-shift-health] .brand span,[data-shift-health] small{\n        color: var(--l);\n      }\n[data-shift-health] nav{\n        display: flex;\n        gap: 18px;\n      }\n[data-shift-health] .menuButton,[data-shift-health] .mobileNav{\n        display: none;\n      }\n[data-shift-health] nav a{\n        text-decoration: none;\n        font-weight: 850;\n      }\n[data-shift-health] .back{\n        display: inline-block;\n        margin: 28px 0;\n        text-decoration: none;\n        font-weight: 900;\n      }\n[data-shift-health] .productHero{\n        display: grid;\n        grid-template-columns: 1.35fr 0.65fr;\n        gap: 40px;\n        align-items: center;\n        padding: 35px 0 65px;\n        border-bottom: 1px solid #292c27;\n      }\n[data-shift-health] .productHero h1{\n        margin: 8px 0 15px;\n        font-size: clamp(48px, 7vw, 85px);\n        line-height: 0.94;\n        letter-spacing: -0.05em;\n      }\n[data-shift-health] .job{\n        font-size: clamp(22px, 3vw, 30px);\n        font-weight: 900;\n      }\n[data-shift-health] .productHero p:not(.job){\n        color: #cbc7bd;\n        max-width: 720px;\n      }\n[data-shift-health] .visual{\n        aspect-ratio: 4/5;\n        border-radius: 26px;\n        background: linear-gradient(145deg, #8c947c, #505646);\n        display: flex;\n        flex-direction: column;\n        justify-content: center;\n        align-items: center;\n        color: #050505;\n        box-shadow: 0 30px 70px #000;\n        overflow: hidden;\n        position: relative;\n      }\n[data-shift-health] .visual img{\n        width: 100%;\n        height: 100%;\n        object-fit: cover;\n      }\n[data-shift-health] .visual figcaption{\n        position: absolute;\n        inset: auto 14px 14px;\n        padding: 8px 11px;\n        border-radius: 999px;\n        background: #050505dd;\n        color: var(--c);\n        font-size: 12px;\n        font-style: normal;\n        font-weight: 800;\n      }\n[data-shift-health] .visual b{\n        font-size: clamp(46px, 7vw, 78px);\n        line-height: 0.8;\n      }\n[data-shift-health] .visual span{\n        margin-top: 18px;\n        font-weight: 900;\n      }\n[data-shift-health] .visual em{\n        margin-top: 7px;\n      }\n[data-shift-health] .availability{\n        margin-top: 24px;\n        padding: 17px;\n        border-left: 4px solid var(--l);\n        background: #121410;\n        display: grid;\n      }\n[data-shift-health] .availability span{\n        font-size: 13px;\n        text-transform: uppercase;\n        letter-spacing: 0.1em;\n        color: #bdb9b0;\n      }\n[data-shift-health] .availability strong{\n        font-size: 21px;\n      }\n[data-shift-health] .actions{\n        display: flex;\n        gap: 10px;\n        flex-wrap: wrap;\n        margin-top: 18px;\n      }\n[data-shift-health] .btn{\n        display: inline-flex;\n        align-items: center;\n        justify-content: center;\n        min-height: 48px;\n        padding: 11px 18px;\n        border: 1px solid var(--c);\n        border-radius: 999px;\n        background: var(--c);\n        color: #050505;\n        font-weight: 1000;\n        text-decoration: none;\n      }\n[data-shift-health] .btn.alt{\n        background: transparent;\n        color: var(--c);\n      }\n[data-shift-health] > section,[data-shift-health] > .two{\n        margin: 0 auto;\n        padding: 58px 0;\n        width: min(1160px, calc(100% - 36px));\n      }\n[data-shift-health] .two{\n        display: grid;\n        grid-template-columns: 1fr 1fr;\n        gap: 18px;\n      }\n[data-shift-health] .two article{\n        padding: 25px;\n        border: 1px solid var(--g);\n        border-radius: 20px;\n        background: #11130f;\n      }\n[data-shift-health] .two h2,[data-shift-health] section > h2{\n        font-size: clamp(28px, 4vw, 48px);\n        line-height: 1;\n        margin: 5px 0 20px;\n      }\n[data-shift-health] .two li{\n        margin: 10px 0;\n      }\n[data-shift-health] .potential{\n        border-top: 1px solid #292c27;\n        border-bottom: 1px solid #292c27;\n      }\n[data-shift-health] .steps{\n        display: grid;\n        grid-template-columns: repeat(4, 1fr);\n        gap: 12px;\n        padding: 0;\n        list-style: none;\n      }\n[data-shift-health] .steps li{\n        padding: 18px;\n        border: 1px solid var(--g);\n        border-radius: 18px;\n      }\n[data-shift-health] .steps b{\n        display: block;\n        font-size: 28px;\n        color: var(--l);\n      }\n[data-shift-health] .next{\n        margin-bottom: 65px !important;\n        border-radius: 24px;\n        background: var(--g);\n        color: #050505;\n      }\n[data-shift-health] .next small{\n        color: #171915;\n      }\n[data-shift-health] .next p{\n        max-width: 760px;\n      }\n[data-shift-health] .footer{\n        padding: 35px 0;\n        border-top: 1px solid var(--g);\n      }\n[data-shift-health] .footer nav{\n        flex-wrap: wrap;\n        margin-bottom: 16px;\n      }\n[data-shift-health] .footer p{\n        margin: 0;\n        color: #cbc7bd;\n      }\n@media (max-width: 760px){[data-shift-health] .head nav{\n          display: none;\n        }\n[data-shift-health] .menuButton{\n          display: inline-flex;\n          min-height: 44px;\n          align-items: center;\n          padding: 9px 14px;\n          border: 1px solid var(--g);\n          border-radius: 999px;\n          background: transparent;\n          color: var(--c);\n          font: inherit;\n          font-weight: 900;\n        }\n[data-shift-health] .mobileNav[aria-hidden=\"false\"]{\n          display: grid;\n          gap: 0;\n          padding: 0 18px 16px;\n          border-bottom: 1px solid var(--g);\n          background: var(--b);\n        }\n[data-shift-health] .mobileNav a{\n          min-height: 44px;\n          display: flex;\n          align-items: center;\n          border-bottom: 1px solid #292c27;\n          text-decoration: none;\n          font-weight: 850;\n        }\n[data-shift-health] .productHero,[data-shift-health] .two{\n          grid-template-columns: 1fr;\n        }\n[data-shift-health] .visual{\n          max-width: 330px;\n        }\n[data-shift-health] .steps{\n          grid-template-columns: 1fr 1fr;\n        }\n[data-shift-health] .productHero h1{\n          font-size: 50px;\n        }\n}\n@media (max-width: 420px){[data-shift-health] .wrap,[data-shift-health] > section,[data-shift-health] > .two{\n          width: calc(100% - 28px);\n        }\n[data-shift-health] .actions{\n          display: grid;\n        }\n[data-shift-health] .steps{\n          grid-template-columns: 1fr;\n        }\n[data-shift-health] .btn{\n          width: 100%;\n        }\n}\n[data-shift-health] .journey{\n        border-bottom: 1px solid #292c27;\n      }\n[data-shift-health] .journeyGrid{\n        display: grid;\n        grid-template-columns: 1fr 1fr;\n        gap: 14px;\n      }\n[data-shift-health] .journeyGrid > div{\n        padding: 22px;\n        border-left: 4px solid var(--l);\n        background: #11130f;\n      }\n[data-shift-health] .journeyGrid b{\n        font-size: 19px;\n      }\n[data-shift-health] .faqs{\n        display: grid;\n        gap: 10px;\n      }\n[data-shift-health] .faqs details{\n        padding: 18px;\n        border: 1px solid var(--g);\n        border-radius: 16px;\n        background: #11130f;\n      }\n[data-shift-health] .faqs summary{\n        cursor: pointer;\n        font-weight: 900;\n        font-size: 18px;\n      }\n[data-shift-health] .faqs p{\n        color: #cbc7bd;\n      }\n[data-shift-health] .jump{\n        position: sticky;\n        top: 0;\n        z-index: 8;\n        display: flex;\n        gap: 8px;\n        overflow-x: auto;\n        padding: 12px 0;\n        background: var(--b);\n        border-bottom: 1px solid #292c27;\n      }\n[data-shift-health] .jump a{\n        flex: 0 0 auto;\n        padding: 8px 12px;\n        border: 1px solid var(--g);\n        border-radius: 999px;\n        text-decoration: none;\n        font-size: 14px;\n        font-weight: 900;\n      }\n[data-shift-health] .detailGrid,[data-shift-health] .decisionGrid{\n        display: grid;\n        grid-template-columns: 1fr 1fr;\n        gap: 14px;\n      }\n[data-shift-health] .detailCard,[data-shift-health] .decisionGrid > article{\n        padding: 22px;\n        border: 1px solid var(--g);\n        border-radius: 18px;\n        background: #11130f;\n      }\n[data-shift-health] .detailCard b{\n        font-size: 19px;\n      }\n[data-shift-health] .sectionCopy{\n        max-width: 780px;\n        color: #cbc7bd;\n        font-size: 18px;\n      }\n[data-shift-health] .detailGrid ul,[data-shift-health] .decisionGrid ul{\n        padding-left: 20px;\n      }\n[data-shift-health] .detailGrid li,[data-shift-health] .decisionGrid li{\n        margin: 9px 0;\n      }\n[data-shift-health] .redflags{\n        padding: 24px !important;\n        border: 1px solid #a97770;\n        border-radius: 18px;\n        background: #17110f;\n      }\n[data-shift-health] .redflags h2{\n        font-size: clamp(26px, 4vw, 40px);\n      }\n[data-shift-health] .evidenceGrid{\n        display: grid;\n        grid-template-columns: repeat(2, minmax(0, 1fr));\n        gap: 14px;\n      }\n[data-shift-health] .evidenceCard{\n        padding: 22px;\n        border-top: 5px solid var(--l);\n        border-radius: 16px;\n        background: #11130f;\n      }\n[data-shift-health] .evidenceCard strong{\n        display: block;\n        font-size: 21px;\n        line-height: 1.2;\n      }\n[data-shift-health] .evidenceCard a{\n        font-weight: 900;\n      }\n[data-shift-health] .reviewed{\n        color: #aaa69d;\n        font-size: 13px;\n      }\n[data-shift-health] .visual ul{\n        width: calc(100% - 40px);\n        margin: 24px 20px 0;\n        padding: 0;\n        list-style: none;\n        text-align: left;\n      }\n[data-shift-health] .visual li{\n        padding: 7px 0;\n        border-top: 1px solid #05050555;\n        font-weight: 800;\n      }\n@media (max-width: 760px){[data-shift-health] .journeyGrid,[data-shift-health] .detailGrid,[data-shift-health] .decisionGrid{\n          grid-template-columns: 1fr;\n        }\n[data-shift-health] .evidenceGrid{\n          grid-template-columns: 1fr;\n        }\n}\n";
export const hubStyle="[data-shift-health]{--b:#050505;--c:#e7e3da;--g:#707762;--l:#a7af94}\n[data-shift-health] *{box-sizing:border-box}\n[data-shift-health] html{scroll-behavior:smooth}\n[data-shift-health]{margin:0;background:var(--b);color:var(--c);font:16px/1.55 Arial,sans-serif}\n[data-shift-health] a{color:inherit}\n[data-shift-health] .wrap{width:min(1160px,calc(100% - 36px));margin:auto}\n[data-shift-health] .head{position:sticky;top:0;z-index:9;background:#050505f5;border-bottom:1px solid var(--g)}\n[data-shift-health] .headin{min-height:72px;display:flex;align-items:center;justify-content:space-between;gap:20px}\n[data-shift-health] .brand{font-size:20px;font-weight:1000;text-decoration:none}\n[data-shift-health] .brand span,[data-shift-health] .eyebrow,[data-shift-health] .card small{color:var(--l)}\n[data-shift-health] nav{display:flex;gap:18px;align-items:center}\n[data-shift-health] nav a{text-decoration:none;font-weight:850}\n[data-shift-health] .menu,[data-shift-health] .mobile{display:none}\n[data-shift-health] .hero{padding:clamp(68px,10vw,126px) 0 64px;border-bottom:1px solid #292c27;background:radial-gradient(circle at 85% 10%,#70776255,transparent 35%)}\n[data-shift-health] .eyebrow,[data-shift-health] .card small{font-weight:1000;letter-spacing:.12em}\n[data-shift-health] .hero h1{max-width:900px;margin:10px 0 20px;font-size:clamp(48px,8vw,92px);line-height:.92;letter-spacing:-.055em}\n[data-shift-health] .hero p{max-width:760px;color:#cbc7bd;font-size:clamp(18px,2.3vw,24px)}\n[data-shift-health] .actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:22px}\n[data-shift-health] .btn{display:inline-flex;justify-content:center;align-items:center;min-height:46px;padding:11px 17px;border:1px solid var(--c);border-radius:999px;background:var(--c);color:var(--b);font-weight:1000;text-decoration:none}\n[data-shift-health] .btn.alt{background:transparent;color:var(--c)}\n[data-shift-health] .intro{padding:48px 0 15px}\n[data-shift-health] .intro h2{max-width:820px;margin:5px 0;font-size:clamp(32px,5vw,58px);line-height:1}\n[data-shift-health] .grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;padding:28px 0 70px}\n[data-shift-health] .card{scroll-margin-top:90px;display:flex;flex-direction:column;min-height:300px;padding:25px;border:1px solid var(--g);border-radius:22px;background:#11130f}\n[data-shift-health] .card h2{font-size:clamp(27px,3vw,38px);line-height:1.05;margin:8px 0}\n[data-shift-health] .card p{color:#cbc7bd}\n[data-shift-health] .status{margin-top:auto;padding:12px 14px;border-left:3px solid var(--l);background:#191b18;color:var(--c)!important;font-size:14px}\n[data-shift-health] .model{margin-bottom:65px;padding:30px;border-radius:22px;background:var(--g);color:var(--b)}\n[data-shift-health] .model h2{font-size:clamp(30px,5vw,50px);line-height:1;margin:8px 0 16px}\n[data-shift-health] .model p{margin:5px 0;font-size:18px;font-weight:850}\n[data-shift-health] .safety{margin-bottom:50px;padding:20px;border:1px solid #a97770;border-radius:16px}\n[data-shift-health] .footer{padding:34px 0;border-top:1px solid var(--g)}\n@media(max-width:850px){[data-shift-health] .desktop{display:none}\n[data-shift-health] .menu{display:block;border:1px solid var(--g);border-radius:999px;background:transparent;color:var(--c);padding:9px 13px;font:inherit;font-weight:900}\n[data-shift-health] .mobile[aria-hidden=false]{display:grid;gap:4px;padding:0 18px 17px}\n[data-shift-health] .mobile a{padding:9px 0;border-bottom:1px solid #292c27}\n[data-shift-health] .grid{grid-template-columns:1fr}\n[data-shift-health] .card{min-height:0}\n}\n@media(max-width:480px){[data-shift-health] .wrap{width:calc(100% - 28px)}\n[data-shift-health] .hero h1{font-size:50px}\n[data-shift-health] .actions{display:grid}\n[data-shift-health] .btn{width:100%}\n[data-shift-health] .card{padding:20px}\n}\n";
export const hubMain="<section class=\"hero\"><div class=\"wrap\"><span class=\"eyebrow\">WIDER MEN’S HEALTH</span><h1>What would you like to sort?</h1><p>Weight has its own front door. SHIFT Health helps ordinary blokes understand and sort the rest—from energy and sleep to heart health, confidence, hair and what’s happening under the bonnet.</p><div class=\"actions\"><a class=\"btn\" href=\"#routes\">Choose what to sort</a><a class=\"btn alt\" href=\"/start-here\">Here about weight? Start Here</a></div></div></section><section class=\"wrap intro\" id=\"routes\"><span class=\"eyebrow\">ONE USEFUL NEXT STEP</span><h2>Start with what’s bothering you.</h2></section><section class=\"wrap grid\" aria-label=\"SHIFT Health pathways\">\n<article class=\"card\" id=\"energy-sleep\"><small>ENERGY + SLEEP</small><h2>My energy or sleep</h2><p>Look at sleep, routine, nutrition, movement and wider health signals before guessing at a diagnosis.</p><p class=\"status\"><strong>Explore:</strong> home testing and a proper sleep route.</p><div class=\"actions\"><a class=\"btn\" href=\"/shift-health/testosterone-energy\">Energy check</a><a class=\"btn alt\" href=\"/shift-health/sleep-apnoea\">Sleep assessment</a></div></article>\n<article class=\"card\" id=\"cardio-metabolic\"><small>UNDER THE BONNET</small><h2>My heart and metabolic health</h2><p>Blood pressure, waist, blood sugar, cholesterol and liver context belong in one understandable picture.</p><p class=\"status\"><strong>Explore:</strong> measure it, understand it, keep it together.</p><div class=\"actions\"><a class=\"btn\" href=\"/shift-health/health-mot\">SHIFT Health MOT</a><a class=\"btn alt\" href=\"/shift-health/blood-pressure-monitor\">Blood pressure</a></div></article>\n<article class=\"card\" id=\"sexual-health\"><small>PRIVATE PATHWAY</small><h2>My sex life or confidence</h2><p>Erections, sex drive and confidence can have several explanations. Start privately—not with a product.</p><p class=\"status\"><strong>Private and straightforward:</strong> understand the options and the checks that matter.</p><div class=\"actions\"><a class=\"btn\" href=\"/shift-health/erectile-dysfunction\">Explore the pathway</a><a class=\"btn alt\" href=\"/member/dashboard#journey\">Private check-in</a></div></article>\n<article class=\"card\" id=\"hair\"><small>HAIR HEALTH</small><h2>My hair</h2><p>Understand what changed and what legitimate assessment involves before considering treatment.</p><p class=\"status\"><strong>Start properly:</strong> pattern, expectations, positives and limitations.</p><div class=\"actions\"><a class=\"btn\" href=\"/shift-health/hair-loss\">Explore hair health</a><a class=\"btn alt\" href=\"/member/dashboard#journey\">Add to My Journey</a></div></article>\n<article class=\"card\" id=\"testosterone\"><small>INVESTIGATE—DON’T ASSUME</small><h2>Testosterone concerns</h2><p>Energy, mood, strength or sex drive do not diagnose low testosterone. Proper investigation starts with history and appropriate blood testing.</p><p class=\"status\"><strong>Investigate properly:</strong> one result is not a ticket to TRT.</p><div class=\"actions\"><a class=\"btn\" href=\"/shift-health/testosterone-energy\">Testosterone &amp; Energy</a><a class=\"btn alt\" href=\"/member/dashboard#journey\">Men’s check-in</a></div></article>\n<article class=\"card\" id=\"head-stress\"><small>HEAD + STRESS</small><h2>My head or stress</h2><p>Judgement-free support for stress, confidence and mental health, with proper urgent routes.</p><p class=\"status\"><strong>Available now:</strong> Good to Talk guidance and support.</p><div class=\"actions\"><a class=\"btn\" href=\"/mens-mental-health\">Good to Talk</a><a class=\"btn alt\" href=\"/contact?type=Support\">Message SHIFT</a></div></article>\n<article class=\"card\" id=\"drinking-smoking\"><small>ORDINARY LIFE</small><h2>Drinking or smoking</h2><p>No purity test. Understand the pattern, choose one realistic change and use established support.</p><p class=\"status\"><strong>One realistic change:</strong> proven help, tracked without judgement.</p><div class=\"actions\"><a class=\"btn\" href=\"/shift-health/stop-smoking\">Stop-smoking route</a><a class=\"btn alt\" href=\"/member/dashboard#journey\">Put it in My Journey</a></div></article>\n<article class=\"card\" id=\"health-mot\"><small>NOT SURE?</small><h2>Give me a health MOT</h2><p>Start broad: waist, heart, metabolic picture, movement, sleep and men’s health—in plain English.</p><p class=\"status\"><strong>How’s the engine?</strong> Get the useful picture without drowning in numbers.</p><div class=\"actions\"><a class=\"btn\" href=\"/shift-health/health-mot\">Explore the MOT</a><a class=\"btn alt\" href=\"/shift-health/shift-measure\">The SHIFT Measure</a></div></article></section>\n<section class=\"wrap model\"><span class=\"eyebrow\">YOUR SHIFT</span><h2>Your health. One connected place.</h2><p>Start Here helps you explore weight-treatment options.</p><p>The Programme helps you make progress and keep it.</p><p>SHIFT Health helps you sort the wider stuff.</p><p>My Timber keeps your Journey, priorities and next steps together.</p></section><aside class=\"wrap safety\"><strong>Need urgent help?</strong> Use NHS 111 for urgent advice or call 999 in an emergency. For urgent mental-health help, use NHS 111 and select the mental-health option.</aside>";
export function renderHealthProduct(slug){
 const item=PRODUCTS[slug];if(!item)return null;
 const journey=JOURNEY[slug],faq=FAQ[slug],detail=DETAILS[slug],evidence=EVIDENCE[slug];
 return `<a class="back" href="/shift-health">← SHIFT Health</a>
    <section class="productHero"><div><small>${esc(item.family)} · ${esc(item.code)}</small><h1>${esc(item.name)}</h1><p class="job">${esc(item.job)}</p><p>${esc(item.intro)}</p><div class="availability"><span>AVAILABILITY</span><strong>No stock available today</strong><span>This information does not mean a test, device or treatment is available to order.</span></div><div class="actions"><a class="btn" href="/contact?type=Stock%20update&product=${encodeURIComponent(item.code)}&name=${encodeURIComponent(item.name)}">Ask about availability</a><a class="btn alt" data-save-shift-health href="/member/dashboard?shift_health=${encodeURIComponent(slug)}#journey">Add this to My Timber</a></div></div><figure class="visual"><img src="${MEDIA[slug]}" alt="${esc(item.name)}" width="1200" height="800"></figure></section>
    <nav class="jump" aria-label="On this page"><a href="#understand">What it is</a><a href="#included">What you get</a><a href="#decide">Is it right?</a><a href="#evidence">Evidence</a><a href="#journey">Your Journey</a><a href="#process">What happens</a><a href="#questions">Questions</a></nav>
    <section id="understand"><small>01 · UNDERSTAND IT</small><h2>Know what you’re choosing.</h2><p class="sectionCopy">${esc(detail.understand)}</p></section>
    <section id="included"><small>02 · WHAT YOU GET</small><h2>More than an item in a box.</h2><div class="detailGrid"><article class="detailCard"><b>Included in the route</b><ul>${detail.included.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></article><article class="detailCard"><b>How to get a useful result</b><ul>${detail.choices.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></article></div></section>
    <section id="decide"><small>03 · MAKE THE DECISION</small><h2>Useful for the right bloke. Not magic.</h2><p class="sectionCopy">${esc(detail.decision)}</p><div class="decisionGrid"><article><h3>Who it’s for</h3><p>${esc(item.for)}</p><h3>The positives</h3><ul>${item.positives.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></article><article><h3>Who it’s not for</h3><p>${esc(item.not)}</p><h3>The honest negatives</h3><ul>${item.negatives.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></article></div></section>
    <section class="redflags"><small>DON’T WAIT ON A WEBSITE</small><h2>When this is not the next step.</h2><p>${esc(detail.redFlags)}</p></section>
    <section id="evidence"><small>04 · WHY SHIFT HAS INCLUDED THIS</small><h2>Evidence before shelf space.</h2><p class="sectionCopy">This route earns its place by solving a defined health problem. These are the standards and public-health sources behind the decision.</p><div class="evidenceGrid">${evidence.map(([title, copy, source, href]) => `<article class="evidenceCard"><strong>${esc(title)}</strong><p>${esc(copy)}</p><a href="${href}" rel="external">Read ${esc(source)} ↗</a></article>`).join("")}</div><p class="reviewed">Evidence checked 7 September 2026. Sources can change; the latest linked guidance takes precedence.</p></section>
    <section class="potential"><small>THE POTENTIAL</small><h2>${esc(item.potential)}</h2></section>
    <section class="journey" id="journey"><small>05 · WHERE IT FITS</small><h2>${esc(journey[0])}</h2><div class="journeyGrid"><div><b>What My Timber keeps</b><p>${esc(journey[1])}</p></div><div><b>Your Next Shift</b><p>${esc(journey[2])}</p></div></div></section>
    <section id="process"><small>06 · WHAT HAPPENS NEXT</small><h2>One clear route. No mystery hand-offs.</h2><ol class="steps">${item.steps.map((x, i) => `<li><b>0${i + 1}</b><span>${esc(x)}</span></li>`).join("")}</ol></section>
    <section id="questions"><small>07 · USEFUL QUESTIONS</small><h2>Before you decide.</h2><div class="faqs">${faq.map((x) => `<details><summary>${esc(x[0])}</summary><p>${esc(x[1])}</p></details>`).join("")}</div></section>
    <section class="next"><small>MY NEXT SHIFT</small><h2>Keep it connected to the reason you started.</h2><p>My Timber keeps the result, your priorities and one useful next step together. It becomes part of your Journey—not another purchase you forget about in a drawer.</p><div class="actions"><a class="btn" data-save-shift-health href="/member/dashboard?shift_health=${encodeURIComponent(slug)}#journey">Open My Timber</a><a class="btn alt" href="/contact?type=Stock%20update&product=${encodeURIComponent(item.code)}&name=${encodeURIComponent(item.name)}">Ask about availability</a></div></section>`;
}
