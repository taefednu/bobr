import asyncio
from concurrent.futures import ThreadPoolExecutor


class ConvexApi:
    def __init__(self, url, secret):
        self.url = url
        self.secret = secret
        self.client = None
        self.executor = ThreadPoolExecutor(max_workers=1, thread_name_prefix='convex-bot')

    def call(self, operation, function_name, args):
        if self.client is None:
            from convex import ConvexClient
            self.client = ConvexClient(self.url)
        return getattr(self.client, operation)(function_name, {'botSecret': self.secret, **args})

    async def invoke(self, operation, function_name, args):
        return await asyncio.get_running_loop().run_in_executor(self.executor, self.call, operation, function_name, args)

    async def query(self, function_name, **args):
        return await self.invoke('query', function_name, args)

    async def mutation(self, function_name, **args):
        return await self.invoke('mutation', function_name, args)

    def close(self):
        self.executor.shutdown(wait=False, cancel_futures=True)
