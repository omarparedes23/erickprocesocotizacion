import type { TaskType } from "./transitions";

/**
 * Qué tipo de formulario de acción mostrar para un `TaskType`:
 * - "terminal": caso cerrado, sin acciones posibles.
 * - "automatic": un solo botón "Continuar" (answer se ignora, se envía "si" dummy).
 * - "simple-gateway": dos botones sí/no.
 * - "revisar-solicitud": caso especial, dos preguntas encadenadas (¿se cotiza? + ¿tiene TDR?).
 */
export type TaskUiKind =
  | "terminal"
  | "automatic"
  | "simple-gateway"
  | "revisar-solicitud";

const TERMINAL_TASKS = new Set<TaskType>(["enviar_cliente", "enviar_no_cotizar"]);

const AUTOMATIC_TASKS = new Set<TaskType>(["recibir_solicitud", "cotizar"]);

export function getTaskUiKind(task: TaskType): TaskUiKind {
  if (TERMINAL_TASKS.has(task)) {
    return "terminal";
  }
  if (task === "revisar_solicitud") {
    return "revisar-solicitud";
  }
  if (AUTOMATIC_TASKS.has(task)) {
    return "automatic";
  }
  return "simple-gateway";
}
