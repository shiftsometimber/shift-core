export function ingredientOptions(recipes){
 const names=new Map();
 for(const recipe of recipes)for(const ingredient of recipe.ingredients||[]){const name=String(ingredient.item||'').trim();if(name&&!names.has(name.toLowerCase()))names.set(name.toLowerCase(),name)}
 return [...names.values()].sort((a,b)=>a.localeCompare(b,'en-GB'));
}
export const ingredientClient=String.raw`
function matchingIngredients(options,query){
 const q=String(query||'').trim().toLowerCase();if(!q)return [];
 return options.filter(name=>name.toLowerCase().includes(q)).sort((a,b)=>Number(!a.toLowerCase().startsWith(q))-Number(!b.toLowerCase().startsWith(q))||a.length-b.length||a.localeCompare(b,'en-GB')).slice(0,8);
}
const ingredientField=$('#sgIngredientInput'),ingredientRow=ingredientField.closest('.grub-add');
const ingredientHelp=document.createElement('p');ingredientHelp.id='grubIngredientHelp';ingredientHelp.textContent='Add one ingredient at a time. Start typing, choose a suggestion, then tap Add ingredient.';
const ingredientList=document.createElement('div');ingredientList.id='grubIngredientOptions';ingredientList.className='grub-ingredient-options';ingredientList.setAttribute('role','listbox');ingredientList.setAttribute('aria-label','Matching ingredients');ingredientList.hidden=true;
const ingredientNotice=document.createElement('p');ingredientNotice.id='grubIngredientNotice';ingredientNotice.setAttribute('role','status');
ingredientRow.before(ingredientHelp);ingredientRow.after(ingredientList,ingredientNotice);
ingredientField.placeholder='Start with one ingredient, e.g. chicken';ingredientField.maxLength=120;ingredientField.autocomplete='off';ingredientField.setAttribute('role','combobox');ingredientField.setAttribute('aria-autocomplete','list');ingredientField.setAttribute('aria-controls',ingredientList.id);ingredientField.setAttribute('aria-expanded','false');ingredientField.setAttribute('aria-describedby',ingredientHelp.id);
$('#sgAddIngredient').textContent='Add ingredient';
let ingredientMatches=[],ingredientActive=-1,selectedIngredient='';
function closeIngredientSuggestions(){ingredientList.hidden=true;ingredientField.setAttribute('aria-expanded','false');ingredientField.removeAttribute('aria-activedescendant');ingredientActive=-1}
function selectIngredient(index){const value=ingredientMatches[index];if(!value)return;ingredientField.value=value;selectedIngredient=value;closeIngredientSuggestions();ingredientNotice.textContent=value+' selected. Tap Add ingredient to add it.';ingredientField.focus({preventScroll:true})}
function showIngredientSuggestions(){
 selectedIngredient='';ingredientActive=-1;ingredientField.removeAttribute('aria-activedescendant');ingredientMatches=matchingIngredients(workspace?.ingredientOptions||[],ingredientField.value).filter(name=>!ingredients.some(x=>x.toLowerCase()===name.toLowerCase()));ingredientList.replaceChildren();
 for(const [index,name]of ingredientMatches.entries()){const option=document.createElement('button');option.type='button';option.id='grubIngredientOption'+index;option.setAttribute('role','option');option.setAttribute('aria-selected','false');option.tabIndex=-1;option.textContent=name;option.onclick=()=>selectIngredient(index);ingredientList.append(option)}
 const visible=ingredientMatches.length>0;ingredientList.hidden=!visible;ingredientField.setAttribute('aria-expanded',String(visible));ingredientNotice.textContent=!ingredientField.value.trim()?'':visible?ingredientMatches.length+' matching ingredients. Use the arrow keys or tap a choice.':'No suggestion found. You can still add the ingredient you typed.';
}
ingredientField.addEventListener('input',showIngredientSuggestions);
ingredientField.addEventListener('keydown',event=>{
 if(event.key==='Escape'){closeIngredientSuggestions();return}
 if(event.key==='Tab'){closeIngredientSuggestions();return}
 if(['ArrowDown','ArrowUp'].includes(event.key)&&ingredientMatches.length){event.preventDefault();ingredientList.hidden=false;ingredientField.setAttribute('aria-expanded','true');ingredientActive=(ingredientActive+(event.key==='ArrowDown'?1:-1)+ingredientMatches.length)%ingredientMatches.length;[...ingredientList.children].forEach((option,index)=>option.setAttribute('aria-selected',String(index===ingredientActive)));ingredientField.setAttribute('aria-activedescendant','grubIngredientOption'+ingredientActive);return}
 if(event.key==='Enter'){event.preventDefault();if(!ingredientList.hidden&&ingredientActive>=0)selectIngredient(ingredientActive);else addIngredient()}
});
document.addEventListener('click',event=>{if(!ingredientRow.contains(event.target)&&!ingredientList.contains(event.target))closeIngredientSuggestions()});
function addIngredient(){
 const item=ingredientField.value.trim();if(!item){ingredientNotice.textContent='Type one ingredient first.';ingredientField.focus();return false}
 if(/[,;\n]/.test(item)&&item!==selectedIngredient){ingredientNotice.textContent='Add one ingredient at a time, then add the next one.';ingredientField.focus();return false}
 if(ingredients.some(x=>x.toLowerCase()===item.toLowerCase())){ingredientNotice.textContent=item+' is already on your list.';return false}
 if(ingredients.length>=40){ingredientNotice.textContent='You have 40 ingredients. Remove one before adding another.';return false}
 ingredients.push(item);ingredientField.value='';selectedIngredient='';closeIngredientSuggestions();drawChips();ingredientNotice.textContent=item+' added. Add your next ingredient, or find recipes.';ingredientField.focus({preventScroll:true});return true;
}
$('#sgAddIngredient').onclick=addIngredient;
`;
export const ingredientStyles=String.raw`
.sst-member-experience .grub-ingredient-options{display:grid;max-width:650px;margin:6px 0 12px;border:1px solid #707762;border-radius:10px;overflow:hidden}
.sst-member-experience .grub-ingredient-options[hidden]{display:none}
html body.sst-member-experience .grub-ingredient-options button{width:100%;min-height:44px;margin:0;padding:10px 14px;text-align:left;border:0;border-bottom:1px solid #707762;border-radius:0;background:#e7e3da!important;color:#050505!important;-webkit-text-fill-color:#050505!important;font:inherit;cursor:pointer}
html body.sst-member-experience .grub-ingredient-options button:is([aria-selected="true"],:hover){background:#050505!important;color:#e7e3da!important;-webkit-text-fill-color:#e7e3da!important}
.sst-member-experience #grubIngredientHelp,.sst-member-experience #grubIngredientNotice{max-width:650px;font-size:15px;line-height:1.5}
.sst-member-experience .grub-add{flex-wrap:wrap}.sst-member-experience #sgAddIngredient{width:auto;min-width:140px;white-space:nowrap}
`;
