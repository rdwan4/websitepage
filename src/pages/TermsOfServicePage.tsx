import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import { siteLinks } from '../config/siteLinks';

type Language = 'en' | 'ar';

const text = {
  en: {
    title: 'Terms of Service',
    updated: 'Last updated: March 23, 2026',
    intro:
      `By using ${siteLinks.brand.en}, you agree to these terms. If you do not agree, please do not use the platform.`,
    sections: [
      {
        title: '1. Acceptable Use',
        body: 'You must use the platform lawfully and respectfully. Abuse, harassment, hate speech, and illegal activity are prohibited.',
      },
      {
        title: '2. User Content',
        body: 'You are responsible for the content you submit. We may remove content that violates community rules, platform policy, or applicable law.',
      },
      {
        title: '3. Accounts',
        body: 'You are responsible for protecting your account credentials and for activity taking place under your account.',
      },
      {
        title: '4. Platform Availability',
        body: 'We may update, suspend, or discontinue parts of the service when needed for quality, security, maintenance, or compliance.',
      },
      {
        title: '5. Limitation of Liability',
        body: 'The service is provided as-is to the extent permitted by law. We are not liable for indirect damages or losses.',
      },
      {
        title: '6. Contact',
        body: `For support or legal questions: ${siteLinks.supportEmail}`,
      },
    ],
    back: 'Back to Home',
  },
  ar: {
    title: 'شروط الخدمة',
    updated: 'آخر تحديث: 23 مارس 2026',
    intro:
      `باستخدام ${siteLinks.brand.shortAr} فإنك توافق على هذه الشروط. إذا لم توافق، يرجى عدم استخدام المنصة.`,
    sections: [
      {
        title: '1. الاستخدام المقبول',
        body: 'يجب استخدام المنصة بشكل قانوني ومحترم. يمنع الإساءة والتحرش وخطاب الكراهية والأنشطة غير القانونية.',
      },
      {
        title: '2. محتوى المستخدم',
        body: 'أنت مسؤول عن المحتوى الذي ترسله أو تنشره. ويمكننا إزالة المحتوى المخالف لقواعد المجتمع أو سياسات المنصة أو القوانين المعمول بها.',
      },
      {
        title: '3. الحسابات',
        body: 'أنت مسؤول عن حماية بيانات دخولك وعن أي نشاط يتم من خلال حسابك.',
      },
      {
        title: '4. توفر المنصة',
        body: 'قد نقوم بتحديث أو إيقاف بعض أجزاء الخدمة عند الحاجة لأسباب تتعلق بالجودة أو الأمان أو الصيانة أو الامتثال.',
      },
      {
        title: '5. حدود المسؤولية',
        body: 'تقدم الخدمة كما هي ضمن ما يسمح به القانون، ولا نتحمل الأضرار غير المباشرة أو الخسائر التابعة.',
      },
      {
        title: '6. التواصل',
        body: `للدعم أو الاستفسارات القانونية: ${siteLinks.supportEmail}`,
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
          <p className="mb-8 text-sm text-app-muted">{t.updated}</p>
          <p className="mb-10 leading-relaxed text-app-muted">{t.intro}</p>

          <div className="space-y-8">
            {t.sections.map((section) => (
              <section key={section.title}>
                <h2 className="mb-3 text-lg font-bold text-app-text">{section.title}</h2>
                <p className="leading-relaxed text-app-muted">{section.body}</p>
              </section>
            ))}
          </div>

          <Link to="/" className="mt-10 inline-block text-sm font-bold text-app-accent hover:underline">
            {t.back}
          </Link>
        </div>
      </div>
    </div>
  );
};
