import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {database} from '../signup/local-db.js';
import {catalog,register,cancel,ownerUpdate} from '../signup/service.js';
test('public roster lists active names by event and status without private fields; updates after cancellation',async()=>{
 const db=database();db.exec(fs.readFileSync(new URL('../signup/schema.sql',import.meta.url),'utf8'));db.exec(fs.readFileSync(new URL('../signup/seed.sql',import.meta.url),'utf8'));db.exec('UPDATE events SET open=1');
 const seed=await catalog(db),requests=[];
 for(const [name,status,event] of [['Karchefske, Jenn','confirmed','8-ball-2026-11-21'],['Grace, Paul','pending','8-ball-2026-11-21'],['Beaudoin, Brian','waitlisted','8-ball-2027-01-09']]){
  const payload={playerId:seed.players.find(p=>p.name===name).id,events:[event],contactName:'PRIVATE CONTACT',email:'private@example.invalid',phone:'3135550100',notes:'PRIVATE NOTES',requestId:crypto.randomUUID(),token:crypto.randomUUID()};
  const entry=(await register(db,payload,new Date('2026-11-01'))).entries[0];
  if(status!=='pending')await ownerUpdate(db,{entryId:entry.id,status},'test-owner');requests.push({payload,entry});
 }
 const publicData=await catalog(db);assert.equal(publicData.signups.length,3);
 assert.deepEqual(publicData.signups.map(n=>n.status).sort(),['confirmed','pending','waitlisted']);
 for(const row of publicData.signups)assert.deepEqual(Object.keys(row).sort(),['event_id','name','status']);
 const serialized=JSON.stringify(publicData);
 for(const secret of ['PRIVATE CONTACT','private@example.invalid','3135550100','PRIVATE NOTES',...requests.flatMap(r=>[r.payload.requestId,r.payload.token,r.entry.id])])assert.ok(!serialized.includes(secret));
 assert.equal(publicData.signups.find(n=>n.name==='Beaudoin, Brian').event_id,'8-ball-2027-01-09');
 await cancel(db,{...requests[0].payload,entryId:requests[0].entry.id});
 assert.equal((await catalog(db)).signups.length,2);assert.ok(!(await catalog(db)).signups.some(n=>n.name==='Karchefske, Jenn'));
 db.close();
});
