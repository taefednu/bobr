import asyncio
import logging
from contextlib import suppress

from aiogram import Bot, Dispatcher
from aiogram.fsm.storage.memory import MemoryStorage, SimpleEventIsolation

from .config import Config
from .convex_api import ConvexApi
from .handlers import make_router
from .outbox import OutboxWorker
from .texts import text


async def on_error(event, state=None):
    # Never format Update, exception or request arguments: they contain PII.
    message = event.update.message
    if message is None and event.update.callback_query:
        message = event.update.callback_query.message
    if message and message.chat.type == 'private':
        lang = 'uz'
        if state is not None:
            with suppress(Exception):
                lang = (await state.get_data()).get('lang', 'uz')
        with suppress(Exception):
            await message.answer(text(lang, 'error'))
    return True


async def main():
    config = Config.load()
    api = ConvexApi(config.convex_url, config.secret)
    bot = Bot(config.token)
    dispatcher = Dispatcher(storage=MemoryStorage(), events_isolation=SimpleEventIsolation())
    dispatcher.include_router(make_router(api, config))

    dispatcher.errors.register(on_error)

    worker = asyncio.create_task(OutboxWorker(api, bot).run())
    try:
        # No deleteWebhook or dropped updates: configuring the bot is explicit.
        await dispatcher.start_polling(bot, close_bot_session=False)
    finally:
        worker.cancel()
        with suppress(asyncio.CancelledError):
            await worker
        api.close()
        await bot.session.close()


if __name__ == '__main__':
    # SDK and framework exceptions can embed tokens/updates. Operator-facing
    # failures below are fixed copy; no raw exceptions are printed.
    logging.disable(logging.CRITICAL)
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        pass
    except (ValueError, ImportError):
        print(text('ru', 'missing_env'))
        raise SystemExit(1) from None
    except Exception:
        print(text('ru', 'error'))
        raise SystemExit(1) from None
