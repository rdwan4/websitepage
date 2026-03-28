import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import { siteLinks } from '../config/siteLinks';

type Language = 'en' | 'ar';

const text = {
  en: {
    title: 'About Islamic Light',
    intro:
      'Islamic Light is a premium bilingual platform dedicated to providing authentic, well-researched, and accessible Islamic knowledge for the modern digital age.',
    sections: [
      {
        title: 'Our Mission',
        body: 'Our mission is to bridge the gap between traditional Islamic scholarship and modern technology. We believe that authentic knowledge should be beautiful, easy to navigate, and available to everyone, regardless of their location or language.',
      },
      {
        title: 'Original Content & Research',
        body: 'Unlike many automated platforms, Islamic Light focuses on curated content. Our articles, daily guidance, and educational quizzes are designed to provide deep insights into Islamic jurisprudence, history, and spiritual growth, moving beyond simple copy-paste texts to offer real value to our community.',
      },
      {
        title: 'Community & Education',
        body: 'We provide integrated tools for worship, including an interactive Quran reader and precise prayer timings. Beyond tools, our community features allow for moderated, respectful discussions where students of knowledge can share benefits and learn together in a safe environment.',
      },
      {
        title: 'Transparency & Trust',
        body: 'We are committed to the highest standards of integrity. All our source references are clearly cited (Quran, Hadith, or scholarly works) to ensure that our visitors can trust the information they read on our platform.',
      },
      {
        title: 'Contact Our Team',
        body: `We are constantly evolving. If you have suggestions, corrections, or would like to contribute as a student of knowledge, please reach out to us at ${siteLinks.supportEmail}.`,
      },
    ],
    back: 'Back to Home',
  },
  ar: {
    title: 'حول النور الإسلامي',
    intro:
      'النور الإسلامي منصة إسلامية ثنائية اللغة متخصصة في تقديم المعرفة الإسلامية الأصيلة والموثوقة والميسرة لتناسب العصر الرقمي الحديث.',
    sections: [
      {
        title: 'رسالتنا',
        body: 'مهمتنا هي سد الفجوة بين العلوم الإسلامية التقليدية والتقنيات الحديثة. نحن نؤمن بأن المعرفة الأصيلة يجب أن تُقدم بجمال وسهولة، وأن تكون متاحة للجميع بغض النظر عن موقعهم أو لغتهم.',
      },
      {
        title: 'محتوى أصيل وبحثي',
        body: 'على عكس العديد من المنصات الآلية، يركز "النور الإسلامي" على المحتوى المنسق والبحثي. تم تصميم مقالاتنا وإرشاداتنا اليومية واختباراتنا التعليمية لتقديم رؤى عميقة في الفقه والتاريخ والتزكية، متجاوزين مجرد نسخ النصوص لتقديم قيمة حقيقية لمجتمعنا.',
      },
      {
        title: 'المجتمع والتعليم',
        body: 'نحن نوفر أدوات متكاملة للعبادة، بما في ذلك قارئ القرآن التفاعلي ومواقيت الصلاة الدقيقة. وبالإضافة إلى الأدوات، تتيح ميزات المجتمع نقاشات محترمة ومدارة حيث يمكن لطلاب العلم تبادل الفوائد والتعلم معاً في بيئة آمنة.',
      },
      {
        title: 'الشفافية والموثوقية',
        body: 'نحن ملتزمون بأعلى معايير النزاهة. يتم استعراض جميع مراجعنا بوضوح (القرآن، الحديث، أو المصادر العلمية) لضمان قدرة زوارنا على الثقة في المعلومات التي يقرؤونها على منصتنا.',
      },
      {
        title: 'تواصل مع فريقنا',
        body: `نحن في تطور مستمر. إذا كانت لديك مقترحات أو تصحيحات أو ترغب في المساهمة كطالب علم، يرجى التواصل معنا عبر: ${siteLinks.supportEmail}`,
      },
    ],
    back: 'العودة للرئيسية',
  },
};

export const AboutPage = ({ lang }: { lang: Language }) => {
  const t = text[lang];

  return (
    <div className="min-h-screen bg-app-bg pt-32 pb-20">
      <div className="container mx-auto px-6">
        <div className={cn('mx-auto max-w-4xl rounded-[2rem] border border-white/10 bg-app-card p-8 md:p-12', lang === 'ar' && 'text-right')}>
          <div className="flex flex-col md:flex-row md:items-center gap-6 mb-12">
            <div className="w-20 h-20 rounded-3xl bg-app-accent/10 flex items-center justify-center text-app-accent text-4xl font-serif">
               IL
            </div>
            <div>
              <h1 className="text-4xl font-serif text-app-text mb-2">{t.title}</h1>
              <div className="h-1 w-20 bg-app-accent rounded-full" />
            </div>
          </div>
          
          <p className="mb-12 text-xl leading-relaxed text-app-text/80 font-medium">{t.intro}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            {t.sections.map((section, idx) => (
              <section key={section.title} className={cn("p-6 rounded-[1.5rem] border border-white/5 bg-white/5 hover:bg-white/10 transition-colors", idx === t.sections.length - 1 && "md:col-span-2")}>
                <h2 className="mb-3 text-lg font-bold text-app-accent uppercase tracking-wider">{section.title}</h2>
                <p className="leading-relaxed text-app-muted text-sm">{section.body}</p>
              </section>
            ))}
          </div>

          <div className="pt-8 border-t border-white/5">
            <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-app-accent hover:underline px-6 py-3 bg-app-accent/10 rounded-2xl transition-all hover:bg-app-accent/20">
              ← {t.back}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

