"use server";

import { redirect } from "next/navigation";
import { completeFinalTask, transitionCase } from "@/app/actions/cases";
import { getTaskUiKind } from "@/lib/workflow/task-ui";
import type { GatewayAnswer, TaskType } from "@/lib/workflow/transitions";

export async function advanceCase(formData: FormData) {
  const caseId = formData.get("caseId") as string;
  const currentTaskType = formData.get("currentTaskType") as TaskType;
  const reasonRaw = ((formData.get("reason") as string) ?? "").trim();
  const reason = reasonRaw || undefined;

  const uiKind = getTaskUiKind(currentTaskType);

  // enviar_cliente / enviar_no_cotizar no generan tarea siguiente (el
  // diagrama termina en el evento Fin): no pasan por transitionCase/
  // getNextTask, solo confirman la tarea actual como hecha.
  if (uiKind === "final-confirm") {
    const confirmed = formData.get("confirmSent") === "on";
    if (!confirmed) {
      redirect(
        `/casos/${caseId}?error=${encodeURIComponent("Debes confirmar el envío antes de cerrar el caso")}`,
      );
    }

    try {
      await completeFinalTask({ caseId, currentTaskType, reason });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      redirect(`/casos/${caseId}?error=${encodeURIComponent(message)}`);
    }

    redirect(`/casos/${caseId}`);
  }

  // Las tareas automáticas (y "cotizar", que se comporta igual) no tienen
  // campo "answer" en el form: el valor es dummy, `getNextTask` lo ignora
  // internamente para estas tareas.
  const answer: GatewayAnswer =
    uiKind === "automatic" || uiKind === "cotizar"
      ? "si"
      : ((formData.get("answer") as GatewayAnswer) ?? "si");

  // tieneTdr solo aplica al caso especial revisar_solicitud, y solo cuando
  // la primera pregunta ("¿se cotiza?") fue respondida "sí".
  const tieneTdr =
    uiKind === "revisar-solicitud" && answer === "si"
      ? formData.get("tieneTdr") === "on"
      : undefined;

  // "cotizar" exige monto > 0 y la confirmación de que se revisó el
  // documento antes de avanzar a revisar_cotizacion_lider. La carga del
  // documento en sí queda para una fase futura.
  let quotedAmountUsd: number | undefined;
  if (uiKind === "cotizar") {
    const documentReviewed = formData.get("documentReviewed") === "on";
    if (!documentReviewed) {
      redirect(
        `/casos/${caseId}?error=${encodeURIComponent("Debes confirmar que revisaste el documento de la cotización")}`,
      );
    }

    const rawAmount = formData.get("quotedAmountUsd") as string | null;
    quotedAmountUsd = rawAmount ? Number(rawAmount) : NaN;
    if (!Number.isFinite(quotedAmountUsd) || quotedAmountUsd <= 0) {
      redirect(
        `/casos/${caseId}?error=${encodeURIComponent("Ingresa un monto de cotización válido")}`,
      );
    }
  }

  try {
    await transitionCase({
      caseId,
      currentTaskType,
      answer,
      tieneTdr,
      quotedAmountUsd,
      reason,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    redirect(`/casos/${caseId}?error=${encodeURIComponent(message)}`);
  }

  redirect(`/casos/${caseId}`);
}
