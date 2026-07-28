import { describe, expect, it } from "vitest";
import {
  CASE_STATUS_FILTER_OPTIONS,
  classifyCaseStatus,
  matchesStatusFilter,
  parseCaseStatusFilter,
} from "./status";

describe("classifyCaseStatus", () => {
  it("en_proceso para cualquier tarea que no sea final", () => {
    expect(
      classifyCaseStatus({ current_task_type: "cotizar", enviado_at: null }),
    ).toBe("en_proceso");
    expect(
      classifyCaseStatus({
        current_task_type: "revisar_cotizacion_gerencia",
        enviado_at: null,
      }),
    ).toBe("en_proceso");
  });

  it("pendiente_envio cuando llegó a una tarea final pero enviado_at es null", () => {
    expect(
      classifyCaseStatus({
        current_task_type: "enviar_cliente",
        enviado_at: null,
      }),
    ).toBe("pendiente_envio");
    expect(
      classifyCaseStatus({
        current_task_type: "enviar_no_cotizar",
        enviado_at: null,
      }),
    ).toBe("pendiente_envio");
  });

  it("enviado_cliente / no_cotizado cuando enviado_at ya está seteado", () => {
    expect(
      classifyCaseStatus({
        current_task_type: "enviar_cliente",
        enviado_at: "2026-07-28T16:00:00Z",
      }),
    ).toBe("enviado_cliente");
    expect(
      classifyCaseStatus({
        current_task_type: "enviar_no_cotizar",
        enviado_at: "2026-07-28T16:00:00Z",
      }),
    ).toBe("no_cotizado");
  });
});

describe("matchesStatusFilter", () => {
  const enviado = { current_task_type: "enviar_cliente" as const, enviado_at: "2026-07-28T16:00:00Z" };
  const pendiente = { current_task_type: "enviar_cliente" as const, enviado_at: null };

  it("'todos' siempre coincide", () => {
    expect(matchesStatusFilter(enviado, "todos")).toBe(true);
    expect(matchesStatusFilter(pendiente, "todos")).toBe(true);
  });

  it("filtra por el estado clasificado exacto", () => {
    expect(matchesStatusFilter(enviado, "enviado_cliente")).toBe(true);
    expect(matchesStatusFilter(enviado, "pendiente_envio")).toBe(false);
    expect(matchesStatusFilter(pendiente, "pendiente_envio")).toBe(true);
    expect(matchesStatusFilter(pendiente, "enviado_cliente")).toBe(false);
  });
});

describe("parseCaseStatusFilter", () => {
  it("acepta cualquier valor listado en CASE_STATUS_FILTER_OPTIONS", () => {
    for (const option of CASE_STATUS_FILTER_OPTIONS) {
      expect(parseCaseStatusFilter(option.value)).toBe(option.value);
    }
  });

  it("cae a 'todos' con undefined o un valor desconocido", () => {
    expect(parseCaseStatusFilter(undefined)).toBe("todos");
    expect(parseCaseStatusFilter("basura")).toBe("todos");
  });
});
