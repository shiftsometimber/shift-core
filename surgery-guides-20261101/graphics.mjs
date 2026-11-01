const pairs={
 'balloon-vs-esg':['Balloon','ESG','Intragastric balloon','Endoscopic sleeve gastroplasty'],
 'balloon-vs-sleeve':['Balloon','Sleeve','Intragastric balloon','Sleeve gastrectomy'],
 'esg-vs-gastric-sleeve':['ESG','Sleeve','Endoscopic sleeve gastroplasty','Sleeve gastrectomy'],
 'gastric-band-vs-bypass':['Band','Bypass','Adjustable gastric band','Roux-en-Y gastric bypass'],
 'gastric-bypass-vs-mini-bypass':['Roux-en-Y','Mini bypass','Gastric bypass','One-anastomosis gastric bypass'],
 'sleeve-vs-gastric-bypass':['Sleeve','Bypass','Sleeve gastrectomy','Roux-en-Y gastric bypass'],
 'sleeve-vs-mini-bypass':['Sleeve','Mini bypass','Sleeve gastrectomy','One-anastomosis gastric bypass']
};
export function graphic(p){const [a,b,x,y]=pairs[p.key];return '<div class="qr-graphic sg-art" data-rp-decoration aria-hidden="true"><p class="qr-micro">Compare the whole treatment.</p><div class="sg-pair"><div><span>01</span><strong>'+a+'</strong><p>'+x+'</p></div><div><span>02</span><strong>'+b+'</strong><p>'+y+'</p></div></div><div class="sg-dimensions"><span>Evidence</span><span>Trade-offs</span><span>Follow-up</span></div><p class="sg-foot">Questions for your specialist.</p></div>';}
