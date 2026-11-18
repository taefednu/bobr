import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

// 03:00 UTC = 08:00 Asia/Tashkent: сводка за сутки и «давно не заходил(а)» уходят сразу после тихих часов.
const crons = cronJobs();
crons.cron("parent digests", "0 3 * * *", internal.outbox.produceDigests, {});
// 21:00 UTC = 02:00 Tashkent: turns старше 30 дней и закрытые флаги старше 90 (convex/retention.ts)
crons.cron("retention purge", "0 21 * * *", internal.retention.purgeExpired, {});

export default crons;
