export const release='family-fd3-20261031-v1';
export const mainPages=[{key:'family',selected:'FD3',path:'/family-discussion-guide',aliases:['/family-discussion-guide','/family-discussion-guide/','/family-discussion-guide.html']}];
export const pages=mainPages;
export const paths=pages.flatMap(p=>p.aliases.flatMap(a=>[a,a+'?presentation=1']));
export const assets=['/assets/family-fd3-20261031/family-walk.webp'];
export const identify=pathname=>pages.find(p=>p.aliases.includes(pathname));
