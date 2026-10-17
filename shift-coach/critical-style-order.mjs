// Move only the complete known current style sequence. All CSS, scripts and
// cascade order remain byte-exact; unknown/ambiguous documents keep their path.
const openings=[
 '<style id="sst-drawer-mark-20261002">',
 '<style id="sst-header-mark-20261001">',
 '<style id="sst-cream-header-preview">',
 '<style data-app-preview-style>',
 '<style data-approved-member-design>',
 '<style data-shared-footer-base>',
 '<style id="sst-footer-c-style">'
];
export function earlyDashboardStyles(html){
 const head=html.indexOf('</head>'),bodyMatch=/<body\b[^>]*>/.exec(html),end=html.lastIndexOf('</body>');
 if(head<0||!bodyMatch||head>bodyMatch.index||end<bodyMatch.index)return html;
 const start=bodyMatch.index+bodyMatch[0].length,body=html.slice(start,end);
 // Script and comment lookalikes are never parsed as real style elements.
 const protectedBody=body.replace(/<!--[\s\S]*?-->|<script\b[^>]*>[\s\S]*?<\/script\s*>/gi,text=>' '.repeat(text.length));
 if(/<script\b|<!--/i.test(protectedBody))return html;
 const pattern=/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi,matches=[...protectedBody.matchAll(pattern)];
 const rest=protectedBody.replace(pattern,text=>' '.repeat(text.length));
 if(/<\/?style\b/i.test(rest)||/<link\b[^>]*\brel\s*=\s*["']?stylesheet\b/i.test(rest))return html;
 if(matches.length!==openings.length||matches.some((m,i)=>m[0].slice(0,m[0].indexOf('>')+1)!==openings[i]))return html;
 const styles=matches.map(m=>body.slice(m.index,m.index+m[0].length));
 let remaining=body;
 for(const m of [...matches].reverse())remaining=remaining.slice(0,m.index)+remaining.slice(m.index+m[0].length);
 const stripped=html.slice(0,start)+remaining+html.slice(end);
 return stripped.slice(0,head)+styles.join('')+stripped.slice(head);
}
