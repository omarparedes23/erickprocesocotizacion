import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetUser = vi.fn();
const mockRpc = vi.fn();
const mockFrom = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
    rpc: mockRpc,
    from: mockFrom,
  })),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

// createCase() (app/actions/cases.ts) llama a revalidatePath, que requiere un
// request-scope de Next.js inexistente en Vitest (ver app/actions/cases.test.ts).
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const { generateNextCaseCode, findOrCreateClient } = await import(
  "@/lib/cases/registration"
);
const { registerCase } = await import("./actions");
const { createClient } = await import("@/lib/supabase/server");

const FAKE_USER = { id: "11111111-1111-1111-1111-111111111111" };

beforeEach(() => {
  mockGetUser.mockReset();
  mockRpc.mockReset();
  mockFrom.mockReset();
  mockGetUser.mockResolvedValue({ data: { user: FAKE_USER } });
  mockRpc.mockResolvedValue({ data: { id: "case-1" }, error: null });
});

describe("generateNextCaseCode", () => {
  it("genera el siguiente código a partir del conteo de casos", async () => {
    const select = vi.fn(() => Promise.resolve({ count: 1008, error: null }));
    mockFrom.mockReturnValue({ select });

    const supabase = await createClient();
    await expect(generateNextCaseCode(supabase)).resolves.toBe("1009");
    expect(mockFrom).toHaveBeenCalledWith("tume_cases");
    expect(select).toHaveBeenCalledWith("*", { count: "exact", head: true });
  });

  it("usa 1 cuando no hay casos existentes (count=0)", async () => {
    mockFrom.mockReturnValue({
      select: vi.fn(() => Promise.resolve({ count: 0, error: null })),
    });
    const supabase = await createClient();
    await expect(generateNextCaseCode(supabase)).resolves.toBe("1");
  });

  it("propaga el error de Supabase si el conteo falla", async () => {
    mockFrom.mockReturnValue({
      select: vi.fn(() =>
        Promise.resolve({ count: null, error: { message: "boom" } }),
      ),
    });
    const supabase = await createClient();
    await expect(generateNextCaseCode(supabase)).rejects.toThrow(
      "No se pudo generar el código del caso: boom",
    );
  });
});

describe("findOrCreateClient", () => {
  it("reutiliza un cliente existente (case-insensitive)", async () => {
    const maybeSingle = vi.fn(() =>
      Promise.resolve({ data: { id: "client-existing" }, error: null }),
    );
    const ilike = vi.fn(() => ({ maybeSingle }));
    const select = vi.fn(() => ({ ilike }));
    const insert = vi.fn();
    mockFrom.mockReturnValue({ select, insert });

    const supabase = await createClient();
    await expect(findOrCreateClient(supabase, "acme corp")).resolves.toBe(
      "client-existing",
    );

    expect(ilike).toHaveBeenCalledWith("name", "acme corp");
    expect(insert).not.toHaveBeenCalled();
  });

  it("crea un cliente nuevo si no existe", async () => {
    const maybeSingle = vi.fn(() =>
      Promise.resolve({ data: null, error: null }),
    );
    const ilike = vi.fn(() => ({ maybeSingle }));
    const selectFind = vi.fn(() => ({ ilike }));

    const single = vi.fn(() =>
      Promise.resolve({ data: { id: "client-new" }, error: null }),
    );
    const selectInsert = vi.fn(() => ({ single }));
    const insert = vi.fn(() => ({ select: selectInsert }));

    mockFrom.mockReturnValue({ select: selectFind, insert });

    const supabase = await createClient();
    await expect(
      findOrCreateClient(supabase, "Nuevo Cliente SAC"),
    ).resolves.toBe("client-new");

    expect(insert).toHaveBeenCalledWith({ name: "Nuevo Cliente SAC" });
  });

  it("propaga el error si falla la búsqueda", async () => {
    const maybeSingle = vi.fn(() =>
      Promise.resolve({ data: null, error: { message: "find-boom" } }),
    );
    const ilike = vi.fn(() => ({ maybeSingle }));
    const select = vi.fn(() => ({ ilike }));
    mockFrom.mockReturnValue({ select, insert: vi.fn() });

    const supabase = await createClient();
    await expect(findOrCreateClient(supabase, "x")).rejects.toThrow(
      "No se pudo buscar el cliente: find-boom",
    );
  });

  it("propaga el error si falla la creación", async () => {
    const maybeSingle = vi.fn(() =>
      Promise.resolve({ data: null, error: null }),
    );
    const ilike = vi.fn(() => ({ maybeSingle }));
    const selectFind = vi.fn(() => ({ ilike }));

    const single = vi.fn(() =>
      Promise.resolve({ data: null, error: { message: "insert-boom" } }),
    );
    const selectInsert = vi.fn(() => ({ single }));
    const insert = vi.fn(() => ({ select: selectInsert }));

    mockFrom.mockReturnValue({ select: selectFind, insert });

    const supabase = await createClient();
    await expect(findOrCreateClient(supabase, "x")).rejects.toThrow(
      "No se pudo crear el cliente: insert-boom",
    );
  });
});

describe("registerCase", () => {
  function buildFormData(
    overrides: Partial<Record<string, string>> = {},
  ): FormData {
    const fd = new FormData();
    fd.set("type", overrides.type ?? "servicio");
    fd.set("title", overrides.title ?? "Servicio de instrumentación");
    fd.set("clientName", overrides.clientName ?? "Acme Corp");
    fd.set("budgetUsd", overrides.budgetUsd ?? "4000");
    if (overrides.requestedExpress !== "off") {
      fd.set("requestedExpress", "on");
    }
    fd.set("deliveryDueAt", overrides.deliveryDueAt ?? "2026-08-01");
    return fd;
  }

  function mockFromForNewClient(clientId: string) {
    mockFrom.mockImplementation((table: string) => {
      if (table === "tume_cases") {
        return {
          select: vi.fn(() => Promise.resolve({ count: 5, error: null })),
        };
      }
      if (table === "tume_clients") {
        const maybeSingle = vi.fn(() =>
          Promise.resolve({ data: null, error: null }),
        );
        const ilike = vi.fn(() => ({ maybeSingle }));
        const selectFind = vi.fn(() => ({ ilike }));
        const single = vi.fn(() =>
          Promise.resolve({ data: { id: clientId }, error: null }),
        );
        const selectInsert = vi.fn(() => ({ single }));
        const insert = vi.fn(() => ({ select: selectInsert }));
        return { select: selectFind, insert };
      }
      throw new Error(`tabla inesperada: ${table}`);
    });
  }

  const FAKE_CLIENT_ID = "33333333-3333-4333-8333-333333333333";

  it("crea el caso y redirige a /casos/[id] cuando todo sale bien", async () => {
    mockFromForNewClient(FAKE_CLIENT_ID);

    await expect(registerCase(buildFormData())).rejects.toThrow(
      "REDIRECT:/casos/case-1",
    );

    expect(mockRpc).toHaveBeenCalledWith(
      "tume_create_case",
      expect.objectContaining({
        p_code: "6",
        p_client_id: FAKE_CLIENT_ID,
        p_title: "Servicio de instrumentación",
        p_type: "servicio",
        p_budget_usd: 4000,
        p_actor_id: FAKE_USER.id,
      }),
    );
  });

  it("redirige a /casos/nuevo?error=... si createCase falla", async () => {
    mockFromForNewClient(FAKE_CLIENT_ID);
    mockRpc.mockResolvedValue({ data: null, error: { message: "rpc-boom" } });

    await expect(registerCase(buildFormData())).rejects.toThrow(
      /REDIRECT:\/casos\/nuevo\?error=/,
    );
  });

  it("deja clientId en null si no se ingresó nombre de cliente", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "tume_cases") {
        return {
          select: vi.fn(() => Promise.resolve({ count: 0, error: null })),
        };
      }
      throw new Error(`tabla inesperada: ${table}`);
    });

    await expect(
      registerCase(buildFormData({ clientName: "" })),
    ).rejects.toThrow("REDIRECT:/casos/case-1");

    expect(mockRpc).toHaveBeenCalledWith(
      "tume_create_case",
      expect.objectContaining({ p_client_id: null }),
    );
  });
});
