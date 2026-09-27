import assert from 'node:assert/strict';
import {card,footerLink} from './presentation.mjs';
// Remove only the reviewed additions before the existing full-page comparison.
// Normalise the replaced member install metadata on both before/after snapshots.
export function preservePwaPresentation(path,body,{required=false}={}){
 let html=body.toString();if(!html.includes('</head>')||!html.includes('</body>'))return body;
 const member=/^\/(?:my-timber|member-login|member-register|member\/[^/]+)(?:\.html)?\/?$/.test(path);
 function removeExact(value,needed){const n=html.split(value).length-1;if(needed)assert.equal(n,1,'Expected exact approved PWA addition');else assert(n<=1);html=html.replace(value,'');}
 removeExact(footerLink,required&&html.includes('</footer>'));
 removeExact(card,required&&member);
 removeExact('<link rel="stylesheet" href="/assets/my-timber-pwa.css">',required);
 removeExact('<script defer src="/assets/my-timber-pwa.js"></script>',required&&member);
 if(member)html=html.replace(/<link\b(?=[^>]*\brel=["'](?:manifest|apple-touch-icon)["'])[^>]*>/gi,'').replace(/<meta\b(?=[^>]*\bname=["'](?:theme-color|apple-mobile-web-app-title)["'])[^>]*>/gi,'');
 return Buffer.from(html);
}
