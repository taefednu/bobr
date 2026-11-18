/** Маршруты экранов v3: у них своя оболочка (без старой шапки, рейки и нижней навигации), см. ChildShell. */
export const V3_ROUTES = ["/home", "/house", "/chat", "/profile"] as const;
export const isV3Route = (path: string) => V3_ROUTES.some((r) => path === r || path.startsWith(`${r}/`));
