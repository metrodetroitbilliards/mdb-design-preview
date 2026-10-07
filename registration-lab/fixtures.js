// Synthetic data only. This adapter has NO external write path.
const labFormats=['8-Ball','9-Ball','10-Ball'];
const labKey=s=>String(s||'').toLowerCase().replace(/&/g,'and').replace(/[^a-z0-9]/g,'');
const labPlayers=Array.from({length:10},(_,i)=>({name:`Sample Player ${String(i+1).padStart(2,'0')}`,fargo:350+i*35}));
const labScenarios=[['Demo Five',5],['Demo Six',6],['Demo Eight',8],['Demo Ten',10],['Demo Four',4],['Demo Empty',0],['Demo Registered',6]];
const labData={regInfo:{},rosters:{},qualifiedRegPlayers:{}};
for(const fmt of labFormats){
 labData.regInfo[fmt]=labScenarios.map(([n])=>({displayName:n+' - 1',isRegistered:n==='Demo Registered'}));
 labData.qualifiedRegPlayers[fmt]={};
 for(const [n,count]of labScenarios)labData.qualifiedRegPlayers[fmt][labKey(n)]=labPlayers.slice(0,count);
 labData.rosters[fmt]={'Sample Home - 1':labPlayers.slice(0,8),'Sample Away - 1':labPlayers.slice(2,10)};
}
function validateLabRoster(d,data){
 if(!d||!labFormats.includes(d.format))throw Error('Choose a valid format.');
 const entry=data.regInfo[d.format].find(t=>t.displayName===d.teamName);
 if(!entry)throw Error('Choose a qualified team and bid.');
 if(entry.isRegistered)throw Error('This team and format are already registered.');
 if(!Array.isArray(d.players))throw Error('Player list is missing.');
 const names=d.players.filter(x=>typeof x==='string'&&x.trim()).map(x=>x.trim());
 if(names.length<5||names.length>8)throw Error('Select between 5 and 8 players.');
 if(new Set(names.map(n=>n.toLowerCase())).size!==names.length)throw Error('A player cannot appear twice.');
 const base=d.teamName.replace(/\s*-\s*\d+$/,'');
 const eligible=data.qualifiedRegPlayers[d.format][labKey(base)]||[];
 if(names.some(n=>!eligible.some(p=>p.name===n)))throw Error('One or more players are not eligible for this team and format.');
 return names;
}
window.LAB={data:labData,validate:validateLabRoster,submissions:[],failNext:false};
window.google={script:{run:{withSuccessHandler(success){const chain={withFailureHandler(failure){this.failure=failure;return this;},getAppData(){setTimeout(()=>success(structuredClone(labData)),50);},submitTeamRegistration(d){setTimeout(()=>{try{if(LAB.failNext){LAB.failNext=false;throw Error('Simulated connection failure. Nothing was saved.');}const names=validateLabRoster(d,labData);labData.regInfo[d.format].find(t=>t.displayName===d.teamName).isRegistered=true;LAB.submissions.push({teamName:d.teamName,format:d.format,players:names});success('TEST ONLY: sample registration saved in this browser session.');}catch(e){if(this.failure)this.failure(e);}},100);},submitMatch(){if(this.failure)this.failure(Error('Match submission is disabled in this test version.'));}};return chain;}}}};
