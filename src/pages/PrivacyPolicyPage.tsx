import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import { siteLinks } from '../config/siteLinks';

type Language = 'en' | 'ar';

const text = {
  en: {
    title: 'Privacy Policy',
    updated: 'Last updated: March 23, 2026',
    intro:
      `${siteLinks.brand.en} respects your privacy. This policy explains what information we collect, why we collect it, and how we use and protect it.`,
    sections: [
      {
        title: '1. Information We Collect',
        body: 'We may collect account details such as name and email, profile content, posts, comments, and limited technical data needed for security and performance.',
      },
      {
        title: '2. How We Use Information',
        body: 'We use information to operate the platform, improve reliability, personalize parts of the experience, and moderate community content.',
      },
      {
        title: '3. Sharing and Third-Party Services',
        body: 'We do not sell personal data. We may rely on trusted providers for hosting, authentication, storage, and other core platform services.',
      },
      {
        title: '4. Cookies, Advertising, and Local Storage',
        body: 'We use local storage and similar technologies to improve usability. Third-party vendors, including Google, may use cookies to serve ads based on previous visits to this website or other websites.',
      },
      {
        title: '5. Your Rights',
        body: 'You may request access, correction, or deletion of your personal information, subject to legal and security obligations.',
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
    updated: 'آخر تحديث: 23 مارس 2026',
    intro:
      `تحترم ${siteLinks.brand.shortAr} خصوصيتك. توضح هذه السياسة البيانات التي نجمعها ولماذا نجمعها وكيف نستخدمها ونحميها.`,
    sections: [
      {
        title: '1. البيانات التي نجمعها',
        body: 'قد نجمع بيانات الحساب مثل الاسم والبريد الإلكتروني، ومحتوى الملف الشخصي، والمنشورات، والتعليقات، وبعض البيانات التقنية اللازمة للأمان والأداء.',
      },
      {
        title: '2. كيف نستخدم البيانات',
        body: 'نستخدم البيانات لتشغيل المنصة وتحسين الاستقرار وتخصيص بعض جوانب التجربة وإدارة المحتوى المجتمعي.',
      },
      {
        title: '3. المشاركة والخدمات الخارجية',
        body: 'نحن لا نبيع البيانات الشخصية. وقد نعتمد على مزودي خدمات موثوقين للاستضافة والمصادقة والتخزين وبعض خدمات المنصة الأساسية.',
      },
      {
        title: '4. ملفات الارتباط والإعلانات والتخزين المحلي',
        body: 'نستخدم التخزين المحلي وتقنيات مشابهة لتحسين الاستخدام. وقد يستخدم مزودون خارجيون، بمن فيهم Google، ملفات ارتباط لعرض الإعلانات بناءً على زيارات سابقة لهذا الموقع أو لمواقع أخرى.',
      },
      {
        title: '5. حقوقك',
        body: 'يمكنك طلب الوصول إلى بياناتك أو تصحيحها أو حذفها بما يتوافق مع الالتزامات القانونية والأمنية.',
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
