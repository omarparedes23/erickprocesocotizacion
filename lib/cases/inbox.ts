import { TASK_ROLE, type Role, type TaskType } from "@/lib/workflow/transitions";

/**
 * Fila mínima de `tume_cases` necesaria para armar la bandeja por rol.
 * El Server Component trae estos campos (más el nombre del cliente) desde
 * Supabase; esta función pura no conoce Supabase, solo opera sobre datos ya
 * resueltos.
 */
export interface InboxCaseRow {
  id: string;
  code: string;
  title: string;
  budget_usd: number | null;
  is_express: boolean;
  current_task_type: TaskType;
  created_at: string;
  tume_clients: { name: string } | null;
}

/**
 * Bandeja por rol: filtra los casos cuya tarea actual (`current_task_type`)
 * mapea, vía `TASK_ROLE`, al rol del usuario logueado, y los ordena con los
 * Express primero (`is_express desc`) y luego por antigüedad (`created_at
 * asc`) — Requirement "Bandeja por rol" + "Priorización de Cotizaciones
 * Express".
 *
 * `TASK_ROLE` es un mapeo en TypeScript, no una columna SQL: por eso el
 * filtro se aplica en memoria sobre los casos no cerrados que ya trajo el
 * caller, en vez de intentar traducirlo a un `.eq()` de Supabase.
 */
export function filterAndSortInbox(
  cases: InboxCaseRow[],
  role: Role,
): InboxCaseRow[] {
  return cases
    .filter((caso) => TASK_ROLE[caso.current_task_type] === role)
    .sort((a, b) => {
      if (a.is_express !== b.is_express) {
        return a.is_express ? -1 : 1;
      }
      return (
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    });
}
