import { test, expect } from "@playwright/test";
import {
  answerGateway,
  clickContinuar,
  confirmCotizacion,
  createCase,
  getHistoryLines,
  goToCase,
  login,
  switchTo,
  uniqueClientName,
  uniqueTitle,
} from "./helpers";

/**
 * Camino feliz que atraviesa los 4 roles y toca el escalamiento técnico
 * (revisar_tdr -> no -> consultar_gerencia_tecnica), para que gerente_tecnico
 * participe. El camino más corto (revisar_tdr -> si) nunca pasa por ese rol.
 */
test("recorre los 4 roles hasta enviar_cliente pasando por gerencia técnica", async ({
  page,
}) => {
  // 1. gerente_comercial crea el caso (budgetUsd >= 5000, sin express).
  await login(page, "gerente_comercial");
  const caseId = await createCase(page, {
    title: uniqueTitle("Happy"),
    clientName: uniqueClientName(),
    budgetUsd: 6000,
  });

  // 2. gerente_comercial: recibir_solicitud (auto) -> distribuir_solicitud (sí, especialidad eléctrica).
  await clickContinuar(page, "distribuir_solicitud");
  await answerGateway(page, "si", "revisar_solicitud");

  // 3. lider_cotizador: revisar_solicitud (sí + tieneTdr) -> revisar_tdr.
  await switchTo(page, "lider_cotizador");
  await goToCase(page, caseId);
  await answerGateway(page, "si", "revisar_tdr", { tieneTdr: true });

  // 4. cotizador: revisar_tdr (no, información insuficiente) -> consultar_gerencia_tecnica.
  await switchTo(page, "cotizador");
  await goToCase(page, caseId);
  await answerGateway(page, "no", "consultar_gerencia_tecnica");

  // 5. gerente_tecnico: consultar_gerencia_tecnica (sí, aclara consultas) -> cotizar.
  await switchTo(page, "gerente_tecnico");
  await goToCase(page, caseId);
  await answerGateway(page, "si", "cotizar");

  // 6. cotizador: cotizar (monto + documento revisado) -> revisar_cotizacion_lider.
  await switchTo(page, "cotizador");
  await goToCase(page, caseId);
  await confirmCotizacion(page, 5800, "revisar_cotizacion_lider");

  // 7. lider_cotizador: revisar_cotizacion_lider (sí) -> revisar_cotizacion_gerencia.
  await switchTo(page, "lider_cotizador");
  await goToCase(page, caseId);
  await answerGateway(page, "si", "revisar_cotizacion_gerencia");

  // 8. gerente_comercial: revisar_cotizacion_gerencia (sí) -> enviar_cliente (terminal).
  await switchTo(page, "gerente_comercial");
  await goToCase(page, caseId);
  await answerGateway(page, "si", "enviar_cliente");

  await expect(
    page.getByText(
      "Este caso está cerrado. No hay más acciones disponibles.",
    ),
  ).toBeVisible();

  // El historial tiene 9 filas: 1 por la creación del caso ("— → Recibir
  // solicitud", insertada por tume_create_case) + 8 por cada transición de
  // la máquina de estados que efectivamente recorrimos en los pasos 2-8
  // (ver supabase/migrations/0001_init.sql: tume_apply_transition inserta
  // una fila por llamada).
  const lines = await getHistoryLines(page);
  expect(lines).toHaveLength(9);
});
