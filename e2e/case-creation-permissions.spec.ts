import { test, expect } from "@playwright/test";
import { createCase, login, uniqueClientName, uniqueTitle } from "./helpers";

test("gerente_tecnico y cotizador no pueden crear casos (ni por UI ni por URL directa)", async ({
  page,
}) => {
  for (const role of ["gerente_tecnico", "cotizador"] as const) {
    await login(page, role);

    // El botón "Nuevo Caso" no debe aparecer en el sidebar para estos roles.
    await expect(
      page.getByRole("link", { name: "Nuevo Caso" }),
    ).not.toBeVisible();

    // Entrar directo por URL debe redirigir a /dashboard, no mostrar el form.
    await page.goto("/casos/nuevo");
    await page.waitForURL("**/dashboard");
  }
});

test("lider_cotizador sí puede crear casos (además de gerente_comercial)", async ({
  page,
}) => {
  await login(page, "lider_cotizador");

  await expect(page.getByRole("link", { name: "Nuevo Caso" })).toBeVisible();

  const caseId = await createCase(page, {
    title: uniqueTitle("Permisos-Lider"),
    clientName: uniqueClientName(),
    budgetUsd: 5000,
  });

  await expect(page).toHaveURL(new RegExp(`/casos/${caseId}$`));
});
