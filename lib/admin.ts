import {env,platform} from '@/lib/runtime-env';
import {headers} from 'next/headers';
import {validAdminCredentials} from './admin-credentials';
import {getChatGPTUser} from '@/app/chatgpt-auth';
export async function adminUser(){
 if(platform==='node'){const h=await headers();return validAdminCredentials(h.get('authorization'))?{userId:process.env.ADMIN_USERNAME!,email:process.env.ADMIN_USERNAME!,displayName:process.env.ADMIN_USERNAME!,fullName:null}:null}
 const user=await getChatGPTUser();const allowed=(env.ADMIN_USER_IDS||'').split(',').map(x=>x.trim()).filter(Boolean);return user&&allowed.includes(user.userId)?user:null
}
export function sameOrigin(request:Request){return request.headers.get('origin')===new URL(request.url).origin}
