// Начальный (демо) список сотрудников. После первого деплоя директор/модератор
// добавляет реальных людей через вкладку «Сотрудники» (вручную или загрузкой
// из Excel) — эти данные хранятся в базе данных и переживают перезапуски и
// обновления сайта.
const DEFAULT_ROSTER = [
  { id: "1001", surname: "Ахметова", firstname: "Динара", role: "stylist", pin: "1001", city: "Алматы", store: "Mega Almaty", brand: "CORNELI" },
  { id: "1002", surname: "Серикова", firstname: "Аружан", role: "stylist", pin: "1002", city: "Алматы", store: "Dostyk Plaza", brand: "CRINZO" },
  { id: "1003", surname: "Тулегенов", firstname: "Ерлан", role: "stylist", pin: "1003", city: "Астана", store: "Khan Shatyr", brand: "CORNELI" },
  { id: "1004", surname: "Жумабаева", firstname: "Салтанат", role: "stylist", pin: "1004", city: "Шымкент", store: "Мега Шымкент", brand: "CRINZO" },
  { id: "1005", surname: "Байжанов", firstname: "Нурлан", role: "admin", pin: "1005", city: "Алматы", store: "Mega Almaty", brand: "CORNELI" },
  { id: "1006", surname: "Касымова", firstname: "Гульмира", role: "admin", pin: "1006", city: "Астана", store: "Khan Shatyr", brand: "CRINZO" },
  { id: "1007", surname: "Оразбеков", firstname: "Асхат", role: "director", pin: "1007", city: "Алматы", store: "Все магазины", brand: "CORNELI / CRINZO" },
  { id: "2011", surname: "Ротшильд", firstname: "Маэльреян", role: "moderator", pin: "2011", city: "Алматы", store: "Все магазины", brand: "CORNELI / CRINZO" },
];

module.exports = { DEFAULT_ROSTER };
