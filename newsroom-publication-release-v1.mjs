// Fixed owner-authorised nine-article release, bound to reviewed production observations.
export const NEWSROOM_PUBLICATION_RELEASE = {
  "proof": "NEWSROOM_OWNER_PUBLICATION_RELEASE_V1",
  "status": "ready",
  "release_id": "newsroom-nine-20260916",
  "owner_instruction": {
    "proof": "SHIFT_OWNER_PUBLICATION_INSTRUCTION_V1",
    "status": "authorised",
    "instruction": "Publish them all !!!!!!",
    "actor": {
      "id": "Matt O’Brien",
      "kind": "human",
      "role": "owner"
    },
    "recorded_at": "2026-09-16T18:50:04Z",
    "source": "Explicit user instruction in the current task, after the unpublished content inventory was explained",
    "scope": {
      "grub_additions": 1873,
      "grub_families": 87,
      "grub_protected_corrections": 12,
      "fit_new_protocols": 1362,
      "fit_revision_protocols": 180,
      "newsroom_corrected_articles": [
        276,
        279,
        281,
        284,
        286,
        288,
        290,
        292,
        294
      ]
    },
    "grub_candidate_gzip_sha256": "fc9fbbe12e29ed175c3a742d086b1820778a0adcafc680b25a47225ac876eab8",
    "human_editorial_review_claimed": false,
    "trainer_review_claimed": false,
    "clinical_review_claimed": false,
    "boundary": "Owner instruction authorises publication of these prepared batches after exact content checks. It does not attest that the owner personally reviewed every record, invent specialist credentials, authorise unrelated quarantined content, send newsletters/social messages, or activate clinical, payment or workplace services."
  },
  "owner_instruction_sha256": "63249e7d1d06fc92dc11ccc3f7eaeb1b460ad03b0a3a956ba5a0337360fed510",
  "source_snapshot": {
    "workflow_run_id": "35138394950",
    "source_sha": "c633b3b4ba98ac914c44cfdbd289defff029de66",
    "captured_at": "2026-09-16T19:05:31.258Z",
    "raw_sha256": "24a8979cb8d2a06221af9211d162c36cdd97fec1234e00eef2044a7210e94cd9",
    "observation_review_sha256": "e167cfdf36cfe3ac8a71f36603a131d00377c00d4cffe28ce3835d35297588f1"
  },
  "articles": [
    {
      "event_id": 276,
      "contentPackage": {
        "headline": "Domperidone warning strengthened for rare adrenal tumour",
        "standfirst": "The MHRA has added a restriction for confirmed or suspected phaeochromocytoma after reports of severe hypertension.",
        "what_changed": "The MHRA has added a restriction for confirmed or suspected phaeochromocytoma after reports of severe hypertension.",
        "why_it_matters_to_uk": "Domperidone is used for nausea and vomiting. The update reinforces existing limits on its use and identifies specific considerations for palliative care. It is a targeted safety change, rather than a withdrawal of every domperidone product. The regulator's notice contains the detailed professional and patient advice, including circumstances requiring urgent medical attention. Treatment decisions belong with the patient's clinical team.",
        "known_facts": [
          {
            "claim": "Restriction covers confirmed or suspected phaeochromocytoma.",
            "source_url": "https://www.gov.uk/drug-safety-update/domperidone-new-contraindication-in-patients-with-phaeochromocytoma-due-to-the-risk-of-severe-hypertension"
          },
          {
            "claim": "European review: four reports; UK reports: none cited at publication.",
            "source_url": "https://www.gov.uk/drug-safety-update/domperidone-new-contraindication-in-patients-with-phaeochromocytoma-due-to-the-risk-of-severe-hypertension"
          },
          {
            "claim": "The notice concerns all domperidone product information.",
            "source_url": "https://www.gov.uk/drug-safety-update/domperidone-new-contraindication-in-patients-with-phaeochromocytoma-due-to-the-risk-of-severe-hypertension"
          }
        ],
        "unknowns": [
          "Report counts are not an incidence estimate or proof of causality in each individual report.",
          "The patient/professional advice should be checked by a qualified reviewer; this brief does not supply a replacement medicine or dosing plan.",
          "The source has an internal age/weight wording inconsistency in its reminder section; this draft deliberately does not restate dosing or eligibility thresholds."
        ],
        "safety": "General information, not individual medical advice. This article reports official sources and does not replace advice from your clinical team.",
        "article_markdown": "The UK medicines regulator has strengthened domperidone product information following a safety review involving people with phaeochromocytoma, a rare adrenal-gland tumour. Its [21 July 2026 notice](https://www.gov.uk/drug-safety-update/domperidone-new-contraindication-in-patients-with-phaeochromocytoma-due-to-the-risk-of-severe-hypertension) says the medicine is contraindicated when the condition is confirmed or suspected because of the risk of severe rises in blood pressure.\n\nA European review considered four reports. The MHRA said it had received no UK Yellow Card reports of this particular combination of medicine, condition and reaction at the time of the notice. Those figures describe reported events; they do not establish an individual patient's likelihood of harm.\n\nThe UK pharmacovigilance advisory committee supported the restriction. The notice also highlights that a severe blood-pressure episode after domperidone may reveal a previously unrecognised tumour, making clinical assessment important.\n\nDomperidone is used for nausea and vomiting. The update reinforces existing limits on its use and identifies specific considerations for palliative care. It is a targeted safety change, rather than a withdrawal of every domperidone product. The regulator's notice contains the detailed professional and patient advice, including circumstances requiring urgent medical attention. Treatment decisions belong with the patient's clinical team.",
        "ticker_line": "",
        "dossier_amendment": "",
        "destinations": [
          "medicine_news",
          "knowledge_links",
          "search",
          "sitemap"
        ],
        "seo": {
          "title": "Domperidone: MHRA adrenal tumour safety warning",
          "description": "MHRA adds a domperidone restriction for confirmed or suspected phaeochromocytoma following reports of severe hypertension.",
          "slug": "domperidone-phaeochromocytoma-mhra-warning-2026",
          "datePublished": "2026-09-16",
          "author": "SHIFT AI Newsroom",
          "reviewer": "Owner editorial approval; AI-assisted source review; no independent clinical review",
          "source_url": "https://www.gov.uk/drug-safety-update/domperidone-new-contraindication-in-patients-with-phaeochromocytoma-due-to-the-risk-of-severe-hypertension",
          "image": "/assets/og-default.jpg",
          "image_alt": "Domperidone warning strengthened for rare adrenal tumour",
          "keywords": [],
          "canonical": "https://shiftsometimber.co.uk/medicine-news/domperidone-phaeochromocytoma-mhra-warning-2026"
        }
      },
      "review": {
        "event_id": 276,
        "decision": "PASS",
        "decision_scope": "offline_primary_source_editorial_review",
        "input_json_sha256": "2ba7b897ea5223a0cb5ea83fc9c3133b3ae61dbe816393bf46822531fa3c92d9",
        "declared_content_sha256": "399d0ac11b4d13c4e80fbebb3578d8372a15f122f2bef808367a146ee284e2fb",
        "article_markdown_sha256": "42fd4ed7c79e985e69f04a3c2bc7f52c984c4aeab1927fac8965f5ced2509e90",
        "author": {
          "id": "/root/medicine_baselines",
          "kind": "ai"
        },
        "reviewer": {
          "id": "/root/commissioning_closeout",
          "kind": "ai"
        },
        "reviewed_at": "2026-09-16T18:27:14.870716Z",
        "review_notes": "The July 2026 targeted contraindication, confirmed/suspected condition, four European reports and no UK reports match the MHRA notice. The brief avoids converting reports into risk rates and does not repeat the source age/weight inconsistency.",
        "findings": [],
        "primary_sources_checked": [
          "https://www.gov.uk/drug-safety-update/domperidone-new-contraindication-in-patients-with-phaeochromocytoma-due-to-the-risk-of-severe-hypertension"
        ],
        "qualified_review_status": "PENDING",
        "publication_authorized": false
      },
      "reviewed_primary_urls": [
        "https://www.gov.uk/drug-safety-update/domperidone-new-contraindication-in-patients-with-phaeochromocytoma-due-to-the-risk-of-severe-hypertension"
      ],
      "snapshot": {
        "id": 276,
        "event_key": "3ea1d9daff6556fa8aa58593df34c4d2b0db67b1ac7bffe07aaa1a3f1808c5ac",
        "status": "hold",
        "headline": "Domperidone: new contraindication in patients with phaeochromocytoma due to the risk of severe hypertension",
        "region": "UK",
        "regulator": "MHRA",
        "clinical": 1,
        "requires_review": 1,
        "source_evidence_json": "[{\"source_tier\":1,\"authority\":\"MHRA\",\"title\":\"Domperidone: new contraindication in patients with phaeochromocytoma due to the risk of severe hypertension\",\"url\":\"https://www.gov.uk/drug-safety-update/domperidone-new-contraindication-in-patients-with-phaeochromocytoma-due-to-the-risk-of-severe-hypertension\",\"source_date\":\"2026-07-21T13:00:37.000Z\",\"source_feed\":\"https://www.gov.uk/drug-safety-update.atom\",\"scan_source\":\"mhra-drug-safety\",\"retrieved_at\":\"2026-09-13T06:54:47.165Z\"}]",
        "verification_json": "{\"verified\":true,\"evidence_level\":1,\"regulator_confirmed\":true,\"confidence\":97,\"reason\":\"Regulatory or UK authority evidence present\",\"conflicts\":[]}",
        "medicine_patch_json": "{\"medicine_id\":\"\",\"brand\":\"\",\"generic_name\":\"Domperidone\",\"developer\":\"\",\"mechanism\":[],\"formulation\":\"\",\"global_stage\":\"\",\"uk_regulatory_status\":\"\",\"uk_commercial_status\":\"\",\"nice_status\":\"\",\"nhs_status\":\"\",\"latest_update_text\":\"new contraindication in patients with phaeochromocytoma due to the risk of severe hypertension\",\"radar_score\":84,\"regions\":[\"UK\"],\"unknowns\":[],\"review_flags\":[\"requires_review\"]}",
        "content_package_json": "{\"headline\":\"Domperidone Contraindication Updated for Phaeochromocytoma Patients\",\"standfirst\":\"The MHRA has issued a drug safety update for Domperidone, introducing a new contraindication for patients with phaeochromocytoma due to the risk of severe hypertension\",\"what_changed\":\"A new contraindication has been added for Domperidone in patients with phaeochromocytoma, highlighting the risk of severe hypertension\",\"why_it_matters_to_uk\":\"This update is significant for UK patients and healthcare professionals, as it provides crucial information on the safe use of Domperidone and helps prevent potential adverse effects in patients with phaeochromocytoma\",\"known_facts\":[{\"claim\":\"The MHRA has introduced a new contraindication for Domperidone in patients with phaeochromocytoma\",\"source_url\":\"https://www.gov.uk/drug-safety-update/domperidone-new-contraindication-in-patients-with-phaeochromocytoma-due-to-the-risk-of-severe-hypertension\"}],\"unknowns\":[],\"safety\":\"The MHRA's update highlights the importance of careful patient selection and monitoring when prescribing Domperidone, particularly in patients with phaeochromocytoma\",\"article_markdown\":\"The UK's Medicines and Healthcare products Regulatory Agency (MHRA) has issued a [drug safety update](https://www.gov.uk/drug-safety-update/domperidone-new-contraindication-in-patients-with-phaeochromocytoma-due-to-the-risk-of-severe-hypertension) for Domperidone, introducing a new contraindication for patients with phaeochromocytoma due to the risk of severe hypertension. This update is crucial for healthcare professionals and patients in the UK, as it provides essential information on the safe use of Domperidone.\",\"ticker_line\":\"Domperidone: New Contraindication for Phaeochromocytoma Patients\",\"dossier_amendment\":\"The Domperidone dossier has been updated to reflect the new contraindication for patients with phaeochromocytoma\",\"existing_page_updates\":[{\"content_key\":\"Domperidone\",\"change\":\"Add new contraindication for phaeochromocytoma patients\"}],\"seo\":{\"title\":\"Domperidone Contraindication Update for Phaeochromocytoma Patients\",\"description\":\"The MHRA has introduced a new contraindication for Domperidone in patients with phaeochromocytoma, highlighting the risk of severe hypertension\",\"slug\":\"domperidone-contraindication-update\",\"keywords\":[\"Domperidone\",\"phaeochromocytoma\",\"contraindication\",\"MHRA\",\"drug safety update\"]},\"shift_brain\":{\"summary\":\"The MHRA has updated the contraindications for Domperidone, introducing a new warning for patients with phaeochromocytoma due to the risk of severe hypertension\",\"facts\":[{\"fact\":\"The MHRA has introduced a new contraindication for Domperidone in patients with phaeochromocytoma\",\"source_url\":\"https://www.gov.uk/drug-safety-update/domperidone-new-contraindication-in-patients-with-phaeochromocytoma-due-to-the-risk-of-severe-hypertension\"}]},\"review_flags\":[]}",
        "reviewed_at": null,
        "created_at": "2026-09-13T06:54:47.165Z",
        "updated_at": "2026-09-16T11:45:15.781Z",
        "source_review_generation": 0
      },
      "pending_source_change": {
        "id": 4734,
        "observed_at": "2026-09-16 11:45:15",
        "source": "mhra-drug-safety",
        "url": "https://www.gov.uk/drug-safety-update/domperidone-new-contraindication-in-patients-with-phaeochromocytoma-due-to-the-risk-of-severe-hypertension",
        "fingerprint": "[\"Domperidone: new contraindication in patients with phaeochromocytoma due to the risk of severe hypertension\",[[\"https://www.gov.uk/drug-safety-update/domperidone-new-contraindication-in-patients-with-phaeochromocytoma-due-to-the-risk-of-severe-hypertension\",\"Domperidone: new contraindication in patients with phaeochromocytoma due to the risk of severe hypertension\",\"2026-07-21T13:00:37.000Z\",\"2026-07-21T13:00:37.000Z\",\"The product information has been updated for all domperidone products, to include a contraindication for patients with confirmed or suspected phaeochromocytoma (a rare tumour of the adrenal gland), due to the risk of episode…\",\"MHRA\",1]]]",
        "observation": {
          "headline": "Domperidone: new contraindication in patients with phaeochromocytoma due to the risk of severe hypertension",
          "evidence": [
            {
              "source_tier": 1,
              "authority": "MHRA",
              "title": "Domperidone: new contraindication in patients with phaeochromocytoma due to the risk of severe hypertension",
              "url": "https://www.gov.uk/drug-safety-update/domperidone-new-contraindication-in-patients-with-phaeochromocytoma-due-to-the-risk-of-severe-hypertension",
              "summary": "The product information has been updated for all domperidone products, to include a contraindication for patients with confirmed or suspected phaeochromocytoma (a rare tumour of the adrenal gland), due to the risk of episode…",
              "publisher": "MHRA",
              "discovery_only": false,
              "source_updated_at": "2026-07-21T13:00:37.000Z",
              "source_date": "2026-07-21T13:00:37.000Z",
              "source_feed": "https://www.gov.uk/drug-safety-update.atom",
              "scan_source": "mhra-drug-safety",
              "retrieved_at": "2026-09-16T11:45:14.959Z"
            }
          ],
          "verification": {
            "verified": true,
            "confidence": 99,
            "reason": "Primary regulator or UK authority source",
            "conflicts": []
          },
          "confidence": 99,
          "scores": {
            "urgency": 92,
            "relevance": 75
          },
          "region": "UK"
        },
        "reviewed_snapshot": {
          "id": 276,
          "event_key": "3ea1d9daff6556fa8aa58593df34c4d2b0db67b1ac7bffe07aaa1a3f1808c5ac",
          "status": "ready_for_review",
          "headline": "Domperidone: new contraindication in patients with phaeochromocytoma due to the risk of severe hypertension",
          "region": "UK",
          "regulator": "MHRA",
          "event_type": "drug_safety_update",
          "relevance_score": 75,
          "urgency_score": 92,
          "confidence_score": 97,
          "clinical": 1,
          "requires_review": 1,
          "source_evidence_json": "[{\"source_tier\":1,\"authority\":\"MHRA\",\"title\":\"Domperidone: new contraindication in patients with phaeochromocytoma due to the risk of severe hypertension\",\"url\":\"https://www.gov.uk/drug-safety-update/domperidone-new-contraindication-in-patients-with-phaeochromocytoma-due-to-the-risk-of-severe-hypertension\",\"source_date\":\"2026-07-21T13:00:37.000Z\",\"source_feed\":\"https://www.gov.uk/drug-safety-update.atom\",\"scan_source\":\"mhra-drug-safety\",\"retrieved_at\":\"2026-09-13T06:54:47.165Z\"}]",
          "verification_json": "{\"verified\":true,\"evidence_level\":1,\"regulator_confirmed\":true,\"confidence\":97,\"reason\":\"Regulatory or UK authority evidence present\",\"conflicts\":[]}",
          "medicine_patch_json": "{\"medicine_id\":\"\",\"brand\":\"\",\"generic_name\":\"Domperidone\",\"developer\":\"\",\"mechanism\":[],\"formulation\":\"\",\"global_stage\":\"\",\"uk_regulatory_status\":\"\",\"uk_commercial_status\":\"\",\"nice_status\":\"\",\"nhs_status\":\"\",\"latest_update_text\":\"new contraindication in patients with phaeochromocytoma due to the risk of severe hypertension\",\"radar_score\":84,\"regions\":[\"UK\"],\"unknowns\":[],\"review_flags\":[\"requires_review\"]}",
          "content_package_json": "{\"headline\":\"Domperidone Contraindication Updated for Phaeochromocytoma Patients\",\"standfirst\":\"The MHRA has issued a drug safety update for Domperidone, introducing a new contraindication for patients with phaeochromocytoma due to the risk of severe hypertension\",\"what_changed\":\"A new contraindication has been added for Domperidone in patients with phaeochromocytoma, highlighting the risk of severe hypertension\",\"why_it_matters_to_uk\":\"This update is significant for UK patients and healthcare professionals, as it provides crucial information on the safe use of Domperidone and helps prevent potential adverse effects in patients with phaeochromocytoma\",\"known_facts\":[{\"claim\":\"The MHRA has introduced a new contraindication for Domperidone in patients with phaeochromocytoma\",\"source_url\":\"https://www.gov.uk/drug-safety-update/domperidone-new-contraindication-in-patients-with-phaeochromocytoma-due-to-the-risk-of-severe-hypertension\"}],\"unknowns\":[],\"safety\":\"The MHRA's update highlights the importance of careful patient selection and monitoring when prescribing Domperidone, particularly in patients with phaeochromocytoma\",\"article_markdown\":\"The UK's Medicines and Healthcare products Regulatory Agency (MHRA) has issued a [drug safety update](https://www.gov.uk/drug-safety-update/domperidone-new-contraindication-in-patients-with-phaeochromocytoma-due-to-the-risk-of-severe-hypertension) for Domperidone, introducing a new contraindication for patients with phaeochromocytoma due to the risk of severe hypertension. This update is crucial for healthcare professionals and patients in the UK, as it provides essential information on the safe use of Domperidone.\",\"ticker_line\":\"Domperidone: New Contraindication for Phaeochromocytoma Patients\",\"dossier_amendment\":\"The Domperidone dossier has been updated to reflect the new contraindication for patients with phaeochromocytoma\",\"existing_page_updates\":[{\"content_key\":\"Domperidone\",\"change\":\"Add new contraindication for phaeochromocytoma patients\"}],\"seo\":{\"title\":\"Domperidone Contraindication Update for Phaeochromocytoma Patients\",\"description\":\"The MHRA has introduced a new contraindication for Domperidone in patients with phaeochromocytoma, highlighting the risk of severe hypertension\",\"slug\":\"domperidone-contraindication-update\",\"keywords\":[\"Domperidone\",\"phaeochromocytoma\",\"contraindication\",\"MHRA\",\"drug safety update\"]},\"shift_brain\":{\"summary\":\"The MHRA has updated the contraindications for Domperidone, introducing a new warning for patients with phaeochromocytoma due to the risk of severe hypertension\",\"facts\":[{\"fact\":\"The MHRA has introduced a new contraindication for Domperidone in patients with phaeochromocytoma\",\"source_url\":\"https://www.gov.uk/drug-safety-update/domperidone-new-contraindication-in-patients-with-phaeochromocytoma-due-to-the-risk-of-severe-hypertension\"}]},\"review_flags\":[]}",
          "review_note": null,
          "reviewed_by": null,
          "reviewed_at": null,
          "created_at": "2026-09-13T06:54:47.165Z",
          "updated_at": "2026-09-13T07:00:56.603Z"
        }
      },
      "source_observation_review": {
        "event_id": 276,
        "kind": "ai",
        "reviewer": "/root/medicine_baselines",
        "decision": "PASS",
        "sha256": "721dc6013428e2ce9388191c2b42295e2b5e7e2a03ec31114f16630364fb53b6",
        "notes": "Observation 4734 names the same MHRA domperidone notice and confirmed/suspected phaeochromocytoma restriction as the complete primary page previously read. Source day 21 July 2026 agrees. Four European reports and no UK report at notice are contextualised in the exact reviewed body; no incidence calculation or individual treatment instruction."
      },
      "first_publication_at": null
    },
    {
      "event_id": 279,
      "contentPackage": {
        "headline": "IXCHIQ: the 2025 pause was replaced by stricter rules",
        "standfirst": "An archived suspension for people aged 65 and over now points to the completed UK safety review.",
        "what_changed": "An archived suspension for people aged 65 and over now points to the completed UK safety review.",
        "why_it_matters_to_uk": "This archive story records that sequence. The linked replacement notice provides the operative detail, and suitability remains a matter for a trained healthcare professional’s assessment. Reporting the historical pause alone would leave travellers with an outdated account of the UK position. [MHRA source](https://www.gov.uk/drug-safety-update/ixchiq-chikungunya-vaccine-updates-to-restrictions-of-use-following-safety-review)",
        "known_facts": [
          {
            "claim": "June 2025 notice explicitly superseded.",
            "source_url": "https://www.gov.uk/drug-safety-update/ixchiq-chikungunya-vaccine-temporary-suspension-in-people-aged-65-years-or-older"
          },
          {
            "claim": "February 2026 announcement narrows use to 18–59.",
            "source_url": "https://www.gov.uk/government/news/mhra-introduces-additional-restrictions-for-use-of-the-chikungunya-vaccine-ixchiq"
          }
        ],
        "unknowns": [
          "Historical chronology article; the 2025 temporary 65+ threshold must not be displayed as current advice.",
          "Serious-event reports are safety signals, not a population incidence estimate."
        ],
        "safety": "General information, not individual medical advice. This article reports official sources and does not replace advice from your clinical team.",
        "article_markdown": "The MHRA’s June 2025 temporary pause on IXCHIQ vaccination for people aged 65 and over is historical advice. The notice now carries a February 2026 post-publication note directing readers to a replacement safety update. The original age threshold should therefore not be presented as the current UK rule. [MHRA source](https://www.gov.uk/drug-safety-update/ixchiq-chikungunya-vaccine-temporary-suspension-in-people-aged-65-years-or-older)\n\nThe initial precaution followed global reports of serious reactions, including deaths, while regulators assessed the vaccine’s safety. IXCHIQ contains a weakened live chikungunya virus; the early notice also highlighted restrictions for people whose immune systems were weakened. That investigation was still open when the June article appeared. [MHRA source](https://www.gov.uk/drug-safety-update/ixchiq-chikungunya-vaccine-temporary-suspension-in-people-aged-65-years-or-older)\n\nThe completed review led to tighter restrictions on 11 February 2026. The MHRA’s accompanying announcement limits use to adults aged 18–59 without specified contraindications. It also introduces precautions concerning underlying illness and timing before travel. The agency describes these as permanent restrictions following the review, replacing the temporary pause. [MHRA source](https://www.gov.uk/government/news/mhra-introduces-additional-restrictions-for-use-of-the-chikungunya-vaccine-ixchiq)\n\nThis archive story records that sequence. The linked replacement notice provides the operative detail, and suitability remains a matter for a trained healthcare professional’s assessment. Reporting the historical pause alone would leave travellers with an outdated account of the UK position. [MHRA source](https://www.gov.uk/drug-safety-update/ixchiq-chikungunya-vaccine-updates-to-restrictions-of-use-following-safety-review)",
        "ticker_line": "",
        "dossier_amendment": "",
        "destinations": [
          "medicine_news",
          "knowledge_links",
          "search",
          "sitemap"
        ],
        "seo": {
          "slug": "ixchiq-2025-pause-superseded-2026-review",
          "title": "IXCHIQ: why the 2025 pause is historical",
          "description": "The archived IXCHIQ notice has been superseded. Read the review chronology and current MHRA source.",
          "datePublished": "2026-09-16",
          "author": "SHIFT AI Newsroom",
          "reviewer": "Owner editorial approval; AI-assisted source review; no independent clinical review",
          "source_url": "https://www.gov.uk/drug-safety-update/ixchiq-chikungunya-vaccine-temporary-suspension-in-people-aged-65-years-or-older",
          "image": "/assets/og-default.jpg",
          "image_alt": "IXCHIQ: the 2025 pause was replaced by stricter rules",
          "keywords": [],
          "canonical": "https://shiftsometimber.co.uk/medicine-news/ixchiq-2025-pause-superseded-2026-review"
        }
      },
      "review": {
        "event_id": 279,
        "decision": "PASS",
        "decision_scope": "offline_primary_source_editorial_review",
        "input_json_sha256": "b25fac5619cc5f2a15bbedeece85630cd0feac9396906d749201f810c509bc41",
        "declared_content_sha256": "14c746eb140dd3f4ebe5dabed9b2bb303f8796aab593381ea260670f8c9c1856",
        "article_markdown_sha256": "bdd9f6421f3657d7d03570289e565dcc197f2a7a5b3672dc8057cef3ed092684",
        "author": {
          "id": "/root/grub_closeout",
          "kind": "ai"
        },
        "reviewer": {
          "id": "/root/commissioning_closeout",
          "kind": "ai"
        },
        "reviewed_at": "2026-09-16T18:27:14.870716Z",
        "review_notes": "The June 2025 notice explicitly directs readers to its February 2026 replacement. The draft correctly treats the 65+ pause as historical and links the later 18–59 restrictions; it does not present the old threshold as current.",
        "findings": [],
        "primary_sources_checked": [
          "https://www.gov.uk/drug-safety-update/ixchiq-chikungunya-vaccine-temporary-suspension-in-people-aged-65-years-or-older",
          "https://www.gov.uk/drug-safety-update/ixchiq-chikungunya-vaccine-updates-to-restrictions-of-use-following-safety-review",
          "https://www.gov.uk/government/news/mhra-introduces-additional-restrictions-for-use-of-the-chikungunya-vaccine-ixchiq"
        ],
        "qualified_review_status": "PENDING",
        "publication_authorized": false
      },
      "reviewed_primary_urls": [
        "https://www.gov.uk/drug-safety-update/ixchiq-chikungunya-vaccine-temporary-suspension-in-people-aged-65-years-or-older",
        "https://www.gov.uk/drug-safety-update/ixchiq-chikungunya-vaccine-updates-to-restrictions-of-use-following-safety-review",
        "https://www.gov.uk/government/news/mhra-introduces-additional-restrictions-for-use-of-the-chikungunya-vaccine-ixchiq"
      ],
      "snapshot": {
        "id": 279,
        "event_key": "1a09594b5d353208d88962d6c4a505b68e5f543eb885518b2894978181622c3f",
        "status": "hold",
        "headline": "IXCHIQ Chikungunya vaccine: temporary suspension in people aged 65 years or older",
        "region": "UK",
        "regulator": "MHRA",
        "clinical": 1,
        "requires_review": 1,
        "source_evidence_json": "[{\"source_tier\":1,\"authority\":\"MHRA\",\"title\":\"IXCHIQ Chikungunya vaccine: temporary suspension in people aged 65 years or older\",\"url\":\"https://www.gov.uk/drug-safety-update/ixchiq-chikungunya-vaccine-temporary-suspension-in-people-aged-65-years-or-older\",\"source_date\":\"2026-02-11T15:01:50.000Z\",\"source_feed\":\"https://www.gov.uk/drug-safety-update.atom\",\"scan_source\":\"mhra-drug-safety\",\"retrieved_at\":\"2026-09-13T06:54:47.831Z\"}]",
        "verification_json": "{\"verified\":true,\"evidence_level\":1,\"regulator_confirmed\":true,\"confidence\":97,\"reason\":\"Regulatory or UK authority evidence present\",\"conflicts\":[]}",
        "medicine_patch_json": "{\"medicine_id\":\"\",\"brand\":\"IXCHIQ\",\"generic_name\":\"Chikungunya vaccine\",\"developer\":\"\",\"mechanism\":[],\"formulation\":\"\",\"global_stage\":\"\",\"uk_regulatory_status\":\"\",\"uk_commercial_status\":\"\",\"nice_status\":\"\",\"nhs_status\":\"\",\"latest_update_text\":\"Temporary suspension in people aged 65 years or older\",\"radar_score\":85,\"regions\":[\"UK\"],\"unknowns\":[\"developer\",\"mechanism\",\"formulation\",\"global_stage\",\"uk_regulatory_status\",\"uk_commercial_status\",\"nice_status\",\"nhs_status\"],\"review_flags\":[\"requires_review\"]}",
        "content_package_json": "{\"headline\":\"Temporary Suspension of IXCHIQ Chikungunya Vaccine in People Aged 65 and Over\",\"standfirst\":\"The MHRA has announced a temporary suspension of the IXCHIQ Chikungunya vaccine in people aged 65 years or older.\",\"what_changed\":\"The use of the IXCHIQ Chikungunya vaccine has been temporarily suspended in people aged 65 years or older.\",\"why_it_matters_to_uk\":\"This temporary suspension may impact the vaccination strategy for Chikungunya in the UK, particularly for older adults.\",\"known_facts\":[{\"claim\":\"The MHRA has announced a temporary suspension of the IXCHIQ Chikungunya vaccine in people aged 65 years or older.\",\"source_url\":\"https://www.gov.uk/drug-safety-update/ixchiq-chikungunya-vaccine-temporary-suspension-in-people-aged-65-years-or-older\"}],\"unknowns\":[\"The developer of the IXCHIQ Chikungunya vaccine\",\"The mechanism of the IXCHIQ Chikungunya vaccine\",\"The formulation of the IXCHIQ Chikungunya vaccine\",\"The global stage of the IXCHIQ Chikungunya vaccine\",\"The UK regulatory status of the IXCHIQ Chikungunya vaccine\",\"The UK commercial status of the IXCHIQ Chikungunya vaccine\",\"The NICE status of the IXCHIQ Chikungunya vaccine\",\"The NHS status of the IXCHIQ Chikungunya vaccine\"],\"safety\":\"The temporary suspension of the IXCHIQ Chikungunya vaccine in people aged 65 years or older may indicate potential safety concerns in this age group.\",\"article_markdown\":\"The UK's Medicines and Healthcare products Regulatory Agency (MHRA) has announced a temporary suspension of the IXCHIQ Chikungunya vaccine in people aged 65 years or older. This decision may impact the vaccination strategy for Chikungunya in the UK, particularly for older adults.\",\"ticker_line\":\"IXCHIQ Chikungunya Vaccine Suspended in UK for People Aged 65 and Over\",\"dossier_amendment\":\"Update the IXCHIQ Chikungunya vaccine dossier to reflect the temporary suspension in people aged 65 years or older.\",\"existing_page_updates\":[{\"content_key\":\"vaccine_suspension\",\"change\":\"Add information about the temporary suspension of the IXCHIQ Chikungunya vaccine in people aged 65 years or older.\"}],\"seo\":{\"title\":\"IXCHIQ Chikungunya Vaccine Temporary Suspension in UK\",\"description\":\"The MHRA has announced a temporary suspension of the IXCHIQ Chikungunya vaccine in people aged 65 years or older in the UK.\",\"slug\":\"ixchiq-chikungunya-vaccine-suspension-uk\",\"keywords\":[\"IXCHIQ\",\"Chikungunya vaccine\",\"temporary suspension\",\"UK\",\"MHRA\"]},\"shift_brain\":{\"summary\":\"The IXCHIQ Chikungunya vaccine has been temporarily suspended in people aged 65 years or older in the UK due to potential safety concerns.\",\"facts\":[{\"fact\":\"The MHRA has announced a temporary suspension of the IXCHIQ Chikungunya vaccine in people aged 65 years or older.\",\"source_url\":\"https://www.gov.uk/drug-safety-update/ixchiq-chikungunya-vaccine-temporary-suspension-in-people-aged-65-years-or-older\"}]},\"review_flags\":[\"requires_review\"],\"editorial_cadence\":true,\"editorial_candidate_at\":\"2026-09-13T22:16:10.426Z\"}",
        "reviewed_at": null,
        "created_at": "2026-09-13T06:54:47.831Z",
        "updated_at": "2026-09-16T11:45:18.069Z",
        "source_review_generation": 0
      },
      "pending_source_change": {
        "id": 4748,
        "observed_at": "2026-09-16 11:45:18",
        "source": "mhra-drug-safety",
        "url": "https://www.gov.uk/drug-safety-update/ixchiq-chikungunya-vaccine-temporary-suspension-in-people-aged-65-years-or-older",
        "fingerprint": "[\"IXCHIQ Chikungunya vaccine: temporary suspension in people aged 65 years or older\",[[\"https://www.gov.uk/drug-safety-update/ixchiq-chikungunya-vaccine-temporary-suspension-in-people-aged-65-years-or-older\",\"IXCHIQ Chikungunya vaccine: temporary suspension in people aged 65 years or older\",\"2026-02-11T15:01:50.000Z\",\"2026-02-11T15:01:50.000Z\",\"The Commission on Human Medicines (CHM) has temporarily restricted use of the IXCHIQ Chikungunya vaccine in people aged 65 years and over following very rare fatal reactions reported globally. This is a precautionary measure…\",\"MHRA\",1]]]",
        "observation": {
          "headline": "IXCHIQ Chikungunya vaccine: temporary suspension in people aged 65 years or older",
          "evidence": [
            {
              "source_tier": 1,
              "authority": "MHRA",
              "title": "IXCHIQ Chikungunya vaccine: temporary suspension in people aged 65 years or older",
              "url": "https://www.gov.uk/drug-safety-update/ixchiq-chikungunya-vaccine-temporary-suspension-in-people-aged-65-years-or-older",
              "summary": "The Commission on Human Medicines (CHM) has temporarily restricted use of the IXCHIQ Chikungunya vaccine in people aged 65 years and over following very rare fatal reactions reported globally. This is a precautionary measure…",
              "publisher": "MHRA",
              "discovery_only": false,
              "source_updated_at": "2026-02-11T15:01:50.000Z",
              "source_date": "2026-02-11T15:01:50.000Z",
              "source_feed": "https://www.gov.uk/drug-safety-update.atom",
              "scan_source": "mhra-drug-safety",
              "retrieved_at": "2026-09-16T11:45:17.480Z"
            }
          ],
          "verification": {
            "verified": true,
            "confidence": 99,
            "reason": "Primary regulator or UK authority source",
            "conflicts": []
          },
          "confidence": 99,
          "scores": {
            "urgency": 95,
            "relevance": 75
          },
          "region": "UK"
        },
        "reviewed_snapshot": {
          "id": 279,
          "event_key": "1a09594b5d353208d88962d6c4a505b68e5f543eb885518b2894978181622c3f",
          "status": "ready_for_review",
          "headline": "IXCHIQ Chikungunya vaccine: temporary suspension in people aged 65 years or older",
          "region": "UK",
          "regulator": "MHRA",
          "event_type": "drug_safety_update",
          "relevance_score": 75,
          "urgency_score": 95,
          "confidence_score": 97,
          "clinical": 1,
          "requires_review": 1,
          "source_evidence_json": "[{\"source_tier\":1,\"authority\":\"MHRA\",\"title\":\"IXCHIQ Chikungunya vaccine: temporary suspension in people aged 65 years or older\",\"url\":\"https://www.gov.uk/drug-safety-update/ixchiq-chikungunya-vaccine-temporary-suspension-in-people-aged-65-years-or-older\",\"source_date\":\"2026-02-11T15:01:50.000Z\",\"source_feed\":\"https://www.gov.uk/drug-safety-update.atom\",\"scan_source\":\"mhra-drug-safety\",\"retrieved_at\":\"2026-09-13T06:54:47.831Z\"}]",
          "verification_json": "{\"verified\":true,\"evidence_level\":1,\"regulator_confirmed\":true,\"confidence\":97,\"reason\":\"Regulatory or UK authority evidence present\",\"conflicts\":[]}",
          "medicine_patch_json": "{\"medicine_id\":\"\",\"brand\":\"IXCHIQ\",\"generic_name\":\"Chikungunya vaccine\",\"developer\":\"\",\"mechanism\":[],\"formulation\":\"\",\"global_stage\":\"\",\"uk_regulatory_status\":\"\",\"uk_commercial_status\":\"\",\"nice_status\":\"\",\"nhs_status\":\"\",\"latest_update_text\":\"Temporary suspension in people aged 65 years or older\",\"radar_score\":85,\"regions\":[\"UK\"],\"unknowns\":[\"developer\",\"mechanism\",\"formulation\",\"global_stage\",\"uk_regulatory_status\",\"uk_commercial_status\",\"nice_status\",\"nhs_status\"],\"review_flags\":[\"requires_review\"]}",
          "content_package_json": "{\"headline\":\"Temporary Suspension of IXCHIQ Chikungunya Vaccine in People Aged 65 and Over\",\"standfirst\":\"The MHRA has announced a temporary suspension of the IXCHIQ Chikungunya vaccine in people aged 65 years or older.\",\"what_changed\":\"The use of the IXCHIQ Chikungunya vaccine has been temporarily suspended in people aged 65 years or older.\",\"why_it_matters_to_uk\":\"This temporary suspension may impact the vaccination strategy for Chikungunya in the UK, particularly for older adults.\",\"known_facts\":[{\"claim\":\"The MHRA has announced a temporary suspension of the IXCHIQ Chikungunya vaccine in people aged 65 years or older.\",\"source_url\":\"https://www.gov.uk/drug-safety-update/ixchiq-chikungunya-vaccine-temporary-suspension-in-people-aged-65-years-or-older\"}],\"unknowns\":[\"The developer of the IXCHIQ Chikungunya vaccine\",\"The mechanism of the IXCHIQ Chikungunya vaccine\",\"The formulation of the IXCHIQ Chikungunya vaccine\",\"The global stage of the IXCHIQ Chikungunya vaccine\",\"The UK regulatory status of the IXCHIQ Chikungunya vaccine\",\"The UK commercial status of the IXCHIQ Chikungunya vaccine\",\"The NICE status of the IXCHIQ Chikungunya vaccine\",\"The NHS status of the IXCHIQ Chikungunya vaccine\"],\"safety\":\"The temporary suspension of the IXCHIQ Chikungunya vaccine in people aged 65 years or older may indicate potential safety concerns in this age group.\",\"article_markdown\":\"The UK's Medicines and Healthcare products Regulatory Agency (MHRA) has announced a temporary suspension of the IXCHIQ Chikungunya vaccine in people aged 65 years or older. This decision may impact the vaccination strategy for Chikungunya in the UK, particularly for older adults.\",\"ticker_line\":\"IXCHIQ Chikungunya Vaccine Suspended in UK for People Aged 65 and Over\",\"dossier_amendment\":\"Update the IXCHIQ Chikungunya vaccine dossier to reflect the temporary suspension in people aged 65 years or older.\",\"existing_page_updates\":[{\"content_key\":\"vaccine_suspension\",\"change\":\"Add information about the temporary suspension of the IXCHIQ Chikungunya vaccine in people aged 65 years or older.\"}],\"seo\":{\"title\":\"IXCHIQ Chikungunya Vaccine Temporary Suspension in UK\",\"description\":\"The MHRA has announced a temporary suspension of the IXCHIQ Chikungunya vaccine in people aged 65 years or older in the UK.\",\"slug\":\"ixchiq-chikungunya-vaccine-suspension-uk\",\"keywords\":[\"IXCHIQ\",\"Chikungunya vaccine\",\"temporary suspension\",\"UK\",\"MHRA\"]},\"shift_brain\":{\"summary\":\"The IXCHIQ Chikungunya vaccine has been temporarily suspended in people aged 65 years or older in the UK due to potential safety concerns.\",\"facts\":[{\"fact\":\"The MHRA has announced a temporary suspension of the IXCHIQ Chikungunya vaccine in people aged 65 years or older.\",\"source_url\":\"https://www.gov.uk/drug-safety-update/ixchiq-chikungunya-vaccine-temporary-suspension-in-people-aged-65-years-or-older\"}]},\"review_flags\":[\"requires_review\"],\"editorial_cadence\":true,\"editorial_candidate_at\":\"2026-09-13T22:16:10.426Z\"}",
          "review_note": null,
          "reviewed_by": null,
          "reviewed_at": null,
          "created_at": "2026-09-13T06:54:47.831Z",
          "updated_at": "2026-09-13T22:16:10.426Z"
        }
      },
      "source_observation_review": {
        "event_id": 279,
        "kind": "ai",
        "reviewer": "/root/medicine_baselines",
        "decision": "PASS",
        "sha256": "3dd07be9e8179621c6dfd6dcdf434e50a480d4245b59c9663507968e0fe1fa7c",
        "notes": "Observation 4748 is the historical IXCHIQ suspension page, not the current eligibility rule. Feed source_date is 11 February 2026 (the page update), while its original notice was 18 June 2025. The exact reviewed article explicitly identifies the archived temporary 65+ pause and links the replacement February 2026 review; the original publication date is not inferred from the feed update."
      },
      "first_publication_at": null
    },
    {
      "event_id": 281,
      "contentPackage": {
        "headline": "UK tightens IXCHIQ restrictions after safety review",
        "standfirst": "February 2026 advice excludes people aged 60 and over and adds restrictions for several chronic conditions.",
        "what_changed": "February 2026 advice excludes people aged 60 and over and adds restrictions for several chronic conditions.",
        "why_it_matters_to_uk": "The regulator still considers the balance favourable for eligible adults at risk of infection. Chikungunya is mainly transmitted by infected mosquitoes. The detailed notice says an alternative vaccine is available when IXCHIQ is unsuitable; selecting an option requires a travel-health assessment. These are product-specific restrictions, not a statement that every chikungunya vaccine has the same limitations. [MHRA source](https://www.gov.uk/drug-safety-update/ixchiq-chikungunya-vaccine-updates-to-restrictions-of-use-following-safety-review)",
        "known_facts": [
          {
            "claim": "The detailed advice uses 60 or over, including age 60.",
            "source_url": "https://www.gov.uk/drug-safety-update/ixchiq-chikungunya-vaccine-updates-to-restrictions-of-use-following-safety-review"
          },
          {
            "claim": "Travel precaution: at least 30 days beforehand.",
            "source_url": "https://www.gov.uk/government/news/mhra-introduces-additional-restrictions-for-use-of-the-chikungunya-vaccine-ixchiq"
          }
        ],
        "unknowns": [
          "The source summary says over 60, but its explicit professional advice and accompanying MHRA announcement say 60 or over; this draft follows the explicit recommendation.",
          "No individual vaccine eligibility or alternative product recommendation is given."
        ],
        "safety": "General information, not individual medical advice. This article reports official sources and does not replace advice from your clinical team.",
        "article_markdown": "The MHRA has tightened the UK restrictions on IXCHIQ after completing its safety review. Its 11 February 2026 announcement says the chikungunya vaccine should be used only in adults aged 18–59, replacing the earlier temporary pause for those aged 65 and over. [MHRA source](https://www.gov.uk/government/news/mhra-introduces-additional-restrictions-for-use-of-the-chikungunya-vaccine-ixchiq)\n\nThe updated advice excludes people with high blood pressure, cardiovascular disease, diabetes or chronic kidney disease. Existing restrictions relating to immune deficiency or immune suppression remain relevant, including the specified thymus conditions. A trained healthcare professional must assess the balance of benefits and risks before vaccination, with particular caution when someone has multiple underlying conditions. [MHRA source](https://www.gov.uk/drug-safety-update/ixchiq-chikungunya-vaccine-updates-to-restrictions-of-use-following-safety-review)\n\nThe review also recommends vaccination at least 30 days before travel, so a serious reaction could be assessed while the person remains in the UK. The announcement cited 28 globally reported serious reactions, including three deaths; those reports do not provide a population risk rate. [MHRA source](https://www.gov.uk/government/news/mhra-introduces-additional-restrictions-for-use-of-the-chikungunya-vaccine-ixchiq)\n\nThe regulator still considers the balance favourable for eligible adults at risk of infection. Chikungunya is mainly transmitted by infected mosquitoes. The detailed notice says an alternative vaccine is available when IXCHIQ is unsuitable; selecting an option requires a travel-health assessment. These are product-specific restrictions, not a statement that every chikungunya vaccine has the same limitations. [MHRA source](https://www.gov.uk/drug-safety-update/ixchiq-chikungunya-vaccine-updates-to-restrictions-of-use-following-safety-review)",
        "ticker_line": "",
        "dossier_amendment": "",
        "destinations": [
          "medicine_news",
          "knowledge_links",
          "search",
          "sitemap"
        ],
        "seo": {
          "slug": "ixchiq-uk-restrictions-safety-review-2026",
          "title": "IXCHIQ UK restrictions after 2026 review",
          "description": "The MHRA has revised IXCHIQ age and health-condition restrictions following its safety review.",
          "datePublished": "2026-09-16",
          "author": "SHIFT AI Newsroom",
          "reviewer": "Owner editorial approval; AI-assisted source review; no independent clinical review",
          "source_url": "https://www.gov.uk/drug-safety-update/ixchiq-chikungunya-vaccine-updates-to-restrictions-of-use-following-safety-review",
          "image": "/assets/og-default.jpg",
          "image_alt": "UK tightens IXCHIQ restrictions after safety review",
          "keywords": [],
          "canonical": "https://shiftsometimber.co.uk/medicine-news/ixchiq-uk-restrictions-safety-review-2026"
        }
      },
      "review": {
        "event_id": 281,
        "decision": "PASS",
        "decision_scope": "offline_primary_source_editorial_review",
        "input_json_sha256": "b25fac5619cc5f2a15bbedeece85630cd0feac9396906d749201f810c509bc41",
        "declared_content_sha256": "3e932c1acf09626d240239eba5d0cf9991b776e508180b995eef01ad8d4efd22",
        "article_markdown_sha256": "1fd5cfea6cbcc607f575a19351636c702fc285bba0cdfeb2a78d5c4bfb1cc3dc",
        "author": {
          "id": "/root/grub_closeout",
          "kind": "ai"
        },
        "reviewer": {
          "id": "/root/commissioning_closeout",
          "kind": "ai"
        },
        "reviewed_at": "2026-09-16T18:27:14.870716Z",
        "review_notes": "The explicit MHRA professional/patient advice and accompanying announcement support the inclusive 60+ exclusion, despite the less precise summary wording. Listed conditions, trained assessment, 30-day precaution and report counts match those sources.",
        "findings": [],
        "primary_sources_checked": [
          "https://www.gov.uk/drug-safety-update/ixchiq-chikungunya-vaccine-updates-to-restrictions-of-use-following-safety-review",
          "https://www.gov.uk/government/news/mhra-introduces-additional-restrictions-for-use-of-the-chikungunya-vaccine-ixchiq",
          "https://www.gov.uk/drug-safety-update/ixchiq-chikungunya-vaccine-temporary-suspension-in-people-aged-65-years-or-older"
        ],
        "qualified_review_status": "PENDING",
        "publication_authorized": false
      },
      "reviewed_primary_urls": [
        "https://www.gov.uk/drug-safety-update/ixchiq-chikungunya-vaccine-updates-to-restrictions-of-use-following-safety-review",
        "https://www.gov.uk/government/news/mhra-introduces-additional-restrictions-for-use-of-the-chikungunya-vaccine-ixchiq",
        "https://www.gov.uk/drug-safety-update/ixchiq-chikungunya-vaccine-temporary-suspension-in-people-aged-65-years-or-older"
      ],
      "snapshot": {
        "id": 281,
        "event_key": "1f8addb53792d576600f655be8428413b62bed863a6dbaff76ac636bfbcadfc5",
        "status": "hold",
        "headline": "IXCHIQ Chikungunya vaccine: updates to restrictions of use following safety review",
        "region": "UK",
        "regulator": "MHRA",
        "clinical": 1,
        "requires_review": 1,
        "source_evidence_json": "[{\"source_tier\":1,\"authority\":\"MHRA\",\"title\":\"IXCHIQ Chikungunya vaccine: updates to restrictions of use following safety review\",\"url\":\"https://www.gov.uk/drug-safety-update/ixchiq-chikungunya-vaccine-updates-to-restrictions-of-use-following-safety-review\",\"source_date\":\"2026-02-11T13:59:13.000Z\",\"source_feed\":\"https://www.gov.uk/drug-safety-update.atom\",\"scan_source\":\"mhra-drug-safety\",\"retrieved_at\":\"2026-09-13T06:54:48.276Z\"}]",
        "verification_json": "{\"verified\":true,\"evidence_level\":1,\"regulator_confirmed\":true,\"confidence\":97,\"reason\":\"Regulatory or UK authority evidence present\",\"conflicts\":[]}",
        "medicine_patch_json": "{\"medicine_id\":\"\",\"brand\":\"IXCHIQ\",\"generic_name\":\"Chikungunya vaccine\",\"developer\":\"\",\"mechanism\":[],\"formulation\":\"\",\"global_stage\":\"\",\"uk_regulatory_status\":\"\",\"uk_commercial_status\":\"\",\"nice_status\":\"\",\"nhs_status\":\"\",\"latest_update_text\":\"updates to restrictions of use following safety review\",\"radar_score\":83,\"regions\":[\"UK\"],\"unknowns\":[\"developer\",\"mechanism\",\"formulation\",\"global_stage\",\"uk_regulatory_status\",\"uk_commercial_status\",\"nice_status\",\"nhs_status\"],\"review_flags\":[\"requires_review\"]}",
        "content_package_json": "{\"headline\":\"IXCHIQ Chikungunya vaccine: Updates to restrictions of use following safety review\",\"standfirst\":\"The MHRA has announced updates to the restrictions of use for the IXCHIQ Chikungunya vaccine following a safety review.\",\"what_changed\":\"The restrictions of use for the IXCHIQ Chikungunya vaccine have been updated.\",\"why_it_matters_to_uk\":\"This update may impact the use of the IXCHIQ Chikungunya vaccine in the UK, and healthcare professionals should be aware of the changes.\",\"known_facts\":[{\"claim\":\"The MHRA has updated the restrictions of use for the IXCHIQ Chikungunya vaccine following a safety review.\",\"source_url\":\"https://www.gov.uk/drug-safety-update/ixchiq-chikungunya-vaccine-updates-to-restrictions-of-use-following-safety-review\"}],\"unknowns\":[\"The developer of the IXCHIQ Chikungunya vaccine\",\"The mechanism of the IXCHIQ Chikungunya vaccine\",\"The formulation of the IXCHIQ Chikungunya vaccine\",\"The global stage of the IXCHIQ Chikungunya vaccine\",\"The UK regulatory status of the IXCHIQ Chikungunya vaccine\",\"The UK commercial status of the IXCHIQ Chikungunya vaccine\",\"The NICE status of the IXCHIQ Chikungunya vaccine\",\"The NHS status of the IXCHIQ Chikungunya vaccine\"],\"safety\":\"The MHRA has conducted a safety review of the IXCHIQ Chikungunya vaccine, resulting in updates to the restrictions of use.\",\"article_markdown\":\"The UK's Medicines and Healthcare products Regulatory Agency (MHRA) has announced updates to the restrictions of use for the IXCHIQ Chikungunya vaccine following a safety review. Healthcare professionals should be aware of the changes and consult the latest guidance.\",\"ticker_line\":\"IXCHIQ Chikungunya vaccine: Updates to restrictions of use following MHRA safety review\",\"dossier_amendment\":\"The IXCHIQ Chikungunya vaccine dossier has been updated to reflect the changes to the restrictions of use.\",\"existing_page_updates\":[{\"content_key\":\"IXCHIQ Chikungunya vaccine\",\"change\":\"Updated restrictions of use following safety review\"}],\"seo\":{\"title\":\"IXCHIQ Chikungunya vaccine: Updates to restrictions of use\",\"description\":\"The MHRA has announced updates to the restrictions of use for the IXCHIQ Chikungunya vaccine following a safety review.\",\"slug\":\"ixchiq-chikungunya-vaccine-updates\",\"keywords\":[\"IXCHIQ\",\"Chikungunya vaccine\",\"MHRA\",\"safety review\"]},\"shift_brain\":{\"summary\":\"The MHRA has updated the restrictions of use for the IXCHIQ Chikungunya vaccine following a safety review.\",\"facts\":[{\"fact\":\"The MHRA has updated the restrictions of use for the IXCHIQ Chikungunya vaccine following a safety review.\",\"source_url\":\"https://www.gov.uk/drug-safety-update/ixchiq-chikungunya-vaccine-updates-to-restrictions-of-use-following-safety-review\"}]},\"review_flags\":[]}",
        "reviewed_at": null,
        "created_at": "2026-09-13T06:54:48.276Z",
        "updated_at": "2026-09-16T11:45:19.124Z",
        "source_review_generation": 0
      },
      "pending_source_change": {
        "id": 4755,
        "observed_at": "2026-09-16 11:45:19",
        "source": "mhra-drug-safety",
        "url": "https://www.gov.uk/drug-safety-update/ixchiq-chikungunya-vaccine-updates-to-restrictions-of-use-following-safety-review",
        "fingerprint": "[\"IXCHIQ Chikungunya vaccine: updates to restrictions of use following safety review\",[[\"https://www.gov.uk/drug-safety-update/ixchiq-chikungunya-vaccine-updates-to-restrictions-of-use-following-safety-review\",\"IXCHIQ Chikungunya vaccine: updates to restrictions of use following safety review\",\"2026-02-11T13:59:13.000Z\",\"2026-02-11T13:59:13.000Z\",\"Following the completion of a safety review and the recommendations of the Commission on Human Medicines (CHM), the IXCHIQ Chikungunya vaccine is no longer indicated for adults over the age of 60 years, and is contraindicate…\",\"MHRA\",1]]]",
        "observation": {
          "headline": "IXCHIQ Chikungunya vaccine: updates to restrictions of use following safety review",
          "evidence": [
            {
              "source_tier": 1,
              "authority": "MHRA",
              "title": "IXCHIQ Chikungunya vaccine: updates to restrictions of use following safety review",
              "url": "https://www.gov.uk/drug-safety-update/ixchiq-chikungunya-vaccine-updates-to-restrictions-of-use-following-safety-review",
              "summary": "Following the completion of a safety review and the recommendations of the Commission on Human Medicines (CHM), the IXCHIQ Chikungunya vaccine is no longer indicated for adults over the age of 60 years, and is contraindicate…",
              "publisher": "MHRA",
              "discovery_only": false,
              "source_updated_at": "2026-02-11T13:59:13.000Z",
              "source_date": "2026-02-11T13:59:13.000Z",
              "source_feed": "https://www.gov.uk/drug-safety-update.atom",
              "scan_source": "mhra-drug-safety",
              "retrieved_at": "2026-09-16T11:45:18.487Z"
            }
          ],
          "verification": {
            "verified": true,
            "confidence": 99,
            "reason": "Primary regulator or UK authority source",
            "conflicts": []
          },
          "confidence": 99,
          "scores": {
            "urgency": 92,
            "relevance": 83
          },
          "region": "UK"
        },
        "reviewed_snapshot": {
          "id": 281,
          "event_key": "1f8addb53792d576600f655be8428413b62bed863a6dbaff76ac636bfbcadfc5",
          "status": "ready_for_review",
          "headline": "IXCHIQ Chikungunya vaccine: updates to restrictions of use following safety review",
          "region": "UK",
          "regulator": "MHRA",
          "event_type": "drug_safety_update",
          "relevance_score": 83,
          "urgency_score": 92,
          "confidence_score": 97,
          "clinical": 1,
          "requires_review": 1,
          "source_evidence_json": "[{\"source_tier\":1,\"authority\":\"MHRA\",\"title\":\"IXCHIQ Chikungunya vaccine: updates to restrictions of use following safety review\",\"url\":\"https://www.gov.uk/drug-safety-update/ixchiq-chikungunya-vaccine-updates-to-restrictions-of-use-following-safety-review\",\"source_date\":\"2026-02-11T13:59:13.000Z\",\"source_feed\":\"https://www.gov.uk/drug-safety-update.atom\",\"scan_source\":\"mhra-drug-safety\",\"retrieved_at\":\"2026-09-13T06:54:48.276Z\"}]",
          "verification_json": "{\"verified\":true,\"evidence_level\":1,\"regulator_confirmed\":true,\"confidence\":97,\"reason\":\"Regulatory or UK authority evidence present\",\"conflicts\":[]}",
          "medicine_patch_json": "{\"medicine_id\":\"\",\"brand\":\"IXCHIQ\",\"generic_name\":\"Chikungunya vaccine\",\"developer\":\"\",\"mechanism\":[],\"formulation\":\"\",\"global_stage\":\"\",\"uk_regulatory_status\":\"\",\"uk_commercial_status\":\"\",\"nice_status\":\"\",\"nhs_status\":\"\",\"latest_update_text\":\"updates to restrictions of use following safety review\",\"radar_score\":83,\"regions\":[\"UK\"],\"unknowns\":[\"developer\",\"mechanism\",\"formulation\",\"global_stage\",\"uk_regulatory_status\",\"uk_commercial_status\",\"nice_status\",\"nhs_status\"],\"review_flags\":[\"requires_review\"]}",
          "content_package_json": "{\"headline\":\"IXCHIQ Chikungunya vaccine: Updates to restrictions of use following safety review\",\"standfirst\":\"The MHRA has announced updates to the restrictions of use for the IXCHIQ Chikungunya vaccine following a safety review.\",\"what_changed\":\"The restrictions of use for the IXCHIQ Chikungunya vaccine have been updated.\",\"why_it_matters_to_uk\":\"This update may impact the use of the IXCHIQ Chikungunya vaccine in the UK, and healthcare professionals should be aware of the changes.\",\"known_facts\":[{\"claim\":\"The MHRA has updated the restrictions of use for the IXCHIQ Chikungunya vaccine following a safety review.\",\"source_url\":\"https://www.gov.uk/drug-safety-update/ixchiq-chikungunya-vaccine-updates-to-restrictions-of-use-following-safety-review\"}],\"unknowns\":[\"The developer of the IXCHIQ Chikungunya vaccine\",\"The mechanism of the IXCHIQ Chikungunya vaccine\",\"The formulation of the IXCHIQ Chikungunya vaccine\",\"The global stage of the IXCHIQ Chikungunya vaccine\",\"The UK regulatory status of the IXCHIQ Chikungunya vaccine\",\"The UK commercial status of the IXCHIQ Chikungunya vaccine\",\"The NICE status of the IXCHIQ Chikungunya vaccine\",\"The NHS status of the IXCHIQ Chikungunya vaccine\"],\"safety\":\"The MHRA has conducted a safety review of the IXCHIQ Chikungunya vaccine, resulting in updates to the restrictions of use.\",\"article_markdown\":\"The UK's Medicines and Healthcare products Regulatory Agency (MHRA) has announced updates to the restrictions of use for the IXCHIQ Chikungunya vaccine following a safety review. Healthcare professionals should be aware of the changes and consult the latest guidance.\",\"ticker_line\":\"IXCHIQ Chikungunya vaccine: Updates to restrictions of use following MHRA safety review\",\"dossier_amendment\":\"The IXCHIQ Chikungunya vaccine dossier has been updated to reflect the changes to the restrictions of use.\",\"existing_page_updates\":[{\"content_key\":\"IXCHIQ Chikungunya vaccine\",\"change\":\"Updated restrictions of use following safety review\"}],\"seo\":{\"title\":\"IXCHIQ Chikungunya vaccine: Updates to restrictions of use\",\"description\":\"The MHRA has announced updates to the restrictions of use for the IXCHIQ Chikungunya vaccine following a safety review.\",\"slug\":\"ixchiq-chikungunya-vaccine-updates\",\"keywords\":[\"IXCHIQ\",\"Chikungunya vaccine\",\"MHRA\",\"safety review\"]},\"shift_brain\":{\"summary\":\"The MHRA has updated the restrictions of use for the IXCHIQ Chikungunya vaccine following a safety review.\",\"facts\":[{\"fact\":\"The MHRA has updated the restrictions of use for the IXCHIQ Chikungunya vaccine following a safety review.\",\"source_url\":\"https://www.gov.uk/drug-safety-update/ixchiq-chikungunya-vaccine-updates-to-restrictions-of-use-following-safety-review\"}]},\"review_flags\":[]}",
          "review_note": null,
          "reviewed_by": null,
          "reviewed_at": null,
          "created_at": "2026-09-13T06:54:48.276Z",
          "updated_at": "2026-09-13T06:55:40.871Z"
        }
      },
      "source_observation_review": {
        "event_id": 281,
        "kind": "ai",
        "reviewer": "/root/medicine_baselines",
        "decision": "PASS",
        "sha256": "4f2b510c9b871b3ba5d2ac2e46e82078ca7c38faa3d3381ea52b000d54f2f2a4",
        "notes": "Observation 4755 is the current IXCHIQ restrictions notice dated 11 February 2026. Its truncated feed summary says over 60; the reviewed article correctly follows the detailed recommendation and accompanying MHRA announcement: 60 or over excluded, use age 18–59. This resolved summary/detail discrepancy is retained in draft limitations."
      },
      "first_publication_at": null
    },
    {
      "event_id": 284,
      "contentPackage": {
        "headline": "Isotretinoin: second-prescriber rule replaced with updated safeguards",
        "standfirst": "January 2026 guidance changed prescribing for under-18s while retaining pregnancy prevention and side-effect monitoring.",
        "what_changed": "January 2026 guidance changed prescribing for under-18s while retaining pregnancy prevention and side-effect monitoring.",
        "why_it_matters_to_uk": "The January notice describes audits planned for 2026; it does not establish whether a particular service has completed one. It follows the October 2025 service survey and guidance clarifications. The two notices therefore describe successive stages of the same review, rather than interchangeable announcements. This account concerns the regulatory framework, not whether isotretinoin is suitable for any individual.",
        "known_facts": [
          {
            "claim": "Second-prescriber requirement for under-18s removed from 22 January 2026.",
            "source_url": "https://www.gov.uk/drug-safety-update/isotretinoin-changes-to-prescribing-guidance-and-additional-risk-minimisation-measures"
          },
          {
            "claim": "Other pregnancy-prevention and monitoring measures continue.",
            "source_url": "https://www.gov.uk/drug-safety-update/isotretinoin-changes-to-prescribing-guidance-and-additional-risk-minimisation-measures"
          },
          {
            "claim": "Revised form, patient video and clinical audit form the replacement approach.",
            "source_url": "https://www.gov.uk/government/publications/report-of-the-commission-on-human-medicines-isotretinoin-implementation-advisory-expert-working-group"
          }
        ],
        "unknowns": [
          "Do not claim that the medicine is risk-free, that monitoring stopped or that any individual is eligible.",
          "The January source describes a planned audit; completion or local implementation was not established.",
          "This is the January 2026 change, not a fresh September policy announcement."
        ],
        "safety": "General information, not individual medical advice. This article reports official sources and does not replace advice from your clinical team.",
        "article_markdown": "The MHRA changed isotretinoin prescribing requirements on 22 January 2026 following a review of safeguards introduced in 2023. The [regulator’s update](https://www.gov.uk/drug-safety-update/isotretinoin-changes-to-prescribing-guidance-and-additional-risk-minimisation-measures) removed the requirement for a second prescriber's agreement before treatment could begin for someone under 18, replacing it with other risk-minimisation measures.\n\nAn updated acknowledgement form asks patients and prescribers to confirm that treatment is appropriate, and records patients' understanding that they can seek another clinical opinion. The package also includes patient information and an audit approach led by the British Association of Dermatologists. The [published CHM addendum](https://www.gov.uk/government/publications/report-of-the-commission-on-human-medicines-isotretinoin-implementation-advisory-expert-working-group) records these changes.\n\nThe change does not remove the other safeguards. Pregnancy prevention remains central because isotretinoin can seriously harm an unborn baby. Assessment and monitoring for possible mental-health and sexual-function effects also continue. The lead prescriber still needs the relevant expertise and understanding of monitoring requirements.\n\nThe January notice describes audits planned for 2026; it does not establish whether a particular service has completed one. It follows the October 2025 service survey and guidance clarifications. The two notices therefore describe successive stages of the same review, rather than interchangeable announcements. This account concerns the regulatory framework, not whether isotretinoin is suitable for any individual.",
        "ticker_line": "",
        "dossier_amendment": "",
        "destinations": [
          "medicine_news",
          "knowledge_links",
          "search",
          "sitemap"
        ],
        "seo": {
          "title": "Isotretinoin prescribing: January 2026 MHRA changes",
          "description": "The second-prescriber rule for under-18s was replaced by updated safeguards; pregnancy prevention and side-effect monitoring remain.",
          "slug": "isotretinoin-prescribing-safeguards-january-2026",
          "datePublished": "2026-09-16",
          "author": "SHIFT AI Newsroom",
          "reviewer": "Owner editorial approval; AI-assisted source review; no independent clinical review",
          "source_url": "https://www.gov.uk/drug-safety-update/isotretinoin-changes-to-prescribing-guidance-and-additional-risk-minimisation-measures",
          "image": "/assets/og-default.jpg",
          "image_alt": "Isotretinoin: second-prescriber rule replaced with updated safeguards",
          "keywords": [],
          "canonical": "https://shiftsometimber.co.uk/medicine-news/isotretinoin-prescribing-safeguards-january-2026"
        }
      },
      "review": {
        "event_id": 284,
        "decision": "PASS",
        "decision_scope": "offline_primary_source_editorial_review",
        "input_json_sha256": "2ba7b897ea5223a0cb5ea83fc9c3133b3ae61dbe816393bf46822531fa3c92d9",
        "declared_content_sha256": "3a313f665ca00da246eacf358e5e810fc031c419e74f527918c56737aea6d429",
        "article_markdown_sha256": "83c55f4304afeb08544ac1ada9f2c38807c8aa670e6507bc3c7fcd14911c4398",
        "author": {
          "id": "/root/medicine_baselines",
          "kind": "ai"
        },
        "reviewer": {
          "id": "/root/commissioning_closeout",
          "kind": "ai"
        },
        "reviewed_at": "2026-09-16T18:27:14.870716Z",
        "review_notes": "The January 2026 notice and CHM addendum support removal of the under-18 second-prescriber requirement alongside replacement measures. Pregnancy prevention, monitoring and clinical expertise remain explicit; planned audit activity is not represented as completed.",
        "findings": [],
        "primary_sources_checked": [
          "https://www.gov.uk/drug-safety-update/isotretinoin-changes-to-prescribing-guidance-and-additional-risk-minimisation-measures",
          "https://www.gov.uk/government/publications/report-of-the-commission-on-human-medicines-isotretinoin-implementation-advisory-expert-working-group",
          "https://www.gov.uk/drug-safety-update/isotretinoin-updates-to-prescribing-guidance-and-survey-of-services"
        ],
        "qualified_review_status": "PENDING",
        "publication_authorized": false
      },
      "reviewed_primary_urls": [
        "https://www.gov.uk/drug-safety-update/isotretinoin-changes-to-prescribing-guidance-and-additional-risk-minimisation-measures",
        "https://www.gov.uk/government/publications/report-of-the-commission-on-human-medicines-isotretinoin-implementation-advisory-expert-working-group",
        "https://www.gov.uk/drug-safety-update/isotretinoin-updates-to-prescribing-guidance-and-survey-of-services"
      ],
      "snapshot": {
        "id": 284,
        "event_key": "f25df9dd221c050ae9f52fa08179da5d1299670b59bb7d3ee2963ddbfc7749d0",
        "status": "hold",
        "headline": "Isotretinoin – changes to prescribing guidance and additional risk minimisation measures",
        "region": "UK",
        "regulator": "MHRA",
        "clinical": 1,
        "requires_review": 1,
        "source_evidence_json": "[{\"source_tier\":1,\"authority\":\"MHRA\",\"title\":\"Isotretinoin – changes to prescribing guidance and additional risk minimisation measures\",\"url\":\"https://www.gov.uk/drug-safety-update/isotretinoin-changes-to-prescribing-guidance-and-additional-risk-minimisation-measures\",\"source_date\":\"2026-01-22T16:15:32.000Z\",\"source_feed\":\"https://www.gov.uk/drug-safety-update.atom\",\"scan_source\":\"mhra-drug-safety\",\"retrieved_at\":\"2026-09-13T06:54:49.212Z\"}]",
        "verification_json": "{\"verified\":true,\"evidence_level\":1,\"regulator_confirmed\":true,\"confidence\":97,\"reason\":\"Regulatory or UK authority evidence present\",\"conflicts\":[]}",
        "medicine_patch_json": "{\"medicine_id\":\"\",\"brand\":\"\",\"generic_name\":\"Isotretinoin\",\"developer\":\"\",\"mechanism\":[],\"formulation\":\"\",\"global_stage\":\"\",\"uk_regulatory_status\":\"\",\"uk_commercial_status\":\"\",\"nice_status\":\"\",\"nhs_status\":\"\",\"latest_update_text\":\"Changes to prescribing guidance and additional risk minimisation measures\",\"radar_score\":84,\"regions\":[\"UK\"],\"unknowns\":[],\"review_flags\":[\"requires_review\"]}",
        "content_package_json": "{\"headline\":\"Isotretinoin Prescribing Guidance Updated with Additional Risk Minimisation Measures\",\"standfirst\":\"The MHRA has announced changes to the prescribing guidance for Isotretinoin, including new risk minimisation measures.\",\"what_changed\":\"The prescribing guidance for Isotretinoin has been updated, and additional risk minimisation measures have been introduced.\",\"why_it_matters_to_uk\":\"These changes aim to improve the safe use of Isotretinoin in the UK, minimizing potential risks associated with the medication.\",\"known_facts\":[{\"claim\":\"The MHRA has updated the prescribing guidance for Isotretinoin.\",\"source_url\":\"https://www.gov.uk/drug-safety-update/isotretinoin-changes-to-prescribing-guidance-and-additional-risk-minimisation-measures\"}],\"unknowns\":[],\"safety\":\"The updated guidance and additional risk minimisation measures are intended to enhance the safety profile of Isotretinoin.\",\"article_markdown\":\"The UK's Medicines and Healthcare products Regulatory Agency (MHRA) has announced updates to the prescribing guidance for Isotretinoin, a medication used to treat severe acne. The changes include new risk minimisation measures to improve the safe use of the drug. For more information, please refer to the [MHRA's guidance](https://www.gov.uk/drug-safety-update/isotretinoin-changes-to-prescribing-guidance-and-additional-risk-minimisation-measures).\",\"ticker_line\":\"MHRA updates Isotretinoin prescribing guidance with new risk minimisation measures\",\"dossier_amendment\":\"The Isotretinoin prescribing guidance has been updated with additional risk minimisation measures.\",\"existing_page_updates\":[{\"content_key\":\"Isotretinoin\",\"change\":\"Updated prescribing guidance and risk minimisation measures\"}],\"seo\":{\"title\":\"Isotretinoin Prescribing Guidance Update\",\"description\":\"The MHRA has updated the prescribing guidance for Isotretinoin, including new risk minimisation measures.\",\"slug\":\"isotretinoin-prescribing-guidance-update\",\"keywords\":[\"Isotretinoin\",\"MHRA\",\"prescribing guidance\",\"risk minimisation measures\"]},\"shift_brain\":{\"summary\":\"The MHRA has updated the prescribing guidance for Isotretinoin, introducing new risk minimisation measures to improve the safe use of the medication.\",\"facts\":[{\"fact\":\"The MHRA has updated the prescribing guidance for Isotretinoin.\",\"source_url\":\"https://www.gov.uk/drug-safety-update/isotretinoin-changes-to-prescribing-guidance-and-additional-risk-minimisation-measures\"}]},\"review_flags\":[]}",
        "reviewed_at": null,
        "created_at": "2026-09-13T06:54:49.212Z",
        "updated_at": "2026-09-16T11:45:22.417Z",
        "source_review_generation": 0
      },
      "pending_source_change": {
        "id": 4775,
        "observed_at": "2026-09-16 11:45:22",
        "source": "mhra-drug-safety",
        "url": "https://www.gov.uk/drug-safety-update/isotretinoin-changes-to-prescribing-guidance-and-additional-risk-minimisation-measures",
        "fingerprint": "[\"Isotretinoin – changes to prescribing guidance and additional risk minimisation measures\",[[\"https://www.gov.uk/drug-safety-update/isotretinoin-changes-to-prescribing-guidance-and-additional-risk-minimisation-measures\",\"Isotretinoin – changes to prescribing guidance and additional risk minimisation measures\",\"2026-01-22T16:15:32.000Z\",\"2026-01-22T16:15:32.000Z\",\"The Commission on Human Medicines (CHM) has endorsed changes to the risk minimisation measures for isotretinoin, following a review of the impact of the measures implemented in 2023. We ask healthcare professionals to review…\",\"MHRA\",1]]]",
        "observation": {
          "headline": "Isotretinoin – changes to prescribing guidance and additional risk minimisation measures",
          "evidence": [
            {
              "source_tier": 1,
              "authority": "MHRA",
              "title": "Isotretinoin – changes to prescribing guidance and additional risk minimisation measures",
              "url": "https://www.gov.uk/drug-safety-update/isotretinoin-changes-to-prescribing-guidance-and-additional-risk-minimisation-measures",
              "summary": "The Commission on Human Medicines (CHM) has endorsed changes to the risk minimisation measures for isotretinoin, following a review of the impact of the measures implemented in 2023. We ask healthcare professionals to review…",
              "publisher": "MHRA",
              "discovery_only": false,
              "source_updated_at": "2026-01-22T16:15:32.000Z",
              "source_date": "2026-01-22T16:15:32.000Z",
              "source_feed": "https://www.gov.uk/drug-safety-update.atom",
              "scan_source": "mhra-drug-safety",
              "retrieved_at": "2026-09-16T11:45:21.784Z"
            }
          ],
          "verification": {
            "verified": true,
            "confidence": 99,
            "reason": "Primary regulator or UK authority source",
            "conflicts": []
          },
          "confidence": 99,
          "scores": {
            "urgency": 92,
            "relevance": 75
          },
          "region": "UK"
        },
        "reviewed_snapshot": {
          "id": 284,
          "event_key": "f25df9dd221c050ae9f52fa08179da5d1299670b59bb7d3ee2963ddbfc7749d0",
          "status": "ready_for_review",
          "headline": "Isotretinoin – changes to prescribing guidance and additional risk minimisation measures",
          "region": "UK",
          "regulator": "MHRA",
          "event_type": "drug_safety_update",
          "relevance_score": 75,
          "urgency_score": 92,
          "confidence_score": 97,
          "clinical": 1,
          "requires_review": 1,
          "source_evidence_json": "[{\"source_tier\":1,\"authority\":\"MHRA\",\"title\":\"Isotretinoin – changes to prescribing guidance and additional risk minimisation measures\",\"url\":\"https://www.gov.uk/drug-safety-update/isotretinoin-changes-to-prescribing-guidance-and-additional-risk-minimisation-measures\",\"source_date\":\"2026-01-22T16:15:32.000Z\",\"source_feed\":\"https://www.gov.uk/drug-safety-update.atom\",\"scan_source\":\"mhra-drug-safety\",\"retrieved_at\":\"2026-09-13T06:54:49.212Z\"}]",
          "verification_json": "{\"verified\":true,\"evidence_level\":1,\"regulator_confirmed\":true,\"confidence\":97,\"reason\":\"Regulatory or UK authority evidence present\",\"conflicts\":[]}",
          "medicine_patch_json": "{\"medicine_id\":\"\",\"brand\":\"\",\"generic_name\":\"Isotretinoin\",\"developer\":\"\",\"mechanism\":[],\"formulation\":\"\",\"global_stage\":\"\",\"uk_regulatory_status\":\"\",\"uk_commercial_status\":\"\",\"nice_status\":\"\",\"nhs_status\":\"\",\"latest_update_text\":\"Changes to prescribing guidance and additional risk minimisation measures\",\"radar_score\":84,\"regions\":[\"UK\"],\"unknowns\":[],\"review_flags\":[\"requires_review\"]}",
          "content_package_json": "{\"headline\":\"Isotretinoin Prescribing Guidance Updated with Additional Risk Minimisation Measures\",\"standfirst\":\"The MHRA has announced changes to the prescribing guidance for Isotretinoin, including new risk minimisation measures.\",\"what_changed\":\"The prescribing guidance for Isotretinoin has been updated, and additional risk minimisation measures have been introduced.\",\"why_it_matters_to_uk\":\"These changes aim to improve the safe use of Isotretinoin in the UK, minimizing potential risks associated with the medication.\",\"known_facts\":[{\"claim\":\"The MHRA has updated the prescribing guidance for Isotretinoin.\",\"source_url\":\"https://www.gov.uk/drug-safety-update/isotretinoin-changes-to-prescribing-guidance-and-additional-risk-minimisation-measures\"}],\"unknowns\":[],\"safety\":\"The updated guidance and additional risk minimisation measures are intended to enhance the safety profile of Isotretinoin.\",\"article_markdown\":\"The UK's Medicines and Healthcare products Regulatory Agency (MHRA) has announced updates to the prescribing guidance for Isotretinoin, a medication used to treat severe acne. The changes include new risk minimisation measures to improve the safe use of the drug. For more information, please refer to the [MHRA's guidance](https://www.gov.uk/drug-safety-update/isotretinoin-changes-to-prescribing-guidance-and-additional-risk-minimisation-measures).\",\"ticker_line\":\"MHRA updates Isotretinoin prescribing guidance with new risk minimisation measures\",\"dossier_amendment\":\"The Isotretinoin prescribing guidance has been updated with additional risk minimisation measures.\",\"existing_page_updates\":[{\"content_key\":\"Isotretinoin\",\"change\":\"Updated prescribing guidance and risk minimisation measures\"}],\"seo\":{\"title\":\"Isotretinoin Prescribing Guidance Update\",\"description\":\"The MHRA has updated the prescribing guidance for Isotretinoin, including new risk minimisation measures.\",\"slug\":\"isotretinoin-prescribing-guidance-update\",\"keywords\":[\"Isotretinoin\",\"MHRA\",\"prescribing guidance\",\"risk minimisation measures\"]},\"shift_brain\":{\"summary\":\"The MHRA has updated the prescribing guidance for Isotretinoin, introducing new risk minimisation measures to improve the safe use of the medication.\",\"facts\":[{\"fact\":\"The MHRA has updated the prescribing guidance for Isotretinoin.\",\"source_url\":\"https://www.gov.uk/drug-safety-update/isotretinoin-changes-to-prescribing-guidance-and-additional-risk-minimisation-measures\"}]},\"review_flags\":[]}",
          "review_note": null,
          "reviewed_by": null,
          "reviewed_at": null,
          "created_at": "2026-09-13T06:54:49.212Z",
          "updated_at": "2026-09-13T06:56:46.027Z"
        }
      },
      "source_observation_review": {
        "event_id": 284,
        "kind": "ai",
        "reviewer": "/root/medicine_baselines",
        "decision": "PASS",
        "sha256": "55bad8ba46c5f7070d84e4ebd5afebbf294120abcf3b71d778cc51b0dab05ea1",
        "notes": "Observation 4775 is the 22 January 2026 isotretinoin risk-minimisation update. The reviewed body describes the removal of the under-18 second-prescriber requirement while retaining other safeguards; it does not incorrectly reinstate the superseded October 2025 requirements."
      },
      "first_publication_at": null
    },
    {
      "event_id": 286,
      "contentPackage": {
        "headline": "Mesalazine warning follows rare intracranial-pressure reports",
        "standfirst": "The MHRA called for warnings after a safety review; the medicine’s benefit-risk balance for approved uses was unchanged.",
        "what_changed": "The MHRA called for warnings after a safety review; the medicine’s benefit-risk balance for approved uses was unchanged.",
        "why_it_matters_to_uk": "The warning applies across mesalazine formulations. The regulator asks clinicians to explain the warning, assess concerning symptoms promptly and coordinate care with relevant specialists. Its notice describes clinical management where the condition occurs; it does not announce a general withdrawal of mesalazine. This brief reports the safety update and leaves diagnosis and treatment changes to the clinical team.",
        "known_facts": [
          {
            "claim": "Warnings apply to all mesalazine products.",
            "source_url": "https://www.gov.uk/drug-safety-update/mesalazine-and-idiopathic-intracranial-hypertension"
          },
          {
            "claim": "Six UK Yellow Card reports cited; reports described as very rare.",
            "source_url": "https://www.gov.uk/drug-safety-update/mesalazine-and-idiopathic-intracranial-hypertension"
          },
          {
            "claim": "Benefit-risk balance unchanged in approved indications.",
            "source_url": "https://www.gov.uk/drug-safety-update/mesalazine-and-idiopathic-intracranial-hypertension"
          }
        ],
        "unknowns": [
          "Six suspected reports do not establish an individual risk rate or prove causality in every case.",
          "The brief does not diagnose headache, visual disturbance or tinnitus, or advise anyone to stop treatment.",
          "No claim is made that every product leaflet had already been updated by a particular date."
        ],
        "safety": "General information, not individual medical advice. This article reports official sources and does not replace advice from your clinical team.",
        "article_markdown": "The MHRA announced warnings for mesalazine product information about idiopathic intracranial hypertension, following a European safety review considered by UK advisers. The MHRA's [4 December 2025 notice](https://www.gov.uk/drug-safety-update/mesalazine-and-idiopathic-intracranial-hypertension) describes reports of this condition as very rare and says the medicine's benefit-risk balance remains unchanged for its approved uses.\n\nThe condition involves increased pressure inside the skull and can threaten vision. The notice draws attention to symptoms such as worsening or recurring headache, visual disturbance and tinnitus. It stresses that these symptoms are not unique to this diagnosis, so a news report cannot determine their cause.\n\nThe MHRA cited six UK Yellow Card reports of increased intracranial-pressure disorders associated with mesalazine. That is a count of suspected reports, not a measured rate among patients. It should not be divided by prescription-item totals to produce a risk percentage.\n\nThe warning applies across mesalazine formulations. The regulator asks clinicians to explain the warning, assess concerning symptoms promptly and coordinate care with relevant specialists. Its notice describes clinical management where the condition occurs; it does not announce a general withdrawal of mesalazine. This brief reports the safety update and leaves diagnosis and treatment changes to the clinical team.",
        "ticker_line": "",
        "dossier_amendment": "",
        "destinations": [
          "medicine_news",
          "knowledge_links",
          "search",
          "sitemap"
        ],
        "seo": {
          "title": "Mesalazine: MHRA warning about intracranial pressure",
          "description": "MHRA describes very rare reports of idiopathic intracranial hypertension with mesalazine; benefits and risks for approved uses remain unchanged.",
          "slug": "mesalazine-intracranial-hypertension-mhra-warning",
          "datePublished": "2026-09-16",
          "author": "SHIFT AI Newsroom",
          "reviewer": "Owner editorial approval; AI-assisted source review; no independent clinical review",
          "source_url": "https://www.gov.uk/drug-safety-update/mesalazine-and-idiopathic-intracranial-hypertension",
          "image": "/assets/og-default.jpg",
          "image_alt": "Mesalazine warning follows rare intracranial-pressure reports",
          "keywords": [],
          "canonical": "https://shiftsometimber.co.uk/medicine-news/mesalazine-intracranial-hypertension-mhra-warning"
        }
      },
      "review": {
        "event_id": 286,
        "decision": "PASS",
        "decision_scope": "offline_primary_source_editorial_review",
        "input_json_sha256": "2ba7b897ea5223a0cb5ea83fc9c3133b3ae61dbe816393bf46822531fa3c92d9",
        "declared_content_sha256": "cb64401e85fd055c363c54c28a3c1489c55babe0bb7a0c3e99c492d926bc3c55",
        "article_markdown_sha256": "27db4aa2113fd099ae715b2392661cc909878f87014538397b7581a2cb0c8590",
        "author": {
          "id": "/root/medicine_baselines",
          "kind": "ai"
        },
        "reviewer": {
          "id": "/root/commissioning_closeout",
          "kind": "ai"
        },
        "reviewed_at": "2026-09-16T18:27:14.870716Z",
        "review_notes": "The December 2025 notice supports the all-formulation warning and unchanged benefit-risk assessment. Six Yellow Card reports remain a suspected-report count, not an incidence estimate; symptoms are not presented as a diagnosis.",
        "findings": [],
        "primary_sources_checked": [
          "https://www.gov.uk/drug-safety-update/mesalazine-and-idiopathic-intracranial-hypertension"
        ],
        "qualified_review_status": "PENDING",
        "publication_authorized": false
      },
      "reviewed_primary_urls": [
        "https://www.gov.uk/drug-safety-update/mesalazine-and-idiopathic-intracranial-hypertension"
      ],
      "snapshot": {
        "id": 286,
        "event_key": "5ac1f8f1fe7724bc391fa97f573375022fb07c305d4fdf71d4538b4b8a6c876f",
        "status": "hold",
        "headline": "Mesalazine and idiopathic intracranial hypertension",
        "region": "UK",
        "regulator": "MHRA",
        "clinical": 1,
        "requires_review": 1,
        "source_evidence_json": "[{\"source_tier\":1,\"authority\":\"MHRA\",\"title\":\"Mesalazine and idiopathic intracranial hypertension\",\"url\":\"https://www.gov.uk/drug-safety-update/mesalazine-and-idiopathic-intracranial-hypertension\",\"source_date\":\"2025-12-04T14:00:32.000Z\",\"source_feed\":\"https://www.gov.uk/drug-safety-update.atom\",\"scan_source\":\"mhra-drug-safety\",\"retrieved_at\":\"2026-09-13T06:54:49.787Z\"}]",
        "verification_json": "{\"verified\":true,\"evidence_level\":1,\"regulator_confirmed\":true,\"confidence\":97,\"reason\":\"Regulatory or UK authority evidence present\",\"conflicts\":[]}",
        "medicine_patch_json": "{\"medicine_id\":\"\",\"brand\":\"\",\"generic_name\":\"Mesalazine\",\"developer\":\"\",\"mechanism\":[],\"formulation\":\"\",\"global_stage\":\"\",\"uk_regulatory_status\":\"\",\"uk_commercial_status\":\"\",\"nice_status\":\"\",\"nhs_status\":\"\",\"latest_update_text\":\"Mesalazine and idiopathic intracranial hypertension\",\"radar_score\":83,\"regions\":[\"UK\"],\"unknowns\":[\"developer\",\"mechanism\",\"formulation\",\"global_stage\",\"uk_regulatory_status\",\"uk_commercial_status\",\"nice_status\",\"nhs_status\"],\"review_flags\":[\"requires_review\"]}",
        "content_package_json": "{\"headline\":\"Mesalazine and Idiopathic Intracranial Hypertension: MHRA Drug Safety Update\",\"standfirst\":\"The MHRA has issued a drug safety update regarding the use of Mesalazine and its potential link to idiopathic intracranial hypertension.\",\"what_changed\":\"The MHRA has updated its guidance on the use of Mesalazine, highlighting the potential risk of idiopathic intracranial hypertension.\",\"why_it_matters_to_uk\":\"This update is relevant to UK patients and healthcare professionals, as it provides important information on the safe use of Mesalazine.\",\"known_facts\":[{\"claim\":\"The MHRA has issued a drug safety update on Mesalazine and idiopathic intracranial hypertension.\",\"source_url\":\"https://www.gov.uk/drug-safety-update/mesalazine-and-idiopathic-intracranial-hypertension\"}],\"unknowns\":[\"The exact mechanism by which Mesalazine may cause idiopathic intracranial hypertension.\",\"The developer of Mesalazine.\",\"The formulation of Mesalazine.\",\"The global stage of Mesalazine.\",\"The UK regulatory status of Mesalazine.\",\"The UK commercial status of Mesalazine.\",\"The NICE status of Mesalazine.\",\"The NHS status of Mesalazine.\"],\"safety\":\"The MHRA has highlighted the potential risk of idiopathic intracranial hypertension associated with the use of Mesalazine.\",\"article_markdown\":\"The MHRA has issued a drug safety update regarding the use of Mesalazine and its potential link to idiopathic intracranial hypertension. This update is relevant to UK patients and healthcare professionals, as it provides important information on the safe use of Mesalazine.\",\"ticker_line\":\"MHRA Issues Drug Safety Update on Mesalazine and Idiopathic Intracranial Hypertension\",\"dossier_amendment\":\"The MHRA's drug safety update on Mesalazine and idiopathic intracranial hypertension should be taken into account when assessing the safety of Mesalazine.\",\"existing_page_updates\":[{\"content_key\":\"mesalazine\",\"change\":\"Add information on the potential risk of idiopathic intracranial hypertension associated with the use of Mesalazine.\"}],\"seo\":{\"title\":\"Mesalazine and Idiopathic Intracranial Hypertension: MHRA Drug Safety Update\",\"description\":\"The MHRA has issued a drug safety update regarding the use of Mesalazine and its potential link to idiopathic intracranial hypertension.\",\"slug\":\"mesalazine-idiopathic-intracranial-hypertension-mhra-drug-safety-update\",\"keywords\":[\"Mesalazine\",\"idiopathic intracranial hypertension\",\"MHRA\",\"drug safety update\"]},\"shift_brain\":{\"summary\":\"The MHRA has issued a drug safety update on Mesalazine and idiopathic intracranial hypertension, highlighting the potential risk of this condition associated with the use of Mesalazine.\",\"facts\":[{\"fact\":\"The MHRA has issued a drug safety update on Mesalazine and idiopathic intracranial hypertension.\",\"source_url\":\"https://www.gov.uk/drug-safety-update/mesalazine-and-idiopathic-intracranial-hypertension\"}]},\"review_flags\":[\"requires_review\"]}",
        "reviewed_at": null,
        "created_at": "2026-09-13T06:54:49.787Z",
        "updated_at": "2026-09-16T11:45:24.540Z",
        "source_review_generation": 0
      },
      "pending_source_change": {
        "id": 4786,
        "observed_at": "2026-09-16 11:45:24",
        "source": "mhra-drug-safety",
        "url": "https://www.gov.uk/drug-safety-update/mesalazine-and-idiopathic-intracranial-hypertension",
        "fingerprint": "[\"Mesalazine and idiopathic intracranial hypertension\",[[\"https://www.gov.uk/drug-safety-update/mesalazine-and-idiopathic-intracranial-hypertension\",\"Mesalazine and idiopathic intracranial hypertension\",\"2025-12-04T14:00:32.000Z\",\"2025-12-04T14:00:32.000Z\",\"Idiopathic intracranial hypertension (IIH) has been very rarely reported in patients treated with mesalazine. Following a recent review, warnings for IIH are being added to the product information for all mesalazine products…\",\"MHRA\",1]]]",
        "observation": {
          "headline": "Mesalazine and idiopathic intracranial hypertension",
          "evidence": [
            {
              "source_tier": 1,
              "authority": "MHRA",
              "title": "Mesalazine and idiopathic intracranial hypertension",
              "url": "https://www.gov.uk/drug-safety-update/mesalazine-and-idiopathic-intracranial-hypertension",
              "summary": "Idiopathic intracranial hypertension (IIH) has been very rarely reported in patients treated with mesalazine. Following a recent review, warnings for IIH are being added to the product information for all mesalazine products…",
              "publisher": "MHRA",
              "discovery_only": false,
              "source_updated_at": "2025-12-04T14:00:32.000Z",
              "source_date": "2025-12-04T14:00:32.000Z",
              "source_feed": "https://www.gov.uk/drug-safety-update.atom",
              "scan_source": "mhra-drug-safety",
              "retrieved_at": "2026-09-16T11:45:23.904Z"
            }
          ],
          "verification": {
            "verified": true,
            "confidence": 99,
            "reason": "Primary regulator or UK authority source",
            "conflicts": []
          },
          "confidence": 99,
          "scores": {
            "urgency": 92,
            "relevance": 75
          },
          "region": "UK"
        },
        "reviewed_snapshot": {
          "id": 286,
          "event_key": "5ac1f8f1fe7724bc391fa97f573375022fb07c305d4fdf71d4538b4b8a6c876f",
          "status": "ready_for_review",
          "headline": "Mesalazine and idiopathic intracranial hypertension",
          "region": "UK",
          "regulator": "MHRA",
          "event_type": "drug_safety_update",
          "relevance_score": 75,
          "urgency_score": 92,
          "confidence_score": 97,
          "clinical": 1,
          "requires_review": 1,
          "source_evidence_json": "[{\"source_tier\":1,\"authority\":\"MHRA\",\"title\":\"Mesalazine and idiopathic intracranial hypertension\",\"url\":\"https://www.gov.uk/drug-safety-update/mesalazine-and-idiopathic-intracranial-hypertension\",\"source_date\":\"2025-12-04T14:00:32.000Z\",\"source_feed\":\"https://www.gov.uk/drug-safety-update.atom\",\"scan_source\":\"mhra-drug-safety\",\"retrieved_at\":\"2026-09-13T06:54:49.787Z\"}]",
          "verification_json": "{\"verified\":true,\"evidence_level\":1,\"regulator_confirmed\":true,\"confidence\":97,\"reason\":\"Regulatory or UK authority evidence present\",\"conflicts\":[]}",
          "medicine_patch_json": "{\"medicine_id\":\"\",\"brand\":\"\",\"generic_name\":\"Mesalazine\",\"developer\":\"\",\"mechanism\":[],\"formulation\":\"\",\"global_stage\":\"\",\"uk_regulatory_status\":\"\",\"uk_commercial_status\":\"\",\"nice_status\":\"\",\"nhs_status\":\"\",\"latest_update_text\":\"Mesalazine and idiopathic intracranial hypertension\",\"radar_score\":83,\"regions\":[\"UK\"],\"unknowns\":[\"developer\",\"mechanism\",\"formulation\",\"global_stage\",\"uk_regulatory_status\",\"uk_commercial_status\",\"nice_status\",\"nhs_status\"],\"review_flags\":[\"requires_review\"]}",
          "content_package_json": "{\"headline\":\"Mesalazine and Idiopathic Intracranial Hypertension: MHRA Drug Safety Update\",\"standfirst\":\"The MHRA has issued a drug safety update regarding the use of Mesalazine and its potential link to idiopathic intracranial hypertension.\",\"what_changed\":\"The MHRA has updated its guidance on the use of Mesalazine, highlighting the potential risk of idiopathic intracranial hypertension.\",\"why_it_matters_to_uk\":\"This update is relevant to UK patients and healthcare professionals, as it provides important information on the safe use of Mesalazine.\",\"known_facts\":[{\"claim\":\"The MHRA has issued a drug safety update on Mesalazine and idiopathic intracranial hypertension.\",\"source_url\":\"https://www.gov.uk/drug-safety-update/mesalazine-and-idiopathic-intracranial-hypertension\"}],\"unknowns\":[\"The exact mechanism by which Mesalazine may cause idiopathic intracranial hypertension.\",\"The developer of Mesalazine.\",\"The formulation of Mesalazine.\",\"The global stage of Mesalazine.\",\"The UK regulatory status of Mesalazine.\",\"The UK commercial status of Mesalazine.\",\"The NICE status of Mesalazine.\",\"The NHS status of Mesalazine.\"],\"safety\":\"The MHRA has highlighted the potential risk of idiopathic intracranial hypertension associated with the use of Mesalazine.\",\"article_markdown\":\"The MHRA has issued a drug safety update regarding the use of Mesalazine and its potential link to idiopathic intracranial hypertension. This update is relevant to UK patients and healthcare professionals, as it provides important information on the safe use of Mesalazine.\",\"ticker_line\":\"MHRA Issues Drug Safety Update on Mesalazine and Idiopathic Intracranial Hypertension\",\"dossier_amendment\":\"The MHRA's drug safety update on Mesalazine and idiopathic intracranial hypertension should be taken into account when assessing the safety of Mesalazine.\",\"existing_page_updates\":[{\"content_key\":\"mesalazine\",\"change\":\"Add information on the potential risk of idiopathic intracranial hypertension associated with the use of Mesalazine.\"}],\"seo\":{\"title\":\"Mesalazine and Idiopathic Intracranial Hypertension: MHRA Drug Safety Update\",\"description\":\"The MHRA has issued a drug safety update regarding the use of Mesalazine and its potential link to idiopathic intracranial hypertension.\",\"slug\":\"mesalazine-idiopathic-intracranial-hypertension-mhra-drug-safety-update\",\"keywords\":[\"Mesalazine\",\"idiopathic intracranial hypertension\",\"MHRA\",\"drug safety update\"]},\"shift_brain\":{\"summary\":\"The MHRA has issued a drug safety update on Mesalazine and idiopathic intracranial hypertension, highlighting the potential risk of this condition associated with the use of Mesalazine.\",\"facts\":[{\"fact\":\"The MHRA has issued a drug safety update on Mesalazine and idiopathic intracranial hypertension.\",\"source_url\":\"https://www.gov.uk/drug-safety-update/mesalazine-and-idiopathic-intracranial-hypertension\"}]},\"review_flags\":[\"requires_review\"]}",
          "review_note": null,
          "reviewed_by": null,
          "reviewed_at": null,
          "created_at": "2026-09-13T06:54:49.787Z",
          "updated_at": "2026-09-13T06:56:32.732Z"
        }
      },
      "source_observation_review": {
        "event_id": 286,
        "kind": "ai",
        "reviewer": "/root/medicine_baselines",
        "decision": "PASS",
        "sha256": "0977a4c9e25ce34610351184caad680bc3418fb4fd028d287023b65b0aa22ac6",
        "notes": "Observation 4786 matches the 4 December 2025 mesalazine IIH notice. Its summary describes warnings being added, and the reviewed article does not claim that every leaflet was already updated. Suspected-event counts are not presented as incidence."
      },
      "first_publication_at": null
    },
    {
      "event_id": 288,
      "contentPackage": {
        "headline": "Isotretinoin: the October 2025 review behind later prescribing changes",
        "standfirst": "A historical update explains the service survey and remote-care clarifications, with the subsequent January 2026 changes linked.",
        "what_changed": "A historical update explains the service survey and remote-care clarifications, with the subsequent January 2026 changes linked.",
        "why_it_matters_to_uk": "The [CHM report’s later January 2026 addendum](https://www.gov.uk/government/publications/report-of-the-commission-on-human-medicines-isotretinoin-implementation-advisory-expert-working-group) records the next stage: replacement of the under-18 second-prescriber requirement with revised risk-minimisation measures. Other safeguards remained. Readers need that later context when interpreting the October notice. These are related but distinct records, and preserving their dates avoids confusing a past consultation exercise with the current prescribing framework.",
        "known_facts": [
          {
            "claim": "Historical survey deadline: 16 November 2025.",
            "source_url": "https://www.gov.uk/drug-safety-update/isotretinoin-updates-to-prescribing-guidance-and-survey-of-services"
          },
          {
            "claim": "Remote follow-up and testing require appropriate assessment and oversight.",
            "source_url": "https://www.gov.uk/drug-safety-update/isotretinoin-updates-to-prescribing-guidance-and-survey-of-services"
          },
          {
            "claim": "January 2026 addendum records subsequent prescribing changes.",
            "source_url": "https://www.gov.uk/government/publications/report-of-the-commission-on-human-medicines-isotretinoin-implementation-advisory-expert-working-group"
          }
        ],
        "unknowns": [
          "This record must be clearly dated as historical context, not a current survey or new September announcement.",
          "Do not imply that remote pregnancy tests can be unsupervised or that the first appointment can routinely be remote.",
          "The survey announcement alone cannot establish later policy; the January addendum is separately cited."
        ],
        "safety": "General information, not individual medical advice. This article reports official sources and does not replace advice from your clinical team.",
        "article_markdown": "An MHRA announcement on [27 October 2025](https://www.gov.uk/drug-safety-update/isotretinoin-updates-to-prescribing-guidance-and-survey-of-services) clarified parts of isotretinoin care and sought information from NHS and private prescribing services. It was an earlier stage of a review that subsequently produced further changes in January 2026.\n\nThe October guidance allowed suitable follow-up consultations to take place remotely while retaining an in-person first appointment. It also clarified that pregnancy testing could be medically supervised remotely with appropriate guidance and oversight. These options were conditional on clinical assessment, patient needs and safeguarding; they were not a blanket switch to remote care.\n\nSexual-function monitoring at follow-up appointments continued, although discussions could be briefer by the third appointment. The notice also asked service leads to complete a baseline survey by 16 November 2025. That deadline is historical and should not be presented as an open invitation today.\n\nThe [CHM report’s later January 2026 addendum](https://www.gov.uk/government/publications/report-of-the-commission-on-human-medicines-isotretinoin-implementation-advisory-expert-working-group) records the next stage: replacement of the under-18 second-prescriber requirement with revised risk-minimisation measures. Other safeguards remained. Readers need that later context when interpreting the October notice. These are related but distinct records, and preserving their dates avoids confusing a past consultation exercise with the current prescribing framework.",
        "ticker_line": "",
        "dossier_amendment": "",
        "destinations": [
          "medicine_news",
          "knowledge_links",
          "search",
          "sitemap"
        ],
        "seo": {
          "title": "Isotretinoin: October 2025 review and later changes",
          "description": "Historical context for MHRA remote-care guidance and its 2025 service survey, with the later January 2026 prescribing changes explained.",
          "slug": "isotretinoin-october-2025-survey-later-guidance",
          "datePublished": "2026-09-16",
          "author": "SHIFT AI Newsroom",
          "reviewer": "Owner editorial approval; AI-assisted source review; no independent clinical review",
          "source_url": "https://www.gov.uk/drug-safety-update/isotretinoin-updates-to-prescribing-guidance-and-survey-of-services",
          "image": "/assets/og-default.jpg",
          "image_alt": "Isotretinoin: the October 2025 review behind later prescribing changes",
          "keywords": [],
          "canonical": "https://shiftsometimber.co.uk/medicine-news/isotretinoin-october-2025-survey-later-guidance"
        }
      },
      "review": {
        "event_id": 288,
        "decision": "PASS",
        "decision_scope": "offline_primary_source_editorial_review",
        "input_json_sha256": "2ba7b897ea5223a0cb5ea83fc9c3133b3ae61dbe816393bf46822531fa3c92d9",
        "declared_content_sha256": "29d257085b1aba4d948fdc353142e33366bd6442f88bc377e87f63e5ac077d6b",
        "article_markdown_sha256": "d8fde8b0a9eb9a755d38b7aec0834c2b7be8fc95bbc9cef9b7c7901b328e0fac",
        "author": {
          "id": "/root/medicine_baselines",
          "kind": "ai"
        },
        "reviewer": {
          "id": "/root/commissioning_closeout",
          "kind": "ai"
        },
        "reviewed_at": "2026-09-16T18:27:14.870716Z",
        "review_notes": "The October 2025 survey is clearly historical, including its expired November deadline. Remote follow-up/testing conditions and continued monitoring match the source, with the later January 2026 policy change separately identified.",
        "findings": [],
        "primary_sources_checked": [
          "https://www.gov.uk/drug-safety-update/isotretinoin-updates-to-prescribing-guidance-and-survey-of-services",
          "https://www.gov.uk/government/publications/report-of-the-commission-on-human-medicines-isotretinoin-implementation-advisory-expert-working-group",
          "https://www.gov.uk/drug-safety-update/isotretinoin-changes-to-prescribing-guidance-and-additional-risk-minimisation-measures"
        ],
        "qualified_review_status": "PENDING",
        "publication_authorized": false
      },
      "reviewed_primary_urls": [
        "https://www.gov.uk/drug-safety-update/isotretinoin-updates-to-prescribing-guidance-and-survey-of-services",
        "https://www.gov.uk/government/publications/report-of-the-commission-on-human-medicines-isotretinoin-implementation-advisory-expert-working-group",
        "https://www.gov.uk/drug-safety-update/isotretinoin-changes-to-prescribing-guidance-and-additional-risk-minimisation-measures"
      ],
      "snapshot": {
        "id": 288,
        "event_key": "136d055c81e3d717345b766a6a6877ef0613191cc9076c38cc19617244cfd352",
        "status": "hold",
        "headline": "Isotretinoin – updates to prescribing guidance and survey of services",
        "region": "UK",
        "regulator": "MHRA",
        "clinical": 1,
        "requires_review": 1,
        "source_evidence_json": "[{\"source_tier\":1,\"authority\":\"MHRA\",\"title\":\"Isotretinoin – updates to prescribing guidance and survey of services\",\"url\":\"https://www.gov.uk/drug-safety-update/isotretinoin-updates-to-prescribing-guidance-and-survey-of-services\",\"source_date\":\"2025-10-27T11:00:14.000Z\",\"source_feed\":\"https://www.gov.uk/drug-safety-update.atom\",\"scan_source\":\"mhra-drug-safety\",\"retrieved_at\":\"2026-09-13T06:54:50.247Z\"}]",
        "verification_json": "{\"verified\":true,\"evidence_level\":1,\"regulator_confirmed\":true,\"confidence\":97,\"reason\":\"Regulatory or UK authority evidence present\",\"conflicts\":[]}",
        "medicine_patch_json": "{\"medicine_id\":\"\",\"brand\":\"\",\"generic_name\":\"Isotretinoin\",\"developer\":\"\",\"mechanism\":[],\"formulation\":\"\",\"global_stage\":\"\",\"uk_regulatory_status\":\"\",\"uk_commercial_status\":\"\",\"nice_status\":\"\",\"nhs_status\":\"\",\"latest_update_text\":\"Updates to prescribing guidance and survey of services\",\"radar_score\":83,\"regions\":[\"UK\"],\"unknowns\":[],\"review_flags\":[\"requires_review\"]}",
        "content_package_json": "{\"headline\":\"Isotretinoin Prescribing Guidance Updated in the UK\",\"standfirst\":\"The MHRA has issued updates to the prescribing guidance for Isotretinoin, along with a survey of services.\",\"what_changed\":\"The prescribing guidance for Isotretinoin has been updated, and a survey of services has been conducted.\",\"why_it_matters_to_uk\":\"These updates are relevant to UK healthcare professionals and patients who use Isotretinoin, as they provide important information on safe prescribing practices.\",\"known_facts\":[{\"claim\":\"The MHRA has updated the prescribing guidance for Isotretinoin.\",\"source_url\":\"https://www.gov.uk/drug-safety-update/isotretinoin-updates-to-prescribing-guidance-and-survey-of-services\"}],\"unknowns\":[],\"safety\":\"The updated guidance aims to improve the safe use of Isotretinoin in the UK.\",\"article_markdown\":\"The UK's Medicines and Healthcare products Regulatory Agency (MHRA) has issued updates to the prescribing guidance for Isotretinoin, a medication used to treat severe acne. The updates include new information on safe prescribing practices and a survey of services.\",\"ticker_line\":\"Isotretinoin prescribing guidance updated in the UK\",\"dossier_amendment\":\"The updates to the prescribing guidance for Isotretinoin are now available on the UK government's website.\",\"existing_page_updates\":[{\"content_key\":\"Isotretinoin\",\"change\":\"Updated prescribing guidance\"}],\"seo\":{\"title\":\"Isotretinoin Prescribing Guidance Updated in the UK\",\"description\":\"The MHRA has issued updates to the prescribing guidance for Isotretinoin, along with a survey of services.\",\"slug\":\"isotretinoin-prescribing-guidance-updated\",\"keywords\":[\"Isotretinoin\",\"prescribing guidance\",\"MHRA\",\"UK\"]},\"shift_brain\":{\"summary\":\"The MHRA has updated the prescribing guidance for Isotretinoin in the UK.\",\"facts\":[{\"fact\":\"The updated guidance includes new information on safe prescribing practices.\",\"source_url\":\"https://www.gov.uk/drug-safety-update/isotretinoin-updates-to-prescribing-guidance-and-survey-of-services\"}]},\"review_flags\":[]}",
        "reviewed_at": null,
        "created_at": "2026-09-13T06:54:50.247Z",
        "updated_at": "2026-09-16T11:45:25.612Z",
        "source_review_generation": 0
      },
      "pending_source_change": {
        "id": 4790,
        "observed_at": "2026-09-16 11:45:25",
        "source": "mhra-drug-safety",
        "url": "https://www.gov.uk/drug-safety-update/isotretinoin-updates-to-prescribing-guidance-and-survey-of-services",
        "fingerprint": "[\"Isotretinoin – updates to prescribing guidance and survey of services\",[[\"https://www.gov.uk/drug-safety-update/isotretinoin-updates-to-prescribing-guidance-and-survey-of-services\",\"Isotretinoin – updates to prescribing guidance and survey of services\",\"2025-10-27T11:00:14.000Z\",\"2025-10-27T11:00:14.000Z\",\"The Commission on Human Medicines (CHM) has endorsed changes to isotretinoin prescribing guidance. In addition, CHM is seeking further information from dermatology services who prescribe isotretinoin to inform any future cha…\",\"MHRA\",1]]]",
        "observation": {
          "headline": "Isotretinoin – updates to prescribing guidance and survey of services",
          "evidence": [
            {
              "source_tier": 1,
              "authority": "MHRA",
              "title": "Isotretinoin – updates to prescribing guidance and survey of services",
              "url": "https://www.gov.uk/drug-safety-update/isotretinoin-updates-to-prescribing-guidance-and-survey-of-services",
              "summary": "The Commission on Human Medicines (CHM) has endorsed changes to isotretinoin prescribing guidance. In addition, CHM is seeking further information from dermatology services who prescribe isotretinoin to inform any future cha…",
              "publisher": "MHRA",
              "discovery_only": false,
              "source_updated_at": "2025-10-27T11:00:14.000Z",
              "source_date": "2025-10-27T11:00:14.000Z",
              "source_feed": "https://www.gov.uk/drug-safety-update.atom",
              "scan_source": "mhra-drug-safety",
              "retrieved_at": "2026-09-16T11:45:24.994Z"
            }
          ],
          "verification": {
            "verified": true,
            "confidence": 99,
            "reason": "Primary regulator or UK authority source",
            "conflicts": []
          },
          "confidence": 99,
          "scores": {
            "urgency": 92,
            "relevance": 75
          },
          "region": "UK"
        },
        "reviewed_snapshot": {
          "id": 288,
          "event_key": "136d055c81e3d717345b766a6a6877ef0613191cc9076c38cc19617244cfd352",
          "status": "ready_for_review",
          "headline": "Isotretinoin – updates to prescribing guidance and survey of services",
          "region": "UK",
          "regulator": "MHRA",
          "event_type": "drug_safety_update",
          "relevance_score": 75,
          "urgency_score": 92,
          "confidence_score": 97,
          "clinical": 1,
          "requires_review": 1,
          "source_evidence_json": "[{\"source_tier\":1,\"authority\":\"MHRA\",\"title\":\"Isotretinoin – updates to prescribing guidance and survey of services\",\"url\":\"https://www.gov.uk/drug-safety-update/isotretinoin-updates-to-prescribing-guidance-and-survey-of-services\",\"source_date\":\"2025-10-27T11:00:14.000Z\",\"source_feed\":\"https://www.gov.uk/drug-safety-update.atom\",\"scan_source\":\"mhra-drug-safety\",\"retrieved_at\":\"2026-09-13T06:54:50.247Z\"}]",
          "verification_json": "{\"verified\":true,\"evidence_level\":1,\"regulator_confirmed\":true,\"confidence\":97,\"reason\":\"Regulatory or UK authority evidence present\",\"conflicts\":[]}",
          "medicine_patch_json": "{\"medicine_id\":\"\",\"brand\":\"\",\"generic_name\":\"Isotretinoin\",\"developer\":\"\",\"mechanism\":[],\"formulation\":\"\",\"global_stage\":\"\",\"uk_regulatory_status\":\"\",\"uk_commercial_status\":\"\",\"nice_status\":\"\",\"nhs_status\":\"\",\"latest_update_text\":\"Updates to prescribing guidance and survey of services\",\"radar_score\":83,\"regions\":[\"UK\"],\"unknowns\":[],\"review_flags\":[\"requires_review\"]}",
          "content_package_json": "{\"headline\":\"Isotretinoin Prescribing Guidance Updated in the UK\",\"standfirst\":\"The MHRA has issued updates to the prescribing guidance for Isotretinoin, along with a survey of services.\",\"what_changed\":\"The prescribing guidance for Isotretinoin has been updated, and a survey of services has been conducted.\",\"why_it_matters_to_uk\":\"These updates are relevant to UK healthcare professionals and patients who use Isotretinoin, as they provide important information on safe prescribing practices.\",\"known_facts\":[{\"claim\":\"The MHRA has updated the prescribing guidance for Isotretinoin.\",\"source_url\":\"https://www.gov.uk/drug-safety-update/isotretinoin-updates-to-prescribing-guidance-and-survey-of-services\"}],\"unknowns\":[],\"safety\":\"The updated guidance aims to improve the safe use of Isotretinoin in the UK.\",\"article_markdown\":\"The UK's Medicines and Healthcare products Regulatory Agency (MHRA) has issued updates to the prescribing guidance for Isotretinoin, a medication used to treat severe acne. The updates include new information on safe prescribing practices and a survey of services.\",\"ticker_line\":\"Isotretinoin prescribing guidance updated in the UK\",\"dossier_amendment\":\"The updates to the prescribing guidance for Isotretinoin are now available on the UK government's website.\",\"existing_page_updates\":[{\"content_key\":\"Isotretinoin\",\"change\":\"Updated prescribing guidance\"}],\"seo\":{\"title\":\"Isotretinoin Prescribing Guidance Updated in the UK\",\"description\":\"The MHRA has issued updates to the prescribing guidance for Isotretinoin, along with a survey of services.\",\"slug\":\"isotretinoin-prescribing-guidance-updated\",\"keywords\":[\"Isotretinoin\",\"prescribing guidance\",\"MHRA\",\"UK\"]},\"shift_brain\":{\"summary\":\"The MHRA has updated the prescribing guidance for Isotretinoin in the UK.\",\"facts\":[{\"fact\":\"The updated guidance includes new information on safe prescribing practices.\",\"source_url\":\"https://www.gov.uk/drug-safety-update/isotretinoin-updates-to-prescribing-guidance-and-survey-of-services\"}]},\"review_flags\":[]}",
          "review_note": null,
          "reviewed_by": null,
          "reviewed_at": null,
          "created_at": "2026-09-13T06:54:50.247Z",
          "updated_at": "2026-09-13T06:56:18.858Z"
        }
      },
      "source_observation_review": {
        "event_id": 288,
        "kind": "ai",
        "reviewer": "/root/medicine_baselines",
        "decision": "PASS",
        "sha256": "cd8e9eca11a5d4b353333fdaec9edc40d6ebe7faf1fcb5687435bfc226a8eea5",
        "notes": "Observation 4790 matches the 27 October 2025 isotretinoin remote-care and survey notice. The exact article states that its survey deadline has passed, identifies the subsequent January 2026 change and preserves the initial in-person/appropriate remote-follow-up distinction."
      },
      "first_publication_at": null
    },
    {
      "event_id": 290,
      "contentPackage": {
        "headline": "RSV vaccine warning puts rare nerve condition in context",
        "standfirst": "The MHRA identified a small Guillain–Barré syndrome risk in older adults while retaining a favourable benefit–risk assessment.",
        "what_changed": "The MHRA identified a small Guillain–Barré syndrome risk in older adults while retaining a favourable benefit–risk assessment.",
        "why_it_matters_to_uk": "Safety estimates from different studies, ages and observation periods are not interchangeable. This report does not turn suspected adverse-event notifications into a causal rate or repeat the older notice’s programme eligibility as current policy. The updated official guidance provides the appropriate programme context. [UK Health Security Agency source](https://www.gov.uk/government/publications/respiratory-syncytial-virus-rsv-programme-information-for-healthcare-professionals/rsv-vaccination-of-older-adults-information-for-healthcare-practioners)",
        "known_facts": [
          {
            "claim": "MHRA safety notice: 7 July 2025.",
            "source_url": "https://www.gov.uk/drug-safety-update/abrysvov-pfizer-rsv-vaccine-and-arexvyv-gsk-rsv-vaccine-be-alert-to-a-small-risk-of-guillain-barre-syndrome-following-vaccination-in-older-adults"
          },
          {
            "claim": "Later UKHSA guidance retains favourable benefit–risk context.",
            "source_url": "https://www.gov.uk/government/publications/respiratory-syncytial-virus-rsv-programme-information-for-healthcare-professionals/rsv-vaccination-of-older-adults-information-for-healthcare-practioners"
          }
        ],
        "unknowns": [
          "No numerical excess-risk estimate is pooled across studies or presented as an individual prediction.",
          "The 2025 NHS age-cohort description is historical; programme eligibility changed subsequently.",
          "No individual decision about vaccination is made."
        ],
        "safety": "General information, not individual medical advice. This article reports official sources and does not replace advice from your clinical team.",
        "article_markdown": "A July 2025 MHRA safety notice warned of a small increase in Guillain–Barré syndrome after the RSV vaccines Abrysvo and Arexvy in older adults. The Commission on Human Medicines nevertheless concluded that protection against RSV outweighed that risk. The notice did not describe a suspension of vaccination. [MHRA source](https://www.gov.uk/drug-safety-update/abrysvov-pfizer-rsv-vaccine-and-arexvyv-gsk-rsv-vaccine-be-alert-to-a-small-risk-of-guillain-barre-syndrome-following-vaccination-in-older-adults)\n\nGuillain–Barré syndrome is a serious condition affecting the nerves. The regulator asked clinicians to recognise possible symptoms promptly and explained that urgent hospital assessment can be necessary. It reported no evidence at that time of an increased risk after Abrysvo in pregnant people; that separate population should not be assigned the older-adult findings. [MHRA source](https://www.gov.uk/drug-safety-update/abrysvov-pfizer-rsv-vaccine-and-arexvyv-gsk-rsv-vaccine-be-alert-to-a-small-risk-of-guillain-barre-syndrome-following-vaccination-in-older-adults)\n\nLater UKHSA guidance, updated 11 August 2026, continues to describe a small increased risk in the six weeks after vaccination in older adults. It also notes that some cases following vaccination happen by chance and that infections themselves commonly precede the condition. Protection against severe RSV remains important in the eligible population. [UK Health Security Agency source](https://www.gov.uk/government/publications/respiratory-syncytial-virus-rsv-programme-information-for-healthcare-professionals/rsv-vaccination-of-older-adults-information-for-healthcare-practioners)\n\nSafety estimates from different studies, ages and observation periods are not interchangeable. This report does not turn suspected adverse-event notifications into a causal rate or repeat the older notice’s programme eligibility as current policy. The updated official guidance provides the appropriate programme context. [UK Health Security Agency source](https://www.gov.uk/government/publications/respiratory-syncytial-virus-rsv-programme-information-for-healthcare-professionals/rsv-vaccination-of-older-adults-information-for-healthcare-practioners)",
        "ticker_line": "",
        "dossier_amendment": "",
        "destinations": [
          "medicine_news",
          "knowledge_links",
          "search",
          "sitemap"
        ],
        "seo": {
          "slug": "rsv-vaccines-small-gbs-risk-mhra-context",
          "title": "RSV vaccines: rare GBS risk in context",
          "description": "What the MHRA warning and later UKHSA guidance say about RSV vaccines and Guillain–Barré syndrome.",
          "datePublished": "2026-09-16",
          "author": "SHIFT AI Newsroom",
          "reviewer": "Owner editorial approval; AI-assisted source review; no independent clinical review",
          "source_url": "https://www.gov.uk/drug-safety-update/abrysvov-pfizer-rsv-vaccine-and-arexvyv-gsk-rsv-vaccine-be-alert-to-a-small-risk-of-guillain-barre-syndrome-following-vaccination-in-older-adults",
          "image": "/assets/og-default.jpg",
          "image_alt": "RSV vaccine warning puts rare nerve condition in context",
          "keywords": [],
          "canonical": "https://shiftsometimber.co.uk/medicine-news/rsv-vaccines-small-gbs-risk-mhra-context"
        }
      },
      "review": {
        "event_id": 290,
        "decision": "PASS",
        "decision_scope": "offline_primary_source_editorial_review",
        "input_json_sha256": "b25fac5619cc5f2a15bbedeece85630cd0feac9396906d749201f810c509bc41",
        "declared_content_sha256": "fec8854fbbd087d597f3d9cd70bed547ba1d974633f8cbc00dd3570593c3cae7",
        "article_markdown_sha256": "bc16b79082cf7aedbb95dc49e4f6e78a59f550f2ff02892424f405e2a3feca93",
        "author": {
          "id": "/root/grub_closeout",
          "kind": "ai"
        },
        "reviewer": {
          "id": "/root/commissioning_closeout",
          "kind": "ai"
        },
        "reviewed_at": "2026-09-16T18:27:14.870716Z",
        "review_notes": "The July 2025 MHRA notice and August 2026 UKHSA guidance support the safety framing. Older-adult and pregnancy evidence are distinguished; the draft avoids stale NHS cohort rules, false incidence calculations and an unsupported suspension claim.",
        "findings": [],
        "primary_sources_checked": [
          "https://www.gov.uk/drug-safety-update/abrysvov-pfizer-rsv-vaccine-and-arexvyv-gsk-rsv-vaccine-be-alert-to-a-small-risk-of-guillain-barre-syndrome-following-vaccination-in-older-adults",
          "https://www.gov.uk/government/publications/respiratory-syncytial-virus-rsv-programme-information-for-healthcare-professionals/rsv-vaccination-of-older-adults-information-for-healthcare-practioners"
        ],
        "qualified_review_status": "PENDING",
        "publication_authorized": false
      },
      "reviewed_primary_urls": [
        "https://www.gov.uk/drug-safety-update/abrysvov-pfizer-rsv-vaccine-and-arexvyv-gsk-rsv-vaccine-be-alert-to-a-small-risk-of-guillain-barre-syndrome-following-vaccination-in-older-adults",
        "https://www.gov.uk/government/publications/respiratory-syncytial-virus-rsv-programme-information-for-healthcare-professionals/rsv-vaccination-of-older-adults-information-for-healthcare-practioners"
      ],
      "snapshot": {
        "id": 290,
        "event_key": "b6b308f9eb432044f498a0c97cda4cb503dcfddd66c104d2f80f170fabafcde4",
        "status": "hold",
        "headline": "Abrysvo▼ (Pfizer RSV vaccine) and Arexvy▼ (GSK RSV vaccine): be alert to a small risk of Guillain-Barré syndrome following vaccination in older adults",
        "region": "UK",
        "regulator": "MHRA",
        "clinical": 1,
        "requires_review": 1,
        "source_evidence_json": "[{\"source_tier\":1,\"authority\":\"MHRA\",\"title\":\"Abrysvo▼ (Pfizer RSV vaccine) and Arexvy▼ (GSK RSV vaccine): be alert to a small risk of Guillain-Barré syndrome following vaccination in older adults\",\"url\":\"https://www.gov.uk/drug-safety-update/abrysvov-pfizer-rsv-vaccine-and-arexvyv-gsk-rsv-vaccine-be-alert-to-a-small-risk-of-guillain-barre-syndrome-following-vaccination-in-older-adults\",\"source_date\":\"2025-07-07T12:29:13.000Z\",\"source_feed\":\"https://www.gov.uk/drug-safety-update.atom\",\"scan_source\":\"mhra-drug-safety\",\"retrieved_at\":\"2026-09-13T06:54:51.108Z\"}]",
        "verification_json": "{\"verified\":true,\"evidence_level\":1,\"regulator_confirmed\":true,\"confidence\":97,\"reason\":\"Regulatory or UK authority evidence present\",\"conflicts\":[]}",
        "medicine_patch_json": "{\"medicine_id\":\"\",\"brand\":\"Abrysvo, Arexvy\",\"generic_name\":\"Pfizer RSV vaccine, GSK RSV vaccine\",\"developer\":\"Pfizer, GSK\",\"mechanism\":[],\"formulation\":\"\",\"global_stage\":\"\",\"uk_regulatory_status\":\"\",\"uk_commercial_status\":\"\",\"nice_status\":\"\",\"nhs_status\":\"\",\"latest_update_text\":\"be alert to a small risk of Guillain-Barré syndrome following vaccination in older adults\",\"radar_score\":75,\"regions\":[\"UK\"],\"unknowns\":[],\"review_flags\":[\"requires_review\"]}",
        "content_package_json": "{\"headline\":\"MHRA warns of small risk of Guillain-Barré syndrome with RSV vaccines Abrysvo and Arexvy in older adults\",\"standfirst\":\"The UK's Medicines and Healthcare products Regulatory Agency (MHRA) has issued a drug safety update regarding a small risk of Guillain-Barré syndrome in older adults following vaccination with Abrysvo (Pfizer RSV vaccine) and Arexvy (GSK RSV vaccine)\",\"what_changed\":\"The MHRA has updated its guidance to include a warning about the small risk of Guillain-Barré syndrome in older adults\",\"why_it_matters_to_uk\":\"This update is relevant to older adults in the UK who may be considering vaccination with Abrysvo or Arexvy, as well as healthcare professionals who administer these vaccines\",\"known_facts\":[{\"claim\":\"The MHRA has warned of a small risk of Guillain-Barré syndrome in older adults following vaccination with Abrysvo and Arexvy\",\"source_url\":\"https://www.gov.uk/drug-safety-update/abrysvov-pfizer-rsv-vaccine-and-arexvyv-gsk-rsv-vaccine-be-alert-to-a-small-risk-of-guillain-barre-syndrome-following-vaccination-in-older-adults\"}],\"unknowns\":[],\"safety\":\"The MHRA has warned of a small risk of Guillain-Barré syndrome in older adults following vaccination with Abrysvo and Arexvy, but the overall safety profile of these vaccines is not fully understood\",\"article_markdown\":\"The UK's Medicines and Healthcare products Regulatory Agency (MHRA) has issued a drug safety update regarding a small risk of Guillain-Barré syndrome in older adults following vaccination with Abrysvo (Pfizer RSV vaccine) and Arexvy (GSK RSV vaccine). Healthcare professionals are advised to be alert to this risk and to monitor patients for symptoms of Guillain-Barré syndrome after vaccination.\",\"ticker_line\":\"MHRA warns of small risk of Guillain-Barré syndrome with RSV vaccines Abrysvo and Arexvy\",\"dossier_amendment\":\"The MHRA's drug safety update regarding Abrysvo and Arexvy has been added to the dossier\",\"existing_page_updates\":[{\"content_key\":\"RSV vaccines\",\"change\":\"Added warning about small risk of Guillain-Barré syndrome in older adults\"}],\"seo\":{\"title\":\"MHRA warns of small risk of Guillain-Barré syndrome with RSV vaccines Abrysvo and Arexvy\",\"description\":\"The UK's Medicines and Healthcare products Regulatory Agency (MHRA) has issued a drug safety update regarding a small risk of Guillain-Barré syndrome in older adults following vaccination with Abrysvo and Arexvy\",\"slug\":\"mhra-warns-of-small-risk-of-guillain-barre-syndrome-with-rsv-vaccines-abrysvo-and-arexvy\",\"keywords\":[\"MHRA\",\"RSV vaccines\",\"Abrysvo\",\"Arexvy\",\"Guillain-Barré syndrome\"]},\"shift_brain\":{\"summary\":\"The MHRA has warned of a small risk of Guillain-Barré syndrome in older adults following vaccination with Abrysvo and Arexvy\",\"facts\":[{\"fact\":\"The MHRA has warned of a small risk of Guillain-Barré syndrome in older adults following vaccination with Abrysvo and Arexvy\",\"source_url\":\"https://www.gov.uk/drug-safety-update/abrysvov-pfizer-rsv-vaccine-and-arexvyv-gsk-rsv-vaccine-be-alert-to-a-small-risk-of-guillain-barre-syndrome-following-vaccination-in-older-adults\"}]},\"review_flags\":[]}",
        "reviewed_at": null,
        "created_at": "2026-09-13T06:54:51.108Z",
        "updated_at": "2026-09-16T11:45:26.811Z",
        "source_review_generation": 0
      },
      "pending_source_change": {
        "id": 4793,
        "observed_at": "2026-09-16 11:45:26",
        "source": "mhra-drug-safety",
        "url": "https://www.gov.uk/drug-safety-update/abrysvov-pfizer-rsv-vaccine-and-arexvyv-gsk-rsv-vaccine-be-alert-to-a-small-risk-of-guillain-barre-syndrome-following-vaccination-in-older-adults",
        "fingerprint": "[\"Abrysvo▼ (Pfizer RSV vaccine) and Arexvy▼ (GSK RSV vaccine): be alert to a small risk of Guillain-Barré syndrome following vaccination in older adults\",[[\"https://www.gov.uk/drug-safety-update/abrysvov-pfizer-rsv-vaccine-and-arexvyv-gsk-rsv-vaccine-be-alert-to-a-small-risk-of-guillain-barre-syndrome-following-vaccination-in-older-adults\",\"Abrysvo▼ (Pfizer RSV vaccine) and Arexvy▼ (GSK RSV vaccine): be alert to a small risk of Guillain-Barré syndrome following vaccination in older adults\",\"2025-07-07T12:29:13.000Z\",\"2025-07-07T12:29:13.000Z\",\"There is a small increase in the risk of Guillain-Barré syndrome following vaccination with Abrysvo (Pfizer respiratory syncytial virus (RSV) vaccine) and Arexvy (GSK RSV vaccine) in adults aged 60 years and older. Healthca…\",\"MHRA\",1]]]",
        "observation": {
          "headline": "Abrysvo▼ (Pfizer RSV vaccine) and Arexvy▼ (GSK RSV vaccine): be alert to a small risk of Guillain-Barré syndrome following vaccination in older adults",
          "evidence": [
            {
              "source_tier": 1,
              "authority": "MHRA",
              "title": "Abrysvo▼ (Pfizer RSV vaccine) and Arexvy▼ (GSK RSV vaccine): be alert to a small risk of Guillain-Barré syndrome following vaccination in older adults",
              "url": "https://www.gov.uk/drug-safety-update/abrysvov-pfizer-rsv-vaccine-and-arexvyv-gsk-rsv-vaccine-be-alert-to-a-small-risk-of-guillain-barre-syndrome-following-vaccination-in-older-adults",
              "summary": "There is a small increase in the risk of Guillain-Barré syndrome following vaccination with Abrysvo (Pfizer respiratory syncytial virus (RSV) vaccine) and Arexvy (GSK RSV vaccine) in adults aged 60 years and older. Healthca…",
              "publisher": "MHRA",
              "discovery_only": false,
              "source_updated_at": "2025-07-07T12:29:13.000Z",
              "source_date": "2025-07-07T12:29:13.000Z",
              "source_feed": "https://www.gov.uk/drug-safety-update.atom",
              "scan_source": "mhra-drug-safety",
              "retrieved_at": "2026-09-16T11:45:26.046Z"
            }
          ],
          "verification": {
            "verified": true,
            "confidence": 99,
            "reason": "Primary regulator or UK authority source",
            "conflicts": []
          },
          "confidence": 99,
          "scores": {
            "urgency": 92,
            "relevance": 75
          },
          "region": "UK"
        },
        "reviewed_snapshot": {
          "id": 290,
          "event_key": "b6b308f9eb432044f498a0c97cda4cb503dcfddd66c104d2f80f170fabafcde4",
          "status": "ready_for_review",
          "headline": "Abrysvo▼ (Pfizer RSV vaccine) and Arexvy▼ (GSK RSV vaccine): be alert to a small risk of Guillain-Barré syndrome following vaccination in older adults",
          "region": "UK",
          "regulator": "MHRA",
          "event_type": "drug_safety_update",
          "relevance_score": 75,
          "urgency_score": 92,
          "confidence_score": 97,
          "clinical": 1,
          "requires_review": 1,
          "source_evidence_json": "[{\"source_tier\":1,\"authority\":\"MHRA\",\"title\":\"Abrysvo▼ (Pfizer RSV vaccine) and Arexvy▼ (GSK RSV vaccine): be alert to a small risk of Guillain-Barré syndrome following vaccination in older adults\",\"url\":\"https://www.gov.uk/drug-safety-update/abrysvov-pfizer-rsv-vaccine-and-arexvyv-gsk-rsv-vaccine-be-alert-to-a-small-risk-of-guillain-barre-syndrome-following-vaccination-in-older-adults\",\"source_date\":\"2025-07-07T12:29:13.000Z\",\"source_feed\":\"https://www.gov.uk/drug-safety-update.atom\",\"scan_source\":\"mhra-drug-safety\",\"retrieved_at\":\"2026-09-13T06:54:51.108Z\"}]",
          "verification_json": "{\"verified\":true,\"evidence_level\":1,\"regulator_confirmed\":true,\"confidence\":97,\"reason\":\"Regulatory or UK authority evidence present\",\"conflicts\":[]}",
          "medicine_patch_json": "{\"medicine_id\":\"\",\"brand\":\"Abrysvo, Arexvy\",\"generic_name\":\"Pfizer RSV vaccine, GSK RSV vaccine\",\"developer\":\"Pfizer, GSK\",\"mechanism\":[],\"formulation\":\"\",\"global_stage\":\"\",\"uk_regulatory_status\":\"\",\"uk_commercial_status\":\"\",\"nice_status\":\"\",\"nhs_status\":\"\",\"latest_update_text\":\"be alert to a small risk of Guillain-Barré syndrome following vaccination in older adults\",\"radar_score\":75,\"regions\":[\"UK\"],\"unknowns\":[],\"review_flags\":[\"requires_review\"]}",
          "content_package_json": "{\"headline\":\"MHRA warns of small risk of Guillain-Barré syndrome with RSV vaccines Abrysvo and Arexvy in older adults\",\"standfirst\":\"The UK's Medicines and Healthcare products Regulatory Agency (MHRA) has issued a drug safety update regarding a small risk of Guillain-Barré syndrome in older adults following vaccination with Abrysvo (Pfizer RSV vaccine) and Arexvy (GSK RSV vaccine)\",\"what_changed\":\"The MHRA has updated its guidance to include a warning about the small risk of Guillain-Barré syndrome in older adults\",\"why_it_matters_to_uk\":\"This update is relevant to older adults in the UK who may be considering vaccination with Abrysvo or Arexvy, as well as healthcare professionals who administer these vaccines\",\"known_facts\":[{\"claim\":\"The MHRA has warned of a small risk of Guillain-Barré syndrome in older adults following vaccination with Abrysvo and Arexvy\",\"source_url\":\"https://www.gov.uk/drug-safety-update/abrysvov-pfizer-rsv-vaccine-and-arexvyv-gsk-rsv-vaccine-be-alert-to-a-small-risk-of-guillain-barre-syndrome-following-vaccination-in-older-adults\"}],\"unknowns\":[],\"safety\":\"The MHRA has warned of a small risk of Guillain-Barré syndrome in older adults following vaccination with Abrysvo and Arexvy, but the overall safety profile of these vaccines is not fully understood\",\"article_markdown\":\"The UK's Medicines and Healthcare products Regulatory Agency (MHRA) has issued a drug safety update regarding a small risk of Guillain-Barré syndrome in older adults following vaccination with Abrysvo (Pfizer RSV vaccine) and Arexvy (GSK RSV vaccine). Healthcare professionals are advised to be alert to this risk and to monitor patients for symptoms of Guillain-Barré syndrome after vaccination.\",\"ticker_line\":\"MHRA warns of small risk of Guillain-Barré syndrome with RSV vaccines Abrysvo and Arexvy\",\"dossier_amendment\":\"The MHRA's drug safety update regarding Abrysvo and Arexvy has been added to the dossier\",\"existing_page_updates\":[{\"content_key\":\"RSV vaccines\",\"change\":\"Added warning about small risk of Guillain-Barré syndrome in older adults\"}],\"seo\":{\"title\":\"MHRA warns of small risk of Guillain-Barré syndrome with RSV vaccines Abrysvo and Arexvy\",\"description\":\"The UK's Medicines and Healthcare products Regulatory Agency (MHRA) has issued a drug safety update regarding a small risk of Guillain-Barré syndrome in older adults following vaccination with Abrysvo and Arexvy\",\"slug\":\"mhra-warns-of-small-risk-of-guillain-barre-syndrome-with-rsv-vaccines-abrysvo-and-arexvy\",\"keywords\":[\"MHRA\",\"RSV vaccines\",\"Abrysvo\",\"Arexvy\",\"Guillain-Barré syndrome\"]},\"shift_brain\":{\"summary\":\"The MHRA has warned of a small risk of Guillain-Barré syndrome in older adults following vaccination with Abrysvo and Arexvy\",\"facts\":[{\"fact\":\"The MHRA has warned of a small risk of Guillain-Barré syndrome in older adults following vaccination with Abrysvo and Arexvy\",\"source_url\":\"https://www.gov.uk/drug-safety-update/abrysvov-pfizer-rsv-vaccine-and-arexvyv-gsk-rsv-vaccine-be-alert-to-a-small-risk-of-guillain-barre-syndrome-following-vaccination-in-older-adults\"}]},\"review_flags\":[]}",
          "review_note": null,
          "reviewed_by": null,
          "reviewed_at": null,
          "created_at": "2026-09-13T06:54:51.108Z",
          "updated_at": "2026-09-13T06:56:09.783Z"
        }
      },
      "source_observation_review": {
        "event_id": 290,
        "kind": "ai",
        "reviewer": "/root/medicine_baselines",
        "decision": "PASS",
        "sha256": "aa5b18bdea5a01410dffba288f94558492b0f266945a5875a6c173b794e909b4",
        "notes": "Observation 4793 matches the 7 July 2025 RSV-vaccine GBS notice and older-adult scope. The reviewed article retains favourable benefit-risk context and links the separately read August 2026 UKHSA guidance, without assigning older-adult risk findings to pregnancy or reusing old programme eligibility as current."
      },
      "first_publication_at": null
    },
    {
      "event_id": 292,
      "contentPackage": {
        "headline": "Asthma alert links reliever overuse with poorer control",
        "standfirst": "The MHRA’s 2025 reminder emphasises anti-inflammatory treatment alongside short-acting reliever prescribing.",
        "what_changed": "The MHRA’s 2025 reminder emphasises anti-inflammatory treatment alongside short-acting reliever prescribing.",
        "why_it_matters_to_uk": "For readers, the relevant next conversation is about their existing asthma plan and symptom control with the clinical team. The regulator also distinguishes routine review from urgent help when prescribed reliever treatment fails to ease worsening breathing symptoms. [MHRA source](https://www.gov.uk/drug-safety-update/short-acting-beta-2-agonists-saba-salbutamol-and-terbutaline-reminder-of-the-risks-from-overuse-in-asthma-and-to-be-aware-of-changes-in-the-saba-prescribing-guidelines)",
        "known_facts": [
          {
            "claim": "Published 24 April 2025.",
            "source_url": "https://www.gov.uk/drug-safety-update/short-acting-beta-2-agonists-saba-salbutamol-and-terbutaline-reminder-of-the-risks-from-overuse-in-asthma-and-to-be-aware-of-changes-in-the-saba-prescribing-guidelines"
          },
          {
            "claim": "Guidance discourages SABA-only asthma treatment.",
            "source_url": "https://www.gov.uk/drug-safety-update/short-acting-beta-2-agonists-saba-salbutamol-and-terbutaline-reminder-of-the-risks-from-overuse-in-asthma-and-to-be-aware-of-changes-in-the-saba-prescribing-guidelines"
          }
        ],
        "unknowns": [
          "This is a dated regulatory reminder, not a newly announced 2026 change.",
          "The linked NICE page could not be retrieved independently in this session; the draft attributes prescribing statements to the fully retrieved MHRA notice."
        ],
        "safety": "General information, not individual medical advice. This article reports official sources and does not replace advice from your clinical team.",
        "article_markdown": "The MHRA has reminded prescribers that excessive reliance on short-acting beta 2 agonist inhalers, including salbutamol and terbutaline, can conceal worsening asthma. Its 24 April 2025 notice connects overuse with a greater risk of severe attacks and death. [MHRA source](https://www.gov.uk/drug-safety-update/short-acting-beta-2-agonists-saba-salbutamol-and-terbutaline-reminder-of-the-risks-from-overuse-in-asthma-and-to-be-aware-of-changes-in-the-saba-prescribing-guidelines)\n\nThe communication reflects updated UK guidance: a short-acting reliever should not be prescribed for asthma at any age without an inhaled corticosteroid. It calls for treatment review when an as-needed reliever is required more than twice weekly, and urgent review when reliever prescriptions increase or anti-inflammatory medication is not collected. [MHRA source](https://www.gov.uk/drug-safety-update/short-acting-beta-2-agonists-saba-salbutamol-and-terbutaline-reminder-of-the-risks-from-overuse-in-asthma-and-to-be-aware-of-changes-in-the-saba-prescribing-guidelines)\n\nThis is a prescribing and monitoring message, not an instruction for someone to abandon their prescribed rescue inhaler. The evidence described includes observational associations; an inhaler count alone does not establish the cause of an individual asthma attack. [MHRA source](https://www.gov.uk/drug-safety-update/short-acting-beta-2-agonists-saba-salbutamol-and-terbutaline-reminder-of-the-risks-from-overuse-in-asthma-and-to-be-aware-of-changes-in-the-saba-prescribing-guidelines)\n\nFor readers, the relevant next conversation is about their existing asthma plan and symptom control with the clinical team. The regulator also distinguishes routine review from urgent help when prescribed reliever treatment fails to ease worsening breathing symptoms. [MHRA source](https://www.gov.uk/drug-safety-update/short-acting-beta-2-agonists-saba-salbutamol-and-terbutaline-reminder-of-the-risks-from-overuse-in-asthma-and-to-be-aware-of-changes-in-the-saba-prescribing-guidelines)",
        "ticker_line": "",
        "dossier_amendment": "",
        "destinations": [
          "medicine_news",
          "knowledge_links",
          "search",
          "sitemap"
        ],
        "seo": {
          "slug": "asthma-reliever-overuse-mhra-reminder",
          "title": "Asthma reliever overuse: MHRA reminder",
          "description": "A dated MHRA alert explains the risks of reliever overuse and the need for asthma treatment review.",
          "datePublished": "2026-09-16",
          "author": "SHIFT AI Newsroom",
          "reviewer": "Owner editorial approval; AI-assisted source review; no independent clinical review",
          "source_url": "https://www.gov.uk/drug-safety-update/short-acting-beta-2-agonists-saba-salbutamol-and-terbutaline-reminder-of-the-risks-from-overuse-in-asthma-and-to-be-aware-of-changes-in-the-saba-prescribing-guidelines",
          "image": "/assets/og-default.jpg",
          "image_alt": "Asthma alert links reliever overuse with poorer control",
          "keywords": [],
          "canonical": "https://shiftsometimber.co.uk/medicine-news/asthma-reliever-overuse-mhra-reminder"
        }
      },
      "review": {
        "event_id": 292,
        "decision": "PASS",
        "decision_scope": "offline_primary_source_editorial_review",
        "input_json_sha256": "b25fac5619cc5f2a15bbedeece85630cd0feac9396906d749201f810c509bc41",
        "declared_content_sha256": "8abe1e6536b5ca59718119da7c0ebe3d9dfaf3355b903e8f7cddf5c0451bf732",
        "article_markdown_sha256": "cc1da457de115798f30010fc48e17e38e8c69951df2460e85872ae8eeeac945c",
        "author": {
          "id": "/root/grub_closeout",
          "kind": "ai"
        },
        "reviewer": {
          "id": "/root/commissioning_closeout",
          "kind": "ai"
        },
        "reviewed_at": "2026-09-16T18:27:14.870716Z",
        "review_notes": "The April 2025 MHRA notice supports the corticosteroid co-prescription and review statements. The draft keeps the emergency-help distinction and does not instruct readers to abandon a prescribed reliever. Canonical identity against event 23 remains unresolved.",
        "findings": [],
        "primary_sources_checked": [
          "https://www.gov.uk/drug-safety-update/short-acting-beta-2-agonists-saba-salbutamol-and-terbutaline-reminder-of-the-risks-from-overuse-in-asthma-and-to-be-aware-of-changes-in-the-saba-prescribing-guidelines"
        ],
        "qualified_review_status": "PENDING",
        "publication_authorized": false
      },
      "reviewed_primary_urls": [
        "https://www.gov.uk/drug-safety-update/short-acting-beta-2-agonists-saba-salbutamol-and-terbutaline-reminder-of-the-risks-from-overuse-in-asthma-and-to-be-aware-of-changes-in-the-saba-prescribing-guidelines"
      ],
      "snapshot": {
        "id": 292,
        "event_key": "60943289c874145ac09e11bc8abfbdbd77e9d4364410c2cb5c9aab3343f10733",
        "status": "hold",
        "headline": "Short-acting beta 2 agonists (SABA) (salbutamol and terbutaline): reminder of the risks from overuse in asthma and to be aware of changes in the SABA prescribing guidelines",
        "region": "UK",
        "regulator": "MHRA",
        "clinical": 1,
        "requires_review": 1,
        "source_evidence_json": "[{\"source_tier\":1,\"authority\":\"MHRA\",\"title\":\"Short-acting beta 2 agonists (SABA) (salbutamol and terbutaline): reminder of the risks from overuse in asthma and to be aware of changes in the SABA prescribing guidelines\",\"url\":\"https://www.gov.uk/drug-safety-update/short-acting-beta-2-agonists-saba-salbutamol-and-terbutaline-reminder-of-the-risks-from-overuse-in-asthma-and-to-be-aware-of-changes-in-the-saba-prescribing-guidelines\",\"source_date\":\"2025-04-24T11:02:48.000Z\",\"source_feed\":\"https://www.gov.uk/drug-safety-update.atom\",\"scan_source\":\"mhra-drug-safety\",\"retrieved_at\":\"2026-09-13T06:54:52.046Z\"}]",
        "verification_json": "{\"verified\":true,\"evidence_level\":1,\"regulator_confirmed\":true,\"confidence\":97,\"reason\":\"Regulatory or UK authority evidence present\",\"conflicts\":[]}",
        "medicine_patch_json": "{\"medicine_id\":\"\",\"brand\":\"\",\"generic_name\":\"salbutamol, terbutaline\",\"developer\":\"\",\"mechanism\":[\"short-acting beta 2 agonists\"],\"formulation\":\"\",\"global_stage\":\"\",\"uk_regulatory_status\":\"\",\"uk_commercial_status\":\"\",\"nice_status\":\"\",\"nhs_status\":\"\",\"latest_update_text\":\"Reminder of the risks from overuse in asthma and to be aware of changes in the SABA prescribing guidelines\",\"radar_score\":84,\"regions\":[\"UK\"],\"unknowns\":[\"developer\",\"formulation\",\"global_stage\",\"uk_regulatory_status\",\"uk_commercial_status\",\"nice_status\",\"nhs_status\"],\"review_flags\":[\"requires_review\"]}",
        "content_package_json": "{\"headline\":\"MHRA Issues Reminder on Risks of Overusing Short-Acting Beta 2 Agonists in Asthma\",\"standfirst\":\"The UK's Medicines and Healthcare products Regulatory Agency (MHRA) has reminded healthcare professionals of the risks associated with overusing short-acting beta 2 agonists (SABAs) such as salbutamol and terbutaline in asthma management.\",\"what_changed\":\"The MHRA has updated its guidance to reflect changes in the prescribing guidelines for SABAs, highlighting the need for careful use to avoid overuse and potential adverse effects.\",\"why_it_matters_to_uk\":\"This update is significant for UK patients with asthma, as it aims to ensure the safe and effective use of SABAs, which are commonly used for relieving acute asthma symptoms.\",\"known_facts\":[{\"claim\":\"The MHRA has issued a reminder on the risks of overusing short-acting beta 2 agonists in asthma.\",\"source_url\":\"https://www.gov.uk/drug-safety-update/short-acting-beta-2-agonists-saba-salbutamol-and-terbutaline-reminder-of-the-risks-from-overuse-in-asthma-and-to-be-aware-of-changes-in-the-saba-prescribing-guidelines\"}],\"unknowns\":[\"Developer of salbutamol and terbutaline\",\"Formulation details\",\"Global stage of development for new SABA treatments\",\"UK regulatory status of salbutamol and terbutaline\",\"UK commercial status of salbutamol and terbutaline\",\"NICE status for SABA treatments\",\"NHS status for SABA treatments\"],\"safety\":\"The MHRA reminder highlights the importance of using SABAs judiciously to minimize the risk of adverse effects associated with overuse.\",\"article_markdown\":\"The MHRA has reminded healthcare professionals of the need to use short-acting beta 2 agonists (SABAs) like salbutamol and terbutaline carefully in asthma management. This is due to the risks associated with overusing these medications. The updated guidance reflects changes in SABA prescribing guidelines, aiming to ensure safe and effective use.\",\"ticker_line\":\"MHRA Reminds Healthcare Professionals of SABA Overuse Risks in Asthma\",\"dossier_amendment\":\"Update on SABA prescribing guidelines and risks of overuse\",\"existing_page_updates\":[{\"content_key\":\"asthma_management\",\"change\":\"Add information on updated SABA prescribing guidelines and risks of overuse\"}],\"seo\":{\"title\":\"MHRA Reminder on SABA Overuse Risks in Asthma\",\"description\":\"The MHRA has issued a reminder on the risks of overusing short-acting beta 2 agonists in asthma, highlighting updates to prescribing guidelines.\",\"slug\":\"mhra-reminder-saba-overuse-risks-asthma\",\"keywords\":[\"MHRA\",\"SABA\",\"asthma\",\"salbutamol\",\"terbutaline\",\"overuse risks\"]},\"shift_brain\":{\"summary\":\"The MHRA has reminded healthcare professionals about the risks of overusing SABAs in asthma and updated prescribing guidelines.\",\"facts\":[{\"fact\":\"The MHRA reminder is about the risks of overusing short-acting beta 2 agonists in asthma.\",\"source_url\":\"https://www.gov.uk/drug-safety-update/short-acting-beta-2-agonists-saba-salbutamol-and-terbutaline-reminder-of-the-risks-from-overuse-in-asthma-and-to-be-aware-of-changes-in-the-saba-prescribing-guidelines\"}]},\"review_flags\":[\"requires_review\"]}",
        "reviewed_at": null,
        "created_at": "2026-09-13T06:54:52.046Z",
        "updated_at": "2026-09-16T11:45:28.288Z",
        "source_review_generation": 0
      },
      "pending_source_change": {
        "id": 4796,
        "observed_at": "2026-09-16 11:45:28",
        "source": "mhra-drug-safety",
        "url": "https://www.gov.uk/drug-safety-update/short-acting-beta-2-agonists-saba-salbutamol-and-terbutaline-reminder-of-the-risks-from-overuse-in-asthma-and-to-be-aware-of-changes-in-the-saba-prescribing-guidelines",
        "fingerprint": "[\"Short-acting beta 2 agonists (SABA) (salbutamol and terbutaline): reminder of the risks from overuse in asthma and to be aware of changes in the SABA prescribing guidelines\",[[\"https://www.gov.uk/drug-safety-update/short-acting-beta-2-agonists-saba-salbutamol-and-terbutaline-reminder-of-the-risks-from-overuse-in-asthma-and-to-be-aware-of-changes-in-the-saba-prescribing-guidelines\",\"Short-acting beta 2 agonists (SABA) (salbutamol and terbutaline): reminder of the risks from overuse in asthma and to be aware of changes in the SABA prescribing guidelines\",\"2025-04-24T11:02:48.000Z\",\"2025-04-24T11:02:48.000Z\",\"Healthcare professionals and patients are reminded of the risk of severe asthma attacks and increased mortality associated with overuse of SABA with or without anti-inflammatory maintenance therapy in patients with asthma. H…\",\"MHRA\",1]]]",
        "observation": {
          "headline": "Short-acting beta 2 agonists (SABA) (salbutamol and terbutaline): reminder of the risks from overuse in asthma and to be aware of changes in the SABA prescribing guidelines",
          "evidence": [
            {
              "source_tier": 1,
              "authority": "MHRA",
              "title": "Short-acting beta 2 agonists (SABA) (salbutamol and terbutaline): reminder of the risks from overuse in asthma and to be aware of changes in the SABA prescribing guidelines",
              "url": "https://www.gov.uk/drug-safety-update/short-acting-beta-2-agonists-saba-salbutamol-and-terbutaline-reminder-of-the-risks-from-overuse-in-asthma-and-to-be-aware-of-changes-in-the-saba-prescribing-guidelines",
              "summary": "Healthcare professionals and patients are reminded of the risk of severe asthma attacks and increased mortality associated with overuse of SABA with or without anti-inflammatory maintenance therapy in patients with asthma. H…",
              "publisher": "MHRA",
              "discovery_only": false,
              "source_updated_at": "2025-04-24T11:02:48.000Z",
              "source_date": "2025-04-24T11:02:48.000Z",
              "source_feed": "https://www.gov.uk/drug-safety-update.atom",
              "scan_source": "mhra-drug-safety",
              "retrieved_at": "2026-09-16T11:45:27.674Z"
            }
          ],
          "verification": {
            "verified": true,
            "confidence": 99,
            "reason": "Primary regulator or UK authority source",
            "conflicts": []
          },
          "confidence": 99,
          "scores": {
            "urgency": 92,
            "relevance": 75
          },
          "region": "UK"
        },
        "reviewed_snapshot": {
          "id": 292,
          "event_key": "60943289c874145ac09e11bc8abfbdbd77e9d4364410c2cb5c9aab3343f10733",
          "status": "ready_for_review",
          "headline": "Short-acting beta 2 agonists (SABA) (salbutamol and terbutaline): reminder of the risks from overuse in asthma and to be aware of changes in the SABA prescribing guidelines",
          "region": "UK",
          "regulator": "MHRA",
          "event_type": "drug_safety_update",
          "relevance_score": 75,
          "urgency_score": 92,
          "confidence_score": 97,
          "clinical": 1,
          "requires_review": 1,
          "source_evidence_json": "[{\"source_tier\":1,\"authority\":\"MHRA\",\"title\":\"Short-acting beta 2 agonists (SABA) (salbutamol and terbutaline): reminder of the risks from overuse in asthma and to be aware of changes in the SABA prescribing guidelines\",\"url\":\"https://www.gov.uk/drug-safety-update/short-acting-beta-2-agonists-saba-salbutamol-and-terbutaline-reminder-of-the-risks-from-overuse-in-asthma-and-to-be-aware-of-changes-in-the-saba-prescribing-guidelines\",\"source_date\":\"2025-04-24T11:02:48.000Z\",\"source_feed\":\"https://www.gov.uk/drug-safety-update.atom\",\"scan_source\":\"mhra-drug-safety\",\"retrieved_at\":\"2026-09-13T06:54:52.046Z\"}]",
          "verification_json": "{\"verified\":true,\"evidence_level\":1,\"regulator_confirmed\":true,\"confidence\":97,\"reason\":\"Regulatory or UK authority evidence present\",\"conflicts\":[]}",
          "medicine_patch_json": "{\"medicine_id\":\"\",\"brand\":\"\",\"generic_name\":\"salbutamol, terbutaline\",\"developer\":\"\",\"mechanism\":[\"short-acting beta 2 agonists\"],\"formulation\":\"\",\"global_stage\":\"\",\"uk_regulatory_status\":\"\",\"uk_commercial_status\":\"\",\"nice_status\":\"\",\"nhs_status\":\"\",\"latest_update_text\":\"Reminder of the risks from overuse in asthma and to be aware of changes in the SABA prescribing guidelines\",\"radar_score\":84,\"regions\":[\"UK\"],\"unknowns\":[\"developer\",\"formulation\",\"global_stage\",\"uk_regulatory_status\",\"uk_commercial_status\",\"nice_status\",\"nhs_status\"],\"review_flags\":[\"requires_review\"]}",
          "content_package_json": "{\"headline\":\"MHRA Issues Reminder on Risks of Overusing Short-Acting Beta 2 Agonists in Asthma\",\"standfirst\":\"The UK's Medicines and Healthcare products Regulatory Agency (MHRA) has reminded healthcare professionals of the risks associated with overusing short-acting beta 2 agonists (SABAs) such as salbutamol and terbutaline in asthma management.\",\"what_changed\":\"The MHRA has updated its guidance to reflect changes in the prescribing guidelines for SABAs, highlighting the need for careful use to avoid overuse and potential adverse effects.\",\"why_it_matters_to_uk\":\"This update is significant for UK patients with asthma, as it aims to ensure the safe and effective use of SABAs, which are commonly used for relieving acute asthma symptoms.\",\"known_facts\":[{\"claim\":\"The MHRA has issued a reminder on the risks of overusing short-acting beta 2 agonists in asthma.\",\"source_url\":\"https://www.gov.uk/drug-safety-update/short-acting-beta-2-agonists-saba-salbutamol-and-terbutaline-reminder-of-the-risks-from-overuse-in-asthma-and-to-be-aware-of-changes-in-the-saba-prescribing-guidelines\"}],\"unknowns\":[\"Developer of salbutamol and terbutaline\",\"Formulation details\",\"Global stage of development for new SABA treatments\",\"UK regulatory status of salbutamol and terbutaline\",\"UK commercial status of salbutamol and terbutaline\",\"NICE status for SABA treatments\",\"NHS status for SABA treatments\"],\"safety\":\"The MHRA reminder highlights the importance of using SABAs judiciously to minimize the risk of adverse effects associated with overuse.\",\"article_markdown\":\"The MHRA has reminded healthcare professionals of the need to use short-acting beta 2 agonists (SABAs) like salbutamol and terbutaline carefully in asthma management. This is due to the risks associated with overusing these medications. The updated guidance reflects changes in SABA prescribing guidelines, aiming to ensure safe and effective use.\",\"ticker_line\":\"MHRA Reminds Healthcare Professionals of SABA Overuse Risks in Asthma\",\"dossier_amendment\":\"Update on SABA prescribing guidelines and risks of overuse\",\"existing_page_updates\":[{\"content_key\":\"asthma_management\",\"change\":\"Add information on updated SABA prescribing guidelines and risks of overuse\"}],\"seo\":{\"title\":\"MHRA Reminder on SABA Overuse Risks in Asthma\",\"description\":\"The MHRA has issued a reminder on the risks of overusing short-acting beta 2 agonists in asthma, highlighting updates to prescribing guidelines.\",\"slug\":\"mhra-reminder-saba-overuse-risks-asthma\",\"keywords\":[\"MHRA\",\"SABA\",\"asthma\",\"salbutamol\",\"terbutaline\",\"overuse risks\"]},\"shift_brain\":{\"summary\":\"The MHRA has reminded healthcare professionals about the risks of overusing SABAs in asthma and updated prescribing guidelines.\",\"facts\":[{\"fact\":\"The MHRA reminder is about the risks of overusing short-acting beta 2 agonists in asthma.\",\"source_url\":\"https://www.gov.uk/drug-safety-update/short-acting-beta-2-agonists-saba-salbutamol-and-terbutaline-reminder-of-the-risks-from-overuse-in-asthma-and-to-be-aware-of-changes-in-the-saba-prescribing-guidelines\"}]},\"review_flags\":[\"requires_review\"]}",
          "review_note": null,
          "reviewed_by": null,
          "reviewed_at": null,
          "created_at": "2026-09-13T06:54:52.046Z",
          "updated_at": "2026-09-13T06:55:56.691Z"
        }
      },
      "source_observation_review": {
        "event_id": 292,
        "kind": "ai",
        "reviewer": "/root/medicine_baselines",
        "decision": "PASS",
        "sha256": "3d3438c4dbb28ccc7c9f9a8cf619941e00610400201c44d28063bd13b2cb495a",
        "notes": "Observation 4796 matches the 24 April 2025 MHRA SABA-overuse reminder. Prescribing claims remain attributed to the retrieved MHRA notice; the draft does not claim independent retrieval of the linked NICE page. Earlier source-identical event 23 is already reject in the actual snapshot, so publishing 292 does not duplicate a published/approved older article."
      },
      "first_publication_at": null
    },
    {
      "event_id": 294,
      "contentPackage": {
        "headline": "Bromocriptine reminder stresses blood pressure checks",
        "standfirst": "The MHRA’s 2024 review reinforced monitoring when the medicine is used to suppress milk production after childbirth.",
        "what_changed": "The MHRA’s 2024 review reinforced monitoring when the medicine is used to suppress milk production after childbirth.",
        "why_it_matters_to_uk": "This report describes the regulator’s monitoring requirements; it does not select a medicine, dose or monitoring schedule for an individual. A suspected-reaction report can trigger a safety review but cannot, by itself, establish how often an adverse effect occurs. The original dated notice remains linked for the full prescribing context. [MHRA source](https://www.gov.uk/drug-safety-update/bromocriptine-monitor-blood-pressure-when-prescribing-bromocriptine-for-prevention-or-inhibition-of-post-partum-physiological-lactation)",
        "known_facts": [
          {
            "claim": "Published 24 October 2024.",
            "source_url": "https://www.gov.uk/drug-safety-update/bromocriptine-monitor-blood-pressure-when-prescribing-bromocriptine-for-prevention-or-inhibition-of-post-partum-physiological-lactation"
          },
          {
            "claim": "Monitoring emphasised early and after dose increases.",
            "source_url": "https://www.gov.uk/drug-safety-update/bromocriptine-monitor-blood-pressure-when-prescribing-bromocriptine-for-prevention-or-inhibition-of-post-partum-physiological-lactation"
          }
        ],
        "unknowns": [
          "This is a historical safety reminder, not a new 2026 restriction.",
          "No incidence estimate is available from the single report described."
        ],
        "safety": "General information, not individual medical advice. This article reports official sources and does not replace advice from your clinical team.",
        "article_markdown": "A 24 October 2024 MHRA notice reinforced the importance of blood pressure monitoring with bromocriptine, particularly early in treatment. The review followed a Yellow Card report that highlighted the need for those checks. [MHRA source](https://www.gov.uk/drug-safety-update/bromocriptine-monitor-blood-pressure-when-prescribing-bromocriptine-for-prevention-or-inhibition-of-post-partum-physiological-lactation)\n\nFor suppressing milk production after childbirth, the regulator limits bromocriptine to medical indications. It is not recommended for routine suppression or ordinary breast pain and engorgement. The notice also lists blood-pressure and cardiovascular conditions in which it must not be used. [MHRA source](https://www.gov.uk/drug-safety-update/bromocriptine-monitor-blood-pressure-when-prescribing-bromocriptine-for-prevention-or-inhibition-of-post-partum-physiological-lactation)\n\nThe warning extends beyond the initial prescription: clinicians are asked to monitor during subsequent dose increases too. The patient advice identifies chest pain or an unusually severe or persistent headache, with or without visual symptoms, as reasons for urgent medical assessment. [MHRA source](https://www.gov.uk/drug-safety-update/bromocriptine-monitor-blood-pressure-when-prescribing-bromocriptine-for-prevention-or-inhibition-of-post-partum-physiological-lactation)\n\nThis report describes the regulator’s monitoring requirements; it does not select a medicine, dose or monitoring schedule for an individual. A suspected-reaction report can trigger a safety review but cannot, by itself, establish how often an adverse effect occurs. The original dated notice remains linked for the full prescribing context. [MHRA source](https://www.gov.uk/drug-safety-update/bromocriptine-monitor-blood-pressure-when-prescribing-bromocriptine-for-prevention-or-inhibition-of-post-partum-physiological-lactation)",
        "ticker_line": "",
        "dossier_amendment": "",
        "destinations": [
          "medicine_news",
          "knowledge_links",
          "search",
          "sitemap"
        ],
        "seo": {
          "slug": "bromocriptine-postpartum-blood-pressure-mhra",
          "title": "Bromocriptine: blood pressure monitoring",
          "description": "The MHRA reminder covers blood pressure checks when bromocriptine is prescribed after childbirth.",
          "datePublished": "2026-09-16",
          "author": "SHIFT AI Newsroom",
          "reviewer": "Owner editorial approval; AI-assisted source review; no independent clinical review",
          "source_url": "https://www.gov.uk/drug-safety-update/bromocriptine-monitor-blood-pressure-when-prescribing-bromocriptine-for-prevention-or-inhibition-of-post-partum-physiological-lactation",
          "image": "/assets/og-default.jpg",
          "image_alt": "Bromocriptine reminder stresses blood pressure checks",
          "keywords": [],
          "canonical": "https://shiftsometimber.co.uk/medicine-news/bromocriptine-postpartum-blood-pressure-mhra"
        }
      },
      "review": {
        "event_id": 294,
        "decision": "PASS",
        "decision_scope": "offline_primary_source_editorial_review",
        "input_json_sha256": "b25fac5619cc5f2a15bbedeece85630cd0feac9396906d749201f810c509bc41",
        "declared_content_sha256": "30150dc589a61ce93d59cec6025dc0d69fe3d8b102f1e29d92d07b700f6ef3a1",
        "article_markdown_sha256": "2c18e01897242353e869546377c51f28292b91121587af09e435a4aeebfe4020",
        "author": {
          "id": "/root/grub_closeout",
          "kind": "ai"
        },
        "reviewer": {
          "id": "/root/commissioning_closeout",
          "kind": "ai"
        },
        "reviewed_at": "2026-09-16T18:27:14.870716Z",
        "review_notes": "The October 2024 MHRA notice supports the medical-indication limits, early and post-increase blood-pressure monitoring, and urgent symptom assessment. It is explicitly dated historical reporting. Canonical identity against event 35 remains unresolved.",
        "findings": [],
        "primary_sources_checked": [
          "https://www.gov.uk/drug-safety-update/bromocriptine-monitor-blood-pressure-when-prescribing-bromocriptine-for-prevention-or-inhibition-of-post-partum-physiological-lactation"
        ],
        "qualified_review_status": "PENDING",
        "publication_authorized": false
      },
      "reviewed_primary_urls": [
        "https://www.gov.uk/drug-safety-update/bromocriptine-monitor-blood-pressure-when-prescribing-bromocriptine-for-prevention-or-inhibition-of-post-partum-physiological-lactation"
      ],
      "snapshot": {
        "id": 294,
        "event_key": "52c08b5d444693f5be174d86bea34ff9fbecb1bd375d21706cb61ccb0a7d0373",
        "status": "hold",
        "headline": "Bromocriptine: monitor blood pressure when prescribing bromocriptine for prevention or inhibition of post-partum physiological lactation",
        "region": "UK",
        "regulator": "MHRA",
        "clinical": 1,
        "requires_review": 1,
        "source_evidence_json": "[{\"source_tier\":1,\"authority\":\"MHRA\",\"title\":\"Bromocriptine: monitor blood pressure when prescribing bromocriptine for prevention or inhibition of post-partum physiological lactation\",\"url\":\"https://www.gov.uk/drug-safety-update/bromocriptine-monitor-blood-pressure-when-prescribing-bromocriptine-for-prevention-or-inhibition-of-post-partum-physiological-lactation\",\"source_date\":\"2024-10-24T10:00:18.000Z\",\"source_feed\":\"https://www.gov.uk/drug-safety-update.atom\",\"scan_source\":\"mhra-drug-safety\",\"retrieved_at\":\"2026-09-13T06:54:53.190Z\"}]",
        "verification_json": "{\"verified\":true,\"evidence_level\":1,\"regulator_confirmed\":true,\"confidence\":97,\"reason\":\"Regulatory or UK authority evidence present\",\"conflicts\":[]}",
        "medicine_patch_json": "{\"medicine_id\":\"\",\"brand\":\"\",\"generic_name\":\"Bromocriptine\",\"developer\":\"\",\"mechanism\":[],\"formulation\":\"\",\"global_stage\":\"\",\"uk_regulatory_status\":\"\",\"uk_commercial_status\":\"\",\"nice_status\":\"\",\"nhs_status\":\"\",\"latest_update_text\":\"Monitor blood pressure when prescribing bromocriptine for prevention or inhibition of post-partum physiological lactation\",\"radar_score\":87,\"regions\":[\"UK\"],\"unknowns\":[],\"review_flags\":[\"requires_review\"]}",
        "content_package_json": "{\"headline\":\"MHRA Updates Guidance on Bromocriptine for Post-Partum Lactation\",\"standfirst\":\"The Medicines and Healthcare products Regulatory Agency (MHRA) has issued a drug safety update on the use of bromocriptine for the prevention or inhibition of post-partum physiological lactation, emphasizing the importance of monitoring blood pressure.\",\"what_changed\":\"The MHRA now advises healthcare professionals to monitor blood pressure when prescribing bromocriptine for this specific use.\",\"why_it_matters_to_uk\":\"This update is relevant to healthcare professionals in the UK who prescribe bromocriptine to patients for the prevention or inhibition of post-partum physiological lactation, highlighting the need for careful monitoring to ensure patient safety.\",\"known_facts\":[{\"claim\":\"The MHRA has updated its guidance on the use of bromocriptine for post-partum lactation, advising on blood pressure monitoring.\",\"source_url\":\"https://www.gov.uk/drug-safety-update/bromocriptine-monitor-blood-pressure-when-prescribing-bromocriptine-for-prevention-or-inhibition-of-post-partum-physiological-lactation\"}],\"unknowns\":[],\"safety\":\"Healthcare professionals are advised to monitor blood pressure in patients prescribed bromocriptine for the prevention or inhibition of post-partum physiological lactation.\",\"article_markdown\":\"The MHRA has issued a drug safety update regarding the use of bromocriptine for preventing or inhibiting post-partum physiological lactation. The key point from this update is the recommendation to monitor blood pressure in patients prescribed bromocriptine for this purpose. This guidance is aimed at ensuring the safe use of bromocriptine in the post-partum setting.\",\"ticker_line\":\"MHRA Issues Drug Safety Update on Bromocriptine for Post-Partum Lactation\",\"dossier_amendment\":\"The safety information for bromocriptine has been updated to include the recommendation for blood pressure monitoring in the context of post-partum lactation prevention or inhibition.\",\"existing_page_updates\":[{\"content_key\":\"bromocriptine_post_partum_lactation\",\"change\":\"Add information on the MHRA's updated guidance regarding blood pressure monitoring.\"}],\"seo\":{\"title\":\"Bromocriptine and Post-Partum Lactation: MHRA Guidance Update\",\"description\":\"The MHRA has updated its guidance on bromocriptine for preventing or inhibiting post-partum physiological lactation, emphasizing blood pressure monitoring.\",\"slug\":\"bromocriptine-post-partum-lactation-mhra-guidance\",\"keywords\":[\"Bromocriptine\",\"Post-Partum Lactation\",\"MHRA Guidance\",\"Drug Safety Update\"]},\"shift_brain\":{\"summary\":\"The MHRA has updated its guidance on the use of bromocriptine for post-partum lactation, advising healthcare professionals to monitor blood pressure.\",\"facts\":[{\"fact\":\"Bromocriptine is used for the prevention or inhibition of post-partum physiological lactation.\",\"source_url\":\"https://www.gov.uk/drug-safety-update/bromocriptine-monitor-blood-pressure-when-prescribing-bromocriptine-for-prevention-or-inhibition-of-post-partum-physiological-lactation\"}]},\"review_flags\":[],\"editorial_cadence\":true,\"editorial_candidate_at\":\"2026-09-15T22:31:16.848Z\"}",
        "reviewed_at": null,
        "created_at": "2026-09-13T06:54:53.190Z",
        "updated_at": "2026-09-16T11:45:31.994Z",
        "source_review_generation": 0
      },
      "pending_source_change": {
        "id": 4806,
        "observed_at": "2026-09-16 11:45:32",
        "source": "mhra-drug-safety",
        "url": "https://www.gov.uk/drug-safety-update/bromocriptine-monitor-blood-pressure-when-prescribing-bromocriptine-for-prevention-or-inhibition-of-post-partum-physiological-lactation",
        "fingerprint": "[\"Bromocriptine: monitor blood pressure when prescribing bromocriptine for prevention or inhibition of post-partum physiological lactation\",[[\"https://www.gov.uk/drug-safety-update/bromocriptine-monitor-blood-pressure-when-prescribing-bromocriptine-for-prevention-or-inhibition-of-post-partum-physiological-lactation\",\"Bromocriptine: monitor blood pressure when prescribing bromocriptine for prevention or inhibition of post-partum physiological lactation\",\"2024-10-24T10:00:18.000Z\",\"2024-10-24T10:00:18.000Z\",\"A safety review has been conducted by the MHRA following a Yellow Card report concerning a patient who was taking bromocriptine. The review concluded that blood pressure monitoring of patients prescribed with this drug is es…\",\"MHRA\",1]]]",
        "observation": {
          "headline": "Bromocriptine: monitor blood pressure when prescribing bromocriptine for prevention or inhibition of post-partum physiological lactation",
          "evidence": [
            {
              "source_tier": 1,
              "authority": "MHRA",
              "title": "Bromocriptine: monitor blood pressure when prescribing bromocriptine for prevention or inhibition of post-partum physiological lactation",
              "url": "https://www.gov.uk/drug-safety-update/bromocriptine-monitor-blood-pressure-when-prescribing-bromocriptine-for-prevention-or-inhibition-of-post-partum-physiological-lactation",
              "summary": "A safety review has been conducted by the MHRA following a Yellow Card report concerning a patient who was taking bromocriptine. The review concluded that blood pressure monitoring of patients prescribed with this drug is es…",
              "publisher": "MHRA",
              "discovery_only": false,
              "source_updated_at": "2024-10-24T10:00:18.000Z",
              "source_date": "2024-10-24T10:00:18.000Z",
              "source_feed": "https://www.gov.uk/drug-safety-update.atom",
              "scan_source": "mhra-drug-safety",
              "retrieved_at": "2026-09-16T11:45:31.359Z"
            }
          ],
          "verification": {
            "verified": true,
            "confidence": 99,
            "reason": "Primary regulator or UK authority source",
            "conflicts": []
          },
          "confidence": 99,
          "scores": {
            "urgency": 92,
            "relevance": 83
          },
          "region": "UK"
        },
        "reviewed_snapshot": {
          "id": 294,
          "event_key": "52c08b5d444693f5be174d86bea34ff9fbecb1bd375d21706cb61ccb0a7d0373",
          "status": "ready_for_review",
          "headline": "Bromocriptine: monitor blood pressure when prescribing bromocriptine for prevention or inhibition of post-partum physiological lactation",
          "region": "UK",
          "regulator": "MHRA",
          "event_type": "drug_safety_update",
          "relevance_score": 83,
          "urgency_score": 92,
          "confidence_score": 97,
          "clinical": 1,
          "requires_review": 1,
          "source_evidence_json": "[{\"source_tier\":1,\"authority\":\"MHRA\",\"title\":\"Bromocriptine: monitor blood pressure when prescribing bromocriptine for prevention or inhibition of post-partum physiological lactation\",\"url\":\"https://www.gov.uk/drug-safety-update/bromocriptine-monitor-blood-pressure-when-prescribing-bromocriptine-for-prevention-or-inhibition-of-post-partum-physiological-lactation\",\"source_date\":\"2024-10-24T10:00:18.000Z\",\"source_feed\":\"https://www.gov.uk/drug-safety-update.atom\",\"scan_source\":\"mhra-drug-safety\",\"retrieved_at\":\"2026-09-13T06:54:53.190Z\"}]",
          "verification_json": "{\"verified\":true,\"evidence_level\":1,\"regulator_confirmed\":true,\"confidence\":97,\"reason\":\"Regulatory or UK authority evidence present\",\"conflicts\":[]}",
          "medicine_patch_json": "{\"medicine_id\":\"\",\"brand\":\"\",\"generic_name\":\"Bromocriptine\",\"developer\":\"\",\"mechanism\":[],\"formulation\":\"\",\"global_stage\":\"\",\"uk_regulatory_status\":\"\",\"uk_commercial_status\":\"\",\"nice_status\":\"\",\"nhs_status\":\"\",\"latest_update_text\":\"Monitor blood pressure when prescribing bromocriptine for prevention or inhibition of post-partum physiological lactation\",\"radar_score\":87,\"regions\":[\"UK\"],\"unknowns\":[],\"review_flags\":[\"requires_review\"]}",
          "content_package_json": "{\"headline\":\"MHRA Updates Guidance on Bromocriptine for Post-Partum Lactation\",\"standfirst\":\"The Medicines and Healthcare products Regulatory Agency (MHRA) has issued a drug safety update on the use of bromocriptine for the prevention or inhibition of post-partum physiological lactation, emphasizing the importance of monitoring blood pressure.\",\"what_changed\":\"The MHRA now advises healthcare professionals to monitor blood pressure when prescribing bromocriptine for this specific use.\",\"why_it_matters_to_uk\":\"This update is relevant to healthcare professionals in the UK who prescribe bromocriptine to patients for the prevention or inhibition of post-partum physiological lactation, highlighting the need for careful monitoring to ensure patient safety.\",\"known_facts\":[{\"claim\":\"The MHRA has updated its guidance on the use of bromocriptine for post-partum lactation, advising on blood pressure monitoring.\",\"source_url\":\"https://www.gov.uk/drug-safety-update/bromocriptine-monitor-blood-pressure-when-prescribing-bromocriptine-for-prevention-or-inhibition-of-post-partum-physiological-lactation\"}],\"unknowns\":[],\"safety\":\"Healthcare professionals are advised to monitor blood pressure in patients prescribed bromocriptine for the prevention or inhibition of post-partum physiological lactation.\",\"article_markdown\":\"The MHRA has issued a drug safety update regarding the use of bromocriptine for preventing or inhibiting post-partum physiological lactation. The key point from this update is the recommendation to monitor blood pressure in patients prescribed bromocriptine for this purpose. This guidance is aimed at ensuring the safe use of bromocriptine in the post-partum setting.\",\"ticker_line\":\"MHRA Issues Drug Safety Update on Bromocriptine for Post-Partum Lactation\",\"dossier_amendment\":\"The safety information for bromocriptine has been updated to include the recommendation for blood pressure monitoring in the context of post-partum lactation prevention or inhibition.\",\"existing_page_updates\":[{\"content_key\":\"bromocriptine_post_partum_lactation\",\"change\":\"Add information on the MHRA's updated guidance regarding blood pressure monitoring.\"}],\"seo\":{\"title\":\"Bromocriptine and Post-Partum Lactation: MHRA Guidance Update\",\"description\":\"The MHRA has updated its guidance on bromocriptine for preventing or inhibiting post-partum physiological lactation, emphasizing blood pressure monitoring.\",\"slug\":\"bromocriptine-post-partum-lactation-mhra-guidance\",\"keywords\":[\"Bromocriptine\",\"Post-Partum Lactation\",\"MHRA Guidance\",\"Drug Safety Update\"]},\"shift_brain\":{\"summary\":\"The MHRA has updated its guidance on the use of bromocriptine for post-partum lactation, advising healthcare professionals to monitor blood pressure.\",\"facts\":[{\"fact\":\"Bromocriptine is used for the prevention or inhibition of post-partum physiological lactation.\",\"source_url\":\"https://www.gov.uk/drug-safety-update/bromocriptine-monitor-blood-pressure-when-prescribing-bromocriptine-for-prevention-or-inhibition-of-post-partum-physiological-lactation\"}]},\"review_flags\":[],\"editorial_cadence\":true,\"editorial_candidate_at\":\"2026-09-15T22:31:16.848Z\"}",
          "review_note": null,
          "reviewed_by": null,
          "reviewed_at": null,
          "created_at": "2026-09-13T06:54:53.190Z",
          "updated_at": "2026-09-15T22:31:16.848Z"
        }
      },
      "source_observation_review": {
        "event_id": 294,
        "kind": "ai",
        "reviewer": "/root/medicine_baselines",
        "decision": "PASS",
        "sha256": "26609db40206be009d8fe922dc5ca6ddff9b289b4c52e508c01c4b47bc50ac12",
        "notes": "Observation 4806 matches the 24 October 2024 bromocriptine monitoring reminder. The article is explicitly historical and contains no individual dose or monitoring schedule. Earlier source-identical event 35 is already reject in the actual snapshot."
      },
      "first_publication_at": null
    }
  ],
  "release_sha256": "29c996920c301feea97738e2bf5ff9f140278e042b8750b8938475e9266ffd5e"
};
