"use client";

import Link from "next/link";
import { Sparkles, ArrowRight, User } from "lucide-react";
import { SlaBadge } from "./sla-badge";
import { TASK_ROLE, type CaseStage, type TaskType } from "@/lib/workflow/transitions";
import { TASK_LABEL, ROLE_LABEL } from "@/lib/workflow/labels";

export interface KanbanCaseItem {
  id: string;
  code: string;
  title: string;
  budget_usd: number | null;
  is_express: boolean;
  stage: CaseStage;
  outcome: string | null;
  current_task_type: TaskType;
  created_at: string;
  delivery_due_at?: string | null;
  tume_clients: { name: string } | null;
}

interface KanbanBoardProps {
  cases: KanbanCaseItem[];
}

const KANBAN_COLUMNS: Array<{
  id: CaseStage;
  title: string;
  color: string;
  badgeBg: string;
}> = [
  {
    id: "solicitud",
    title: "1. Solicitud",
    color: "border-t-blue-500",
    badgeBg: "bg-blue-100 text-blue-800",
  },
  {
    id: "revision",
    title: "2. Revisión",
    color: "border-t-indigo-500",
    badgeBg: "bg-indigo-100 text-indigo-800",
  },
  {
    id: "cotizacion",
    title: "3. Cotización",
    color: "border-t-violet-500",
    badgeBg: "bg-violet-100 text-violet-800",
  },
  {
    id: "cerrado",
    title: "4. Cierre",
    color: "border-t-emerald-500",
    badgeBg: "bg-emerald-100 text-emerald-800",
  },
];

export function KanbanBoard({ cases }: KanbanBoardProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      {KANBAN_COLUMNS.map((col) => {
        const columnCases = cases.filter((c) => c.stage === col.id);
        const columnTotalUsd = columnCases.reduce(
          (acc, c) => acc + (c.budget_usd ?? 0),
          0,
        );

        return (
          <div
            key={col.id}
            className={`flex flex-col rounded-2xl border border-slate-200 bg-slate-50/60 p-4 border-t-4 ${col.color} min-h-[500px]`}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">
                  {col.title}
                </h3>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-extrabold ${col.badgeBg}`}
                >
                  {columnCases.length}
                </span>
              </div>
              <span className="text-[11px] font-semibold text-slate-500">
                ${columnTotalUsd.toLocaleString()}
              </span>
            </div>

            {/* Cards List */}
            <div className="space-y-3 flex-1 overflow-y-auto">
              {columnCases.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center text-xs text-slate-400">
                  Sin casos en esta etapa
                </div>
              ) : (
                columnCases.map((caso) => {
                  const role = TASK_ROLE[caso.current_task_type];

                  return (
                    <Link
                      key={caso.id}
                      href={`/casos/${caso.id}`}
                      className="group block rounded-xl border border-slate-200 bg-white p-4 shadow-2xs transition-all hover:border-slate-300 hover:shadow-xs"
                    >
                      <div className="space-y-2">
                        {/* Header badges */}
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-xs text-slate-900 group-hover:text-blue-600 transition-colors">
                            Caso {caso.code}
                          </span>
                          <div className="flex items-center gap-1">
                            {caso.is_express && (
                              <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-800">
                                <Sparkles className="size-2.5" />
                                Express
                              </span>
                            )}
                            <SlaBadge
                              deliveryDueAt={caso.delivery_due_at}
                              stage={caso.stage}
                            />
                          </div>
                        </div>

                        {/* Title */}
                        <h4 className="text-xs font-semibold text-slate-800 line-clamp-2 leading-snug">
                          {caso.title}
                        </h4>

                        {/* Client */}
                        <p className="text-[11px] font-medium text-slate-500 truncate">
                          Cliente:{" "}
                          <span className="text-slate-700 font-semibold">
                            {caso.tume_clients?.name ?? "—"}
                          </span>
                        </p>

                        {/* Task & Role Footer */}
                        <div className="border-t border-slate-100 pt-2 flex items-center justify-between gap-2 text-[10px]">
                          <span className="font-semibold text-blue-700 truncate max-w-[130px]">
                            {TASK_LABEL[caso.current_task_type] ??
                              caso.current_task_type}
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-1.5 py-0.5 text-slate-700 font-medium shrink-0">
                            <User className="size-2.5 text-slate-400" />
                            {ROLE_LABEL[role] ?? role}
                          </span>
                        </div>

                        {/* Budget */}
                        <div className="flex items-center justify-between text-xs pt-1">
                          <span className="text-slate-400 text-[10px]">Presupuesto</span>
                          <span className="font-bold text-slate-900">
                            {caso.budget_usd != null
                              ? `$${caso.budget_usd.toLocaleString()}`
                              : "—"}
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
