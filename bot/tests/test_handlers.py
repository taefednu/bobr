import unittest
from datetime import datetime, timezone
from types import SimpleNamespace

from aiogram import Bot, Dispatcher, F
from aiogram.client.session.base import BaseSession
from aiogram.methods import SendMessage
from aiogram.types import CallbackQuery, Chat, Message, Update, User

from bot.handlers import make_router
from bot.__main__ import on_error
from bot.texts import TEXTS
from test_bot import Api


class FakeSession(BaseSession):
    def __init__(self):
        super().__init__()
        self.messages = []

    async def close(self):
        pass

    async def make_request(self, bot, method, timeout=None):
        if isinstance(method, SendMessage):
            self.messages.append(method)
            return Message(message_id=len(self.messages), date=datetime.now(timezone.utc),
                           chat=Chat(id=int(method.chat_id), type='private'), text=method.text)
        return True

    async def stream_content(self, *args, **kwargs):
        yield b''


class HandlerTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.session = FakeSession()
        self.bot = Bot('123456:TEST_TOKEN_FOR_LOCAL_UNIT_TESTS', session=self.session)
        self.api = Api()
        self.dp = Dispatcher()
        self.dp.include_router(make_router(self.api, SimpleNamespace(public_url='https://app.example', support_contact='')))
        self.sequence = 0

    async def asyncTearDown(self):
        await self.dp.storage.close()
        await self.bot.session.close()

    async def send(self, value, callback=False, group=False):
        self.sequence += 1
        user = User(id=42, is_bot=False, first_name='Parent')
        message = Message(message_id=self.sequence, date=datetime.now(timezone.utc),
                          chat=Chat(id=42, type='group' if group else 'private'), from_user=user, text=value)
        update = Update(update_id=self.sequence, callback_query=CallbackQuery(
            id=str(self.sequence), from_user=user, chat_instance='local', message=message, data=value)) if callback else Update(update_id=self.sequence, message=message)
        await self.dp.feed_update(self.bot, update)

    async def test_start_to_code_both_languages_and_no_duplicate_on_old_callback(self):
        for lang in ('uz', 'ru'):
            # Independent chat FSM and API per language.
            if self.sequence:
                await self.dp.storage.close()
                self.dp = Dispatcher()
                self.api = Api()
                self.dp.include_router(make_router(self.api, SimpleNamespace(public_url='https://app.example', support_contact='')))
            await self.send('/start')
            await self.send('lang:' + lang, callback=True)
            self.assertIn(TEXTS[lang]['intro'], [m.text for m in self.session.messages])
            await self.send('intro_next', callback=True)
            self.assertFalse(any(n == 'students:create' for n, _ in self.api.calls))
            await self.send('agree', callback=True)
            await self.send('Madina')
            await self.send('grade:5', callback=True)
            await self.send('goal:improve', callback=True)
            self.assertIn('https://app.example/c/ABCDEFGH', self.session.messages[-1].text)
            self.assertIn('ABCDEFGH', self.session.messages[-1].text)
            names = [n for n, _ in self.api.calls]
            self.assertLess(names.index('parents:setConsent'), names.index('students:create'))
            self.assertEqual(names.count('students:create'), 1)
            await self.send('goal:improve', callback=True)
            await self.send('/start')
            self.assertEqual(sum(n == 'students:create' for n, _ in self.api.calls), 1)

    async def test_commands_cannot_skip_consent_and_groups_are_ignored(self):
        await self.send('/start', group=True)
        self.assertEqual(self.session.messages, [])
        await self.send('/start')
        await self.send('lang:ru', callback=True)
        await self.send('/goal')
        await self.send('/child')
        await self.send('add_child', callback=True)
        self.assertFalse(any(n in {'students:create', 'parents:setGoal'} for n, _ in self.api.calls))
        self.assertIn('Начните с /start', self.session.messages[-1].text)

    async def test_delete_requires_confirmation_and_never_claims_success(self):
        await self.send('/delete')
        self.assertEqual(self.api.calls, [])
        await self.send('delete_yes', callback=True)
        self.assertEqual(self.api.calls, [])
        self.assertEqual(self.session.messages[-1].text, TEXTS['uz']['unavailable'])

    async def test_unhandled_error_uses_selected_russian_locale(self):
        self.dp.errors.register(on_error)

        @self.dp.message(F.text == '/explode')
        async def explode(message):
            raise RuntimeError('not logged')

        await self.send('/start')
        await self.send('lang:ru', callback=True)
        await self.send('/explode')
        self.assertEqual(self.session.messages[-1].text, TEXTS['ru']['error'])


if __name__ == '__main__':
    unittest.main()
