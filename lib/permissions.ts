import type { Role } from "./workflow/transitions";

/**
 * Roles que pueden registrar un caso nuevo (equivalente a "Recibir Solicitud
 * de Cotización" en el diagrama BPMN). El diagrama solo ubica ese paso en el
 * carril de Gerente Comercial, pero el negocio pidió sumar también a Líder
 * Cotizador. Gerente Técnico y Cotizador quedan fuera.
 */
export const CASE_CREATOR_ROLES: ReadonlySet<Role> = new Set([
  "gerente_comercial",
  "lider_cotizador",
]);

export function canCreateCase(role: Role | null | undefined): boolean {
  return role != null && CASE_CREATOR_ROLES.has(role);
}
