/** Маршруты экранов v3: у них своя оболочка (без старой шапки, рейки и нижней навигации), см. ChildShell. */
export const V3_ROUTES = ["/home", "/house", "/chat", "/profile", "/lesson", "/teach", "/start", "/goal", "/diagnose", "/plan"] as const;
export const isV3Route = (path: string) => V3_ROUTES.some((r) => path === r || path.startsWith(`${r}/`));

/** Порядок вкладок таб-бара (слева направо): по нему выбирается сторона, откуда въезжает страница. */
export const TAB_PATHS = ["/home", "/house", "/chat", "/profile"] as const;
export const tabIndex = (path: string) => TAB_PATHS.findIndex((r) => path === r || path.startsWith(`${r}/`));
/** Экраны, где бар виден: чат (и всё вне вкладок) бара не показывает. */
export const hasTabBar = (path: string) => { const i = tabIndex(path); return i >= 0 && TAB_PATHS[i] !== "/chat"; };
