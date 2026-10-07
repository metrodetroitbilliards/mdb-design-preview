let labDirty=false,labPreviousTeam='',labPreviousFormat='9-Ball';
const regTeam=()=>document.getElementById('reg_team_name');
const regFormat=()=>document.getElementById('reg_format');
const eligible=()=>{const base=regTeam().value.replace(/\s*-\s*\d+$/,'');return window.qualifiedRegPlayers[regFormat().value]?.[makeKey(base)]||[];};
const selected=()=>regPlayers.filter(Boolean);
function labDraw(){
 const players=eligible(),chosen=selected(),list=document.getElementById('lab-roster');list.replaceChildren();
 const status=document.getElementById('lab-roster-status');
 status.textContent=!regTeam().value?'Choose a team to load eligible players.':players.length<5?`${players.length} eligible players found. At least 5 are required. Contact league staff; registration is blocked.`:players.length>8?`${chosen.length} selected · choose 5–8 of ${players.length} eligible players.`:`${chosen.length} selected of ${players.length} eligible players. The eligible roster was filled automatically; review it below.`;
 for(const player of players){const label=document.createElement('label');label.className='lab-player';const check=document.createElement('input');check.type='checkbox';check.checked=chosen.some(p=>p.name===player.name);check.setAttribute('aria-label',player.name);const name=document.createElement('span');name.textContent=player.name;const rating=document.createElement('small');rating.textContent='Fargo '+player.fargo;check.onchange=()=>{let next=selected().filter(p=>p.name!==player.name);if(check.checked){if(next.length===8){check.checked=false;showToast('Eight players maximum. Uncheck someone before adding another.','warning');return;}next.push(player);}regPlayers=[...next,...Array(8-next.length).fill(null)];labDirty=true;labDraw();};label.append(check,name,rating);list.append(label);}
 const btn=document.getElementById('regSubmitBtn');btn.innerText='Review roster';btn.disabled=!regTeam().value||chosen.length<5||chosen.length>8||window.regInfo[regFormat().value]?.find(t=>t.displayName===regTeam().value)?.isRegistered;
}
checkRegTeamStatus=function(){
 if(labDirty&&regTeam().value!==labPreviousTeam&&!confirm('Changing teams will replace your roster edits. Continue?')){regTeam().value=labPreviousTeam;return;}
 labPreviousTeam=regTeam().value;labDirty=false;
 const players=eligible();const fill=players.length<=8?players:[];regPlayers=[...fill,...Array(8-fill.length).fill(null)];
 document.getElementById('lab-receipt').hidden=true;labDraw();
};
updateRegTeamDropdown=function(){
 if(labDirty&&regFormat().value!==labPreviousFormat&&!confirm('Changing formats will replace your roster edits. Continue?')){regFormat().value=labPreviousFormat;return;}
 labDirty=false;labPreviousFormat=regFormat().value;labPreviousTeam='';
 regTeam().replaceChildren(new Option('Choose your qualified team and bid',''));
 for(const team of window.regInfo[regFormat().value]||[]){const option=new Option(team.displayName+(team.isRegistered?' (Already registered)':''),team.displayName);option.disabled=team.isRegistered;regTeam().append(option);}
 checkRegTeamStatus();
};
processRegSubmit=function(){
 const payload={teamName:regTeam().value,format:regFormat().value,players:selected().map(p=>p.name)};
 try{LAB.validate(payload,LAB.data);}catch(e){showToast(e.message,'error');return;}
 const modal=document.getElementById('lab-review');document.getElementById('lab-review-team').textContent=payload.teamName+' · '+payload.format;
 const list=document.getElementById('lab-review-players');list.replaceChildren();for(const player of selected()){const li=document.createElement('li');li.textContent=player.name+' — Fargo '+player.fargo;list.append(li);}
 const button=document.getElementById('lab-confirm');button.disabled=false;button.textContent='Confirm test registration';button.onclick=()=>{button.disabled=true;button.textContent='Saving test…';google.script.run.withSuccessHandler(msg=>{modal.close();window.regInfo=structuredClone(LAB.data.regInfo);labDirty=false;updateRegTeamDropdown();const receipt=document.getElementById('lab-receipt');receipt.textContent=msg+' '+payload.teamName+' · '+payload.format+' · '+payload.players.length+' players. Refreshing resets all test registrations.';receipt.hidden=false;receipt.focus();}).withFailureHandler(err=>{document.getElementById('lab-review-error').textContent=err.message;button.disabled=false;button.textContent='Retry test registration';}).submitTeamRegistration(payload);};document.getElementById('lab-review-error').textContent='';modal.showModal();
};
function labChooseScoring(side,idx){
 const format=document.getElementById('game_format').value,team=document.getElementById(side+'_team_name').value.trim();const roster=window.teamRosters[format]?.[team]||[];
 if(!roster.length){showToast('Choose a sample team first.','warning');return;}
 const modal=document.getElementById('lab-picker'),search=document.getElementById('lab-player-search'),list=document.getElementById('lab-player-options');
 function draw(){list.replaceChildren();for(const p of roster.filter(p=>p.name.toLowerCase().includes(search.value.toLowerCase()))){const button=document.createElement('button');button.type='button';const used=playerNames[side].some((n,i)=>n===p.name&&i!==idx);button.textContent=p.name+' · Fargo '+p.fargo+(used?' — already selected':'');button.disabled=used;button.onclick=()=>{if(playerNames[side][idx]===p.name){modal.close();return;}const scores=['h','a'].flatMap(s=>[1,2,3].map(g=>document.getElementById(s+'_s_'+idx+'_'+g)));if(scores.some(e=>e.value!=='')&&!confirm('Changing this player will clear entered scores for this match row (both players). Continue?'))return;
 for(const g of [1,2,3]){clearTimeout(scoreTimeouts[idx+'_'+g]);delete scoreTimeouts[idx+'_'+g];}scores.forEach(e=>e.value='');playerNames[side][idx]=p.name;playerFargos[side][idx]=p.fargo;document.getElementById(side+'_p_input_'+idx).value=p.name;document.getElementById(side+'_name_disp_'+idx).textContent=p.name;document.getElementById(side+'_fargo_disp_'+idx).textContent='Fargo: '+p.fargo;calc();validateScoringInputs();modal.close();};list.append(button);}if(!list.children.length){const none=document.createElement('p');none.textContent='No matching players. Try another name.';list.append(none);}}
 search.value='';search.oninput=draw;draw();modal.showModal();search.focus();
}
window.onload=function(){
 const oldGrid=document.getElementById('reg_p_input_0').closest('.search-container').parentElement.parentElement;oldGrid.hidden=true;oldGrid.style.display='none';
 const panel=document.createElement('div');panel.innerHTML='<div id="lab-receipt" class="lab-receipt" tabindex="-1" hidden></div><p class="lab-start-note">This is the full registered roster, not your five-player starting lineup. Handicap calculations remain on Log Match.</p><p id="lab-roster-status" class="lab-status" role="status"></p><div id="lab-roster" class="lab-roster"></div>';oldGrid.before(panel);
 for(const side of ['h','a'])for(let i=0;i<5;i++){const input=document.getElementById(side+'_p_input_'+i);input.readOnly=true;['oninput','onfocus','onblur'].forEach(a=>input.removeAttribute(a));const button=document.createElement('button');button.type='button';button.className='change-player';button.id='change-'+side+'-'+i;button.textContent='Choose / change player';button.onclick=()=>labChooseScoring(side,i);input.after(button);}
 document.querySelector('#lab-fail-save').onchange=e=>LAB.failNext=e.target.checked;
 const matchButton=document.getElementById('submitBtn');matchButton.onclick=()=>showToast('Match submission is disabled in this isolated test.','warning');
 updateFormatUI();google.script.run.withSuccessHandler(data=>{window.regInfo=data.regInfo;window.teamRosters=data.rosters;window.qualifiedRegPlayers=data.qualifiedRegPlayers;updateRegTeamDropdown();validateScoringInputs();}).getAppData();switchView(new URLSearchParams(location.search).get('view')==='scoring'?'scoring':'registration');
};
