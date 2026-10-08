// Derive current state from the append-only member history. Recorded stock and
// schedules remain separate: a dose never creates a new prescribing instruction.
export function projectTreatment(record, events) {
 let supply=record.supply,status=record.status,nextAt=record.next_at,reminder=false;
 const history=events.filter(e=>e.treatment_id===record.id).sort((a,b)=>a.occurred_at.localeCompare(b.occurred_at)||a.created_at.localeCompare(b.created_at)||a.id.localeCompare(b.id));
 for(const e of history){const d=e.details||JSON.parse(e.body_json||'{}');
  if(e.kind==='dose_taken')supply=Math.max(0,supply-1);
  if(e.kind==='supply_updated')supply=d.supply;
  if(e.kind==='paused')status='paused';if(e.kind==='finished')status='finished';if(e.kind==='resumed')status='active';
  if(e.kind==='schedule_updated')nextAt=d.nextAt;
  if(e.kind==='reminder_updated')reminder=d.enabled;
 }
 return {...record,supply,status,next_at:nextAt,reminder_enabled:reminder};
}
export function summaryPdf(lines){
 const ascii=s=>String(s).normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[–—]/g,'-').replace(/[‘’]/g,"'").replace(/[“”]/g,'"').replace(/[^\x20-\x7e\n]/g,'?');
 const wrapped=[];for(const line of lines)for(const part of ascii(line).split('\n')){let remaining=part;while(remaining.length>86){let at=remaining.lastIndexOf(' ',86);if(at<1)at=86;wrapped.push(remaining.slice(0,at));remaining=remaining.slice(at).trimStart();}wrapped.push(remaining);}
 const pages=[];for(let i=0;i<wrapped.length;i+=48)pages.push(wrapped.slice(i,i+48));if(!pages.length)pages.push([]);
 const objects=['<< /Type /Catalog /Pages 2 0 R >>','', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'];const kids=[];
 for(const [index,rows] of pages.entries()){const id=objects.length+1;kids.push(id+' 0 R');let stream='BT /F1 11 Tf 14 TL 48 792 Td\n';for(const line of [...rows,'',`Page ${index+1} of ${pages.length}`])stream+='('+line.replace(/([\\()])/g,'\\$1')+') Tj T*\n';stream+='ET';objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R >> >> /Contents ${id+1} 0 R >>`,`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);}
 objects[1]=`<< /Type /Pages /Kids [${kids.join(' ')}] /Count ${pages.length} >>`;let out='%PDF-1.4\n',offsets=[0];objects.forEach((o,i)=>{offsets.push(out.length);out+=`${i+1} 0 obj\n${o}\nendobj\n`;});const xref=out.length;out+=`xref\n0 ${objects.length+1}\n0000000000 65535 f \n`;out+=offsets.slice(1).map(x=>String(x).padStart(10,'0')+' 00000 n \n').join('');out+=`trailer\n<< /Size ${objects.length+1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;return new TextEncoder().encode(out);
}
