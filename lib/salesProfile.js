// CRN Sales Profile — developmental workplace self-assessment, not a clinical or psychological diagnosis.
// 1..5 Likert responses. Some items are reverse-scored to reduce acquiescence bias.

const DIMENSIONS = {
  emotion_awareness: { title: "Эмоциональная осознанность", desc: "Насколько сотрудник замечает своё состояние и его влияние на работу." },
  emotion_regulation: { title: "Эмоциональная устойчивость", desc: "Насколько быстро сотрудник возвращается в рабочее состояние после напряжения или отказа." },
  empathy: { title: "Эмпатия в сервисе", desc: "Насколько сотрудник замечает сигналы клиента и адаптирует взаимодействие." },
  sales_confidence: { title: "Уверенность в рекомендации", desc: "Насколько свободно сотрудник предлагает решения и более дорогие/полные варианты без давления." },
  initiative: { title: "Инициативность", desc: "Насколько сотрудник сам развивает продажу, а не только отвечает на прямой запрос." },
  rejection_resilience: { title: "Устойчивость к отказу", desc: "Насколько отказ клиента не снижает качество следующего контакта." },
  learning_orientation: { title: "Обучаемость", desc: "Насколько сотрудник использует обратную связь и ошибки для улучшения." },
  service_motivation: { title: "Мотивация через клиентский результат", desc: "Насколько сотрудника включает сам процесс помощи клиенту и достижения результата." },
};

const ITEMS = [
  ["q01","emotion_awareness","Я обычно замечаю момент, когда начинаю раздражаться или терять энергию во время смены.",false],
  ["q02","emotion_awareness","После сложного клиента мне трудно понять, что именно повлияло на моё состояние.",true],
  ["q03","emotion_awareness","Я понимаю, в какие моменты начинаю говорить слишком быстро или слишком много.",false],
  ["q04","emotion_awareness","Я могу назвать ситуации в продаже, которые чаще всего выбивают меня из рабочего состояния.",false],
  ["q05","emotion_awareness","Обычно я не замечаю изменения своего настроения, пока это не скажется на общении.",true],

  ["q06","emotion_regulation","После неприятного отказа я могу достаточно быстро вернуться к нормальному качеству сервиса.",false],
  ["q07","emotion_regulation","Если клиент разговаривает резко, мне сложно не переносить это на следующий диалог.",true],
  ["q08","emotion_regulation","В напряжённой ситуации я умею замедлиться и выбрать более точную реакцию.",false],
  ["q09","emotion_regulation","Когда магазин перегружен, я чаще теряю качество общения.",true],
  ["q10","emotion_regulation","Я знаю несколько способов быстро восстановить концентрацию во время смены.",false],

  ["q11","empathy","Я замечаю, когда клиенту становится слишком много информации.",false],
  ["q12","empathy","Если клиент мало говорит, я обычно считаю, что ему ничего не нужно.",true],
  ["q13","empathy","Я меняю стиль общения, если вижу, что клиент реагирует не так, как ожидал.",false],
  ["q14","empathy","Мне легко заметить, что для клиента важнее: скорость, детали, эмоция или уверенность в выборе.",false],
  ["q15","empathy","Я редко обращаю внимание на невербальную реакцию клиента во время примерки.",true],

  ["q16","sales_confidence","Мне комфортно предложить более дорогой вариант, если я понимаю, почему он лучше решает задачу клиента.",false],
  ["q17","sales_confidence","Иногда я не показываю вещь, потому что заранее думаю, что клиенту будет дорого.",true],
  ["q18","sales_confidence","Я спокойно предлагаю Complete Look даже если клиент пришёл за одной вещью.",false],
  ["q19","sales_confidence","Мне бывает неловко сделать вторую рекомендацию после первого отказа.",true],
  ["q20","sales_confidence","Я умею объяснить ценность вещи без опоры на скидку.",false],

  ["q21","initiative","Если клиент долго смотрит самостоятельно, я ищу подходящий момент для полезного контакта.",false],
  ["q22","initiative","Я чаще жду, пока клиент сам попросит дополнительную вещь.",true],
  ["q23","initiative","Перед сменой я заранее продумываю несколько готовых образов и сочетаний.",false],
  ["q24","initiative","Если нужной модели нет, я активно ищу альтернативу или сервисное решение.",false],
  ["q25","initiative","После продажи я редко думаю о следующем персональном касании с клиентом.",true],

  ["q26","rejection_resilience","Отказ одного клиента почти не влияет на мою уверенность со следующим.",false],
  ["q27","rejection_resilience","Несколько отказов подряд заметно снижают моё желание проявлять инициативу.",true],
  ["q28","rejection_resilience","Я воспринимаю отказ как информацию о критериях клиента, а не как личную неудачу.",false],
  ["q29","rejection_resilience","После неудачной продажи я долго прокручиваю её и хуже концентрируюсь.",true],
  ["q30","rejection_resilience","Я умею разобрать отказ и быстро сформулировать, что попробую иначе в следующий раз.",false],

  ["q31","learning_orientation","Мне полезно, когда директор разбирает со мной конкретные ошибки в диалоге.",false],
  ["q32","learning_orientation","Если тест или продажа не получились, я стараюсь понять причину, а не просто забыть ситуацию.",false],
  ["q33","learning_orientation","Обратная связь часто воспринимается мной как придирка.",true],
  ["q34","learning_orientation","Я пробую новые техники продаж и сравниваю результат.",false],
  ["q35","learning_orientation","Мне проще работать привычным способом, даже если показатели показывают, что он неэффективен.",true],

  ["q36","service_motivation","Мне нравится момент, когда клиент в зеркале понимает: «это мой образ».",false],
  ["q37","service_motivation","Мне интересно узнавать постоянных клиентов и запоминать их предпочтения.",false],
  ["q38","service_motivation","Если нет перспективы большой продажи, мне заметно сложнее сохранять высокий уровень сервиса.",true],
  ["q39","service_motivation","Меня мотивирует ощущение, что я помог человеку решить реальную задачу гардероба.",false],
  ["q40","service_motivation","Мне нравится собирать образы и находить неожиданные, но уместные сочетания.",false],
].map(([id,dimension,text,reverse])=>({id,dimension,text,reverse}));

function scoreProfile(responses = {}) {
  const buckets = {};
  for (const key of Object.keys(DIMENSIONS)) buckets[key] = [];
  let answered = 0;
  for (const item of ITEMS) {
    const raw = Number(responses[item.id]);
    if (!Number.isFinite(raw) || raw < 1 || raw > 5) continue;
    answered += 1;
    const v = item.reverse ? 6 - raw : raw;
    buckets[item.dimension].push(v);
  }
  const scores = {};
  for (const [key, vals] of Object.entries(buckets)) {
    scores[key] = vals.length ? Math.round(((vals.reduce((a,b)=>a+b,0)/vals.length)-1)/4*100) : null;
  }
  const ranked = Object.entries(scores).filter(([,v])=>v!==null).sort((a,b)=>b[1]-a[1]);
  return {
    answered,
    total: ITEMS.length,
    scores,
    strengths: ranked.slice(0,3).map(([key,score])=>({key,score,title:DIMENSIONS[key].title})),
    development: ranked.slice(-3).reverse().map(([key,score])=>({key,score,title:DIMENSIONS[key].title})),
  };
}

function buildDevelopmentSummary(result) {
  const hi = result.strengths || [];
  const lo = result.development || [];
  const names = xs => xs.map(x=>`${x.title} — ${x.score}%`).join('; ');
  const lowest = lo[0];
  let focus = "Продолжать наблюдать рабочие паттерны и сверять самооценку с практикой и результатами обучения.";
  if (lowest?.key === 'sales_confidence') focus = "Фокус: уверенная рекомендация, ценность без скидки, Complete Look и отказ от привычки считать деньги клиента.";
  if (lowest?.key === 'rejection_resilience') focus = "Фокус: восстановление после отказов, разбор причин и сохранение инициативы в следующем контакте.";
  if (lowest?.key === 'initiative') focus = "Фокус: активное развитие диалога, альтернативы, подготовленные образы и персональные последующие касания.";
  if (lowest?.key === 'empathy') focus = "Фокус: считывание реакции клиента, адаптация темпа и объёма информации, больше наблюдения и уточняющих вопросов.";
  if (lowest?.key === 'emotion_regulation') focus = "Фокус: техники восстановления концентрации и выбор реакции в напряжённых ситуациях.";
  if (lowest?.key === 'learning_orientation') focus = "Фокус: короткие циклы обратной связи — действие → результат → разбор → новая попытка.";
  if (lowest?.key === 'service_motivation') focus = "Фокус: соединить личную мотивацию с клиентским результатом, стилем и конкретными достижимыми целями смены.";
  return { strengthsText:names(hi), developmentText:names(lo), focus };
}

module.exports = { DIMENSIONS, ITEMS, scoreProfile, buildDevelopmentSummary };
