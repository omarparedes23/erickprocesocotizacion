import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetUser = vi.fn();
const mockRpc = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
    rpc: mockRpc,
  })),
}));

// revalidatePath requiere un request-scope de Next.js (AsyncLocalStorage) que
// no existe en Vitest; fuera de ese contexto tira "Invariant: static
// generation store missing". Se mockea para poder probar createCase/
// transitionCase de forma aislada (ver app/actions/cases.ts).
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const { createCase, transitionCase } = await import("./cases");

const FAKE_USER = { id: "11111111-1111-1111-1111-111111111111" };

beforeEach(() => {
  mockGetUser.mockReset();
  mockRpc.mockReset();
  mockGetUser.mockResolvedValue({ data: { user: FAKE_USER } });
  mockRpc.mockResolvedValue({ data: { id: "case-1" }, error: null });
});

describe("createCase", () => {
  const validInput = {
    code: "1009",
    clientId: null,
    title: "Servicio de instrumentación",
    description: "desc",
    type: "servicio" as const,
    budgetUsd: 4000,
    requestedExpress: true,
    deliveryDueAt: null,
  };

  it("rechaza si no hay usuario autenticado", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    await expect(createCase(validInput)).rejects.toThrow("No autenticado");
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it("rechaza input inválido (zod) antes de llamar a Supabase", async () => {
    await expect(
      createCase({ ...validInput, title: "" }),
    ).rejects.toThrow();
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it("calcula is_express=true cuando se pide Y el monto es < 5000", async () => {
    await createCase(validInput);
    expect(mockRpc).toHaveBeenCalledWith(
      "tume_create_case",
      expect.objectContaining({ p_is_express: true, p_actor_id: FAKE_USER.id }),
    );
  });

  it("is_express=false cuando el monto es >= 5000, aunque se pida", async () => {
    await createCase({ ...validInput, budgetUsd: 9000 });
    expect(mockRpc).toHaveBeenCalledWith(
      "tume_create_case",
      expect.objectContaining({ p_is_express: false }),
    );
  });

  it("propaga el error de Supabase si el RPC falla", async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: "boom" } });
    await expect(createCase(validInput)).rejects.toThrow(
      "No se pudo crear el caso: boom",
    );
  });
});

describe("transitionCase", () => {
  const baseInput = {
    caseId: "22222222-2222-4222-8222-222222222222",
    currentTaskType: "revisar_cotizacion_lider",
    answer: "si" as const,
  };

  it("rechaza si no hay usuario autenticado", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    await expect(transitionCase(baseInput)).rejects.toThrow("No autenticado");
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it("calcula la siguiente tarea/rol/etapa vía getNextTask y llama al RPC", async () => {
    await transitionCase(baseInput);
    expect(mockRpc).toHaveBeenCalledWith(
      "tume_apply_transition",
      expect.objectContaining({
        p_case_id: baseInput.caseId,
        p_next_task_type: "revisar_cotizacion_gerencia",
        p_next_role: "gerente_comercial",
        p_next_stage: "cotizacion",
        p_next_outcome: null,
        p_actor_id: FAKE_USER.id,
      }),
    );
  });

  it("revisar_solicitud con answer=si requiere tieneTdr (delegado a getNextTask)", async () => {
    await expect(
      transitionCase({
        caseId: baseInput.caseId,
        currentTaskType: "revisar_solicitud",
        answer: "si",
      }),
    ).rejects.toThrow();
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it("propaga el error de Supabase si el RPC falla", async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: "boom" } });
    await expect(transitionCase(baseInput)).rejects.toThrow(
      "No se pudo transicionar el caso: boom",
    );
  });
});
