export const release='pending-pages-20261031-v1';
export const pages=[
 {key:'support',selected:'FS1',path:'/weight-loss-support-for-men',aliases:['/weight-loss-support-for-men','/weight-loss-support-for-men/','/weight-loss-support-for-men.html']},
 {key:'partner',selected:'PW2',path:'/partner-with-us',aliases:['/partner-with-us','/partner-with-us/','/partner-with-us.html']},
 {key:'obesity',selected:'MO3',path:'/male-obesity',aliases:['/male-obesity','/male-obesity/','/male-obesity.html']},
 {key:'comparison',selected:'TC2',path:'/compare-weight-loss-treatments',aliases:['/compare-weight-loss-treatments','/compare-weight-loss-treatments/','/compare-weight-loss-treatments.html']}
];
export const paths=pages.flatMap(p=>p.aliases.flatMap(a=>[a,a+'?presentation=1']));
export const assets=['/assets/pending-pages-20261031/partner-community.webp','/assets/pending-pages-20261031/everyday-tea.webp'];
export const identify=pathname=>pages.find(p=>p.aliases.includes(pathname));
