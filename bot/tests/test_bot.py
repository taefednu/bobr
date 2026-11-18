import unittest
import threading
from datetime import datetime, timezone

from bot.convex_api import ConvexApi
from bot.flow import Registration, parse_test_date, valid_name
from bot.outbox import OutboxWorker


class Api:
    def __init__(self, rows=None):
        self.rows = rows or []
        self.calls = []
        self.fail_link = False
        self.fail_mark = False

    async def mutation(self, function_name, **args):
        self.calls.append((function_name, args))
        if function_name == 'parents:upsertFromTelegram':
            return {'parentId': 'parent'}
        if function_name == 'students:create':
            return {'studentId': 'student'}
        if function_name == 'linkCode:create':
            if self.fail_link:
                raise RuntimeError('unavailable')
            return {'code': 'ABCDEFGH', 'url': 'https://old.example/c/ABCDEFGH'}
        if function_name == 'outbox:markSent' and self.fail_mark:
            raise RuntimeError('unavailable')

    async def query(self, name, **args):
        return self.rows


class Sender:
    def __init__(self):
        self.sent = []
        self.fail_chat = None

    async def send_message(self, chat_id, text, **kwargs):
        if chat_id == self.fail_chat:
            raise RuntimeError('unavailable')
        self.sent.append((chat_id, text))


def row(id='a', chat='1', kind='taught_bobr', **extra):
    return dict(id=id, chatId=chat, kind=kind, text='summary', createdAt=0, **extra)


class RegistrationTests(unittest.IsolatedAsyncioTestCase):
    async def test_goal_child_code_and_retry_reuses_created_child(self):
        api = Api()
        flow = Registration('parent', 'ru', name='Madina', grade=5, goal='improve')
        api.fail_link = True
        with self.assertRaises(RuntimeError):
            await flow.finish(api, 'https://app.example/')
        self.assertEqual(flow.student_id, 'student')
        api.fail_link = False
        result = await flow.finish(api, 'https://app.example/')
        self.assertEqual(result, ('ABCDEFGH', 'https://app.example/c/ABCDEFGH'))
        self.assertEqual(sum(n == 'students:create' for n, _ in api.calls), 1)
        self.assertEqual(api.calls[0], ('parents:setGoal', {'parentId': 'parent', 'goal': 'improve'}))

    def test_date_and_name_validation(self):
        now = datetime(2026, 11, 18, 20, 0, tzinfo=timezone.utc)
        self.assertEqual(parse_test_date('2026-11-19', now), '2026-11-19')
        for value in ['2026-11-18', '2026-02-30', '19/11/2026']:
            with self.assertRaises(ValueError):
                parse_test_date(value, now)
        self.assertTrue(valid_name('Oʻgʻiloy'))
        self.assertFalse(valid_name('+998901234567'))
        self.assertFalse(valid_name('https://school.example'))


class AdapterTests(unittest.IsolatedAsyncioTestCase):
    async def test_child_name_does_not_collide_with_function_name_and_sdk_runs_off_loop(self):
        main_thread = threading.get_ident()

        class Client:
            def mutation(self, function_name, args):
                return function_name, args, threading.get_ident()

        api = ConvexApi('http://127.0.0.1:3210', 'test-secret')
        api.client = Client()
        try:
            function_name, args, worker_thread = await api.mutation('students:create', name='Madina', grade=5)
            self.assertEqual(function_name, 'students:create')
            self.assertEqual(args, {'botSecret': 'test-secret', 'name': 'Madina', 'grade': 5})
            self.assertNotEqual(worker_thread, main_thread)
        finally:
            api.close()


class OutboxTests(unittest.IsolatedAsyncioTestCase):
    async def test_quiet_hours_start_during_batch_defers_second_recipient(self):
        now = [datetime(2026, 11, 18, 15, 59, 59, tzinfo=timezone.utc)]

        class SlowSender(Sender):
            async def send_message(self, chat_id, text, **kwargs):
                await super().send_message(chat_id, text, **kwargs)
                now[0] = datetime(2026, 11, 18, 16, 0, 1, tzinfo=timezone.utc)

        api = Api([row(), row('b', '2')])
        sender = SlowSender()
        worker = OutboxWorker(api, sender, lambda: now[0])
        await worker.tick()
        self.assertEqual(sender.sent, [(1, 'summary')])
        self.assertEqual(api.calls, [('outbox:markSent', {'id': 'a'})])

    async def test_quiet_hours_crisis_bypass_abuse_and_unknown_rejected(self):
        for hour, count in [(2, 2), (3, 3), (15, 3), (16, 2)]:
            api = Api([row(), row('b', '2', 'crisis'), row('c', '3', 'crisis', category='ABUSE_HOME'),
                       row('d', '4', 'crisis', notifyParent=False), row('e', '5', 'alien'),
                       row('f', '6', 'crisis', category='GROOMING')])
            sender = Sender()
            worker = OutboxWorker(api, sender, lambda: datetime(2026, 11, 18, hour, tzinfo=timezone.utc))
            await worker.tick()
            self.assertEqual(len(sender.sent), count)
            self.assertNotIn((3, 'summary'), sender.sent)
            self.assertEqual(sum(n == 'outbox:markSent' for n, _ in api.calls), count)

    async def test_one_nonurgent_per_day_and_next_day_resume(self):
        now = [datetime(2026, 11, 18, 7, tzinfo=timezone.utc)]
        api = Api([row(), row('b')])
        sender = Sender()
        worker = OutboxWorker(api, sender, lambda: now[0])
        await worker.tick()
        self.assertEqual(len(sender.sent), 1)
        api.rows = [row('b')]
        await worker.tick()
        self.assertEqual(len(sender.sent), 1)
        now[0] = datetime(2026, 11, 19, 7, tzinfo=timezone.utc)
        await worker.tick()
        self.assertEqual(len(sender.sent), 2)

    async def test_send_failure_isolated_and_ack_retry_does_not_resend(self):
        api = Api([row(), row('b', '2', 'crisis')])
        sender = Sender()
        sender.fail_chat = 1
        api.fail_mark = True
        worker = OutboxWorker(api, sender, lambda: datetime(2026, 11, 18, 7, tzinfo=timezone.utc))
        await worker.tick()
        self.assertEqual(sender.sent, [(2, 'summary')])
        api.fail_mark = False
        await worker.tick()
        self.assertEqual(sender.sent, [(2, 'summary')])
        self.assertEqual(worker.pending, {})


if __name__ == '__main__':
    unittest.main()
