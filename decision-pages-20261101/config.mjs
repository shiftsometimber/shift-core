export const release='decision-pages-20261101-v1';
export const mainPages=[
{key:'prepare',path:'/before-you-decide',graphic:'prepare'},
{key:'decision',path:'/decision-centre',graphic:'decision'},
{key:'readiness',path:'/decision-readiness',graphic:'readiness'},
{key:'lifestyle',path:'/lifestyle-vs-treatment',graphic:'lifestyle'},
{key:'universal',path:'/comparison-centre',graphic:'universal'},
{key:'future',path:'/future-medicines-comparison',graphic:'future'},
{key:'overseas',path:'/uk-vs-europe-treatment',graphic:'overseas'}
].map(p=>({...p,selected:'Delegated unfinished decision-page visual upgrade',aliases:[p.path,p.path+'/',p.path+'.html']}));
export const pages=mainPages;
export const paths=pages.flatMap(p=>p.aliases.flatMap(a=>[a,a+'?presentation=1']));
export const assets=[],assetModules=[];
export const identify=pathname=>pages.find(p=>p.aliases.includes(pathname));
export const protectedImages=['/assets/remaining-pages-20261101/editorial.webp','/assets/remaining-pages-20261101/reviews.webp','/assets/remaining-pages-20261101/lifestyle.webp',
 '/assets/quality-repair-20261101/mot.webp','/assets/quality-repair-20261101/roadmap.webp','/assets/quality-repair-20261101/research.webp','/assets/quality-repair-20261101/contributors.webp','/assets/quality-repair-20261101/media.webp','/assets/quality-repair-20261101/partners.webp','/assets/quality-repair-20261101/promise.webp',
 '/assets/downloads-dr3-20261031/preparing-notes.webp','/assets/family-fd3-20261031/family-walk.webp','/assets/community-cm3-20261031/workshop.webp','/assets/provider-causes-20261031/provider-library.webp','/assets/pending-pages-20261031/partner-community.webp','/assets/pending-pages-20261031/everyday-tea.webp','/assets/approved-pages-20261031/life-back-mosaic.webp','/assets/approved-pages-20261031/continuity-notebook.webp'
];
