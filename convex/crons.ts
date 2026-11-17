import { cronJobs } from "convex/server";

// TODO: раз в сутки «забыл → дом гаснет» (houseMapper.dimmed), сводка родителю. Спека → «Кроны».
const crons = cronJobs();

export default crons;
