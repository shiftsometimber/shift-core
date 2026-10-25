import fs from 'node:fs/promises';
import path from 'node:path';
import {FileBlob, SpreadsheetFile} from '@oai/artifact-tool';

const input = JSON.parse(await fs.readFile(process.argv[2], 'utf8'));
const workbook = await SpreadsheetFile.importXlsx(await FileBlob.load(input.workbookSource));
for (const [name, cells] of Object.entries(input.workbookEdits)) {
  const sheet = workbook.worksheets.getItem(name);
  for (const [address, value] of Object.entries(cells)) sheet.getRange(address).values = [[value]];
}
for (const [name, range] of input.autofitRanges ?? []) workbook.worksheets.getItem(name).getRange(range).format.autofitRows();
workbook.recalculate();
for (const range of input.inspectRanges ?? []) {
  const result = await workbook.inspect({kind:'table', range, include:'values,formulas', tableMaxRows:6, tableMaxCols:8, maxChars:4000});
  console.log(result.ndjson ?? JSON.stringify(result));
}
const errors = await workbook.inspect({kind:'match', searchTerm:'#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!|#NULL!|#SPILL!|#CALC!', options:{useRegex:true,maxResults:30}, maxChars:2000});
console.log(errors.ndjson ?? JSON.stringify(errors));
await fs.mkdir(path.dirname(input.workbookOutput), {recursive:true});
const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(input.workbookOutput);
for (const item of input.renderRanges ?? []) {
  const image = await workbook.render({sheetName:item.sheet,range:item.range,scale:1,format:'png'});
  await fs.writeFile(item.output, new Uint8Array(await image.arrayBuffer()));
}
console.log(JSON.stringify({output:input.workbookOutput,edits:Object.fromEntries(Object.entries(input.workbookEdits).map(([name,cells])=>[name,Object.keys(cells).length]))}));
