"""Parent bot copy. Uzbek translations need native-speaker review.

Outbox text is supplied by Convex and is deliberately not rewritten here.
"""

TEXTS = {
    'ru': {
        'language_name': 'Русский',
        'welcome': 'Привет! Я Bobr — ИИ-репетитор по математике для 5 класса.\nВыберите язык / Tilni tanlang.',
        'intro': 'Ребёнок занимается в приложении, а не в Telegram.\nBobr учится у ребёнка: объясняя, ребёнок лучше понимает дроби.\nВы получаете короткие сводки, не переписку.\n\nBobr — ИИ и может ошибаться.',
        'next': 'Дальше', 'agree': 'Согласен', 'details': 'Подробнее',
        'consent': 'Мы храним имя ребёнка, класс и прогресс по темам. Не просим телефон, фото или адрес. Вы видите сводку, а не переписку. Удаление можно запросить командой /delete. Вы согласны?',
        'details_text': 'Имя нужно только для родительской сводки. Оно не передаётся ИИ. Переписка ребёнка родителю недоступна. Управление данными — /delete. Bobr — ИИ и может ошибаться.',
        'name': 'Как зовут ребёнка? Напишите только имя, без фамилии и других данных.',
        'bad_name': 'Напишите только имя: от 1 до 40 букв, можно с дефисом или апострофом.',
        'grade': 'Какой класс?', 'other': 'Другой', 'grade_number': 'Напишите номер класса от 1 до 11.',
        'goal': 'Какая цель?', 'test_soon': 'Скоро контрольная', 'improve': 'Подтянуть дроби', 'just_practice': 'Просто заниматься',
        'date': 'Когда контрольная?', 'week': 'Через неделю', 'fortnight': 'Через 2 недели', 'custom': 'Выбрать дату',
        'date_input': 'Напишите дату в формате ГГГГ-ММ-ДД.', 'bad_date': 'Нужна существующая дата в формате ГГГГ-ММ-ДД, не раньше сегодняшней.',
        'ready': 'Готово! Откройте эту ссылку на устройстве ребёнка:\n{url}\n\nИли пусть введёт код {code} на главной. Код одноразовый и действует 24 часа.',
        'cabinet': 'Открыть кабинет', 'new_code': 'Новый код', 'add_child': 'Добавить ребёнка', 'child': 'Добавить ещё ребёнка или получить новый код?',
        'retry': 'Повторить', 'error': 'Сервис временно недоступен. Попробуйте ещё раз.',
        'start_first': 'Начните с /start. После перезапуска боту пока нужно заново пройти настройку: восстановление данных ожидает API.',
        'goal_saved': 'Цель сохранена.', 'existing': 'Настройка завершена. Можно открыть кабинет или получить новый код.',
        'unavailable': 'Эта возможность пока недоступна: ждём функцию сервера. Данные не изменены.',
        'delete_confirm': 'Удалить данные родителя и ребёнка? Подтвердите действие. Пока сервер удаления не подключён, данные останутся на месте.',
        'delete_yes': 'Подтвердить удаление', 'cancel': 'Отмена', 'cancelled': 'Отменено. Данные не изменены.',
        'help': 'Bobr помогает ребёнку разобраться с дробями. Занятия — в приложении, здесь — настройка и сводки.\n/start — начать\n/progress — сводка\n/goal — цель\n/child — ребёнок и код\n/settings — настройки\n/pause — уведомления\n/delete — удаление с подтверждением\n/help — помощь',
        'contact': 'Контакт поддержки: {contact}',
        'unknown': 'Я помогаю с настройкой и сводками. Список команд — /help.',
        'missing_env': 'Заполните bot/.env по образцу bot/.env.example. Значения секретов в ошибке не выводятся.',
    },
    'uz': {
        'language_name': 'Oʻzbekcha',
        'welcome': 'Salom! Men Bobr — 5-sinf matematikasi uchun sunʼiy intellekt repetitoriman.\nTilni tanlang / Выберите язык.',
        'intro': 'Bola Telegramda emas, ilovada shugʻullanadi.\nBobr boladan oʻrganadi: tushuntirish orqali bola kasrlarni yaxshiroq tushunadi.\nSiz yozishmalarni emas, qisqa xulosalarni olasiz.\n\nBobr — sunʼiy intellekt va xato qilishi mumkin.',
        'next': 'Davom etish', 'agree': 'Roziman', 'details': 'Batafsil',
        'consent': 'Bolaning ismi, sinfi va mavzulardagi natijalarini saqlaymiz. Telefon, surat yoki manzil soʻramaymiz. Siz yozishmalarni emas, xulosani koʻrasiz. Maʼlumotlarni oʻchirishni /delete orqali soʻrashingiz mumkin. Rozimisiz?',
        'details_text': 'Ism faqat ota-ona xulosasi uchun kerak. U sunʼiy intellektga yuborilmaydi. Bolaning yozishmalari ota-onaga koʻrsatilmaydi. Maʼlumotlarni boshqarish — /delete. Bobr — sunʼiy intellekt va xato qilishi mumkin.',
        'name': 'Bolaning ismi nima? Faqat ismini yozing, familiyasi va boshqa maʼlumotlar kerak emas.',
        'bad_name': 'Faqat ismni yozing: 1–40 harf, chiziqcha yoki tutuq belgisi ham mumkin.',
        'grade': 'Nechanchi sinf?', 'other': 'Boshqa', 'grade_number': '1 dan 11 gacha sinf raqamini yozing.',
        'goal': 'Maqsadingiz nima?', 'test_soon': 'Yaqinda nazorat ishi', 'improve': 'Kasrlarni yaxshiroq tushunish', 'just_practice': 'Shunchaki shugʻullanish',
        'date': 'Nazorat ishi qachon?', 'week': 'Bir haftadan keyin', 'fortnight': 'Ikki haftadan keyin', 'custom': 'Sanani tanlash',
        'date_input': 'Sanani YYYY-MM-DD shaklida yozing.', 'bad_date': 'YYYY-MM-DD shaklidagi mavjud sana kerak. Sana bugundan oldin boʻlmasin.',
        'ready': 'Tayyor! Bu havolani bolaning qurilmasida oching:\n{url}\n\nYoki bosh sahifada {code} kodini kiritsin. Kod bir martalik, 24 soat amal qiladi.',
        'cabinet': 'Kabinetni ochish', 'new_code': 'Yangi kod', 'add_child': 'Bola qoʻshish', 'child': 'Yana bola qoʻshasizmi yoki yangi kod olasizmi?',
        'retry': 'Qayta urinish', 'error': 'Xizmat vaqtincha ishlamayapti. Qayta urinib koʻring.',
        'start_first': '/start bilan boshlang. Bot qayta ishga tushgach, sozlashni qaytadan oʻtish kerak: maʼlumotlarni tiklash uchun API kutilmoqda.',
        'goal_saved': 'Maqsad saqlandi.', 'existing': 'Sozlash tugadi. Kabinetni ochish yoki yangi kod olish mumkin.',
        'unavailable': 'Bu imkoniyat hozircha mavjud emas: server funksiyasini kutyapmiz. Maʼlumotlar oʻzgarmadi.',
        'delete_confirm': 'Ota-ona va bola maʼlumotlari oʻchirilsinmi? Tasdiqlang. Serverning oʻchirish funksiyasi ulanmaguncha maʼlumotlar saqlanadi.',
        'delete_yes': 'Oʻchirishni tasdiqlash', 'cancel': 'Bekor qilish', 'cancelled': 'Bekor qilindi. Maʼlumotlar oʻzgarmadi.',
        'help': 'Bobr bolaga kasrlarni tushunishga yordam beradi. Mashgʻulotlar ilovada, sozlash va xulosalar shu yerda.\n/start — boshlash\n/progress — xulosa\n/goal — maqsad\n/child — bola va kod\n/settings — sozlamalar\n/pause — bildirishnomalar\n/delete — tasdiq bilan oʻchirish\n/help — yordam',
        'contact': 'Yordam uchun: {contact}',
        'unknown': 'Sozlash va xulosalar bilan yordam beraman. Buyruqlar — /help.',
        'missing_env': 'bot/.env faylini bot/.env.example namunasi boʻyicha toʻldiring. Maxfiy qiymatlar xatoda koʻrsatilmaydi.',
    },
}


def text(lang, key, **params):
    return TEXTS['ru' if lang == 'ru' else 'uz'][key].format(**params)
