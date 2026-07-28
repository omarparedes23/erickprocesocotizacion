import { test, expect } from "@playwright/test";
import {
  advanceToRevisarCotizacionLider,
  answerGateway,
  confirmCotizacion,
  getHistoryLines,
  goToCase,
  login,
  switchTo,
  TASK_LABEL,
  uniqueClientName,
  uniqueTitle,
} from "./helpers";

test("revisar_cotizacion_lider rechaza y reenvía antes de aprobar", async ({
  page,
}) => {
  // Precondición: caso en revisar_cotizacion_lider (mismo camino que
  // happy-path, factorizado en helpers.ts). El helper termina con la sesión
  // cerrada.
  const caseId = await advanceToRevisarCotizacionLider(page, {
    title: uniqueTitle("Rechazo"),
    clientName: uniqueClientName(),
    budgetUsd: 7000,
  });

  // 1. lider_cotizador rechaza -> vuelve a cotizar.
  await login(page, "lider_cotizador");
  await goToCase(page, caseId);
  await answerGateway(page, "no", "cotizar");

  // 2. cotizador reenvía (monto + documento revisado) -> revisar_cotizacion_lider de nuevo.
  await switchTo(page, "cotizador");
  await goToCase(page, caseId);
  await confirmCotizacion(page, 7200, "revisar_cotizacion_lider");

  // 3. lider_cotizador ahora aprueba -> revisar_cotizacion_gerencia.
  await switchTo(page, "lider_cotizador");
  await goToCase(page, caseId);
  await answerGateway(page, "si", "revisar_cotizacion_gerencia");

  // 4. gerente_comercial aprueba -> enviar_cliente.
  await switchTo(page, "gerente_comercial");
  await goToCase(page, caseId);
  await answerGateway(page, "si", "enviar_cliente");

  // El historial debe incluir la secuencia adyacente:
  // revisar_cotizacion_lider -> cotizar (el rechazo) seguida de
  // cotizar -> revisar_cotizacion_lider (el reenvío).
  const lines = await getHistoryLines(page);
  const rejectLine = `${TASK_LABEL.revisar_cotizacion_lider} → ${TASK_LABEL.cotizar}`;
  const resendLine = `${TASK_LABEL.cotizar} → ${TASK_LABEL.revisar_cotizacion_lider}`;

  const rejectIdx = lines.indexOf(rejectLine);
  expect(rejectIdx).toBeGreaterThanOrEqual(0);
  expect(lines[rejectIdx + 1]).toBe(resendLine);
});
