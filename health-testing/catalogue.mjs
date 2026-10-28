// Newfoundland's seven recommendations from the 28 October 2026 call.
// Supplier retail references are evidence, never SHIFT selling or trade prices.
export const checkedOn = '2026-10-28';
export const partner = 'Newfoundland';
const rows = [
  {id:'diabetes',name:'Diabetes',type:'lab',state:'available',markers:['HbA1c'],reference:3999,
    description:'A laboratory test of HbA1c, which reflects average blood glucose over the previous two to three months.',
    resultTime:'Newfoundland quotes 2–5 working days for laboratory results. Follow the timing supplied with your kit.',
    limit:'HbA1c is a longer-term measure. It does not show your blood glucose at this moment or explain every symptom.',source:'diabetes'},
  {id:'heart-health',name:'Heart Health',type:'lab',state:'coming_soon',markers:['Total cholesterol','HDL cholesterol','LDL cholesterol','Triglycerides','Non-HDL cholesterol'],reference:null,
    description:'A laboratory lipid panel covering several cholesterol measures and triglycerides, giving more detail than the total-cholesterol self-test.',
    resultTime:'Result timing will be confirmed when this test launches.',
    limit:'These blood markers are one part of the picture. This is not a complete assessment of your heart or a test for acute chest symptoms.',source:'heart-health'},
  {id:'male-hormone',name:'Male Hormone',type:'lab',state:'coming_soon',markers:['Testosterone','Free testosterone','Luteinising hormone (LH)','Follicle stimulating hormone (FSH)','Oestradiol','Prolactin','Sex hormone binding globulin (SHBG)','Albumin'],reference:null,
    description:'A laboratory panel of hormones and related markers, including total and free testosterone, LH, FSH, oestradiol, prolactin, SHBG and albumin.',
    resultTime:'Result timing will be confirmed when this test launches.',
    limit:'A hormone panel needs the right sampling and clinical context. One result does not establish a diagnosis or mean you need testosterone treatment.',source:'male-hormone'},
  {id:'cholesterol',name:'Cholesterol',type:'home',state:'available',markers:['Total cholesterol'],reference:1299,
    description:'A finger-prick self-test that uses a colour chart to show the band your total cholesterol falls into. Read the result at home.',
    resultTime:'Around 2 minutes; read the colour chart within the window in the kit instructions.',
    limit:'This self-test checks total cholesterol. It does not provide the separate HDL, LDL and triglyceride results of the Heart Health lab panel.',source:'cholesterol'},
  {id:'thyroid',name:'Thyroid',type:'home',state:'available',markers:['Thyroid stimulating hormone (TSH)'],reference:999,
    description:'A finger-prick self-test for TSH, used as an indicator of a possible underactive thyroid.',
    resultTime:'Around 10 minutes. Follow the reading window in the kit instructions.',
    limit:'This is not a full thyroid panel. A self-test result needs appropriate medical follow-up and does not explain every cause of tiredness or weight change.',source:'thyroid'},
  {id:'iron',name:'Iron',type:'home',state:'available',markers:['Ferritin'],reference:799,
    description:'A finger-prick self-test for ferritin, a protein associated with stored iron. The result is read at home.',
    resultTime:'Around 5 minutes. Follow the reading window in the kit instructions.',
    limit:'A ferritin self-test is not a full blood count and cannot investigate every cause of anaemia or tiredness.',source:'iron-deficiency'},
  {id:'vitamin-d',name:'Vitamin D',type:'home',state:'available',markers:['Vitamin D'],reference:799,
    description:'A finger-prick self-test that checks vitamin D and lets you read your result at home using the supplied guide.',
    resultTime:'Around 10 minutes. Follow the reading window in the kit instructions.',
    limit:'Follow the supplied result guide. A self-test alone does not determine which supplements or doses are suitable for you.',source:'vitamin-d'}
];
export const tests = Object.freeze(rows.map(p=>Object.freeze({...p,sku:'SST-NF-'+p.id.toUpperCase(),
  sourceUrl:'https://www.newfoundland.io/products/'+p.source,sample:'Finger-prick blood sample collected at home',
  resultsAccess:p.type==='lab'?'Newfoundland Health Hub':'Read at home using the kit instructions',
  supplierSku:null,tradePricePence:null,retailPricePence:null,saleEnabled:false})));
export const byId = Object.fromEntries(tests.map(p=>[p.id,p]));
export const esc = v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const testPath = id=>'/shift-health/testing'+(id?'/'+encodeURIComponent(id):'');
export const methodLabel = p=>p.type==='lab'?'Lab test':'Home self-test';
