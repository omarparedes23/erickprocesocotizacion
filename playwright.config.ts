import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  // `generateNextCaseCode` (lib/cases/registration.ts) calcula el código del
  // caso como `count(*) + 1` sin secuencia dedicada: si dos casos se crean en
  // paralelo pueden leer el mismo count y chocar contra el unique constraint
  // `tume_cases_code_key`. Es un bug de concurrencia de la app (fuera de
  // alcance de la Fase 7), así que acá forzamos ejecución serial para no
  // pisarnos con la creación de casos entre specs.
  fullyParallel: false,
  workers: 1,
  reporter: "html",
  globalSetup: "./e2e/global-setup.ts",
  globalTeardown: "./e2e/global-teardown.ts",
  // Corremos contra `next dev` (webServer de abajo) hablando con un Supabase
  // REMOTO real (no local): compilación on-demand + round-trips de red medidos
  // en los logs del server en 1-8s por request (login() llegó a 5.1s,
  // advanceCase() a 4.2s). Cada spec encadena ~20 round trips (logins,
  // navegaciones, submits), así que los timeouts default de Playwright
  // (30s/test, 5s/expect, pensados para `next start` local) se quedan cortos.
  timeout: 180_000,
  expect: {
    timeout: 15_000,
  },
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
