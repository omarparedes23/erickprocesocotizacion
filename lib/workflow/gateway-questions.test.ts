import { describe, expect, it } from "vitest";
import { TASK_GATEWAY_QUESTION } from "./gateway-questions";

describe("TASK_GATEWAY_QUESTION", () => {
  it("expone la pregunta de negocio real de las 8 tareas 'simple-gateway'", () => {
    expect(TASK_GATEWAY_QUESTION.distribuir_solicitud).toBe(
      "¿Es una especialidad que cotizamos (eléctrica o instrumentación)?",
    );
    expect(TASK_GATEWAY_QUESTION.revisar_tdr).toBe(
      "¿El TDR tiene información suficiente para cotizar?",
    );
    expect(TASK_GATEWAY_QUESTION.consultar_gerencia_tecnica).toBe(
      "¿La consulta con Gerencia Técnica aclaró las dudas?",
    );
    expect(TASK_GATEWAY_QUESTION.solicitar_informacion).toBe(
      "¿La información solicitada al cliente es suficiente para cotizar?",
    );
    expect(TASK_GATEWAY_QUESTION.solicitar_visita_tecnica).toBe(
      "¿Con la visita técnica ya hay información suficiente para cotizar?",
    );
    expect(TASK_GATEWAY_QUESTION.evaluar_gerencia_tecnica).toBe(
      "¿Gerencia Técnica confirma que hay información suficiente para cotizar?",
    );
    expect(TASK_GATEWAY_QUESTION.revisar_cotizacion_lider).toBe(
      "¿El Líder Cotizador aprueba la cotización?",
    );
    expect(TASK_GATEWAY_QUESTION.revisar_cotizacion_gerencia).toBe(
      "¿Gerencia Comercial aprueba la cotización para enviarla al cliente?",
    );
  });

  it("las dos preguntas de aprobación de cotización son distintas entre sí (líder vs. gerencia)", () => {
    expect(TASK_GATEWAY_QUESTION.revisar_cotizacion_lider).not.toBe(
      TASK_GATEWAY_QUESTION.revisar_cotizacion_gerencia,
    );
  });

  it("expone la pregunta de revisar_solicitud y no define pregunta para tareas automáticas/terminales", () => {
    expect(TASK_GATEWAY_QUESTION.revisar_solicitud).toBe("¿Se cotiza?");
    expect(TASK_GATEWAY_QUESTION.recibir_solicitud).toBeUndefined();
    expect(TASK_GATEWAY_QUESTION.cotizar).toBeUndefined();
    expect(TASK_GATEWAY_QUESTION.enviar_cliente).toBeUndefined();
    expect(TASK_GATEWAY_QUESTION.enviar_no_cotizar).toBeUndefined();
  });
});
