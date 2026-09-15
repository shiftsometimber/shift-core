import fs from 'node:fs';
import art from './aftercare/art.mjs';
export function aftercareAssets(){const root='preview/fit-grub/aftercare/';return {
 '/member/my-timber':{type:'text/html',body:fs.readFileSync(root+'index.html','utf8').replace('__ART__',art)},
 '/aftercare.css':{type:'text/css',body:fs.readFileSync(root+'style.css','utf8')},
 '/aftercare-client.mjs':{type:'text/javascript',body:fs.readFileSync(root+'client.mjs','utf8')},
 '/my-timber-phone':{type:'text/html',body:'<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>My Timber · phone preview</title><style>body{margin:0;background:#050505;color:#e7e3da;font:14px Arial}p{text-align:center}a{color:inherit}iframe{display:block;width:390px;max-width:100%;height:calc(100dvh - 50px);border:0;margin:auto}</style></head><body><p>Phone preview · <a href="/member/my-timber">Open full page ↗</a></p><iframe title="My Timber at phone width" src="/member/my-timber"></iframe></body></html>'}
};}
