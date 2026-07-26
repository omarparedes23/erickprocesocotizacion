import type { TaskType } from "./transitions";

/**
 * Pregunta de negocio real detrás del Sí/No de cada gateway (TASKS.md líneas
 * 21-31). Tareas automáticas (recibir_solicitud, cotizar) y terminales
 * (enviar_cliente, enviar_no_cotizar) no tienen entrada acá porque no
 * presentan ninguna pregunta.
 */
export const TASK_GATEWAY_QUESTION: Partial<Record<TaskType, string>> = {
  distribuir_solicitud:
    "¿Es una especialidad que cotizamos (eléctrica o instrumentación)?",
  revisar_solicitud: "¿Se cotiza?",
  revisar_tdr: "¿Suficiente información para cotizar?",
  consultar_gerencia_tecnica: "¿Aclara consultas?",
  solicitar_informacion: "¿Suficiente información?",
  solicitar_visita_tecnica: "¿Suficiente información?",
  evaluar_gerencia_tecnica: "¿Suficiente información?",
  revisar_cotizacion_lider: "¿Se aprueba?",
  revisar_cotizacion_gerencia: "¿Se aprueba?",
};
