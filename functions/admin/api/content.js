import {github} from '../../../editor-lib/github.js';
import {parseContent,validateContent,contentScript,validateImages} from '../../../editor-lib/content.js';
import {renderPage} from '../../../editor-lib/site-renderer.js';
import {json,HttpError} from '../../../editor-lib/security.js';
export async function onRequest(context){
 try{
  const git=github(context.env);
  if(context.request.method==='GET'){
   const revision=await git.head();const content=parseContent(await git.read('launch-preview/content.js',revision));
   return json({revision,content,email:context.data.editor});
  }
  if(context.request.method!=='POST')throw new HttpError(405,'Method not allowed.');
  const text=await context.request.text();if(text.length>8500000)throw new HttpError(413,'Draft is too large.');
  const body=JSON.parse(text);const content=validateContent(body.content);const images=await validateImages(body.images);
  if(!/^[a-f0-9]{40}$/.test(body.revision||''))throw new HttpError(400,'Missing revision; reload first.');
  if(body.action!=='preview'&&body.action!=='publish')throw new HttpError(400,'Unknown action.');
  const pages=body.action==='preview'?[body.page]:['index','about','standings','rules','shop','contact'];
  const files=[];
  for(const page of pages){
   if(!['index','about','standings','rules','shop','contact'].includes(page))throw new HttpError(400,'Unknown page.');
   const source=await git.read(`launch-preview/${page}.html`,body.revision);
   const rendered=renderPage(content,page,source);
   files.push({path:`launch-preview/${page}.html`,content:rendered});
  }
  if(body.action==='preview'){
   let html=files[0].content.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'');
   html=html.replace('<head>','<head><base href="'+context.env.EDITOR_ORIGIN+'/">');
   for(const image of images)html=html.split(image.path).join('data:image/'+(image.path.endsWith('.png')?'png':'jpeg')+';base64,'+image.base64);
   return json({html});
  }
  files.push({path:'launch-preview/content.js',content:contentScript(content)});
  for(const image of images)files.push({path:'launch-preview/'+image.path,content:image.base64,encoding:'base64'});
  const result=await git.publish(body.revision,files);
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(contentScript(content)));
  const contentDigest=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
  return json({...result,contentDigest,message:'Saved to version history. Cloudflare deployment is starting; changes are not confirmed live yet.'});
 }catch(error){return json({error:error instanceof HttpError?error.message:'Unable to process this draft. Check the fields and try again.'},error.status||400);}
}
