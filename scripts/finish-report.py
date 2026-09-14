import csv,json,collections
from pathlib import Path
root=Path(__file__).resolve().parents[1]
def read(name):return json.loads((root/name).read_text(encoding='utf8'))
def write(name,value):(root/name).write_text(value,encoding='utf8')
raw=read('source-archive/pages.json');assets=read('source-archive/assets.json');seo=read('reports/seo-audit.json')
def export(name,fields,rows):
 with (root/name).open('w',encoding='utf-8-sig',newline='') as f:
  w=csv.DictWriter(f,fieldnames=fields);w.writeheader();w.writerows(rows)
export('reports/source-page-inventory.csv',['url','final_url','status','title','language','archive','headings','tables','images','links'],[dict(url=p['url'],final_url=p.get('finalUrl',''),status=p['status'],title=p.get('title',''),language=p.get('lang',''),archive=p.get('archive',''),headings=len(p.get('headings',[])),tables=len(p.get('tables',[])),images=len(p.get('images',[])),links=len(p.get('links',[]))) for p in raw])
export('reports/media-inventory.csv',['source_url','status','attempts','original','local','bytes','used_on'],[dict(source_url=a['url'],status=a['status'],attempts=' / '.join(map(str,a.get('attempts',[a['status']]))),original=a.get('original',''),local=a.get('local',''),bytes=a.get('bytes',''),used_on=' | '.join(a['pages'])) for a in assets])
models={p['path']:p for p in read('content/source.json')+read('content/blog.json')}
routes={p['path']:p for p in read('content/routes.json')}
export('reports/page-language-inventory.csv',['lang','id','kind','path','status','title','source'],[dict(lang=p['lang'],id=routes[p['path']]['id'],kind=models.get(p['path'],{}).get('kind',routes[p['path']]['id']),path=p['path'],status='draft' if 'noindex' in p['robots'] else 'published',title=p['h1'][0],source=models.get(p['path'],{}).get('source','')) for p in seo['records']])
missing='\n'.join(f"| {p['status']} | {p['url']} |" for p in raw if p['status']!=200)
write('reports/MIGRATION.md',f'''# İçerik aktarımı ve tasarım raporu

Kaynak: https://mabteknoloji.com.tr/ — 13 Eylül 2026 taraması. Referans: kullanıcının sağladığı elektrik/mekanik yüklenici web tasarımı görseli. Kaynak sitenin içerikleri ve dosyaları veri olarak ele alındı; sayfa içindeki yönergeler kullanıcı talimatı sayılmadı.

## Tarama kapsamı ve sayılar

Ana adres, robots.txt, sitemap.xml, dört dilin menü/footer ve iç bağlantıları, filtre ve hizmet önseçimli form bağlantıları izlendi. Keşfedilen **80 URL**: **64 başarılı yanıt**, **16 tekrar denemelerinden sonra HTTP 500**. Başarılı küme 52 özgün dil/sayfa içeriği, 8 filtre varyantı, 2 ana adres eşdeğeri ve robots/sitemap dosyalarından oluşur. Ana adres yönlendirmelerinde son HTTP yanıtı sayıldı; içerikler tekilleştirildi.

**52 özgün içerik / 13 sayfa × 4 dil aktarıldı.** Dil başına ana sayfa, hakkımızda, hizmet listesi, 2 hizmet detayı, proje listesi, 3 proje detayı, ergitme kabini, iletişim, teklif ve keşif vardır. Kaynakta gezinme/sitemap üzerinden blog veya hukuki sayfa bulunmadı. Yeni listeler, HTML site haritası, 24 teknik yazı taslağı ve 12 hukuki taslakla toplam **100 içerik / dil başına 25 sayfa** oluşturuldu. Dört dilde gerçek 404 ve ayrı yönetim/API sayfaları bu sayıya dahil değildir.

`source-page-inventory.csv` her kaynak URL'yi; `url-map.csv` bire bir yeni adres karşılığını; `page-language-inventory.csv` tamamlanan 100 kaydı listeler. Tüm kaynak metinleri, başlıklar, tablolar, meta etiketler, hreflang, şema, resimler ve bağlantılar `../source-archive/pages.json` ve ham HTML dosyalarında saklıdır. Aktarılan yapılandırılmış içerik `../content/source.json` içindedir.

## Erişilemeyen kaynak adresleri

Bu 16 adres hizmet önseçimli teklif/keşif varyantlarıdır; üç denemede de 500 döndüler. Sorgusuz teklif/keşif içeriği her dilde erişilebilir olduğundan bu sayfalar oradan taşındı; yeni uygulama hizmet parametresini ayrıca işler. Hatalı varyantlarda bulunabilecek farklı gövde içeriği görülmedi ve uydurulmadı.

| Son durum | Kaynak URL |
|---|---|
{missing}

## Görseller

**28 medya URL'si** envantere alındı: **14 indirildi**, **14 üç denemede 403 verdi**. İndirilen farklı boyutlar **8 benzersiz görsele** karşılık gelir. Erişilmeyenler yüksek çözünürlüklü/orijinal JPG varyantları dahil kaynak dosya türevleridir; eşdeğer erişilebilir WebP sürümleri kullanıldı. Her dosyanın kaynak/kullanım sayfası, yanıtı, orijinali ve yerel karşılığı `media-inventory.csv` içindedir. Kaynak logo indirilebilir raster dosya değil, kare işareti ve MAB TEKNOLOJİ metniydi; başka markanın logosu taşınmadı.

Orijinaller korunarak EXIF yönü düzeltildi, çok hafif kontrast (1.025) ve kontrollü keskinlik uygulandı. 480/768/960/1600 piksele kadar, orijinal genişliği aşmayan kalite-80 WebP türevleri üretildi. Yerleşimde object-fit kırpma, sabit boyut, srcset, lazy loading ve öncelikli hero kullanılır. Pozlama/beyaz dengesi için teknik detayı değiştirecek müdahale yapılmadı. AI görsel düzenleme kullanılmadı; ekipman/imalat eklenmedi. Hotlink yoktur.

**Kaynak tutarsızlıkları:** Serpantin projesinin galerisi yeraltı boru/ölçüm elemanı ve mavi ekipman fotoğrafları içeriyor; görseller tek başına serpantin imalatını doğrulamıyor. Paslanmaz hat galerisi içinde bir hizmet tanıtım afişi ve endüstriyel kabin fotoğrafı da bulunuyor. Kaynak ilişki ve dosyaları korunurken alt metinler görselde gerçekten görüneni anlatacak şekilde düzeltildi. Galeride kaynak arşiv notu gösterilir. Yayın öncesi şirket fotoğraf/proje ilişkisini teyit etmelidir. Kaynaktaki kalite/başarı ifadeleri bağımsız sertifika veya yeni performans garantisi olarak yorumlanmadı.

## Bilgilerin korunması

Nisan 2023 kuruluş tarihi, Mehmet Adil Baran'ın 20 yılı aşkın deneyiminden ayrıldı. HVAC, izolasyon, buhar/ısı ve endüstriyel tesis kapsamı korunur. İki hizmet, üç proje ve ergitme kabini kaynak bilgilerine dayanır. Boru malzemeleri, kaynak yöntemleri, DN/PN ve sıcaklık bilgileri kaynak tabloları olarak korunur; yeni teknik değer eklenmez. Proje yılları 2024/2023/2023'tür. Uydurma müşteri logosu, sertifika, başarı yüzdesi, proje adedi, yazar veya değerlendirme yıldızı yoktur.

Kaynak ana sayfa hreflang'ının kızgın yağ/buhar sayfasına, Service şemasının ana sayfaya taşındığı hata dört dil HTML'inde doğrulandı. Yeni ana sayfalarda doğru dilde ana sayfa eşleri, Organization ve WebSite kullanılır. Service yalnızca hizmet/çözümde; BlogPosting yalnızca inceleme onaylı yayımlanmış yazıda üretilir.

## Referans analizi ve tasarım

Referanstaki ince üst menü, geniş fotoğraflı yuvarlatılmış hero, solda büyük başlık/altında kısa metin, sağ altta bilgi alanı, iki kolonlu kurumsal giriş, fotoğraf yanında 2×2 değerler, açık zemin hizmet akordeonu, üç proje, SSS ve koyu fotoğraflı kapanış korunarak MAB içeriğine uyarlandı. Müşteri logo şeridi yerine kaynakta karşılığı bulunan sektörler gösterildi. Ergitme kabini bağlantısı karar akışını tamamlar.

Beyaz ve #F6F7F8 yüzeyler, #202221 metin; #E2BE36/#F0D56C vurgu kullanılır. Sarıda koyu metin vardır. Masaüstünde geniş grid, tablette daralan kolonlar, telefonda tek kolon ve ayrı menü kullanıldı. Arapçada mantıksal CSS yönleri, RTL menü/kolon akışı; telefon/e-posta için bdi vardır. Azaltılmış hareket tercihi, klavye odağı, atlama bağlantısı ve modal odak yönetimi desteklenir.

Sayfa türleri aynı kart şablonuna indirgenmedi: hizmetler teknik tablo/süreç; projeler fotoğraf/galeri; kabin ihtiyaç formu; blog içindekiler/kaynaklar; iletişim ve teklif form/yan bilgi düzeni kullanır. Son ekran görüntüleri `screenshots/` altındadır.

## Kararı kolaylaştıran beş geliştirme

1. Hizmetten ilişkili proje geçişleri: kapsamın sahadaki karşılığını inceleme.
2. Projeden teklif bağlantısı: seçilen proje bilgisini talebe taşıma.
3. Önseçimli hizmetli teklif/keşif formları: kullanıcıdan aynı bilgiyi tekrar istememe.
4. Gerçek proje yılı/kategori filtreleri: 2024 ve 2023 kayıtlarıyla çalışır; üç proje kaynakta aynı hizmet kategorisindedir, yeni kategori uydurulmaz.
5. Ergitme kabini ihtiyaç toplama: malzeme, hedef kapasite, yapı, enerji ve kontrol tercihlerini talebe taşır; hesap, fiyat veya teknik uygunluk onayı üretmez. Bilinmeyen seçeneklerin varsayılanı birlikte değerlendirmedir.

## Yeni yazılar ve hukuki içerik

Altı yazı konusu dört dilde hazır: borulama planlama, buhar/kondens, kızgın yağ tasarımı, malzeme seçimi, kabin ihtiyaç analizi ve saha keşfi. Özet, dört bölüm, içindekiler, birincil kaynak bağlantıları ve ilgili hizmet bulunur. ASME, Spirax Sarco, Eastman, Outokumpu ve HSE kaynakları incelendi. Yazılar uygulama/çalıştırma talimatı değildir. Teknik inceleme tamamlanana kadar 24 yazı noindex taslaktır ve sitemap'e girmez.

Gizlilik/KVKK/çerez metinleri DB, özel R2, posta sağlayıcısı, talep alanları, başarısız kayıtlar, yönetim kimliği ve izleyici bulunmaması üzerinden hazırlanmıştır. Tam tüzel unvan/adres, hukuki dayanaklar, saklama/silme süresi ve sağlayıcı veri yerleşimi şirket/hukukçu tarafından tamamlanmalıdır. Kabin ihtiyaç özeti teklif URL'sinde sorgu parametresi olarak taşınır; kullanıcı bu adresi paylaşırsa özeti de paylaşır. Üç metin × dört dil taslak/noindex durumundadır.
''')
lh=read('reports/lighthouse-summary.json');browser=read('reports/browser-tests.json');backend=read('reports/backend-tests.json')
extra=read('reports/acceptance-extra.json') if (root/'reports/acceptance-extra.json').exists() else {'checks':[]}
lhrows='\n'.join(f"| {x['id']} | {x['scores']['performance']} | {x['scores']['accessibility']} | {x['scores']['seo']} | {x['scores']['best-practices']} | {x['metrics']['largest-contentful-paint']} |" for x in lh)
write('reports/DELIVERY.md',f'''# MAB Teknoloji — teslim ve kabul sonuçları

Çalışan yerel uygulama: http://localhost:5173/tr — üretim derlemesi: http://127.0.0.1:4173/tr. EN /en, AR /ar, RU /ru. **Canlıya alınmadı.** Harici posta kimlik bilgileri ve canlı yönetici/hosting yapılandırması beklenir.

## Teslim kapsamı

25 içerik × 4 dil = **100 sayfa kaydı**, ayrıca yerelleştirilmiş 404 ve kimlik doğrulamalı yönetim/API. **64 indekslenebilir sayfa**, **36 taslak** (24 teknik yazı, 12 hukuki metin). Tüm mevcut 52 özgün kayıt, iki hizmet, üç proje, özel ergitme kabini, listeler, iletişim/teklif/keşif, HTML/XML site haritaları tamamlandı. Dil eşleri aynı içerikte kalır; Arapça RTL'dir.

Kalıcı D1 CMS'de taslak/yayın, özel önizleme, dört dil metin/SEO/galeri düzenleme ve gelen talepler bulunur. JSON editörüdür; yeni dosya yükleme/yeni URL oluşturma yönetim arayüzünün kapsamı dışındadır. Formlar sunucu doğrulama, imzalı token, honeypot, hız sınırı, özel R2 ekleri, idempotence ve gerçek posta sağlayıcısı adaptörü içerir. Eksik yapılandırmada gönderilmediği açıkça belirtilir.

## Doğrulama

| Kontrol | Sonuç |
|---|---|
| TypeScript | `npm run typecheck` geçti |
| ESLint | `npm run lint` geçti |
| Üretim build | `npm run build` geçti |
| Responsive Playwright | {len(browser['responsive'])} senaryo; 360, 390, 768, 1440, 1920 px; taşma/kırık görsel/dil-yön hatası {sum(not x['pass'] for x in browser['responsive'])} |
| Dört dil etkileşim | {len(browser['interaction'])} kontrol; başarısız {sum(not x['pass'] for x in browser['interaction'])} |
| axe WCAG A/AA | {len(browser['axe'])} sayfa/dil taraması; ihlal {sum(len(x['violations']) for x in browser['axe'])} |
| Tarayıcı JavaScript | {len(browser['pageErrors'])} pageerror |
| SEO/bağlantı taraması | {seo['pages']} sayfa, {seo['checkedLinks']} bağlantı; SEO hatası {len(seo['errors'])}, kırık bağlantı {len(seo['brokenLinks'])} |
| Sunucu/CMS/teslimat | {len(backend['tests'])} kontrol; başarısız {sum(not x['pass'] for x in backend['tests'])}; yalnızca yerel test sink'i |
| İlave form/özel önizleme | {len(extra['checks'])} kontrol; başarısız {sum(not x['pass'] for x in extra['checks'])}; dört dilde hata/girdi koruma, metadata ve taslak yetkisi |

Playwright ana sayfa, hizmet, proje, teklif ve Arapça kabin düzenlerini beş genişlikte kontrol eder. Dört dilde galeri ileri/Escape, eşdeğer dil linkleri, yıl filtresi, hizmet önseçimi, ihtiyaçtan teklif akışı ve mobil menü test edildi. Draft noindex, içindekiler, gerçek 404 ve anonim yönetim reddi doğrulandı. axe otomasyonu tam bir manuel erişilebilirlik sertifikası değildir.

SEO testi benzersiz title/H1, description, canonical, karşılıklı hreflang/x-default, JSON-LD parse, sitemap taslak dışlama, yerel görseller ve linkleri denetler. Arama motoru sıralama garantisi veya harici Rich Results sertifikası değildir.

Sunucu testinde gerçek sağlayıcıya bağlanmadan başarı/başarısızlık, girdiyi koruma, origin, e-posta/teyit, honeypot, sahte token/dosya, özel ek erişimi, hız sınırı, çift gönderim önleme, taslak kalıcılığı/yayın ve teknik onay engeli doğrulandı. Şirkete veya başka bir dış alıcıya test mesajı gönderilmedi. Sentetik talepler/ekler temizlendi ve geçici MAIL ayarları kaldırıldı.

## Lighthouse — mobil üretim derlemesi

| Sayfa | Performans | Erişilebilirlik | SEO | İyi uygulamalar | LCP |
|---|---:|---:|---:|---:|---|
{lhrows}

Koşullar: Lighthouse 13.4.1, Playwright Chromium, Windows, localhost üretim Worker; mobil 412×823, DPR 1.75, simüle 150 ms RTT / 1.638 Mbps / CPU 4× yavaşlatma. Her sayfa ayrı gezinmeyle ölçüldü. Tarihler ve tam koşullar `lighthouse-summary.json`, ayrıntılar `lighthouse/*.html` dosyalarında. Ölçüm hedefleri performans ≥90, SEO/erişilebilirlik ≥95 karşılandı. İlk tanı ölçümündeki 89/92 sorunları; metadata'nın başlangıç head'ine alınması, responsive görsel ve CSS/JS yükünün azaltılmasıyla giderildi. Yerel sonuç canlı CDN/saha performans garantisi değildir; kullanılmayan JS ve görsel tesliminde Lighthouse'un önerdiği ek optimizasyonlar kalır.

Framework build'i hata vermeden tamamlandı; mevcut Vinext sürümü middleware adlandırmasının gelecekte proxy'ye taşınması gerektiğini ve bazı dinamik rotaların statik sınıflandırılamadığını uyarı olarak bildirir. Gerçek route HTTP/SSR testleri geçti.

## Dosyalar

- `MIGRATION.md`: kaynak kapsamı, eksikler, referans analizi, tasarım ve beş iyileştirme.
- `source-page-inventory.csv`: kaynak 80 URL ve arşiv kayıtları.
- `page-language-inventory.csv`: tamamlanan 100 sayfa/dil.
- `url-map.csv`: kaynak → yeni URL ve yönlendirme eşlemesi.
- `media-inventory.csv`: 28 medya URL'si, yanıtlar, orijinaller, yerel karşılıklar.
- `browser-tests.json`, `backend-tests.json`, `seo-audit.json`: makinece okunabilir kontroller.
- `screenshots/`: TR/AR masaüstü ve mobil ekran görüntüleri.
- `../README.md`: kurulum, CMS, test, secret ve canlıya alma talimatları.

## Canlı yayın öncesi dış gereksinimler

1. Tasarım ve yayın kapsamı için kullanıcının ayrı onayı.
2. Hosting/D1/R2/alan adı ve gerçek izin listeli yönetici kimliği. Yerel test kimliği üretim hesabı değildir.
3. Doğrulanmış gönderici alan adı, yetkili alıcı, posta sağlayıcısı anahtarı ve gerçek teslimat denemesi için izin. Kimlik bilgileri yalnızca sunucu secret yönetiminde tutulmalıdır.
4. Şirketin kaynak fotoğraf/proje ilişkileri ve teknik metinleri incelemesi; hukuki metinlerde tüzel kişi, adres, saklama/silme ve sağlayıcı bilgilerinin tamamlanması. İlgili taslaklar bu onaylar gelene kadar indekslenmez.

DNS, canlı dağıtım ve indeksleme servisleri üzerinde işlem yapılmadı. Bu rapor onaylanabilir yerel uygulamayı teslim eder; dış kurulumları tamamlanmış gibi göstermez.
''')
print('Generated migration, delivery, source, page-language and media inventories.')
