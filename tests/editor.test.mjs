import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs/promises';
import {generateKeyPair,exportJWK,SignJWT,jwtVerify} from 'jose';
import {authenticate} from '../editor-lib/security.js';import {parseContent,validateContent,validateImages} from '../editor-lib/content.js';import {renderPage} from '../editor-lib/site-renderer.js';import {github} from '../editor-lib/github.js';
const content=parseContent(await fs.readFile('launch-preview/content.js','utf8'));
test('all six rendered pages work, preserve safe markup and update fallback text',async()=>{
 const next=structuredClone(content);next.site.announcement='CHANGED announcement <script>alert(1)</script>';
 for(const page of ['index','about','standings','rules','shop','contact']){
  const html=renderPage(next,page,await fs.readFile(`launch-preview/${page}.html`,'utf8'));
  assert(html.includes('<h1'));assert(html.includes('noindex,nofollow'));
  if(page==='index'){assert(html.includes('CHANGED announcement &lt;script&gt;'));assert(!html.includes('<script>alert(1)</script>'));assert(html.includes('Snookers'));}
 }
});
test('validation rejects script URLs, path traversal and duplicate night IDs',()=>{
 for(const mutate of [d=>d.events[0].url='javascript:alert(1)',d=>d.site.heroImage='../secret.png',d=>d.nights[1].id=d.nights[0].id]){const bad=structuredClone(content);mutate(bad);assert.throws(()=>validateContent(bad));}
});
test('uploads reject SVG or disguised executable content',async()=>{await assert.rejects(validateImages([{path:'assets/upload-'+'a'.repeat(64)+'.png',base64:btoa('<svg onload="alert(1)"></svg>')}]));});
test('auth fails closed; verifies signatures, audience, email and same-origin writes',async()=>{
 const env={ACCESS_TEAM_DOMAIN:'example.cloudflareaccess.com',ACCESS_AUD:'expected',EDITOR_EMAIL:'owner@example.com',EDITOR_ORIGIN:'https://example.com'};
 const {privateKey,publicKey}=await generateKeyPair('RS256');
 const verify=(token,keys,options)=>jwtVerify(token,publicKey,options);
 const token=await new SignJWT({email:'owner@example.com'}).setProtectedHeader({alg:'RS256'}).setIssuedAt().setExpirationTime('5m').setSubject('user').setIssuer('https://example.cloudflareaccess.com').setAudience('expected').sign(privateKey);
 const request=(headers={},url='https://example.com/admin/api/content')=>new Request(url,{method:'POST',headers:{'Cf-Access-Jwt-Assertion':token,Origin:'https://example.com','Content-Type':'application/json','X-MDB-Editor':'1',...headers},body:'{}'});
 assert.equal(await authenticate(request(),env,verify),'owner@example.com');
 await assert.rejects(authenticate(request(),{},verify),e=>e.status===503);
 await assert.rejects(authenticate(request({'Cf-Access-Jwt-Assertion':'forged'}),env,verify),e=>e.status===401);
 await assert.rejects(authenticate(request(),{...env,ACCESS_AUD:'other'},verify),e=>e.status===401);
 await assert.rejects(authenticate(request(),{...env,EDITOR_EMAIL:'other@example.com'},verify),e=>e.status===403);
 await assert.rejects(authenticate(request({Origin:'https://attacker.example'}),env,verify),e=>e.status===403);
 await assert.rejects(authenticate(request({},'https://project.pages.dev/admin/api/content'),env,verify),e=>e.status===403);
});
test('GitHub rejects stale revision before uploading and uses non-force atomic commit',async()=>{
 const calls=[];const sha='a'.repeat(40);const transport=async(url,options)=>{calls.push({url,...options});const path=new URL(url).pathname;
  const body=path.includes('/git/ref/')?{object:{sha}}:path.endsWith('/git/commits/'+sha)?{tree:{sha:'tree'}}:{sha:'b'.repeat(40)};return Response.json(body);};
 const git=github({EDITOR_GITHUB_TOKEN:'test-only'},transport);
 await assert.rejects(git.publish('c'.repeat(40),[]),e=>e.status===409);assert.equal(calls.length,1);
 calls.length=0;await git.publish(sha,[{path:'launch-preview/content.js',content:'test'}]);
 const update=calls.find(c=>c.method==='PATCH');assert.equal(JSON.parse(update.body).force,false);assert.equal(calls.filter(c=>c.method==='PATCH').length,1);
});
