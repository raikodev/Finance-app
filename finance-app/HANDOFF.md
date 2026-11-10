# HANDOFF — Finance App

Документ для передачи проекта другому разработчику/агенту.
Актуален на: **10 ноября 2026** (сборка стабилизирована, линт закрыт).

---

## 1. Что это за проект

Личный финансовый дашборд (React SPA): транзакции, категории, бюджеты, отчёты,
AI-инсайты, «сканер чеков», настройки. Интерфейс на трёх языках: **en / ru / pl**,
оранжевый акцент, тёмная и светлая темы.

**Стек:** React 19, TypeScript 6, Vite 8, Tailwind CSS v4, Zustand 5,
i18next/react-i18next, framer-motion, recharts, react-hot-toast, Lenis.

> ✅ Пакет `lenis` (актуальная замена deprecated `@studio-freight/lenis`)
> объявлен в `finance-app/package.json`. Корневые `package.json`,
> `package-lock.json` и `node_modules` удалены — приложение собирается
> полностью независимо и не тянет дубли `react-router-dom`/`zustand`.

---

## 2. Как запустить

```bash
cd finance-app
npm install            # зависимости приложения
npm run dev            # http://localhost:5173
npm run build          # production-сборка (vite build)
npm run preview        # локальный просмотр dist
npx tsc -p tsconfig.app.json --noEmit   # проверка типов (или npm run typecheck)
npx eslint src         # линт только рабочего кода (или npm run lint)
npm test               # Vitest: unit-тесты утилит
npm run test:watch     # тесты в watch-режиме
```

Все команды выше выполняются из `finance-app` — отдельный `npm install`
в корне репозитория больше не нужен для сборки приложения.

Переменные окружения (`finance-app/.env`, в git **не** коммитится):

```
VITE_GEMINI_API_KEY=...
```

Ключ используется только для dev-сканера чеков. В production-сборке вызов
Gemini намеренно заблокирован (см. `src/services/receiptScanner.ts`).

---

## 3. Структура

```
finance-app/
├─ src/
│  ├─ App.tsx                 # роутинг, RequireAuth, Lenis, ErrorBoundary
│  ├─ main.tsx                # bootstrap
│  ├─ index.css               # Tailwind v4, темы, скроллбары, print-CSS
│  ├─ pages/                  # Dashboard, Transactions, Categories, Budgets,
│  │                          # Reports, AIAssistant, Settings, Auth, Landing
│  ├─ components/             # Sidebar, ChartsSection, StatsGrid, StatCard,
│  │                          # TransactionList, TransactionModal, AIHub,
│  │                          # CustomDatePicker, ConfirmDialog
│  ├─ store/                  # zustand-сторы (см. таблицу ниже)
│  ├─ hooks/                  # useDashboardData, useDebounce, useFocusTrap
│  ├─ services/               # receiptScanner (Gemini), exchangeRates (Frankfurter)
│  ├─ utils/                  # currency, categories, export, userBudgets,
│  │                          # storageKeys, merchantIcons, math, money
│  └─ i18n/
│     ├─ index.ts
│     └─ locales/{en,ru,pl}.ts
├─ public/                    # статика
└─ HANDOFF.md                 # этот файл
```

Репозиторий (git) — на уровень выше: `C:\Users\ilyar\Documents\analitic bank`.
Там же лежат только `vercel.json`, `.github/workflows/ci.yml` и `finance-app`
(корневых `package.json`/`node_modules` больше нет).

---

## 4. Состояние данных (localStorage)

| Ключ | Где объявлен | Что хранит |
|---|---|---|
| `clarity-transactions-v1` | `store/useTransactionStore.ts` | Все транзакции (persist) |
| `clarity_user_budgets` | `utils/storageKeys.ts` | Бюджеты (не zustand) |
| `clarity-custom-categories` | `store/useCategoryStore.ts` | Пользовательские категории |
| `nickel-app-settings-v1` | `store/useAppStore.ts` | Тема, язык, валюта |
| `auth-session` | `store/useAuthStore.ts` | «Сессия» пользователя (фейковая) |
| `finance-ai-chat-v1` | `store/useChatStore.ts` | История чата (до 100 сообщений) |
| `clarity-notification-preferences` | `store/useNotificationStore.ts` | Тумблеры уведомлений |

**Важно:** транзакции сохраняются. Демо-транзакции из
`INITIAL_TRANSACTIONS` показываются только при первом запуске (пока ключ
`clarity-transactions-v1` не создан). После «Удалить всё» массив сохраняется
пустым и демо больше не возвращается.

---

## 5. Архитектурные правила (соблюдать при доработках)

1. **Локализация обязательна.** Любая новая строка добавляется в
   `src/i18n/locales/en.ts`, `ru.ts`, `pl.ts`. Сырые ключи (`categories.foo`) в UI —
   баг. Плюрализация: `_one/_few/_many/_other` по правилам языка.
2. **Названия встроенных категорий** переводятся через
   `getCategoryLabel(t, name)` и секцию `categoryNames`; пользовательские
   категории остаются как введены.
3. **Валюта.** Любая агрегация сумм — только через
   `convertAmount(amount, from, to, rates)` из `utils/currency.ts`.
   Складывать `tx.amount` напрямую нельзя.
4. **Скролл.** Глобально инициализирован Lenis. Любой внутренний
   скролл-контейнер (модалки, дропдауны, списки) должен иметь
   `data-lenis-prevent`, иначе колесо мыши не работает.
5. **Темы.** Использовать пары `bg-white dark:bg-[#121214]`,
   акцент — `orange-500/600`. Не добавлять новые палитры без нужды.
6. **Сторы.** Данные — в zustand с `persist` и `partialize` (функции и
   служебные флаги в localStorage не пишутся). Бюджеты — исключение:
   отдельный слой `utils/userBudgets.ts`.
7. **Обратная связь.** Действия подтверждаются `react-hot-toast`, удаления
   и выход — через `components/ConfirmDialog.tsx` (`window.confirm` не используем).
8. **Модалки.** Закрытие по Escape, focus-trap (`hooks/useFocusTrap.ts`),
   блокировка `body`-скролла, `data-lenis-prevent` на контенте.
9. **`t` на дашборде — это объект**, а не функция: `useDashboardData`
   собирает `DashboardTranslations` для `StatsGrid`/`ChartsSection`.
   Новые строки дашборда добавляются в интерфейс и в `useMemo` хука.

---

## 6. Что сделано в этой итерации

### Данные
- Транзакции переведены на `persist` (`clarity-transactions-v1`).
- «Удалить всё» теперь чистит транзакции, чат, категории, бюджеты,
  настройки и уведомления.
- Бюджеты вынесены в `utils/userBudgets.ts` (единый формат чтения/записи).

### UI/UX
- Полноценное создание бюджетов (модалка, кастомный dropdown категорий,
  удаление, пустое состояние), i18n для en/ru/pl.
- Переработанная модалка новой категории: 10 цветов + свой hex,
  выбор иконки, тип expense/income, live-валидация, превью.
- Удаление пользовательских категорий (встроенные защищены).
- Кастомный `ConfirmDialog` вместо `window.confirm`: роли `alertdialog`,
  Escape, клик по подложке, focus-trap, возврат фокуса на триггер.
- Focus-trap во всех модалках (`TransactionModal`, категории, бюджеты).
- `prefers-reduced-motion`: Lenis не запускается, framer-motion работает
  в reduced-режиме (`MotionConfig reducedMotion="user"`), CSS-анимации гасятся.
- Сессия автоматически завершается по `sessionExpiresAt` даже без перезагрузки.
- Графики дашборда загружаются лениво отдельным чанком (`ChartsSection`),
  со скелетоном-заглушкой.
- Демо-транзакции используют нейтральные бренды (`Stripe`, `AWS`, `Vercel`,
  `Uber`) вместо английских фраз вроде «Uber Rides».
- Исправлен скролл колесом во всех модалках/дропдаунах:
  `data-lenis-prevent` + блокировка body + Escape.
- Новые категории с транзакциями корректно отображаются в своих вкладках.

### Экспорт и отчёты
- CSV: добавлена колонка **Currency**, локализованы заголовки,
  тип (Доход/Расход) и сообщения об ошибках.
- «Export PDF» (`window.print()`) теперь печатает **только отчёт**:
  print-CSS в `index.css`, `data-print-report` / `data-print-hide`,
  светлая печать даже в тёмной теме, `:has()` не ломает печать других страниц.

### Курсы и настройки
- При ошибке загрузки курсов на дашборде появляется предупреждение
  с кнопкой retry (`fetchRates(true)` игнорирует часовой кэш).
- Тумблеры уведомлений сохраняются в localStorage.

### Чистка и зависимости
- Миграция на пакет `lenis` (`@studio-freight/lenis` deprecated).
- Удалены мёртвые папки `src_old/` (39 файлов) и `public_old/` (3 файла).
- Удалены неиспользуемые зависимости: `@react-three/drei`,
  `@react-three/fiber`, `three`, `@types/three`.
- Исправлены ошибки TypeScript: лишний проп `t` в `TransactionList`,
  неиспользуемые импорты в `useAuthStore`, `any` в auth.
- Удалён фейковый `prevExpense` (он не использовался графиком).
- Закрыты все ошибки/предупреждения ESLint: `convertAmount` в
  `useCallback`, тултип графика вынесен из рендера, `CustomDatePicker`
  без `any` и `setState`-в-эффекте, `useDebounce` без каскадного рендера,
  `TransactionModal` типизирован и локализован.

### Проверки на момент передачи
- `npx tsc -p tsconfig.app.json --noEmit` — **0 ошибок**.
- `npm run build` — **успешно**.
- `npm run lint` — **0 ошибок / 0 предупреждений**.
- `npm test` — **34 теста, 4 файла, все зелёные**.

---

## 7. Известные проблемы и что осталось

### 🔴 Критично (нужен бэкенд)

1. **Аутентификация фейковая.**
   `store/useAuthStore.ts`: любой пароль ≥ 6 символов, пользователь в
   localStorage, данные не привязаны к аккаунту. После logout/login видны
   те же транзакции. Нужен реальный провайдер (Supabase/Firebase/свой API).

2. **Сканер чеков не работает в production.**
   `services/receiptScanner.ts`: ключ `VITE_GEMINI_API_KEY` попадает в бандл,
   поэтому в `PROD` вызов заблокирован. Нужен серверный прокси
   `POST /api/scan-receipt` (Vercel Function и т.п.).

3. **AI Assistant — не ИИ.**
   `pages/AIAssistant.tsx`, `generateAIResponse`: набор `if (q.includes(...))`.
   Либо подключать реальный LLM, либо переименовать фичу.

### 🟠 Функциональные

4. ✅ **LandingPage локализован.** Весь текст (навигация, hero, фичи,
   шаги, AI-блок, CTA, футер) вынесен в секцию `landing` локалей
   en/ru/pl. `/` — первая страница для нового пользователя.

5. **Уведомления не отправляются.**
   Настройки теперь персистятся, но backend-рассылки нет. Тумблеры —
   только сохранение предпочтений.

6. ✅ **Демо-бюджеты больше не возвращаются после «Удалить всё».**
   `clearUserBudgets()` записывает пустой массив, а не удаляет ключ: пустое
   хранилище остаётся признаком только первого запуска, когда демо уместно.

7. ✅ **Сессия истекает и в открытой вкладке.**
   `hooks/useSessionExpiry.ts` ставит таймер на `sessionExpiresAt`,
   перепроверяет срок при возврате фокуса/вкладки и разлогинивает с
   локализованным тостом. `onRehydrateStorage` по-прежнему отсекает
   просроченную сессию при загрузке.

8. ✅ **Удалённая категория сохраняет цвет и иконку в старых транзакциях.**
   `addTransaction` пишет в `Transaction` снапшот `categoryColor/categoryIcon`,
   а `TransactionList` рендерит его через `getCategoryMetaFromSnapshot`.
   Транзакции, созданные до этого изменения, снапшота не имеют и до сих пор
   используют живой стор/фолбэк — восстановить их прежний вид нельзя.

### 🟡 Техдолг

9. ✅ **Корневые зависимости удалены.** `package.json`, `package-lock.json`
   и `node_modules` на уровень выше больше не существуют; `npm install`
   и все команды выполняются только из `finance-app`.

10. **ESLint — чисто.** 0 ошибок / 0 предупреждений в `src`.
    `convertAmount` обёрнут в `useCallback`, тултип графика вынесен из
    рендера, `CustomDatePicker` больше не использует `any` и `setState`
    в эффекте. В `TransactionModal` намеренный сброс формы при открытии
    помечен точечным `eslint-disable react-hooks/set-state-in-effect`.

11. ✅ **Тесты и CI добавлены.** Vitest-тесты для `utils/currency`,
    `utils/money`, `utils/export`, `utils/userBudgets` (34 теста).
    GitHub Actions workflow: `.github/workflows/ci.yml` в корне репозитория
    (typecheck → lint → test → build).

12. ✅ **Графики вынесены из чанка Dashboard.** `recharts` грузится лениво
    через `React.lazy(() => import('../components/ChartsSection'))`:
    Dashboard ≈ 42 kB, отдельный `ChartsSection` ≈ 367 kB (gzip ≈ 106 kB).

13. ✅ **Мелочи UX закрыты:** кастомный `ConfirmDialog`, focus-trap,
    `prefers-reduced-motion` и нейтральные демо-данные. Мусорный
    комментарий в `utils/currency.ts` тоже убран.

---

## 8. Ручной чек-лист перед релизом

- [ ] Добавить транзакцию → F5 → транзакция на месте, демо не вернулось.
- [ ] Создать бюджет → F5 → бюджет на месте.
- [ ] Создать категорию (цвет/иконка/тип) → добавить по ней транзакцию.
- [ ] Удалить категорию, у которой есть бюджет → бюджет исчез, транзакции остались.
- [ ] «Удалить всё» → после входа пусто: транзакции, бюджеты, категории, чат.
- [ ] Экспорт CSV из Settings и Transactions → есть колонка «Валюта», заголовки на текущем языке.
- [ ] Reports → Export PDF → печатается только отчёт, без сайдбара и кнопок.
- [ ] Переключить en/ru/pl на всех экранах → нет сырых ключей и английских вставок.
- [ ] Тёмная тема: модалки, дропдауны, таблицы, тосты читаемы.
- [ ] Колесо мыши внутри модалок/дропдаунов прокручивает контент, а не страницу.
- [ ] Отключить интернет → на дашборде появилась плашка курсов, retry работает.

---

## 9. Git / передача

- Ветка: `main`.
- Последний коммит: `44c8889 fix: misc bugs from code review — i18n gaps, dead code, a11y, UI polish`.
- В рабочем дереве много **незакоммиченных** изменений:
  правки этой итерации + ранее созданные `src/i18n`, новые сторы,
  утилиты, тесты (`src/utils/*.test.ts`) и `.github/workflows/ci.yml`.
  Также зафиксировать удаление корневых `package.json`, `package-lock.json`
  и `node_modules`.
- `src/locales/translations.ts` удалён (заменён на `src/i18n/locales/*`).
- Добавлен `vitest` в devDependencies, скрипты `test`, `test:watch`, `typecheck`.
- `.env` игнорируется и в репозиторий не попадает — ключ Gemini нужно
  запросить отдельно.

Перед передачей рекомендуется:

```bash
cd "C:\Users\ilyar\Documents\analitic bank"
git add -A
git commit -m "chore: lenis migration, zero lint, landing i18n, unit tests and CI"
```

---

## 10. Рекомендуемый порядок следующих работ

1. ✅ **Сборка стабилизирована:** миграция на `lenis` внутри
   `finance-app`; мёртвые корневые зависимости удалены.
2. ✅ **Линт закрыт:** `npx eslint src` — 0 проблем.
3. ✅ **Тесты + CI добавлены:** Vitest (`npm test`) и
   `.github/workflows/ci.yml` (typecheck/lint/test/build).
4. ✅ **i18n лендинга** — готово (секция `landing` в локалях).
5. **Бэкенд:** auth + привязка данных к пользователю.
6. **Прокси Gemini** и реальный AI-чат.
7. ✅ **Полировка UX:** `ConfirmDialog`, focus-trap, `prefers-reduced-motion`,
   ленивые графики, нейтральные демо-данные.

---

## 11. Полезные точки входа

| Задача | Файл |
|---|---|
| Роутинг / guard | `src/App.tsx` |
| Добавить перевод | `src/i18n/locales/*.ts` |
| Логика дашборда | `src/hooks/useDashboardData.ts` |
| Конвертация валют | `src/utils/currency.ts`, `src/store/useExchangeRatesStore.ts` |
| Цвета/иконки категорий | `src/utils/categories.ts`, `src/store/useCategoryStore.ts` |
| Бюджеты | `src/pages/BudgetsPage.tsx`, `src/utils/userBudgets.ts` |
| CSV | `src/utils/export.ts` |
| Печать отчёта | `src/pages/ReportsPage.tsx`, `src/index.css` (`@media print`) |
| Сканер чеков | `src/services/receiptScanner.ts` |
| Авторизация | `src/store/useAuthStore.ts`, `src/pages/AuthPage.tsx` |
