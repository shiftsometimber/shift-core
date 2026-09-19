// Editorial evidence snapshot, not a clinical recommendation or a stock feed.
// A source check never advances this date or approves changed medical wording.
export const REVIEWED_AT = '2026-09-15T21:28:30Z';

// Exact bodies fetched after editorial verification, using fingerprintSource.
// Blocked, empty or timed-out responses deliberately have no approved baseline.
const reviewedFingerprints = {
  'mounjaro-nhs': '0bf989841235e78419af0a47946bdff342f08d9d8f52068a17ae8c8accab29ff',
  'wegovy-tablet-private': '592a1cba16592bd8b948f173ecc7d7dea28bbf0fe6a00ea11ccc97a8eac225e6',
  'mounjaro-smpc': 'c90e97fb8006378a825eacbd4c2667245b406609426500cc782459e6a8979e55',
  'wegovy-injection-smpc': '21124f70931fd9c9d69938b8a1a9c0e94b6680a6cb42e4dc49ba218224da7855',
  'wegovy-tablet-smpc': '142cfab62735e887697d6ec81e3ca3a4b35323c69d7b170387ba48ef23c6ff9e',
  'orlistat-120-smpc': '029e3b4179df1b22b4b3594bd54b5be4ca95c43983411a18433c97d2cf77e114',
  'orlistat-60-smpc': '423e9d82afdb18cda4f8bc7b727df90424606f2c648c465098586283779abddd',
  'foundayo-smpc': 'e528bfc81887cc52f40a8086cc26488db67e72e349bd63eebc3d24ff27249101',
  'mounjaro-mhra': 'a12f34e632571947426d59bf458053d8b59c6dc93507ca644529ecbb600ca3bb',
  'wegovy-injection-access': '8eb2cb71a8b584a471647a770f6c37cea413bf80fb4dce760ca1064f53d677ca',
  'orlistat-nhs': 'a005b76ef816a6b6d4505122c902445d5396d1e74dc6f2b4c58c51f057ce9f37',
  'foundayo-mhra': '9b6fbf229dd96da3d00e041465d868ede55d0acc9b5ddeb7783ff3b5bb3bd3c2',
  'retatrutide-lilly': '3299261d5adcc54a277026fe7ba6030b303fd979998fcd1ae1f418b9e7ac8690',
  'wegovy-tablet-mhra': '6499382984b746412447de56ccaf04852a6d304cfa68fb7ea89195b562fc9c99',
  'mounjaro-nice': 'c98a760dfef35423c18cbc30873f721acd1327e32ede791bdffaf6af25a5b3d8',
  'wegovy-weight-nice': '4bbb19ea7e2989ef413d4370875c97102c3160bd1a5d73eb5e4aa19e21f2bbe5',
  'wegovy-cardiovascular-nice': 'c163aec659c98fc11c0d0ee6f8b9285426a0f2b8b34d9fb3b6f48744223f8ce3',
  'foundayo-nice': '6af1de6b84818aedefe20ac8a7c567045735f592a9e89d3893c00e50c566144c',
  'retatrutide-mhra': '34258dd5def20deb8e4e24894d51d5407bc2dd2073e0911d43f0839c4017d40e',
};

// Source-specific factual review; the rest of the catalogue keeps its prior date.
// Claim mapping and response hashes: reviews/2026-09-16-product-information.json.
const sourceReviewedDates = {
  'mounjaro-nhs': '2026-09-17T05:45:00Z',
  'wegovy-tablet-private': '2026-09-18T16:36:50Z',
  'mounjaro-smpc': '2026-09-16T17:44:34Z',
  'wegovy-injection-smpc': '2026-09-16T17:44:34Z',
  'wegovy-tablet-smpc': '2026-09-16T17:44:34Z',
  'orlistat-120-smpc': '2026-09-16T17:44:34Z',
  'orlistat-60-smpc': '2026-09-16T17:44:34Z',
  'foundayo-smpc': '2026-09-16T17:44:34Z',
};

const source = (id, title, url, sourcePublishedAt, requiredTerms, extra = {}) => ({
  id, title, url, checkUrl: url, format: 'html', sourcePublishedAt,
  reviewedAt: sourceReviewedDates[id] || REVIEWED_AT, requiredTerms,
  ...(reviewedFingerprints[id] ? { reviewedFingerprint: reviewedFingerprints[id] } : {}), ...extra,
});
const govuk = (id, title, path, publishedAt, requiredTerms) => source(
  id, title, `https://www.gov.uk${path}`, publishedAt, requiredTerms,
  { checkUrl: `https://www.gov.uk/api/content${path}`, format: 'govuk-json' },
);
const smpc = (id, title, product, updatedAt, requiredTerms) => source(
  id, title, `https://www.medicines.org.uk/emc/product/${product}/smpc`,
  updatedAt, requiredTerms,
  { sourceDateLabel: 'Product information updated' },
);

// reviewedFingerprint is intentionally absent until the exact source body has
// been retrieved and fingerprinted using monitor.mjs. A 403/empty response is
// not evidence of unchanged content, even if a researcher could read the page.
export const sources = [
  govuk('mounjaro-mhra', 'MHRA: tirzepatide weight-management authorisation',
    '/government/news/mhra-authorises-diabetes-drug-mounjaro-tirzepatide-for-weight-management-and-weight-loss',
    '2023-11-08', ['Mounjaro', 'tirzepatide', 'weight management']),
  smpc('mounjaro-smpc', 'Mounjaro: UK product information', '15481', '2026-09-08',
    ['Mounjaro', 'tirzepatide', 'weight management']),
  source('mounjaro-nhs', 'NHS: tirzepatide prescription access and eligibility',
    'https://www.nhs.uk/medicines/tirzepatide/',
    '2026-05-15', ['tirzepatide', 'prescription', 'specialist weight management'], { sourceDateLabel: 'NHS information reviewed' }),
  source('mounjaro-nice', 'NICE TA1026: tirzepatide for weight management',
    'https://www.nice.org.uk/guidance/ta1026', '2025-09-01', ['tirzepatide', 'TA1026'],
    { sourceDateLabel: 'Guidance updated' }),
  smpc('wegovy-injection-smpc', 'Wegovy injection: UK product information', '13803', '2026-09-01',
    ['Wegovy', 'semaglutide', 'weight management']),
  source('wegovy-injection-access', 'DHSC: NHS and private Wegovy access',
    'https://healthmedia.blog.gov.uk/2023/09/04/accessing-wegovy-for-weight-loss-everything-you-need-to-know/',
    '2023-09-04', ['Wegovy', 'NHS', 'private']),
  source('wegovy-weight-nice', 'NICE TA875: semaglutide for weight management',
    'https://www.nice.org.uk/guidance/ta875', '2023-09-04', ['semaglutide', 'TA875'],
    { sourceDateLabel: 'Guidance updated' }),
  source('wegovy-cardiovascular-nice', 'NICE TA1152: separate cardiovascular prevention indication',
    'https://www.nice.org.uk/guidance/ta1152', '2026-05-07', ['semaglutide', 'cardiovascular', 'TA1152']),
  govuk('wegovy-tablet-mhra', 'MHRA: oral Wegovy authorisation',
    '/government/news/first-glp-1-tablet-for-weight-loss-approved-in-the-uk',
    '2026-06-11', ['semaglutide', 'Wegovy', 'tablet', 'NHS']),
  smpc('wegovy-tablet-smpc', 'Wegovy tablets: UK product information', '102347', '2026-06-16',
    ['Wegovy', 'semaglutide', 'once-daily oral']),
  source('wegovy-tablet-private', 'UK provider: oral Wegovy private availability',
    'https://onlinedoctor.asda.com/uk/wegovy-pill.html', null,
    ['Wegovy', 'prescription', 'NHS'],
    { sourceDateLabel: 'Provider page checked', evidenceType: 'Provider statement about its own service' }),
  source('orlistat-nhs', 'NHS: orlistat uses, access and limitations',
    'https://www.nhs.uk/medicines/orlistat/', '2026-05-06',
    ['orlistat', 'prescription', 'pharmacy'], { sourceDateLabel: 'NHS information reviewed' }),
  smpc('orlistat-120-smpc', 'Xenical 120 mg: UK product information', '2592', '2023-10-24',
    ['Xenical', '120 mg', 'orlistat']),
  smpc('orlistat-60-smpc', 'alli 60 mg: UK product information', '6533', '2023-04-25',
    ['alli', '60 mg', 'orlistat']),
  govuk('foundayo-mhra', 'MHRA: orforglipron authorisation',
    '/government/news/uk-first-in-europe-to-authorise-orforglipron-for-weight-management-and-type-2-diabetes',
    '2026-08-10', ['orforglipron', 'Foundayo', 'weight management', 'NHS']),
  smpc('foundayo-smpc', 'Foundayo: UK product information', '102531', '2026-08-14',
    ['Foundayo', 'orforglipron', 'weight management']),
  source('foundayo-nice', 'NICE: orforglipron weight-management appraisal in development',
    'https://www.nice.org.uk/guidance/indevelopment/gid-ta11650', null,
    ['orforglipron', 'development'],
    { sourceDateLabel: 'Appraisal status checked' }),
  govuk('retatrutide-mhra', 'MHRA: retatrutide is not authorised in the UK',
    '/government/news/no-summer-shortcut-for-safe-weight-loss',
    '2026-07-24', ['retatrutide', 'not been authorised', 'UK']),
  source('retatrutide-lilly', 'Lilly: retatrutide Phase 3 research update',
    'https://investor.lilly.com/news-releases/news-release-details/lillys-triple-agonist-retatrutide-successful-two-additional',
    '2026-07-23', ['retatrutide', 'Phase 3', 'investigational'],
    { evidenceType: 'Trial sponsor announcement; not an authorisation' }),
];

export const medicines = [
  {
    id: 'mounjaro', name: 'Mounjaro', ingredient: 'Tirzepatide',
    route: 'Weekly injection', status: 'authorised',
    authorisation: 'UK authorised for adult weight management, alongside dietary changes and physical activity.',
    mechanism: 'Acts on GIP and GLP-1 receptors involved in appetite regulation.',
    benefit: 'Can support weight loss and weight maintenance in eligible adults.',
    tradeoffs: ['Digestive side effects are common.', 'Suitability, other medicines and treatment response need clinical review.'],
    access: {
      private: 'Private prescription route established. Individual pharmacy stock is not tracked here.',
      nhsEngland: 'Eligible patients only. Eligibility criteria differ between prescribing through a doctor and a specialist weight-management service.',
    },
    sourceIds: ['mounjaro-mhra', 'mounjaro-smpc', 'mounjaro-nhs', 'mounjaro-nice'],
    reviewedAt: '2026-09-17T05:45:00Z',
  },
  {
    id: 'wegovy-injection', name: 'Wegovy injection', ingredient: 'Semaglutide',
    route: 'Weekly injection', status: 'authorised',
    authorisation: 'UK authorised for weight management alongside dietary changes and physical activity.',
    mechanism: 'A GLP-1 receptor agonist that acts on appetite regulation.',
    benefit: 'Can support weight loss and weight maintenance in eligible patients.',
    tradeoffs: ['Digestive side effects are common.', 'Assessment and ongoing review are needed; authorised strengths do not all have identical NHS access.'],
    access: {
      private: 'Available through private prescription services following assessment. Supply varies.',
      nhsEngland: 'Available to eligible patients under indication-specific guidance. Weight-management access follows NICE TA875; cardiovascular prevention has separate guidance.',
    },
    sourceIds: ['wegovy-injection-smpc', 'wegovy-injection-access', 'wegovy-weight-nice', 'wegovy-cardiovascular-nice'],
  },
  {
    id: 'wegovy-tablet', name: 'Wegovy tablet', ingredient: 'Oral semaglutide',
    route: 'Daily tablet', status: 'authorised',
    authorisation: 'UK authorised for adult weight management on 11 June 2026.',
    mechanism: 'A GLP-1 receptor agonist that acts on appetite regulation.',
    benefit: 'An oral formulation for eligible adults, used with dietary changes and physical activity.',
    tradeoffs: ['Specific fasting and administration instructions matter.', 'Digestive side effects remain possible; tablets and injections are not automatically interchangeable.'],
    access: {
      private: 'UK private provision is listed by the linked provider. This does not guarantee individual pharmacy stock.',
      nhsEngland: 'No NHS access confirmed in the reviewed sources. MHRA stated at approval that the tablet was not available through the NHS.',
    },
    sourceIds: ['wegovy-tablet-mhra', 'wegovy-tablet-smpc', 'wegovy-tablet-private'],
  },
  {
    id: 'orlistat', name: 'Orlistat', ingredient: 'Orlistat',
    route: 'Capsules taken with meals', status: 'authorised',
    authorisation: 'UK authorised. The prescription 120 mg and pharmacy 60 mg products have different conditions of use.',
    mechanism: 'Reduces absorption of some dietary fat in the gut.',
    benefit: 'Can support weight loss alongside dietary changes and physical activity.',
    tradeoffs: ['Oily stools, urgency and other digestive effects are common.', 'Medicine interactions and reduced absorption of some vitamins need consideration.'],
    access: {
      private: '120 mg products require a prescription. Lower-dose 60 mg products can be supplied by a pharmacy when suitable.',
      nhsEngland: 'Prescription treatment is available for eligible patients following assessment.',
    },
    sourceIds: ['orlistat-nhs', 'orlistat-120-smpc', 'orlistat-60-smpc'],
  },
  {
    id: 'foundayo', name: 'Foundayo', ingredient: 'Orforglipron',
    route: 'Daily tablet', status: 'authorised',
    authorisation: 'UK authorised for adult weight management on 10 August 2026; it also has a type 2 diabetes indication.',
    mechanism: 'A non-peptide GLP-1 receptor agonist that acts on appetite regulation.',
    benefit: 'Can support weight loss and maintenance alongside dietary changes and physical activity.',
    tradeoffs: ['Nausea, constipation, diarrhoea, vomiting and abdominal symptoms can occur.', 'A prescription and individual clinical assessment are required.'],
    access: {
      private: 'Lilly confirmed UK private-prescription availability on 24 August 2026. Individual pharmacy stock is not tracked here.',
      nhsEngland: 'No NHS access confirmed. NICE has a weight-management appraisal in development; authorisation is separate from an NHS funding decision.',
    },
    sourceIds: ['foundayo-mhra', 'foundayo-smpc', 'foundayo-nice'],
    evidenceLinks: [{
      title: 'Lilly UK private-launch announcement — 24 August 2026 (PDF)',
      url: 'https://delivery-p137454-e1438138.adobeaemcloud.com/adobe/assets/urn:aaid:aem:e8f3cd70-4476-4be0-a039-9796935d5579/renditions/original/as/Foundayo_supply_press_release.pdf?assetname=Foundayo_supply_press_release.pdf',
      reviewedAt: REVIEWED_AT, sourcePublishedAt: '2026-08-24',
      checkScope: 'Document reviewed; PDF content is not covered by the automatic HTML/JSON monitor.',
    }],
  },
  {
    id: 'retatrutide', name: 'Retatrutide', ingredient: 'Retatrutide',
    route: 'Weekly injection studied in trials', status: 'investigational',
    authorisation: 'Not authorised in the UK. MHRA confirmed this on 24 July 2026; later sponsor evidence still describes it as investigational.',
    mechanism: 'Acts on GIP, GLP-1 and glucagon receptors.',
    benefit: 'Being studied for weight management. Sponsor-reported Phase 3 results do not establish an approved treatment.',
    tradeoffs: ['Digestive symptoms and treatment discontinuations were reported in trials.', 'Longer-term outcomes and regulatory assessment remain important uncertainties.'],
    access: {
      private: 'No approved UK retail treatment. Products marketed online are not equivalent to medicine supplied within a regulated trial.',
      nhsEngland: 'No routine NHS weight-management access is confirmed; this remains research-stage treatment.',
    },
    sourceIds: ['retatrutide-mhra', 'retatrutide-lilly'],
  },
];
