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
  revisar_tdr: "¿El TDR tiene información suficiente para cotizar?",
  consultar_gerencia_tecnica:
    "¿La consulta con Gerencia Técnica aclaró las dudas?",
  solicitar_informacion:
    "¿La información solicitada al cliente es suficiente para cotizar?",
  solicitar_visita_tecnica:
    "¿Con la visita técnica ya hay información suficiente para cotizar?",
  evaluar_gerencia_tecnica:
    "¿Gerencia Técnica confirma que hay información suficiente para cotizar?",
  revisar_cotizacion_lider: "¿Se aprueba?",
  revisar_cotizacion_gerencia: "¿Se aprueba?",
};
