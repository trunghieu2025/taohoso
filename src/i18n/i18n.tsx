import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import vi from './vi.json';
import en from './en.json';
import ja from './ja.json';
import ko from './ko.json';
import zh from './zh.json';

export type Lang = 'vi' | 'en' | 'ja' | 'ko' | 'zh';

export const LANGUAGES: { code: Lang; label: string; flag: string }[] = [
    { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'ja', label: '日本語', flag: '🇯🇵' },
    { code: 'ko', label: '한국어', flag: '🇰🇷' },
    { code: 'zh', label: '中文', flag: '🇨🇳' },
];

const translations: Record<Lang, Record<string, string>> = { vi, en, ja, ko, zh };

/* ── Context ── */
interface LangCtx {
    lang: Lang;
    setLang: (l: Lang) => void;
    t: (key: string, fallback?: string) => string;
}

const LanguageContext = createContext<LangCtx>({
    lang: 'vi',
    setLang: () => {},
    t: (key) => key,
});

/* ── Provider ── */
const STORAGE_KEY = 'app_language';

function getSavedLang(): Lang {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved && ['vi', 'en', 'ja', 'ko', 'zh'].includes(saved)) return saved as Lang;
    } catch { /* ignore */ }
    return 'vi';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [lang, setLangState] = useState<Lang>(getSavedLang);

    const setLang = useCallback((l: Lang) => {
        setLangState(l);
        try { localStorage.setItem(STORAGE_KEY, l); } catch { /* ignore */ }
    }, []);

    const t = useCallback((key: string, fallback?: string): string => {
        return translations[lang]?.[key] || translations['vi']?.[key] || fallback || key;
    }, [lang]);

    return (
        <LanguageContext.Provider value={{ lang, setLang, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

/* ── Hooks ── */
export function useT() {
    const { t } = useContext(LanguageContext);
    return t;
}

export function useLanguage() {
    const { lang, setLang } = useContext(LanguageContext);
    return { lang, setLang };
}
