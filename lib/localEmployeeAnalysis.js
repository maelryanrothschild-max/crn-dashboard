function pct(v){ return typeof v === 'number' ? `${Math.round(v)}%` : 'нет данных'; }

export function buildLocalEmployeeAnalysis(emp, results) {
  const completed = results.filter(r => typeof r.score === 'number');
  const avg = completed.length ? completed.reduce((s,r)=>s+r.score,0)/completed.length : null;
  const sorted = [...completed].sort((a,b)=>b.score-a.score);
  const strong = sorted.filter(r=>r.score>=80).slice(0,3);
  const weak = [...completed].sort((a,b)=>a.score-b.score).filter(r=>r.score<80).slice(0,3);
  const notStarted = results.filter(r=>r.score===null).slice(0,3);
  const completion = results.length ? Math.round(completed.length/results.length*100) : 0;

  const lines = [];
  lines.push(`1. ИТОГ ПО ОБУЧЕНИЮ`);
  lines.push(`${emp.surname} ${emp.firstname} · ${emp.role} · ${emp.store || 'магазин не указан'}.`);
  lines.push(`Пройдено тестов: ${completed.length}/${results.length} (${completion}%). Средний балл: ${pct(avg)}.`);
  if(strong.length) lines.push(`Сильные темы: ${strong.map(r=>`${r.title} — ${pct(r.score)}`).join('; ')}.`);
  else lines.push(`Сильные темы пока нельзя определить: недостаточно завершённых тестов.`);

  lines.push(`\n2. ЗОНЫ РАЗВИТИЯ`);
  if(weak.length) weak.forEach((r,i)=>lines.push(`${i+1}) ${r.title} — ${pct(r.score)}. Приоритет: повторить материал и закрепить навык в рабочем сценарии.`));
  else if(notStarted.length) lines.push(`Критических слабых результатов пока нет. Приоритет — завершить: ${notStarted.map(r=>r.title).join(', ')}.`);
  else lines.push(`По текущим тестам явных слабых зон не выявлено. Нужна проверка навыка в реальной работе.`);

  lines.push(`\n3. РАБОЧИЙ ПРОФИЛЬ ПО ДАННЫМ ОБУЧЕНИЯ`);
  if(completed.length < 3) lines.push(`Данных пока мало для устойчивых выводов. Рабочая гипотеза: сначала оценить дисциплину прохождения и понимание базовых стандартов.`);
  else if(avg >= 85) lines.push(`Учебные результаты стабильные и высокие. Рабочая гипотеза для проверки на 1:1: сотрудник уверенно усваивает теорию; следующий фокус — перенос знаний в реальные продажи и сервис.`);
  else if(avg >= 70) lines.push(`База усвоена неравномерно. Рабочая гипотеза для проверки на 1:1: часть стандартов понимается, но требует закрепления через практику и обратную связь.`);
  else lines.push(`Есть системные пробелы в учебных результатах. Рабочая гипотеза для проверки на 1:1: нужен более короткий цикл «материал → практика → проверка», а не просто повторное прохождение теста.`);

  lines.push(`\n4. ЧТО ПРОВЕРИТЬ НА 1:1`);
  const focus = weak[0]?.title || notStarted[0]?.title || 'перенос знаний в практику';
  lines.push(`1) Что в теме «${focus}» вызывает наибольшую сложность в реальной работе?`);
  lines.push(`2) Какой конкретный клиентский сценарий сотрудник сейчас считает самым трудным?`);
  lines.push(`3) Какую одну технику он готов сознательно применять в каждой смене ближайшие 7 дней?`);

  lines.push(`\n5. ПЛАН НА 7 ДНЕЙ`);
  lines.push(`1) Повторить один самый слабый блок и пройти контроль повторно.`);
  lines.push(`2) Отработать минимум 3 реальных сценария по слабой теме с директором/наставником.`);
  lines.push(`3) В конце каждой смены фиксировать один удачный кейс и одну ошибку для разбора.`);

  lines.push(`\n6. КОНТРОЛЬ ЧЕРЕЗ 7 ДНЕЙ`);
  lines.push(`Проверить: изменение балла по слабому блоку, завершение незакрытых тестов и подтверждение навыка директором в реальном клиентском сценарии.`);

  return {
    analysis: lines.join('\n'),
    summary: { completedTests: completed.length, totalBlocks: results.length, avgScore: avg === null ? null : Math.round(avg*10)/10, completion },
    provider: 'CRN Local Coach',
  };
}
