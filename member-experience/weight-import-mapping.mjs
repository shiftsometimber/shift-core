// Local preview only. The existing authenticated import route remains the write boundary.
const MAX_BYTES=32000;
function fail(message){throw new Error(message);}
export function readWeightTable(text,delimiter=','){
 if(typeof text!=='string'||new TextEncoder().encode(text).length>MAX_BYTES)fail('Use a CSV no larger than 32 KB.');
 if(![',',';','\t'].includes(delimiter))fail('Choose comma, semicolon or tab.');
 text=text.replace(/^\uFEFF/,'');
 const rows=[];let row=[],value='',quoted=false,closed=false;
 const field=()=>{row.push(value);value='';closed=false;if(row.length>64)fail('Use no more than 64 columns.');};
 const line=()=>{field();if(row.some(v=>v.trim()!==''))rows.push(row);row=[];if(rows.length>366)fail('Use no more than 365 readings plus a heading.');};
 for(let i=0;i<text.length;i++){
  const c=text[i];
  if(quoted){if(c==='"'){if(text[i+1]==='"'){value+='"';i++;}else{quoted=false;closed=true;}}else{value+=c;}continue;}
  if(c===delimiter){field();continue;}
  if(c==='\n'||c==='\r'){if(c==='\r'&&text[i+1]==='\n')i++;line();continue;}
  if(closed)fail('Unexpected text after a quoted field.');
  if(c==='"'){if(value!=='')fail('Quote a whole field.');quoted=true;}else{value+=c;}
 }
 if(quoted)fail('Close the quoted field.');
 if(value!==''||row.length||closed)line();
 if(rows.length<2)fail('Include column headings and at least one reading.');
 const width=rows[0].length;
 if(rows.some(r=>r.length!==width))fail('Every row must have the same number of columns.');
 return {headings:rows[0],rows:rows.slice(1)};
}
function number(raw,decimal){
 const value=raw.trim();
 const pattern=decimal===','?/^\d+(?:,\d+)?$/:/^\d+(?:\.\d+)?$/;
 if(!pattern.test(value))fail('Use a plain positive number; do not include units or thousands separators.');
 const n=Number(value.replace(',','.'));if(!Number.isFinite(n))fail('Check the weight.');return n;
}
function date(raw,format,today){
 const s=raw.trim();let year,month,day;
 if(format==='ymd'){const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(s);if(!m)fail('Use YYYY-MM-DD dates.');[,year,month,day]=m;}
 else{const m=/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/.exec(s);if(!m)fail('Use four-digit years in the chosen date format.');year=m[3];[day,month]=format==='dmy'?[m[1],m[2]]:[m[2],m[1]];}
 const on=`${year}-${month.padStart(2,'0')}-${day.padStart(2,'0')}`;
 const at=Date.parse(on+'T00:00:00Z');
 if(!Number.isFinite(at)||new Date(at).toISOString().slice(0,10)!==on||on>today)fail('Use a real date that is not in the future.');
 return on;
}
export function previewMappedWeights(text,mapping,now=Date.now()){
 if(!mapping||typeof mapping!=='object')fail('Choose the date and weight columns, date format and unit.');
 const {dateColumn,weightColumn,poundsColumn=null,dateFormat,unit,delimiter=',',decimal='.'}=mapping;
 if(!['ymd','dmy','mdy'].includes(dateFormat)||!['kg','lb','st_lb'].includes(unit)||!['.',','].includes(decimal))fail('Choose a supported date format, weight unit and decimal separator.');
 const table=readWeightTable(text,delimiter),width=table.headings.length;
 const columns=[dateColumn,weightColumn,...(unit==='st_lb'?[poundsColumn]:[])];
 if(columns.some(n=>!Number.isInteger(n)||n<0||n>=width)||new Set(columns).size!==columns.length)fail('Choose distinct existing columns.');
 if(!Number.isFinite(now))fail('Check the current date.');
 const today=new Date(now).toISOString().slice(0,10),seen=new Set(),rows=[];
 for(let i=0;i<table.rows.length;i++){
  try{
   const r=table.rows[i],on=date(r[dateColumn],dateFormat,today);
   if(seen.has(on))fail('Keep only one reading for each date.');
   let weight=number(r[weightColumn],decimal);
   if(unit==='st_lb'){const pounds=number(r[poundsColumn],decimal);if(!Number.isInteger(weight)||pounds>=14)fail('Use whole stones and pounds below 14.');weight=weight*14+pounds;}
   const weightKg=unit==='kg'?weight:weight*0.45359237;
   if(weightKg<20||weightKg>400)fail('Use weights between 20 and 400 kg.');
   // No rounding before range checks. Normalise only for the preview/import payload.
   rows.push({on,weightKg:Math.round(weightKg*1000)/1000});seen.add(on);
  }catch(e){fail(`Reading ${i+1}: ${e.message}`);}
 }
 return {rows,meaning:'Preview only: confirm dates, units and converted weights before importing. Existing same-date readings are kept by My Timber. This imports weight only; no prescriptions, doses, notes or photos.',sourceHeadings:table.headings};
}
