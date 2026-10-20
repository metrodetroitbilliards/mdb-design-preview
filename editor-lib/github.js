import {HttpError} from './security.js';
const REPO='metrodetroitbilliards/mdb-design-preview';
export function github(env,transport=fetch){
 if(!env.EDITOR_GITHUB_TOKEN)throw new HttpError(503,'Publishing connection is not configured.');
 const branch=env.EDITOR_BRANCH||'main';
 if(!/^[a-zA-Z0-9/_-]+$/.test(branch))throw new HttpError(503,'Invalid publishing branch.');
 async function api(path,method='GET',body){
  const response=await transport(`https://api.github.com/repos/${REPO}${path}`,{method,headers:{Authorization:`Bearer ${env.EDITOR_GITHUB_TOKEN}`,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','User-Agent':'MDB-private-editor','Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
  if(!response.ok)throw new HttpError(response.status===422||response.status===409?409:502,response.status===422||response.status===409?'The website changed since you opened the editor. Reload before publishing.':'Publishing service failed. Your draft has not been discarded.');
  return response.json();
 }
 const head=async()=>{const ref=await api(`/git/ref/heads/${branch}`);return ref.object.sha;};
 const read=async(path,revision)=>{
  if(!/^[a-f0-9]{40}$/.test(revision))throw new HttpError(400,'Invalid revision.');
  const file=await api(`/contents/${path}?ref=${revision}`);
  if(file.encoding!=='base64')throw new HttpError(502,'Unexpected content encoding.');
  return new TextDecoder().decode(Uint8Array.from(atob(file.content.replace(/\s/g,'')),c=>c.charCodeAt(0)));
 };
 async function publish(revision,files){
  if(await head()!==revision)throw new HttpError(409,'Another update was published. Save your draft, then reload and review it.');
  const parent=await api(`/git/commits/${revision}`);const entries=[];
  for(const file of files){
   const blob=await api('/git/blobs','POST',{content:file.content,encoding:file.encoding||'utf-8'});
   entries.push({path:file.path,mode:'100644',type:'blob',sha:blob.sha});
  }
  const tree=await api('/git/trees','POST',{base_tree:parent.tree.sha,tree:entries});
  const commit=await api('/git/commits','POST',{message:'Update website through private owner editor',tree:tree.sha,parents:[revision]});
  // Never force: GitHub rejects a concurrent update rather than overwriting it.
  await api(`/git/refs/heads/${branch}`,'PATCH',{sha:commit.sha,force:false});
  return {revision:commit.sha,commitUrl:`https://github.com/${REPO}/commit/${commit.sha}`};
 }
 return {head,read,publish};
}
