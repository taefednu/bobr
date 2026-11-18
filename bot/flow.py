from dataclasses import dataclass
from datetime import datetime
from zoneinfo import ZoneInfo

TASHKENT = ZoneInfo('Asia/Tashkent')


def parse_test_date(value: str, now: datetime | None = None) -> str:
    today = (now or datetime.now(TASHKENT)).astimezone(TASHKENT).date()
    parsed = datetime.strptime(value.strip(), '%Y-%m-%d').date()
    if parsed.isoformat() != value.strip() or parsed < today:
        raise ValueError('bad_date')
    return parsed.isoformat()


def valid_name(value: str) -> bool:
    value = value.strip()
    return 1 <= len(value) <= 40 and any(c.isalpha() for c in value) and all(
        c.isalpha() or c in " -ʻʼ’'" for c in value)


@dataclass
class Registration:
    parent_id: str
    lang: str
    name: str = ''
    grade: int = 5
    goal: str = 'just_practice'
    test_date: str | None = None
    student_id: str | None = None
    goal_saved: bool = False

    async def save_goal(self, api):
        args = {'parentId': self.parent_id, 'goal': self.goal}
        if self.goal == 'test_soon' and self.test_date:
            args['testDate'] = self.test_date
        await api.mutation('parents:setGoal', **args)
        self.goal_saved = True

    async def finish(self, api, public_url: str):
        if not self.goal_saved:
            await self.save_goal(api)
        if not self.student_id:
            result = await api.mutation('students:create', parentId=self.parent_id, name=self.name, grade=self.grade)
            self.student_id = result['studentId']
        result = await api.mutation('linkCode:create', studentId=self.student_id)
        return result['code'], public_url.rstrip('/') + '/c/' + result['code']
