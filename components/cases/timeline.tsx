"use client";

import { History, ArrowRight, UserCircle2, MessageSquare } from "lucide-react";
import { TASK_LABEL } from "@/lib/workflow/labels";
import type { TaskType } from "@/lib/workflow/transitions";

export interface TransitionItem {
  id: string;
  from_task_type: string | null;
  to_task_type: string | null;
  reason: string | null;
  created_at: string;
  tume_profiles: { full_name: string } | null;
}

interface TimelineProps {
  transitions: TransitionItem[];
}

export function TransitionTimeline({ transitions }: TimelineProps) {
  if (!transitions || transitions.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 mb-2 flex items-center gap-2">
          <History className="size-4 text-slate-500" />
          Historial de Transiciones
        </h3>
        <p className="text-sm text-slate-500">Sin transiciones registradas aún.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <History className="size-4 text-slate-700" />
          Historial de Transiciones ({transitions.length})
        </h3>
      </div>

      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
        {transitions.map((item) => {
          const fromLabel = item.from_task_type
            ? TASK_LABEL[item.from_task_type as TaskType] ?? item.from_task_type
            : "Inicio de Caso";
          const toLabel = item.to_task_type
            ? TASK_LABEL[item.to_task_type as TaskType] ?? item.to_task_type
            : "—";

          const formattedDate = new Date(item.created_at).toLocaleString("es-PE", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });

          return (
            <div key={item.id} className="relative group">
              {/* Dot */}
              <div className="absolute -left-6 top-1 flex size-5 items-center justify-center rounded-full bg-white ring-4 ring-white">
                <div className="size-2.5 rounded-full bg-slate-900 group-last:bg-blue-600 group-last:ring-2 group-last:ring-blue-300" />
              </div>

              {/* Card Content */}
              <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 space-y-1.5 transition-colors hover:bg-slate-50">
                <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-900">
                  <span className="text-slate-500 font-normal">{fromLabel}</span>
                  <ArrowRight className="size-3.5 text-slate-400" />
                  <span className="text-blue-700 font-bold">{toLabel}</span>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1 font-medium text-slate-700">
                    <UserCircle2 className="size-3.5 text-slate-400" />
                    {item.tume_profiles?.full_name ?? "Usuario"}
                  </span>
                  <span>•</span>
                  <span>{formattedDate}</span>
                </div>

                {item.reason && (
                  <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-white p-2 text-xs text-slate-600 border border-slate-200/80">
                    <MessageSquare className="size-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span className="italic">&quot;{item.reason}&quot;</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
