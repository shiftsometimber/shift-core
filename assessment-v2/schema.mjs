// Restore the agreed compact v5 question wording/lists. No automatic clinical decision.
export const QUESTIONNAIRE_VERSION = 'shift-compact-v5-prepurchase-draft-2026-10-28';
export const COMPACT_SOURCE_VERSION = 'shift-compact-v5-draft-2026-10-23';
export const SECTIONS = [
  {
    "title": "Your request",
    "questions": [
      {
        "id": "requestPath",
        "label": "Which best describes your request?",
        "type": "select",
        "options": [
          "Starting treatment",
          "Switching provider or medicine",
          "Restarting after a break",
          "Repeat treatment"
        ]
      },
      {
        "id": "forMyself",
        "label": "Is this treatment for you?",
        "type": "select",
        "options": [
          "Yes",
          "No"
        ]
      },
      {
        "id": "inUK",
        "label": "Are you currently in the UK?",
        "type": "select",
        "options": [
          "No",
          "Yes",
          "Not sure"
        ]
      }
    ]
  },
  {
    "title": "Current or previous treatment",
    "questions": [
      {
        "id": "timeOnDose",
        "label": "How long have you taken your current or most recent dose?",
        "type": "text",
        "paths": [
          "Switching provider or medicine",
          "Restarting after a break",
          "Repeat treatment"
        ]
      },
      {
        "id": "nextDoseDate",
        "label": "When is your next dose expected?",
        "type": "date",
        "paths": [
          "Switching provider or medicine",
          "Restarting after a break",
          "Repeat treatment"
        ],
        "optional": true,
        "allowFuture": true
      },
      {
        "id": "missedDoses",
        "label": "Have you missed doses or had a break?",
        "type": "select",
        "paths": [
          "Switching provider or medicine",
          "Restarting after a break",
          "Repeat treatment"
        ],
        "options": [
          "No",
          "Yes",
          "Not sure"
        ]
      },
      {
        "id": "missedDosesDetails",
        "label": "Give the dates or length of the break.",
        "type": "textarea",
        "when": [
          "missedDoses",
          [
            "Yes",
            "Not sure"
          ]
        ],
        "paths": [
          "Switching provider or medicine",
          "Restarting after a break",
          "Repeat treatment"
        ]
      },
      {
        "id": "sideEffects",
        "label": "Have you had any side effects?",
        "type": "select",
        "paths": [
          "Switching provider or medicine",
          "Restarting after a break",
          "Repeat treatment"
        ],
        "options": [
          "No",
          "Yes",
          "Not sure"
        ]
      },
      {
        "id": "sideEffectsDetails",
        "label": "What happened, and is it still happening?",
        "type": "textarea",
        "when": [
          "sideEffects",
          [
            "Yes",
            "Not sure"
          ]
        ],
        "paths": [
          "Switching provider or medicine",
          "Restarting after a break",
          "Repeat treatment"
        ]
      },
      {
        "id": "previousProvider",
        "label": "Who prescribed your previous treatment?",
        "type": "text",
        "paths": [
          "Switching provider or medicine",
          "Restarting after a break",
          "Repeat treatment"
        ]
      },
      {
        "id": "startingWeight",
        "label": "What was your weight when you first started weight-loss treatment?",
        "type": "text",
        "paths": [
          "Switching provider or medicine",
          "Restarting after a break",
          "Repeat treatment"
        ]
      }
    ]
  },
  {
    "title": "Medical conditions",
    "questions": [
      {
        "id": "conditionList",
        "label": "Do you have any of the following medical conditions?",
        "type": "multi",
        "options": [
          "Prediabetes",
          "Type 2 diabetes",
          "High blood pressure",
          "High cholesterol",
          "Heart or blood vessel disease (e.g., heart attack, stroke, atrial fibrillation)",
          "Erectile dysfunction",
          "Obstructive sleep apnoea",
          "Asthma",
          "Osteoarthritis",
          "Acid reflux or gastro-oesophageal reflux disease (GORD)",
          "Chronic back pain",
          "Depression",
          "PCOS",
          "NAFLD (Non-Alcoholic Fatty Liver Disease) or MASLD (Metabolic dysfunction-associated steatotic liver disease)",
          "None of the above"
        ]
      }
    ]
  },
  {
    "title": "Medical history",
    "questions": [
      {
        "id": "medicalHistory",
        "label": "Have you ever been diagnosed with any of the following?",
        "type": "select",
        "items": [
          "Severe liver or liver transplant",
          "Kidney disease (eGFR less than 30mL/min)",
          "Heart failure with shortness of breath",
          "History of pancreatitis (inflammation of the pancreas)",
          "Personal or family history (first-degree relatives) of multiple endocrine neoplasia type 2 and medullary thyroid carcinoma",
          "Active cancer, requiring monitoring or treatment",
          "Type 1 diabetes",
          "Diabetes-related eye problems (e.g., diabetic retinopathy)",
          "A current eating disorder or a history of an eating disorder (e.g., anorexia, bulimia, binge eating disorder)",
          "A history of gallstones (if you still have your gallbladder) or gallbladder disease",
          "Any weight loss procedures or surgery in the last 12 months (e.g., gastric sleeve, gastric band, gastric bypass, gastric balloon)",
          "Previous history of bowel or intestinal surgery (excluding appendectomy)",
          "Any uncontrolled or clinically significant endocrine (hormonal) disorder, such as Addison’s disease, Cushing’s syndrome, congenital adrenal hyperplasia, acromegaly, or another growth hormone disorder",
          "Chronic malabsorption syndrome",
          "Current gastrointestinal stoma (e.g. colostomy, ileostomy or other stoma following bowel surgery)",
          "Severe digestive conditions (e.g., Crohn’s disease, ulcerative colitis or gastroparesis)"
        ],
        "options": [
          "Yes - I have one of the above listed conditions",
          "I have other medical conditions",
          "None of the above",
          "Not sure"
        ]
      },
      {
        "id": "medicalHistoryDetails",
        "label": "Please give details.",
        "type": "textarea",
        "when": [
          "medicalHistory",
          [
            "Yes - I have one of the above listed conditions",
            "I have other medical conditions",
            "Not sure"
          ]
        ]
      }
    ]
  },
  {
    "title": "Medicines 1 of 2",
    "questions": [
      {
        "id": "medicines1",
        "label": "Are you currently taking any medications? (1 of 2)",
        "type": "select",
        "items": [
          "Weight loss medication (Orlistat, MySimba)",
          "Parkinson’s medication (levodopa, pramipexole, ropinirole, amantadine, bromocriptine, cabergoline, pergolide, rasagiline, selegiline)",
          "Epilepsy medication (carbamazepine, phenytoin, phenobarbital, primidone, sodium valproate/valproic acid, fenfluramine, divalproex, zonisamide, ethosuximide)",
          "Diabetes medication (insulin, sulfonylureas)",
          "Blood thinners (warfarin, acenocoumarol, phenidione)",
          "Medication that requires close monitoring (azathioprine, lithium, methotrexate, theophylline, mycophenolate mofetil, clozapine, colchicine, isoprenaline)",
          "Immunosuppressants (ciclosporin, tacrolimus, sirolimus)",
          "Medication to control your heart rate (flecainide, quinidine, procainamide, disopyramide, amiodarone, digoxin)"
        ],
        "options": [
          "Yes - I am currently taking one of the above listed medications",
          "I take other medication",
          "None of the above",
          "Not sure"
        ]
      },
      {
        "id": "medicines1Details",
        "label": "List the medicines and doses, including any other prescribed medicines, over-the-counter products, supplements or herbal remedies.",
        "type": "textarea",
        "when": [
          "medicines1",
          [
            "Yes - I am currently taking one of the above listed medications",
            "I take other medication",
            "Not sure"
          ]
        ]
      }
    ]
  },
  {
    "title": "Medicines 2 of 2",
    "questions": [
      {
        "id": "medicines2",
        "label": "Are you currently taking any medications? (2 of 2)",
        "type": "select",
        "items": [
          "Certain antibiotics (Clarithromycin, rifabutin or rifampicin)",
          "Certain antiviral medicines (Paxlovid, ritonavir, cobicistat, telaprevir, nevirapine, efavirenz or etravirine)",
          "Certain antifungal medicines (Itraconazole, oral ketoconazole, posaconazole or voriconazole)",
          "Other medicines (Dexamethasone, modafinil, repaglinide, lumacaftor/ivacaftor, bosentan, gemfibrozil, oral topotecan, simvastatin or rosuvastatin)",
          "Herbal medicines (St John’s wort)"
        ],
        "options": [
          "Yes - I am currently taking one of the above listed medications",
          "None of the above",
          "Not sure"
        ]
      },
      {
        "id": "medicines2Details",
        "label": "List the medicines and doses, including any other prescribed medicines, over-the-counter products, supplements or herbal remedies.",
        "type": "textarea",
        "when": [
          "medicines2",
          [
            "Yes - I am currently taking one of the above listed medications",
            "Not sure"
          ]
        ]
      }
    ]
  },
  {
    "title": "Allergies",
    "questions": [
      {
        "id": "allergies",
        "label": "Are you allergic to any medications?",
        "type": "select",
        "options": [
          "No",
          "Yes",
          "Not sure"
        ]
      },
      {
        "id": "allergiesDetails",
        "label": "What are you allergic to, and what reaction did you have?",
        "type": "textarea",
        "when": [
          "allergies",
          [
            "Yes",
            "Not sure"
          ]
        ]
      },
      {
        "id": "otherAllergies",
        "label": "Do you have any other allergies, including food, latex, plasters or insect stings?",
        "type": "select",
        "options": [
          "No",
          "Yes",
          "Not sure"
        ]
      },
      {
        "id": "otherAllergiesDetails",
        "label": "What are you allergic to, and what reaction did you have?",
        "type": "textarea",
        "when": [
          "otherAllergies",
          [
            "Yes",
            "Not sure"
          ]
        ]
      }
    ]
  },
  {
    "title": "Pregnancy and breastfeeding",
    "questions": [
      {
        "id": "pregnancyPossible",
        "label": "Could you become pregnant?",
        "type": "select",
        "options": [
          "No",
          "Yes",
          "Not sure"
        ]
      },
      {
        "id": "pregnancyStatus",
        "label": "Are you pregnant, planning a pregnancy or breastfeeding?",
        "type": "select",
        "when": [
          "pregnancyPossible",
          [
            "Yes",
            "Not sure"
          ]
        ],
        "options": [
          "No",
          "Pregnant",
          "Planning a pregnancy",
          "Breastfeeding",
          "Not sure"
        ]
      },
      {
        "id": "contraception",
        "label": "What contraception do you use, if any?",
        "type": "text",
        "when": [
          "pregnancyPossible",
          [
            "Yes",
            "Not sure"
          ]
        ]
      }
    ]
  },
  {
    "title": "Current symptoms",
    "questions": [
      {
        "id": "urgentSymptoms",
        "label": "Do you currently have severe persistent stomach pain, sudden loss of vision or a severe allergic reaction?",
        "type": "select",
        "options": [
          "No",
          "Yes",
          "Not sure"
        ]
      },
      {
        "id": "urgentSymptomsDetails",
        "label": "Describe your symptoms and advice already sought. Do not wait for this form to be reviewed to seek medical help.",
        "type": "textarea",
        "when": [
          "urgentSymptoms",
          [
            "Yes",
            "Not sure"
          ]
        ]
      }
    ]
  },
  {
    "title": "GP sharing and confirmations",
    "questions": [
      {
        "id": "gpSharingChoice",
        "label": "May the treating clinical service contact your GP and share relevant care information?",
        "type": "select",
        "options": [
          "Yes",
          "No",
          "Not sure"
        ]
      },
      {
        "id": "gpSharingDetails",
        "label": "Please explain your concerns or restrictions.",
        "type": "textarea",
        "when": [
          "gpSharingChoice",
          [
            "No",
            "Not sure"
          ]
        ]
      },
      {
        "id": "treatmentConfirmation",
        "label": "Please read the treatment information. Can you confirm these points?",
        "type": "select",
        "items": [
          "My answers are complete and accurate; treatment is for my own use.",
          "I will read the medicine leaflet and follow the clinical team’s advice.",
          "I understand treatment requires a prescriber’s decision; payment does not guarantee a prescription.",
          "I will report side effects, new medicines and health changes, and seek urgent medical help for serious symptoms.",
          "I will not combine weight-loss medicines without specific prescriber instructions.",
          "I will follow medicine-specific missed-dose instructions and ask the clinical team about restarting after a break.",
          "If an off-label treatment is proposed, the clinician must explain the specific proposal and obtain consent.",
          "This private environment holds fictional test information only."
        ],
        "options": [
          "I confirm",
          "I need to discuss this"
        ]
      },
      {
        "id": "treatmentConfirmationDetails",
        "label": "What would you like clarified?",
        "type": "textarea",
        "when": [
          "treatmentConfirmation",
          [
            "I need to discuss this"
          ]
        ]
      }
    ]
  }
];
export const QUESTIONS=SECTIONS.flatMap(s=>s.questions);
export function isActive(q,answers){return (!q.paths||q.paths.includes(answers.requestPath))&&(!q.when||q.when[1].includes(answers[q.when[0]]));}
export function validateAssessment(value,{today=new Date().toISOString().slice(0,10)}={}){
 if(!value||Object.keys(value).some(k=>!['version','answers','prescribingAcknowledged'].includes(k))||typeof value!=='object'||Array.isArray(value)||value.version!==QUESTIONNAIRE_VERSION||!value.answers||typeof value.answers!=='object'||Array.isArray(value.answers))return {error:'assessment_version_required',message:'Reload the current assessment before continuing.'};
 const allowed=new Set(QUESTIONS.map(q=>q.id));
 if(Object.keys(value.answers).some(k=>!allowed.has(k)))return {error:'unexpected_assessment_answer',message:'The assessment contains an unknown question.'};
 const answers={};
 for(const q of QUESTIONS){
  if(!isActive(q,value.answers))continue;
  const v=value.answers[q.id];
  if(v!==undefined&&typeof v!=='string')return {error:'invalid_assessment_answer',field:q.id,message:'Check this answer.'};
  const answer=(v||'').trim();
  if(!answer&&!q.optional)return {error:'assessment_answer_required',field:q.id,message:'Please answer: '+q.label};
  if(answer.length>4000)return {error:'assessment_answer_too_long',field:q.id,message:'This answer is over 4,000 characters. Do not omit relevant information; ask the clinical team for a secure way to provide it.'};
  if(q.type==='multi'&&answer){let selected;try{selected=JSON.parse(answer);}catch{return {error:'invalid_assessment_answer',field:q.id,message:'Choose the conditions that apply, or None of the above.'};}if(!Array.isArray(selected)||!selected.length||new Set(selected).size!==selected.length||selected.some(v=>!q.options.includes(v))||(selected.includes('None of the above')&&selected.length>1))return {error:'invalid_assessment_answer',field:q.id,message:'Choose the conditions that apply, or None of the above.'};}
  if(q.type!=='multi'&&q.options&&answer&&!q.options.includes(answer))return {error:'invalid_assessment_answer',field:q.id,message:'Choose one of the listed answers.'};
  if(q.type==='date'&&answer){const d=new Date(answer+'T00:00:00Z');if(!/^\d{4}-\d{2}-\d{2}$/.test(answer)||!Number.isFinite(d.getTime())||d.toISOString().slice(0,10)!==answer||(!q.allowFuture&&answer>today)||answer<'1900-01-01')return {error:'invalid_assessment_date',field:q.id,message:'Enter a real date that is not in the future.'};}
  answers[q.id]=answer;
 }
 if(value.prescribingAcknowledged!==true)return {error:'prescribing_acknowledgement_required',message:'Confirm you understand that a prescriber must approve any prescription.'};
 return {value:{version:QUESTIONNAIRE_VERSION,answers,prescribingAcknowledged:true}};
}
