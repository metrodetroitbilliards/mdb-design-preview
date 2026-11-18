import fs from 'node:fs';import crypto from 'node:crypto';
const input=process.argv[2];if(!input)throw Error('Supply owner-corrected roster JSON');
const groups=JSON.parse(fs.readFileSync(input,'utf8')).groups;const players=new Map();
for(const group of groups)for(const d of group.divisions)for(const name of d.players){const id='p-'+crypto.createHash('sha256').update(name).digest('hex').slice(0,20);const p=players.get(id)||{id,name,divisions:[],disciplines:[]};p.divisions.push(d.division);if(!p.disciplines.includes(group.discipline))p.disciplines.push(group.discipline);players.set(id,p);}
const quote=v=>"'"+String(v).replaceAll("'","''")+"'";
const sql=[...players.values()].map(p=>'INSERT INTO players(id,name,divisions,disciplines) VALUES('+[p.id,p.name,JSON.stringify(p.divisions),JSON.stringify(p.disciplines)].map(quote).join(',')+');');
for(const [discipline,day] of [['8-Ball','2026-11-21'],['9-Ball','2026-12-05'],['10-Ball','2026-12-12'],['9-Ball','2026-12-19'],['8-Ball','2027-01-09']])sql.push('INSERT INTO events(id,discipline,label,starts,fee,capacity,open) VALUES('+[discipline.toLowerCase()+'-'+day,discipline,discipline+' Top Shooter',day+'T14:30:00-05:00'].map(quote).join(',')+',20,NULL,0);');
fs.writeFileSync(new URL('../signup/seed.sql',import.meta.url),sql.join('\n')+'\n');console.log(JSON.stringify({players:players.size,entries:groups.reduce((n,g)=>n+g.divisions.reduce((n,d)=>n+d.players.length,0),0),events:5}));
