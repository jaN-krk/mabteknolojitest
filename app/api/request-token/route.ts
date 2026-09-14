import {env} from 'cloudflare:workers';
import {createToken} from '@/lib/form-security';
export async function GET(){if(!env.FORM_SECRET)return Response.json({error:'unconfigured'},{status:503});return Response.json({token:await createToken(env.FORM_SECRET)},{headers:{'Cache-Control':'no-store'}})}
