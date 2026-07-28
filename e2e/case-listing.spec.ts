import { test, expect } from "@playwright/test";
import {
  clickContinuar,
  confirmFinalSend,
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

  // distribuir_solicitud -> "no" manda el caso a enviar_no_cotizar
  // (stage=cerrado ya queda seteado) — el camino más corto a un caso
  // terminal para este test. Sigue siendo gerente_comercial quien confirma
  // el envío, así que no hace falta cambiar de sesión.
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
  await confirmFinalSend(page);

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
  // sin acciones disponibles (envío ya confirmado, ver confirmFinalSend arriba).
  await closedLink.click();
  await expect(
    page.getByRole("heading", { name: closedTitle }),
  ).toBeVisible();
  await expect(page.getByText("Este caso ha finalizado")).toBeVisible();
});
