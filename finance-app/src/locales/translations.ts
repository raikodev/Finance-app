export const APP_T: Record<string, any> = {
  en: {
    menu: { dash: "Dashboard", tx: "Transactions", cat: "Categories", bud: "Budgets", ai: "AI Assistant", rep: "Reports", set: "Settings" },
    mode: "Dark Mode",
    ai: { title: "AI Assistant", sub: "I analyze your spending.", type: "Type a message...", send: "Send", greeting: "Hi Ilyar! I'm your AI financial advisor. Ask me about your spending (e.g., 'How much did I spend on food?')." },
    set: { title: "Settings", danger: "Danger Zone", wipe: "Wipe All Data", wipeSub: "Permanently delete all transactions from this browser.", btn: "Delete Everything" }
  },
  pl: {
    menu: { dash: "Panel główny", tx: "Transakcje", cat: "Kategorie", bud: "Budżety", ai: "Asystent AI", rep: "Raporty", set: "Ustawienia" },
    mode: "Tryb Ciemny",
    ai: { title: "Asystent AI", sub: "Analizuję Twoje wydatki.", type: "Napisz wiadomość...", send: "Wyślij", greeting: "Cześć Ilyar! Jestem Twoim doradcą AI. Zapytaj mnie o swoje wydatki (np. 'Ile wydałem na jedzenie?')." },
    set: { title: "Ustawienia", danger: "Strefa zagrożenia", wipe: "Usuń wszystkie dane", wipeSub: "Trwale usuń wszystkie transakcje z tej przeglądarki.", btn: "Usuń wszystko" }
  },
  ru: {
    menu: { dash: "Дашборд", tx: "Транзакции", cat: "Категории", bud: "Бюджеты", ai: "ИИ Ассистент", rep: "Отчеты", set: "Настройки" },
    mode: "Темная тема",
    ai: { title: "ИИ Ассистент", sub: "Я анализирую ваши расходы.", type: "Введите сообщение...", send: "Отправить", greeting: "Привет, Ильяр! Я ваш ИИ-советник. Спросите меня о ваших расходах (например, 'Сколько я потратил на еду?')." },
    set: { title: "Настройки", danger: "Опасная зона", wipe: "Удалить все данные", wipeSub: "Навсегда удалить все транзакции из этого браузера.", btn: "Удалить всё" }
  }
};

// Добавляем к существующему файлу
export const DASHBOARD_T: Record<string, any> = {
  en: {
    welcome: "Welcome back", subtitle: "Here's what's happening with your finances today.", addRecord: "Add Record",
    netBalance: "Net Balance", totalIncome: "Total Income", totalExpenses: "Total Expenses", records: "Records",
    allTime: "All Time", today: "Today", week: "This Week", month: "This Month", custom: "Custom Range",
    spendingOverview: "Spending Overview", incomeVsExpenses: "Income vs Expenses", recentTransactions: "Recent Transactions",
    viewAll: "View all", showLess: "Show less", date: "Date", desc: "Description", category: "Category", type: "Type",
    amount: "Amount", action: "Action", save: "Save Record", cancel: "Cancel", search: "Search currency...",
    incomeType: "Income", expenseType: "Expense", noTransactions: "No transactions yet. Add a record to get started!",
    catHousing: "Housing", catFood: "Food", catTransport: "Transport", catEntertainment: "Entertainment", catOther: "Other", catIncome: "Income"
  },
  pl: {
    welcome: "Witaj ponownie", subtitle: "Oto, co dzieje się dzisiaj z Twoimi finansami.", addRecord: "Dodaj wpis",
    netBalance: "Saldo netto", totalIncome: "Suma przychodów", totalExpenses: "Suma wydatków", records: "Wpisy",
    allTime: "Cały czas", today: "Dzisiaj", week: "W tym tygodniu", month: "W tym miesiącu", custom: "Własny zakres",
    spendingOverview: "Przegląd wydatków", incomeVsExpenses: "Przychody vs Wydatki", recentTransactions: "Ostatnie transakcje",
    viewAll: "Zobacz wszystko", showLess: "Pokaż mniej", date: "Data", desc: "Opis", category: "Kategoria", type: "Typ",
    amount: "Kwota", action: "Akcja", save: "Zapisz", cancel: "Anuluj", search: "Szukaj waluty...",
    incomeType: "Przychód", expenseType: "Wydatek", noTransactions: "Brak transakcji. Dodaj wpis, aby zacząć!",
    catHousing: "Mieszkanie", catFood: "Jedzenie", catTransport: "Transport", catEntertainment: "Rozrywka", catOther: "Inne", catIncome: "Przychód"
  },
  ru: {
    welcome: "С возвращением", subtitle: "Вот что происходит с вашими финансами сегодня.", addRecord: "Добавить",
    netBalance: "Чистый баланс", totalIncome: "Всего доходов", totalExpenses: "Всего расходов", records: "Записи",
    allTime: "За все время", today: "Сегодня", week: "За неделю", month: "За месяц", custom: "Выбрать даты",
    spendingOverview: "Обзор расходов", incomeVsExpenses: "Доходы и расходы", recentTransactions: "Последние транзакции",
    viewAll: "Смотреть все", showLess: "Скрыть", date: "Дата", desc: "Описание", category: "Категория", type: "Тип",
    amount: "Сумма", action: "Действие", save: "Сохранить", cancel: "Отмена", search: "Поиск валюты...",
    incomeType: "Доход", expenseType: "Расход", noTransactions: "Пока нет транзакций. Добавьте запись!",
    catHousing: "Жилье", catFood: "Еда", catTransport: "Транспорт", catEntertainment: "Развлечения", catOther: "Другое", catIncome: "Доход"
  }
};