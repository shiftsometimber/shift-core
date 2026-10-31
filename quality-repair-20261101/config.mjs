export const release='quality-repair-20261101-v1';
export const mainPages=[
 {key:'mot',path:'/health-mot-methodology',photo:'mot',layout:'method'},
 {key:'finder',path:'/treatment-finder-methodology',graphic:'routes',layout:'method'},
 {key:'roadmap',path:'/roadmap-methodology',photo:'roadmap',graphic:'timeline',layout:'method'},
 {key:'medication',path:'/medication-comparison-methodology',graphic:'evidence',layout:'method'},
 {key:'trees',path:'/decision-trees-explained',graphic:'tree',layout:'explain'},
 {key:'commercial',path:'/commercial-principles',graphic:'principles',layout:'policy'},
 {key:'reviews',path:'/how-we-review-products',photo:'research',layout:'policy'},
 {key:'disclosure',path:'/affiliate-disclosure',graphic:'disclosure',layout:'policy'},
 {key:'advertising',path:'/advertise-with-us',graphic:'independence',layout:'statement'},
 {key:'contributors',path:'/expert-contributors',photo:'contributors',layout:'people'},
 {key:'media',path:'/media-centre',photo:'media',layout:'media'},
 {key:'press',path:'/press-centre',graphic:'press',layout:'media'},
 {key:'partners',path:'/trusted-partners',photo:'partners',layout:'people'},
 {key:'promise',path:'/shift-promise',photo:'promise',layout:'promise'}
].map(p=>({...p,selected:'Quality correction under delegated design and deployment authority',aliases:[p.path,p.path+'/',p.path+'.html']}));
export const pages=mainPages;
export const paths=pages.flatMap(p=>p.aliases.flatMap(a=>[a,a+'?presentation=1']));
export const assets=['mot','roadmap','research','contributors','media','partners','promise'].map(k=>'/assets/quality-repair-20261101/'+k+'.webp');
export const identify=pathname=>pages.find(p=>p.aliases.includes(pathname));
