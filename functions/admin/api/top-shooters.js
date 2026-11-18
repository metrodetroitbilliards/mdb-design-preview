import {ownerList,ownerUpdate,catalog,InputError} from '../../../signup/service.js';
import {readBody,json} from '../../api/top-shooters.js';
export async function onRequest({request,env,data}){
 try{
  if(!data?.editor)throw new InputError(401,'Owner sign-in required.');
  if(!env.TOP_SHOOTERS_DB)throw new InputError(503,'Registration database is not configured.');
  if(request.method==='GET')return json({entries:await ownerList(env.TOP_SHOOTERS_DB),events:(await catalog(env.TOP_SHOOTERS_DB)).events});
  if(request.method==='POST'){
   const body=await readBody(request);
   if(body.action==='event'){
    if(typeof body.eventId!=='string'||!Number.isInteger(body.capacity)||body.capacity<1||body.capacity>24||![0,1].includes(body.open))throw new InputError(400,'Enter a capacity from 1 to 24 and an open/closed state.');
    const result=await env.TOP_SHOOTERS_DB.batch([env.TOP_SHOOTERS_DB.prepare("UPDATE events SET capacity=?,open=? WHERE id=? AND ? >= (SELECT COUNT(*) FROM entries WHERE event_id=events.id AND status='confirmed')").bind(body.capacity,body.open,body.eventId,body.capacity),env.TOP_SHOOTERS_DB.prepare('INSERT INTO audit(actor,entry_id,action,created) SELECT ?,?,?,? WHERE changes()>0').bind(data.editor,body.eventId,JSON.stringify(body),new Date().toISOString())]);
    if(!result[0].meta.changes)throw new InputError(409,'Event not found, or capacity is below the number already confirmed.');return json({ok:true});
   }
   return json(await ownerUpdate(env.TOP_SHOOTERS_DB,body,data.editor));
  }
  return json({error:'Method not allowed.'},405);
 }catch(e){return json({error:e instanceof InputError?e.message:'Unable to update entry.'},e.status||503);}
}
