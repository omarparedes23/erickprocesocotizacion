import type { TaskType } from "@/lib/workflow/transitions";

/**
 * Estado de negocio del caso para el filtro de "Todos los Casos", derivado
 * de `current_task_type` + `enviado_at` (no es una columna, se calcula):
 * - "en_proceso": no llegó todavía a una tarea final.
 * - "pendiente_envio": llegó a enviar_cliente/enviar_no_cotizar pero
 *   gerente_comercial todavía no confirmó el envío (ver
 *   0006_final_task_confirmation.sql).
 * - "enviado_cliente" / "no_cotizado": tarea final ya confirmada
 *   (`enviado_at` seteado, ver 0008_enviado_at.sql).
 */
export type CaseStatus =
  | "en_proceso"
  | "pendiente_envio"
  | "enviado_cliente"
  | "no_cotizado";

export type CaseStatusFilter = "todos" | CaseStatus;

export const CASE_STATUS_FILTER_OPTIONS: Array<{
  value: CaseStatusFilter;
  label: string;
}> = [
  { value: "todos", label: "Todos" },
  { value: "en_proceso", label: "En Proceso" },
  { value: "pendiente_envio", label: "Pendiente de Confirmar Envío" },
  { value: "enviado_cliente", label: "Enviado al Cliente" },
  { value: "no_cotizado", label: "No Cotizado" },
];

/** Fila mínima de `tume_cases` necesaria para clasificar el estado. */
export interface CaseStatusRow {
  current_task_type: TaskType;
  enviado_at: string | null;
}

export function classifyCaseStatus(caso: CaseStatusRow): CaseStatus {
  if (caso.current_task_type === "enviar_cliente") {
    return caso.enviado_at ? "enviado_cliente" : "pendiente_envio";
  }
  if (caso.current_task_type === "enviar_no_cotizar") {
    return caso.enviado_at ? "no_cotizado" : "pendiente_envio";
  }
  return "en_proceso";
}

export function matchesStatusFilter(
  caso: CaseStatusRow,
  filter: CaseStatusFilter,
): boolean {
  if (filter === "todos") {
    return true;
  }
  return classifyCaseStatus(caso) === filter;
}

/** Normaliza un valor de query param arbitrario a un CaseStatusFilter válido. */
export function parseCaseStatusFilter(
  value: string | undefined,
): CaseStatusFilter {
  const valid = CASE_STATUS_FILTER_OPTIONS.map((o) => o.value) as string[];
  return valid.includes(value ?? "") ? (value as CaseStatusFilter) : "todos";
}
