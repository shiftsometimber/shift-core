export const release='utility-pages-20261031-v1';
export const mainPages=[
 {key:'commercial',path:'/commercial-principles',hero:'pagehero',symbol:'shield'},
 {key:'reviews',path:'/how-we-review-products',hero:'pagehero',symbol:'pen'},
 {key:'disclosure',path:'/affiliate-disclosure',hero:'pagehero',symbol:'link'},
 {key:'trees',path:'/decision-trees-explained',hero:'find-hero',symbol:'tree'},
 {key:'finder',path:'/treatment-finder-methodology',hero:'find-hero',symbol:'compass'},
 {key:'roadmap',path:'/roadmap-methodology',hero:'road-hero',symbol:'map'},
 {key:'mot',path:'/health-mot-methodology',hero:'mot-hero',symbol:'document'},
 {key:'medication',path:'/medication-comparison-methodology',hero:'med2-hero',symbol:'balance'}
].map(p=>({...p,selected:'Delegated utility-page refresh',aliases:[p.path,p.path+'/',p.path+'.html']}));
export const pages=mainPages;
export const paths=pages.flatMap(p=>p.aliases.flatMap(a=>[a,a+'?presentation=1']));
export const assets=[];
export const identify=pathname=>pages.find(p=>p.aliases.includes(pathname));
