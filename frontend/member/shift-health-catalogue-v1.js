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
document.head.insertAdjacentHTML(
  "beforeend",
  "<style>.journey{border-bottom:1px solid #292c27}.journeyGrid{display:grid;grid-template-columns:1fr 1fr;gap:14px}.journeyGrid>div{padding:22px;border-left:4px solid var(--l);background:#11130f}.journeyGrid b{font-size:19px}.faqs{display:grid;gap:10px}.faqs details{padding:18px;border:1px solid var(--g);border-radius:16px;background:#11130f}.faqs summary{cursor:pointer;font-weight:900;font-size:18px}.faqs p{color:#cbc7bd}@media(max-width:760px){.journeyGrid{grid-template-columns:1fr}}</style>",
);
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
const slug = (location.pathname.split("/").filter(Boolean).pop() || "").replace(
  /\.html$/,
  "",
);
const item = PRODUCTS[slug];
const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
if (item) {
  const journey = JOURNEY[slug],
    faq = FAQ[slug],
    detail = DETAILS[slug];
  document.title = `${item.name} | SHIFT Health`;
  document.querySelector("[data-product]").innerHTML =
    `<a class="back" href="/shift-health">← SHIFT Health</a>
    <section class="productHero"><div><small>${esc(item.family)} · ${esc(item.code)}</small><h1>${esc(item.name)}</h1><p class="job">${esc(item.job)}</p><p>${esc(item.intro)}</p><div class="availability"><span>AVAILABILITY</span><strong>Currently out of stock</strong><span>Leave your details once and we’ll tell you when it returns.</span></div><div class="actions"><a class="btn" href="/contact?type=Stock%20update&product=${encodeURIComponent(item.code)}">Tell me when it’s back</a><a class="btn alt" href="/member/dashboard#journey">Add this to My Timber</a></div></div><div class="visual"><b>SHIFT</b><span>${esc(item.family)}</span><em>${esc(item.code)}</em><ul><li>Clear purpose</li><li>Honest limitations</li><li>Connected follow-up</li></ul></div></section>
    <nav class="jump" aria-label="On this page"><a href="#understand">What it is</a><a href="#included">What you get</a><a href="#decide">Is it right?</a><a href="#journey">Your Journey</a><a href="#process">What happens</a><a href="#questions">Questions</a></nav>
    <section id="understand"><small>01 · UNDERSTAND IT</small><h2>Know what you’re choosing.</h2><p class="sectionCopy">${esc(detail.understand)}</p></section>
    <section id="included"><small>02 · WHAT YOU GET</small><h2>More than an item in a box.</h2><div class="detailGrid"><article class="detailCard"><b>Included in the route</b><ul>${detail.included.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></article><article class="detailCard"><b>How to get a useful result</b><ul>${detail.choices.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></article></div></section>
    <section id="decide"><small>03 · MAKE THE DECISION</small><h2>Useful for the right bloke. Not magic.</h2><p class="sectionCopy">${esc(detail.decision)}</p><div class="decisionGrid"><article><h3>Who it’s for</h3><p>${esc(item.for)}</p><h3>The positives</h3><ul>${item.positives.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></article><article><h3>Who it’s not for</h3><p>${esc(item.not)}</p><h3>The honest negatives</h3><ul>${item.negatives.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></article></div></section>
    <section class="redflags"><small>DON’T WAIT ON A WEBSITE</small><h2>When this is not the next step.</h2><p>${esc(detail.redFlags)}</p></section>
    <section class="potential"><small>THE POTENTIAL</small><h2>${esc(item.potential)}</h2></section>
    <section class="journey" id="journey"><small>04 · WHERE IT FITS</small><h2>${esc(journey[0])}</h2><div class="journeyGrid"><div><b>What My Timber keeps</b><p>${esc(journey[1])}</p></div><div><b>Your Next Shift</b><p>${esc(journey[2])}</p></div></div></section>
    <section id="process"><small>05 · WHAT HAPPENS NEXT</small><h2>One clear route. No mystery hand-offs.</h2><ol class="steps">${item.steps.map((x, i) => `<li><b>0${i + 1}</b><span>${esc(x)}</span></li>`).join("")}</ol></section>
    <section id="questions"><small>06 · USEFUL QUESTIONS</small><h2>Before you decide.</h2><div class="faqs">${faq.map((x) => `<details><summary>${esc(x[0])}</summary><p>${esc(x[1])}</p></details>`).join("")}</div></section>
    <section class="next"><small>MY NEXT SHIFT</small><h2>Keep it connected to the reason you started.</h2><p>My Timber keeps the result, your priorities and one useful next step together. It becomes part of your Journey—not another purchase you forget about in a drawer.</p><div class="actions"><a class="btn" href="/member/dashboard#journey">Open My Timber</a><a class="btn alt" href="/contact?type=Stock%20update&product=${encodeURIComponent(item.code)}">Tell me when it’s back</a></div></section>`;
} else
  document.querySelector("[data-product]").innerHTML =
    '<h1>That SHIFT Health route could not be found.</h1><a class="btn" href="/shift-health">Back to SHIFT Health</a>';
