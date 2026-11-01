export const release='remaining-pages-20261101-v1';
export const mainPages=[
 {key:'decision',path:'/decision-centre-methodology',graphic:'decision',kind:'method'},
 {key:'readiness',path:'/decision-readiness-methodology',graphic:'readiness',kind:'method'},
 {key:'lifestyle',path:'/lifestyle-treatment-methodology',photo:'lifestyle',kind:'method'},
 {key:'nhs',path:'/nhs-private-methodology',graphic:'nhs',kind:'method'},
 {key:'progress',path:'/progress-centre-methodology',graphic:'progress',kind:'method'},
 {key:'surgery',path:'/surgery-comparison-methodology',graphic:'surgery',kind:'method'},
 {key:'overseas',path:'/uk-europe-methodology',graphic:'overseas',kind:'method'},
 {key:'universal',path:'/universal-comparison-methodology',graphic:'universal',kind:'method'},
 {key:'governance',path:'/clinical-governance',graphic:'governance',kind:'trust'},
 {key:'editorial',path:'/editorial-standards',photo:'editorial',kind:'trust'},
 {key:'disclaimer',path:'/medical-disclaimer',graphic:'disclaimer',kind:'trust'},
 {key:'privacy',path:'/privacy-centre',graphic:'privacy',kind:'trust'},
 {key:'data',path:'/data-governance',graphic:'data',kind:'trust'},
 {key:'dpia',path:'/dpia-summary',graphic:'dpia',kind:'trust'},
 {key:'reviews',path:'/product-reviews',photo:'reviews',kind:'editorial'},
 {key:'author',path:'/authors/matt-obrien',graphic:'author',kind:'editorial'},
 {key:'accessibility',path:'/accessibility',graphic:'accessibility',kind:'trust'},
 {key:'complaints',path:'/complaints',graphic:'complaints',kind:'trust'},
 {key:'gp',path:'/downloads/gp-appointment-checklist',graphic:'paper',kind:'printable'},
 {key:'medication',path:'/downloads/weight-loss-medication-questions',graphic:'paper',kind:'printable'},
 {key:'operation',path:'/downloads/bariatric-surgery-checklist',graphic:'paper',kind:'printable'},
 {key:'provider',path:'/downloads/private-provider-checklist',graphic:'paper',kind:'printable'},
 {key:'travel',path:'/downloads/overseas-surgery-checklist',graphic:'paper',kind:'printable'},
 {key:'maintenance',path:'/downloads/maintenance-plan-template',graphic:'paper',kind:'printable'}
].map(p=>({...p,selected:'Delegated remaining-page visual upgrade',aliases:[p.path,p.path+'/',p.path+'.html']}));
export const pages=mainPages;
export const paths=pages.flatMap(p=>p.aliases.flatMap(a=>[a,a+'?presentation=1']));
export const assets=['editorial','lifestyle','reviews'].map(k=>'/assets/remaining-pages-20261101/'+k+'.webp');
export const assetModules=['photo-editorial.mjs','photo-lifestyle.mjs','photo-reviews.mjs'];
export const identify=pathname=>pages.find(p=>p.aliases.includes(pathname));
export const protectedImages=[
 '/assets/quality-repair-20261101/mot.webp','/assets/quality-repair-20261101/roadmap.webp','/assets/quality-repair-20261101/research.webp','/assets/quality-repair-20261101/contributors.webp','/assets/quality-repair-20261101/media.webp','/assets/quality-repair-20261101/partners.webp','/assets/quality-repair-20261101/promise.webp',
 '/assets/downloads-dr3-20261031/preparing-notes.webp','/assets/family-fd3-20261031/family-walk.webp','/assets/community-cm3-20261031/workshop.webp','/assets/provider-causes-20261031/provider-library.webp','/assets/pending-pages-20261031/partner-community.webp','/assets/pending-pages-20261031/everyday-tea.webp','/assets/approved-pages-20261031/life-back-mosaic.webp','/assets/approved-pages-20261031/continuity-notebook.webp'
];
