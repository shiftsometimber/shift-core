const art={
 'cardio-vs-strength': ['Movement / two different strengths','Walking & cardio','Strength training','Activity','Muscle & function','A place for both.'],
 'lifestyle-vs-medication':['Compare the whole approach.','Lifestyle','Medication + lifestyle','Daily habits','Clinical support','Trade-offs, rather than an overall winner.'],
 'lifestyle-vs-surgery':['Compare the whole pathway.','Lifestyle','Surgery + lifestyle','Daily habits','Procedure & follow-up','Suitability belongs with a clinician.'],
 'structured-vs-diy':['Find a structure you can use.','A programme','Doing it yourself','Built-in support','Your own routine','What makes the next week workable?'],
 'walking-vs-structured-exercise':['A useful first step. A broader plan.','Walking','Structured plan','Activity','More than movement','Compare what each approach covers.'],
 'medication-plus-lifestyle':['Support around treatment.','Medication','Everyday structure','Prescriber-led care','Food, movement & habits','Keep both parts in the conversation.'],
 'surgery-plus-lifestyle':['Support beyond the procedure.','Surgery','Long-term support','Clinical pathway','Nutrition & follow-up','The operation is part of a longer pathway.']
};
export function graphic(page){const [k,a,b,x,y,f]=art[page.key];return '<div class="qr-graphic lg-art" data-rp-decoration aria-hidden="true"><p class="qr-micro">'+k+'</p><div class="lg-pair"><div><span>01</span><strong>'+a+'</strong><p>'+x+'</p></div><div><span>02</span><strong>'+b+'</strong><p>'+y+'</p></div></div><p class="lg-foot">'+f+'</p></div>';}
