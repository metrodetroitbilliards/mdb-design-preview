import {createRemoteJWKSet,jwtVerify} from 'jose';
const keys=new Map();
export class HttpError extends Error {constructor(status,message){super(message);this.status=status;}}
export async function authenticate(request,env,verify=jwtVerify){
 const {ACCESS_TEAM_DOMAIN:team,ACCESS_AUD:aud,EDITOR_EMAIL:email,EDITOR_ORIGIN:origin}=env;
 if(!team||!aud||!email||!origin)throw new HttpError(503,'Editor setup is not complete. Public website is unaffected.');
 if(!/^[a-z0-9-]+\.cloudflareaccess\.com$/.test(team)||new URL(origin).protocol!=='https:')throw new HttpError(503,'Editor configuration is invalid.');
 if(new URL(request.url).origin!==origin)throw new HttpError(403,'Use the configured editor address.');
 const token=request.headers.get('Cf-Access-Jwt-Assertion');
 if(!token)throw new HttpError(401,'Sign in through Cloudflare Access.');
 if(!keys.has(team))keys.set(team,createRemoteJWKSet(new URL(`https://${team}/cdn-cgi/access/certs`)));
 let payload;
 try{({payload}=await verify(token,keys.get(team),{issuer:`https://${team}`,audience:aud,algorithms:['RS256'],requiredClaims:['exp','iat','sub','email']}));}
 catch{throw new HttpError(401,'Sign-in expired or invalid. Sign in again.');}
 if(typeof payload.email!=='string'||payload.email.toLowerCase()!==email.toLowerCase())throw new HttpError(403,'This account is not permitted to edit this site.');
 if(!['GET','HEAD'].includes(request.method)){
  if(request.headers.get('Origin')!==origin||request.headers.get('X-MDB-Editor')!=='1')throw new HttpError(403,'Request origin is not permitted.');
  if(!request.headers.get('Content-Type')?.startsWith('application/json'))throw new HttpError(415,'JSON required.');
 }
 return payload.email;
}
export function privateHeaders(){return {'Cache-Control':'private, no-store','X-Robots-Tag':'noindex, nofollow','X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: blob:; frame-src 'self' blob:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'self'; form-action 'self'"};}
export function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{...privateHeaders(),'Content-Type':'application/json; charset=utf-8'}});}
