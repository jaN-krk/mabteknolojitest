import {createRemoteDatabase,createRemoteBucket} from './remote-storage';

// Server environment for standard Next.js / Vercel. The legacy Worker build
// aliases this module to runtime-env.cloudflare.ts for native bindings.
export const platform='node' as string;
export const env:Cloudflare.Env={
 get DB(){return createRemoteDatabase(process.env)},
 get BUCKET(){return createRemoteBucket(process.env)},
 get FORM_SECRET(){return process.env.FORM_SECRET},
 get ADMIN_USER_IDS(){return process.env.ADMIN_USER_IDS},
 get MAIL_API_KEY(){return process.env.MAIL_API_KEY},
 get MAIL_FROM(){return process.env.MAIL_FROM},
 get MAIL_TO(){return process.env.MAIL_TO},
 get MAIL_DELIVERY_URL(){return process.env.MAIL_DELIVERY_URL},
};
