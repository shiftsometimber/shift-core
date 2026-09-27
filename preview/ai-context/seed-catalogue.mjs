import {readFileSync} from 'node:fs';
import {CATALOGUE_PUBLICATION_RELEASE} from '../../catalogue-publication-release-v1.mjs';
import {validateCatalogueRelease} from '../../catalogue-publication-core.mjs';
import {loadGrubCatalogue} from '../../member-experience/grub-routes.mjs';
import {memberRecipe} from '../../member-experience/grub-search.mjs';
export async function seedCatalogue(DB){
 DB.sqlite.exec(readFileSync('member-experience/staging/catalogue-schema.sql','utf8'));
 const sql=readFileSync('preview/ai-context/generated/publication/final-v1-production-publication.sql','utf8');
 DB.sqlite.exec(sql.split('\n').filter(s=>s.startsWith('INSERT INTO structured_content')).join('\n'));
 for(const row of await validateCatalogueRelease(CATALOGUE_PUBLICATION_RELEASE)){
  if(row.content_type!=='recipe')continue;
  DB.sqlite.prepare('INSERT OR IGNORE INTO structured_content(id,content_type,title,version,status,data_json,review_json,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?)').run(row.id,row.content_type,row.title,row.version,row.status,row.data_json,row.review_json,row.created_at,row.updated_at);
 }
 const recipes=(await loadGrubCatalogue(DB)).map(r=>memberRecipe(r)).filter(Boolean);
 const recipe=recipes.find(r=>r.minutes<=15&&r.ingredients.length>=3)||recipes[0];
 if(!recipe)throw Error('No governed recipe available');return recipe;
}
