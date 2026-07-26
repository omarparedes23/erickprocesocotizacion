"use client";

import { Check, Clock, AlertCircle, Circle, User } from "lucide-react";
import type { TaskType, CaseStage, Role } from "@/lib/workflow/transitions";
import { TASK_LABEL, ROLE_LABEL } from "@/lib/workflow/labels";

interface WorkflowStepperProps {
  currentStage: CaseStage;
  currentTaskType: TaskType;
  currentRole: Role;
  outcome?: string | null;
}

const STAGES: Array<{
  id: CaseStage;
  label: string;
  description: string;
}> = [
  {
    id: "solicitud",
    label: "1. Solicitud",
    description: "Recepción y evaluación de especialidad",
  },
  {
    id: "revision",
    label: "2. Revisión",
    description: "TDR y consultas técnicas",
  },
  {
    id: "cotizacion",
    label: "3. Cotización",
    description: "Elaboración y doble aprobación",
  },
  {
    id: "cerrado",
    label: "4. Cierre",
    description: "Envío a cliente o declinación",
  },
];

const STAGE_INDEX: Record<CaseStage, number> = {
  solicitud: 0,
  revision: 1,
  cotizacion: 2,
  cerrado: 3,
};

export function WorkflowStepper({
  currentStage,
  currentTaskType,
  currentRole,
  outcome,
}: WorkflowStepperProps) {
  const currentIndex = STAGE_INDEX[currentStage] ?? 0;
  const isTerminalNoCotizar = currentTaskType === "enviar_no_cotizar";
  const isTerminalCliente = currentTaskType === "enviar_cliente";

  return (
    <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            Pipeline del Proceso BPMN
          </h3>
          <p className="text-xs text-slate-500">
            Estado del flujo de trabajo en tiempo real
          </p>
        </div>
        {/* Status Badge */}
        <div>
          {isTerminalNoCotizar ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-800">
              <AlertCircle className="size-3.5" />
              No Cotizado
            </span>
          ) : isTerminalCliente ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
              <Check className="size-3.5" />
              Enviado al Cliente
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
              <Clock className="size-3.5 animate-pulse" />
              En Proceso ({currentStage})
            </span>
          )}
        </div>
      </div>

      {/* Visual Stepper Horizontal Bar */}
      <div className="relative flex items-center justify-between">
        {/* Background Connecting Line */}
        <div className="absolute left-0 top-1/2 -z-0 h-1 w-full -translate-y-1/2 bg-slate-100 rounded-full" />
        <div
          className="absolute left-0 top-1/2 -z-0 h-1 -translate-y-1/2 bg-slate-900 transition-all duration-500 rounded-full"
          style={{
            width: `${(currentIndex / (STAGES.length - 1)) * 100}%`,
          }}
        />

        {STAGES.map((stage, idx) => {
          const isDone = idx < currentIndex || (currentStage === "cerrado" && idx === 3);
          const isCurrent = idx === currentIndex && currentStage !== "cerrado";

          return (
            <div
              key={stage.id}
              className="relative z-10 flex flex-col items-center text-center group"
            >
              <div
                className={`flex size-10 items-center justify-center rounded-full border-2 font-semibold text-sm transition-all ${
                  isDone
                    ? "border-slate-900 bg-slate-900 text-white shadow-xs"
                    : isCurrent
                      ? "border-blue-600 bg-blue-600 text-white ring-4 ring-blue-100 shadow-md"
                      : "border-slate-200 bg-white text-slate-400"
                }`}
              >
                {isDone ? (
                  <Check className="size-5 stroke-[2.5]" />
                ) : isCurrent ? (
                  <Clock className="size-5 animate-spin-slow" />
                ) : (
                  <span>{idx + 1}</span>
                )}
              </div>
              <span
                className={`mt-2 text-xs font-bold ${
                  isCurrent
                    ? "text-blue-600"
                    : isDone
                      ? "text-slate-900"
                      : "text-slate-400"
                }`}
              >
                {stage.label}
              </span>
              <span className="hidden sm:block text-[10px] text-slate-400 max-w-[100px] truncate">
                {stage.description}
              </span>
            </div>
          );
        })}
      </div>

      {/* Active Node Detail Card */}
      <div className="rounded-xl border border-blue-100 bg-gradient-to-r from-blue-50/70 to-slate-50 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
              Tarea Actual en Ejecución
            </span>
            <h4 className="text-base font-bold text-slate-900">
              {TASK_LABEL[currentTaskType] ?? currentTaskType}
            </h4>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs font-medium text-slate-500">Rol Responsable:</span>
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-2xs border border-slate-200">
              <User className="size-3.5 text-blue-600" />
              {ROLE_LABEL[currentRole] ?? currentRole}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
