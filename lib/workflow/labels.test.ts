import { describe, expect, it } from "vitest";
import { ROLE_LABEL, TASK_LABEL } from "./labels";

describe("TASK_LABEL", () => {
  it("expone las 13 traducciones de TaskType usadas por dashboard y casos/[id]", () => {
    expect(TASK_LABEL).toEqual({
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
    });
  });
});

describe("ROLE_LABEL", () => {
  it("expone las 4 traducciones de Role usadas por dashboard y casos/[id]", () => {
    expect(ROLE_LABEL).toEqual({
      gerente_comercial: "Gerente comercial",
      lider_cotizador: "Líder cotizador",
      gerente_tecnico: "Gerente técnico",
      cotizador: "Cotizador",
    });
  });
});
