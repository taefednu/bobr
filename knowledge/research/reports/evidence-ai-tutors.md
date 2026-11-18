# ИИ-тьюторы, адаптивное обучение и тьюторинг по математике: доказательная база для питча ИИ-тьютора для 5 класса

Да, доказательная база есть. Лучшие RCT показывают прирост по математике примерно на 0,2–0,4 SD, но только если тьютор устроен как тьютор: задаёт наводящие вопросы, держит ученика на его уровне и обеспечивает регулярную практику. ИИ, выдающий готовые ответы, вредит обучению (−17% на экзамене без ИИ в RCT Bastani et al., PNAS 2025).\[1\] А крупнейший RCT Khanmigo (2026) показал лишь 0,06–0,08 SD за год, потому что дети почти не разговаривали с ботом.\[2\] Для 5 класса прямых RCT ИИ-тьюторов на LLM нет. Ближайшие данные — это Rori (классы 3–8 по версии v2 препринта; в v1 — 3–9), Mindspark (классы 6–9), ASSISTments (7 класс) и Khan Academy (классы 3–8 и 6–8).

## TL;DR

- **Эффект реален, но умеренный.** Человеческий тьюторинг по мета-анализу RCT даёт 0,29 SD (Nickow et al., AERJ 2024), ITS в K-12 США — g = 0,27 (Leite et al., 2025). Лучшие RCT адаптивных и ИИ-систем для школьников дают 0,18–0,37 SD: ASSISTments 0,18, Rori 0,36, Mindspark 0,37. «2 сигмы» Блума в современных RCT не воспроизводятся. Цифры Kestin et al. (0,73–1,3 SD) относятся к студентам Гарварда и немедленному тесту, их нельзя переносить на 5 класс.
- **Дизайн решает знак эффекта.** GPT-4 без ограничений: +48% на практике, но −17% на экзамене без ИИ. GPT-4 с guardrails (подсказки, без готовых ответов): +127% на практике и 0 вреда на экзамене (Bastani et al., PNAS 2025). Сократический ИИ под надзором человека не уступал людям-тьюторам и дал +5,5 п.п. на новых задачах (LearnLM/Eedi, препринт 2025). ИИ-подсказки людям-тьюторам дали +4 п.п. к освоению темы и +9 п.п. у слабых тьюторов при стоимости $20 на тьютора в год (Tutor CoPilot, препринт 2024).
- **Узкое место — вовлечённость и дозировка, а не «ум» модели.** В RCT Khanmigo медианный ученик писал боту только в 17% сессий с ошибкой (Oreopoulos & Low, 2026). Структурированная практика 35–47 минут в неделю давала 0,12–0,47 SD (RCT Khan Academy в США и Индии). Продукт должен сам инициировать диалог и гарантировать минуты практики.

## 1. Сводная таблица: утверждение | цифра | год | ссылка | уверенность

### 1.1. LLM-тьюторы и сократический метод / guardrails

| Утверждение | Цифра | Год | Ссылка (DOI/URL) | Уверенность |
|---|---|---|---|---|
| Bastani et al.: GPT-4 без ограничений (GPT Base) улучшает решение задач на практике | +48% к оценке на практике (ITT +0,137 при контрольном среднем 0,284)\[3\] | 2025 | PNAS 122(26): e2422633122, DOI 10.1073/pnas.2422633122 | Высокая (полевой RCT, рецензируемый журнал), но это старшая школа, Турция |
| Bastani et al.: GPT Tutor (GPT-4 с подсказками учителя и решениями в промпте, без выдачи ответа) на практике | +127% к оценке на практике (+0,361)\[3\] | 2025 | DOI 10.1073/pnas.2422633122 | Высокая |
| Bastani et al.: после отключения ИИ ученики из GPT Base хуже контроля на экзамене | −17% (−0,054, SE 0,022, p<0,05); первичный предрегистрированный исход\[3\] | 2025 | DOI 10.1073/pnas.2422633122; препринт https://hamsabastani.github.io/education_llm.pdf | Высокая |
| Bastani et al.: GPT Tutor на экзамене статистически не отличается от контроля (вред устранён, пользы нет) | −0,004 (SE 0,013, незначимо)\[3\] | 2025 | DOI 10.1073/pnas.2422633122 | Высокая |
| Bastani et al.: выборка и дизайн | Почти 1000 учеников 9–11 классов, около 50 классов, 4 сессии по 90 минут, рандомизация по классам, около 15% семестровой программы\[3\] | 2025 | https://hamsabastani.github.io/education_llm.pdf | Высокая |
| LearnLM (Google) + Eedi: сократический ИИ под надзором тьютора против людей-тьюторов, математика, 5 школ Великобритании | N = 165; решение новых задач по следующим темам 66,2% против 60,7% (+5,5 п.п.); ИИ «не хуже людей по всем исходам»\[4\] | 2025 | arXiv 2512.23633, https://arxiv.org/abs/2512.23633 | Средняя (RCT, но малый, «эксплораторный», препринт, исходы на платформе, возраст 13–15) |
| LearnLM/Eedi: исправление ошибки сразу после диагностики | ИИ 93,0%, человек 91,2%, статичные подсказки 65,4%\[5\] | 2025 | arXiv 2512.23633 (цифры по вторичному обзору https://lacuna.tiptreesystems.com) | Низкая–средняя (вторичный пересказ) |
| Kestin et al. (Harvard): ИИ-тьютор против активного обучения в аудитории, физика | N = 194 студента (из 233), кроссовер-RCT; медиана посттеста 4,5 против 3,5 при базе 2,75 (прирост более чем вдвое); 49 против 60 минут\[6\]\[7\] | 2025 | Scientific Reports 15:17458, DOI 10.1038/s41598-025-97652-6 | Высокая для вуза; низкая релевантность для 5 класса |
| Kestin et al.: размер эффекта | 0,63 SD (линейная регрессия, занижена потолком); 0,73–1,3 SD (квантильная регрессия)\[8\] | 2024–2025 | Препринт https://www.researchsquare.com/article/rs-4243877/v1; опубликованная версия DOI 10.1038/s41598-025-97652-6 | Средняя (немедленный посттест, 2 урока, гарвардская выборка) |
| Rori (WhatsApp-тьютор по математике), Гана | d = 0,36 (v2: на исходном тесте 637 учеников классов 3–8, оба теста прошли 477; v1: около 1000 учеников классов 3–9, 0,37); «two 30-minute weekly sessions with Rori during their study hall period», тесты в начале февраля и в конце августа 2023 г.; рост 5,13 против 2,12 баллов из 35; по оценке авторов, «annual cost as low as $5 per student» (API LLM, телефон, 3G-трафик) | 2024 | Henkel et al., arXiv 2402.09809, https://arxiv.org/abs/2402.09809 | Средняя (рандомизация по школам: 5 школ Rising Academies в группе вмешательства, 6 в контроле; препринт без рецензии) |
| Нигерия (World Bank): GPT-4 (Microsoft Copilot) после уроков, 12 сессий по 90 минут за 6 недель | 0,31 SD общий балл; 0,23 SD английский (первичный исход); около 0,031 SD за каждый дополнительный день посещения\[9\]\[10\] | 2025 | World Bank Policy Research Working Paper 11125, https://ideas.repec.org/p/wbk/wbrwps/11125.html | Средняя (RCT, рабочий документ без рецензии; **английский, не математика**; возраст около 15 лет) |

### 1.2. Гибрид «человек + ИИ»: Tutor CoPilot

| Утверждение | Цифра | Год | Ссылка | Уверенность |
|---|---|---|---|---|
| Дизайн: предрегистрированный RCT, рандомизация на уровне тьютора, онлайн-тьюторинг по математике (FEV Tutor, южный округ США), K-12 из малообеспеченных сообществ | v1: 900 тьюторов, 1800 учеников; v2: 783 тьютора, более 1000 учеников\[11\]\[12\] | 2024 | EdWorkingPaper 24-1054, https://edworkingpapers.com/sites/default/files/ai24_1054_v2.pdf; arXiv 2410.03017; предрегистрация https://osf.io/8d6ha | Высокая по дизайну |
| Эффект на освоение темы (exit ticket), ITT | +4 п.п. (p<0,01)\[12\] | 2024 | arXiv 2410.03017 | Средняя–высокая (крупный RCT, но препринт; исход — краткосрочное освоение, не стандартизированный тест) |
| Эффект у учеников низкорейтинговых и малоопытных тьюторов | +9 п.п.\[12\] | 2024 | arXiv 2410.03017 | Средняя (анализ гетерогенности) |
| Среди тьюторов, реально использовавших инструмент | Доля прошедших exit ticket 62% → 76% (Appendix H)\[13\] | 2024 | https://edworkingpapers.com/sites/default/files/ai24-1054.pdf | Низкая–средняя (не ITT, возможен отбор) |
| Стоимость | около $20 на тьютора в год\[11\] | 2024 | ERIC ED661562, https://eric.ed.gov/?id=ED661562 | Средняя |
| Статус | Рабочий документ (EdWorkingPaper, Annenberg/Brown) и препринт arXiv 2410.03017 (Wang, Ribeiro, Robinson, Loeb, Demszky; последняя версия — v3 от 10 октября 2026 г., анализ более 550 000 сообщений); рецензируемой публикации я не нашёл | 2024–2026 | arXiv 2410.03017 | — |

### 1.3. Khanmigo и Khan Academy

| Утверждение | Цифра | Год | Ссылка | Уверенность |
|---|---|---|---|---|
| Khanmigo: двухлетний кластерный RCT, 18 средних школ округа Hamilton County (Теннесси), ежедневные коррекционные занятия по математике (RTI), классы 6–8; Khanmigo настроен «коучить, а не отвечать»; регистрация AEA RCT Registry AEARCTR-0013519 | +1,3 национальных перцентильных ранга за триместр; 0,06 SD за год (ITT), 0,08 SD во втором году; 0,14 SD — подразумеваемый эффект полного года активного участия\[14\] | 2026 | Oreopoulos & Low, «One Click Away: AI Tutoring with Khanmigo in a Two-Year School Experiment», EdWorkingPaper 26-1551, DOI 10.26300/kner-hv33; NBER WP 35620 (август 2026) | Высокая по дизайну (рабочий документ без рецензии) |
| Khanmigo: прирост сопоставим с Khan Academy **без** ИИ | «These gains resemble those from Khan Academy practice without AI assistance»\[2\] | 2026 | DOI 10.26300/kner-hv33 | Высокая |
| Khanmigo: вовлечённость | 96% хотя бы раз написали боту; медианный ученик писал лишь в треть дней практики и в 17% сессий с ошибкой; только 14,5% сообщений содержали математический вопрос или шаг рассуждения\[2\] — в аннотации NBER w35620: «Messages that students did send were mostly bare answers or clicks on suggested prompts… The binding constraint appears to be engagement» | 2026 | DOI 10.26300/kner-hv33; NBER w35620 | Высокая |
| Khanmigo: стоимость и дозировка | около $15 на ученика в год; около +30 минут практики в неделю (более 45 минут во втором году у активных)\[2\] | 2026 | DOI 10.26300/kner-hv33 | Высокая |
| Khan Academy (без LLM), RCT в США, классы 3–8, около 11 000 учеников, коучинг учителей | ITT 0,12–0,22 SD; эффект сосредоточен в классах с практикой не менее 35 минут в неделю\[15\]\[16\] | 2024 | Oreopoulos et al., NBER w32388, https://www.nber.org/papers/w32388 | Высокая (RCT, рабочий документ NBER) |
| Khan Academy, RCT в Индии (Уттар-Прадеш), средние классы, координатор, обеспечивающий практику | Использование 7,2 → 47,4 минуты в неделю; математика «почти +0,5 SD» за 31 неделю (Khan Academy сообщает 0,44–0,47 SD)\[16\]\[17\] | 2026 | NBER w34683, DOI 10.3386/w34683 | Средняя–высокая (RCT 83 школ; рабочий документ; контроль имел доступ к Khan Academy) |
| Внутренний отчёт Khan Academy: 30+ минут в неделю (18+ часов в год), около 350 тыс. учеников классов 3–8 | около 20% больше ожидаемого прироста по MAP Growth; «effect size .36»; рекомендованную дозу набрали лишь около 9%\[18\]\[19\]\[20\] | 2024 | https://blog.khanacademy.org/khan-academy-efficacy-results-november-2024/ | Низкая (корреляционное исследование, внутренний отчёт, ESSA Tier 3) |
| Khan/NWEA MAP Accelerator: 30+ против <15 минут в неделю | +0,26 SD (разность разностей, 2020–21)\[21\] | 2022 | EDM 2022 industry track, https://educationaldatamining.org/edm2022/proceedings/2022.EDM-industry-track.112/index.html | Низкая (не RCT; по критике NEPC, рекомендованную дозу набрали около 4,7% учеников)\[22\] |

### 1.4. Адаптивное обучение, knowledge tracing, mastery learning

| Утверждение | Цифра | Год | Ссылка | Уверенность |
|---|---|---|---|---|
| Mindspark (Индия): персонализированная адаптивная программа после уроков, средние классы, лотерея | +0,37 σ математика, +0,23 σ хинди за 4,5 месяца (ITT); IV: 90 дней посещения → +0,6 σ по математике\[23\] | 2019 | Muralidharan, Singh, Ganimian, AER 109(4):1426–60, DOI 10.1257/aer.20171112 | Высокая (RCT, топ-журнал); средняя релевантность (дети отставали на годы) |
| Mindspark: на школьных экзаменах по математике своего класса эффекта нет | 0 (ученики слишком отстают от программы)\[24\] | 2019 | https://www.povertyactionlab.org/evaluation/disrupting-education-evidence-technology-aided-instruction-india | Высокая |
| ASSISTments (онлайн-домашка с мгновенной обратной связью и отчётами учителю), 7 класс, штат Мэн | g = 0,18 SD на стандартизированном тесте TerraNova; 2850 учеников, 43 школы; сильнее всего эффект у слабых учеников\[25\]\[26\]\[27\] | 2016 | Roschelle et al., AERA Open 2(4), DOI 10.1177/2332858416673968 | Высокая (кластерный RCT, WWC: «без оговорок»); высокая релевантность |
| MATHia / Cognitive Tutor Algebra I, кластерный RCT в 7 штатах | 1-й год: 0; 2-й год: около 0,20 SD в старших школах (аддендум: 0,21); в средних школах эффект схожий, но незначимый\[28\]\[29\] | 2014 | Pane et al., Educational Evaluation and Policy Analysis 36(2):127–144, https://www.rand.org/pubs/external_publications/EP50410.html; аддендум https://www.rand.org/pubs/working_papers/WR1050.html | Высокая; средняя релевантность (алгебра) |
| Teach to One: Math (алгоритмическая персонализация расписания), независимая оценка i3, классы 6–8, Элизабет (Нью-Джерси) | Нет эффекта на тесте штата (оценка −0,019, незначимо); 11 134 ученика\[30\]\[31\] | 2019 | Ready et al., CPRE, https://newclassrooms.org/wp-content/uploads/Final-Impact-Results-i3-TtO.pdf | Средняя (квазиэксперимент) |
| Teach to One: исследование, финансированное Gates и выпущенное разработчиком | +0,16 SD за 3 года по MAP; без контрольной группы\[32\]\[33\] | 2019 | https://newclassrooms.org/wp-content/uploads/Three-Year-MAP-Growth-at-Teach-to-One-Schools.pdf | Низкая |
| ALEKS (теория пространств знаний) после уроков, 6 класс, 25 недель, рандомизация | 253 ученика; ALEKS = уровень экспертных учителей на тесте штата TCAP; d ≈ 0,18, незначимо (по вторичному пересказу)\[34\]\[35\] | 2013 | Craig et al., Computers & Education 68:495–504, DOI 10.1016/j.compedu.2013.06.010 | Низкая–средняя (сравнение с учителем, а не с «ничем»; размер эффекта не проверен в полном тексте) |
| Гибрид: тьюторинг 4:1, чередующийся с компьютерной практикой | около 0,23 SD на получивших вмешательство\[36\] | 2024 | Bhatt et al., NBER w32510, https://www.nber.org/papers/w32510 | Низкая–средняя (по сниппету, полный текст не проверен) |

### 1.5. Мета-анализы

| Утверждение | Цифра | Год | Ссылка | Уверенность |
|---|---|---|---|---|
| Kulik & Fletcher: 50 контролируемых оценок ITS | Медиана 0,66 SD (50-й → 75-й перцентиль)\[37\] | 2016 | Review of Educational Research 86(1):42–78, DOI 10.3102/0034654315581420 | Высокая (рецензируемый мета-анализ), но смешанные уровни образования |
| Kulik & Fletcher: эффект сильно зависит от теста | Cognitive Tutor: медиана 0,86 на локальных тестах против 0,16 на стандартизированных\[38\] | 2016 | DOI 10.3102/0034654315581420 | Высокая |
| Kulik & Fletcher: медиана человеческого тьюторинга по пяти мета-анализам | 0,40 SD («far from Bloom's two-sigma»)\[38\] | 2016 | DOI 10.3102/0034654315581420 | Высокая |
| Steenbergen-Hu & Cooper: ITS в математике K-12 | g = 0,01–0,09 («нет вреда, возможно, небольшая польза»); длительность ≥1 года: g = −0,02; 1 семестр: g = 0,06\[39\]\[40\] | 2013 | Journal of Educational Psychology 105(4):970, DOI 10.1037/a0032447 | Высокая (рецензируемый); прямо релевантно |
| Steenbergen-Hu & Cooper: слабые ученики | g = −0,18 (против 0,04 в общей выборке)\[40\] | 2013 | DOI 10.1037/a0032447 (через Leite et al., arXiv 2511.04997) | Средняя |
| Ma, Adesope, Nesbit, Liu: ITS, 107 эффектов, 14 321 участник | g = 0,41 (случайные эффекты); против фронтального обучения g = 0,44; против малых групп с человеком g = 0,05\[40\]\[41\]\[42\] | 2014 | Journal of Educational Psychology 106(4):901–918, DOI 10.1037/a0037123 | Высокая |
| Leite et al.: ITS в школах США (18 исследований, 77 эффектов, 11 ITS) | g = 0,271; математика 0,253; стандартизированные тесты 0,200; измерение в конце года 0,155 против немедленного 0,460; эффект одинаков в начальной и средней школе\[40\] | 2025 | arXiv 2511.04997, https://arxiv.org/abs/2511.04997 | Средняя–высокая (препринт, но строгий отбор); высокая релевантность |
| Nickow, Oreopoulos, Quan (рабочий документ): тьюторинг PreK-12, RCT | 0,37 SD\[43\] | 2020 | NBER w27476, DOI 10.3386/w27476 | Высокая (заменена версией 2024) |
| Nickow, Oreopoulos, Quan (журнальная версия) | 0,288 SD (SE 0,029); сильнее при тьюторах-учителях и парапрофессионалах, в младших классах, при ≥3 сессиях в неделю и в учебное время\[44\] | 2024 | American Educational Research Journal 61(1):74–107, DOI 10.3102/00028312231208687 | Высокая |
| J-PAL (по версии 2020): частота | ≥3 сессий в неделю: 0,37 SD; реже: 0,28 SD\[45\] | 2020 | https://www.povertyactionlab.org/sites/default/files/publication/Evidence-Review_The-Transformative-Potential-of-Tutoring.pdf | Средняя |
| VanLehn: человеческий тьюторинг против отсутствия тьюторинга | «the effect size of human tutoring was much lower: d = 0.79… intelligent tutoring systems was 0.76»; ITS «по ответу» 0,31 | 2011 | VanLehn, Educational Psychologist 46(4):197–221, DOI 10.1080/00461520.2011.611369 (ERIC EJ946764) | Высокая (рецензируемый мета-анализ) |
| Bloom «2 sigma» | Около 2 SD (небольшие эксперименты около 3 недель, узкие тесты; по разбору von Hippel — из диссертаций учеников Блума)\[6\] | 1984 | Educational Researcher 13(6):4–16, DOI 10.3102/0013189X013006004 | Низкая как ориентир (не воспроизводится в RCT) |

## 2. Пять фактов для питча

1. **Тьюторинг — одно из самых надёжных вмешательств в образовании, и ИИ делает его масштабируемым.** Мета-анализ полевых RCT даёт 0,29 SD (Nickow, Oreopoulos, Quan, AERJ 2024, DOI 10.3102/00028312231208687),\[44\] но человеческий тьютор стоит тысячи долларов на ученика в год. RCT Khanmigo оценивает ИИ-программу примерно в $15 на ученика в год (Oreopoulos & Low 2026, DOI 10.26300/kner-hv33),\[2\] а авторы Rori пишут о «possibility of achieving an annual cost as low as $5 per student» (arXiv 2402.09809).
2. **ИИ-тьютор по математике для детей начальной и средней школы работает в RCT.** WhatsApp-тьютор Rori для классов 3–8 (v2 препринта; в v1 — 3–9) в Гане дал d = 0,36 при двух 30-минутных сессиях в неделю (arXiv 2402.09809, препринт). Адаптивный Mindspark дал +0,37 σ по математике за 4,5 месяца (AER 2019, DOI 10.1257/aer.20171112).\[23\]
3. **Сократический ИИ превосходит ИИ, дающий ответы.** GPT-4 без ограничений снизил результаты экзамена без ИИ на 17%. Версия с guardrails вред устранила, а на практике дала +127% (Bastani et al., PNAS 2025, DOI 10.1073/pnas.2422633122).\[3\] Наш тьютор не даёт готовых ответов принципиально.
4. **ИИ с наводящими вопросами не уступает живому тьютору.** В RCT в британских школах сократический LearnLM под надзором экспертов показал результаты «не хуже людей», а на новых задачах — +5,5 п.п. (66,2% против 60,7%; arXiv 2512.23633, препринт).\[4\] Hybrid Tutor CoPilot поднял освоение тем на 4 п.п., а у слабых тьюторов на 9 п.п., за $20 на тьютора в год (arXiv 2410.03017).\[11\]
5. **Адаптивная диагностика пробелов с мгновенной обратной связью даёт эффект на стандартизированных тестах.** ASSISTments в 7 классе показал +0,18 SD на TerraNova, и сильнее всего выиграли слабые ученики (AERA Open 2016, DOI 10.1177/2332858416673968).\[25\]\[26\] Структурированная практика Khan Academy от 35 минут в неделю дала 0,12–0,22 SD в RCT классов 3–8 (NBER w32388).

*Чего в питче говорить нельзя: «2 сигмы», «ИИ вдвое эффективнее учителя» со ссылкой на Гарвард (там студенты-физики и немедленный тест), «Khanmigo доказанно повышает успеваемость» (его RCT дал 0,06–0,08 SD, а прирост не отличим от Khan Academy без ИИ).*

## 3. Три вывода для продукта (ИИ-тьютор для 5 класса)

**Вывод 1. Guardrails и сократический диалог — обязательная архитектура, а не опция.** Главный риск LLM-тьютора — «костыль»: в RCT Bastani ученики, просившие ответы, решали больше на практике, но хуже на контрольной без ИИ.\[3\] Что из этого следует для продукта:
- решение не выдавать, пока ученик не сделал попытку;
- подсказки строить по лестнице: вопрос → намёк → частичный шаг → разбор аналогичной задачи (worked example; в мета-анализе Leite et al. наличие разобранных примеров — один из ключевых модераторов);
- держать эталонное решение в промпте, чтобы ИИ не ошибался в арифметике (так устроены GPT Tutor у Bastani и тьютор Kestin);\[3\]\[46\]
- регулярно проводить контроль **без ИИ** и считать его главной метрикой, а не точность на практике.

**Вывод 2. Карта пробелов и адаптивный уровень — ядро ценности, но эффект надо мерить на независимом тесте и долго.** Самые сильные эффекты адаптивных систем получены там, где система обучала на фактическом уровне ученика, а не на уровне его класса (Mindspark, Khan Academy в Индии). Но мета-анализы показывают, как эффекты сжимаются:
- от 0,46 при немедленном измерении до 0,155 к концу года (Leite et al. 2025);
- от 0,86 на локальных тестах до 0,16 на стандартизированных (Kulik & Fletcher 2016);\[38\]
- до g ≈ 0 для ITS по математике длительностью год и более (Steenbergen-Hu & Cooper 2013).\[40\]

Для 5 класса это значит: строить диагностику пробелов по предыдущим классам (дроби, деление, разрядность) с knowledge tracing, давать учителю отчёты, как в ASSISTments, и заранее планировать валидацию на внешнем стандартизированном тесте за полный учебный год.

**Вывод 3. Дозировка и проактивность важнее «интеллекта» модели.** Khanmigo провалился на вовлечённости, а не на качестве ответов: в 83% сессий с ошибкой ученики к нему не обращались, и Khan Academy в 2026 году переделала интерфейс так, чтобы тьютор включался сам.\[2\] Рабочие ориентиры:
- 30–50 минут в неделю в защищённом учебном времени (35 минут в неделю в RCT США, 47 минут в Индии, 2 × 30 минут у Rori);
- ≥3 сессий в неделю (тьюторинг в мета-анализе Nickow);\[44\]
- тьютор сам открывает диалог после ошибки;
- взрослый в контуре (учитель или координатор): в Индии одно лишь появление ответственного за практику подняло использование с 7,2 до 47,4 минуты в неделю и дало почти 0,5 SD;
- учительская панель на манер Tutor CoPilot — ИИ усиливает слабого взрослого сильнее всего.\[11\]

## 4. Что не найдено

- **RCT ИИ-тьюторов на базе LLM именно для 5 класса (10–11 лет) по математике.** Ближайшие данные: Rori (классы 3–8 по v2 препринта, без разбивки по классам в доступных версиях), Khanmigo (классы 6–8, коррекционная группа), Khan Academy в США (классы 3–8). Эффект для 5 класса — только **оценка** по смежным классам.
- **Рецензируемые публикации RCT Khanmigo.** Единственный найденный RCT (Oreopoulos & Low 2026) — рабочий документ EdWorkingPapers/NBER. Остальное — внутренние отчёты Khan Academy (корреляционные, ESSA Tier 3) и пилот Digital Promise без контрольной группы (https://digitalpromise.org/wp-content/uploads/2024/09/SRM-Gates-Khanmigo-Report-Final.pdf).
- **Рецензируемая версия Tutor CoPilot.** Я нашёл только рабочий документ и препринт arXiv 2410.03017 (последняя версия — v3 от 10 октября 2026 г., по-прежнему препринт). Данных об эффекте на стандартизированных тестах в конце года нет: исход — краткосрочные exit tickets.
- **Количественные эффекты Teach to One из RCT.** Есть только квазиэкспериментальная независимая оценка (эффекта нет) и исследование, выпущенное разработчиком (+0,16 SD без контроля).
- **Крупный RCT ALEKS против обычного обучения в K-12** с проверенным размером эффекта: найдено только сравнение с учителями (Craig et al. 2013).
- **Изолированный эффект «сократического диалога» в SD на стандартизированном тесте для младших школьников.** Bastani — старшая школа и проценты оценок; LearnLM — п.п. на задачах платформы, возраст 13–15.
- **Данные о долгосрочном удержании знаний** (через 6–12 месяцев) после LLM-тьюторов: ни в одном найденном RCT их нет.
- **Нигерийский RCT по математике.** Пилот World Bank касался английского языка;\[9\] экстраполяция 0,31 SD на математику — некорректна.
- **Пересчёты, сделанные мной (оценка):** «83% сессий с ошибкой без обращения к боту» — это **оценка** как 100% − 17% из данных Oreopoulos & Low. Тексты Bastani и Kestin я читал по препринтам и вторичным пересказам, потому что сайты PNAS и Nature блокировали загрузку. Числа в опубликованных версиях следует сверить перед печатью.

## Caveats

- Размеры эффекта несопоставимы напрямую: d/g на стандартизированных тестах, п.п. освоения темы и проценты оценок — разные метрики. Например, «+127%» у Bastani — это рост доли правильных ответов на практике, а не SD.
- Эффекты в странах с низким базовым уровнем (Гана, Индия, Нигерия) систематически выше, чем в США и Европе, потому что контрольная группа почти не прогрессирует. Для рынка с сильной школьной математикой ожидать 0,3+ SD не стоит. Реалистичный ориентир при хорошей реализации — **оценка** 0,1–0,2 SD за учебный год на внешнем тесте, по RCT в США (ASSISTments, Khan Academy, Khanmigo, Cognitive Tutor).
- Ряд ключевых работ 2024–2026 годов (Tutor CoPilot, LearnLM/Eedi, Rori, Khanmigo RCT, Khan Academy India, Leite et al., World Bank Nigeria) — препринты или рабочие документы без рецензии. В питче это нужно указывать.

## Sources

1. [Generative AI without guardrails can harm learning: Evidence from high school mathematics.](https://www.semanticscholar.org/paper/Generative-AI-without-guardrails-can-harm-learning:-Bastani-Bastani/60570ad3268871882c65f6ed4ead35db4b220528)
2. <https://edworkingpapers.com/sites/default/files/ai26-1551.pdf>
3. <https://hamsabastani.github.io/education_llm.pdf>
4. [ai tutoring can safely and effectively support students exploratory rct uk classrooms](https://scale.stanford.edu/ai/repository/ai-tutoring-can-safely-and-effectively-support-students-exploratory-rct-uk-classrooms)
5. [AI tutoring can safely and effectively support students: An exploratory RCT in UK classrooms — Lacuna](https://lacuna.tiptreesystems.com/work/ai-tutoring-can-safely-and-effectively-support-students-an-exploratory-rct-in-uk/wrk_fe1e03a46f9c3cf9d30e5b0ac2b47d90)
6. [AI Tutors Have Beaten Good Teaching and Cut Grades. Design Decides Which](https://worldassessmentcouncil.org/spotlight/ai-tutors-beat-good-teaching-and-cut-grades-design-decides/)
7. [How will AI change teaching? What the trials actually measured · Rahim Hirji](https://thesuperskills.com/research/how-will-ai-change-teaching)
8. [Page 1/14 AI Tutoring Outperforms Active Learning Gregory Kestin\*](https://projects.panickssery.com/docs/kestin-2024-ai_tutoring_harvard_physics.pdf)
9. [From Chalkboards to Chatbots : Evaluating the Impact of Generative AI on Learning Outcomes in Nigeria](https://ideas.repec.org/p/wbk/wbrwps/11125.html)
10. [World Bank AI tutoring pilot in Nigeria: what it found · Fermi News](https://news.fermi.ai/learning-ai/nigeria-ai-tutoring-pilot-study)
11. [ERIC - ED661562 - Tutor CoPilot: A Human-AI Approach for Scaling Real-Time Expertise. EdWorkingPaper No. 24-1054, Annenberg Institute for School Reform at Brown University, 2024-Oct](https://eric.ed.gov/?q=P9&ff1=eduGrade+8&id=ED661562)
12. [Tutor CoPilot: A Human-AI Approach for Scaling Real-Time Expertise](https://arxiv.org/html/2410.03017)
13. [Tutor CoPilot: A Human-AI Approach for Scaling Real-Time ...](https://edworkingpapers.com/sites/default/files/ai24-1054.pdf)
14. [What I found compelling in a new randomized trial of Khan Academy in math intervention - Khan Academy Blog](https://blog.khanacademy.org/what-i-found-compelling-in-a-new-randomized-trial-of-khan-academy-in-math-intervention/)
15. [NBER WORKING PAPER SERIES](https://www.nber.org/system/files/working_papers/w32388/w32388.pdf)
16. [Multiple Studies Show Khan Academy Drives Learning Gains: Evidence for Our Platform’s Effectiveness](https://blog.khanacademy.org/multiple-studies-show-khan-academy-drives-learning-gains-evidence-for-our-platforms-effectiveness)
17. [How In-School Supervised Ed-Tech Support Produces Massive Learning Gains: A Khan Academy Field Experiment in India](https://www.nber.org/papers/w34683)
18. [Efficacy results](https://2023-2024.annualreport.khanacademy.org/efficacy-results)
19. [Khan Academy Efficacy Results, November 2024 - Khan Academy Blog](https://blog.khanacademy.org/khan-academy-efficacy-results-november-2024/)
20. [Khan Academy Efficacy Results, November 2024](https://blog.khanacademy.org/?p=18194)
21. [Estimating the causal effects of Khan Academy Map Accelerator across demographic subgroups](https://educationaldatamining.org/edm2022/proceedings/2022.EDM-industry-track.112/index.html)
22. [Curmudgucation: How Khan Academy (and Others) Fudged Their Research](https://nepc.colorado.edu/blog/how-khan)
23. [Disrupting Education? Experimental Evidence on Technology-Aided Instruction in India - American Economic Association](https://www.aeaweb.org/articles?id=10.1257%2Faer.20171112)
24. [Disrupting Education? Evidence on Technology-Aided Instruction in India](https://www.povertyactionlab.org/evaluation/disrupting-education-evidence-technology-aided-instruction-india)
25. [ERIC - EJ1194398 - Online Mathematics Homework Increases Student Achievement, AERA Open, 2016](https://eric.ed.gov/?id=EJ1194398)
26. [ASSISTments](https://www.blueprintsprograms.org/programs/1261999999/assistments/print/)
27. [Study: 86375](https://ies.ed.gov/ncee/WWC/Study/86375)
28. [Effectiveness of Cognitive Tutor Algebra One Implemented at Scale](https://ies.ed.gov/use-work/awards/effectiveness-cognitive-tutor-algebra-one-implemented-scale)
29. [Working Paper Addendum to Effectiveness of Cognitive Tutor Algebra I at Scale](https://www.rand.org/content/dam/rand/pubs/working_papers/WR1000/WR1050/RAND_WR1050.pdf)
30. [CONSORTIUM FOR POLICY RESEARCH IN EDUCATION Final Impact results from the i3](https://newclassrooms.org/wp-content/uploads/Final-Impact-Results-i3-TtO.pdf)
31. [Study: 89751](https://ies.ed.gov/ncee/WWC/Study/89751)
32. [MarGrady Research Three-Year MAP Growth at Schools Using Teach to One: Math](https://newclassrooms.org/wp-content/uploads/Three-Year-MAP-Growth-at-Teach-to-One-Schools.pdf)
33. [Two Studies Shed Light on Student Math Gains in Teach to One - New Classrooms](https://newclassrooms.org/2019/02/21/news-release-two-studies-shed-light-on-student-gains-in-teach-to-one-math/)
34. [(PDF) The impact of a technology-based mathematics after-school program using ALEKS on student's knowledge and behaviors.](https://www.academia.edu/5050876/The_impact_of_a_technology_based_mathematics_after_school_program_using_ALEKS_on_students_knowledge_and_behaviors)
35. [The impact of a technology-based mathematics after-school program using ALEKS on student's knowledge and behaviors](https://www.sciencedirect.com/science/article/abs/pii/S0360131513001619)
36. <https://www.nber.org/system/files/working_papers/w32510/w32510.pdf>
37. [Effectiveness of Intelligent Tutoring Systems - James A. Kulik, J. D. Fletcher, 2016](https://journals.sagepub.com/doi/abs/10.3102/0034654315581420)
38. [Review of Educational Research March 2016, Vol. 86, No. 1, pp. 42–78](https://static1.squarespace.com/static/5cf7de352936000001a3add5/t/5d0bf9892a974d00013dc256/1561065866337/Kulik+&+Fletcher+Effectiveness+of+Intelligent+Tutoring+Systems.pdf)
39. [A meta-analysis of the effectiveness of intelligent tutoring systems on K–12 students’ mathematical learning.](https://www.semanticscholar.org/paper/A-meta-analysis-of-the-effectiveness-of-intelligent-Steenbergen-Hu-Cooper/5983ccffa2b0afc9e7a0b7866284439856b159f4)
40. [Do intelligent tutoring systems benefit K-12 students? A meta-analysis and evaluation of heterogeneity of treatment effects in the U.S](https://arxiv.org/pdf/2511.04997)
41. [Intelligent Tutoring Systems and Learning Outcomes: A Meta-Analysis Wenting Ma](https://www.apa.org/pubs/journals/features/edu-a0037123.pdf)
42. [Intelligent tutoring systems improve achievement over non-individualised instruction - Learning Design Wiki](http://wiki.learningdesignalliance.org/claims/adaptive-learning-improves-outcomes/)
43. [The Impressive Effects of Tutoring on PreK-12 Learning: A Systematic Review and Meta-Analysis of the Experimental Evidence](https://www.nber.org/papers/w27476)
44. [ERIC - EJ1406037 - The Promise of Tutoring for PreK-12 Learning: A Systematic Review and Meta-Analysis of the Experimental Evidence, American Educational Research Journal, 2024](https://eric.ed.gov/?id=EJ1406037)
45. [the transformative potential of tutoring for prek-12](https://www.povertyactionlab.org/sites/default/files/publication/Evidence-Review_The-Transformative-Potential-of-Tutoring.pdf)
46. [A Harvard trial found an AI tutor beat an active-learning class](https://schoolaiatlas.com/archive/harvard-physics-ai-tutor-rct-2025/)
