import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Building, DollarSign, Tag, Zap, ShieldAlert, CheckCircle, User } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { AppLayout } from "@/components/layout/app-layout";
import { WorkflowStepper } from "@/components/cases/workflow-stepper";
import { TransitionTimeline, type TransitionItem } from "@/components/cases/timeline";
import { SlaBadge } from "@/components/cases/sla-badge";
import { TASK_ROLE, type TaskType, type CaseStage, type Role } from "@/lib/workflow/transitions";
import { getTaskUiKind, isFinalTask } from "@/lib/workflow/task-ui";
import { ROLE_LABEL, TASK_LABEL } from "@/lib/workflow/labels";
import { TASK_GATEWAY_QUESTION } from "@/lib/workflow/gateway-questions";
import { advanceCase } from "./actions";

interface CaseRow {
  id: string;
  code: string;
  title: string;
  description: string | null;
  type: "servicio" | "bien";
  budget_usd: number | null;
  quoted_amount_usd: number | null;
  is_express: boolean;
  stage: CaseStage;
  outcome: string | null;
  current_task_type: TaskType;
  delivery_due_at: string | null;
  tume_clients: { name: string } | null;
  tume_profiles: { full_name: string } | null;
}

export default async function CasoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("tume_profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle<{ role: Role }>();

  const { data: caso, error: casoError } = await supabase
    .from("tume_cases")
    .select(
      "id, code, title, description, type, budget_usd, quoted_amount_usd, is_express, stage, outcome, current_task_type, delivery_due_at, tume_clients(name), tume_profiles!tume_cases_created_by_fkey(full_name)",
    )
    .eq("id", id)
    .maybeSingle<CaseRow>();

  if (casoError) {
    throw new Error(`No se pudo cargar el caso: ${casoError.message}`);
  }

  if (!caso) {
    notFound();
  }

  const { data: transitions, error: transitionsError } = await supabase
    .from("tume_case_transitions")
    .select("id, from_task_type, to_task_type, reason, created_at, tume_profiles(full_name)")
    .eq("case_id", id)
    .order("created_at", { ascending: true })
    .returns<TransitionItem[]>();

  if (transitionsError) {
    throw new Error(
      `No se pudo cargar el historial: ${transitionsError.message}`,
    );
  }

  const currentTaskType = caso.current_task_type as TaskType;
  const currentRole = TASK_ROLE[currentTaskType];
  const uiKind = getTaskUiKind(currentTaskType);

  // enviar_cliente/enviar_no_cotizar se quedan como current_task_type incluso
  // después de confirmados (no generan tarea siguiente): hay que mirar el
  // status de la fila en tume_tasks para saber si el envío ya se confirmó o
  // sigue pendiente de que gerente_comercial haga el check.
  let isFinalConfirmed = false;
  if (isFinalTask(currentTaskType)) {
    const { data: currentTaskRow } = await supabase
      .from("tume_tasks")
      .select("status")
      .eq("case_id", id)
      .eq("task_type", currentTaskType)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<{ status: string }>();
    isFinalConfirmed = currentTaskRow?.status === "done";
  }

  return (
    <AppLayout
      userEmail={user.email}
      userRole={profile?.role}
      title={`Caso ${caso.code}`}
      description={caso.title}
      actions={
        <div className="flex items-center gap-3">
          <SlaBadge deliveryDueAt={caso.delivery_due_at} stage={caso.stage} />
          <Link
            href="/casos"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            <span>Volver a Casos</span>
          </Link>
        </div>
      }
    >
      {/* Visual Pipeline Stepper Component */}
      <WorkflowStepper
        currentStage={caso.stage}
        currentTaskType={currentTaskType}
        currentRole={currentRole}
        outcome={caso.outcome}
        isFinalConfirmed={isFinalConfirmed}
      />

      {/* Case Details Card & Actions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Metadata Details */}
        <div className="lg:col-span-1 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
          <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
            Información del Caso
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-slate-100/60">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Building className="size-3.5 text-slate-400" />
                Cliente
              </span>
              <span className="font-semibold text-slate-900">
                {caso.tume_clients?.name ?? "—"}
              </span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-slate-100/60">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Tag className="size-3.5 text-slate-400" />
                Tipo de Requerimiento
              </span>
              <span className="font-semibold text-slate-900 capitalize">
                {caso.type}
              </span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-slate-100/60">
              <span className="text-slate-500 flex items-center gap-1.5">
                <DollarSign className="size-3.5 text-slate-400" />
                Presupuesto Estimado
              </span>
              <span className="font-semibold text-slate-900">
                {caso.budget_usd != null ? `USD ${caso.budget_usd.toLocaleString()}` : "—"}
              </span>
            </div>

            {caso.quoted_amount_usd != null && (
              <div className="flex items-center justify-between py-1 border-b border-slate-100/60">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <DollarSign className="size-3.5 text-slate-400" />
                  Monto Cotizado
                </span>
                <span className="font-semibold text-slate-900">
                  USD {caso.quoted_amount_usd.toLocaleString()}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between py-1 border-b border-slate-100/60">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Zap className="size-3.5 text-amber-500" />
                Prioridad Express
              </span>
              <span className={`font-semibold ${caso.is_express ? "text-amber-600" : "text-slate-900"}`}>
                {caso.is_express ? "Sí (Prioritario)" : "No"}
              </span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-slate-100/60">
              <span className="text-slate-500">Etapa del Proceso</span>
              <span className="font-bold text-slate-900 capitalize">
                {caso.stage}
              </span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-slate-100/60">
              <span className="text-slate-500 flex items-center gap-1.5">
                <User className="size-3.5 text-slate-400" />
                Registrado por
              </span>
              <span className="font-semibold text-slate-900">
                {caso.tume_profiles?.full_name ?? "—"}
              </span>
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="text-slate-500">Resultado Actual</span>
              <span className="font-semibold text-slate-900">
                {caso.outcome ?? "En proceso"}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Next Action Decision Form */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">
              Acción Pendiente
            </span>
            <h3 className="text-base font-bold text-slate-900">
              Avanzar Flujo de Trabajo
            </h3>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-700 border border-rose-200">
              <ShieldAlert className="size-4 shrink-0" />
              <span>{decodeURIComponent(error)}</span>
            </div>
          )}

          {isFinalConfirmed && (
            <div className="flex flex-col items-center justify-center py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <CheckCircle className="size-8 text-slate-400 mb-2" />
              <p className="text-sm font-semibold text-slate-800">
                Este caso ha finalizado
              </p>
              <p className="text-xs text-slate-500 max-w-xs mt-1">
                El flujo de trabajo alcanzó un estado terminal ({currentTaskType}). No se requieren más acciones.
              </p>
            </div>
          )}

          {!isFinalConfirmed && uiKind === "final-confirm" && (
            <form action={advanceCase} className="space-y-4">
              <input type="hidden" name="caseId" value={caso.id} />
              <input
                type="hidden"
                name="currentTaskType"
                value={currentTaskType}
              />

              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-blue-700">
                <User className="size-3.5 shrink-0" />
                Decisión de: {ROLE_LABEL[TASK_ROLE[currentTaskType]]}
              </div>

              <div className="flex items-start gap-2.5 rounded-xl border border-slate-200 p-3 bg-slate-50">
                <input
                  id="confirmSent"
                  type="checkbox"
                  name="confirmSent"
                  required
                  className="size-4 mt-0.5 rounded border-slate-300 text-blue-600"
                />
                <label htmlFor="confirmSent" className="text-xs font-medium text-slate-700 cursor-pointer">
                  {currentTaskType === "enviar_cliente"
                    ? "Confirmo que envié la cotización al cliente"
                    : "Confirmo que envié el correo de no cotización al cliente"}
                </label>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="reason" className="text-xs font-semibold text-slate-700">
                  Motivo / Observación (opcional)
                </label>
                <textarea
                  id="reason"
                  name="reason"
                  rows={2}
                  placeholder="Escribe un comentario u observación para el historial..."
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 font-semibold text-xs py-2.5">
                {currentTaskType === "enviar_cliente"
                  ? "Confirmar Envío y Cerrar Caso"
                  : "Confirmar Envío de No Cotización"}
              </Button>
            </form>
          )}

          {uiKind === "automatic" && (
            <form action={advanceCase} className="space-y-4">
              <input type="hidden" name="caseId" value={caso.id} />
              <input
                type="hidden"
                name="currentTaskType"
                value={currentTaskType}
              />
              <div className="rounded-xl bg-slate-50 p-4 border border-slate-100 space-y-1">
                <p className="text-xs font-semibold text-slate-700">
                  Transición Automática
                </p>
                <p className="text-xs text-slate-500">
                  Haz clic en continuar para pasar a la siguiente tarea del workflow.
                </p>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="reason" className="text-xs font-semibold text-slate-700">
                  Motivo / Observación (opcional)
                </label>
                <textarea
                  id="reason"
                  name="reason"
                  rows={2}
                  placeholder="Escribe un comentario u observación para el historial..."
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 font-semibold text-xs py-2.5">
                Continuar Siguiente Tarea
              </Button>
            </form>
          )}

          {uiKind === "simple-gateway" && (
            <form action={advanceCase} className="space-y-4">
              <input type="hidden" name="caseId" value={caso.id} />
              <input
                type="hidden"
                name="currentTaskType"
                value={currentTaskType}
              />
              <div className="rounded-xl bg-blue-50/60 p-4 border border-blue-100 space-y-3">
                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-blue-700">
                  <User className="size-3.5 shrink-0" />
                  Decisión de: {ROLE_LABEL[TASK_ROLE[currentTaskType]]}
                </div>
                <label className="block text-xs font-bold text-slate-900">
                  {TASK_GATEWAY_QUESTION[currentTaskType] ?? "Compuerta de decisión"}
                </label>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
                    <input
                      id="answer-si"
                      type="radio"
                      name="answer"
                      value="si"
                      defaultChecked
                      className="size-4 text-blue-600 border-slate-300"
                    />
                    <span>Sí</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
                    <input
                      id="answer-no"
                      type="radio"
                      name="answer"
                      value="no"
                      className="size-4 text-blue-600 border-slate-300"
                    />
                    <span>No</span>
                  </label>
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="reason" className="text-xs font-semibold text-slate-700">
                  Motivo / Justificación de la Decisión
                </label>
                <textarea
                  id="reason"
                  name="reason"
                  rows={2}
                  placeholder="Detalla el motivo de tu respuesta..."
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 font-semibold text-xs py-2.5">
                Confirmar Decisión y Avanzar
              </Button>
            </form>
          )}

          {uiKind === "revisar-solicitud" && (
            <form action={advanceCase} className="space-y-4">
              <input type="hidden" name="caseId" value={caso.id} />
              <input
                type="hidden"
                name="currentTaskType"
                value={currentTaskType}
              />
              <div className="rounded-xl bg-blue-50/60 p-4 border border-blue-100 space-y-3">
                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-blue-700">
                  <User className="size-3.5 shrink-0" />
                  Decisión de: {ROLE_LABEL[TASK_ROLE.revisar_solicitud]}
                </div>
                <label className="block text-xs font-bold text-slate-900">
                  {TASK_GATEWAY_QUESTION.revisar_solicitud}
                </label>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
                    <input
                      id="answer-si"
                      type="radio"
                      name="answer"
                      value="si"
                      defaultChecked
                      className="size-4 text-blue-600 border-slate-300"
                    />
                    <span>Sí, cotizar</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
                    <input
                      id="answer-no"
                      type="radio"
                      name="answer"
                      value="no"
                      className="size-4 text-blue-600 border-slate-300"
                    />
                    <span>No cotizar</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 p-3 bg-slate-50">
                <input
                  id="tieneTdr"
                  type="checkbox"
                  name="tieneTdr"
                  className="size-4 rounded border-slate-300 text-blue-600"
                />
                <label htmlFor="tieneTdr" className="text-xs font-medium text-slate-700 cursor-pointer">
                  Tiene Términos de Referencia (TDR) adjuntos / definidos
                </label>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="reason" className="text-xs font-semibold text-slate-700">
                  Motivo / Justificación
                </label>
                <textarea
                  id="reason"
                  name="reason"
                  rows={2}
                  placeholder="Detalla las observaciones..."
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 font-semibold text-xs py-2.5">
                Confirmar Revisión
              </Button>
            </form>
          )}

          {uiKind === "cotizar" && (
            <form action={advanceCase} className="space-y-4">
              <input type="hidden" name="caseId" value={caso.id} />
              <input
                type="hidden"
                name="currentTaskType"
                value={currentTaskType}
              />

              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-blue-700">
                <User className="size-3.5 shrink-0" />
                Decisión de: {ROLE_LABEL[TASK_ROLE.cotizar]}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="quotedAmountUsd" className="text-xs font-semibold text-slate-700">
                  Monto de la Cotización (USD)
                </label>
                <input
                  id="quotedAmountUsd"
                  name="quotedAmountUsd"
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  placeholder="0.00"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-start gap-2.5 rounded-xl border border-slate-200 p-3 bg-slate-50">
                <input
                  id="documentReviewed"
                  type="checkbox"
                  name="documentReviewed"
                  required
                  className="size-4 mt-0.5 rounded border-slate-300 text-blue-600"
                />
                <label htmlFor="documentReviewed" className="text-xs font-medium text-slate-700 cursor-pointer">
                  Confirmo que revisé el documento de la cotización antes de continuar
                  <span className="block text-[11px] font-normal text-slate-400 mt-0.5">
                    La carga del documento estará disponible en una fase futura.
                  </span>
                </label>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="reason" className="text-xs font-semibold text-slate-700">
                  Motivo / Observación (opcional)
                </label>
                <textarea
                  id="reason"
                  name="reason"
                  rows={2}
                  placeholder="Escribe un comentario u observación para el historial..."
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 font-semibold text-xs py-2.5">
                Confirmar Cotización y Continuar
              </Button>
            </form>
          )}
        </div>
      </div>

      {/* Transition History Timeline */}
      <TransitionTimeline transitions={transitions} />
    </AppLayout>
  );
}
