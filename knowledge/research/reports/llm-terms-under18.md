# Условия OpenAI, Anthropic и Google Gemini для пользователей младше 18 лет и для API с персональными данными детей (проверено 2026-11-17)

Короткий ответ: для ИИ-тьютора для детей 11–12 лет на API официальные условия прямо допускают только Anthropic Claude API и OpenAI API, и у каждого есть условия. Google Gemini API и Vertex AI запрещают использовать модель в любом сервисе, который «directed towards or is likely to be accessed by individuals under the age of 18».\[1\] OpenAI для детей младше 13 лет требует подключить zero data retention (ZDR) до того, как в API попадут их персональные данные.\[2\] Anthropic требует набора safeguards, раскрытия того, что пользователь общается с ИИ, и соблюдения COPPA.\[3\] Подходящая конфигурация — OpenAI API с одобренным ZDR и подписанным DPA, либо Claude API с выполненными «Guidelines for Organizations Serving Minors» и, по возможности, ZDR.

## TL;DR

- **Google Gemini API / AI Studio / Vertex AI для детского тьютора не подходят.** В Gemini API Additional Terms (действуют с 23 марта 2026) сказано: «You must be 18 years of age or older to use the APIs… will not use the Services as part of a website, application, or other service… directed towards or is likely to be accessed by individuals under the age of 18».\[1\] Google Cloud Service Specific Terms содержат такой же запрет для Generative AI Services, то есть для Vertex AI.\[4\] Детский Gemini (Family Link, Gemini for Education) — это потребительский и школьный продукт Google, а не разрешение для сторонних API-приложений.
- **OpenAI API можно использовать для детей до 13 лет только с ZDR.** Under-18 guidance для разработчиков: «You should not use OpenAI services to process any personal data of children under 13 or the applicable age of digital consent without first implementing zero data retention in our API».\[2\] Services Agreement (v.010126) запрещает «allow minors to use OpenAI Services without consent from their parent or guardian».\[5\] По умолчанию журналы abuse monitoring хранятся до 30 дней, на данных API модели не обучаются, DPA (обновлён 1 декабря 2025, действует с 1 января 2026) подключён к Services Agreement.\[6\]\[7\]\[8\]
- **Anthropic Claude API разрешает продукты для несовершеннолетних при выполнении требований.** Сам Claude.ai — только 18+.\[9\] Организация, которая даёт несовершеннолетним прямой доступ к продукту на API, должна выполнять «Guidelines for Organizations Serving Minors» (версия от 16 марта 2026): возрастная верификация, модерация, мониторинг, соблюдение COPPA с публичным заявлением об этом и раскрытие, что это ИИ.\[3\] По умолчанию данные API удаляются в течение 30 дней. ZDR доступен по отдельному соглашению.\[10\]

## 1. Сводная таблица: утверждение | цифра | год | ссылка | уверенность

Дата проверки всех строк — 2026-11-17. В столбце «год» указана дата вступления в силу или обновления документа, если она есть на странице.

| # | Провайдер | Утверждение (цитата/суть) | Цифра | Год / дата документа | Ссылка (URL) | Уверенность |
|---|---|---|---|---|---|---|
| 1 | OpenAI | Потребительские продукты (ChatGPT): «You must be at least 13 years old or the minimum age required in your country to consent… If you are under 18 you must have your parent or legal guardian's permission» | 13+; 13–17 с разрешением родителя\[11\] | Terms of Use (дата на странице не проверена) | https://openai.com/policies/row-terms-of-use/ | высокая |
| 2 | OpenAI | Privacy Policy: «Our Services are not directed to, or intended for, children under 13. We do not knowingly collect Personal Data from children under 13» | <13 — нет | редакция 2025-06-27 (архив)\[12\] | https://openai.com/policies/row-privacy-policy/revisions/2025-06-27/ | высокая |
| 3 | OpenAI | API, Services Agreement §3.3(c): клиент не допускает «allow minors to use OpenAI Services without consent from their parent or guardian» | <18 — согласие родителя | v.010126\[5\] (вероятно, 1 янв. 2026 — вывод по номеру версии) | https://cdn.openai.com/osa/openai-services-agreement.pdf | высокая (текст), средняя (дата) |
| 4 | OpenAI | API, Under-18 guidance: соблюдать COPPA; не обрабатывать персональные данные детей до 13 лет / до возраста цифрового согласия «without first implementing zero data retention» | <13 → обязательно ZDR\[2\] | дата на странице не указана | https://developers.openai.com/api/docs/guides/safety-checks/under-18-api-guidance | высокая |
| 5 | OpenAI | Safety standards для несовершеннолетних: раскрытия, соответствующие возрасту; фильтры контента; мониторинг с эскалацией; age assurance «where required or otherwise appropriate»; рекомендация использовать актуальные flagship-модели; OpenAI может проводить аудит, вплоть до приостановки доступа | 4 меры\[2\] | дата на странице не указана | https://developers.openai.com/api/docs/guides/safety-checks/under-18-api-guidance | высокая |
| 6 | OpenAI | Старая редакция Business Terms (2023): «send us any personal information of children under 13… or allow minors to use our Services without consent from their parent or guardian» — полный запрет данных детей <13 | <13 — запрет | авг./нояб. 2023 (архив)\[13\] | https://openai.com/policies/nov-2023-business-terms/ | высокая |
| 7 | OpenAI | App Developer Terms (приложения внутри ChatGPT): запрет «send us any personal information of children under 13» | <13 — запрет\[14\] | дата не проверена | https://openai.com/policies/developer-apps-terms/ | средняя |
| 8 | OpenAI | Журналы abuse monitoring для API хранятся «up to 30 days»; ZDR и Modified Abuse Monitoring доступны после одобрения, настраиваются в Settings → Organization → Data controls → Data Retention | 30 дней\[7\]\[15\] | дата на странице не указана | https://developers.openai.com/api/docs/guides/your-data | высокая |
| 9 | OpenAI | Данные API не используются для обучения (в таблице эндпоинтов «Data used for training: No»; без opt-in) | 0\[7\] | — | https://developers.openai.com/api/docs/guides/your-data | высокая |
| 10 | OpenAI | DPA: «Updated: December 1, 2025», «Effective: January 1, 2026»; подключён к Services Agreement (§5.3) | — | 2025-12-01 / 2026-01-01\[5\]\[6\] | https://openai.com/policies/data-processing-addendum/ | высокая |
| 11 | OpenAI | DPA не упоминает детей; о чувствительных данных: «No sensitive data is intended to be transferred unless the user includes it unexpectedly in unstructured data» | — | 2026-01-01\[6\] | https://openai.com/policies/data-processing-addendum/ | высокая |
| 12 | OpenAI | Enterprise privacy: DPA доступен для API, ChatGPT Business и Enterprise, заключается через форму DPA\[16\] | — | — | https://openai.com/enterprise-privacy/ | высокая |
| 13 | OpenAI | Usage Policies, раздел «Keep young people safe», обновление 2026-10-21: «clarified protections for children and teens» | <18 | 2026-10-21\[17\] | https://openai.com/policies/usage-policies/ | высокая |
| 14 | OpenAI | Объявлен план age prediction: «When we identify that a user is under 18, they will automatically be directed to a ChatGPT experience with age-appropriate policies» | <18 | 2025-09-16\[18\] | https://openai.com/index/building-towards-age-prediction/ | средняя (дата по сниппету) |
| 15 | OpenAI | Запущен родительский контроль в ChatGPT: «Available to all ChatGPT users starting today» | — | 2025-09-29\[19\] | https://openai.com/index/introducing-parental-controls/ | высокая |
| 16 | OpenAI | Начато развёртывание age prediction на потребительских планах ChatGPT; в ЕС — с 25 августа 2026 | — | 2026-01-20\[20\] | https://openai.com/index/our-approach-to-age-prediction/ | высокая |
| 17 | OpenAI | ChatGPT for Teens: пользователи 13–17 лет (заявленный или оценённый возраст) автоматически переводятся в режим для подростков; развёртывание «beginning August 18»\[21\]\[22\] | 13–17 | август (год на странице не указан; предположительно 2026) | https://help.openai.com/en/articles/20001421 | средняя |
| 18 | Anthropic | Claude.ai только 18+: «Our Consumer Terms of Service require individuals to be at least 18»; при сигналах о несовершеннолетнем аккаунт блокируется, затем можно пройти проверку возраста через Yoti | 18+\[9\] | дата не указана | https://www.anthropic.com/transparency/voluntary-commitments | высокая |
| 19 | Anthropic | «Our first-party consumer services are restricted to users 18 years and older»; разработчики на API должны соблюдать Usage Policy; если несовершеннолетние взаимодействуют с моделью напрямую, применяются Guidelines for Organizations Serving Minors | 18+\[23\] | дата не проверена | https://support.claude.com/en/articles/15591275-child-safety-guidance-for-developers | высокая |
| 20 | Anthropic | Guidelines for Organizations Serving Minors: age verification, content moderation, monitoring/reporting, образовательные материалы, child-safety system prompt | — | 2026-03-16\[3\] | https://support.claude.com/en/articles/9307344-responsible-use-of-anthropic-s-models-guidelines-for-organizations-serving-minors | высокая |
| 21 | Anthropic | Там же: соблюдение законов, «such as… COPPA», — ответственность организации; об этом нужно заявить «on the organization's website»; раскрытие «interacting with an AI system rather than a human» обязательно; Anthropic проводит периодические аудиты, при нарушениях возможна приостановка аккаунта | — | 2026-03-16\[3\] | то же | высокая |
| 22 | Anthropic | Обновление Usage Policy разрешило продукты для несовершеннолетних на API: «allows organizations to incorporate our API into their products for minors if they agree to implement certain safety features and disclose… AI system» (пример — tutoring);\[24\] «These changes will take effect on June 6, 2024» | — | блог от 10 мая 2024; вступило в силу 6 июня 2024 | https://www.anthropic.com/news/updating-our-usage-policy | высокая |
| 23 | Anthropic | Usage Policy: «Products serving minors… must comply with the additional guidelines… and all applicable laws»\[25\] | — | PDF: «Effective Date: November 12, 2026»; редакция опубликована 8 окт. 2026 в блоге «2026 Usage Policy update» («The updated policy takes effect on November 12») | https://www-cdn.anthropic.com/files/4zrzovbb/website/6ae2f5bb8675bcd9fac006125817ba1393b396e4.pdf | высокая |
| 24 | Anthropic | Предыдущая редакция Usage Policy вступила в силу 15 сентября 2025 | — | 2025-09-15 | https://www.anthropic.com/news/usage-policy-update | высокая\[26\] |
| 25 | Anthropic | API: «we automatically delete inputs and outputs on our backend within 30 days», кроме Files API, ZDR-соглашений, нарушений Usage Policy и требований закона; помеченные чаты — до 2 лет, оценки классификаторов — до 7 лет | 30 дней / 2 года / 7 лет\[10\] | дата не проверена (вторичные источники: 2026-07-01) | https://privacy.claude.com/en/articles/7996866-how-long-do-you-store-my-organization-s-data | высокая\[27\] |
| 26 | Anthropic | Для некоторых моделей («Covered Models») обязательно хранение 30 дней, даже если для организации включён ZDR | 30 дней\[28\]\[29\] | 2026 | https://platform.claude.com/docs/en/manage-claude/api-and-data-retention | средняя\[30\] |
| 27 | Anthropic | DPA: «This Data Processing Addendum ("DPA") is incorporated into and forms part of the Anthropic Commercial Terms of Service»; включает EU SCCs, UK Addendum и Swiss Addendum (Legal Center: DPA — Feb 24, 2025; Commercial Terms — Jun 17, 2025) | — | 2025-02-24 (DPA) / 2025-06-17 (Commercial Terms) | https://www.anthropic.com/legal | высокая |
| 28 | Google Gemini API / AI Studio | «You must be 18 years of age or older to use the APIs… will not use the Services as part of… API Clients… directed towards or is likely to be accessed by individuals under the age of 18» | 18+; запрет для детских приложений | Effective 2026-03-23\[1\] | https://ai.google.dev/gemini-api/terms | высокая |
| 29 | Google Gemini API | Та же оговорка была в PaLM API / MakerSuite Terms (с августа 2023)\[31\] | 18 | 2023-08-28 (архив) | https://ai.google.dev/gemini-api/terms-archive/terms_08_28_23 | высокая |
| 30 | Google Gemini API | Unpaid Services: данные используются для улучшения продуктов, возможен просмотр людьми, «Do not submit sensitive, confidential, or personal information»; в EEA/CH/UK только платные сервисы | — | 2026-03-23\[1\] | https://ai.google.dev/gemini-api/terms | высокая |
| 31 | Google Gemini API | Paid Services: промпты не используются для улучшения продуктов, обработка по «Data Processing Addendum for Products Where Google is a Data Processor» | — | 2026-03-23\[1\] | https://ai.google.dev/gemini-api/terms | высокая |
| 32 | Google Gemini API | Abuse monitoring: «Google retains the following data for fifty-five (55) days» | 55 дней\[32\] | дата не указана | https://ai.google.dev/gemini-api/docs/usage-policies | высокая\[33\] |
| 33 | Google Gemini API | Отдельная страница о ZDR в Gemini Developer API (условия: без Grounding Search/Maps — там хранение 30 дней, без Files/Live API, отключённое кэширование и т.д.) | 30 дней для grounding\[34\] | дата не указана | https://ai.google.dev/gemini-api/docs/zdr | средняя\[35\] |
| 34 | Google Vertex AI | Service Specific Terms, Generative AI Services, Age Restrictions: «Customer will not, and will not allow End Users to, use a Generative AI Service as part of a website… directed towards or is likely to be accessed by individuals under the age of 18» | 18\[4\] | дата не проверена | https://cloud.google.com/terms/service-terms | высокая |
| 35 | Google Vertex AI | ZDR достижим при выполнении условий (отказ от prompt logging для abuse monitoring, отключение кэширования, store=false и т.д.)\[32\]\[36\] | — | дата не указана | https://cloud.google.com/vertex-ai/generative-ai/docs/vertex-ai-zero-data-retention | высокая\[37\]\[38\] |
| 36 | Google (потребит.) | Gemini Apps: «Children under 13… can sign into Gemini Apps»; родители управляют доступом через Family Link; не доступно для <13 в UK, EEA и Швейцарии | <13 через Family Link | 2025 (запуск — по новостям, май 2025) | https://support.google.com/gemini/answer/16109150 | высокая\[39\]\[40\] |
| 37 | Google (образование) | Gemini for Education: «The Gemini app is available to users of all ages»; отдельный режим для <18; Core Service по Workspace for Education Terms | все возрасты | дата не указана | https://edu.google.com/intl/ALL_us/ai/gemini-for-education/ | высокая\[41\] |
| 38 | Google (образование) | Google Workspace with Gemini (add-on) «unavailable to users under age 18» | 18+\[42\] | дата не указана | https://support.google.com/a?p=edu_supported_editions | средняя\[43\] |

## 2. Пять фактов для питча

1. **Google Gemini API и Vertex AI прямо запрещают приложения, которые могут использовать люди младше 18 лет.** Формулировка «directed towards or is likely to be accessed by individuals under the age of 18» есть в Gemini API Additional Terms (с 23.03.2026) и в Google Cloud Service Specific Terms.\[1\]\[4\] Источники: https://ai.google.dev/gemini-api/terms, https://cloud.google.com/terms/service-terms
2. **OpenAI требует ZDR, если в API попадают персональные данные детей младше 13 лет.**\[2\] Источник: https://developers.openai.com/api/docs/guides/safety-checks/under-18-api-guidance
3. **Anthropic с 6 июня 2024 года (блог от 10 мая 2024) прямо разрешает продукты на Claude API для несовершеннолетних и приводит в пример tutoring.** Обязательные условия: safety-меры и раскрытие, что это ИИ. Источники: https://www.anthropic.com/news/updating-our-usage-policy, https://support.claude.com/en/articles/9307344
4. **По умолчанию срок хранения данных API — 30 дней у OpenAI и Anthropic и 55 дней у Gemini API (abuse monitoring).**\[7\]\[10\]\[32\]\[33\] Ни один из трёх провайдеров не обучает модели на данных платного API без opt-in.\[44\]\[45\]\[46\] Источники: https://developers.openai.com/api/docs/guides/your-data, https://privacy.claude.com/en/articles/7996866, https://ai.google.dev/gemini-api/docs/usage-policies
5. **Потребительские ИИ-продукты не предназначены для 11–12-летних.** ChatGPT — от 13 лет и с разрешением родителя до 18, Claude.ai — только 18+.\[9\]\[11\] Детский Gemini работает только через Family Link и недоступен для детей до 13 лет в ЕС, Великобритании и Швейцарии.\[39\]\[47\] Это создаёт нишу для специализированного тьютора с родительским согласием. Источники: https://openai.com/policies/row-terms-of-use/, https://www.anthropic.com/transparency/voluntary-commitments, https://support.google.com/gemini/answer/16109150

## 3. Три вывода для продукта (ИИ-тьютор, 11–12 лет, API)

**Вывод 1. Выбор провайдера: OpenAI API с ZDR (основной вариант) или Claude API (альтернатива или резерв). Gemini исключён.**
- Gemini API, AI Studio и Vertex AI нельзя использовать даже на платном тарифе и даже с ZDR, потому что возрастной запрет — договорный. В ответах на форуме разработчиков Google отказывается давать индивидуальные исключения.\[48\] Никакое родительское согласие этот запрет не снимает.\[49\]
- У OpenAI для детей до 13 лет есть прямо прописанный путь: родительское согласие (§3.3(c) Services Agreement), ZDR (требование under-18 guidance), DPA и safety standards. Без одобренного ZDR этим путём пользоваться нельзя: ZDR выдаётся только после одобрения OpenAI.\[46\]
- Anthropic разрешает такой сценарий при выполнении Guidelines. Прямого требования ZDR для детей до 13 лет там нет, но для минимизации данных его стоит запросить. Учтите, что у «Covered Models» хранение 30 дней обязательно даже при ZDR, поэтому модель нужно выбирать с оглядкой на это.\[30\]\[45\]\[50\]

**Вывод 2. Обязательный минимум до запуска:**
- **Проверяемое согласие родителей (verifiable parental consent).** Его требует COPPA для детей до 13 лет в США; в ЕС действует GDPR ст. 8, где возраст цифрового согласия от 13 до 16 лет в зависимости от страны.\[51\]\[52\] Это же требует договор OpenAI. Учётную запись должен создавать родитель, а возраст нужно подтверждать (age assurance / age verification требуют Anthropic и, «where required», OpenAI).\[2\]\[3\]
- **Минимизация данных.** Не передавать в модель имя, школу, контакты и фото ребёнка; использовать псевдонимы. Подать заявку на ZDR (OpenAI — через sales/Data controls, Anthropic — через отдельное соглашение). Не использовать функции, которые хранят данные: Files API, stored responses, grounding.
- **DPA.** У OpenAI — DPA от 01.01.2026, подключённый к Services Agreement (есть и форма для подписания).\[6\]\[16\] У Anthropic — DPA от 24.02.2025, который «is incorporated into and forms part of» Commercial Terms от 17.06.2025 (anthropic.com/legal). В DPA OpenAI сказано, что передача чувствительных данных «not intended», поэтому данные о здоровье, особых образовательных потребностях и т.п. в промпты не отправляйте.\[6\]
- **Safeguards.** Детский system prompt (Anthropic предоставляет child-safety system prompt), фильтры ввода и вывода, мониторинг с эскалацией в рискованных ситуациях (самоповреждение, груминг), явное раскрытие «ты говоришь с ИИ», публичная страница о соблюдении COPPA/GDPR. Anthropic этого требует; OpenAI проводит аудиты.\[3\]

**Вывод 3. Основные риски:**
- **Договорный риск.** Условия часто меняются (у Anthropic в 2025–2026 вышли две редакции Usage Policy — с 15.09.2025 и с 12.11.2026, у OpenAI Usage Policies обновлены 21.10.2026). Нужен ежеквартальный мониторинг; фиксируйте версии документов на момент подписания.
- **Остаточное хранение.** Даже при ZDR Anthropic хранит помеченные нарушения до 2 лет, а OpenAI оставляет за собой право сделать отдельные модели неподходящими для ZDR «if reasonably necessary to investigate or prevent severe risk activity», с предварительным письменным уведомлением. Это нужно отразить в DPIA и в уведомлении для родителей.
- **Аудит и блокировка.** Оба провайдера могут проверить соответствие и при высоком уровне нарушений приостановить доступ.\[2\]\[3\] Нужен резервный провайдер и собственный слой модерации.
- **Юрисдикция.** Для ЕС, Великобритании и других стран (в т.ч. России, если продукт там работает) нужна отдельная юридическая оценка: локальные законы о детских данных провайдеры перекладывают на разработчика.

## 4. Что не найдено или не подтверждено на официальных страницах

- **Anthropic DPA:** DPA (Feb 24, 2025) и Commercial Terms (Jun 17, 2025) опубликованы в Legal Center (anthropic.com/legal); там же есть «U.S. K-12 Terms of Service» и «U.S. K-12 Data Processing Agreement» от 28 августа 2026 — их стоит изучить отдельно, если продукт работает со школами США. Явного упоминания детей в стандартном DPA Anthropic я не нашёл.
- **Anthropic ZDR:** процедура подключения (кто имеет право, как подать заявку) не подтверждена официальной страницей. На privacy.claude.com упомянуто только «zero data retention agreement».\[10\]
- **Дата блога Anthropic «Updating our Usage Policy»** подтверждена: блог от 10 мая 2024, изменения, разрешившие продукты для несовершеннолетних, вступили в силу 6 июня 2024.
- **Действующая версия Usage Policy Anthropic:** расхождения нет — редакция опубликована 8 октября 2026 в официальном блоге «2026 Usage Policy update» и вступила в силу 12 ноября 2026 (PDF: «Effective Date: November 12, 2026»).
- **OpenAI Services Agreement:** HTML-страницу открыть не удалось, текст взят из официального PDF v.010126. Точная дата вступления в силу не подтверждена. В текущей редакции §3.3 нет отдельного запрета на персональные данные детей до 13 лет (он был в Business Terms 2023); теперь это требование сформулировано в under-18 guidance как условие ZDR.\[2\]\[5\]\[53\]
- **Дата публикации «Introducing ChatGPT for Teens»** не подтверждена: на странице помощи указано «beginning August 18» без года.\[21\]
- **ChatGPT Edu:** условия для несовершеннолетних не изучались. По имеющимся данным, продукт ориентирован на вузы и к API-тьютору для детей неприменим.
- **Google:** номер раздела Service Specific Terms (§20(d)) и дата его редакции не проверены. Процедура запроса ZDR для Gemini Developer API на официальной странице не описана. Поскольку возрастной запрет делает эти вопросы неактуальными, дальше я их не исследовал.
- **Упоминание GDPR ст. 8:** ни один из трёх провайдеров не ссылается на ст. 8 GDPR явно. OpenAI говорит об «applicable age of digital consent», Anthropic и OpenAI называют COPPA.\[2\]\[3\]

## Sources

1. [Gemini API Additional Terms of Service | Google AI for Developers](https://ai.google.dev/gemini-api/terms)
2. [Under-18 guidance](https://developers.openai.com/api/docs/guides/safety-checks/under-18-api-guidance)
3. [Responsible Use of Anthropic's Models: Guidelines for Organizations Serving Minors | Claude Help Center](https://support.claude.com/en/articles/9307344-responsible-use-of-anthropic-s-models-guidelines-for-organizations-serving-minors)
4. [Service Specific Terms | Google Cloud](https://cloud.google.com/terms/service-terms)
5. <https://cdn.openai.com/osa/openai-services-agreement.pdf>
6. <https://openai.com/policies/data-processing-addendum/>
7. [Data controls in the OpenAI platform](https://developers.openai.com/api/docs/guides/your-data)
8. [OpenAI API data controls for regulated firms](https://vantagepoint.io/docs/openai-api-data-controls)
9. [Anthropic’s Transparency Hub \\ Anthropic](https://www.anthropic.com/transparency/voluntary-commitments)
10. [How long do you store my organization’s data?](https://privacy.claude.com/en/articles/7996866-how-long-do-you-store-my-organization-s-data)
11. [Terms of Use](https://openai.com/policies/row-terms-of-use/)
12. [Privacy policy](https://openai.com/policies/row-privacy-policy/revisions/2025-06-27/)
13. [Business terms - November 2023](https://openai.com/policies/nov-2023-business-terms/)
14. [App Developer Terms](https://openai.com/policies/developer-apps-terms/)
15. [Zero Data Retention for ChatGPT and the OpenAI API: A Life Sciences Deep Dive](https://intuitionlabs.ai/insights/guides/zero-data-retention-chatgpt-openai-api-life-sciences)
16. [Enterprise privacy at OpenAI](https://openai.com/enterprise-privacy/)
17. [Usage policies](https://openai.com/policies/usage-policies/)
18. [Building towards age prediction](https://openai.com/index/building-towards-age-prediction/)
19. <https://openai.com/index/introducing-parental-controls/>
20. [Rolling out age prediction](https://openai.com/index/our-approach-to-age-prediction/)
21. [ChatGPT for Teens](https://help.openai.com/en/articles/20001421)
22. [Introducing ChatGPT for Teens: Built for learning, backed by protections](https://openai.com/index/chatgpt-for-teens/)
23. [Child safety guidance for developers](https://support.claude.com/en/articles/15591275-child-safety-guidance-for-developers)
24. [Updating our Usage Policy \\ Anthropic](https://www.anthropic.com/news/updating-our-usage-policy)
25. [Anthropic](https://www-cdn.anthropic.com/files/4zrzovbb/website/6ae2f5bb8675bcd9fac006125817ba1393b396e4.pdf)
26. [Usage Policy update \\ Anthropic](https://www.anthropic.com/news/usage-policy-update)
27. [Claude Privacy: Training, Retention and GDPR by Plan](https://kevinwelter.com/en/blog/claude-datenschutz-dsgvo)
28. [Does Anthropic store your API prompts? Data retention, ZDR and residency (2026)](https://www.developersdigest.tech/models/data-retention/anthropic)
29. [API and data retention - Claude Platform Docs](https://platform.claude.com/docs/en/manage-claude/api-and-data-retention)
30. [Claude Data Retention Explained: 30-Day Rules, ZDR and Project Settings](https://beevaults.com/claude-data-retention/)
31. [PaLM API and MakerSuite Additional Terms of Service | Gemini API | Google AI for Developers](https://ai.google.dev/gemini-api/terms-archive/terms_08_28_23)
32. [Google Gemini DPA, GDPR & AI Act compliance review](https://companyscope.io/vendors/google-gemini)
33. [Abuse monitoring | Gemini API | Google AI for Developers](https://ai.google.dev/gemini-api/docs/usage-policies)
34. [Google Gemini Developer API, paid tier zero data retention (ZDR): terms and exceptions](https://zdr.dev/e/gemini-api-paid)
35. [Zero data retention in the Gemini Developer API | Gemini API | Google AI for Developers](https://ai.google.dev/gemini-api/docs/zdr)
36. [Everything You Should Know About Google Gemini Data Retention Policy](https://anarlog.so/blog/google-gemini-data-retention-policy/)
37. [Vertex AI and zero data retention | Generative AI on Vertex AI | Google Cloud Documentation](https://cloud.google.com/vertex-ai/generative-ai/docs/data-governance?authuser=2)
38. [Gemini Enterprise Agent Platform and zero data retention | Google Cloud Documentation](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/vertex-ai-zero-data-retention)
39. [Manage your child's access to Gemini Apps - Gemini Apps Help](https://support.google.com/gemini/answer/16109150?hl=en-SG&amp=&ref_topic=13194540)
40. [Google makes Gemini chatbot accessible for children under 13](https://www.heise.de/en/news/Google-makes-Gemini-chatbot-accessible-for-children-under-13-via-Family-Link-10370970.html)
41. [Empower Learning with Gemini for Education - Google for Education](https://edu.google.com/intl/ALL_us/ai/gemini-for-education/)
42. [Google Workspace Service Specific Terms](https://workspace.google.com/terms/service-terms-20241015/)
43. [Turn the Gemini app on or off | Google Workspace with Gemini | Google Workspace Help](https://support.google.com/a?p=edu_supported_editions&hl=en-YT)
44. [Claude data privacy: training, retention and access by plan](https://strategized.ai/claude-security/data-privacy/)
45. [Is Claude safe for company data? Training and retention](https://jazz.security/dlp-explained/dlp-basics/is-claude-safe-for-company-data/)
46. [What is zero data retention and how can my organization get it?](https://harriethq.com/blog/zero-data-retention/)
47. [PSA: Google’s Gemini AI is coming to your kid’s device, but you can turn it off](https://www.androidpolice.com/google-gemini-ai-kids/)
48. [Gemini API age restriction: can a 13+ app use Gemini only for verified 18+ users? - Gemini API - Google AI Developers Forum](https://discuss.ai.google.dev/t/gemini-api-age-restriction-can-a-13-app-use-gemini-only-for-verified-18-users/198103)
49. [P0 AI compliance: Gemini API under-18 restriction for child-facing English app · Issue #114 · TMA2015/self-learning-english · GitHub](https://github.com/TMA2015/self-learning-english/issues/114)
50. [Privacy-First AI APIs: Which Ones Don't Train on Your Data](https://www.aipolicydesk.com/blog/privacy-first-ai-api-no-training-gdpr-ccpa-2026)
51. [ChatGPT information about my child: what to do](https://reputation.partners/ai-answers-about-your-child-or-minor-family-member)
52. [Children's Online Privacy Protection Act of 1998](https://webarchive.library.unt.edu/eot2008/20090511222502mp_/http:/www.ftc.gov/ogc/coppa1.htm)
53. [Business terms - August 2023](https://openai.com/policies/aug-2023-business-terms/)
