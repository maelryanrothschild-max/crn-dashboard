// Названия 12 базовых блоков обучения — используется на сервере для отчётов,
// аналитики и ИИ-анализа (полное содержание блоков — в public/app.js).
const BLOCK_META = [
  { key: "greet", title: "Приветствие" },
  { key: "needs", title: "Выявление потребности" },
  { key: "present", title: "Презентация товара" },
  { key: "objections", title: "Работа с возражением" },
  { key: "upsell", title: "Апселл и кросс-селл" },
  { key: "psychology", title: "Психология клиента и цены" },
  { key: "kpi", title: "Метрики и KPI" },
  { key: "responsibility", title: "Ответственность за допродажи" },
  { key: "closing", title: "Дожим клиента" },
  { key: "feedback", title: "Обратная связь" },
  { key: "product", title: "Знание продукта" },
  { key: "service", title: "Премиальный сервис" },
];

module.exports = { BLOCK_META };
