import type {Lang} from './i18n';
const rows={
 title:['Projenizi birlikte netleştirelim.','Let’s define your project.','لنحدد مشروعك معاً.','Уточним ваш проект вместе.'],
 lead:['Bildiğiniz bilgileri paylaşın; kalanını birlikte değerlendirelim. İhtiyaç özetiniz teklif talebinize eklenir.','Share what you know; we will work through the rest together. Your brief accompanies your enquiry.','شارك المعلومات المتاحة وسنراجع الباقي معاً. يُرفق الملخص بطلبك.','Поделитесь известными данными — остальное уточним вместе. Краткое описание будет приложено к запросу.'],
 steps:['İhtiyaç|Teknik bilgiler|Kapsam ve özet|İletişim','Need|Technical details|Scope and summary|Contact','الاحتياج|البيانات الفنية|النطاق والملخص|التواصل','Задача|Технические данные|Объём и итог|Контакты'],
 service:['Hangi konuda görüşelim?','What can we help with?','في أي مجال نتحدث؟','Какую задачу обсудим?'],
 work:['Nasıl bir çalışma planlıyorsunuz?','What type of work are you planning?','ما نوع العمل المطلوب؟','Какой вид работ планируется?'],
 works:['Yeni tesis / hat|Mevcut hattın revizyonu|Planlı duruş / bakım|Birlikte değerlendirelim','New plant / line|Existing line modification|Planned shutdown / maintenance|Let’s assess together','منشأة / خط جديد|تعديل خط قائم|توقف مخطط / صيانة|لنقيّم معاً','Новая установка / линия|Модернизация линии|Плановый останов / обслуживание|Уточним вместе'],
 unknown:['Henüz bilmiyorum','Not yet known','غير معروف بعد','Пока неизвестно'],
 medium:['Akışkan / hammadde','Fluid / raw material','المائع / المادة الخام','Среда / сырьё'],
 target:['Kapasite / hedef çalışma koşulları','Capacity / target operating conditions','السعة / ظروف التشغيل المستهدفة','Производительность / рабочие условия'],
 timing:['Planlanan dönem / duruş tarihi','Planned period / shutdown date','الفترة / موعد التوقف المخطط','Период / дата остановки'],
 documents:['Elinizde hangi bilgiler var?','Which information is available?','ما المعلومات المتوفرة؟','Какие материалы доступны?'],
 docs:['Saha fotoğrafları|Yerleşim / hat çizimi|Teknik şartname|Mevcut ekipman bilgisi','Site photos|Layout / line drawing|Technical specification|Existing equipment data','صور الموقع|مخطط الموقع / الخط|المواصفات الفنية|بيانات المعدات الحالية','Фото объекта|План / схема линии|Техническое задание|Данные оборудования'],
 optional:['Bu bilgiler isteğe bağlı. Bilinmeyenleri keşif ve görüşmede netleştirebiliriz.','These details are optional. Unknowns can be clarified during consultation and site assessment.','هذه البيانات اختيارية. يمكن توضيحها أثناء النقاش ومعاينة الموقع.','Эти данные необязательны. Их можно уточнить при обсуждении и обследовании.'],
 scope:['İş kapsamını nasıl paylaşalım?','How should the scope be shared?','كيف نوزع نطاق العمل؟','Как распределить объём работ?'],
 scopeNote:['İlk görüşme için beklentinizi belirtin. Kesin iş kapsamı teklif aşamasında birlikte kararlaştırılır.','Indicate your expectations for the first discussion. The final scope is agreed during quotation.','حدد توقعاتك للنقاش الأول. يُتفق على النطاق النهائي أثناء إعداد العرض.','Укажите ожидания для первого обсуждения. Окончательный объём согласуется при подготовке предложения.'],
 tasks:['Projelendirme|Malzeme tedariki|İmalat ve montaj|İzolasyon|Test ve devreye alma','Design|Material supply|Fabrication and installation|Insulation|Testing and commissioning','التصميم|توريد المواد|التصنيع والتركيب|العزل|الاختبار والتشغيل','Проектирование|Поставка материалов|Изготовление и монтаж|Изоляция|Испытания и ввод'],
 owners:['Birlikte netleştirelim|MAB’dan talep ediyorum|Kendi ekibimiz üstlenecek','To be agreed|Requested from MAB|Handled by our team','نتفق معاً|مطلوب من MAB|يتولاه فريقنا','Уточним вместе|Запрашиваем у MAB|Выполняет наша команда'],
 summary:['Proje ön bilgi dosyanız','Your project brief','ملخص مشروعك','Краткое описание проекта'],
 next:['Devam et','Continue','متابعة','Продолжить'],back:['Geri','Back','رجوع','Назад'],
 print:['Özeti yazdır / PDF kaydet','Print / save summary as PDF','طباعة / حفظ الملخص PDF','Печать / сохранить PDF'],
 ready:['İhtiyaç özetiniz aşağıdaki talebe eklenecek.','Your brief will be included in the enquiry below.','سيُرفق ملخصك بالطلب أدناه.','Описание будет включено в запрос ниже.'],
 quick:['Doğrudan iletişime geç','Contact us directly','تواصل معنا مباشرة','Связаться напрямую'],
 entry:['Projenizi planlayın','Plan your project','خطط لمشروعك','Спланируйте проект'],
 edit:['Bilgileri düzenle','Edit details','تعديل البيانات','Изменить данные']
} as const;
export function leadCopy(lang:Lang){const index=['tr','en','ar','ru'].indexOf(lang);return Object.fromEntries(Object.entries(rows).map(([k,v])=>[k,v[index]])) as Record<keyof typeof rows,string>}
