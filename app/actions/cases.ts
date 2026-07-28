"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  computeIsExpress,
  getNextTask,
  getOutcomeForTask,
  getStageForTask,
  TASK_ROLE,
  type GatewayAnswer,
  type TaskType,
} from "@/lib/workflow/transitions";

const CreateCaseInput = z.object({
  code: z.string().min(1),
  clientId: z.uuid().nullable(),
  title: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(["servicio", "bien"]),
  budgetUsd: z.number().nonnegative().nullable(),
  requestedExpress: z.boolean(),
  deliveryDueAt: z.string().nullable(),
});

export async function createCase(input: z.infer<typeof CreateCaseInput>) {
  const parsed = CreateCaseInput.parse(input);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("No autenticado");
  }

  const isExpress = computeIsExpress(
    parsed.budgetUsd,
    parsed.requestedExpress,
  );

  const { data, error } = await supabase.rpc("tume_create_case", {
    p_code: parsed.code,
    p_client_id: parsed.clientId,
    p_title: parsed.title,
    p_description: parsed.description ?? null,
    p_type: parsed.type,
    p_budget_usd: parsed.budgetUsd,
    p_is_express: isExpress,
    p_delivery_due_at: parsed.deliveryDueAt,
    p_actor_id: user.id,
  });

  if (error) {
    throw new Error(`No se pudo crear el caso: ${error.message}`);
  }

  // La mutación pasa por el RPC de Supabase, invisible para el cache de
  // Next.js: sin este revalidatePath, la próxima vista de /dashboard servida
  // desde el Router Cache del cliente puede mostrar la bandeja desactualizada
  // (ver docs/revalidatePath.md: "Currently, it also causes all previously
  // visited pages to refresh when navigated to again").
  revalidatePath("/dashboard");

  return data;
}

const TransitionCaseInput = z.object({
  caseId: z.uuid(),
  currentTaskType: z.string(),
  answer: z.enum(["si", "no"]),
  tieneTdr: z.boolean().optional(),
  quotedAmountUsd: z.number().positive().optional(),
  reason: z.string().optional(),
});

export async function transitionCase(
  input: z.infer<typeof TransitionCaseInput>,
) {
  const parsed = TransitionCaseInput.parse(input);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("No autenticado");
  }

  const currentTaskType = parsed.currentTaskType as TaskType;
  const answer = parsed.answer as GatewayAnswer;

  const nextTaskType = getNextTask(currentTaskType, answer, {
    tieneTdr: parsed.tieneTdr,
  });
  const nextRole = TASK_ROLE[nextTaskType];
  const nextStage = getStageForTask(nextTaskType);
  const nextOutcome = getOutcomeForTask(nextTaskType);

  const { data, error } = await supabase.rpc("tume_apply_transition", {
    p_case_id: parsed.caseId,
    p_next_task_type: nextTaskType,
    p_next_role: nextRole,
    p_next_stage: nextStage,
    p_next_outcome: nextOutcome,
    p_actor_id: user.id,
    p_reason: parsed.reason ?? null,
    p_quoted_amount_usd: parsed.quotedAmountUsd ?? null,
  });

  if (error) {
    throw new Error(`No se pudo transicionar el caso: ${error.message}`);
  }

  // Sin esto, el redirect de advanceCase() de vuelta a /casos/[id] (LA MISMA
  // ruta) puede servir el RSC payload cacheado de antes de la transición: el
  // usuario ve la tarea vieja hasta que refresca a mano. Ver nota en
  // createCase() sobre por qué esta mutación (vía RPC de Supabase) es
  // invisible para el cache de Next.js si no se invalida explícitamente.
  revalidatePath(`/casos/${parsed.caseId}`);
  revalidatePath("/dashboard");

  return data;
}
