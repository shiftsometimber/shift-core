export const release='provider-causes-20261031-v1';
export const pages=[
 {key:'provider',selected:'PS2',path:'/provider-switch',aliases:['/provider-switch','/provider-switch/','/provider-switch.html']},
 {key:'causes',selected:'Mobile repair',path:'/our-causes-partners',aliases:['/our-causes-partners','/our-causes-partners/','/our-causes-partners.html']}
];
export const paths=pages.flatMap(p=>p.aliases.flatMap(a=>[a,a+'?presentation=1']));
export const assets=['/assets/provider-causes-20261031/provider-library.webp'];
export const identify=pathname=>pages.find(p=>p.aliases.includes(pathname));
