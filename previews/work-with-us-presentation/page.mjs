// Read the existing published page's literal HTML; never execute its script.
export function mainFor(source){
 const match=source.match(/main\.innerHTML='([\s\S]*?)';\}\(\)\);\s*$/);
 if(!match||match[1].includes('\\')||match[1].includes("'"))throw Error('Published partnership source needs fresh review');
 const html=match[1];
 if(!html.startsWith('<section class="ww-hero">')||(html.match(/class="ww-route"/g)||[]).length!==6||(html.match(/class="ww-stat"/g)||[]).length!==4)throw Error('Unexpected partnership page');
 return html;
}
