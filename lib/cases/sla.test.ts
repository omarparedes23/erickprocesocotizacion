import { describe, expect, it } from "vitest";
import { calculateSla } from "./sla";

describe("calculateSla", () => {
  const mockNow = new Date("2026-07-27T12:00:00Z");

  it("retorna 'completed' si el caso está cerrado", () => {
    const res = calculateSla("2026-07-20T00:00:00Z", "cerrado", mockNow);
    expect(res.status).toBe("completed");
    expect(res.label).toBe("Finalizado");
  });

  it("retorna 'none' si no se especificó fecha límite", () => {
    const res = calculateSla(null, "revision", mockNow);
    expect(res.status).toBe("none");
    expect(res.label).toBe("Sin fecha límite");
  });

  it("retorna 'expired' si la fecha límite es en el pasado", () => {
    const res = calculateSla("2026-07-25T12:00:00Z", "revision", mockNow);
    expect(res.status).toBe("expired");
    expect(res.label).toContain("Vencido");
  });

  it("retorna 'warning' si faltan menos de 48 horas", () => {
    const res = calculateSla("2026-07-28T12:00:00Z", "cotizacion", mockNow);
    expect(res.status).toBe("warning");
  });

  it("retorna 'on_track' si faltan más de 48 horas", () => {
    const res = calculateSla("2026-08-05T12:00:00Z", "solicitud", mockNow);
    expect(res.status).toBe("on_track");
    expect(res.daysLeft).toBe(9);
  });
});
