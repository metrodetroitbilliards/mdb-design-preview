/* Review-only prototype: no network submission or browser storage of personal data. */
const form=document.querySelector('#registration-form');
const panels=[...document.querySelectorAll('.registration-step')];
let step=0;
const values=()=>new FormData(form);
function show(i){step=i;panels.forEach((p,n)=>p.hidden=n!==i);document.querySelector('#registration-progress').textContent=`Step ${i+1} of 3`;document.querySelector('#registration-error').textContent='';panels[i].querySelector('h2').focus();}
function next(){
 const invalid=[...panels[step].querySelectorAll('input,textarea')].find(e=>!e.checkValidity());
 if(invalid){invalid.reportValidity();return;}
 if(step===0&&!values().getAll('event').length){document.querySelector('#registration-error').textContent='Please choose at least one event.';panels[0].querySelector('[name=event]').focus();return;}
 if(step===1){const d=values(),list=document.querySelector('#registration-summary');list.replaceChildren();for(const [label,value] of [['Team',d.get('team')],['Division',d.get('division')],['Events',d.getAll('event').join(', ')],['Contact name',d.get('captain')],['Phone',d.get('phone')],['Email',d.get('email')],['Players',d.get('players')||'To be confirmed'],['Notes',d.get('notes')||'None']]){const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=label;dd.textContent=value;list.append(dt,dd);}}
 show(step+1);
}
form.addEventListener('submit',e=>{e.preventDefault();if(step<2)next();});
document.querySelectorAll('[data-next]').forEach(b=>b.onclick=next);
document.querySelectorAll('[data-back]').forEach(b=>b.onclick=()=>show(step-1));
show(0);
