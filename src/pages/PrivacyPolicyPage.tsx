import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import { siteLinks } from '../config/siteLinks';

type Language = 'en' | 'ar';

const text = {
  en: {
    title: 'Privacy Policy',
    updated: 'Last updated: March 11, 2026',
    intro:
      'Islamic Vision respects your privacy. This policy explains what information we collect, why we collect it, and how we use and protect it.',
    sections: [
      {
        title: '1. Information We Collect',
        body: 'We may collect account details (name, email), profile content, posts/comments, and technical data needed for security and performance.',
      },
      {
        title: '2. How We Use Information',
        body: 'We use your information to operate the platform, personalize your experience, moderate community content, and improve reliability.',
      },
      {
        title: '3. Sharing and Third-Party Services',
        body: 'We do not sell your personal data. We may use trusted service providers for hosting, authentication, analytics, and storage.',
      },
      {
        title: '4. Cookies and Local Storage',
        body: 'We use local storage and similar technologies to keep you signed in, remember language/theme settings, and improve usability.',
      },
      {
        title: '5. Your Rights',
        body: 'You can request access, correction, or deletion of your personal information, subject to legal and security obligations.',
      },
      {
        title: '6. Contact',
        body: `For privacy requests, contact: ${siteLinks.supportEmail}`,
      },
    ],
    back: 'Back to Home',
  },
  ar: {
    title: 'سياسة الخصوصية',
    updated: 'آخر تحديث: 11 مارس 2026',
    intro:
      'تحترم Islamic Vision خصوصيتك. توضح هذه السياسة البيانات التي نجمعها ولماذا نجمعها وكيف نستخدمها ونحميها.',
    sections: [
      {
        title: '1. البيانات التي نجمعها',
        body: 'قد نجمع بيانات الحساب (الاسم والبريد)، ومحتوى الملف الشخصي، والمنشورات/التعليقات، وبيانات تقنية للأمان والأداء.',
      },
      {
        title: '2. كيف نستخدم البيانات',
        body: 'نستخدم البيانات لتشغيل المنصة، وتخصيص التجربة، وإدارة المحتوى المجتمعي، وتحسين الاستقرار.',
      },
      {
        title: '3. المشاركة وخدمات الطرف الثالث',
        body: 'لا نبيع بياناتك الشخصية. قد نستخدم مزودي خدمات موثوقين للاستضافة والمصادقة والتحليلات والتخزين.',
      },
      {
        title: '4. ملفات تعريف الارتباط والتخزين المحلي',
        body: 'نستخدم التخزين المحلي وتقنيات مشابهة للحفاظ على تسجيل الدخول وتذكر إعدادات اللغة/المظهر وتحسين الاستخدام.',
      },
      {
        title: '5. حقوقك',
        body: 'يمكنك طلب الوصول إلى بياناتك أو تصحيحها أو حذفها، بما يتوافق مع الالتزامات القانونية والأمنية.',
      },
      {
        title: '6. التواصل',
        body: `لطلبات الخصوصية: ${siteLinks.supportEmail}`,
      },
    ],
    back: 'العودة للرئيسية',
  },
};

export const PrivacyPolicyPage = ({ lang }: { lang: Language }) => {
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

