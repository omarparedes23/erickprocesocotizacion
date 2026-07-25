import { describe, expect, it } from "vitest";
import { filterAndSortInbox, type InboxCaseRow } from "./inbox";

function makeCase(overrides: Partial<InboxCaseRow>): InboxCaseRow {
  return {
    id: "id",
    code: "1",
    title: "Título",
    budget_usd: 1000,
    is_express: false,
    current_task_type: "cotizar",
    created_at: "2026-01-01T00:00:00.000Z",
    tume_clients: null,
    ...overrides,
  };
}

describe("filterAndSortInbox", () => {
  it("filtra solo los casos cuya tarea actual mapea al rol dado", () => {
    const casos = [
      makeCase({ id: "1", current_task_type: "cotizar" }), // cotizador
      makeCase({ id: "2", current_task_type: "consultar_gerencia_tecnica" }), // gerente_tecnico
      makeCase({ id: "3", current_task_type: "revisar_solicitud" }), // lider_cotizador
    ];

    expect(filterAndSortInbox(casos, "cotizador").map((c) => c.id)).toEqual([
      "1",
    ]);
  });

  it("un usuario gerente_tecnico ve consultar_gerencia_tecnica y evaluar_gerencia_tecnica", () => {
    const casos = [
      makeCase({ id: "1", current_task_type: "consultar_gerencia_tecnica" }),
      makeCase({ id: "2", current_task_type: "evaluar_gerencia_tecnica" }),
      makeCase({ id: "3", current_task_type: "cotizar" }),
    ];

    expect(
      filterAndSortInbox(casos, "gerente_tecnico").map((c) => c.id).sort(),
    ).toEqual(["1", "2"]);
  });

  it("ordena los casos Express primero, aunque hayan sido creados después", () => {
    const casos = [
      makeCase({
        id: "old-normal",
        is_express: false,
        created_at: "2026-01-01T00:00:00.000Z",
      }),
      makeCase({
        id: "new-express",
        is_express: true,
        created_at: "2026-01-02T00:00:00.000Z",
      }),
    ];

    expect(filterAndSortInbox(casos, "cotizador").map((c) => c.id)).toEqual([
      "new-express",
      "old-normal",
    ]);
  });

  it("dentro del mismo grupo de express, ordena por created_at ascendente (más viejo primero)", () => {
    const casos = [
      makeCase({
        id: "express-newer",
        is_express: true,
        created_at: "2026-01-03T00:00:00.000Z",
      }),
      makeCase({
        id: "express-older",
        is_express: true,
        created_at: "2026-01-01T00:00:00.000Z",
      }),
      makeCase({
        id: "normal-older",
        is_express: false,
        created_at: "2026-01-01T00:00:00.000Z",
      }),
      makeCase({
        id: "normal-newer",
        is_express: false,
        created_at: "2026-01-02T00:00:00.000Z",
      }),
    ];

    expect(filterAndSortInbox(casos, "cotizador").map((c) => c.id)).toEqual([
      "express-older",
      "express-newer",
      "normal-older",
      "normal-newer",
    ]);
  });

  it("devuelve arreglo vacío cuando ningún caso corresponde al rol", () => {
    const casos = [makeCase({ id: "1", current_task_type: "cotizar" })];

    expect(filterAndSortInbox(casos, "gerente_tecnico")).toEqual([]);
  });
});
