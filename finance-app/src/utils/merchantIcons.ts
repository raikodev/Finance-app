import {
  Coffee, ShoppingCart, Shirt, Smartphone, Fuel, UtensilsCrossed,
  Pill, Dumbbell, Plane, Film, Wifi, Car, BookOpen, Scissors,
  type LucideIcon
} from 'lucide-react';

// ============================================================================
// ИКОНКИ ПО ТИПУ МАГАЗИНА/ЗАВЕДЕНИЯ
// ============================================================================
// Никаких настоящих логотипов брендов — это чужие товарные знаки.
// Вместо этого — общие иконки по типу заведения (кофейня, продукты, одежда...).
// Названия конкретных сетей (Żabka, Biedronka, Lidl и т.п.) используются
// только как текстовые ключевые слова для определения ТИПА магазина — сами
// логотипы/брендинг нигде не отображаются.
// ============================================================================

interface MerchantTypeMatch {
  keywords: string[];
  icon: LucideIcon;
}

const MERCHANT_TYPES: MerchantTypeMatch[] = [
  {
    // Кофейни
    keywords: ['coffee', 'cafe', 'café', 'kawiarnia', 'кофейня', 'кофе', 'starbucks', 'costa', 'cofix'],
    icon: Coffee,
  },
  {
    // Продуктовые магазины / супермаркеты
    keywords: [
      'grocery', 'supermarket', 'market', 'sklep spo', 'produkty',
      'продукт', 'супермаркет', 'магазин продук',
      'żabka', 'zabka', 'biedronka', 'lidl', 'carrefour', 'auchan',
      'tesco', 'kaufland', 'aldi', 'pyaterochka', 'пятёрочка', 'магнит'
    ],
    icon: ShoppingCart,
  },
  {
    // Рестораны / доставка еды
    keywords: [
      'restaurant', 'restauracja', 'ресторан', 'kuchnia', 'кухня',
      'pizza', 'sushi', 'суши', 'kebab', 'кебаб', 'bar', 'bistro',
      'glovo', 'uber eats', 'wolt', 'bolt food', 'delivery'
    ],
    icon: UtensilsCrossed,
  },
  {
    // Одежда / обувь
    keywords: [
      'clothing', 'clothes', 'odzież', 'odziez', 'одежда', 'обувь',
      'fashion', 'zara', 'h&m', 'reserved', 'boutique'
    ],
    icon: Shirt,
  },
  {
    // Электроника
    keywords: [
      'electronics', 'elektronika', 'электроника', 'phone', 'laptop',
      'media markt', 'rtv euro', 'apple store', 'samsung'
    ],
    icon: Smartphone,
  },
  {
    // АЗС / топливо
    keywords: ['fuel', 'gas station', 'petrol', 'paliwo', 'stacja', 'азс', 'бензин', 'orlen', 'shell', 'bp '],
    icon: Fuel,
  },
  {
    // Аптека / здоровье
    keywords: ['pharmacy', 'apteka', 'аптека', 'drogeria', 'health', 'клиника', 'clinic'],
    icon: Pill,
  },
  {
    // Спортзал / фитнес
    keywords: ['gym', 'fitness', 'siłownia', 'silownia', 'спортзал', 'фитнес', 'yoga'],
    icon: Dumbbell,
  },
  {
    // Путешествия
    keywords: ['airline', 'flight', 'lot ', 'ryanair', 'wizzair', 'авиа', 'самолёт', 'hotel', 'отель', 'booking'],
    icon: Plane,
  },
  {
    // Кино / развлечения
    keywords: ['cinema', 'kino', 'кино', 'netflix', 'spotify', 'entertainment', 'театр', 'theatre'],
    icon: Film,
  },
  {
    // Связь / интернет
    keywords: ['telecom', 'internet', 'mobile', 'orange pl', 'play', 't-mobile', 'связь', 'интернет-провайдер'],
    icon: Wifi,
  },
  {
    // Такси / каршеринг
    keywords: ['taxi', 'такси', 'uber', 'bolt', 'car rental', 'парковка', 'parking'],
    icon: Car,
  },
  {
    // Книги / канцелярия
    keywords: ['book', 'książka', 'ksiazka', 'книга', 'stationery', 'канцеляр', 'empik'],
    icon: BookOpen,
  },
  {
    // Парикмахерская / салон красоты
    keywords: ['salon', 'barber', 'парикмахер', 'fryzjer', 'спа', 'spa'],
    icon: Scissors,
  },
];

/**
 * Определяет иконку по названию/описанию транзакции (например, "Żabka" или
 * "Starbucks Coffee"), сравнивая ключевые слова без учёта регистра.
 * Возвращает null, если совпадений не найдено — тогда стоит откатиться
 * на иконку категории (getCategoryMeta).
 */
export function getMerchantIcon(description: string): LucideIcon | null {
  if (!description) return null;
  const desc = description.toLowerCase();

  for (const type of MERCHANT_TYPES) {
    if (type.keywords.some(keyword => desc.includes(keyword))) {
      return type.icon;
    }
  }
  return null;
}
