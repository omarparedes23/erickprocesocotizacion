import { describe, expect, it } from "vitest";
import { getTaskUiKind, type TaskUiKind } from "./task-ui";
import type { TaskType } from "./transitions";

describe("getTaskUiKind", () => {
  it("clasifica las tareas terminales (caso cerrado, sin acciones)", () => {
    expect(getTaskUiKind("enviar_cliente")).toBe("terminal");
    expect(getTaskUiKind("enviar_no_cotizar")).toBe("terminal");
  });

  it("clasifica las tareas automáticas (un solo botón 'Continuar')", () => {
    expect(getTaskUiKind("recibir_solicitud")).toBe("automatic");
  });

  it("clasifica revisar_solicitud como caso especial de dos preguntas", () => {
    expect(getTaskUiKind("revisar_solicitud")).toBe("revisar-solicitud");
  });

  it("clasifica cotizar como caso especial (monto + documento revisado)", () => {
    expect(getTaskUiKind("cotizar")).toBe("cotizar");
  });

  it("clasifica el resto como gateway simple sí/no", () => {
    const simpleGatewayTasks: TaskType[] = [
      "distribuir_solicitud",
      "revisar_tdr",
      "consultar_gerencia_tecnica",
      "solicitar_informacion",
      "solicitar_visita_tecnica",
      "evaluar_gerencia_tecnica",
      "revisar_cotizacion_lider",
      "revisar_cotizacion_gerencia",
    ];

    for (const task of simpleGatewayTasks) {
      expect(getTaskUiKind(task)).toBe("simple-gateway");
    }
  });

  it("cubre los 13 TaskType sin dejar ninguno sin categoría", () => {
    const allTasks: TaskType[] = [
      "recibir_solicitud",
      "distribuir_solicitud",
      "revisar_solicitud",
      "revisar_tdr",
      "consultar_gerencia_tecnica",
      "solicitar_informacion",
      "solicitar_visita_tecnica",
      "evaluar_gerencia_tecnica",
      "cotizar",
      "revisar_cotizacion_lider",
      "revisar_cotizacion_gerencia",
      "enviar_cliente",
      "enviar_no_cotizar",
    ];

    const validKinds: TaskUiKind[] = [
      "terminal",
      "automatic",
      "simple-gateway",
      "revisar-solicitud",
      "cotizar",
    ];

    expect(allTasks).toHaveLength(13);
    for (const task of allTasks) {
      expect(validKinds).toContain(getTaskUiKind(task));
    }
  });
});
