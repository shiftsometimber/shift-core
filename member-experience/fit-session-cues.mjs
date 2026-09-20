export const fitSessionCues=String.raw`
  function refreshSessionCue(session){
    if(!session)return;
    const cards=[...session.querySelectorAll('.sf-exercise')];
    let cue=session.querySelector('.sf-current-step');
    if(!cue){cue=document.createElement('section');cue.className='sf-current-step';cue.setAttribute('aria-label','What to do now');cue.setAttribute('aria-live','polite');cue.style.cssText='padding:20px;margin:16px 0;border:1px solid #707762;border-radius:12px;background:#e7e3da;color:#050505';session.querySelector('.sf-exercises').before(cue)}
    const current=cards.findIndex(card=>!['done','skipped'].includes(card.dataset.completion));
    cards.forEach((card,index)=>{let position=card.querySelector('.sf-position');if(!position){position=document.createElement('p');position.className='sf-position';card.querySelector('h4').before(position)}position.textContent='Movement '+(index+1)+' of '+cards.length;card.toggleAttribute('data-current-movement',index===current)});
    cue.replaceChildren();const title=document.createElement('h3'),detail=document.createElement('p'),timing=document.createElement('p');
    title.style.color=detail.style.color=timing.style.color='#050505';
    timing.textContent=session.dataset.sessionMinutes?'Planned session: '+session.dataset.sessionMinutes+' minutes. Take the rest shown for each movement.':'Follow the repetitions or timing shown for each movement. Take the listed rest.';
    if(current<0){title.textContent='Session recorded';detail.textContent='Your Done and Skip choices are saved. Return to Today to see them and say whether your next step helped.';const back=document.createElement('a');back.href='/member/dashboard#today';back.textContent='Back to Today →';back.style.color='#050505';cue.append(title,detail,back);return}
    const card=cards[current];title.textContent='Movement '+(current+1)+' of '+cards.length+' · '+card.querySelector('h4').textContent;
    detail.textContent=(card.querySelector('.sf-exercise-main > details > ol > li')?.textContent||'Open the movement instructions below.')+' Mark Done when finished, or Skip or Swap if it does not fit.';
    cue.append(title,detail,timing);
  }
`;
