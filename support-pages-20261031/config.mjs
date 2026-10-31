export const release='support-pages-20261031-v1';
export const mainPages=[
 {key:'stock',selected:'SU1',path:'/waiting-list-journey'},
 {key:'advertising',selected:'Delegated supporting-page refresh',path:'/advertise-with-us',hero:'mass-hero',symbol:'envelope'},
 {key:'contributors',selected:'Delegated supporting-page refresh',path:'/expert-contributors',hero:'pagehero',symbol:'people'},
 {key:'media',selected:'Delegated supporting-page refresh',path:'/media-centre',hero:'article-brand-hero-v5',symbol:'news'},
 {key:'press',selected:'Delegated supporting-page refresh',path:'/press-centre',hero:'contact-hero-v3b2',symbol:'pen'},
 {key:'partners',selected:'Delegated supporting-page refresh',path:'/trusted-partners',hero:'pagehero',symbol:'link'},
 {key:'promise',selected:'Delegated supporting-page refresh',path:'/shift-promise',hero:'commercial-hero-v3b1',symbol:'shield'}
].map(p=>({...p,aliases:[p.path,p.path+'/',p.path+'.html']}));
export const pages=mainPages;
export const paths=pages.flatMap(p=>p.aliases.flatMap(a=>[a,a+'?presentation=1']));
export const assets=[];
export const identify=pathname=>pages.find(p=>p.aliases.includes(pathname));
