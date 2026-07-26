"use client";

import { Clock, AlertTriangle, ShieldAlert, CheckCircle, Minus } from "lucide-react";
import { calculateSla } from "@/lib/cases/sla";
import type { CaseStage } from "@/lib/workflow/transitions";

interface SlaBadgeProps {
  deliveryDueAt?: string | null;
  stage?: CaseStage | string;
  className?: string;
}

export function SlaBadge({ deliveryDueAt, stage, className = "" }: SlaBadgeProps) {
  const sla = calculateSla(deliveryDueAt, stage);

  if (sla.status === "none") {
    return (
      <span className={`inline-flex items-center gap-1 text-[10px] font-medium text-slate-400 ${className}`}>
        <Minus className="size-3" />
        Sin SLA
      </span>
    );
  }

  if (sla.status === "completed") {
    return (
      <span className={`inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 ${className}`}>
        <CheckCircle className="size-3 text-slate-500" />
        Finalizado
      </span>
    );
  }

  if (sla.status === "expired") {
    return (
      <span className={`inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-[10px] font-bold text-rose-800 animate-pulse ${className}`}>
        <ShieldAlert className="size-3 text-rose-600" />
        {sla.label}
      </span>
    );
  }

  if (sla.status === "warning") {
    return (
      <span className={`inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-900 ${className}`}>
        <AlertTriangle className="size-3 text-amber-700" />
        {sla.label}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200/60 ${className}`}>
      <Clock className="size-3 text-emerald-600" />
      {sla.label}
    </span>
  );
}
