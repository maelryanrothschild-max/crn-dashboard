const { PROFESSIONAL_TRACK } = require("./professionalTrack");

// Core CRN sales/service modules plus protected professional stylist track.
const CORE_BLOCK_META = [
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

const PROFESSIONAL_BLOCK_META = PROFESSIONAL_TRACK.map((b) => ({ key: b.key, title: b.title }));
const BLOCK_META = CORE_BLOCK_META.concat(PROFESSIONAL_BLOCK_META);

module.exports = { BLOCK_META, CORE_BLOCK_META, PROFESSIONAL_BLOCK_META };
