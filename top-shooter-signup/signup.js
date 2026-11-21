'use strict';
const $=id=>document.getElementById(id),form=$('signup');let data,player,submission,receiptKey;
const node=(tag,text,cls)=>{const n=document.createElement(tag);n.textContent=text;if(cls)n.className=cls;return n;};
const error=message=>{$('error').textContent=message;$('error').hidden=!message;};
const date=e=>new Date(e.starts).toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric',timeZone:'America/New_York'});
function step(n){['player','event','review'].forEach((name,i)=>{$(name+'-step').hidden=i+1!==n;$('step'+(i+1)).removeAttribute('aria-current');});$('step'+n).setAttribute('aria-current','step');error('');}
async function api(payload){const response=await fetch('/api/top-shooters',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});let result;try{result=await response.json();}catch{throw Error('Unable to save right now. Please try again.');}if(!response.ok)throw Error(result.error||'Unable to save.');return result;}
function showPlayers(){const q=$('search').value.toLowerCase().trim(),matches=q?data.players.filter(p=>(p.name+' '+p.divisions).toLowerCase().includes(q)).slice(0,16):[];$('players').replaceChildren();if(!q){$('players').append(node('p','Type a name to see matching qualifiers.','muted'));return;}if(!matches.length)$('players').append(node('p','No matching players. Try a last name or contact the league.'));for(const p of matches){const b=node('button',p.name,'player');b.type='button';b.setAttribute('aria-pressed',String(player?.id===p.id));b.append(node('small',JSON.parse(p.divisions).join(' · ')));b.onclick=()=>{player=p;$('choose').disabled=false;showPlayers();};$('players').append(b);}}
$('search').addEventListener('input',()=>{player=null;$('choose').disabled=true;showPlayers();});
$('choose').onclick=()=>{step(2);$('selected-player').textContent=player.name+' — '+Object.entries(player.allowances).map(([d,n])=>d+': '+n+' qualifying listing'+(n===1?' — choose one date':'s — up to '+n+' dates')).join('; ');$('events').replaceChildren();const eligible=data.events.filter(e=>JSON.parse(player.disciplines).includes(e.discipline)&&e.open&&Date.parse(e.starts)>Date.now());for(const e of eligible){const label=node('label','','event'),box=document.createElement('input');box.type='checkbox';box.name='events';box.value=e.id;box.dataset.discipline=e.discipline;box.onchange=()=>{const boxes=[...document.querySelectorAll('input[name=events]')];for(const b of boxes){const selected=boxes.filter(x=>x.checked&&x.dataset.discipline===b.dataset.discipline).length;b.disabled=!b.checked&&selected>=player.allowances[b.dataset.discipline];}};const body=node('span',e.discipline);body.append(node('small',date(e)),node('small','2:30 PM · The Rack, Livonia'),node('small','$'+e.fee+' cash onsite · Maximum 24 players'));label.append(box,body);$('events').append(label);}if(!eligible.length)$('events').append(node('p','No open events match this player. Please contact the league.'));};
$('back-player').onclick=()=>step(1);$('back-events').onclick=()=>step(2);
$('review').onclick=()=>{error('');const fields=new FormData(form),events=fields.getAll('events');if(!events.length){error('Choose at least one event.');return;}if(!form.reportValidity())return;submission={playerId:player.id,events,contactName:fields.get('contactName'),email:fields.get('email'),phone:fields.get('phone'),notes:fields.get('notes'),website:fields.get('website'),requestId:crypto.randomUUID(),token:crypto.randomUUID()};$('review-details').replaceChildren(node('h3',player.name));for(const id of events){const e=data.events.find(e=>e.id===id);$('review-details').append(node('p',e.discipline+' · '+date(e)+' · $'+e.fee));}$('review-details').append(node('p','Entry total: $'+events.reduce((sum,id)=>sum+data.events.find(e=>e.id===id).fee,0)+' — cash onsite'),node('p',submission.contactName+' · '+submission.email+' · '+submission.phone));$('ack').checked=false;step(3);};
function showReceipt(result){form.hidden=true;$('receipt').hidden=false;$('loading').hidden=true;$('receipt-title').textContent=data?.preview?'Test request received.':'Registration status';$('reference').textContent='Reference: '+result.reference;$('receipt-entries').replaceChildren();for(const e of result.entries){const card=node('div','','receipt-item');card.append(node('span',e.status==='pending'?'PENDING LEAGUE REVIEW':e.status.toUpperCase(),'badge'),node('h3',e.name),node('p',e.label+' · '+date(e)),node('p',e.status==='cancelled'?'Entry cancelled.':e.status==='confirmed'?'Your place is confirmed. Entry: $'+e.fee+' cash onsite.':e.status==='waitlisted'?'You are on the waitlist. A place is not confirmed.':'Your request was saved. A place is not confirmed yet.'));if(e.status!=='cancelled'){const b=node('button','Cancel this event','secondary');b.type='button';b.onclick=async()=>{if(!confirm('Cancel this event registration?'))return;b.disabled=true;try{showReceipt(await api({action:'cancel',...receiptKey,entryId:e.id}));}catch(err){error(err.message);b.disabled=false;}};card.append(b);}$('receipt-entries').append(card);}const link=new URL(location.pathname,location.origin);link.hash=new URLSearchParams(receiptKey).toString();$('manage-link').href=link.href;$('manage-link').textContent='My private registration link';history.replaceState(null,'',link.href);$('receipt').focus();void refreshRosters();}
form.onsubmit=async event=>{event.preventDefault();if(!$('ack').checked){error('Please confirm your details before submitting.');return;}error('');$('submit').disabled=true;$('back-events').disabled=true;try{const result=await api({action:'register',...submission});receiptKey={requestId:submission.requestId,token:submission.token};showReceipt(result);}catch(err){error(err.message);}finally{$('submit').disabled=false;$('back-events').disabled=false;}};
$('copy-link').onclick=async()=>{try{await navigator.clipboard.writeText($('manage-link').href);$('copy-status').textContent='Copied. Keep this link private.';}catch{$('copy-status').textContent='Open the link above and save its address.';}};

function showRosters(catalog){
 const list=$('roster-list');list.replaceChildren();
 for(const event of catalog.events){
  const entries=(catalog.signups||[]).filter(n=>n.event_id===event.id),card=node('details','','roster-card');card.open=true;
  const summary=node('summary',''),title=node('span',event.discipline+' · '+date(event));
  const confirmed=entries.filter(n=>n.status==='confirmed').length;
  title.append(node('small',confirmed+' / '+(event.capacity??'—')+' confirmed · '+entries.length+' total signups'));
  summary.append(title);card.append(summary);
  if(!entries.length)card.append(node('p','No signups yet.','muted'));
  for(const [status,label] of [['confirmed','Confirmed'],['pending','Pending league review'],['waitlisted','Waitlisted']]){
   const group=entries.filter(n=>n.status===status);if(!group.length)continue;
   card.append(node('h3',label+' ('+group.length+')','roster-label '+status));const ul=node('ul','');
   for(const entry of group)ul.append(node('li',entry.name));card.append(ul);
  }
  list.append(card);
 }
 $('roster-status').textContent='Updated '+new Date().toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit',timeZone:'America/New_York'})+' ET. Use Refresh list for the latest signups.';
}
async function refreshRosters(){
 $('refresh-rosters').disabled=true;
 try{const response=await fetch('/api/top-shooters',{cache:'no-store'});if(!response.ok)throw Error();const latest=await response.json();showRosters(latest);}
 catch{$('roster-status').textContent='Unable to refresh signup lists. Any names shown may be out of date. Please try again.';}
 finally{$('refresh-rosters').disabled=false;}
}
$('refresh-rosters').onclick=refreshRosters;

(async()=>{try{const response=await fetch('/api/top-shooters');if(!response.ok)throw Error('Signup is temporarily unavailable. Please try again shortly or contact the league.');data=await response.json();showRosters(data);$('preview').hidden=!data.preview;$('source').textContent='Qualifier list: '+data.snapshot;$('loading').hidden=true;const hash=new URLSearchParams(location.hash.slice(1));if(hash.has('requestId')){receiptKey={requestId:hash.get('requestId'),token:hash.get('token')};showReceipt(await api({action:'receipt',...receiptKey}));}else{form.hidden=false;showPlayers();}}catch(err){$('loading').hidden=true;$('roster-status').textContent='Signup lists are temporarily unavailable. Please try Refresh list.';error(err.message);}})();
