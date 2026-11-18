import os
from dataclasses import dataclass
from pathlib import Path
from urllib.parse import urlsplit

from dotenv import load_dotenv


@dataclass(frozen=True)
class Config:
    token: str
    secret: str
    convex_url: str
    public_url: str
    support_contact: str = ''

    @classmethod
    def load(cls):
        load_dotenv(Path(__file__).with_name('.env'), override=False)
        names = ('TELEGRAM_BOT_TOKEN', 'BOT_SECRET', 'CONVEX_URL', 'PUBLIC_APP_URL')
        values = [os.environ.get(name, '').strip() for name in names]
        if not all(values):
            raise ValueError('missing_configuration')
        for value in values[2:]:
            parsed = urlsplit(value)
            if parsed.scheme not in {'http', 'https'} or not parsed.netloc or parsed.username or parsed.password or parsed.query or parsed.fragment:
                raise ValueError('invalid_configuration')
        return cls(*values, os.environ.get('SUPPORT_CONTACT', '').strip())
