import fs from 'node:fs';
import {auditMobile} from './audit.mjs';
import {chromium} from '../selected-pages-tools/node_modules/playwright/index.mjs';
const dir='provider-causes-audit-evidence';fs.mkdirSync(dir,{recursive:true});const browser=await chromium.launch({headless:true,channel:'chrome',args:['--no-sandbox']});try{await auditMobile(browser,{headers:{},dir,label:'live'});}finally{await browser.close();}
