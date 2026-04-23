import React, { createContext, useContext, useEffect, useState } from 'react';

export type Lang = 'en' | 'ar';

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: keyof typeof DICT.en) => string;
};

const DICT = {
  en: {
    topic_label: 'Your topic',
    topic_ph: 'e.g. Eid Mubarak for my family',
    continue: 'Continue',
    back: 'Back',
    select_occasion: 'Select an occasion',
    discover: 'Discover references',
    style: 'Choose style',
    refine: 'Refine with AI',
    variants: 'Pick a variant',
    animate: 'Animate',
    share: 'Share',
    use_this: 'Use this',
    improve: 'Improve',
    analyzing: 'Analyzing with VisionStruct…',
    language: 'Language',
  },
  ar: {
    topic_label: 'الموضوع',
    topic_ph: 'مثال: عيد مبارك لعائلتي',
    continue: 'متابعة',
    back: 'رجوع',
    select_occasion: 'اختر المناسبة',
    discover: 'اكتشف المراجع',
    style: 'اختر النمط',
    refine: 'حسّن بالذكاء الاصطناعي',
    variants: 'اختر نسخة',
    animate: 'تحريك',
    share: 'مشاركة',
    use_this: 'استخدم',
    improve: 'تحسين',
    analyzing: 'يتم التحليل باستخدام VisionStruct…',
    language: 'اللغة',
  },
} as const;

const LanguageContext = createContext<Ctx>({
  lang: 'en',
  setLang: () => {},
  t: (k) => DICT.en[k],
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>(() =>
    (localStorage.getItem('lawha_lang') as Lang) || 'en'
  );

  useEffect(() => {
    localStorage.setItem('lawha_lang', lang);
    document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', lang);
  }, [lang]);

  const t = (key: keyof typeof DICT.en) => DICT[lang][key] ?? DICT.en[key];

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
      <LangToggle lang={lang} setLang={setLang} />
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

function LangToggle({ lang, setLang }: { lang: Lang; setLang: (l: Lang) => void }) {
  return (
    <button
      onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
      style={{
        position: 'fixed',
        top: 16,
        insetInlineEnd: 16,
        zIndex: 10000,
        padding: '6px 12px',
        background: 'rgba(13,11,39,0.9)',
        border: '1px solid rgba(201,168,76,0.35)',
        borderRadius: 999,
        color: '#C9A84C',
        fontSize: 12,
        fontFamily: 'Cinzel, serif',
        letterSpacing: 1.2,
        backdropFilter: 'blur(12px)',
      }}
      aria-label="Toggle language"
    >
      {lang === 'en' ? 'العربية' : 'EN'}
    </button>
  );
}
