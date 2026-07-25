import { expect, type Page } from "@playwright/test";
import type { GatewayAnswer, Role, TaskType } from "@/lib/workflow/transitions";

/**
 * Credenciales de los 4 usuarios de prueba dedicados a E2E (creados para esta
 * fase, misma password para los 4). Reutiliza el tipo `Role` de
 * lib/workflow/transitions.ts en vez de duplicarlo.
 */
export const TEST_USERS: Record<Role, { email: string; password: string }> = {
  gerente_comercial: {
    email: "tume.comercial@example.com",
    password: "TumeTest2026!",
  },
  lider_cotizador: {
    email: "tume.lider@example.com",
    password: "TumeTest2026!",
  },
  gerente_tecnico: {
    email: "tume.tecnico@example.com",
    password: "TumeTest2026!",
  },
  cotizador: {
    email: "tume.cotizador@example.com",
    password: "TumeTest2026!",
  },
};

/**
 * Mirror del `TASK_LABEL` privado de app/casos/[id]/page.tsx y
 * app/dashboard/page.tsx. Se duplica acá (en vez de importarlo) porque no
 * está exportado de esos módulos de UI; los tests lo necesitan para
 * aserciones legibles sobre "Tarea actual" y el historial.
 */
export const TASK_LABEL: Record<TaskType, string> = {
  recibir_solicitud: "Recibir solicitud",
  distribuir_solicitud: "Distribuir solicitud",
  revisar_solicitud: "Revisar solicitud",
  revisar_tdr: "Revisar TDR",
  consultar_gerencia_tecnica: "Consultar gerencia técnica",
  solicitar_informacion: "Solicitar información",
  solicitar_visita_tecnica: "Solicitar visita técnica",
  evaluar_gerencia_tecnica: "Evaluar gerencia técnica",
  cotizar: "Cotizar",
  revisar_cotizacion_lider: "Revisar cotización (líder)",
  revisar_cotizacion_gerencia: "Revisar cotización (gerencia)",
  enviar_cliente: "Enviar al cliente",
  enviar_no_cotizar: "No cotizar",
};

let uniqueCounter = 0;

/** Sufijo único para prefijar títulos/nombres de datos de E2E ([E2E] ...). */
function uniqueSuffix(): string {
  uniqueCounter += 1;
  return `${Date.now()}-${uniqueCounter}-${Math.random().toString(36).slice(2, 8)}`;
}

export function uniqueTitle(label: string): string {
  return `[E2E] ${label} ${uniqueSuffix()}`;
}

export function uniqueClientName(): string {
  return `[E2E] Cliente ${uniqueSuffix()}`;
}

export async function login(page: Page, role: Role): Promise<void> {
  const { email, password } = TEST_USERS[role];
  await page.goto("/login");
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  // Login SÍ cambia la URL (/login -> /dashboard), así que waitForURL es seguro acá.
  await page.waitForURL("**/dashboard");
}

export async function logout(page: Page): Promise<void> {
  // El botón "Cerrar sesión" solo vive en /dashboard (no en /casos/[id]), así
  // que hay que ir ahí primero sin importar en qué página estemos parados.
  await page.goto("/dashboard");
  await page.getByRole("button", { name: "Cerrar sesión" }).click();
  await page.waitForURL("**/login");
}

/** Cierra sesión y entra con otro rol. Necesario: /login redirige a /dashboard si ya hay sesión (ver proxy.ts). */
export async function switchTo(page: Page, role: Role): Promise<void> {
  await logout(page);
  await login(page, role);
}

export interface CreateCaseOptions {
  title: string;
  clientName: string;
  budgetUsd: number;
  requestedExpress?: boolean;
  deliveryDueAt?: string;
  type?: "servicio" | "bien";
}

/** Llena /casos/nuevo y devuelve el UUID del caso creado (extraído de la URL post-redirect). */
export async function createCase(
  page: Page,
  opts: CreateCaseOptions,
): Promise<string> {
  await page.goto("/casos/nuevo");
  if (opts.type) {
    await page.locator("#type").selectOption(opts.type);
  }
  await page.locator("#title").fill(opts.title);
  await page.locator("#clientName").fill(opts.clientName);
  await page.locator("#budgetUsd").fill(String(opts.budgetUsd));
  if (opts.requestedExpress) {
    await page.locator("#requestedExpress").check();
  }
  if (opts.deliveryDueAt) {
    await page.locator("#deliveryDueAt").fill(opts.deliveryDueAt);
  }
  await page.getByRole("button", { name: "Registrar caso" }).click();
  // La URL cambia de /casos/nuevo a /casos/[id]: waitForURL es seguro acá.
  await page.waitForURL(/\/casos\/[0-9a-f-]{36}$/);
  const match = page.url().match(/\/casos\/([0-9a-f-]{36})$/);
  if (!match) {
    throw new Error(
      `No se pudo extraer el ID del caso de la URL: ${page.url()}`,
    );
  }
  return match[1];
}

export async function goToCase(page: Page, caseId: string): Promise<void> {
  await page.goto(`/casos/${caseId}`);
}

/**
 * Asserta el label de "Tarea actual" en /casos/[id]. Se usa como mecanismo de
 * espera tras enviar un formulario de acción: el form de acción hace un POST
 * a un Server Action que redirige de vuelta a LA MISMA URL (/casos/[id]), así
 * que `page.waitForURL` no sirve para esperar ese round-trip (la URL de
 * destino ya coincide con la actual y puede resolver antes de que el server
 * action termine). Esperar el contenido vía `expect(...).toHaveText` es
 * robusto porque Playwright reintenta hasta que el DOM realmente cambie.
 */
export async function expectCurrentTask(
  page: Page,
  task: TaskType,
): Promise<void> {
  await expect(page.locator("dt:has-text('Tarea actual') + dd")).toHaveText(
    TASK_LABEL[task],
  );
}

/** Click en "Continuar" (tareas automáticas: recibir_solicitud, cotizar). */
export async function clickContinuar(
  page: Page,
  expectedNextTask: TaskType,
): Promise<void> {
  await page.getByRole("button", { name: "Continuar" }).click();
  await expectCurrentTask(page, expectedNextTask);
}

/** Responde un gateway simple o revisar_solicitud (radios sí/no + tieneTdr opcional) y confirma. */
export async function answerGateway(
  page: Page,
  answer: GatewayAnswer,
  expectedNextTask: TaskType,
  opts?: { tieneTdr?: boolean; reason?: string },
): Promise<void> {
  await page.locator(`#answer-${answer}`).check();
  if (opts?.tieneTdr) {
    await page.locator("#tieneTdr").check();
  }
  if (opts?.reason) {
    await page.locator("#reason").fill(opts.reason);
  }
  await page.getByRole("button", { name: "Confirmar" }).click();
  await expectCurrentTask(page, expectedNextTask);
}

function normalizeWhitespace(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

/**
 * Devuelve la primera línea ("{from} → {to}") de cada entrada del historial
 * de transiciones, en orden cronológico ascendente (así se ordena la query).
 */
export async function getHistoryLines(page: Page): Promise<string[]> {
  const raw = await page
    .locator("h2:has-text('Historial de transiciones') ~ ul > li > p:first-child")
    .allTextContents();
  return raw.map(normalizeWhitespace);
}

/**
 * Camino compartido: crea el caso como gerente_comercial y lo hace avanzar
 * hasta `revisar_tdr` (recibir_solicitud auto -> distribuir_solicitud si ->
 * revisar_solicitud si+tieneTdr). Deja la tarea en la bandeja de `cotizador`
 * sin actuar sobre ella. Termina con la sesión cerrada.
 */
async function advanceToRevisarTdrInternal(
  page: Page,
  caseOpts: CreateCaseOptions,
): Promise<string> {
  await login(page, "gerente_comercial");
  const caseId = await createCase(page, caseOpts);
  await clickContinuar(page, "distribuir_solicitud");
  await answerGateway(page, "si", "revisar_solicitud");

  await switchTo(page, "lider_cotizador");
  await goToCase(page, caseId);
  await answerGateway(page, "si", "revisar_tdr", { tieneTdr: true });

  return caseId;
}

export async function advanceToRevisarTdr(
  page: Page,
  caseOpts: CreateCaseOptions,
): Promise<string> {
  const caseId = await advanceToRevisarTdrInternal(page, caseOpts);
  await logout(page);
  return caseId;
}

/**
 * Camino compartido completo hasta `revisar_cotizacion_lider` (usado por
 * rejection-loop.spec.ts como precondición). Continúa desde
 * advanceToRevisarTdrInternal: revisar_tdr no (info insuficiente) ->
 * consultar_gerencia_tecnica si (aclara) -> cotizar -> continuar ->
 * revisar_cotizacion_lider. Termina con la sesión cerrada.
 */
export async function advanceToRevisarCotizacionLider(
  page: Page,
  caseOpts: CreateCaseOptions,
): Promise<string> {
  const caseId = await advanceToRevisarTdrInternal(page, caseOpts);

  await switchTo(page, "cotizador");
  await goToCase(page, caseId);
  await answerGateway(page, "no", "consultar_gerencia_tecnica");

  await switchTo(page, "gerente_tecnico");
  await goToCase(page, caseId);
  await answerGateway(page, "si", "cotizar");

  await switchTo(page, "cotizador");
  await goToCase(page, caseId);
  await clickContinuar(page, "revisar_cotizacion_lider");

  await logout(page);
  return caseId;
}
