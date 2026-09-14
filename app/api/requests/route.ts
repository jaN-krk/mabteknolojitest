import {env} from '@/lib/runtime-env';
import {requestSchema,verifyToken,validFile,hash} from '@/lib/form-security';
import {notifySubmission} from '@/lib/lead-delivery';
const reply=(error:string,status:number)=>Response.json({error},{status,headers:{'Cache-Control':'no-store'}});
const accepted=(id:string)=>Response.json({id,received:true},{headers:{'Cache-Control':'no-store'}});
export async function POST(request:Request){
 if(request.headers.get('origin')!==new URL(request.url).origin)return reply('spam',403);
 if(!env.DB||!env.BUCKET||!env.FORM_SECRET)return reply('unconfigured',503);
 const max=4*1024*1024;if(Number(request.headers.get('content-length')||0)>max)return reply('invalidFile',413);
 let ownedId='',ownedClaim='';
 try{
  const now=Date.now();const ip=process.env.VERCEL?request.headers.get('x-forwarded-for')?.split(',')[0].trim():request.headers.get('cf-connecting-ip');const key=await hash(env.FORM_SECRET+':early:'+(ip||'local')+':'+Math.floor(now/900000));
  const limit=await env.DB.prepare('INSERT INTO rate_limits(key,count,expires) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1 RETURNING count').bind(key,now+900000).first<{count:number}>();
  if((limit?.count||0)>20)return reply('rate',429);
  await env.DB.prepare('DELETE FROM rate_limits WHERE expires < ?').bind(now).run();
  const reader=request.body?.getReader();if(!reader)return reply('validation',400);let size=0;const chunks:Uint8Array[]=[];
  while(true){const r=await reader.read();if(r.done)break;size+=r.value.length;if(size>max){await reader.cancel();return reply('invalidFile',413)}chunks.push(r.value)}
  const body=new Uint8Array(size);let offset=0;for(const chunk of chunks){body.set(chunk,offset);offset+=chunk.length}
  const form=await new Response(body,{headers:{'content-type':request.headers.get('content-type')||''}}).formData();
  const parsed=requestSchema.safeParse(Object.fromEntries(Array.from(form.entries()).filter(([k])=>k!=='file')));if(!parsed.success)return reply('validation',400);
  const data=parsed.data;if(!await verifyToken(env.FORM_SECRET,data.token))return reply('spam',400);
  const file=form.get('file');let bytes:Uint8Array|null=null,filename:string|null=null,type='';
  if(file instanceof File&&file.size){if(file.size>3*1024*1024)return reply('invalidFile',413);bytes=new Uint8Array(await file.arrayBuffer());type=file.type;if(!validFile(bytes,type))return reply('invalidFile',400);filename=file.name.replace(/[\r\n<>]/g,'').slice(0,180)}
  const {token,website,...payload}=data;void token;void website;
  const fileDigest=bytes?Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new Uint8Array(bytes))),v=>v.toString(16).padStart(2,'0')).join(''):'';
  const digest=await hash(JSON.stringify(payload)+'\n'+JSON.stringify([filename,type,fileDigest]));
  const prior=await env.DB.prepare('SELECT status,payload_hash FROM submissions WHERE id=?').bind(data.requestId).first<{status:string;payload_hash:string|null}>();
  if(prior&&prior.payload_hash!==digest)return reply('conflict',409);
  if(prior&&['received','delivered','failed','notifying'].includes(prior.status))return accepted(data.requestId);
  const quotaKey=key+':accepted';const quota=await env.DB.prepare('INSERT INTO rate_limits(key,count,expires) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1 RETURNING count').bind(quotaKey,now+900000).first<{count:number}>();if((quota?.count||0)>5)return reply('rate',429);
  const claim=crypto.randomUUID();const attachment=bytes?`requests/${data.requestId}`:null;
  const row=await env.DB.prepare("INSERT INTO submissions(id,payload,status,attachment,filename,created,payload_hash,claim_id,lease_until) VALUES(?,?,'receiving',?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET status='receiving',claim_id=excluded.claim_id,lease_until=excluded.lease_until WHERE submissions.payload_hash=excluded.payload_hash AND (submissions.status='upload_failed' OR (submissions.status='receiving' AND submissions.lease_until<?)) RETURNING id").bind(data.requestId,JSON.stringify(payload),attachment,filename,now,digest,claim,now+120000,now).first();
  if(!row)return reply('busy',409);ownedId=data.requestId;ownedClaim=claim;
  if(bytes&&attachment)await env.BUCKET.put(attachment,bytes,{httpMetadata:{contentType:type},customMetadata:{filename:filename!}});
  const committed=await env.DB.prepare("UPDATE submissions SET status='received',lease_until=0 WHERE id=? AND claim_id=? RETURNING id").bind(data.requestId,claim).first();
  if(!committed)return reply('busy',409);ownedId='';
  try{await notifySubmission(data.requestId)}catch{console.error('Notification pending; enquiry retained')}
  return accepted(data.requestId);
 }catch(e){
  if(ownedId)try{await env.DB.prepare("UPDATE submissions SET status='upload_failed',lease_until=0 WHERE id=? AND claim_id=? AND status='receiving'").bind(ownedId,ownedClaim).run()}catch{}
  console.error('Request processing failed',e instanceof Error?e.message:'unknown');return reply('error',503);
 }
}
