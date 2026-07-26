import { test, expect } from "@playwright/test";
import { login, uniqueClientName } from "./helpers";

test("alta de cliente aparece en el listado y no se duplica con otra capitalización", async ({
  page,
}) => {
  await login(page, "gerente_comercial");

  const clientName = uniqueClientName();
  const nameSpans = page.locator("li span.font-medium");

  await page.goto("/clientes/nuevo");
  await page.locator("#name").fill(clientName);
  await page.locator("#ruc").fill("20123456789");
  await page.getByRole("button", { name: "Registrar cliente" }).click();
  await page.waitForURL("**/clientes");

  const row = page.locator("li", { hasText: clientName });
  await expect(row).toBeVisible();
  await expect(row).toContainText("20123456789");

  // Reenviar el mismo nombre con otra capitalización/espacios no debe crear
  // una fila nueva: findOrCreateClient reusa el existente vía ilike. Comparamos
  // en minúsculas (no con RegExp/getByText case-insensitive) para no depender
  // de que Playwright matchee substrings dentro del <li> que también contiene
  // el ruc como texto hermano.
  await page.goto("/clientes/nuevo");
  await page.locator("#name").fill(`  ${clientName.toUpperCase()}  `);
  await page.getByRole("button", { name: "Registrar cliente" }).click();
  await page.waitForURL("**/clientes");

  const names = await nameSpans.allTextContents();
  const matches = names.filter(
    (n) => n.trim().toLowerCase() === clientName.toLowerCase(),
  );
  expect(matches).toHaveLength(1);
});
