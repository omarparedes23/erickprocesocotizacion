export type TaskType =
  | "recibir_solicitud"
  | "distribuir_solicitud"
  | "revisar_solicitud"
  | "revisar_tdr"
  | "consultar_gerencia_tecnica"
  | "solicitar_informacion"
  | "solicitar_visita_tecnica"
  | "evaluar_gerencia_tecnica"
  | "cotizar"
  | "revisar_cotizacion_lider"
  | "revisar_cotizacion_gerencia"
  | "enviar_cliente"
  | "enviar_no_cotizar";

export type GatewayAnswer = "si" | "no";

export type Role =
  | "gerente_comercial"
  | "lider_cotizador"
  | "gerente_tecnico"
  | "cotizador";

export type CaseStage = "solicitud" | "revision" | "cotizacion" | "cerrado";

export type CaseOutcome =
  | "en_proceso"
  | "adjudicado"
  | "desestimado"
  | "no_adjudicado";

export interface TransitionContext {
  /** Solo relevante cuando current === 'revisar_solicitud': ¿el caso tiene TDR? */
  tieneTdr?: boolean;
}

const TERMINAL_TASKS = new Set<TaskType>(["enviar_cliente", "enviar_no_cotizar"]);

/** Tareas automáticas: no dependen de la respuesta del gateway, siempre van al mismo siguiente paso. */
const AUTOMATIC_TRANSITIONS: Partial<Record<TaskType, TaskType>> = {
  recibir_solicitud: "distribuir_solicitud",
  cotizar: "revisar_cotizacion_lider",
};

/** Tareas con un único gateway si/no. */
const SIMPLE_GATEWAY_TRANSITIONS: Partial<
  Record<TaskType, { si: TaskType; no: TaskType }>
> = {
  distribuir_solicitud: { si: "revisar_solicitud", no: "enviar_no_cotizar" },
  revisar_tdr: { si: "cotizar", no: "consultar_gerencia_tecnica" },
  consultar_gerencia_tecnica: {
    si: "cotizar",
    no: "solicitar_informacion",
  },
  solicitar_informacion: { si: "cotizar", no: "solicitar_visita_tecnica" },
  solicitar_visita_tecnica: {
    si: "cotizar",
    no: "evaluar_gerencia_tecnica",
  },
  evaluar_gerencia_tecnica: { si: "cotizar", no: "enviar_no_cotizar" },
  revisar_cotizacion_lider: {
    si: "revisar_cotizacion_gerencia",
    no: "cotizar",
  },
  revisar_cotizacion_gerencia: { si: "enviar_cliente", no: "cotizar" },
};

/**
 * Máquina de estados pura del proceso BPMN "Cotizaciones SAT". Sin efectos
 * secundarios, sin acceso a datos — ver TASKS.md para la secuencia completa
 * reescrita en lenguaje de negocio.
 */
export function getNextTask(
  current: TaskType,
  answer: GatewayAnswer,
  ctx: TransitionContext,
): TaskType {
  if (TERMINAL_TASKS.has(current)) {
    throw new Error(
      `No hay transiciones posibles desde un estado terminal: ${current}`,
    );
  }

  const automatic = AUTOMATIC_TRANSITIONS[current];
  if (automatic) {
    return automatic;
  }

  if (current === "revisar_solicitud") {
    if (answer === "no") {
      return "enviar_no_cotizar";
    }
    if (ctx.tieneTdr === undefined) {
      throw new Error(
        "revisar_solicitud con answer='si' requiere ctx.tieneTdr",
      );
    }
    return ctx.tieneTdr ? "revisar_tdr" : "enviar_no_cotizar";
  }

  const simple = SIMPLE_GATEWAY_TRANSITIONS[current];
  if (simple) {
    return answer === "si" ? simple.si : simple.no;
  }

  throw new Error(`Task type desconocido o sin transición definida: ${current}`);
}

/** Rol responsable de cada tarea, según los carriles (lanes) del BPMN. */
export const TASK_ROLE: Record<TaskType, Role> = {
  recibir_solicitud: "gerente_comercial",
  distribuir_solicitud: "gerente_comercial",
  revisar_solicitud: "lider_cotizador",
  revisar_tdr: "cotizador",
  consultar_gerencia_tecnica: "gerente_tecnico",
  solicitar_informacion: "cotizador",
  solicitar_visita_tecnica: "cotizador",
  evaluar_gerencia_tecnica: "gerente_tecnico",
  cotizar: "cotizador",
  revisar_cotizacion_lider: "lider_cotizador",
  revisar_cotizacion_gerencia: "gerente_comercial",
  enviar_cliente: "gerente_comercial",
  enviar_no_cotizar: "gerente_comercial",
};

const STAGE_BY_TASK: Record<TaskType, CaseStage> = {
  recibir_solicitud: "solicitud",
  distribuir_solicitud: "solicitud",
  revisar_solicitud: "revision",
  revisar_tdr: "revision",
  consultar_gerencia_tecnica: "revision",
  solicitar_informacion: "revision",
  solicitar_visita_tecnica: "revision",
  evaluar_gerencia_tecnica: "revision",
  cotizar: "cotizacion",
  revisar_cotizacion_lider: "cotizacion",
  revisar_cotizacion_gerencia: "cotizacion",
  enviar_cliente: "cerrado",
  enviar_no_cotizar: "cerrado",
};

/** Bucket de etapa (para agrupar/mostrar) correspondiente a una tarea. */
export function getStageForTask(task: TaskType): CaseStage {
  return STAGE_BY_TASK[task];
}

/**
 * Resultado a asignar al caso cuando entra a esta tarea, o `null` si esta
 * tarea no cambia el resultado (la mayoría no lo cambian).
 */
export function getOutcomeForTask(task: TaskType): CaseOutcome | null {
  if (task === "enviar_cliente") return "en_proceso";
  if (task === "enviar_no_cotizar") return "no_adjudicado";
  return null;
}

/** ¿Corresponde marcar el caso como express? Regla: monto < 5000 USD Y el solicitante lo pide. */
export function computeIsExpress(
  budgetUsd: number | null | undefined,
  requestedExpress: boolean,
): boolean {
  return requestedExpress && budgetUsd != null && budgetUsd < 5000;
}
