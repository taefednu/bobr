import asyncio
from datetime import datetime

from .flow import TASHKENT


class OutboxWorker:
    """Single consumer; memory guards supplement, never replace, backend policy."""
    def __init__(self, api, bot, clock=None):
        self.api = api
        self.bot = bot
        self.clock = clock or (lambda: datetime.now(TASHKENT))
        self.sent_day = {}
        self.pending = {}

    async def acknowledge(self, id):
        try:
            await self.api.mutation('outbox:markSent', id=id)
            self.pending.pop(id, None)
        except Exception:
            pass  # No raw SDK exception: may include request arguments.

    async def tick(self):
        # Remember delivered IDs even after acknowledgement in this tick: a stale
        # query response must not trigger another send.
        delivered = set(self.pending)
        for id in list(self.pending):
            await self.acknowledge(id)
        rows = await self.api.query('outbox:listUnsent', limit=100)
        for item in sorted(rows, key=lambda m: m.get('kind') != 'crisis'):
            id = item.get('id')
            if not id or id in self.pending or id in delivered:
                continue
            category = item.get('category')
            if category == 'ABUSE_HOME' or 'ABUSE_HOME' in item.get('categories', []) or item.get('notifyParent') is False:
                continue
            kind = item.get('kind')
            crisis = kind == 'crisis'
            if kind not in {'crisis', 'taught_bobr', 'daily_summary', 'forgotten'}:
                continue
            if crisis and category is not None and category not in {'SELF_HARM', 'GROOMING'}:
                continue
            chat = item.get('chatId')
            now = self.clock().astimezone(TASHKENT)
            if not crisis and (now.hour >= 21 or now.hour < 8 or self.sent_day.get(chat) == now.date()):
                continue
            try:
                await self.bot.send_message(int(chat), item['text'], parse_mode=None)
            except Exception:
                continue
            self.pending[id] = True
            if not crisis:
                self.sent_day[chat] = now.date()
            await self.acknowledge(id)

    async def run(self):
        while True:
            try:
                await self.tick()
            except Exception:
                pass
            await asyncio.sleep(3)
