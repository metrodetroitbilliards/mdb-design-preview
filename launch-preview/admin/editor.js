'use strict';
const $=s=>document.querySelector(s);
const schema={site:['Website basics',['name','email','headline','intro','announcement','about','story','joinUrl','bylawsUrl','storeUrl','season','updated','heroImage','aboutImage']],nights:['League nights',['id','day','venue','game','time','league','sessions','standingsUrl']],events:['Events',['title','category','dateLabel','start','end','deadline','note','url']],faqs:['Questions & answers',['question','answer','url']],tools:['Player tools',['title','group','copy','url']]};
const labels={name:'Name',email:'Contact email',headline:'Homepage headline (one line per row)',intro:'Homepage introduction',announcement:'Announcement',about:'About introduction',story:'Our story',joinUrl:'Join link (optional)',bylawsUrl:'Original bylaws document link',storeUrl:'Store link (optional)',season:'Season label',updated:'Content updated date',heroImage:'Homepage image',aboutImage:'About image',id:'Unique identifier (lowercase and hyphens)',day:'Day',venue:'Venue',game:'Game format',time:'Start time',league:'League program',sessions:'Session dates',standingsUrl:'Official standings link',title:'Title',category:'Category',dateLabel:'Date display',start:'Start date',end:'End date',deadline:'Registration deadline',note:'Details',url:'Link',question:'Question',answer:'Answer',group:'Group',copy:'Description'};
let content,revision,images=[],section='site',reviewed='',dirty=false,busy=false;
const status=text=>$('#status').textContent=text;
const snapshot=()=>JSON.stringify({content,images});
function changed(){dirty=true;reviewed='';$('#publish').disabled=true;$('#publish-help').textContent='Preview your latest changes to enable publishing.';}
function button(label,action){const b=document.createElement('button');b.type='button';b.textContent=label;b.onclick=action;return b;}
function form(){
 $('#section-title').textContent=schema[section][0];$('#section-help').textContent=section==='site'?'Edit the words and images visitors see. This editor keeps your existing design.':section==='nights'?'Keep IDs unique. Changes to league nights do not alter FargoRate records.':section==='faqs'?'These are website FAQs, not the embedded full bylaws document.':'Add, edit or reorder items. Use full https:// links or a local page such as register.html.';
 $('#fields').replaceChildren();$('#add').hidden=section==='site';
 const rows=section==='site'?[content.site]:content[section];
 rows.forEach((row,index)=>{
  const fieldset=document.createElement('fieldset');const legend=document.createElement('legend');legend.textContent=section==='site'?'Website details':`${index+1}. ${row.title||row.question||row.venue||'New item'}`;fieldset.append(legend);
  for(const key of schema[section][1]){
   const label=document.createElement('label');label.textContent=labels[key]||key;
   let input;
   const options=key==='day'?['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']:key==='league'?['Unconfirmed','USA Pool League','BCA Pool League']:null;
   if(options){input=document.createElement('select');for(const value of options){const option=document.createElement('option');option.value=value;option.textContent=value;input.append(option);}}
   else input=document.createElement(['headline','intro','about','story','sessions','note','answer','copy'].includes(key)?'textarea':'input');
   input.value=row[key]||'';input.name=`${section}-${index}-${key}`;if(input.tagName==='INPUT')input.type=['start','end','deadline','updated'].includes(key)?'date':key==='email'?'email':'text';
   input.oninput=()=>{row[key]=input.value;changed();};label.append(input);fieldset.append(label);
   if(/Image$/.test(key)){
    const upload=document.createElement('input');upload.type='file';upload.accept='image/png,image/jpeg';upload.setAttribute('aria-label',`Upload ${labels[key]}`);
    upload.onchange=async()=>{try{
     const file=upload.files[0];if(!file)return;if(file.size>2000000||!['image/png','image/jpeg'].includes(file.type))throw Error('Choose a PNG or JPEG under 2 MB.');
     const bytes=new Uint8Array(await file.arrayBuffer());const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');
     const path=`assets/upload-${hash}.${file.type==='image/png'?'png':'jpg'}`;let binary='';for(const b of bytes)binary+=String.fromCharCode(b);
     if(!images.some(x=>x.path===path))images.push({path,base64:btoa(binary)});row[key]=path;input.value=path;changed();status('Image added to draft. It will upload only when you publish.');
    }catch(error){status(error.message);}};fieldset.append(upload);
   }
  }
  if(section!=='site'){
   fieldset.append(button('Move up',()=>{if(index>0){[rows[index-1],rows[index]]=[rows[index],rows[index-1]];changed();form();}}),button('Move down',()=>{if(index<rows.length-1){[rows[index+1],rows[index]]=[rows[index],rows[index+1]];changed();form();}}),button('Remove',()=>{if(confirm('Remove this item from the draft? It will not disappear publicly until you publish.')){rows.splice(index,1);changed();form();}}));
  }
  $('#fields').append(fieldset);
 });
}
async function api(body){const response=await fetch('/admin/api/content',{method:body?'POST':'GET',headers:body?{'Content-Type':'application/json','X-MDB-Editor':'1'}:{},...(body?{body:JSON.stringify(body)}:{})});let result;try{result=await response.json();}catch{throw Error('Sign-in may have expired. Save your device draft, then reload and sign in.');}if(!response.ok)throw Error(result.error||'Request failed.');return result;}
async function operation(work){if(busy)return;busy=true;$('#workspace').inert=true;try{await work();}catch(error){status(error.message);}finally{busy=false;$('#workspace').inert=false;}}
$('#fields').onsubmit=e=>e.preventDefault();
$('#add').onclick=()=>{content[section].push(Object.fromEntries(schema[section][1].map(k=>[k,''])));changed();form();};
$('#save').onclick=()=>{try{localStorage.setItem('mdb-private-draft',JSON.stringify({revision,content,images,savedAt:new Date().toISOString()}));status('Draft saved on this device only. Nothing published.');}catch{status('Device storage is full or unavailable. Download a draft backup instead.');}};
$('#restore').onclick=()=>{try{const saved=JSON.parse(localStorage.getItem('mdb-private-draft'));if(!saved)throw Error('No draft saved on this device.');if(saved.revision!==revision)throw Error('That draft belongs to an older website version. It was not restored, to avoid overwriting newer changes. Download the backup and ask for help merging it.');content=saved.content;images=saved.images||[];changed();form();status('Device draft restored. Preview before publishing.');}catch(error){status(error.message);}};
$('#export').onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify({revision,content,images},null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='mdb-website-draft.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
$('#preview').onclick=()=>operation(async()=>{status('Preparing private preview…');const result=await api({action:'preview',page:$('#preview-page').value,revision,content,images});$('#preview-frame').srcdoc=result.html;$('#preview-frame').hidden=false;reviewed=snapshot();$('#publish').disabled=false;$('#publish-help').textContent='Preview ready. Publish applies all draft sections, not only the preview page.';status('Private preview ready. Nothing published.');});
$('#publish').onclick=()=>operation(async()=>{
 if(reviewed!==snapshot())throw Error('Preview your latest changes first.');
 if(!confirm('Publish these changes to your website? Cloudflare will deploy the saved version.'))return;
 status('Saving reviewed changes to version history…');const result=await api({action:'publish',revision,content,images});revision=result.revision;images=[];dirty=false;reviewed='';$('#publish').disabled=true;
 try{localStorage.removeItem('mdb-private-draft');}catch{}
 status(result.message+' Revision '+revision.slice(0,7)+'.');$('#publish-help').textContent='Open the live website after deployment to confirm your changes.';
 const expected=result.contentDigest;
 (async()=>{for(let attempt=0;attempt<24;attempt++){
  await new Promise(resolve=>setTimeout(resolve,5000));
  try{const response=await fetch('/content.js?editor-check='+Date.now(),{cache:'no-store'});if(!response.ok)continue;
   const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await response.arrayBuffer())),b=>b.toString(16).padStart(2,'0')).join('');
   if(hash===expected){if(!dirty)status('Published and verified live. Revision '+result.revision.slice(0,7)+'.');return;}
  }catch{}
 }if(!dirty)status('Saved to version history, but deployment is not verified live yet. Check Cloudflare deployments before publishing again.');})();
});
window.addEventListener('beforeunload',event=>{if(dirty){event.preventDefault();event.returnValue='';}});
operation(async()=>{
 const result=await api();content=result.content;revision=result.revision;$('#identity').textContent='Signed in as '+result.email;
 for(const [key,[label]] of Object.entries(schema)){const b=button(label,()=>{section=key;$('#sections').querySelectorAll('button').forEach(x=>x.setAttribute('aria-current',String(x===b)));form();});b.setAttribute('aria-current',String(key===section));$('#sections').append(b);}
 $('#workspace').hidden=false;form();status('Current website loaded. Changes stay private until you publish.');
});
