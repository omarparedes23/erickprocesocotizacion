import { beforeEach, describe, expect, it, vi } from "vitest";

const mockTransitionCase = vi.fn();
const mockCompleteFinalTask = vi.fn();

vi.mock("@/app/actions/cases", () => ({
  transitionCase: mockTransitionCase,
  completeFinalTask: mockCompleteFinalTask,
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

const { advanceCase } = await import("./actions");

const CASE_ID = "22222222-2222-4222-8222-222222222222";

beforeEach(() => {
  mockTransitionCase.mockReset();
  mockTransitionCase.mockResolvedValue({ id: CASE_ID });
  mockCompleteFinalTask.mockReset();
  mockCompleteFinalTask.mockResolvedValue({ id: CASE_ID });
});

function buildFormData(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    fd.set(key, value);
  }
  return fd;
}

describe("advanceCase", () => {
  it("tarea automática: fuerza answer='si' aunque no venga en el form", async () => {
    await expect(
      advanceCase(
        buildFormData({
          caseId: CASE_ID,
          currentTaskType: "recibir_solicitud",
        }),
      ),
    ).rejects.toThrow(`REDIRECT:/casos/${CASE_ID}`);

    expect(mockTransitionCase).toHaveBeenCalledWith(
      expect.objectContaining({
        caseId: CASE_ID,
        currentTaskType: "recibir_solicitud",
        answer: "si",
      }),
    );
  });

  it("gateway simple: usa el answer elegido en el form", async () => {
    await expect(
      advanceCase(
        buildFormData({
          caseId: CASE_ID,
          currentTaskType: "revisar_tdr",
          answer: "no",
        }),
      ),
    ).rejects.toThrow(`REDIRECT:/casos/${CASE_ID}`);

    expect(mockTransitionCase).toHaveBeenCalledWith(
      expect.objectContaining({
        caseId: CASE_ID,
        currentTaskType: "revisar_tdr",
        answer: "no",
      }),
    );
  });

  it("revisar_solicitud con answer='si': incluye tieneTdr como boolean (checkbox marcado)", async () => {
    await expect(
      advanceCase(
        buildFormData({
          caseId: CASE_ID,
          currentTaskType: "revisar_solicitud",
          answer: "si",
          tieneTdr: "on",
        }),
      ),
    ).rejects.toThrow(`REDIRECT:/casos/${CASE_ID}`);

    expect(mockTransitionCase).toHaveBeenCalledWith(
      expect.objectContaining({
        currentTaskType: "revisar_solicitud",
        answer: "si",
        tieneTdr: true,
      }),
    );
  });

  it("revisar_solicitud con answer='si': tieneTdr=false si el checkbox no viene marcado", async () => {
    await expect(
      advanceCase(
        buildFormData({
          caseId: CASE_ID,
          currentTaskType: "revisar_solicitud",
          answer: "si",
        }),
      ),
    ).rejects.toThrow(`REDIRECT:/casos/${CASE_ID}`);

    expect(mockTransitionCase).toHaveBeenCalledWith(
      expect.objectContaining({
        currentTaskType: "revisar_solicitud",
        answer: "si",
        tieneTdr: false,
      }),
    );
  });

  it("revisar_solicitud con answer='no': no envía tieneTdr", async () => {
    await expect(
      advanceCase(
        buildFormData({
          caseId: CASE_ID,
          currentTaskType: "revisar_solicitud",
          answer: "no",
        }),
      ),
    ).rejects.toThrow(`REDIRECT:/casos/${CASE_ID}`);

    expect(mockTransitionCase).toHaveBeenCalledWith(
      expect.objectContaining({
        currentTaskType: "revisar_solicitud",
        answer: "no",
        tieneTdr: undefined,
      }),
    );
  });

  it("cotizar: fuerza answer='si' y envía quotedAmountUsd como number", async () => {
    await expect(
      advanceCase(
        buildFormData({
          caseId: CASE_ID,
          currentTaskType: "cotizar",
          quotedAmountUsd: "12500.50",
          documentReviewed: "on",
        }),
      ),
    ).rejects.toThrow(`REDIRECT:/casos/${CASE_ID}`);

    expect(mockTransitionCase).toHaveBeenCalledWith(
      expect.objectContaining({
        caseId: CASE_ID,
        currentTaskType: "cotizar",
        answer: "si",
        quotedAmountUsd: 12500.5,
      }),
    );
  });

  it("cotizar: redirige con error si el checkbox de documento revisado no viene marcado", async () => {
    await expect(
      advanceCase(
        buildFormData({
          caseId: CASE_ID,
          currentTaskType: "cotizar",
          quotedAmountUsd: "1000",
        }),
      ),
    ).rejects.toThrow(
      `REDIRECT:/casos/${CASE_ID}?error=${encodeURIComponent("Debes confirmar que revisaste el documento de la cotización")}`,
    );

    expect(mockTransitionCase).not.toHaveBeenCalled();
  });

  it("cotizar: redirige con error si el monto no es válido (vacío o <= 0)", async () => {
    await expect(
      advanceCase(
        buildFormData({
          caseId: CASE_ID,
          currentTaskType: "cotizar",
          quotedAmountUsd: "0",
          documentReviewed: "on",
        }),
      ),
    ).rejects.toThrow(
      `REDIRECT:/casos/${CASE_ID}?error=${encodeURIComponent("Ingresa un monto de cotización válido")}`,
    );

    expect(mockTransitionCase).not.toHaveBeenCalled();
  });

  it("final-confirm (enviar_cliente): llama a completeFinalTask, no a transitionCase", async () => {
    await expect(
      advanceCase(
        buildFormData({
          caseId: CASE_ID,
          currentTaskType: "enviar_cliente",
          confirmSent: "on",
          reason: "Enviado por correo al cliente",
        }),
      ),
    ).rejects.toThrow(`REDIRECT:/casos/${CASE_ID}`);

    expect(mockCompleteFinalTask).toHaveBeenCalledWith({
      caseId: CASE_ID,
      currentTaskType: "enviar_cliente",
      reason: "Enviado por correo al cliente",
    });
    expect(mockTransitionCase).not.toHaveBeenCalled();
  });

  it("final-confirm: redirige con error si el checkbox de envío no viene marcado", async () => {
    await expect(
      advanceCase(
        buildFormData({
          caseId: CASE_ID,
          currentTaskType: "enviar_no_cotizar",
        }),
      ),
    ).rejects.toThrow(
      `REDIRECT:/casos/${CASE_ID}?error=${encodeURIComponent("Debes confirmar el envío antes de cerrar el caso")}`,
    );

    expect(mockCompleteFinalTask).not.toHaveBeenCalled();
  });

  it("final-confirm: redirige a /casos/[id]?error=... si completeFinalTask falla", async () => {
    mockCompleteFinalTask.mockRejectedValue(new Error("boom"));

    await expect(
      advanceCase(
        buildFormData({
          caseId: CASE_ID,
          currentTaskType: "enviar_cliente",
          confirmSent: "on",
        }),
      ),
    ).rejects.toThrow(`REDIRECT:/casos/${CASE_ID}?error=boom`);
  });

  it("incluye reason si viene en el form", async () => {
    await expect(
      advanceCase(
        buildFormData({
          caseId: CASE_ID,
          currentTaskType: "revisar_tdr",
          answer: "si",
          reason: "motivo de prueba",
        }),
      ),
    ).rejects.toThrow(`REDIRECT:/casos/${CASE_ID}`);

    expect(mockTransitionCase).toHaveBeenCalledWith(
      expect.objectContaining({ reason: "motivo de prueba" }),
    );
  });

  it("redirige a /casos/[id]?error=... si transitionCase falla", async () => {
    mockTransitionCase.mockRejectedValue(new Error("boom"));

    await expect(
      advanceCase(
        buildFormData({
          caseId: CASE_ID,
          currentTaskType: "revisar_tdr",
          answer: "si",
        }),
      ),
    ).rejects.toThrow(`REDIRECT:/casos/${CASE_ID}?error=boom`);
  });
});
