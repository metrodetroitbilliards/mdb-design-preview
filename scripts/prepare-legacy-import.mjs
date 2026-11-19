import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {database} from '../signup/local-db.js';
const [input,output]=process.argv.slice(2);if(!input||!output)throw Error('Supply private reviewed manifest and private output SQL path');
const m=JSON.parse(fs.readFileSync(input,'utf8'));assert.equal(m.ownerReview.held,0);
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const uuid=s=>{const a=sha(s).slice(0,32).split('');a[12]='4';a[16]='8';return [a.slice(0,8),a.slice(8,12),a.slice(12,16),a.slice(16,20),a.slice(20)].map(x=>x.join('')).join('-');};
const q=s=>"'"+String(s).replaceAll("'","''")+"'";
const answer=(r,k)=>r.answers?.[k]?.textAnswers?.answers?.[0]?.value?.trim()||'';
const sql=[`CREATE TABLE IF NOT EXISTS legacy_migration (migration_key TEXT PRIMARY KEY, disposition TEXT NOT NULL, source_keys TEXT NOT NULL, payload_hash TEXT NOT NULL, entry_id TEXT, decision_source TEXT NOT NULL);`];
const expected=[];
for(const c of m.candidates){assert(['eligible-candidate-not-imported','exclude-from-migration'].includes(c.disposition));const sourceRows=c.sourceKeys.map(k=>m.originalResponses.find(r=>r.responseId===k.slice(0,k.lastIndexOf(':'))));assert(sourceRows.every(Boolean));sourceRows.sort((a,b)=>a.createTime.localeCompare(b.createTime));const r=sourceRows[0];const retained=c.disposition==='eligible-candidate-not-imported';
const payload=sha(JSON.stringify({player:c.playerId,event:c.eventId,sourceKeys:c.sourceKeys,disposition:c.disposition}));const requestId=uuid('request:'+c.migrationKey),entryId=uuid('entry:'+c.migrationKey);const created=c.firstSubmitted;
// Guard fails closed on manifest changes, without overwriting an earlier import.
sql.push(`INSERT INTO legacy_migration(migration_key,disposition,source_keys,payload_hash,entry_id,decision_source) VALUES(${[c.migrationKey,c.disposition,JSON.stringify(c.sourceKeys),payload,retained?entryId:'',c.decisionSource||'reviewed-manifest'].map(q).join(',')}) ON CONFLICT(migration_key) DO UPDATE SET payload_hash=CASE WHEN legacy_migration.payload_hash=excluded.payload_hash THEN legacy_migration.payload_hash ELSE NULL END;`);
if(!retained)continue;
const phone=answer(r,'51c03b52'),email=answer(r,'45c7a157');assert(phone&&email,'Missing source contact');
sql.push(`INSERT INTO requests(id,token_hash,payload_hash,created) SELECT ${[requestId,sha(crypto.randomUUID()),payload,created].map(q).join(',')} WHERE NOT EXISTS(SELECT 1 FROM requests WHERE id=${q(requestId)});`);
const notes='Legacy Google Form registration; original IDs/timestamps and duplicate provenance retained in legacy_migration. Owner decisions 1020/1023. '+answer(r,'2106c834');
sql.push(`INSERT INTO entries(id,request_id,player_id,event_id,contact_name,email,phone,notes,status,created) SELECT ${[entryId,requestId,c.playerId,c.eventId,c.name,email,phone,notes,'confirmed',created].map(q).join(',')} WHERE NOT EXISTS(SELECT 1 FROM entries WHERE id=${q(entryId)});`);
sql.push(`INSERT INTO audit(actor,entry_id,action,created) SELECT 'legacy-migration',${q(entryId)},'preserved-original-guaranteed-place',${q(created)} WHERE NOT EXISTS(SELECT 1 FROM audit WHERE actor='legacy-migration' AND entry_id=${q(entryId)});`);
expected.push({id:entryId,playerId:c.playerId,eventId:c.eventId,created});
}
assert.equal(expected.length,14);const text=sql.join('\n');const db=database();for(const n of ['schema','seed'])db.exec(fs.readFileSync(new URL('../signup/'+n+'.sql',import.meta.url),'utf8'));db.exec(text);db.exec(text);
const rows=(await db.prepare('SELECT id,player_id,event_id,created,status FROM entries ORDER BY id').all()).results;assert.equal(rows.length,14);assert(rows.every(r=>r.status==='confirmed'));for(const e of expected){const r=rows.find(r=>r.id===e.id);assert.equal(r.player_id,e.playerId);assert.equal(r.event_id,e.eventId);assert.equal(r.created,e.created);}
assert.equal((await db.prepare('SELECT COUNT(*) n FROM legacy_migration').first()).n,18);assert.equal((await db.prepare('SELECT COUNT(*) n FROM audit').first()).n,14);assert.equal((await db.prepare('SELECT COUNT(*) n FROM events WHERE open=1').first()).n,0);
fs.writeFileSync(output,text);fs.writeFileSync(output+'.verification.json',JSON.stringify({entries:14,dispositions:18,excluded:4,duplicateSourcesPreserved:1,replayPassed:true,expected,sqlSha256:sha(text)},null,2));console.log(JSON.stringify({entries:14,excluded:4,replayPassed:true,privateOutput:output}));db.close();
