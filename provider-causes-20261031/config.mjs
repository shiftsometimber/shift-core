export const release='provider-causes-20261031-v1';
export const mainPages=[
 {key:'provider',selected:'PS2',path:'/provider-switch',aliases:['/provider-switch','/provider-switch/','/provider-switch.html']},
 {key:'causes',selected:'Mobile repair',path:'/our-causes-partners',aliases:['/our-causes-partners','/our-causes-partners/','/our-causes-partners.html']}
];
export const repairPages=[
 {key:'query-corporate-wellbeing',id:'corporate-wellbeing',path:'/corporate-wellbeing'},
 {key:'query-retatrutide',id:'retatrutide',path:'/guides/retatrutide-uk-guide'},
 {key:'query-partner-support',id:'partner-support',path:'/husband-help'},
 {key:'query-provider-pilot',id:'provider-pilot',path:'/my-timber-for-providers'},
 {key:'query-nhs-private',id:'nhs-private',path:'/nhs-vs-private'},
 {key:'query-surgery-options',id:'surgery-options',path:'/surgery-comparison-centre'}
].map(p=>({...p,selected:'Restore existing approved hero on tracking URLs',queryOnly:true,aliases:[p.path,p.path+'/',p.path+'.html']}));
export const pages=[...mainPages,...repairPages];
export const paths=pages.flatMap(p=>p.aliases.flatMap(a=>p.queryOnly?[a+'?presentation=1']:[a,a+'?presentation=1']));
export const assets=['/assets/provider-causes-20261031/provider-library.webp'];
export const identify=pathname=>pages.find(p=>p.aliases.includes(pathname));
