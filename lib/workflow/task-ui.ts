import type { TaskType } from "./transitions";

/**
 * Qué tipo de formulario de acción mostrar para un `TaskType`:
 * - "automatic": un solo botón "Continuar" (answer se ignora, se envía "si" dummy).
 * - "simple-gateway": dos botones sí/no.
 * - "revisar-solicitud": caso especial, dos preguntas encadenadas (¿se cotiza? + ¿tiene TDR?).
 * - "cotizar": caso especial, monto de la cotización + checkbox de documento revisado
 *   (answer se ignora igual que "automatic", la transición es automática).
 * - "final-confirm": enviar_cliente/enviar_no_cotizar. En el diagrama son un
 *   task de envío propio antes del evento Fin, no un efecto colateral de la
 *   aprobación previa: requieren que gerente_comercial confirme el envío con
 *   un checkbox. No generan tarea siguiente (ver isFinalTask()).
 */
export type TaskUiKind =
  | "automatic"
  | "simple-gateway"
  | "revisar-solicitud"
  | "cotizar"
  | "final-confirm";

const FINAL_TASKS = new Set<TaskType>(["enviar_cliente", "enviar_no_cotizar"]);

const AUTOMATIC_TASKS = new Set<TaskType>(["recibir_solicitud"]);

export function getTaskUiKind(task: TaskType): TaskUiKind {
  if (FINAL_TASKS.has(task)) {
    return "final-confirm";
  }
  if (task === "revisar_solicitud") {
    return "revisar-solicitud";
  }
  if (task === "cotizar") {
    return "cotizar";
  }
  if (AUTOMATIC_TASKS.has(task)) {
    return "automatic";
  }
  return "simple-gateway";
}

/**
 * ¿Es una tarea final (enviar_cliente / enviar_no_cotizar)? A diferencia del
 * resto, estas tareas no generan una tarea siguiente: `current_task_type`
 * del caso se queda en el mismo valor incluso después de confirmadas, así
 * que la UI necesita consultar el `status` de la fila en `tume_tasks` para
 * saber si el envío ya fue confirmado o sigue pendiente.
 */
export function isFinalTask(task: TaskType): boolean {
  return FINAL_TASKS.has(task);
}
