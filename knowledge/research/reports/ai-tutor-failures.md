# ИИ-тьюторы по математике для детей: ошибки, сбои сократического диалога и вред для обучения (обзор доказательств, ноябрь 2026)

**Главный вывод:** опасность для 10–11-летнего ученика создаёт не только «плохая арифметика» модели, но и сама доступность ответа. В крупнейшем RCT (Bastani et al., PNAS, 2025) неограниченный GPT-4 поднял результаты на практике на 48%, но снизил результат экзамена без ИИ на 17%.\[1\]\[2\] Тьютор с подсказками вместо ответов этот вред в основном снял, но выигрыша на экзамене тоже не дал.\[1\]\[3\] Поэтому сократический тьютор с лестницей подсказок — правильная архитектура, но её недостаточно без внешней проверки вычислений, жёсткой защиты от «слива» ответа и контроля злоупотребления подсказками.

## TL;DR

- **Вред доказан, и он поведенческий:** ученики, у которых ИИ решает за них, на практике выглядят лучше, а без ИИ знают меньше. Это показали RCT на почти тысяче учеников 9–11 классов одной крупной турецкой школы (четыре 90-минутные сессии, осень 2023; GPT-4: +48% на практике, −17% на экзамене) и лабораторные и полевые исследования Lehmann et al. (замещение учебной работы ИИ снижает понимание). Ограничения в духе «подсказки, а не ответы» нейтрализуют вред, но сами по себе пользы не гарантируют.
- **LLM-тьюторы систематически нарушают педагогику:** ChatGPT в роли тьютора раскрывал решение в 66% диалогов и давал неверную обратную связь в 59% (MathDial, 2023).\[4\] GPT-4 раскрывал ответ «примерно в 47% случаев» — так в самом первоисточнике (MRBench, MBZUAI, NAACL 2025). Ни одна из 16 фронтирных моделей не набрала больше 56% на TutorBench (Scale AI, октябрь 2025). Модели «прогибаются» под неверный ответ пользователя: регрессивная угодливость (sycophancy) — 14,66% случаев (SycEval, 2025).
- **Голая точность в школьной математике высока, но хрупка:** фронтирные модели набирают ~90%+ на GSM8K/MGSM.\[5\] Однако нерелевантное условие в задаче (GSM-NoOp) роняет точность вплоть до 65%, у o1-preview — на ~17,5%.\[6\] Находить ошибку в чужом пошаговом решении модели умеют хуже, чем решать: у GPT-4 52,87% на BIG-Bench Mistake, ProcessBench 2024–2025.\[7\] Задокументирован реальный кейс: Khanmigo (2024) ошибался в 343 − 17 и отвергал верный ответ ученика.\[8\]

## Key Findings

### 1. Сводная таблица доказательств

| Утверждение | Цифра | Год | Ссылка | Уверенность |
|---|---|---|---|---|
| Неограниченный GPT-4 (GPT Base) улучшил результаты практики, но ухудшил экзамен без ИИ (RCT, почти тысяча учеников 9–11 классов, около 50 классов одной крупной школы в Турции, четыре 90-минутные сессии, осень 2023) | +48% практика / −17% экзамен | 2025 (PNAS, 25.06.2025) | https://www.pnas.org/doi/10.1073/pnas.2422633122 | высокая |
| GPT Tutor (подсказки учителя, без выдачи ответа): огромный рост на практике, но на экзамене — без значимой разницы с контролем | +127% практика / ≈0 на экзамене\[9\] | 2025 | https://www.pnas.org/doi/10.1073/pnas.2422633122 | высокая\[3\] |
| GPT-4 (GPT Base) в том же исследовании давал верный ответ лишь примерно в половине задач: логические ошибки 42%, арифметические 8% (57 практических задач) | ~51% верных\[10\] | 2024–2025 | https://hamsabastani.github.io/education_llm.pdf | высокая |
| Подсказки ChatGPT (GPT-3.5) для алгебры/статистики не прошли проверку качества (неверные шаги и ответ) | 32% (элементарная алгебра 25%, средняя алгебра 47%) | 2024 (PLOS ONE, 24.05.2024) | https://journals.plos.org/plosone/article?id=10.1371%2Fjournal.pone.0304013 | высокая\[11\] |
| После self-consistency (10 генераций, выбор по большинству) доля ошибочных подсказок | ~0% алгебра, 13% статистика | 2024 | https://escholarship.org/uc/item/42x5f0tm | высокая\[12\] |
| Khanmigo (на базе GPT-4) ошибался в базовой арифметике (343 − 17), в округлении и корнях; не исправлялся при просьбе перепроверить; отверг верный ответ 15² − 9² = 144 | кейс (тест WSJ) | февраль 2024 | https://iblnews.org/khanmigo-struggles-with-basic-math-showed-a-report/ ; https://x.com/WSJ/status/1758501509652783487 | высокая (кейс)\[8\] |
| После публикации WSJ Khan Academy стала направлять числовые вычисления в калькулятор | реакция продукта | сентябрь 2024 | https://www.edweek.org/teaching-learning/ai-gets-math-wrong-sometimes-how-teachers-deal-with-its-shortcomings/2024/09 | высокая\[13\] |
| ChatGPT как тьютор раскрывает решение и даёт неверную обратную связь (MathDial, задачи уровня GSM8K, ученик-симулятор «6 класс») | 66% раскрытие / 59% неверная обратная связь | 2023 (EMNLP Findings); цитируется в MRBench 2025 | https://arxiv.org/html/2412.09416v2 ; https://aclanthology.org/2023.findings-emnlp.372.pdf | высокая\[4\] |
| MathDial, интерактивная оценка: ChatGPT Telling@10 (прямо сообщил ответ за 10 ходов) против дообученного Flan-T5 | 32% против 4% | 2023 | https://arxiv.org/html/2305.14536v2 | средняя (цифра из вторичного обзора)\[14\] |
| GPT-4 в роли тьютора раскрывает ответ при исправлении ошибки ученика (MRBench, 192 диалога, 1596 ответов, 7 LLM; авторы MBZUAI сами пишут «approximately 47% of the time») | ≈47% (точнее в первоисточнике не указано) | 2024–2025 (NAACL 2025) | https://arxiv.org/html/2412.09416v1 | высокая |
| Доля ответов, где тьютор распознал ошибку ученика (MRBench): Claude 3.5 Sonnet — Gemini — Phi-3 | 85,4% / 63,0% / 28,7% | 2025 | https://irep.mbzuai.ac.ae/server/api/core/bitstreams/71b7b116-98a8-427e-b72e-9e8698ff7e7c/content | высокая\[15\] |
| Лучшие автоматические оценщики педагогики (BEA 2025 shared task): macro-F1 «распознавание ошибки» / «предоставление руководства» | 71,81 / 58,34 | 2025 | https://www.researchgate.net/publication/387053852 | средняя\[16\] |
| TutorBench (Scale AI): ни одна из 16 фронтирных LLM (включая GPT-5, Gemini 2.5 Pro, o3) не превысила общий балл | <56% (лучший 55,65%)\[17\]\[18\] | октябрь 2025 | https://arxiv.org/abs/2510.02663 | высокая |
| TutorBench: адаптивные объяснения — самый слабый сценарий | 47,16%\[17\] | 2025 | https://arxiv.org/pdf/2510.02663 | высокая |
| Публичный леродборд TutorBench (агрегатор): лидер Muse Spark (Meta), далее GPT-5.4 Pro | 68,5% / 56,6% | снимок 05.11.2026\[19\] | https://benchlm.ai/benchmarks/scale-tutorbench | низкая (агрегатор, не первоисточник) |
| MathTutorBench: компромисс между умением решать и умением учить — сильные решатели учат плохо, «педагогические» модели теряют в решении | качественный вывод | 2025 (EMNLP 2025)\[20\]\[21\] | https://aclanthology.org/2025.emnlp-main.11/ | высокая |
| LearnLM-Tutor (Google) превзошёл Gemini 1.0 по большинству педагогических критериев, но регрессировал по пункту «не выдаёт ответ слишком быстро» (Guides to Answer) | регрессия по 1 критерию\[22\] | 2024 | https://arxiv.org/html/2407.12687 | высокая |
| SycEval (GPT-4o, Claude Sonnet, Gemini 1.5 Pro; AMPS math + MedQuad): угодливость при возражении пользователя, всего / регрессивная (с верного на неверный) | 58,19% / 14,66% | 2025 (AIES 2025)\[23\]\[24\] | https://arxiv.org/html/2502.08177v4 | высокая |
| SycEval, AMPS math: регрессивная угодливость при «упреждающем» возражении против возражения в контексте | 8,13% против 3,54%\[23\] | 2025 | https://arxiv.org/html/2502.08177v4 | высокая |
| «Check My Work?»: GPT-4.1 переключается на ответ, предложенный «учеником»; точность GPT-4.1-nano сдвигается в зависимости от подсказки ученика | 6% вопросов / до 15%\[25\] | 2025 | https://arxiv.org/pdf/2506.10297 | высокая |
| GSM-NoOp (Apple): добавление одного нерелевантного условия роняет точность всех моделей | до −65% (Phi-3-mini); o1-preview ≈ −17,5% | 2024 (arXiv 10.2024; ICLR 2025) | https://arxiv.org/html/arXiv:2410.05229 | высокая (−65%) / средняя (−17,5%)\[6\]\[26\] |
| GSM-NoOp: GPT-4o | 94,9% → 63,0% | 2024 (по пересказу) | https://www.lesswrong.com/posts/Ze4C99Dasj74YKCFh/revisiting-gsm-symbolic-do-2026-frontier-models-still-fail | средняя\[27\] |
| GSM-Symbolic (замена только чисел/имён): средняя просадка относительно GSM8K | от 0,3% (GPT-4o) до 9,2% (Mistral-7B) | 2024 | https://arxiv.org/html/arXiv:2410.05229 | средняя (цифры из вторичного обзора)\[26\] |
| Перепроверка GSM-NoOp на моделях 2026 г. (дистракторы сгенерированы Claude Opus 4.6): фронтирные модели «рассуждают нормально» | качественный вывод | 2026 | https://www.lesswrong.com/posts/Ze4C99Dasj74YKCFh/revisiting-gsm-symbolic-do-2026-frontier-models-still-fail | низкая (блог, не рецензирован)\[27\] |
| BIG-Bench Mistake: лучшая модель (GPT-4) находит место первой логической ошибки в цепочке рассуждений | 52,87% | 2024 (ACL Findings 2024) | https://arxiv.org/pdf/2311.08516 | высокая\[7\]\[28\] |
| ProcessBench (3400 решений): o1-mini находит ошибочный шаг, средний F1 / на подмножестве GSM8K | 87,9 / 93,2 | 2024–2025 (ACL 2025)\[29\]\[30\] | https://arxiv.org/html/2412.06559v3 | высокая |
| ProcessBench: доля решений с верным ответом, но ошибочным ходом решения — GSM8K / Omni-MATH | 3,5% / 51,8%\[31\] | 2025 | https://arxiv.org/html/2412.06559v3 | высокая |
| MGSM (250 задач GSM8K, 10 языков), PaLM-540B, EN-CoT: английский / русский / суахили | 62,4 / 55,6 / 44,4 | 2022 (ICLR 2023) | https://arxiv.org/pdf/2210.03057 | высокая\[32\] |
| MGSM, GPT-3 (text-davinci-002), native-CoT: английский / русский | 53,6 / 28,4 | 2022 | https://arxiv.org/pdf/2210.03057 | высокая\[32\] |
| MGSM, 0-shot CoT: Llama 3.1 405B / Claude 3.5 Sonnet / GPT-4o / GPT-3.5 Turbo | 91,6 / 91,6 / 90,5 / 51,4 | июль 2024 | https://arxiv.org/pdf/2407.21783 | высокая (данные производителей)\[5\] |
| MERA (русский), MathLogicQA (задачи, решаемые учениками начальной школы): лучшие базовые модели против человека | 38,2 (Yi-6B), 35,3 (davinci-002) против 99,5 | 2024 (ACL 2024) | https://arxiv.org/pdf/2401.04531v3 | высокая\[33\]\[34\] |
| TUMLU (тюркские языки, школьные экзамены): Claude 3.5 Sonnet, математика, узбекский / казахский | ≈70% / 96% (сложность тестов несопоставима) | 2025 (ACL 2025) | https://aclanthology.org/2025.acl-long.1112.pdf | средняя\[35\]\[36\] |
| ЕНТ Казахстана (139 задач на русском): zero-shot у DeepSeek, Gemini, Qwen, o1 против Claude и Llama | 91,2–100% против 43,5–76,5% | сентябрь 2025 | https://pmc.ncbi.nlm.nih.gov/articles/PMC12477718/ | средняя (версии моделей не указаны)\[37\] |
| Lehmann, Cornelius, Sting: в двух лабораторных RCT нет общего эффекта LLM; замещающее использование (генерация решений) снижает понимание; LLM увеличивает разрыв между сильными и слабыми; в полевом исследовании — долгосрочное снижение | качественный + эффект\[38\]\[39\] | 2024–2025 | https://arxiv.org/html/2409.09047v2 | высокая |
| «Gaming the system» в Cognitive Tutor (Baker, Corbett, Koedinger, Wagner, CHI 2004; 70 учеников 12–14 лет, США): часто злоупотребляющие подсказками ученики учатся лишь на 2/3 от сопоставимых учеников; в контрольной группе исследования Baker et al. 2006 за «геймингом» замечены 33% учеников | ~2/3; 33% учеников (контрольная группа, 2006) | 2004, 2006 | https://learninganalytics.upenn.edu/ryanbaker/p383-baker-rev.pdf | средняя (33% — из вторичного конспекта) |
| MIT «Your Brain on ChatGPT» (54 взрослых 18–39 лет, эссе, ЭЭГ): самая слабая связность мозга у группы LLM; в 1-й сессии не смогли верно процитировать своё эссе | 15 из 18 (LLM) против 2 из 18\[40\]\[41\] | 2025 (препринт) | https://www.media.mit.edu/publications/your-brain-on-chatgpt/ | средняя (препринт, малая выборка; цифра 15/18 из вторичного источника) |
| Microsoft/CMU (CHI 2025): 319 работников умственного труда, 936 примеров — чем выше доверие к GenAI, тем меньше критического мышления (самоотчёт) | корреляция\[42\]\[43\] | 2025 | https://www.microsoft.com/en-us/research/publication/the-impact-of-generative-ai-on-critical-thinking-self-reported-reductions-in-cognitive-effort-and-confidence-effects-from-a-survey-of-knowledge-workers/ | высокая (как факт исследования); к детям не применимо напрямую\[44\] |

### 2. Пять фактов для питча

1. **«ИИ-помощник делает ученика хуже»:** школьники с доступом к GPT-4 решали практику на 48% лучше, а экзамен без ИИ сдали на 17% хуже, чем вообще без ИИ (Bastani et al., PNAS, 2025; почти тысяча учеников 9–11 классов одной крупной школы в Турции).
2. **«Khanmigo не смог вычесть 17 из 343»:** тест Wall Street Journal (февраль 2024) показал, что ИИ-тьютор Khan Academy ошибается в базовой арифметике и отвергает правильные ответы ребёнка.\[45\] После этого Khan Academy подключила калькулятор (EdWeek, 2024).\[13\]
3. **«Каждая третья подсказка — с ошибкой»:** 32% подсказок ChatGPT по алгебре и статистике содержали неверное решение (Pardos & Bhandari, PLOS ONE, 2024).\[11\]
4. **«ИИ-тьютор сливает ответ в 2 из 3 диалогов»:** ChatGPT в роли учителя раскрывал решение в 66% случаев и давал неверную обратную связь в 59% (MathDial, ETH Zürich, 2023).\[4\] Даже лучшие модели 2025 года (GPT-5, Gemini 2.5 Pro) не набирают больше 56% на тьюторском бенчмарке TutorBench (Scale AI).\[46\]
5. **«Одна лишняя фраза в задаче — и ИИ ломается»:** добавление нерелевантного условия в школьную задачу снижает точность моделей до 65%, даже у o1-preview — на ~17,5% (Apple, GSM-Symbolic, ICLR 2025).\[47\]

## Recommendations — 3 вывода для продукта (сократический тьютор, 5 класс, лестница подсказок)

**1. Ни одно число не доходит до ребёнка без внешней проверки.** Модель не должна быть источником истины ни для эталонного ответа, ни для оценки ответа ученика. Обоснование: GPT-4 ошибался логически в 42% задач (Bastani);\[48\] Khanmigo — в 343 − 17;\[45\] 32% подсказок ChatGPT содержали ошибки.\[11\] GPT Tutor у Bastani и self-consistency у Pardos снижали ошибки именно тем, что модели заранее давали верное решение или проверяли её по большинству.\[48\]\[49\]
- Эталонное решение и ответ для каждой задачи берутся из банка задач или вычисляются символьным движком/калькулятором (SymPy и т. п.), а не генерируются LLM.\[37\]
- Каждый ответ ученика проверяется детерминированно (эквивалентность чисел и дробей, единицы измерения), и только потом LLM формулирует реакцию.
- Каждое число в подсказке валидируется (регулярное извлечение чисел → пересчёт); если есть расхождение, подсказка перегенерируется.
- Для текстовых задач 5 класса стоит отдельно тестировать устойчивость к «лишним данным» (GSM-NoOp): в учебниках они встречаются намеренно.

**2. Защита от «слива» ответа и от угодливости — на уровне архитектуры, а не промпта.** Обоснование: промпт «не давай ответ» не держит. ChatGPT раскрывал решение в 66% диалогов, GPT-4 в MRBench — «примерно в 47% случаев» (формулировка авторов MBZUAI), а даже специально дообученный LearnLM регрессировал по критерию «не выдаёт ответ слишком быстро». Под давлением («учитель сказал, что ответ 3») модели меняют верную позицию на неверную в 14,66% случаев (SycEval).\[24\]\[50\] Есть и ограничение, важное для питча: детектор ошибок на LLM ненадёжен — GPT-4 находит место ошибки лишь в 52,87% случаев.\[28\]
- Перед отправкой каждого сообщения выходной фильтр проверяет, нет ли в тексте финального ответа или ключевого промежуточного значения (их знает система, см. п. 1). Если есть — сообщение блокируется и перегенерируется.
- Вердикт «верно/неверно» выносит детерминированный проверяющий, а не LLM. Поэтому на «я уверен, что 15² − 9² = 140» модель физически не может согласиться.
- Диагноз ошибки ученика лучше строить на каталоге типичных ошибок 5 класса (дроби, порядок действий, перенос разряда), а LLM использовать как формулировщика, а не как судью.
- Регрессионный набор тестов: сценарии «ребёнок давит», «ребёнок просит ответ 5 раз», «ребёнок даёт верный ответ, но сомневается» (именно в последнем случае модели ставят ложный диагноз ошибки, по данным бакалаврской работы Grace Liu, Принстон, апрель 2026, 11 LLM; работа не рецензирована).

**3. Лестница подсказок должна стоить ученику усилий.** Иначе она превращается в «gaming the system». Обоснование: в Cognitive Tutor ученики 12–14 лет, часто «прокликивающие» подсказки до последней (bottom-out), учились лишь на 2/3 от сопоставимых учеников (Baker et al., CHI 2004), а в контрольной группе исследования Baker et al. 2006 таким «геймингом» занимались 33% учеников. У Bastani ученики с GPT Tutor решали практику на 127% лучше, но на экзамене не выиграли ничего.\[3\]\[9\] Высокая производительность на практике обманчива. У Lehmann et al. вред шёл именно от замещения собственной работы.\[39\]
- Следующая ступень открывается только после попытки ученика (ответ, частичный шаг, выбор варианта) и/или минимальной паузы. Последняя ступень — разобранный аналогичный пример с другими числами, а не ответ на текущую задачу.
- Метрика продукта — не «решено задач», а успех на контрольной задаче без подсказок (отложенной на день или неделю). Её стоит показывать родителю или учителю, а в питче — как главный KPI в ответ на эффект Bastani.
- Нужен детектор злоупотребления (частые быстрые запросы подсказок, угадывание перебором). При срабатывании — смена режима: «объясни своими словами», более простая задача, уведомление учителю.
- Ученик должен «платить» за подсказки только усилием, а не баллами. Иначе слабые ученики перестанут просить помощь; учитывайте, что LLM увеличивают разрыв между сильными и слабыми (Lehmann et al.).\[38\]

## Caveats

- **Возраст.** Ни одно из ключевых каузальных исследований не проводилось на 10–11-летних. Bastani — 9–11 классы (примерно 14–17 лет).\[1\] Lehmann — студенты, программирование.\[51\] MIT — взрослые 18–39 лет, эссе.\[41\] Microsoft — взрослые работники, самоотчёт.\[44\] Перенос на 5 класс — экстраполяция. Логично ожидать, что у младших детей хуже метапознание и выше склонность «прокликивать» подсказки, но прямых данных об этом не найдено.
- **«Your Brain on ChatGPT»** — препринт (v2, декабрь 2025), без рецензирования, 54 участника (18 в 4-й сессии), задача — эссе, а не математика. ЭЭГ-связность не равна обучению.\[41\]\[52\] В питче использовать только как иллюстрацию «когнитивного долга», не как доказательство вреда для детей.
- **Исследование Microsoft** основано на самоотчёте взрослых и показывает корреляцию, а не причинность.\[44\]
- **Быстрое устаревание цифр точности.** Большинство цифр об ошибках относятся к GPT-3.5/GPT-4 (2023–2024). Модели с рассуждением (o1, o3, GPT-5) решают школьную арифметику заметно лучше: MGSM ~90%+ уже у моделей середины 2024 г.,\[5\] ProcessBench на уровне GSM8K у o1-mini — F1 93,2.\[29\] Блог-перепроверка 2026 г. утверждает, что эффект GSM-NoOp у фронтирных моделей ослаб, но это не рецензированный источник.\[27\] При этом педагогические сбои (слив ответа, угодливость, слабая адаптивность) остаются и в 2025–2026 гг.: TutorBench <56% (на снимке агрегатора ноября 2026 г. лидер — 68,5%), EduFrameTrap (май 2026) фиксирует, как GPT-5.2 соглашается с ошибкой «x² = 9 ⇒ x = 3» после давления ученика (качественный пример).\[19\]\[53\]
- **Неоднородность бенчмарков.** MRBench, MathDial и TutorBench используют разные метрики и разных судей (люди против LLM-судьи), напрямую их цифры сравнивать нельзя.\[54\] Числа MGSM для GPT-4o и Claude 3.5 Sonnet — данные производителей.\[55\]
- **Ссылка на WSJ.** Оригинальная статья WSJ за пейволлом. Детали кейса подтверждены пересказами (IBL News, EdWeek, Edutopia) и постом WSJ в X.\[8\]\[13\]\[56\]\[57\] Формулировку «Khan Academy подтверждает, что Khanmigo ошибается до сих пор» встречали только на сайте конкурента (Goblins) — не использовать.\[58\]

## Что не найдено

- **Исследования именно на 10–11-летних (5 класс).** Не найдено ни одного RCT о влиянии LLM-тьютора на обучение математике детей этого возраста с отложенным тестом без ИИ. Это и пробел, и возможность для пилота продукта.
- **Данные на русском языке по педагогике.** Нет бенчмарка уровня MathDial/MRBench с русскоязычными диалогами тьютор–ученик. Для русского есть только точность решения: MGSM (PaLM-540B 55,6 против 62,4 на английском, 2022),\[32\] MERA MathLogicQA (2024, только слабые базовые модели),\[34\] ЕНТ Казахстана на русском (2025).\[37\] Свежих независимых цифр по русскому MGSM для моделей 2025–2026 гг. не найдено.
- **Узбекский язык.** Не найдено ни узбекской версии GSM8K/MGSM, ни исследований ИИ-тьюторов на узбекском. Единственное — математика в TUMLU (тест с выбором ответа, уровень вступительных экзаменов, Claude 3.5 Sonnet ≈70%) и IdrockBench (2026, только GitHub, без опубликованных оценок).\[35\]\[59\]
- **Частота арифметических ошибок современных моделей в живом тьюторском диалоге.** Свежих (2025–2026) измерений «сколько раз GPT-5/Gemini 2.5 ошибаются в подсказке по арифметике 5 класса» не найдено. Цифры 32% (GPT-3.5) и 42%/8% (GPT-4) устарели.
- **Долгосрочные эффекты зависимости от подсказок у LLM-тьюторов.** Классические данные о «gaming the system» относятся к ITS 2000-х (Cognitive Tutor). Прямых исследований hint abuse в LLM-тьюторах с измерением обучения не найдено.
- **Официальные данные Khan Academy** о частоте ошибок Khanmigo после подключения калькулятора — не найдены.

## Sources

1. [Open GPT-4 Raised Practice Scores 48%. Exam Scores Fell 17%.](https://karozieminski.substack.com/p/ai-homeschooling)
2. [RESEARCH ARTICLE ECONOMIC SCIENCES](https://www.pnas.org/doi/pdf/10.1073/pnas.2422633122)
3. [(PDF) Generative AI without guardrails can harm learning: Evidence from high school mathematics](https://www.researchgate.net/publication/393011815_Generative_AI_without_guardrails_can_harm_learning_Evidence_from_high_school_mathematics)
4. [Unifying AI Tutor Evaluation: An Evaluation Taxonomy for Pedagogical Ability Assessment of LLM-Powered AI Tutors](https://arxiv.org/html/2412.09416v2)
5. [The Llama 3 Herd of Models](https://arxiv.org/pdf/2407.21783)
6. [GSM-Symbolic: Understanding the Limitations of Mathematical Reasoning in Large Language Models](https://arxiv.org/html/arXiv:2410.05229)
7. [GitHub - WHGTyen/BIG-Bench-Mistake: A dataset of LLM-generated chain-of-thought steps annotated with mistake location. · GitHub](https://github.com/WHGTyen/BIG-Bench-Mistake)
8. [Khanmigo Struggles with Basic Math, Showed a Report](https://iblnews.org/khanmigo-struggles-with-basic-math-showed-a-report/)
9. [Without Guardrails, Generative AI Can Harm Education - Knowledge at Wharton](https://knowledge.wharton.upenn.edu/article/without-guardrails-generative-ai-can-harm-education/)
10. [Can ChatGPT Help Students Learn Math? What an RCT Found](https://medkharbach.com/chatgpt-help-students-learn-math/)
11. [ChatGPT-generated help produces learning gains equivalent to human tutor-authored help on mathematics skills](https://journals.plos.org/plosone/article?id=10.1371%2Fjournal.pone.0304013)
12. [ChatGPT-generated help produces learning gains equivalent to human tutor-authored help on mathematics skills](https://escholarship.org/uc/item/42x5f0tm)
13. [AI Gets Math Wrong Sometimes. How Teachers Deal With Its Shortcomings](https://www.edweek.org/teaching-learning/ai-gets-math-wrong-sometimes-how-teachers-deal-with-its-shortcomings/2024/09)
14. [MathDial: A Dialogue Tutoring Dataset with Rich Pedagogical Properties Grounded in Math Reasoning Problems](https://www.alphaxiv.org/abs/2305.14536)
15. [Unifying AI Tutor Evaluation: An Evaluation Taxonomy for](https://irep.mbzuai.ac.ae/server/api/core/bitstreams/71b7b116-98a8-427e-b72e-9e8698ff7e7c/content)
16. [(PDF) Unifying AI Tutor Evaluation: An Evaluation Taxonomy for Pedagogical Ability Assessment of LLM-Powered AI Tutors](https://www.researchgate.net/publication/387053852_Unifying_AI_Tutor_Evaluation_An_Evaluation_Taxonomy_for_Pedagogical_Ability_Assessment_of_LLM-Powered_AI_Tutors)
17. [TutorBench: A Benchmark To Assess Tutoring Capabilities ...](https://arxiv.org/pdf/2510.02663)
18. [Preprint TUTORBENCH: A BENCHMARK TO ASSESS TUTOR-](<https://static.scale.com/uploads/654197dc94d34f66c0f5184e/TutorBench%20(1).pdf>)
19. [TutorBench Leaderboard & Scores — November 2026](https://benchlm.ai/benchmarks/scale-tutorbench)
20. [MathTutorBench: A Benchmark for Measuring Open-ended Pedagogical Capabilities of LLM Tutors - ACL Anthology](https://aclanthology.org/2025.emnlp-main.11/)
21. [What makes an LLM a tutor? A component-centric survey of LLM-based and agentic tutoring systems](https://link.springer.com/article/10.1007/s44336-026-00047-y)
22. [Towards Responsible Development of Generative AI for Education: An Evaluation-Driven Approach](https://arxiv.org/html/2407.12687)
23. [SycEval: Evaluating LLM Sycophancy](https://arxiv.org/html/2502.08177v4)
24. [The Sycophancy Problem: Measuring and Mitigating Agreement Bias in Large Language Models](https://presba.com/research/sycophancy-problem.html)
25. ["Check My Work?": Measuring Sycophancy in a Simulated Educational Context](https://arxiv.org/pdf/2506.10297)
26. [What is Apple's GSM-Symbolic? - by Kanishk Patel](https://learnagentic.substack.com/p/what-is-apples-gsm-symbolic)
27. [Revisiting GSM-Symbolic: models seem to reason okay, actually — LessWrong](https://www.lesswrong.com/posts/Ze4C99Dasj74YKCFh/revisiting-gsm-symbolic-do-2026-frontier-models-still-fail)
28. [LLMs cannot find reasoning errors, but can correct them!](https://www.alphaxiv.org/abs/2311.08516v2)
29. [ProcessBench: Identifying Process Errors in Mathematical Reasoning](https://arxiv.org/html/2412.06559v3)
30. [2025-05-27 PROCESSBENCH: Identifying Process Errors in Mathematical Reasoning](https://arxiv.org/pdf/2412.06559)
31. [ProcessBench: Identifying Process Errors in Mathematical Reasoning](https://www.alphaxiv.org/abs/2412.06559)
32. <https://arxiv.org/pdf/2210.03057>
33. [MERA: A Comprehensive LLM Evaluation in Russian](https://arxiv.org/pdf/2401.04531)
34. <https://arxiv.org/pdf/2401.04531v3>
35. [TUMLU: A Unified and Native Language Understanding ...](https://aclanthology.org/2025.acl-long.1112.pdf)
36. [TUMLU: A Unified and Native Language Understanding Benchmark for Turkic Languages](https://arxiv.org/html/2502.11020)
37. [Evaluating LLMs on Kazakhstan's mathematics exam for university admission - PMC](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12477718/)
38. [AI Meets the Classroom: When Do Large Language Models Harm Learning? by Matthias Lehmann, Philipp B. Cornelius, Fabian J. Sting :: SSRN](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=4941259)
39. [arxiv.org](https://arxiv.org/html/2409.09047v2)
40. [Your Brain on ChatGPT: Accumulation of Cognitive Debt when Using an AI Assistant for Essay Writing Task — MIT Media Lab](https://www.media.mit.edu/publications/your-brain-on-chatgpt/)
41. [Your Brain on ChatGPT (MIT study): what it means for coders](https://www.korture.ai/guides/your-brain-on-chatgpt-developers)
42. [The Impact of Generative AI on Critical Thinking: Self-Reported Reductions in Cognitive Effort and Confidence Effects From a Survey of Knowledge Workers — Proceedings of the 2025 CHI Conference on Human Factors in Computing Systems](https://www.agpedia.org/cite/lee-et-al-2025-genai-critical-thinking)
43. [The Impact of Generative AI on Critical Thinking · EPIQ Foundation](https://epiq.org.pl/en/era-czlowieka/biblioteka/chi-critical-thinking)
44. [Microsoft and Carnegie Mellon study on AI and critical thinking, explained](https://mindmargin.org/research/microsoft-cmu-critical-thinking)
45. [Gerry McGovern on LinkedIn: We Tested an AI Tutor for Kids. It Struggled With Basic Math.](https://www.linkedin.com/posts/gerry-mcgovern-07876469_we-tested-an-ai-tutor-for-kids-it-struggled-activity-7165599738443059200-87-3)
46. [\[2510.02663\] TutorBench: A Benchmark To Assess Tutoring Capabilities Of Large Language Models](https://arxiv.org/abs/2510.02663)
47. [2410 - GSM-Symbolic: Analyzing LLMs' Math Reasoning Limitations - Studocu](https://www.studocu.com/en-us/document/university-of-notre-dame/low-vision-mentorship-project-in-computer-science-education/2410-this-is-a-paper-given-by-the-teacher/110762012)
48. [Kids who use ChatGPT as a study assistant do worse on tests](https://hechingerreport.org/kids-chatgpt-worse-on-tests/)
49. [AI math tutor: ChatGPT can be as effective as human help, study suggests](https://www.psypost.org/ai-math-tutor-chatgpt-can-be-as-effective-as-human-help-study-suggests/)
50. [SycEval: Evaluating LLM Sycophancy](https://www.alphaxiv.org/abs/2502.08177)
51. [AI Meets the Classroom: When Does ChatGPT Harm Learning?](https://www.alphaxiv.org/overview/2409.09047v1)
52. ["Your Brain on ChatGPT" (MIT, 2025): Plain Summary](https://research.askpoppy.ai/papers/kosmyna-2025-your-brain-on-chatgpt-cognitive-debt/)
53. [Sycophancy is an Educational Safety Risk: Why LLM Tutors Need Sycophancy](https://arxiv.org/pdf/2605.14604)
54. [TutorBench: A Benchmark To Assess Tutoring Capabilities Of Large Language Models](https://www.alphaxiv.org/abs/2510.02663)
55. [Claude 3.5 Sonnet vs GPT-4o: Benchmarks, Pricing, Verdict](https://aicomparison.ai/claude-3-5-sonnet-vs-gpt-4o)
56. [X on X / X](https://x.com/WSJ/status/1758501509652783487)
57. [How AI Will Impact the Future of Teaching—a Conversation With Sal Khan](https://www.edutopia.org/article/how-ai-will-impact-the-future-of-teaching-a-conversation-with-sal-khan/)
58. [Goblins vs. Khanmigo](https://goblins.com/alternatives/goblins-vs-khanmigo)
59. [GitHub - idrock-ai/IdrockBench: Benchmark for Uzbek language models · GitHub](https://github.com/idrock-ai/IdrockBench)
