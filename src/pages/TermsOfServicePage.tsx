import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import { siteLinks } from '../config/siteLinks';

type Language = 'en' | 'ar';

const text = {
  en: {
    title: 'Terms of Service',
    updated: 'Last updated: March 11, 2026',
    intro:
      'By using Islamic Vision, you agree to these terms. If you do not agree, please do not use the platform.',
    sections: [
      {
        title: '1. Acceptable Use',
        body: 'You must use the platform lawfully and respectfully. Harassment, abuse, hate speech, and illegal activity are prohibited.',
      },
      {
        title: '2. User Content',
        body: 'You are responsible for the content you submit. We may remove content that violates community rules or applicable law.',
      },
      {
        title: '3. Accounts',
        body: 'You are responsible for safeguarding your account credentials and any activity under your account.',
      },
      {
        title: '4. Platform Availability',
        body: 'We may update, suspend, or discontinue features at any time to improve quality, security, or compliance.',
      },
      {
        title: '5. Limitation of Liability',
        body: 'The service is provided as-is to the extent allowed by law. We are not liable for indirect damages or losses.',
      },
      {
        title: '6. Community Rules',
        body: 'Do not post misinformation, extremist material, spam, explicit content, or copyrighted material without permission. Repeated violations may lead to content removal, account restriction, or permanent ban.',
      },
      {
        title: '7. Contact',
        body: `For support or legal questions: ${siteLinks.supportEmail}`,
      },
    ],
    back: 'Back to Home',
  },
  ar: {
    title: 'شروط الاستخدام',
    updated: 'آخر تحديث: 11 مارس 2026',
    intro: 'باستخدام Islamic Vision فإنك توافق على هذه الشروط. إذا لم توافق، يرجى عدم استخدام المنصة.',
    sections: [
      {
        title: '1. الاستخدام المقبول',
        body: 'يجب استخدام المنصة بشكل قانوني ومحترم. يُمنع التحرش والإساءة وخطاب الكراهية والأنشطة غير القانونية.',
      },
      {
        title: '2. محتوى المستخدم',
        body: 'أنت مسؤول عن المحتوى الذي تنشره. يمكننا إزالة المحتوى المخالف لقواعد المجتمع أو القوانين.',
      },
      {
        title: '3. الحسابات',
        body: 'أنت مسؤول عن حماية بيانات دخولك وأي نشاط يتم عبر حسابك.',
      },
      {
        title: '4. توفر المنصة',
        body: 'قد نقوم بتحديث أو إيقاف بعض الميزات في أي وقت لتحسين الجودة أو الأمان أو الامتثال.',
      },
      {
        title: '5. حدود المسؤولية',
        body: 'تُقدّم الخدمة كما هي ضمن ما يسمح به القانون، ولا نتحمل الأضرار غير المباشرة أو الخسائر التابعة.',
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
          <p className="mb-10 text-app-muted leading-relaxed">{t.intro}</p>

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
