import {DatabaseSync} from 'node:sqlite';
export function database(path=':memory:'){
 const db=new DatabaseSync(path);db.exec('PRAGMA foreign_keys=ON');
 const prepare=sql=>{let args=[];return {bind(...values){args=values;return this;},async first(){return db.prepare(sql).get(...args)||null;},async all(){return {results:db.prepare(sql).all(...args)};},async run(){return {meta:db.prepare(sql).run(...args)};},execute(){const stmt=db.prepare(sql);if(stmt.columns().length)return {results:stmt.all(...args),meta:{changes:0}};return {results:[],meta:stmt.run(...args)};}};};
 return {prepare,exec:sql=>db.exec(sql),close:()=>db.close(),async batch(statements){db.exec('BEGIN IMMEDIATE');try{const result=statements.map(s=>s.execute());db.exec('COMMIT');return result;}catch(e){db.exec('ROLLBACK');throw e;}}};
}
