from datetime import datetime, timedelta

from aiogram import F, Router
from aiogram.filters import Command, CommandStart
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.types import CallbackQuery, InlineKeyboardButton, InlineKeyboardMarkup, Message, WebAppInfo

from .flow import Registration, TASHKENT, parse_test_date, valid_name
from .texts import text


class Steps(StatesGroup):
    language = State()
    intro = State()
    consent = State()
    name = State()
    grade = State()
    goal = State()
    date = State()
    finish = State()


def keyboard(lang, *items):
    return InlineKeyboardMarkup(inline_keyboard=[[
        InlineKeyboardButton(text=text(lang, label), callback_data=value)
    ] for label, value in items])


def cabinet_keyboard(lang, config):
    rows = []
    if config.public_url.startswith('https://'):
        rows.append([InlineKeyboardButton(text=text(lang, 'cabinet'), web_app=WebAppInfo(url=config.public_url.rstrip('/') + '/parent'))])
    rows.append([InlineKeyboardButton(text=text(lang, 'new_code'), callback_data='new_code')])
    return InlineKeyboardMarkup(inline_keyboard=rows)


def make_router(api, config):
    router = Router()
    router.message.filter(F.chat.type == 'private')
    router.callback_query.filter(F.message.chat.type == 'private')

    async def lang_of(state):
        return (await state.get_data()).get('lang', 'uz')

    async def require_flow(message, state):
        data = await state.get_data()
        if not data.get('flow') or not data.get('consented'):
            await message.answer(text(data.get('lang', 'uz'), 'start_first'))
            return None
        return data['flow']

    async def ask_goal(message, state):
        lang = await lang_of(state)
        await state.set_state(Steps.goal)
        await message.answer(text(lang, 'goal'), reply_markup=keyboard(lang, *[(g, 'goal:' + g) for g in ('test_soon', 'improve', 'just_practice')]))

    async def finish(message, state):
        data = await state.get_data()
        flow = data['flow']
        await state.set_state(Steps.finish)
        try:
            if data.get('goal_only'):
                await flow.save_goal(api)
                await state.update_data(goal_only=False)
                await message.answer(text(flow.lang, 'goal_saved'))
            else:
                code, url = await flow.finish(api, config.public_url)
                await message.answer(text(flow.lang, 'ready', code=code, url=url), reply_markup=cabinet_keyboard(flow.lang, config))
            await state.set_state(None)
        except Exception:
            await message.answer(text(flow.lang, 'error'), reply_markup=keyboard(flow.lang, ('retry', 'retry_finish')))

    @router.message(CommandStart())
    async def start(message: Message, state: FSMContext):
        data = await state.get_data()
        flow = data.get('flow')
        if flow and flow.student_id:
            await message.answer(text(flow.lang, 'existing'), reply_markup=cabinet_keyboard(flow.lang, config))
            return
        await state.set_state(Steps.language)
        await message.answer(text('uz', 'welcome'), reply_markup=InlineKeyboardMarkup(inline_keyboard=[[
            InlineKeyboardButton(text=text('uz', 'language_name'), callback_data='lang:uz'),
            InlineKeyboardButton(text=text('ru', 'language_name'), callback_data='lang:ru'),
        ]]))

    @router.callback_query(Steps.language, F.data.in_({'lang:uz', 'lang:ru'}))
    async def language(call: CallbackQuery, state: FSMContext):
        await call.answer()
        lang = call.data.split(':')[1]
        try:
            parent = await api.mutation('parents:upsertFromTelegram', telegramUserId=str(call.from_user.id), chatId=str(call.message.chat.id), firstName=call.from_user.first_name, lang=lang)
        except Exception:
            await call.message.answer(text(lang, 'error'))
            return
        await state.update_data(lang=lang, flow=Registration(parent['parentId'], lang), goal_only=False, consented=False)
        await state.set_state(Steps.intro)
        await call.message.answer(text(lang, 'intro'), reply_markup=keyboard(lang, ('next', 'intro_next')))

    @router.callback_query(Steps.intro, F.data == 'intro_next')
    async def intro(call: CallbackQuery, state: FSMContext):
        await call.answer()
        lang = await lang_of(state)
        await state.set_state(Steps.consent)
        await call.message.answer(text(lang, 'consent'), reply_markup=keyboard(lang, ('agree', 'agree'), ('details', 'details')))

    @router.callback_query(Steps.consent, F.data == 'details')
    async def details(call: CallbackQuery, state: FSMContext):
        await call.answer()
        await call.message.answer(text(await lang_of(state), 'details_text'))

    @router.callback_query(Steps.consent, F.data == 'agree')
    async def consent(call: CallbackQuery, state: FSMContext):
        await call.answer()
        flow = (await state.get_data())['flow']
        try:
            await api.mutation('parents:setConsent', parentId=flow.parent_id, consent=True)
        except Exception:
            await call.message.answer(text(flow.lang, 'error'))
            return
        await state.update_data(consented=True)
        await state.set_state(Steps.name)
        await call.message.answer(text(flow.lang, 'name'))

    @router.message(Steps.name, F.text, ~F.text.startswith('/'))
    async def name(message: Message, state: FSMContext):
        flow = (await state.get_data())['flow']
        if not valid_name(message.text):
            await message.answer(text(flow.lang, 'bad_name'))
            return
        flow.name = message.text.strip()
        await state.set_state(Steps.grade)
        await message.answer(text(flow.lang, 'grade'), reply_markup=InlineKeyboardMarkup(inline_keyboard=[[
            InlineKeyboardButton(text=str(g), callback_data='grade:' + str(g)) for g in (5, 6)
        ], [InlineKeyboardButton(text=text(flow.lang, 'other'), callback_data='grade:other')]]))

    @router.callback_query(Steps.grade, F.data.in_({'grade:5', 'grade:6', 'grade:other'}))
    async def grade_button(call: CallbackQuery, state: FSMContext):
        await call.answer()
        flow = (await state.get_data())['flow']
        if call.data == 'grade:other':
            await call.message.answer(text(flow.lang, 'grade_number'))
            return
        flow.grade = int(call.data.split(':')[1])
        await ask_goal(call.message, state)

    @router.message(Steps.grade, F.text, ~F.text.startswith('/'))
    async def grade_text(message: Message, state: FSMContext):
        flow = (await state.get_data())['flow']
        if not message.text.isascii() or not message.text.isdigit() or not 1 <= int(message.text) <= 11:
            await message.answer(text(flow.lang, 'grade_number'))
            return
        flow.grade = int(message.text)
        await ask_goal(message, state)

    @router.callback_query(Steps.goal, F.data.in_({'goal:test_soon', 'goal:improve', 'goal:just_practice'}))
    async def goal_button(call: CallbackQuery, state: FSMContext):
        await call.answer()
        flow = (await state.get_data())['flow']
        flow.goal = call.data.split(':')[1]
        flow.goal_saved = False
        flow.test_date = None
        if flow.goal != 'test_soon':
            await finish(call.message, state)
            return
        await state.set_state(Steps.date)
        await call.message.answer(text(flow.lang, 'date'), reply_markup=keyboard(flow.lang, ('week', 'date:7'), ('fortnight', 'date:14'), ('custom', 'date:custom')))

    @router.callback_query(Steps.date, F.data.in_({'date:7', 'date:14', 'date:custom'}))
    async def date_button(call: CallbackQuery, state: FSMContext):
        await call.answer()
        flow = (await state.get_data())['flow']
        value = call.data.split(':')[1]
        if value == 'custom':
            await call.message.answer(text(flow.lang, 'date_input'))
            return
        flow.test_date = (datetime.now(TASHKENT).date() + timedelta(days=int(value))).isoformat()
        await finish(call.message, state)

    @router.message(Steps.date, F.text, ~F.text.startswith('/'))
    async def date_text(message: Message, state: FSMContext):
        flow = (await state.get_data())['flow']
        try:
            flow.test_date = parse_test_date(message.text)
        except ValueError:
            await message.answer(text(flow.lang, 'bad_date'))
            return
        await finish(message, state)

    @router.callback_query(Steps.finish, F.data == 'retry_finish')
    async def retry_finish(call: CallbackQuery, state: FSMContext):
        await call.answer()
        await finish(call.message, state)

    @router.message(Command('goal'))
    async def goal_command(message: Message, state: FSMContext):
        flow = await require_flow(message, state)
        if flow:
            await state.update_data(goal_only=True)
            await ask_goal(message, state)

    @router.message(Command('child'))
    async def child(message: Message, state: FSMContext):
        flow = await require_flow(message, state)
        if flow:
            await message.answer(text(flow.lang, 'child'), reply_markup=keyboard(flow.lang, ('add_child', 'add_child'), ('new_code', 'new_code')))

    @router.callback_query(F.data == 'add_child')
    async def add_child(call: CallbackQuery, state: FSMContext):
        await call.answer()
        old = await require_flow(call.message, state)
        if old:
            await state.update_data(flow=Registration(old.parent_id, old.lang), goal_only=False)
            await state.set_state(Steps.name)
            await call.message.answer(text(old.lang, 'name'))

    @router.callback_query(F.data == 'new_code')
    async def new_code(call: CallbackQuery, state: FSMContext):
        await call.answer()
        flow = await require_flow(call.message, state)
        if flow and flow.student_id:
            await state.update_data(goal_only=False)
            await finish(call.message, state)

    @router.message(Command('help'))
    async def help_command(message: Message, state: FSMContext):
        lang = await lang_of(state)
        copy = text(lang, 'help')
        if config.support_contact:
            copy += '\n\n' + text(lang, 'contact', contact=config.support_contact)
        await message.answer(copy)

    @router.message(Command('progress', 'settings', 'pause'))
    async def unavailable(message: Message, state: FSMContext):
        await message.answer(text(await lang_of(state), 'unavailable'))

    @router.message(Command('delete'))
    async def delete_command(message: Message, state: FSMContext):
        lang = await lang_of(state)
        await state.update_data(delete_pending=True)
        await message.answer(text(lang, 'delete_confirm'), reply_markup=keyboard(lang, ('delete_yes', 'delete_yes'), ('cancel', 'delete_no')))

    @router.callback_query(F.data.in_({'delete_yes', 'delete_no'}))
    async def delete_answer(call: CallbackQuery, state: FSMContext):
        await call.answer()
        data = await state.get_data()
        if data.get('delete_pending'):
            await state.update_data(delete_pending=False)
            await call.message.answer(text(data.get('lang', 'uz'), 'unavailable' if call.data == 'delete_yes' else 'cancelled'))

    @router.callback_query()
    async def stale(call: CallbackQuery):
        await call.answer()

    @router.message()
    async def unknown(message: Message, state: FSMContext):
        await message.answer(text(await lang_of(state), 'unknown'))

    return router
