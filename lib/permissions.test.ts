import { describe, expect, it } from "vitest";
import { canCreateCase, CASE_CREATOR_ROLES } from "./permissions";

describe("canCreateCase", () => {
  it("permite a gerente_comercial y lider_cotizador", () => {
    expect(canCreateCase("gerente_comercial")).toBe(true);
    expect(canCreateCase("lider_cotizador")).toBe(true);
  });

  it("rechaza a gerente_tecnico y cotizador", () => {
    expect(canCreateCase("gerente_tecnico")).toBe(false);
    expect(canCreateCase("cotizador")).toBe(false);
  });

  it("rechaza cuando no hay rol (null/undefined)", () => {
    expect(canCreateCase(null)).toBe(false);
    expect(canCreateCase(undefined)).toBe(false);
  });

  it("CASE_CREATOR_ROLES contiene exactamente esos dos roles", () => {
    expect([...CASE_CREATOR_ROLES].sort()).toEqual(
      ["gerente_comercial", "lider_cotizador"].sort(),
    );
  });
});
