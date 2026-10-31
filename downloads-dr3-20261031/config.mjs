export const release='downloads-dr3-20261031-v2';
export const mainPages=[{key:'downloads',selected:'DR3',path:'/downloads-resources',aliases:['/downloads-resources','/downloads-resources/','/downloads-resources.html']}];
export const pages=mainPages;
export const paths=pages.flatMap(p=>p.aliases.flatMap(a=>[a,a+'?presentation=1']));
export const assets=['/assets/downloads-dr3-20261031/preparing-notes.webp'];
export const identify=pathname=>pages.find(p=>p.aliases.includes(pathname));
