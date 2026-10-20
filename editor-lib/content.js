import {HttpError} from './security.js';
const specs={site:['name','email','headline','intro','announcement','about','story','joinUrl','bylawsUrl','storeUrl','season','updated','heroImage','aboutImage'],nights:['id','day','venue','game','time','league','sessions','standingsUrl'],events:['title','category','dateLabel','start','end','deadline','note','url'],faqs:['question','answer','url'],products:['name','description','image','url','price'],tools:['title','group','copy','url']};
export function validateContent(input){
 if(!input||input.version!==1||!input.site)throw new HttpError(400,'Unsupported content document.');
 const out={version:1};
 for(const [group,fields] of Object.entries(specs)){
  const records=group==='site'?[input.site]:input[group];
  if(!Array.isArray(records)||records.length>150)throw new HttpError(400,`Invalid ${group} list.`);
  const cleaned=records.map((record)=>{
   if(!record||typeof record!=='object'||Array.isArray(record))throw new HttpError(400,`Invalid ${group} item.`);
   for(const key of Object.keys(record))if(!fields.includes(key))throw new HttpError(400,`Unsupported ${group} field: ${key}`);
   const row={};
   for(const key of fields){
    const value=record[key]??'';
    if(typeof value!=='string'||value.length>12000||/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value))throw new HttpError(400,`Invalid ${key}.`);
    if((/url$/i.test(key))&&value&&!/^(https:\/\/[^\s]+|(?:index|about|rules|contact|standings|shop|register)\.html(?:#[\w-]+)?)$/.test(value))throw new HttpError(400,`${key} must be an HTTPS link or a site page.`);
    if((/image$/i.test(key))&&value&&!/^assets\/[a-zA-Z0-9_-]+\.(png|jpg)$/.test(value))throw new HttpError(400,`${key} must be a PNG/JPG in site assets.`);
    if(['start','end','deadline','updated'].includes(key)&&value&&(!/^\d{4}-\d{2}-\d{2}$/.test(value)||!Number.isFinite(Date.parse(value+'T00:00:00Z'))||new Date(value+'T00:00:00Z').toISOString().slice(0,10)!==value))throw new HttpError(400,`${key} must be a valid date.`);
    row[key]=value;
   }
   return row;
  });out[group]=group==='site'?cleaned[0]:cleaned;
 }
 if(!/^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(out.site.email))throw new HttpError(400,'Enter a valid contact email.');
 if(!out.site.name||!out.site.headline)throw new HttpError(400,'Site name and headline are required.');
 const ids=new Set();for(const n of out.nights){if(!/^[a-z0-9-]+$/.test(n.id)||ids.has(n.id))throw new HttpError(400,'League night IDs must be unique lowercase names.');ids.add(n.id);}
 for(const event of out.events)if(event.start&&event.end&&event.start>event.end)throw new HttpError(400,'An event cannot end before it starts.');
 return out;
}
export function parseContent(text){const m=text.match(/^\s*window\.MDB_CONTENT\s*=\s*([\s\S]*);\s*$/);if(!m)throw new HttpError(502,'Content file format changed; contact support.');return validateContent(JSON.parse(m[1]));}
export function contentScript(data){return 'window.MDB_CONTENT = '+JSON.stringify(data).replace(/</g,'\\u003c')+';\n';}
export async function validateImages(images=[]){
 if(!Array.isArray(images)||images.length>4)throw new HttpError(400,'Upload at most four images per publish.');
 let total=0;const result=[];
 for(const image of images){
  if(typeof image.base64!=='string'||image.base64.length>2800000||!/^assets\/upload-[a-f0-9]{64}\.(png|jpg)$/.test(image.path))throw new HttpError(400,'Invalid image upload.');
  let bytes;try{bytes=Uint8Array.from(atob(image.base64),c=>c.charCodeAt(0));}catch{throw new HttpError(400,'Invalid image encoding.');}
  total+=bytes.length;if(bytes.length>2000000||total>6000000)throw new HttpError(400,'Images exceed upload limit.');
  const png=bytes[0]===137&&bytes[1]===80&&bytes[2]===78&&bytes[3]===71&&bytes[4]===13&&bytes[5]===10&&bytes[6]===26&&bytes[7]===10;
  const jpg=bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
  if(!(image.path.endsWith('.png')?png:jpg))throw new HttpError(400,'Only PNG and JPEG images are accepted.');
  const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');
  if(!image.path.includes(hash))throw new HttpError(400,'Image checksum mismatch.');result.push(image);
 }return result;
}
