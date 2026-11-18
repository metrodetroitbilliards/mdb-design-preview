import fs from 'node:fs';import {database} from '../signup/local-db.js';
const path=process.argv[2];if(!path)throw Error('Provide private Forms response backup path.');
const raw=JSON.parse(fs.readFileSync(path,'utf8').replace(/^\uFEFF/,''));if(raw.nextPageToken)throw Error('More pages exist; backup incomplete.');const db=database();db.exec(fs.readFileSync(new URL('../signup/schema.sql',import.meta.url),'utf8'));db.exec(fs.readFileSync(new URL('../signup/seed.sql',import.meta.url),'utf8'));
const players=(await db.prepare('SELECT id,name FROM players').all()).results;
const normalize=s=>s.toLowerCase().replace(/[^a-z0-9]/g,'');const names=new Map();for(const p of players){names.set(normalize(p.name),p.id);const [last,...first]=p.name.split(',');names.set(normalize(first.join(',')+' '+last),p.id);}
let matched=0,unmatched=0,eventSelections=0;const seen=new Set();let duplicateSelections=0;
for(const response of raw.responses||[]){const answers=response.answers||{},name=answers['5e2df739']?.textAnswers?.answers?.[0]?.value||'',player=names.get(normalize(name));player?matched++:unmatched++;for(const event of answers['7712c26e']?.textAnswers?.answers||[]){eventSelections++;const key=(player||normalize(name))+'|'+event.value;if(seen.has(key))duplicateSelections++;seen.add(key);}}
console.log(JSON.stringify({responses:raw.responses.length,matchedByName:matched,needsOwnerIdentityReview:unmatched,eventSelections,duplicateSelections,action:'Dry-run only. No registrations imported, deleted or changed.'},null,2));db.close();
