export const release='selected-pages-20261031-v1';
export const pages=[
 {key:'about',selected:'MS1',path:'/about',aliases:['/about','/about/','/about.html']},
 {key:'contact',selected:'CO1',path:'/contact',aliases:['/contact','/contact/','/contact.html']},
 {key:'newsroom',selected:'NR3',path:'/shift-newsroom',aliases:['/newsroom','/newsroom/','/newsroom.html','/shift-newsroom','/shift-newsroom/','/shift-newsroom.html']},
 {key:'continuity',selected:'CY3',path:'/clinic-gone-quiet',aliases:['/clinic-gone-quiet','/clinic-gone-quiet/','/clinic-gone-quiet.html']},
 {key:'life-back',selected:'LB2',path:'/life-back',aliases:['/life-back','/life-back/','/life-back.html']}
];
export const paths=pages.flatMap(p=>p.aliases.flatMap(a=>[a,a+'?presentation=1']));
export const assets=['/assets/approved-pages-20261031/life-back-mosaic.webp','/assets/approved-pages-20261031/continuity-notebook.webp'];
export const identify=pathname=>pages.find(p=>p.aliases.includes(pathname));
