import {env} from 'cloudflare:workers';
import {getChatGPTUser} from '@/app/chatgpt-auth';
export async function adminUser(){const user=await getChatGPTUser();const allowed=(env.ADMIN_USER_IDS||'').split(',').map(x=>x.trim()).filter(Boolean);return user&&allowed.includes(user.userId)?user:null}
export function sameOrigin(request:Request){return request.headers.get('origin')===new URL(request.url).origin}
