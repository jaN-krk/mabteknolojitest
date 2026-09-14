/* eslint-disable @next/next/no-html-link-for-pages -- Locale changes require a full document to set html lang/dir. */
import {adminUser} from '@/lib/admin';
import {getChatGPTUser,chatGPTSignInPath,chatGPTSignOutPath} from '@/app/chatgpt-auth';
import {AdminEditor} from '@/components/admin-editor';
export const dynamic='force-dynamic';
export const metadata={title:'İçerik Yönetimi — MAB Teknoloji',robots:{index:false,follow:false}};
export default async function Admin(){const user=await adminUser();if(!user){const signedIn=await getChatGPTUser();return <main className="container not-found"><h1>MAB İçerik Yönetimi</h1><p>{signedIn?'Bu hesap için yönetim yetkisi tanımlanmamış. Yetkili kullanıcı kimliği sunucudaki ADMIN_USER_IDS listesine eklenmelidir.':'İçerik yönetimine erişmek için yetkili hesabınızla giriş yapın.'}</p>{!signedIn&&<a className="button yellow" target="_top" href={chatGPTSignInPath('/admin')}>ChatGPT ile giriş yap</a>}<p style={{marginTop:20}}><a href="/tr">Siteye dön</a></p></main>}return <main className="container admin-page"><div className="admin-heading"><div><span className="eyebrow">MAB TEKNOLOJİ</span><h1>İçerik yönetimi</h1></div><div><p>{user.email}</p><a className="text-link" target="_top" href={chatGPTSignOutPath('/admin')}>Çıkış yap</a></div></div><AdminEditor/></main>}
