# Распознавание (ASR) и синтез (TTS) узбекской речи: модели, WER/CER и детская речь (состояние на ноябрь 2026)

Открытых измерений на узбекской речи нет ни у одного коммерческого провайдера: ни у VoiceLab, ни у Google, Yandex, Azure или ElevenLabs. Ни один публичный бенчмарк не проверял детскую узбекскую речь. Поэтому для ИИ-тьютора провайдера нужно выбирать по собственному тесту на детских записях, а не по цифрам из интернета. Проверяемые цифры в открытом доступе показывают три вещи. «Голый» Whisper на узбекском практически не работает: WER около 90–110%.\[1\]\[2\]\[3\] Модели, дообученные на узбекском, дают 7–15% WER на чтении взрослых.\[4\]\[5\] На живой разговорной речи взрослых лучшие системы дают 15–28% WER.\[6\]

## TL;DR

- **ASR:** Whisper без дообучения на узбекском непригоден. В статье OpenAI у large-v2 WER 90,2% на FLEURS, а в независимом тесте 2026 года у large-v3 105,4% на FLEURS и 109,9% на Common Voice. Дообученные открытые модели (GigaAM Multilingual, Whisper-medium от NavAI, NVIDIA FastConformer) дают 7–17% WER на чтении взрослых. VoiceLab (Sado v2) публично заявляет, что превосходит Gemini, но не приводит ни одной цифры и ни одной методики.
- **TTS:** узбекский поддерживают Azure (голоса Madina и Sardor), Yandex SpeechKit (с июня 2023), ElevenLabs (v3/v4), VoiceLab (Lison, открытая Navoiy TTS) и Gemini-TTS. Опубликованных MOS для коммерческих узбекских голосов нет. Есть только академическая TurkicTTS: MOS 2,85 для узбекского.
- **Детская речь:** открытого детского корпуса узбекской речи и замеров WER на узбекских детях мы не нашли. По данным для других языков, ошибки растут в разы. В «Arabic Little STT» (arXiv 2510.23319; 288 детей 6–13 лет) у Whisper large-v3 66% WER на детской речи против «sub 0.20» на взрослых датасетах. В бенчмарке DrivenData (2026, английский) на корпусе Ellis Weismer (дети 2,5–5,5 лет) у Whisper 76% WER, у KidWhisper 70%. Это главный риск продукта, и его нужно измерить самостоятельно.

## Key Findings

### 1. Таблица ASR (распознавание)

Пометка **[взрослые]** означает, что тестировались только взрослые дикторы или данные явно взрослые (FLEURS, Common Voice, USC, подкасты). Если о возрасте ничего не сказано, мы считаем данные взрослыми: ни в одном из источников детская речь не выделена.

| Утверждение (модель / тест / методика) | Цифра | Год | Ссылка | Уверенность |
|---|---|---|---|---|
| Whisper (zero-shot, без дообучения), FLEURS uz, test. Базовый нормализатор OpenAI: lowercase, удаление пунктуации и скобок. В обучении было всего 0,3 ч узбекского ASR **[взрослые]**\[7\] | WER: tiny 105,2%; base 114,0%; small 107,7%; medium 109,6%; large 93,3%; large-v2 90,2%\[3\] | 2022 (дек.) | https://cdn.openai.com/papers/whisper.pdf (arXiv 2212.04356, Table 13) | Высокая |
| Whisper large-v3 (zero-shot, greedy), Common Voice / FLEURS / внутренний «in-the-wild» набор (краудсорсинг, 6–20 ч). Нормализация: lowercase, без пунктуации; исключены фразы длиннее 30 с и с цифрами **[взрослые]** | WER 109,9% (CV) / 105,4% (FLEURS) / 120,6% (internal)\[5\] | 2026 (июль) | https://arxiv.org/html/2607.10371v1 (GigaAM Multilingual, Table 1) | Высокая |
| SeamlessM4T v2 large (с принудительным языком), те же наборы и методика **[взрослые]** | WER 25,1% (CV) / 11,9% (FLEURS) / 40,0% (internal)\[5\] | 2026 | https://arxiv.org/html/2607.10371v1 | Высокая |
| Meta Omnilingual 1B LLM ASR, те же наборы **[взрослые]** | WER 32,8% / 15,4% / 30,2%\[5\] | 2026 | https://arxiv.org/html/2607.10371v1 | Высокая |
| GigaAM Multilingual (SaluteDevices, открытые веса, CTC; дообучение на 313 ч открытых + 272 ч краудсорсинговых узбекских данных) **[взрослые]** | WER 9,2% (CV) / 7,3% (FLEURS) / 12,7% (internal)\[5\]\[8\] | 2026 | https://arxiv.org/html/2607.10371v1 | Высокая (метрики авторов модели) |
| Энкодер Whisper large-v3, дообученный с CTC на тех же данных, что и GigaAM (контролируемое сравнение), WER усреднён по сплитам **[взрослые]** | 13,8% (Uzbek) против 10,5% у GigaAM 600M\[5\] | 2026 | https://arxiv.org/html/2607.10371v1 (Table 5) | Высокая |
| BuzzASR: CER на объединённом тесте FLEURS + Common Voice; Whisper-large-v3 как baseline **[взрослые]** | CER: Whisper 88,86%; MMS 27,89%; Omnilingual 1B 25,46%; Omnilingual 7B 19,76%; BuzzASR (SFT) 16,00%\[1\] | 2026 (сент.) | https://arxiv.org/html/2609.09554v1 (Table 7) | Средняя |
| USC (ISSAI + ТУИТ): 105 ч, 958 дикторов. Лучшая E2E-модель с LM, speed perturbation и SpecAugment **[взрослые]**\[9\] | WER 18,1% (valid) / 17,4% (test); лучший DNN-HMM 23,5% (test)\[10\]\[11\]\[12\] | 2021 | https://arxiv.org/pdf/2107.14419 | Высокая |
| ISSAI TurkicASR: мультиязычная модель на 10 тюркских языков; тест USC и Common Voice 10 **[взрослые]**\[13\] | Модель usc_turkic на тесте USC: CER 3,2% / WER 10,8%. На тесте CV для узбекского и турецкого: CER ≈2,9%, WER 8,7–10,2%\[14\] | 2023 | https://doi.org/10.3390/info14020074 | Средняя |
| FeruzaSpeech (60 ч, одна дикторша из Ташкента): модель с добавлением корпуса, тест USC **[взрослые]**\[15\] | WER 11,67% на usc-test\[15\] | 2024 | https://arxiv.org/pdf/2410.00035 | Средняя |
| NavAI whisper-medium-uzbek: дообучение на 753 ч исключительно человеческой транскрипции, данные авторов (self-reported) **[взрослые]** | WER 14,11% (FLEURS test) / 7,69% (CV 22.0 test) / 9,70% (USC test) / 7,41% (FeruzaSpeech)\[4\] | 2026 | https://huggingface.co/Mannon/whisper-medium-uzbek | Средняя |
| NavAI whisper-small-uzbek, те же наборы **[взрослые]** | WER 16,96% / 9,58% / 11,81% / 7,95%\[16\] | 2026 | https://huggingface.co/Mannon/whisper-small-uzbek | Средняя |
| NVIDIA FastConformer-Hybrid Large (uz). По официальной карточке NVIDIA (CC-BY-4.0): «around 115M parameters», обучена на MCV 17.0 Uzbek (~90 ч), UzbekVoice (~900 ч) и FLEURS Uzbek (~10 ч); замер Transducer, greedy. Копия под именем «sado» у algorithco **не связана с VoiceLab** **[взрослые]** | FLEURS dev: WER 17,52% (с регистром и пунктуацией), 10,73% (без них); MCV test: 16,46% / 7,18%\[17\] | н/д (карточка) | https://huggingface.co/nvidia/stt_uz_fastconformer_hybrid_large_pc (копия: https://huggingface.co/algorithco/sado) | Средняя |
| Auris 1 (независимая модель), FLEURS uz_uz test, 707 клипов. Нормализация: цифры словами, lowercase, без пунктуации **[взрослые]** | WER 13,96% / CER 3,79% (с 4-gram LM); greedy 24,02%\[18\] | 2026 | https://huggingface.co/elchintoyirov/auris-1-uzbek-stt | Средняя |
| Ранние дообученные Whisper: BlueRaccoon whisper-small-uz (CV11 test, FLEURS test) **[взрослые]** | WER 23,65% (CV11) / 47,15% (FLEURS)\[19\] | 2022 | https://huggingface.co/BlueRaccoon/whisper-small-uz | Средняя |
| aisha-org/Whisper-Uzbek (Whisper-medium от команды Aisha, ныне VoiceLab; CV 17.0, eval-сплит; нормализация не указана) **[взрослые]** | WER 31,78%\[20\] | ~2024 | https://huggingface.co/aisha-org/Whisper-Uzbek | Средняя (это старая модель, не Sado) |
| Независимый бенчмарк uzbek-stt-bench: живой разговорный узбекский (подкаст, 5 мин, 3 мужских голоса, Ташкент, смешение с русским и английским). Эталон набран носителем вручную; нормализация: lowercase, без пунктуации, унификация апострофов **[взрослые]**\[6\] | WER: gemini-3-flash 15,3%; NeuronAI 21,4%; Muxlisa 22,2%; Ovoz AI 23,4%; Gemini-3.5-transcribe 24,5–25,8%; ElevenLabs Scribe v1 24,9%; UzbekVoice 28,1%\[6\] | 2026 (07.09) | https://github.com/avazibra/uzbek-stt-bench | Средняя-низкая (1 клип, 1 аннотатор) |
| Whisper-large-v3-turbo без дообучения на 20 клипах FLEURS uz dev **[взрослые]** | WER 114,1% / CER 81,1%\[21\] | 2026 | https://github.com/Elshod09K/Uzbek-Whisper | Низкая (20 клипов) |
| Коммерческий «Aisha STT» на ~2 ч голосовых сообщений из Telegram (замер конкурента OvozifyLabs, версия и нормализация не указаны) **[взрослые, по-видимому]**\[8\] | WER 41,71%\[22\] | н/д | https://huggingface.co/OvozifyLabs/whisper-small-uz-v1 (цитируется на biruniy.uz) | Низкая |
| VoiceLab Sado v2: «consistently outperforming broader industry benchmarks, including Gemini» (LinkedIn)\[23\]\[24\] | Цифр нет, методики нет | 2026 (нояб.) | https://www.linkedin.com/in/elzodxon/ | **Не проверено** (маркетинг) |
| Mohirdev AI Lab (Mohir.ai): на сайте «WER: 12%» для STT\[25\] | 12% (датасет не указан) | 2026 | https://mohirdev.ai/ | **Не проверено** (маркетинг) |
| Biruniy (Etamin): «Biruniy STT v1.0: 7–8% WER» на собственном Gold Test Set\[8\] | 7–8% / 5–6% «lab»\[8\] | 2026 | https://www.biruniy.uz/ | **Не проверено** (маркетинг, закрытый тест) |
| Google Cloud Speech-to-Text: узбекский (uz-UZ) добавлен 05.03.2020; в API V2 доступны модели chirp, chirp_2 и chirp_3 (в зависимости от региона)\[26\]\[27\] | Опубликованного WER для uz нет | 2020–2026 | https://docs.cloud.google.com/speech-to-text/docs/speech-to-text-supported-languages | Высокая (факт поддержки) |
| Azure Speech: uz-UZ поддерживается в STT, включая Fast transcription\[28\] | WER не опубликован | 2026 | https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support | Высокая (факт поддержки) |
| Yandex SpeechKit: узбекский (латиница) добавлен в июне 2023 как 16-й язык. По Хабру, «специалисты Yandex Cloud собрали датасет с тысячами часов аудио и их расшифровками, в том числе… имена, адреса, даты и числа»; точный объём в часах не раскрыт | WER не опубликован | 2023 | https://habr.com/ru/news/741880/ ; https://aistudio.yandex.ru/ru/docs/speechkit/stt/models | Высокая (факт поддержки) |

### 2. Таблица TTS (синтез)

| Утверждение | Цифра | Год | Ссылка | Уверенность |
|---|---|---|---|---|
| TurkicTTS (ISSAI): мультиязычный Tacotron 2 через транслитерацию в IPA; субъективная оценка, 22 оценщика для узбекского\[29\] | MOS 2,85 (узбекский); по 10 языкам от 2,37 до 4,18, в среднем 3,25\[29\] | 2023 | https://arxiv.org/html/2305.15749v1 | Средняя |
| «Uzbek Speech Synthesis Using Deep Learning Algorithms» (Springer) | MOS 4,36 («intelligibility and accuracy»); методика в аннотации не раскрыта\[30\] | 2023 | https://link.springer.com/chapter/10.1007/978-3-031-27199-1_5 | Низкая-средняя |
| Navoiy TTS (VoiceLab/Aisha, открытая, Apache-2.0): дообучение CosyVoice2-0.5B, 10 эмоциональных пресетов, нормализатор текста. В карточке прямо сказано, что демо не заменяет MOS-оценку\[31\]\[32\] | MOS / CER не опубликованы | 2026 (16.07) | https://huggingface.co/aisha-org/navoiy-tts ; https://aisha.group/en/blog/navoiy-tts-open-source-uzbek-text-to-speech | Высокая (факт отсутствия метрик) |
| Сторонний замер Navoiy: ресинтез → ASR | CER 0–3,4% на нескольких тестовых предложениях\[33\] | 2026 (окт.) | https://github.com/asilbekali/TH-Labs-full/pull/43 | Низкая (горстка фраз) |
| VoiceLab Lison v2: «quality on par with ElevenLabs v4» по внутренним оценкам\[24\]\[34\] | Цифр нет | 2026 (нояб.) | LinkedIn (пост сотрудника VoiceLab, найден через профиль https://www.linkedin.com/in/elzodxon/) | **Не проверено** (маркетинг) |
| Azure Neural TTS: голоса uz-UZ-MadinaNeural (жен.) и uz-UZ-SardorNeural (муж.)\[28\]\[35\] | MOS для узбекского не опубликован | 2021–2026 | https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support | Высокая (факт поддержки) |
| Yandex SpeechKit: синтез узбекского по записям реального диктора, поддержка фонемной разметки для коррекции произношения\[36\]\[37\] | MOS не опубликован | 2023 | https://yandex.cloud/ru-kz/blog/posts/2023/06/speechkit-uzbek-language | Высокая (факт поддержки) |
| ElevenLabs: узбекский (uz) в списке языков моделей v3 / v3 Conversational / v4\[38\] | MOS для узбекского не опубликован | 2025–2026 | https://elevenlabs.io/docs/overview/models | Средняя-высокая |
| Google: Gemini-TTS (Gemini 3.8 Flash TTS) указывает «Northern Uzbek» в списке языков. Нативных голосов uz-UZ в классическом Cloud TTS (Chirp 3 HD, WaveNet) мы не нашли\[39\]\[40\] | Метрик нет | 2026 | https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/text-to-speech/overview | Средняя |
| Meta MMS-TTS не поддерживает узбекский на латинице (по данным статьи MDPI)\[41\] | — | 2025 | https://www.mdpi.com/2076-3417/15/24/12880 | Средняя |
| Экспериментальная F5-TTS Uzbek: 14 предложений, ресинтез через узбекскую ASR; MOS не измерялся\[42\] | WER 10,8% / CER 1,8%\[42\] | 2026 | https://huggingface.co/mrmuminov/f5-tts-uzbek | Низкая |

### 3. Детская речь

| Утверждение | Цифра | Год | Ссылка | Уверенность |
|---|---|---|---|---|
| Открытый детский корпус узбекской речи или замер WER на узбекских детях | **Не найдено** | — | — | — |
| Арабский язык (не узбекский): Arabic Little STT (Alkadri, Desouki, Al Jallad): 355 фраз от 288 детей 6–13 лет, записи в классах; Whisper на детской речи против взрослых бенчмарков | Large-v3: WER 66% на детской речи против «sub 0.20» на взрослых датасетах (по аннотации); large-v3-turbo 125%; tiny 415% | 2025 (27.10) | https://arxiv.org/abs/2510.23319 | Средняя-высокая |
| Английский (не узбекский): DrivenData (Katie Wetstone), 4 детских датасета, whisper-medium и KidWhisper, замер середины 2025 | WER (Whisper / KidWhisper): MyST (3–5 классы) 17% / 13%; JIBO Kids 42% / 40%; Cameron 65% / 58%; Ellis Weismer (2,5–5,5 лет) 76% / 70%. Цитата: «for young children, roughly three in four words are incorrect». У взрослых SOTA 6–7% | 2026 (23.10) | https://drivendata.co/blog/child-asr-benchmarking | Средняя |
| Английский (не узбекский): Kid-Whisper, дообучение на детском корпусе MyST | WER 13,93% → 9,11% (small), 13,23% → 8,61% (medium)\[43\] | 2023–2024 | https://ojs.aaai.org/index.php/AIES/article/download/31618/33785/35682 | Высокая |
| Нидерландский (не узбекский): дообучение Whisper на детской речи | Лучший whisper-large-FT: WER 5,46%, на 11,48 п.п. ниже, чем без дообучения\[44\] | 2026 | https://arxiv.org/html/2605.28833 | Средняя |

## Details

**Почему разброс цифр так велик.** WER для узбекского сильно зависит от нормализации. У NVIDIA FastConformer на одних и тех же данных FLEURS WER 17,52% с регистром и пунктуацией и 10,73% без них.\[17\] На результат также влияют апостроф в oʻ/gʻ, цифры против слов и тестовый сплит: «свои» подвыборки Common Voice несопоставимы с официальным тестом. Сравнивать цифры из разных источников напрямую нельзя. Корректны только сравнения внутри одной статьи: GigaAM, BuzzASR, uzbek-stt-bench.

**Чтение и живая речь.** На чтении взрослых (FLEURS, CV, USC) лучшие открытые модели дают 7–14% WER. На разговорной речи цифры заметно выше. У GigaAM 12,7% на собственном in-the-wild наборе против 7,3% на FLEURS.\[5\]\[8\] В подкаст-бенчмарке лучшая система (gemini-3-flash) дала 15,3%, остальные 21–28%.\[6\] Ответы ребёнка тьютору — это спонтанная речь, поэтому ориентироваться стоит на цифры для разговорной речи и выше, а не на FLEURS.

**VoiceLab.** Компания из Ташкента (ранее Aisha / aisha.group, HF-организация aisha-org). Основана 25.01.2025, стадия pre-seed. По её собственным данным на awards.gov.uz: 30 000 пользователей, MRR $12 000, 5 сотрудников.\[45\]\[46\] Продукты: Sado (STT) и Lison (TTS), API и SDK, MCP-сервер.\[45\]\[47\]\[48\] Модель TTS Navoiy открыта, но без метрик.\[31\] Публичных WER, CER или MOS для Sado и Lison нет. Утверждения «лучше Gemini» и «на уровне ElevenLabs v4» не подкреплены методикой.\[23\]\[24\] Единственная найденная независимая цифра по коммерческому STT Aisha (41,71% WER на сообщениях из Telegram) опубликована конкурентом, без указания версии и даты, и, вероятно, относится к модели до Sado v2.\[8\]\[22\] VoiceLab также не участвовал в независимом подкаст-бенчмарке.

**Yandex SpeechKit.** Поддерживает и распознавание, и синтез узбекского, только на латинице.\[36\] В блоге Yandex Cloud приведён пример: «Nexia» синтезируется как «Нехийа», потому что модель не отличает английские слова от узбекских.\[49\] Для тьютора это риск при чтении заимствований и терминов. Его можно частично снять фонемной разметкой.\[36\] Метрик качества Yandex не публикует.

**Google и Azure.** У обоих поддержка узбекского задокументирована (Chirp 2 и Chirp 3 у Google; STT и два нейроголоса у Azure), но опубликованных узбекских WER или MOS нет.\[26\]\[28\] Модели Gemini в подкаст-бенчмарке разделили первое место и середину таблицы: gemini-3-flash 15,3%, Gemini-3.5-transcribe 24,5–25,8%.\[6\] Cloud Speech-to-Text (Chirp) в этом бенчмарке не тестировался.

## Recommendations

### 5 фактов для питча (короткие, проверяемые)

1. **«Whisper "из коробки" не понимает узбекский».** В оригинальной статье OpenAI у Whisper large-v2 WER 90,2% на узбекском FLEURS, при 0,3 ч узбекских данных в обучении (OpenAI, 2022, arXiv 2212.04356).\[3\]\[7\]
2. **«Даже новейший Whisper large-v3 ошибается чаще, чем угадывает».** WER 105,4% на FLEURS и 109,9% на Common Voice (GigaAM Multilingual, arXiv 2607.10371, июль 2026).\[5\]
3. **«Дообучение на узбекских данных снижает ошибку в 10 с лишним раз».** GigaAM Multilingual: 7,3% WER на FLEURS; дообученный Whisper-medium (753 ч): 7,69% на Common Voice 22 (arXiv 2607.10371; HF NavAI, 2026).\[4\]\[5\]
4. **«В живой разговорной речи лучшие системы ошибаются в каждом 7-м–4-м слове».** WER от 15,3% до 28,1% у 8 систем на подкасте (uzbek-stt-bench, 07.09.2026).\[6\]
5. **«Детская речь — непокрытая зона».** Открытого узбекского детского корпуса мы не нашли. На арабских детях 6–13 лет Whisper large-v3 даёт 66% WER против «sub 0.20» на взрослых датасетах (Arabic Little STT, arXiv 2510.23319, 27.10.2025).

### 3 вывода для продукта

1. **Выбор провайдера: пилот на 2–3 вариантах, а не ставка на один.** Для демо на хакатоне VoiceLab — разумный локальный кандидат: узбекский как основной язык, STT и TTS в одном API, эмоциональные голоса, открытая Navoiy как запасной вариант для self-hosting. Но его качество публично не подтверждено. Рядом стоит тестировать Gemini (лидер единственного независимого разговорного бенчмарка) или Google Chirp 2/3, а для TTS — Azure Madina/Sardor или ElevenLabs v3/v4. Как открытый fallback для ASR подходят GigaAM Multilingual (WER 7,3% на FLEURS) или Whisper-medium от NavAI. В питче не стоит говорить «VoiceLab — лучший»: корректнее «мы выбрали провайдера по собственному тесту на N детских записях, WER = X%».
2. **Детская речь — главный продуктовый риск.** Все узбекские цифры выше получены на взрослых. По другим языкам ошибки на детской речи кратно выше, чем у взрослых (6–7% у SOTA-систем). В бенчмарке DrivenData (2026) WER у Whisper / KidWhisper составил 17% / 13% на MyST (3–5 классы), 42% / 40% на JIBO Kids, 65% / 58% на Cameron и 76% / 70% у детей 2,5–5,5 лет (Ellis Weismer). Сильнее всего страдают самые младшие. Нужны компенсирующие механики: короткие ответы, варианты выбора с голосовым подтверждением, показ распознанного текста ребёнку («ты сказал …?»), нечёткое сопоставление с ожидаемым ответом вместо дословной проверки и запасной ввод кнопками. Если ASR используется для оценки произношения, неверное распознавание будет выглядеть как ошибка ребёнка. Это педагогически вредно, поэтому оценку произношения на старте лучше не делать.
3. **Что тестировать самим (минимальный протокол, 1–2 дня).** (а) Записать 50–100 фраз от 10–20 детей двух возрастных групп (6–9 и 10–14 лет), с согласия родителей, в реальных условиях: телефон, шум класса. Включить фразы из программы тьютора: числа, термины, русские и английские заимствования. (б) Прогнать через VoiceLab Sado, Google Chirp или Gemini, Azure, Yandex и одну открытую модель. Считать WER и CER с единой нормализацией: lowercase, без пунктуации, унификация oʻ/gʻ и апострофов, цифры словами. Отдельно считать точность на ключевых словах-ответах. (в) Для TTS провести слепой MOS-тест (1–5) с 10+ носителями, лучше учителями и детьми, на 20 учебных фразах. Дополнительно сделать ресинтез TTS → лучший ASR → CER, чтобы поймать пропуски слов. Отдельно проверить числа, даты и заимствования (пример «Nexia» у Yandex). (г) Замерить задержку до первого звука, она критична для детского внимания.

## Caveats

### Что не найдено (в открытом доступе)

- **Публичные метрики VoiceLab** (WER/CER для Sado и Sado v2, MOS для Lison и Lison v2 и Navoiy): нет ни цифр, ни тестовых наборов, ни методики. Есть только заявления в LinkedIn и Telegram.\[23\]\[50\]
- **Детские узбекские корпуса и замеры**: не найдены ни корпус, ни статья, ни бенчмарк. Нет и данных о доле детей среди дикторов USC, Common Voice uz или FLEURS uz.
- **Тюркские детские данные**: замеров ASR на детской речи для казахского, турецкого и других тюркских языков мы не нашли. Детские цифры выше относятся к арабскому, английскому и нидерландскому.
- **Yandex SpeechKit на узбекском**: ни одного опубликованного WER или MOS, ни одного независимого сравнения.
- **Google Cloud STT (Chirp, Chirp 2, Chirp 3/USM) на узбекском**: собственных опубликованных WER для uz-UZ нет. Независимого замера именно Cloud STT мы тоже не нашли, тестировались только модели Gemini.
- **Azure (STT и TTS uz-UZ)**: метрик нет.
- **AWS (Transcribe, Polly)**: поддержку узбекского мы проверить не успели. Утверждать, есть она или нет, мы не можем.
- **ElevenLabs**: MOS для узбекского нет. Есть только факт поддержки и один независимый замер Scribe v1 (24,9% WER на подкасте).\[6\]
- **Mohir.ai / UzbekVoice**: методики за цифрой «WER 12%» нет. В подкаст-бенчмарке UzbekVoice получил 28,1%.\[6\]\[25\]
- **Whisper large-v3-turbo**: официальных узбекских цифр нет, есть только неофициальный замер на 20 клипах (114,1% WER).\[21\]
- **Независимые MOS для коммерческих узбекских TTS** (Azure, Yandex, ElevenLabs, VoiceLab, Gemini): не найдены.

### Прочие оговорки

- Многие цифры взяты из карточек моделей на HuggingFace (self-reported). Их никто не перепроверял, и тестовые выборки иногда пересекаются с обучающими данными.
- Подкаст-бенчмарк состоит из одного 5-минутного клипа с тремя мужскими голосами. Автор прямо предупреждает, что результат нельзя обобщать, а движки меняются еженедельно.\[6\]
- Цифры CER в BuzzASR и WER в GigaAM получены на разных смесях тестов, поэтому сравнивать их между собой нельзя.
- Будущие обещания (например, «Sado v3 выйдет до конца месяца и будет лучшей для диалектов») — прогноз, а не факт.\[50\]

## Sources

1. [BuzzASR: A Swarm of 100+ Monolingual Speech Recognition Models](https://arxiv.org/html/2609.09554v1)
2. [We Benchmarked Our Speech Recognition Against Whisper in 59 Languages · Harmar](https://harmar.ai/en/blog/whisper-accuracy-benchmark-59-languages)
3. <https://arxiv.org/pdf/2212.04356>
4. [Mannon/whisper-medium-uzbek · Hugging Face](https://huggingface.co/Mannon/whisper-medium-uzbek)
5. [GigaAM Multilingual: Foundation Model for Underrepresented Languages](https://arxiv.org/html/2607.10371v1)
6. [GitHub - avazibra/uzbek-stt-bench: Speech-to-text benchmark on real conversational Uzbek (podcast audio)](https://github.com/avazibra/uzbek-stt-bench)
7. [Robust Speech Recognition via Large-Scale Weak Supervision Alec Radford \* 1](https://cdn.openai.com/papers/whisper.pdf)
8. [Biruniy — Verified Uzbek Speech Data for ASR & TTS](https://www.biruniy.uz/)
9. [Корпус узбекской речи и Автоматическое распознавание речи - ISSAI](https://issai.nu.edu.kz/ru/uzbek-asr-ru/)
10. [(PDF) USC: An Open-Source Uzbek Speech Corpus and Initial Speech Recognition Experiments](https://www.academia.edu/127332342/USC_An_Open_Source_Uzbek_Speech_Corpus_and_Initial_Speech_Recognition_Experiments)
11. [\[2107.14419\] USC: An Open-Source Uzbek Speech Corpus and Initial Speech Recognition Experiments](https://ar5iv.labs.arxiv.org/html/2107.14419)
12. [USC: An Open-Source Uzbek Speech Corpus and Initial Speech Recognition Experiments](https://arxiv.org/pdf/2107.14419)
13. [GitHub - IS2AI/TurkicASR: A multilingual ASR model that can recognize ten Turkic languages—Azerbaijani, Bashkir, Chuvash, Kazakh, Kyrgyz, Sakha, Tatar, Turkish, Uyghur, and Uzbek. · GitHub](https://github.com/IS2AI/TurkicASR)
14. [Multilingual Speech Recognition for Turkic Languages](https://doi.org/10.3390/info14020074)
15. [FeruzaSpeech: A 60 Hour Uzbek Read Speech Corpus with Punctuation, Casing, and Context](https://arxiv.org/pdf/2410.00035)
16. [Mannon/whisper-small-uzbek · Hugging Face](https://huggingface.co/Mannon/whisper-small-uzbek)
17. [algorithco/sado · Hugging Face](https://huggingface.co/algorithco/sado)
18. [elchintoyirov/auris-1-uzbek-stt · Hugging Face](https://huggingface.co/elchintoyirov/auris-1-uzbek-stt)
19. [BlueRaccoon/whisper-small-uz · Hugging Face](https://huggingface.co/BlueRaccoon/whisper-small-uz)
20. [aisha-org/Whisper-Uzbek · Hugging Face](https://huggingface.co/aisha-org/Whisper-Uzbek)
21. [GitHub - Elshod09K/Uzbek-Whisper · GitHub](https://github.com/Elshod09K/Uzbek-Whisper)
22. [OvozifyLabs/whisper-small-uz-v1 · Hugging Face](https://huggingface.co/OvozifyLabs/whisper-small-uz-v1)
23. [Elzodxon Sharofaddinov - VoiceLab](https://www.linkedin.com/in/elzodxon/)
24. [Azim Pulat - Warsaw, Mazowieckie, Poland](https://www.linkedin.com/in/azim-pulat/)
25. [Mohirdev AI Lab - AI that listens, understands, and transforms](https://mohirdev.ai/)
26. [Cloud Speech-to-Text V2 supported languages | Google Cloud Documentation](https://docs.cloud.google.com/speech-to-text/docs/speech-to-text-supported-languages)
27. [Speech-to-Text release notes | Google Cloud Documentation](https://docs.cloud.google.com/speech-to-text/docs/release-notes)
28. [Language and Voice Support for Azure Speech - Foundry Tools](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support)
29. [Multilingual Text-to-Speech Synthesis forTurkic Languages Using Transliteration](https://arxiv.org/html/2305.15749v1)
30. [Uzbek Speech Synthesis Using Deep Learning Algorithms](https://link.springer.com/chapter/10.1007/978-3-031-27199-1_5)
31. [aisha-org/navoiy-tts · Hugging Face](https://huggingface.co/aisha-org/navoiy-tts)
32. [Navoiy TTS: An Open Uzbek Text-to-Speech Model](https://aisha.group/en/blog/navoiy-tts-open-source-uzbek-text-to-speech)
33. [Voice Uzbek dubs with Navoiy, with per-line emotions by isoqovjorabek2 · Pull Request #43 · asilbekali/TH-Labs-full · GitHub](https://github.com/asilbekali/TH-Labs-full/pull/43)
34. [Mostafa Yassin - Lawhive](https://www.linkedin.com/in/mostafa-yassin94/)
35. [Azure Speech’s Neural TTS empowers organizations to serve users in more than 100 languages](https://techcommunity.microsoft.com/blog/azure-ai-foundry-blog/azure-speech%E2%80%99s-neural-tts-empowers-organizations-to-serve-users-in-more-than-100/2920882)
36. [Yandex SpeechKit теперь умеет синтезировать и распознавать речь на узбекском языке / Хабр](https://habr.com/ru/news/741880/)
37. [Yandex SpeechKit научился синтезировать и распознавать речь на узбекском языке - CNews](https://www.cnews.ru/news/line/2023-06-15_yandex_speechkit_nauchilsya_sintezirovat)
38. [Models](https://elevenlabs.io/docs/overview/models)
39. [Generate speech with Gemini TTS | Gemini Enterprise Agent Platform | Google Cloud Documentation](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/text-to-speech/overview)
40. [AI Voice Library](https://ttsforfree.com/en/voice-library/)
41. [The Development and Experimental Evaluation of a Multilingual Speech Corpus for Low-Resource Turkic Languages](https://doi.org/10.3390/app152412880)
42. [mrmuminov/f5-tts-uzbek · Hugging Face](https://huggingface.co/mrmuminov/f5-tts-uzbek)
43. [Kid-Whisper: Towards Bridging the Performance Gap in Automatic Speech Recognition for Children VS. Adults - ADS](https://ui.adsabs.harvard.edu/abs/2023arXiv230907927A/abstract)
44. [Transcribing Children’s Speech: ASR Performance and Obtaining Reliable Orthographic Transcriptions](https://arxiv.org/html/2605.28833)
45. [aisha-org (VoiceLab)](https://huggingface.co/aisha-org)
46. [VoiceLab - AwardsGovUz](https://awards.gov.uz/en/ecosystem/startups-directory/3820)
47. [VoiceLab MCP Server by voicelab-uz](https://glama.ai/mcp/servers/voicelab-uz/mcp)
48. [VoiceLab Documentation](https://docs.voicelab.uz/)
49. [Шестнадцатый в SpeechKit: как мы добавили узбекский язык в сервис](https://yandex.cloud/ru-kz/blog/posts/2023/06/speechkit-uzbek-language)
50. [Telegram channel "Otabek’s I/O" — @otabekswe — TGStat](https://uz.tgstat.com/en/channel/@otabekswe)
