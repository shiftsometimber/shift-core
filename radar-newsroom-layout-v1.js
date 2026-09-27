// Scoped newsroom layout; shared by the website candidate and offline preview.
export const NEWSROOM_LAYOUT_STYLE = `<style data-newsroom-layout>

html{background:#050505;color:#e7e3da;-webkit-text-size-adjust:100%}
body.newsroom-page{margin:0!important;background:#050505!important;color:#e7e3da!important;font:16px/1.55 Arial,Helvetica,sans-serif!important;overflow-x:hidden}
.newsroom-page *{box-sizing:border-box}
.newsroom-page main,.newsroom-page main>.content{background:#050505!important;color:#e7e3da!important}
.newsroom-page main [data-news-group]{background:transparent!important;padding:0!important;border:0!important}
.newsroom-page main section::before,.newsroom-page .pagehero::after{display:none!important}
.newsroom-page .site-wrap,.newsroom-page .wrap{width:92%;max-width:1280px;margin-left:auto;margin-right:auto}
.newsroom-page .header-inner{display:flex;align-items:center;justify-content:space-between}
.newsroom-page .site-logo img{display:block}.newsroom-page .menu-trigger{width:auto!important;flex:0 0 auto!important}.newsroom-page .site-logo{display:block}.newsroom-page .site-header{display:block}.newsroom-page .desktop-nav{text-transform:uppercase;flex-shrink:0!important}
.newsroom-page .pagehero{padding:48px 0 32px!important;margin:0!important;min-height:0!important}
.newsroom-page h1{font:800 48px/1.05 Arial,Helvetica,sans-serif!important;letter-spacing:-.04em!important;margin:12px 0 20px!important;color:#e7e3da!important}
.newsroom-page h1 .accent{color:#707762}
.newsroom-page .pagehero p:not(.eyebrow){max-width:740px;font:16px/1.55 Arial,Helvetica,sans-serif!important;color:#c4c4b8!important}
.newsroom-page .eyebrow{font:700 12px/1.4 Arial,Helvetica,sans-serif!important;letter-spacing:.1em!important;color:#adb09f!important}
.newsroom-page .content{padding:0 0 32px!important}
.newsroom-page [data-news-group]>h2{font:700 26px/1.2 Arial,Helvetica,sans-serif!important;margin:30px 0 20px!important;color:#e7e3da!important}
.newsroom-page .radar-news-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px;margin:0 0 36px!important}
.newsroom-page .radar-news-card{border:1px solid #707762!important;border-radius:16px!important;padding:22px!important;background:#10110f!important;color:#e7e3da!important;box-shadow:none!important;min-width:0}
.newsroom-page .radar-news-card:before,.newsroom-page .radar-news-card:after{display:none!important}
.newsroom-page .radar-news-card h2{font:700 23px/1.22 Arial,Helvetica,sans-serif!important;letter-spacing:-.02em!important;color:#e7e3da!important;margin:14px 0!important}
.newsroom-page .radar-news-card p{font:16px/1.55 Arial,Helvetica,sans-serif!important;color:#c4c4b8!important}
.newsroom-page .radar-news-card h2 a{color:#e7e3da!important;text-decoration:none}
.newsroom-page .radar-news-card .eyebrow{font-size:11px!important;color:#adb09f!important}
.newsroom-page .radar-news-card .radar-news-meta{font-size:13px!important;color:#adb09f!important}
.newsroom-page [data-news-filters]{display:flex;gap:14px;align-items:end;flex-wrap:wrap;margin:0!important}
.newsroom-page [data-news-filters] label{display:block;flex:1 1 200px;color:#e7e3da!important;font-size:13px!important;font-weight:700;line-height:1.4!important}
.newsroom-page [data-news-filters] select{display:block;width:100%;margin-top:8px;min-height:46px;background:#050505!important;color:#e7e3da!important;font:16px Arial,Helvetica,sans-serif!important}
.newsroom-page .newsroom-filter-results{font-size:13px;color:#adb09f!important;margin:14px 0 24px}
.newsroom-page .preview-note{width:100%;padding:10px 4%;color:#050505;background:#707762;font:700 12px/1.4 Arial,Helvetica,sans-serif}
.newsroom-page .preview-viewer-note{font:12px/1.45 Arial,Helvetica,sans-serif;color:#adb09f}
.newsroom-page .medicine-ticker-v138{display:none!important}
.newsroom-page .skip-link:not(:focus){position:absolute!important;width:1px!important;height:1px!important;overflow:hidden!important;clip:rect(0,0,0,0)!important}
.newsroom-page .site-drawer{position:fixed;inset:0 0 0 auto;width:min(92%,430px);height:100%;z-index:1000;background:#050505;padding:24px;overflow:auto;border-left:1px solid #707762}
.newsroom-page .site-drawer nav a{display:block;padding:12px 0;color:#e7e3da;text-decoration:none}
.newsroom-page [hidden]{display:none!important}
.newsroom-page footer{padding:30px 4%;border-top:1px solid #707762;color:#adb09f}
@media(max-width:979px){.newsroom-page .radar-news-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.newsroom-page h1{font-size:40px!important}}
@media(max-width:560px){.newsroom-page .wrap{width:calc(100% - 36px)!important}.newsroom-page .pagehero{padding:30px 0 24px!important}.newsroom-page h1{font-size:36px!important}.newsroom-page .pagehero::after{display:none!important}.newsroom-page .radar-news-grid{grid-template-columns:minmax(0,1fr)!important;gap:16px}.newsroom-page [data-news-filters]{padding:16px!important;gap:14px!important}.newsroom-page [data-news-filters] label{flex:1 1 100%}.newsroom-page [data-news-filters] button{width:100%}.newsroom-page [data-news-group]>h2{font-size:23px!important}.newsroom-page .radar-news-card{padding:20px!important}}

</style>`;
