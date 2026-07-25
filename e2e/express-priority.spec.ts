import { test, expect } from "@playwright/test";
import { advanceToRevisarTdr, login, uniqueClientName, uniqueTitle } from "./helpers";

test("un caso Express aparece antes que uno no-Express en la bandeja, aunque se haya creado después", async ({
  page,
}) => {
  const noExpressTitle = uniqueTitle("No-Express");
  const expressTitle = uniqueTitle("Express");

  // 1. Caso NO express (budget alto, sin marcar el checkbox), creado PRIMERO.
  // advanceToRevisarTdr lo deja en la bandeja de cotizador (revisar_tdr).
  await advanceToRevisarTdr(page, {
    title: noExpressTitle,
    clientName: uniqueClientName(),
    budgetUsd: 8000,
  });

  // 2. Caso Express (budget < 5000 + checkbox marcado), creado SEGUNDO —
  // llega a la misma tarea de cotizador (revisar_tdr). No hace falta un
  // sleep explícito: cada `await` de advanceToRevisarTdr ya introduce
  // varios roundtrips reales contra el server (varios logins/navegaciones),
  // así que `created_at` del segundo caso queda estrictamente después del
  // primero sin necesidad de esperar a propósito.
  await advanceToRevisarTdr(page, {
    title: expressTitle,
    clientName: uniqueClientName(),
    budgetUsd: 4000,
    requestedExpress: true,
  });

  // 3. cotizador ve su bandeja: el caso Express debe aparecer ANTES que el
  // no-Express (is_express desc, created_at asc — ver lib/cases/inbox.ts).
  await login(page, "cotizador");
  await page.goto("/dashboard");

  const items = page.locator("ul.divide-y > li");
  const texts = await items.allTextContents();

  const expressIndex = texts.findIndex((t) => t.includes(expressTitle));
  const noExpressIndex = texts.findIndex((t) => t.includes(noExpressTitle));

  expect(expressIndex).toBeGreaterThanOrEqual(0);
  expect(noExpressIndex).toBeGreaterThanOrEqual(0);
  expect(expressIndex).toBeLessThan(noExpressIndex);
});
