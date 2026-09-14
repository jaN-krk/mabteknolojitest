import {env} from 'cloudflare:workers';
import {z} from 'zod';
import {adminUser,sameOrigin} from '@/lib/admin';
import {notifySubmission} from '@/lib/lead-delivery';
const reply=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
const update=z.object({id:z.string().uuid(),stage:z.enum(['new','review','survey','quoted','won','lost']),owner:z.string().trim().max(100),note:z.string().max(2000),nextContact:z.string().refine(v=>v===''||(/^\d{4}-\d{2}-\d{2}$/.test(v)&&!Number.isNaN(Date.parse(v)))),version:z.number().int().min(0).max(2147483646)}).strict();
async function readBody(request:Request){const reader=request.body?.getReader();if(!reader)throw Error('body');let size=0;const chunks:Uint8Array[]=[];while(true){const part=await reader.read();if(part.done)break;size+=part.value.length;if(size>16384){await reader.cancel();throw Error('size')}chunks.push(part.value)}const bytes=new Uint8Array(size);let at=0;for(const chunk of chunks){bytes.set(chunk,at);at+=chunk.length}return JSON.parse(new TextDecoder().decode(bytes))}
export async function GET(){if(!await adminUser())return reply({error:'Yetkisiz erişim'},403);if(!env.DB)return reply({error:'Veritabanı bağlı değil'},503);try{
 const leads=await env.DB.prepare("SELECT s.id,s.payload,s.status,s.filename,s.created,COALESCE(f.stage,'new') AS stage,COALESCE(f.owner,'') AS owner,COALESCE(f.note,'') AS note,COALESCE(f.next_contact,'') AS nextContact,COALESCE(f.version,0) AS version FROM submissions s LEFT JOIN lead_followups f ON f.submission_id=s.id WHERE s.status NOT IN ('receiving','upload_failed') ORDER BY s.created DESC LIMIT 100").all();
 const events=await env.DB.prepare('SELECT entity_id AS entityId,action,actor,created FROM admin_events ORDER BY created DESC LIMIT 300').all();
 return reply({leads:leads.results,events:events.results,notificationsConfigured:!!(env.MAIL_API_KEY&&env.MAIL_FROM&&env.MAIL_TO)});
 }catch{return reply({error:'Talepler okunamadı.'},503)}}
export async function PATCH(request:Request){const user=await adminUser();if(!user||!sameOrigin(request))return reply({error:'Yetkisiz erişim'},403);if(!env.DB)return reply({error:'Veritabanı bağlı değil'},503);try{
 const parsed=update.safeParse(await readBody(request));if(!parsed.success)return reply({error:'Takip alanları geçersiz.'},400);const d=parsed.data;
 if(!await env.DB.prepare("SELECT id FROM submissions WHERE id=? AND status NOT IN ('receiving','upload_failed')").bind(d.id).first())return reply({error:'Talep bulunamadı.'},404);
 const now=Date.now();
 // Version in the event key makes the audit insert conditional on this exact update.
 const eventId=crypto.randomUUID();
 const results=await env.DB.batch([
  env.DB.prepare("INSERT INTO lead_followups(submission_id,stage,owner,note,next_contact,updated,version) SELECT ?,?,?,?,?,?,1 WHERE ?=0 OR EXISTS(SELECT 1 FROM lead_followups WHERE submission_id=?) ON CONFLICT(submission_id) DO UPDATE SET stage=excluded.stage,owner=excluded.owner,note=excluded.note,next_contact=excluded.next_contact,updated=excluded.updated,version=lead_followups.version+1 WHERE lead_followups.version=? RETURNING version").bind(d.id,d.stage,d.owner,d.note,d.nextContact,now,d.version,d.id,d.version),
  env.DB.prepare("INSERT INTO admin_events(id,entity_id,action,actor,created) SELECT ?,?,?,?,? WHERE changes()>0").bind(eventId,d.id,`Takip güncellendi: ${d.stage}`,user.userId,now)
 ]);
 if(!results[0].results.length)return reply({error:'Bu talep başka bir oturumda değişti. Güncel kaydı yükleyip tekrar düzenleyin.'},409);
 return reply({ok:true,version:d.version+1});
 }catch{return reply({error:'Takip kaydedilemedi.'},400)}}
export async function POST(request:Request){const user=await adminUser();if(!user||!sameOrigin(request))return reply({error:'Yetkisiz erişim'},403);if(!env.DB)return reply({error:'Veritabanı bağlı değil'},503);try{
 const parsed=z.object({id:z.string().uuid(),action:z.literal('retry-notification')}).strict().safeParse(await readBody(request));if(!parsed.success)return reply({error:'Geçersiz işlem'},400);
 if(!await env.DB.prepare('SELECT id FROM submissions WHERE id=?').bind(parsed.data.id).first())return reply({error:'Talep bulunamadı'},404);
 const status=await notifySubmission(parsed.data.id);
 if(status==='unconfigured')return reply({error:'E-posta bildirim bağlantısı henüz yapılandırılmadı. Talep kayıtlıdır.'},503);
 if(status==='busy')return reply({error:'Bildirim zaten iletildi veya işleniyor.'},409);
 await env.DB.prepare('INSERT INTO admin_events(id,entity_id,action,actor,created) VALUES(?,?,?,?,?)').bind(crypto.randomUUID(),parsed.data.id,'E-posta bildirimi: '+status,user.userId,Date.now()).run();
 return reply({ok:status==='delivered',status,...(status==='failed'?{error:'Bildirim sağlayıcısı kabul etmedi. Talep kayıtlıdır.'}:{})},status==='delivered'?200:502);
 }catch{return reply({error:'Bildirim işlemi tamamlanamadı.'},503)}}
