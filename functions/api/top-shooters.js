import {catalog,register,receipt,cancel,digest,InputError} from '../../signup/service.js';
export const json=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'}});
export async function readBody(request){
 if(!request.headers.get('Content-Type')?.startsWith('application/json'))throw new InputError(415,'JSON required.');
 if(!request.body)throw new InputError(400,'Request body required.');
 const reader=request.body.getReader();let size=0,text='';const decoder=new TextDecoder();
 for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>8192){await reader.cancel();throw new InputError(413,'Request too large.');}text+=decoder.decode(value,{stream:true});}
 try{const data=JSON.parse(text+decoder.decode());if(!data||typeof data!=='object'||Array.isArray(data))throw Error();return data;}catch{throw new InputError(400,'Invalid request.');}
}
export async function onRequest({request,env}){
 try{
  if(!env.TOP_SHOOTERS_DB)throw new InputError(503,'Registration setup is not complete. Please use the current signup form.');
  if(request.method==='GET')return json(await catalog(env.TOP_SHOOTERS_DB));
  if(request.method!=='POST')return json({error:'Method not allowed.'},405);
  if(request.headers.get('Origin')!==new URL(request.url).origin)throw new InputError(403,'Submit from the league website.');
  const data=await readBody(request);
  if(env.TOP_SHOOTERS_ENABLED!=='1')throw new InputError(503,'Registration is not open on this preview.');
  if(!env.TOP_SHOOTERS_RATE_SALT)throw new InputError(503,'Registration is temporarily unavailable.');
  const bucket=Math.floor(Date.now()/600000),key=bucket+':'+await digest(env.TOP_SHOOTERS_RATE_SALT+':'+(request.headers.get('CF-Connecting-IP')||'unknown'));
  const rate=await env.TOP_SHOOTERS_DB.prepare('INSERT INTO rate_limits(key,count) VALUES(?,1) ON CONFLICT(key) DO UPDATE SET count=count+1 RETURNING count').bind(key).first();
  if(rate.count>30)throw new InputError(429,'Too many attempts. Please try again in ten minutes.');
  await env.TOP_SHOOTERS_DB.prepare('DELETE FROM rate_limits WHERE CAST(substr(key,1,instr(key,\':\')-1) AS INTEGER) < ?').bind(bucket-1).run();
  if(data.action==='register')return json(await register(env.TOP_SHOOTERS_DB,data));
  if(data.action==='receipt')return json(await receipt(env.TOP_SHOOTERS_DB,data));
  if(data.action==='cancel')return json(await cancel(env.TOP_SHOOTERS_DB,data));
  throw new InputError(400,'Unknown action.');
 }catch(e){return json({error:e instanceof InputError?e.message:'Unable to save right now. Your details remain on screen; retry safely.'},e.status||503);}
}
