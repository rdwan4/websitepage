import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import { siteLinks } from '../config/siteLinks';

type Language = 'en' | 'ar';

const text = {
  en: {
    title: 'Terms of Service',
    updated: 'Last updated: March 29, 2026',
    intro:
      `Welcome to ${siteLinks.brand.en}. By accessing or using our platform, you agree to be bound by these Terms of Service. If you do not agree to all of these terms, please do not use the website or its services.`,
    sections: [
      {
        title: '1. Acceptable Use',
        body: 'You agree to use the platform only for lawful purposes related to learning and sharing Islamic knowledge. You are prohibited from using the site for harassment, hate speech, spamming, or any activity that violates the sanctity of the content or the safety of our users.',
      },
      {
        title: '2. User Content & Intellectual Property',
        body: 'When you submit posts or comments, you grant us a non-exclusive license to display and moderate that content. You represent that you own the rights to anything you post. We respect intellectual property and will remove content that infringes on copyrights upon valid notice.',
      },
      {
        title: '3. Account Security',
        body: 'If you create an account, you are responsible for maintaining the confidentiality of your login credentials. You are responsible for all activities that occur under your account. Notify us immediately if you suspect unauthorized use.',
      },
      {
        title: '4. Third-Party Links & Services',
        body: 'Our platform may contain links to third-party websites or services (such as Google AdSense). We do not control and are not responsible for the content, privacy policies, or practices of any third-party services.',
      },
      {
        title: '5. Disclaimer of Warranties',
        body: 'The services and content on Islamic Light are provided "as is" and "as available". While we strive for absolute accuracy in Islamic references, users are encouraged to consult primary sources and scholars for definitive rulings.',
      },
      {
        title: '6. Limitation of Liability',
        body: 'To the maximum extent permitted by law, Islamic Light and its operators shall not be liable for any indirect, incidental, or consequential damages arising out of your use of the platform.',
      },
      {
        title: '7. Amendments to Terms',
        body: `We reserve the right to modify these terms at any time. Your continued use of the site after changes constitutes acceptance of the new terms. Contact us at ${siteLinks.supportEmail} for legal inquiries.`,
      },
    ],
    back: 'Back to Home',
  },
  ar: {
    title: 'شروط الخدمة',
    updated: 'آخر تحديث: 29 مارس 2026',
    intro:
      `مرحباً بك في ${siteLinks.brand.shortAr}. من خلال الوصول إلى منصتنا أو استخدامها، فإنك توافق على الالتزام بشروط الخدمة هذه. إذا كنت لا توافق على هذه الشروط، يرجى عدم استخدام الموقع أو خدماته.`,
    sections: [
      {
        title: '1. الاستخدام المقبول',
        body: 'أنت توافق على استخدام المنصة فقط للأغراض المشروعة المتعلقة بتعلم ومشاركة المعرفة الإسلامية. يمنع منعاً باتاً استخدام الموقع للمضايقة، أو خطاب الكراهية، أو الرسائل غير المرغوب فيها، أو أي نشاط ينتهك حرمة المحتوى أو سلامة مستخدمينا.',
      },
      {
        title: '2. محتوى المستخدم والملكية الفكرية',
        body: 'عند تقديم منشورات أو تعليقات، فإنك تمنحنا ترخيصاً غير حصري لعرض وإدارة ذلك المحتوى. أنت تقر بأنك تملك حقوق كل ما تنشره. نحن نحترم الملكية الفكرية وسنقوم بإزالة المحتوى الذي ينتهك حقوق الطبع والنشر فور تلقي إشعار صحييح.',
      },
      {
        title: '3. أمن الحساب',
        body: 'إذا أنشأت حساباً، فأنت مسؤول عن الحفاظ على سرية بيانات اعتماد تسجيل الدخول الخاصة بك. أنت مسؤول عن جميع الأنشطة التي تحدث تحت حسابك. يجب إخطارنا فوراً إذا كنت تشك في أي استخدام غير مصرح به.',
      },
      {
        title: '4. روابط وخدمات الطرف الثالث',
        body: 'قد تحتوي منصتنا على روابط لمواقع أو خدمات طرف ثالث (مثل Google AdSense). نحن لا نتحكم ولسنا مسؤولين عن المحتوى أو سياسات الخصوصية أو الممارسات الخاصة بأي خدمات طرف ثالث.',
      },
      {
        title: '5. إخلاء المسؤولية',
        body: 'يتم تقديم الخدمات والمحتوى في "النور الإسلامي" "كما هي" و "كما هي متاحة". بينما نسعى جاهدين للدقة التامة في المراجع الإسلامية، نشجع المستخدمين على الرجوع إلى المصادر الأصلية والعلماء للأحكام النهائية.',
      },
      {
        title: '6. حدود المسؤولية',
        body: 'إلى أقصى حد يسمح به القانون، لن يكون "النور الإسلامي" ومسؤولو الموقع مسؤولين عن أي أضرار غير مباشرة أو عرضية أو تبعية ناتجة عن استخدامك للمنصة.',
      },
      {
        title: '7. تعديل الشروط',
        body: `نحتفظ بالحق في تعديل هذه الشروط في أي وقت. استمرارك في استخدام الموقع بعد التغييرات يعتبر قبولاً للشروط الجديدة. تواصل معنا عبر: ${siteLinks.supportEmail} للاستفسارات القانونية.`,
      },
    ],
    back: 'العودة للرئيسية',
  },
};

export const TermsOfServicePage = ({ lang }: { lang: Language }) => {
  const t = text[lang];

  return (
    <div className="min-h-screen bg-app-bg pt-32 pb-20">
      <div className="container mx-auto px-6">
        <div className={cn('mx-auto max-w-4xl rounded-[2rem] border border-white/10 bg-app-card p-8 md:p-12', lang === 'ar' && 'text-right')}>
          <h1 className="mb-2 text-4xl font-serif text-app-text">{t.title}</h1>
          <p className="mb-10 text-sm text-app-muted border-b border-white/5 pb-4">{t.updated}</p>
          <p className="mb-12 leading-relaxed text-app-text/90 text-lg">{t.intro}</p>

          <div className="space-y-10">
            {t.sections.map((section, idx) => (
              <section key={section.title} className="bg-white/5 p-6 rounded-2xl">
                <h2 className="mb-4 text-xl font-bold text-app-text flex items-center gap-3">
                   <span className="flex items-center justify-center w-8 h-8 rounded-full bg-app-accent text-white text-xs">{idx + 1}</span>
                   {section.title}
                </h2>
                <p className="leading-relaxed text-app-muted">{section.body}</p>
              </section>
            ))}
          </div>

          <div className="mt-16 pt-8 border-t border-white/5">
            <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-app-accent hover:underline px-6 py-3 bg-app-accent/10 rounded-2xl transition-all hover:bg-app-accent/20">
              ← {t.back}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

