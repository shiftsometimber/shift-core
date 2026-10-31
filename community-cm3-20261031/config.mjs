export const release='community-cm3-20261031-v1';
export const mainPages=[{key:'community',selected:'CM3',path:'/community',aliases:['/community','/community/','/community.html']}];
export const pages=mainPages;
export const paths=pages.flatMap(p=>p.aliases.flatMap(a=>[a,a+'?presentation=1']));
export const assets=['/assets/community-cm3-20261031/workshop.webp'];
export const identify=pathname=>pages.find(p=>p.aliases.includes(pathname));
