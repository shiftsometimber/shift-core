export const schema = {
  "version": "shift-compact-v5-draft-2026-10-23",
  "status": "private_fictional_only_not_clinically_approved",
  "sections": [
    {
      "title": "Core details",
      "questions": [
        {
          "id": "fullName",
          "label": "Full name",
          "type": "text",
          "optional": false
        },
        {
          "id": "dateOfBirth",
          "label": "Date of birth",
          "type": "date",
          "optional": false
        },
        {
          "id": "address",
          "label": "Home address",
          "type": "text",
          "optional": false
        },
        {
          "id": "postcode",
          "label": "Postcode",
          "type": "text",
          "optional": false
        },
        {
          "id": "email",
          "label": "Email",
          "type": "text",
          "optional": false
        },
        {
          "id": "phone",
          "label": "Mobile",
          "type": "text",
          "optional": false
        },
        {
          "id": "deliveryAddress",
          "label": "Delivery address if different",
          "type": "text",
          "optional": true
        },
        {
          "id": "deliveryPostcode",
          "label": "Delivery postcode if different",
          "type": "text",
          "optional": true
        },
        {
          "id": "heightCm",
          "label": "Height in cm",
          "type": "number",
          "optional": false
        },
        {
          "id": "weightKg",
          "label": "Weight in kg",
          "type": "number",
          "optional": false
        },
        {
          "id": "gpName",
          "label": "GP name if known",
          "type": "text",
          "optional": true
        },
        {
          "id": "gpPractice",
          "label": "GP practice",
          "type": "text",
          "optional": false
        },
        {
          "id": "gpAddress",
          "label": "GP address",
          "type": "text",
          "optional": false
        },
        {
          "id": "gpPostcode",
          "label": "GP postcode",
          "type": "text",
          "optional": false
        },
        {
          "id": "insulinUse",
          "label": "Do you use insulin?",
          "type": "select",
          "options": [
            "Yes",
            "No"
          ]
        },
        {
          "id": "weightRelatedCondition",
          "label": "Weight-related condition",
          "type": "select",
          "options": [
            "Yes",
            "No",
            "Not sure"
          ],
          "optional": true
        },
        {
          "id": "previousMedicine",
          "label": "Medicine",
          "type": "text",
          "paths": [
            "Switching provider or medicine",
            "Restarting after a break",
            "Repeat treatment"
          ]
        },
        {
          "id": "previousDose",
          "label": "Actual dose",
          "type": "text",
          "paths": [
            "Switching provider or medicine",
            "Restarting after a break",
            "Repeat treatment"
          ]
        },
        {
          "id": "lastDoseDate",
          "label": "Last dose date",
          "type": "date",
          "paths": [
            "Switching provider or medicine",
            "Restarting after a break",
            "Repeat treatment"
          ]
        }
      ]
    },
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
  ],
  "sourceReference": "competitor-screen-reference-2026-10-23",
  "matchingLimit": "Visible competitor lists retained; uncertainty and targeted safety/treatment branches are explicit SHIFT additions, not unseen competitor transcriptions."
};
export const fields=schema.sections.flatMap(s=>s.questions);
export const active=(q,a)=>(!q.paths||q.paths.includes(a.requestPath))&&(!q.when||q.when[1].includes(a[q.when[0]]));
export function validateAnswers(input,complete=false){
 if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!fields.some(q=>q.id===k)))throw Error('unknown_answers');
 const out={};for(const q of fields){if(!active(q,input))continue;const raw=input[q.id];if(raw===undefined||raw===''){if(complete&&!q.optional)throw Error('required_'+q.id);continue;}if(typeof raw!=='string'||raw.length>20000||/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(raw))throw Error('invalid_'+q.id);const value=raw.trim();if(!value&&!q.optional&&complete)throw Error('required_'+q.id);if(q.type==='multi'){let values;try{values=JSON.parse(value);}catch{throw Error('invalid_'+q.id);}if(!Array.isArray(values)||!values.length||new Set(values).size!==values.length||values.some(v=>!q.options.includes(v))||(values.includes('None of the above')&&values.length>1))throw Error('invalid_'+q.id);}else if(q.options&&!q.options.includes(value))throw Error('invalid_'+q.id);if(q.type==='number'&&(!/^\d+(\.\d+)?$/.test(value)||Number(value)<=0))throw Error('invalid_'+q.id);if(q.type==='date'&&(!/^\d{4}-\d\d-\d\d$/.test(value)||!Number.isFinite(Date.parse(value))||new Date(value).toISOString().slice(0,10)!==value||value<'1900-01-01'||(!q.allowFuture&&value>new Date().toISOString().slice(0,10))))throw Error('invalid_'+q.id);out[q.id]=value;}
 if(out.dateOfBirth){const today=new Date().toISOString().slice(0,10),dob=out.dateOfBirth,age=Number(today.slice(0,4))-Number(dob.slice(0,4))-(today.slice(5)<dob.slice(5)?1:0);if(age<18||age>75)throw Error('draft_age_scope');}
 if(complete){if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(out.email))throw Error('invalid_email');if(out.forMyself!=='Yes'||out.inUK!=='Yes'||out.insulinUse!=='No'||out.urgentSymptoms!=='No')throw Error('clinical_review_required');if(Number(out.heightCm)<120||Number(out.heightCm)>230||Number(out.weightKg)<35||Number(out.weightKg)>320)throw Error('invalid_measurements');}
 return out;
}
