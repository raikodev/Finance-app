import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en';
import ru from './locales/ru';
import pl from './locales/pl';

// Единая точка инициализации i18next. Язык на старте всегда 'en' —
// реальный (сохранённый в useAppStore/localStorage) язык применяется
// эффектом в App.tsx сразу после монтирования, см. App.tsx.
i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ru: { translation: ru },
      pl: { translation: pl },
    },
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React и так экранирует значения — двойное экранирование не нужно
    },
    // Явно перечисляем плюральные формы для ru (one/few/many/other по CLDR),
    // чтобы i18next не полагался на угадывание по имени языка
    returnEmptyString: false,
  });

export default i18n;
