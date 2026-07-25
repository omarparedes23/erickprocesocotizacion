/**
 * Global setup de Playwright: precalienta las rutas que la suite visita,
 * disparando su compilación on-demand de `next dev` ANTES de que arranque el
 * primer test. Sin esto, el primer test que toca cada ruta paga el costo de
 * compilación en frío (varios segundos, a veces más de un minuto la primera
 * vez) además de la latencia real de red contra el Supabase remoto (no hay
 * DB local), lo que hace fallar los `expect`/clicks aunque el timeout esté
 * generoso — no es un problema de la app, es el costo de la primera visita a
 * cada ruta bajo `next dev`.
 *
 * Corre DESPUÉS de que el `webServer` de playwright.config.ts confirma estar
 * arriba (ver orden documentado de Playwright: webServer -> globalSetup ->
 * tests), así que localhost:3000 ya responde acá.
 */
async function globalSetup(): Promise<void> {
  const baseURL = "http://localhost:3000";
  const routes = [
    "/login",
    "/dashboard",
    "/casos/nuevo",
    "/casos/00000000-0000-0000-0000-000000000000",
  ];

  for (const route of routes) {
    try {
      await fetch(`${baseURL}${route}`);
    } catch (err) {
      console.warn(
        `[e2e:global-setup] No se pudo precalentar ${route}: ${(err as Error).message}`,
      );
    }
  }
}

export default globalSetup;
