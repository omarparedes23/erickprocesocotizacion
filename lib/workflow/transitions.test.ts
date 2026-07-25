import { describe, expect, it } from "vitest";
import {
  computeIsExpress,
  getNextTask,
  getOutcomeForTask,
  getStageForTask,
  TASK_ROLE,
  type TaskType,
} from "./transitions";

describe("getNextTask", () => {
  it("recibir_solicitud siempre avanza a distribuir_solicitud (automático)", () => {
    expect(getNextTask("recibir_solicitud", "si", {})).toBe(
      "distribuir_solicitud",
    );
    expect(getNextTask("recibir_solicitud", "no", {})).toBe(
      "distribuir_solicitud",
    );
  });

  describe("distribuir_solicitud — gateway especialidad", () => {
    it("especialidad eléctrica/instrumentación -> revisar_solicitud", () => {
      expect(getNextTask("distribuir_solicitud", "si", {})).toBe(
        "revisar_solicitud",
      );
    });

    it("sin especialidad soportada -> enviar_no_cotizar", () => {
      expect(getNextTask("distribuir_solicitud", "no", {})).toBe(
        "enviar_no_cotizar",
      );
    });
  });

  describe("revisar_solicitud — gateways ¿se cotiza? + ¿tiene TDR?", () => {
    it("no se cotiza -> enviar_no_cotizar", () => {
      expect(getNextTask("revisar_solicitud", "no", {})).toBe(
        "enviar_no_cotizar",
      );
    });

    it("se cotiza y tiene TDR -> revisar_tdr", () => {
      expect(
        getNextTask("revisar_solicitud", "si", { tieneTdr: true }),
      ).toBe("revisar_tdr");
    });

    it("se cotiza pero no tiene TDR -> enviar_no_cotizar", () => {
      expect(
        getNextTask("revisar_solicitud", "si", { tieneTdr: false }),
      ).toBe("enviar_no_cotizar");
    });

    it("se cotiza sin especificar tieneTdr lanza error (falta info obligatoria)", () => {
      expect(() => getNextTask("revisar_solicitud", "si", {})).toThrow();
    });
  });

  describe("cadena de suficiencia de información (4 checkpoints, misma pregunta)", () => {
    const checkpoints: Array<{ task: TaskType; onNo: TaskType }> = [
      { task: "revisar_tdr", onNo: "consultar_gerencia_tecnica" },
      { task: "solicitar_informacion", onNo: "solicitar_visita_tecnica" },
      { task: "solicitar_visita_tecnica", onNo: "evaluar_gerencia_tecnica" },
    ];

    it.each(checkpoints)(
      "$task: información suficiente (si) -> cotizar",
      ({ task }) => {
        expect(getNextTask(task, "si", {})).toBe("cotizar");
      },
    );

    it.each(checkpoints)(
      "$task: información insuficiente (no) -> $onNo",
      ({ task, onNo }) => {
        expect(getNextTask(task, "no", {})).toBe(onNo);
      },
    );

    it("consultar_gerencia_tecnica: aclara consultas (si) -> cotizar", () => {
      expect(getNextTask("consultar_gerencia_tecnica", "si", {})).toBe(
        "cotizar",
      );
    });

    it("consultar_gerencia_tecnica: no aclara (no) -> solicitar_informacion", () => {
      expect(getNextTask("consultar_gerencia_tecnica", "no", {})).toBe(
        "solicitar_informacion",
      );
    });

    it("evaluar_gerencia_tecnica: información suficiente (si) -> cotizar", () => {
      expect(getNextTask("evaluar_gerencia_tecnica", "si", {})).toBe(
        "cotizar",
      );
    });

    it("evaluar_gerencia_tecnica: cadena agotada (no) -> enviar_no_cotizar", () => {
      expect(getNextTask("evaluar_gerencia_tecnica", "no", {})).toBe(
        "enviar_no_cotizar",
      );
    });
  });

  describe("cotizar — tarea atómica, sin gateway propio", () => {
    it("cotizar siempre avanza a revisar_cotizacion_lider", () => {
      expect(getNextTask("cotizar", "si", {})).toBe(
        "revisar_cotizacion_lider",
      );
      expect(getNextTask("cotizar", "no", {})).toBe(
        "revisar_cotizacion_lider",
      );
    });
  });

  describe("doble aprobación — sin límite de reintentos en v1", () => {
    it("revisar_cotizacion_lider aprueba (si) -> revisar_cotizacion_gerencia", () => {
      expect(getNextTask("revisar_cotizacion_lider", "si", {})).toBe(
        "revisar_cotizacion_gerencia",
      );
    });

    it("revisar_cotizacion_lider rechaza (no) -> vuelve a cotizar", () => {
      expect(getNextTask("revisar_cotizacion_lider", "no", {})).toBe(
        "cotizar",
      );
    });

    it("revisar_cotizacion_gerencia aprueba (si) -> enviar_cliente", () => {
      expect(getNextTask("revisar_cotizacion_gerencia", "si", {})).toBe(
        "enviar_cliente",
      );
    });

    it("revisar_cotizacion_gerencia rechaza (no) -> vuelve a cotizar", () => {
      expect(getNextTask("revisar_cotizacion_gerencia", "no", {})).toBe(
        "cotizar",
      );
    });

    it("el rechazo se puede repetir indefinidamente sin límite (v1)", () => {
      let current: TaskType = "cotizar";
      for (let i = 0; i < 10; i++) {
        current = getNextTask(current, "si", {});
        current = getNextTask(current, "no", {});
        expect(current).toBe("cotizar");
      }
    });
  });

  describe("TASK_ROLE — cada tarea tiene un único rol responsable", () => {
    it("asigna el rol correcto según el carril del BPMN", () => {
      expect(TASK_ROLE.recibir_solicitud).toBe("gerente_comercial");
      expect(TASK_ROLE.revisar_solicitud).toBe("lider_cotizador");
      expect(TASK_ROLE.consultar_gerencia_tecnica).toBe("gerente_tecnico");
      expect(TASK_ROLE.cotizar).toBe("cotizador");
      expect(TASK_ROLE.revisar_cotizacion_gerencia).toBe("gerente_comercial");
    });
  });

  describe("getStageForTask", () => {
    it("agrupa las tareas en las 4 etapas del proceso", () => {
      expect(getStageForTask("recibir_solicitud")).toBe("solicitud");
      expect(getStageForTask("revisar_tdr")).toBe("revision");
      expect(getStageForTask("cotizar")).toBe("cotizacion");
      expect(getStageForTask("enviar_cliente")).toBe("cerrado");
      expect(getStageForTask("enviar_no_cotizar")).toBe("cerrado");
    });
  });

  describe("getOutcomeForTask", () => {
    it("enviar_cliente -> en_proceso (queda a la espera de decisión del cliente)", () => {
      expect(getOutcomeForTask("enviar_cliente")).toBe("en_proceso");
    });

    it("enviar_no_cotizar -> no_adjudicado", () => {
      expect(getOutcomeForTask("enviar_no_cotizar")).toBe("no_adjudicado");
    });

    it("tareas intermedias no cambian el resultado (null)", () => {
      expect(getOutcomeForTask("cotizar")).toBeNull();
      expect(getOutcomeForTask("revisar_tdr")).toBeNull();
    });
  });

  describe("computeIsExpress", () => {
    it("true solo si se solicita Y el monto es menor a 5000", () => {
      expect(computeIsExpress(4999, true)).toBe(true);
    });

    it("false si el monto es igual o mayor a 5000, aunque se solicite", () => {
      expect(computeIsExpress(5000, true)).toBe(false);
    });

    it("false si no se solicita, aunque el monto sea bajo", () => {
      expect(computeIsExpress(1000, false)).toBe(false);
    });

    it("false si no hay monto definido", () => {
      expect(computeIsExpress(null, true)).toBe(false);
      expect(computeIsExpress(undefined, true)).toBe(false);
    });
  });

  describe("estados terminales — no admiten más transiciones", () => {
    it("enviar_cliente lanza error al intentar transicionar", () => {
      expect(() => getNextTask("enviar_cliente", "si", {})).toThrow();
    });

    it("enviar_no_cotizar lanza error al intentar transicionar", () => {
      expect(() => getNextTask("enviar_no_cotizar", "si", {})).toThrow();
    });
  });
});
