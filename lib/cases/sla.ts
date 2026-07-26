import type { CaseStage } from "@/lib/workflow/transitions";

export type SlaStatus = "expired" | "warning" | "on_track" | "completed" | "none";

export interface SlaInfo {
  status: SlaStatus;
  label: string;
  hoursLeft: number | null;
  daysLeft: number | null;
}

export function calculateSla(
  deliveryDueAt?: string | null,
  stage?: CaseStage | string,
  nowDate: Date = new Date(),
): SlaInfo {
  if (stage === "cerrado") {
    return {
      status: "completed",
      label: "Finalizado",
      hoursLeft: null,
      daysLeft: null,
    };
  }

  if (!deliveryDueAt) {
    return {
      status: "none",
      label: "Sin fecha límite",
      hoursLeft: null,
      daysLeft: null,
    };
  }

  const due = new Date(deliveryDueAt);
  const diffMs = due.getTime() - nowDate.getTime();
  const hoursLeft = Math.round(diffMs / (1000 * 60 * 60));
  const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffMs < 0) {
    const daysOverdue = Math.abs(daysLeft);
    return {
      status: "expired",
      label: daysOverdue === 0 ? "Vence hoy" : `Vencido (${daysOverdue}d)`,
      hoursLeft,
      daysLeft,
    };
  }

  if (hoursLeft <= 48) {
    return {
      status: "warning",
      label: hoursLeft <= 24 ? "Vence pronto (<24h)" : "Vence en <48h",
      hoursLeft,
      daysLeft,
    };
  }

  return {
    status: "on_track",
    label: `${daysLeft} días restantes`,
    hoursLeft,
    daysLeft,
  };
}
