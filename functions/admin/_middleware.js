import {authenticate,privateHeaders,json,HttpError} from '../../editor-lib/security.js';
export async function onRequest(context){
 try{
  context.data.editor=await authenticate(context.request,context.env);
  const response=await context.next();const headers=new Headers(response.headers);
  for(const [key,value] of Object.entries(privateHeaders()))headers.set(key,value);
  return new Response(response.body,{status:response.status,headers});
 }catch(error){return json({error:error instanceof HttpError?error.message:'Editor request failed.'},error.status||500);}
}
