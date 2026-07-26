import { test, expect } from "@playwright/test";
import {
  clickContinuar,
  createCase,
  login,
  uniqueClientName,
  uniqueTitle,
} from "./helpers";

test("el listado /casos muestra casos abiertos y cerrados, navegables desde el dashboard", async ({
  page,
}) => {
  await login(page, "gerente_comercial");

  const openTitle = uniqueTitle("Listado-Abierto");
  await createCase(page, {
    title: openTitle,
    clientName: uniqueClientName(),
    budgetUsd: 8000,
  });

  // distribuir_solicitud -> "no" cierra el caso de una (enviar_no_cotizar,
  // stage=cerrado) — el camino más corto a un caso terminal para este test.
  const closedTitle = uniqueTitle("Listado-Cerrado");
  await createCase(page, {
    title: closedTitle,
    clientName: uniqueClientName(),
    budgetUsd: 8000,
  });
  await clickContinuar(page, "distribuir_solicitud");
  await page.locator("#answer-no").check();
  await page.getByRole("button", { name: "Confirmar" }).click();
  await expect(page.locator("dt:has-text('Tarea actual') + dd")).toHaveText(
    "No cotizar",
  );

  // Navegación: dashboard -> "Todos los casos" -> /casos
  await page.goto("/dashboard");
  await page.getByRole("link", { name: "Todos los casos" }).click();
  await page.waitForURL("**/casos");

  // El listado muestra ambos casos, incluido el cerrado.
  const openLink = page.getByRole("link", { name: openTitle });
  const closedLink = page.getByRole("link", { name: closedTitle });
  await expect(openLink).toBeVisible();
  await expect(closedLink).toBeVisible();
  await expect(closedLink).toContainText("cerrado");

  // Click en la fila del caso cerrado navega al detalle correcto y lo muestra
  // sin acciones disponibles (uiKind === "terminal").
  await closedLink.click();
  await expect(
    page.getByRole("heading", { name: closedTitle }),
  ).toBeVisible();
  await expect(
    page.getByText("Este caso está cerrado. No hay más acciones disponibles."),
  ).toBeVisible();
});
