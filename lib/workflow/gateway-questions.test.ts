import { describe, expect, it } from "vitest";
import { TASK_GATEWAY_QUESTION } from "./gateway-questions";

describe("TASK_GATEWAY_QUESTION", () => {
  it("expone la pregunta de negocio real de las 8 tareas 'simple-gateway'", () => {
    expect(TASK_GATEWAY_QUESTION.distribuir_solicitud).toBe(
      "¿Es una especialidad que cotizamos (eléctrica o instrumentación)?",
    );
    expect(TASK_GATEWAY_QUESTION.revisar_tdr).toBe(
      "¿Suficiente información para cotizar?",
    );
    expect(TASK_GATEWAY_QUESTION.consultar_gerencia_tecnica).toBe(
      "¿Aclara consultas?",
    );
    expect(TASK_GATEWAY_QUESTION.solicitar_informacion).toBe(
      "¿Suficiente información?",
    );
    expect(TASK_GATEWAY_QUESTION.solicitar_visita_tecnica).toBe(
      "¿Suficiente información?",
    );
    expect(TASK_GATEWAY_QUESTION.evaluar_gerencia_tecnica).toBe(
      "¿Suficiente información?",
    );
    expect(TASK_GATEWAY_QUESTION.revisar_cotizacion_lider).toBe("¿Se aprueba?");
    expect(TASK_GATEWAY_QUESTION.revisar_cotizacion_gerencia).toBe(
      "¿Se aprueba?",
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
