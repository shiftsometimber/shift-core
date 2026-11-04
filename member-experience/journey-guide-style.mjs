// Shared guide controls for both Journey presentations.
export const journeyGuideStyles=String.raw`#timberJourney .tj-days{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:4px}
#timberJourney .tj-days button{display:grid;align-content:center;justify-items:center;gap:2px;min-width:0;width:100%;min-height:52px;padding:8px 2px;line-height:1.1}
#timberJourney .tj-day-word{display:block;white-space:nowrap;overflow-wrap:normal;word-break:normal;font-size:clamp(10px,2.8vw,12px)}
#timberJourney .tj-day-number{display:block;white-space:nowrap;font-size:clamp(16px,4.5vw,20px);font-weight:bold}
#timberJourney .tj-sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
`;
