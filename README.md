# MAB Teknoloji

Son revizyon: [Edition 03 teslimi](reports/revision-v3/DELIVERY.md). Uzmanlık kartları, tam ekran açılış/dil geçiş loader’ı, scroll blur, ilk ziyarette açık tema, yeni iletişim/blog düzenleri, kompakt footer ve sektörel ihtiyaç girişleri.

14 Eylül 2026 tasarım güncellemesi: [güncel teslim raporu](reports/redesign/DELIVERY.md). Açık/koyu tema, mega menü, arama, marka açılışı, sayfa geçiş göstergesi ve görsel kapaklı yeni blog düzeni eklendi. Kullanıcı onayıyla 24 blog sürümü yayın durumundadır; yalnızca 12 hukuki taslak noindex kalır. Canlı dağıtım yapılmadı.

TR, EN, AR ve RU kurumsal mühendislik sitesi. Kaynaktan 52 özgün dil/sayfa kaydı aktarıldı; yeni sayfalar ve taslaklarla toplam 100 kayıt. Canlı dağıtım yapılmamıştır.

## Önizleme

- Geliştirme: http://localhost:5173/tr
- Derlenmiş Worker: http://127.0.0.1:4173/tr
- Yönetim: http://localhost:5173/admin

Adresler yalnızca sunucular bu bilgisayarda çalışırken kullanılabilir; paylaşılabilir canlı adres değildir.

## Kurulum

Node.js 22.13+ gerekir. Teslim Windows/Node 24.19 ile doğrulandı. PowerShell'de npm yerine npm.cmd kullanılabilir.

```sh
npm ci
npm run build
```

İlk veritabanını **yalnızca boş yerel D1 üzerinde bir kez** oluşturun:

```sh
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_brave_wendigo.sql
```

Bu çalışma alanında migrasyon zaten uygulandı; tekrar çalıştırmayın. Yeni şemalarda `npm run db:generate` kullanıp yalnızca bekleyen migrasyonları uygulayın.

`.env.example` dosyasını `.env` olarak kopyalayın. FORM_SECRET için güçlü bir anahtar üretin:

```sh
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
npm run dev
```

Derlenmiş önizleme ayrı terminalde:

```sh
npm run start -- --port 4173
```

Windows'ta yeniden build öncesi **derlenmiş önizlemeyi** Ctrl+C ile durdurun; Wrangler dist klasörünü kilitleyebilir. Build sonrası tekrar başlatın. Dev sunucusu HMR kullanır.

## Mimari

Başlangıç reposu boştu. SSR, dört dil ve kalıcı CMS/form gereksinimleri için React 19, Next App Router API'leri, Vinext ve Cloudflare Worker seçildi. Sites starter'ının portable profili kullanıldı. D1 içerik/talepleri, özel R2 alanı ekleri saklar. `hosting.config.json`, DB ve BUCKET bağlayıcılarını tanımlar.

- `content/source.json`: mevcut içerik, teknik tablolar ve proje galerileri.
- `content/blog.json`: altı yazının dört dildeki 24 onaylı teknik yazısı.
- `content/media.json`: görsel kaynakları, boyutları ve responsive türevleri.
- `content/routes.json`: merkezi URL/dil eşlemeleri; dev/build öncesi otomatik üretilir.
- `lib/i18n.ts`: gezinme, formlar, hata metinleri, ihtiyaç akışı ve alt metinler.
- `lib/legal.ts`: dört dilde veri süreçlerine göre hukuki taslaklar.
- `app/[lang]/[[...slug]]/page.tsx`: SSR sayfalar ve metadata.
- `app/api/requests/route.ts`: doğrulama, spam kontrolü ve teslimat adaptörü.
- `app/api/admin/`: izin listeli içerik yönetimi ve özel ekler.
- `db/`, `drizzle/`: kalıcı model ve migrasyonlar.
- `source-archive/`: orijinal HTML, metin, metadata ve görseller.
- `reports/`: envanter, testler ve ekran görüntüleri.

Kaynak arşivi public klasöründe değildir ve istemci paketine taşınmaz. İçindeki materyal veri olarak ele alınır, yönerge olarak çalıştırılmaz.

## İçerik yönetimi

`/admin`, Sign in with ChatGPT kimliği ve `ADMIN_USER_IDS` izin listesiyle korunur. Her API isteğinde yetki kontrol edilir. Portable geliştirme profili `/signin-with-chatgpt?return_to=/admin` adresinden `local_seedy` test kimliğini simüle eder. Yerel deneme için `.env` içine `ADMIN_USER_IDS=local_seedy` yazılır. Bu simülasyon üretim derlemesinde yoktur; canlıda gerçek, siteye özgü kullanıcı kimliği gerekir.

Editör yapılandırılmış JSON kullanır; sürükle-bırak CMS değildir. Sayfa/dil seçin, alanları değiştirin ve **Taslağı kaydet** seçin. Bu, ziyaretçinin gördüğü sürümü değiştirmez. **Taslağı önizle**, yalnızca yetkililere açık `?preview=1` görünümünü açar. **İçeriği yayınla**, o ortamın D1 kaydını günceller. **Taslak durumuna al**, içeriği önizlenebilir noindex durumuna geçirir ve XML sitemap'ten çıkarır; gizlemez/silmez.

Başlık, açıklama, SEO başlığı, metin blokları, tablolar, galeri sırası/alt metinleri, metadata, kaynaklar ve ilişkiler düzenlenebilir. Galeri key değerleri yerel görsel envanteriyle sınırlıdır. Yeni medya yükleme ve yeni URL oluşturma editörde yoktur; dosya/model eklenip yeniden derlenir. Eski adresleri korumak için URL, kimlik ve dil ilişkileri sabittir. Ortak arayüz çevirileri `lib/i18n.ts` üzerinden düzenlenir.

Teknik/hukuki yayın için inceleme kutusu zorunludur; gerçek uzman incelemesinin yerine geçmez. Yazar veya onaylayan kişi uydurulmaz. İçerik yayınlama mevcut ortamda hemen etkilidir ve kod dağıtımıyla aynı işlem değildir.

## Form teslimatı

Form kaydı için DB, BUCKET ve güçlü FORM_SECRET gerekir. Talep önce D1'e kalıcı olarak kaydedilir; ek dosya özel R2 alanındadır. E-posta bağlantısı olmadan da talep yönetim panelinde görünür. MAIL_API_KEY, doğrulanmış MAIL_FROM ve yetkili MAIL_TO yapılandırılmışsa Resend uyumlu sağlayıcıya ayrıca bildirim gönderilir. Bildirim hatası talep kaydını silmez; yetkili panelden yeniden denenebilir. Sunucu form kaydı hiç yapılandırılmamışsa e-posta taslağı akışı kullanılır. Anahtarlar istemciye aktarılmaz.

Teklif ve keşif sayfaları dört adımlı teknik ön bilgi, kapsam matrisi ve PDF yazdırma özeti içerir. Yönetim panelinde talep aşaması, sorumlu, sonraki görüşme tarihi ve iç not tutulur. Güncel uygulama ve test notları: [Talep akışı teslimi](reports/lead-workflow/DELIVERY.md). İlk şema zaten mevcutsa yalnızca `drizzle/0001_majestic_roland_deschain.sql` migrasyonu uygulanmalıdır. `npm run start` kök `.env` dosyasını otomatik okur.

Akış: sunucu doğrulaması → imzalı zaman token'ı/honeypot/hız sınırı → D1 kayıt → özel R2 eki → posta sağlayıcısı → durum kaydı. Sağlayıcı kabul ederse başarı gösterilir; bu, gelen kutusuna ulaşma makbuzu değildir. Başarısız gönderim failed olarak saklanır, kullanıcı girdisi korunur. Otomatik kuyruk/retry servisi yoktur; kullanıcı aynı talep kimliğiyle tekrar deneyebilir. Başarılı tekrarlar çift gönderim oluşturmaz.

Ekler en çok 10 MB PDF/JPEG/PNG/WebP; içerik imzası kontrol edilir. Bu antivirüs taraması değildir. Ekler yalnızca yetkili yönetim uç noktasından indirilir. Otomatik saklama/silme politikası henüz etkin değildir; süre ve prosedür hukuki/işletme kararıyla belirlenmelidir. Aydınlatma okuma teyidi pazarlama izni olarak kullanılmaz.

## Testler

```sh
npm run typecheck
npm run lint
npm run build
npx playwright install chromium
```

Derlenmiş önizleme açıkken PowerShell:

```powershell
$env:TEST_BASE='http://127.0.0.1:4173'
npm.cmd run test:browser
npm.cmd run test:seo
node scripts/test-revision-v3.mjs
node scripts/test-v3-final.mjs
node scripts/v3-smoke.mjs
node scripts/lighthouse-audit.mjs --v3
```

Python araçları requests, beautifulsoup4 ve görseller için Pillow kullanır; üretim Worker'ında gerekmez.

`npm run test:backend` veya `npm run test:leads`, gerçek işleyicileri bellek içi SQLite ve taklit R2/e-posta ile 12 senaryoda test eder. Gerçek veritabanına veya e-posta sağlayıcısına dokunmaz. Eski `scripts/backend-tests.mjs` tarihsel teslimat akışına aittir; güncel komut `scripts/test-lead-workflow.mjs` dosyasını kullanır.

Lighthouse emüle mobil cihaz, yavaşlatılmış ağ/CPU ve yerel üretim Worker'ında ölçülür; canlı kullanıcı ölçümü veya CDN performans garantisi değildir. Güncel sonuçlar `reports/redesign/DELIVERY.md` ve JSON/HTML raporlarındadır.

## Yayın — ayrı onaydan sonra

1. Tasarım ve yayın kapsamı onaylanmalıdır. Teknik/hukuki metinler onaysızsa taslak/noindex kalmalıdır.
2. Sites hosting akışında site kaydı, DB, özel BUCKET ve dispatch tarafından yönetilen Sign in with ChatGPT yapılandırılmalıdır. Repo henüz canlı siteye kaydedilmedi. Sites dışına taşınırsa kimlik doğrulama adaptasyonu gerekir; doğrudan internete açılan Worker istemci kimlik başlıklarına güvenmemelidir.
3. Üretim secret yönetiminde posta bilgileri, FORM_SECRET ve gerçek yönetici izin listesi tanımlanmalıdır. `.env`, `.wrangler`, `.sites-runtime` veya yerel DB dosyalarını yüklemeyin.
4. Bekleyen migrasyonları üretime uygulayın, build alın ve Sites hosting süreciyle dağıtın. Yalnızca public içeriği halka servis edilir.
5. mabteknoloji.com.tr için DNS/HTTPS yapılandırın. Farklı alan adı seçilirse `lib/content.ts` ORIGIN ve türeyen canonical/OG/sitemap adresleri değiştirilip yeniden derlenmelidir.
6. Gerçek ortamda 301/200/404, dört dil, robots/sitemap, yönetici izinleri ve özel ek erişimini doğrulayın. Kullanıcının açık izniyle kontrollü gerçek posta teslimatı testi yapın.
7. Sitemap'i indeksleme araçlarına yalnızca yayın onayından sonra gönderin. Analitik/pazarlama izleyicisi eklenirse çerez akışını ve hukuki metinleri güncelleyin.

Bu adımlar uygulanmadı; DNS değiştirilmedi ve şirkete test mesajı gönderilmedi.
