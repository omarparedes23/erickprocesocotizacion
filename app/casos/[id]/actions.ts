"use server";

import { redirect } from "next/navigation";
import { transitionCase } from "@/app/actions/cases";
import { getTaskUiKind } from "@/lib/workflow/task-ui";
import type { GatewayAnswer, TaskType } from "@/lib/workflow/transitions";

export async function advanceCase(formData: FormData) {
  const caseId = formData.get("caseId") as string;
  const currentTaskType = formData.get("currentTaskType") as TaskType;
  const reasonRaw = ((formData.get("reason") as string) ?? "").trim();
  const reason = reasonRaw || undefined;

  const uiKind = getTaskUiKind(currentTaskType);

  // Las tareas automáticas no tienen campo "answer" en el form: el valor es
  // dummy, `getNextTask` lo ignora internamente para estas tareas.
  const answer: GatewayAnswer =
    uiKind === "automatic"
      ? "si"
      : ((formData.get("answer") as GatewayAnswer) ?? "si");

  // tieneTdr solo aplica al caso especial revisar_solicitud, y solo cuando
  // la primera pregunta ("¿se cotiza?") fue respondida "sí".
  const tieneTdr =
    uiKind === "revisar-solicitud" && answer === "si"
      ? formData.get("tieneTdr") === "on"
      : undefined;

  try {
    await transitionCase({ caseId, currentTaskType, answer, tieneTdr, reason });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    redirect(`/casos/${caseId}?error=${encodeURIComponent(message)}`);
  }

  redirect(`/casos/${caseId}`);
}
