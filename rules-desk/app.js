(() => {
 'use strict';
 const data=window.RULES_DESK, $=id=>document.getElementById(id);
 let active=null;
 const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text)n.textContent=text;if(cls)n.className=cls;return n;};
 const link=(text,url)=>{const n=el('a',text);n.href=url;n.target='_blank';n.rel='noopener';return n;};
 function source(node){const page=$('game').value==='10'&&node.page10?node.page10:node.page;const url=data.pdf+'#page='+page;return link('CSI '+node.rule+' · printed page '+(page-1)+' ↗',url);}
 function clear(){active=null;$('results').replaceChildren();$('flow').replaceChildren();}
 function focus(n){n.tabIndex=-1;n.focus({preventScroll:true});n.scrollIntoView({behavior:'smooth',block:'nearest'});}
 function unknown(){const box=el('section',null,'answer');box.append(el('h3','This needs a closer look'),el('p','No automatic ruling for these facts. Use the rulebook below or contact the league manager with the situation. Nothing has been submitted.'));box.append(link('Open contact page ↗','https://metrodetroitbilliards.com/contact'));$('flow').append(box);focus(box);}
 function step(id){
  if(id==='unclear'){unknown();return;}
  if(id.startsWith('@')){start(id.slice(1));return;}
  const node=active.nodes[id], box=el('section',null,node.answer?'answer':'step');
  if(node.answer){
   box.append(el('p','PUBLISHED-RULE GUIDANCE','eyebrow'),el('h3',active.title),el('p',node.answer,'ruling'));
   const cite=source(node);cite.className='source';box.append(cite,el('p','Applies to the facts selected above. This is not a binding referee decision.','small'));
   const details=el('details');details.append(el('summary','Show the official rulebook here'));
   details.addEventListener('toggle',()=>{if(details.open&&!details.querySelector('iframe')){const frame=el('iframe');frame.title='Official CSI rulebook';frame.src=cite.href;frame.referrerPolicy='no-referrer';details.append(frame,el('p','If your browser cannot display the PDF, use the source link above.','small'));}});box.append(details);
   const actions=el('div',null,'actions'),copy=el('button','Copy answer','secondary');copy.type='button';copy.addEventListener('click',async()=>{const facts=[...$('flow').querySelectorAll('.answered')].map(n=>n.textContent).join('\n');const text=[$('league').value+' · '+$('game').value+'-ball',$('question').value,facts,active.title,node.answer,cite.textContent,cite.href,'Published-rule guidance; not a binding referee decision.'].join('\n');try{await navigator.clipboard.writeText(text);copy.textContent='Copied';}catch{copy.textContent='Select and copy the answer text';}});actions.append(copy);box.append(actions);
  }else{
   box.append(el('p',node.q));if(node.rule)box.append(source(node));const choices=el('div',null,'choices');
   for(const [label,next] of node.choices){const b=el('button',label,'secondary');b.type='button';b.addEventListener('click',()=>{choices.replaceWith(el('p','Selected: '+label));box.classList.add('answered');step(next);});choices.append(b);}box.append(choices);
  }
  $('flow').append(box);focus(box);
 }
 function start(id){active=data.topics.find(t=>t.id===id);$('flow').replaceChildren();step(active.start);}
 function search(){
  clear();const q=$('question').value.toLowerCase().replace(/[^a-z0-9 -]/g,' ');const words=new Set(q.split(/\s+/));
  const topics=data.topics.filter(t=>t.games.includes($('game').value));const ranked=topics.map(t=>({t,score:t.keywords.filter(k=>words.has(k)).length})).sort((a,b)=>b.score-a.score);
  const matches=q.trim()?ranked.filter(r=>r.score>0):ranked;
  $('results').append(el('h3',matches.length?'Choose the topic that matches':'No supported topic matched'),el('p',matches.length?'Confirm the topic first; keyword matches are not rulings.':'Try a topic below, browse the rulebook, or contact the league manager.','hint'));
  const list=el('div',null,'topics');for(const {t} of (matches.length?matches:ranked)){const b=el('button',t.title,'topic');b.type='button';b.addEventListener('click',()=>start(t.id));list.append(b);}$('results').append(list);
 }
 $('ask').addEventListener('submit',e=>{e.preventDefault();search();});
 $('game').addEventListener('change',()=>{clear();search();});$('league').addEventListener('change',clear);
 $('question').addEventListener('input',clear);
 $('reset').addEventListener('click',()=>{$('question').value='';clear();search();$('question').focus();});
 for(const [title,page] of data.library){const a=link(title+' ↗',data.pdf+'#page='+page);a.className='topic';$('library').append(a);}
 search();
})();
