const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export class InputError extends Error{constructor(status,message){super(message);this.status=status;}}
const fail=(message,status=400)=>{throw new InputError(status,message);};
export const digest=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),x=>x.toString(16).padStart(2,'0')).join('');
const rows=async(db,sql,...args)=>(await db.prepare(sql).bind(...args).all()).results;
export async function catalog(db){return {players:await rows(db,'SELECT * FROM players ORDER BY name'),events:await rows(db,'SELECT * FROM events ORDER BY starts'),venue:'The Rack, Livonia',snapshot:'October 26, 2026, with owner corrections',confirmation:'Entries are reviewed by the league before a place is confirmed.'};}
function clean(value,max,required=true){if(typeof value!=='string'||value.length>max||/[\u0000-\u001f]/.test(value))fail('Please check your contact details.');value=value.trim();if(required&&!value)fail('Please complete the required fields.');return value;}
export async function receipt(db,data){
 if(!uuid.test(data.requestId)||!uuid.test(data.token))fail('Invalid registration link.');
 const request=await db.prepare('SELECT * FROM requests WHERE id=? AND token_hash=?').bind(data.requestId,await digest(data.token)).first();
 if(!request)fail('Registration link not found.',404);
 return {reference:request.id,entries:await rows(db,'SELECT n.id,n.event_id,n.status,n.paid,n.checked_in,e.label,e.starts,e.fee,p.name FROM entries n JOIN events e ON e.id=n.event_id JOIN players p ON p.id=n.player_id WHERE request_id=? ORDER BY e.starts',request.id)};
}
export async function register(db,data,now=new Date()){
 if(!data||typeof data!=='object'||data.website)fail('Unable to accept this request.');
 if(!uuid.test(data.requestId)||!uuid.test(data.token))fail('Please reload the signup page.');
 const playerId=clean(data.playerId,80),contactName=clean(data.contactName,120),email=clean(data.email,180).toLowerCase(),phone=clean(data.phone,40),notes=clean(data.notes||'',1000,false);
 if(!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email)||phone.replace(/\D/g,'').length<10)fail('Enter a valid email and phone number.');
 if(!Array.isArray(data.events)||!data.events.length||data.events.length>5||data.events.some(id=>typeof id!=='string'))fail('Choose at least one event.');
 const ids=[...new Set(data.events)].sort();
 const payloadHash=await digest(JSON.stringify({playerId,contactName,email,phone,notes,ids}));
 const existing=await db.prepare('SELECT * FROM requests WHERE id=?').bind(data.requestId).first();
 if(existing){if(existing.token_hash!==await digest(data.token)||existing.payload_hash!==payloadHash)fail('This request has changed. Start a new registration.',409);return receipt(db,data);}
 const player=await db.prepare('SELECT * FROM players WHERE id=?').bind(playerId).first();
 if(!player)fail('Select a player from the qualifier list.');
 const disciplines=JSON.parse(player.disciplines);
 const events=await rows(db,'SELECT * FROM events');
 for(const id of ids){const event=events.find(e=>e.id===id);if(!event||!event.open||Date.parse(event.starts)<=now.getTime()||!disciplines.includes(event.discipline))fail('One of these events is closed or does not match this player.');}
 const statements=[db.prepare('INSERT INTO requests(id,token_hash,payload_hash,created) VALUES(?,?,?,?)').bind(data.requestId,await digest(data.token),payloadHash,now.toISOString())];
 for(const id of ids)statements.push(db.prepare('INSERT INTO entries(id,request_id,player_id,event_id,contact_name,email,phone,notes,created) VALUES(?,?,?,?,?,?,?,?,?)').bind(crypto.randomUUID(),data.requestId,playerId,id,contactName,email,phone,notes,now.toISOString()));
 try{await db.batch(statements);}catch(error){
  const retry=await db.prepare('SELECT * FROM requests WHERE id=?').bind(data.requestId).first();
  if(retry&&retry.token_hash===await digest(data.token)&&retry.payload_hash===payloadHash)return receipt(db,data);
  if(/UNIQUE|constraint/i.test(error.message))fail('An entry already exists for one of these events. No new entries were saved. Contact the league if you need help.',409);
  throw error;
 }
 return receipt(db,data);
}
export async function cancel(db,data){
 const result=await receipt(db,data);
 if(!result.entries.some(e=>e.id===data.entryId))fail('Entry not found.',404);
 await db.batch([db.prepare("UPDATE entries SET status='cancelled' WHERE id=? AND request_id=?").bind(data.entryId,data.requestId),db.prepare('INSERT INTO audit(actor,entry_id,action,created) VALUES(?,?,?,?)').bind('registration-link',data.entryId,'cancelled',new Date().toISOString())]);
 return receipt(db,data);
}
export async function ownerList(db){return rows(db,'SELECT n.*,p.name,e.label,e.capacity FROM entries n JOIN players p ON p.id=n.player_id JOIN events e ON e.id=n.event_id ORDER BY n.created DESC');}
export async function ownerUpdate(db,data,actor){
 if(!uuid.test(data.entryId))fail('Invalid entry.');
 const entry=await db.prepare('SELECT * FROM entries WHERE id=?').bind(data.entryId).first();if(!entry)fail('Entry not found.',404);
 let statement;
 if(['pending','confirmed','waitlisted','cancelled'].includes(data.status)){
  if(data.status==='confirmed')statement=db.prepare("UPDATE entries SET status='confirmed' WHERE id=? AND status!='cancelled' AND (SELECT capacity FROM events WHERE id=event_id) IS NOT NULL AND (status='confirmed' OR (SELECT COUNT(*) FROM entries x WHERE x.event_id=entries.event_id AND x.status='confirmed') < (SELECT capacity FROM events WHERE id=event_id))").bind(data.entryId);
  else if(entry.status==='cancelled'&&data.status!=='cancelled')fail('Cancelled entries must be registered again.');
  else statement=db.prepare('UPDATE entries SET status=? WHERE id=?').bind(data.status,data.entryId);
 }else if(['paid','checked_in'].includes(data.field)&&[0,1].includes(data.value)){
  if(entry.status!=='confirmed')fail('Confirm this entry before checking in or recording payment.');
  statement=db.prepare(`UPDATE entries SET ${data.field}=? WHERE id=? AND status='confirmed'`).bind(data.value,data.entryId);
 }else fail('Invalid action.');
 const result=await db.batch([statement,db.prepare("INSERT INTO audit(actor,entry_id,action,created) SELECT ?,?,?,? WHERE changes()>0").bind(actor,data.entryId,JSON.stringify(data),new Date().toISOString())]);
 if(!result[0].meta.changes)fail('Cannot confirm: set event capacity first, check available places, and ensure the entry is not cancelled.',409);
 return {ok:true};
}
