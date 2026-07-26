import type { Role, TaskType } from "./transitions";

export const TASK_LABEL: Record<TaskType, string> = {
  recibir_solicitud: "Recibir solicitud",
  distribuir_solicitud: "Distribuir solicitud",
  revisar_solicitud: "Revisar solicitud",
  revisar_tdr: "Revisar TDR",
  consultar_gerencia_tecnica: "Consultar gerencia técnica",
  solicitar_informacion: "Solicitar información",
  solicitar_visita_tecnica: "Solicitar visita técnica",
  evaluar_gerencia_tecnica: "Evaluar gerencia técnica",
  cotizar: "Cotizar",
  revisar_cotizacion_lider: "Revisar cotización (líder)",
  revisar_cotizacion_gerencia: "Revisar cotización (gerencia)",
  enviar_cliente: "Enviar al cliente",
  enviar_no_cotizar: "No cotizar",
};

export const ROLE_LABEL: Record<Role, string> = {
  gerente_comercial: "Gerente comercial",
  lider_cotizador: "Líder cotizador",
  gerente_tecnico: "Gerente técnico",
  cotizador: "Cotizador",
};
