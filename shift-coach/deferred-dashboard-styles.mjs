// Exact current links; unknown versions or ambiguous documents keep normal blocking loads.
export const currentDashboardStylesheetTags=["<link rel=\"stylesheet\" href=\"/member-p0-v1.css?v=7\">", "<link rel=\"stylesheet\" href=\"/member-today-premium-v1.css?v=daily-shift-v2\">", "<link rel=\"stylesheet\" href=\"/my-timber-v11.css?v=1\">", "<link rel=\"stylesheet\" href=\"/member-my-journey-v1.css?v=1\">", "<link rel=\"stylesheet\" href=\"/member-my-journey-checkin-v1.css?v=1\">", "<link rel=\"stylesheet\" href=\"/assets/v137-estate-closeout.css?v=footer-wire-20260911b\" data-v137-estate-closeout>", "<link rel=\"stylesheet\" href=\"/assets/member-shell-v6.css?v=canonical-20260909\">", "<link rel=\"stylesheet\" href=\"/assets/shift-recovery-v6.css?v=cos-live-recovery-20260909-r2\">", "<link rel=\"stylesheet\" href=\"/assets/header-navigation-v2.css\" data-header-v2-style/>", "<link rel=\"stylesheet\" href=\"/assets/my-timber-pwa.css\">", "<link rel=\"stylesheet\" href=\"/assets/member-experience/v1.css\">", "<link rel=\"stylesheet\" href=\"/member-plans-premium-v1.css?v=1\">", "<link rel=\"stylesheet\" href=\"/assets/member-experience/tools.css\">", "<link rel=\"stylesheet\" href=\"/assets/member-experience/home.css\">", "<link rel=\"stylesheet\" href=\"/assets/member-experience/checkin-followup.css\">", "<link rel=\"stylesheet\" href=\"/assets/member-experience/day-guide.css\">", "<link rel=\"stylesheet\" href=\"/assets/member-experience/chrome.css?v=member-chrome-20260917-v1\">"];

const loader='<script data-coach-stylesheet-loader>document.addEventListener("load",event=>{const link=event.target;if(link?.matches?.("link[data-coach-deferred-style]")){link.media="all";link.dataset.coachStyleLoaded="true"}},true);</script>';
export function deferCurrentDashboardStyles(html){
 if(html.includes('data-coach-stylesheet-loader'))return html;
 const end=html.indexOf('</head>');
 if(end<0)return html;
 const head=html.slice(0,end),protectedHead=head.replace(/<!--[\s\S]*?-->|<script\b[^>]*>[\s\S]*?<\/script\s*>|<style\b[^>]*>[\s\S]*?<\/style\s*>/gi,text=>' '.repeat(text.length));
 const matches=[...protectedHead.matchAll(/<link\b[^>]*\brel\s*=\s*["']stylesheet["'][^>]*>/gi)];
 if(matches.length!==currentDashboardStylesheetTags.length||matches.some((m,i)=>m[0]!==currentDashboardStylesheetTags[i]))return html;
 let changed=head;
 for(const m of [...matches].reverse()){
  const tag=m[0].replace(/\s*\/?>$/,ending=>' media="not all" data-coach-deferred-style'+ending);
  changed=changed.slice(0,m.index)+tag+changed.slice(m.index+m[0].length);
 }
 const first=matches[0].index;
 changed=changed.slice(0,first)+loader+'<noscript>'+currentDashboardStylesheetTags.join('')+'</noscript>'+changed.slice(first);
 return changed+html.slice(end);
}
