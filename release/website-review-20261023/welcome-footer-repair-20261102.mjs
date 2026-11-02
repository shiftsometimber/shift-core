import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

export const assetPath='/assets/my-timber-welcome-20261021.css';
export const beforeSha256='fbe31e415489de92d43f46aa7883bd0e7e0f5bb7f75c54442acd7c1651b2aeec';
export const repairCss=readFileSync(new URL('./welcome-footer-repair-20261102.css',import.meta.url),'utf8');
export const digest=text=>createHash('sha256').update(text).digest('hex');
export function repairWelcomeFooter(css){
 if(typeof css!=='string')throw new TypeError('Supply the exact decoded CSS text');
 const suffix='\n'+repairCss;
 if(css.endsWith(suffix)&&digest(css.slice(0,-suffix.length))===beforeSha256)return css;
 if(digest(css)!==beforeSha256)throw new Error('Serving welcome CSS changed; capture and review its current source before release');
 return css+suffix;
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 const [input,output]=process.argv.slice(2);
 if(!input||!output||input===output)throw new Error('Supply distinct reviewed input and candidate output paths');
 const before=readFileSync(input,'utf8'),after=repairWelcomeFooter(before);
 writeFileSync(output,after,{flag:'wx'});
 console.log(JSON.stringify({assetPath,beforeSha256:digest(before),afterSha256:digest(after),beforeBytes:Buffer.byteLength(before),afterBytes:Buffer.byteLength(after),deployed:false}));
}

