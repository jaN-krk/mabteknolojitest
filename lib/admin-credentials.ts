import {createHash,timingSafeEqual} from 'node:crypto';
/** No trust in caller-supplied identity headers on public Node deployments. */
export function validAdminCredentials(authorization:string|null,username=process.env.ADMIN_USERNAME,password=process.env.ADMIN_PASSWORD){
 if(!username||!password||password.length<24||!authorization?.startsWith('Basic ')||authorization.length>2048)return false;
 try{const supplied=Buffer.from(authorization.slice(6),'base64').toString('utf8');const digest=(v:string)=>createHash('sha256').update(v).digest();return timingSafeEqual(digest(supplied),digest(`${username}:${password}`))}catch{return false}
}
