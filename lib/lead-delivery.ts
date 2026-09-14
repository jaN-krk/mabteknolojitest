import {env} from '@/lib/runtime-env';
/** A failed notification never discards an accepted enquiry. */
export async function notifySubmission(id:string){
 if(!env.DB||!env.MAIL_API_KEY||!env.MAIL_FROM||!env.MAIL_TO)return 'unconfigured';
 const now=Date.now(),claim=crypto.randomUUID();
 const row=await env.DB.prepare("UPDATE submissions SET status='notifying',claim_id=?,lease_until=? WHERE id=? AND (status IN ('received','failed') OR (status='notifying' AND lease_until<?)) RETURNING payload,filename,attachment").bind(claim,now+120000,id,now).first<{payload:string;filename:string|null;attachment:string|null}>();
 if(!row)return 'busy';
 let delivered=false;
 try{
  const payload=JSON.parse(row.payload);const provider=env.MAIL_DELIVERY_URL||'https://api.resend.com/emails';const url=new URL(provider);
  if(url.protocol!=='https:'&&!(process.env.NODE_ENV==='development'&&['localhost','127.0.0.1'].includes(url.hostname)))throw Error('HTTPS required');
  const text=Object.entries(payload).map(([k,v])=>`${k}: ${v}`).join('\n')+(row.attachment?`\nAttachment: ${row.filename}\nView in the protected MAB content manager.`:'');
  const response=await fetch(provider,{method:'POST',headers:{Authorization:`Bearer ${env.MAIL_API_KEY}`,'Content-Type':'application/json','Idempotency-Key':id},body:JSON.stringify({from:env.MAIL_FROM,to:[env.MAIL_TO],reply_to:payload.email,subject:`MAB ${payload.kind} — ${payload.name}`,text}),signal:AbortSignal.timeout(15000)});delivered=response.ok;
 }catch{delivered=false}
 await env.DB.prepare('UPDATE submissions SET status=?,lease_until=0 WHERE id=? AND claim_id=?').bind(delivered?'delivered':'failed',id,claim).run();
 return delivered?'delivered':'failed';
}
