-- Newfoundland testing catalogue. Drafts only; no payment or order dispatch.
CREATE TABLE IF NOT EXISTS testing_products (
 id TEXT PRIMARY KEY,
 sku TEXT NOT NULL UNIQUE,
 name TEXT NOT NULL,
 partner TEXT NOT NULL DEFAULT 'Newfoundland',
 test_type TEXT NOT NULL CHECK(test_type IN ('home','lab')),
 supplier_state TEXT NOT NULL CHECK(supplier_state IN ('available','coming_soon')),
 markers_json TEXT NOT NULL,
 description TEXT NOT NULL,
 sample TEXT NOT NULL,
 result_time TEXT NOT NULL,
 results_access TEXT NOT NULL,
 limitations TEXT NOT NULL,
 source_url TEXT NOT NULL,
 source_checked TEXT NOT NULL,
 supplier_retail_reference_pence INTEGER,
 supplier_sku TEXT,
 trade_price_pence INTEGER,
 retail_price_pence INTEGER,
 delivery_cost_pence INTEGER,
 vat_rate REAL,
 internal_notes TEXT,
 status TEXT NOT NULL DEFAULT 'draft' CHECK(status='draft'),
 sale_enabled INTEGER NOT NULL DEFAULT 0 CHECK(sale_enabled=0),
 revision INTEGER NOT NULL DEFAULT 1,
 sort_order INTEGER NOT NULL DEFAULT 0,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_by TEXT
);
CREATE TABLE IF NOT EXISTS testing_product_history (
 product_id TEXT NOT NULL REFERENCES testing_products(id),
 revision INTEGER NOT NULL,
 changed_by TEXT NOT NULL,
 record_json TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY(product_id,revision)
);

INSERT INTO testing_products (id,sku,name,partner,test_type,supplier_state,markers_json,description,sample,result_time,results_access,limitations,source_url,source_checked,supplier_retail_reference_pence,sort_order) VALUES ('diabetes','SST-NF-DIABETES','Diabetes','Newfoundland','lab','available','["HbA1c"]','A laboratory test of HbA1c, which reflects average blood glucose over the previous two to three months.','Finger-prick blood sample collected at home','Newfoundland quotes 2–5 working days for laboratory results. Follow the timing supplied with your kit.','Newfoundland Health Hub','HbA1c is a longer-term measure. It does not show your blood glucose at this moment or explain every symptom.','https://www.newfoundland.io/products/diabetes','2026-10-28',3999,0) ON CONFLICT(id) DO NOTHING;
INSERT INTO testing_products (id,sku,name,partner,test_type,supplier_state,markers_json,description,sample,result_time,results_access,limitations,source_url,source_checked,supplier_retail_reference_pence,sort_order) VALUES ('heart-health','SST-NF-HEART-HEALTH','Heart Health','Newfoundland','lab','coming_soon','["Total cholesterol","HDL cholesterol","LDL cholesterol","Triglycerides","Non-HDL cholesterol"]','A laboratory lipid panel covering several cholesterol measures and triglycerides, giving more detail than the total-cholesterol self-test.','Finger-prick blood sample collected at home','Result timing will be confirmed when this test launches.','Newfoundland Health Hub','These blood markers are one part of the picture. This is not a complete assessment of your heart or a test for acute chest symptoms.','https://www.newfoundland.io/products/heart-health','2026-10-28',NULL,1) ON CONFLICT(id) DO NOTHING;
INSERT INTO testing_products (id,sku,name,partner,test_type,supplier_state,markers_json,description,sample,result_time,results_access,limitations,source_url,source_checked,supplier_retail_reference_pence,sort_order) VALUES ('male-hormone','SST-NF-MALE-HORMONE','Male Hormone','Newfoundland','lab','coming_soon','["Testosterone","Free testosterone","Luteinising hormone (LH)","Follicle stimulating hormone (FSH)","Oestradiol","Prolactin","Sex hormone binding globulin (SHBG)","Albumin"]','A laboratory panel of hormones and related markers, including total and free testosterone, LH, FSH, oestradiol, prolactin, SHBG and albumin.','Finger-prick blood sample collected at home','Result timing will be confirmed when this test launches.','Newfoundland Health Hub','A hormone panel needs the right sampling and clinical context. One result does not establish a diagnosis or mean you need testosterone treatment.','https://www.newfoundland.io/products/male-hormone','2026-10-28',NULL,2) ON CONFLICT(id) DO NOTHING;
INSERT INTO testing_products (id,sku,name,partner,test_type,supplier_state,markers_json,description,sample,result_time,results_access,limitations,source_url,source_checked,supplier_retail_reference_pence,sort_order) VALUES ('cholesterol','SST-NF-CHOLESTEROL','Cholesterol','Newfoundland','home','available','["Total cholesterol"]','A finger-prick self-test that uses a colour chart to show the band your total cholesterol falls into. Read the result at home.','Finger-prick blood sample collected at home','Around 2 minutes; read the colour chart within the window in the kit instructions.','Read at home using the kit instructions','This self-test checks total cholesterol. It does not provide the separate HDL, LDL and triglyceride results of the Heart Health lab panel.','https://www.newfoundland.io/products/cholesterol','2026-10-28',1299,3) ON CONFLICT(id) DO NOTHING;
INSERT INTO testing_products (id,sku,name,partner,test_type,supplier_state,markers_json,description,sample,result_time,results_access,limitations,source_url,source_checked,supplier_retail_reference_pence,sort_order) VALUES ('thyroid','SST-NF-THYROID','Thyroid','Newfoundland','home','available','["Thyroid stimulating hormone (TSH)"]','A finger-prick self-test for TSH, used as an indicator of a possible underactive thyroid.','Finger-prick blood sample collected at home','Around 10 minutes. Follow the reading window in the kit instructions.','Read at home using the kit instructions','This is not a full thyroid panel. A self-test result needs appropriate medical follow-up and does not explain every cause of tiredness or weight change.','https://www.newfoundland.io/products/thyroid','2026-10-28',999,4) ON CONFLICT(id) DO NOTHING;
INSERT INTO testing_products (id,sku,name,partner,test_type,supplier_state,markers_json,description,sample,result_time,results_access,limitations,source_url,source_checked,supplier_retail_reference_pence,sort_order) VALUES ('iron','SST-NF-IRON','Iron','Newfoundland','home','available','["Ferritin"]','A finger-prick self-test for ferritin, a protein associated with stored iron. The result is read at home.','Finger-prick blood sample collected at home','Around 5 minutes. Follow the reading window in the kit instructions.','Read at home using the kit instructions','A ferritin self-test is not a full blood count and cannot investigate every cause of anaemia or tiredness.','https://www.newfoundland.io/products/iron-deficiency','2026-10-28',799,5) ON CONFLICT(id) DO NOTHING;
INSERT INTO testing_products (id,sku,name,partner,test_type,supplier_state,markers_json,description,sample,result_time,results_access,limitations,source_url,source_checked,supplier_retail_reference_pence,sort_order) VALUES ('vitamin-d','SST-NF-VITAMIN-D','Vitamin D','Newfoundland','home','available','["Vitamin D"]','A finger-prick self-test that checks vitamin D and lets you read your result at home using the supplied guide.','Finger-prick blood sample collected at home','Around 10 minutes. Follow the reading window in the kit instructions.','Read at home using the kit instructions','Follow the supplied result guide. A self-test alone does not determine which supplements or doses are suitable for you.','https://www.newfoundland.io/products/vitamin-d','2026-10-28',799,6) ON CONFLICT(id) DO NOTHING;
