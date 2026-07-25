import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { TASK_ROLE, type TaskType } from "@/lib/workflow/transitions";
import { getTaskUiKind } from "@/lib/workflow/task-ui";
import { advanceCase } from "./actions";

const ROLE_LABEL: Record<string, string> = {
  gerente_comercial: "Gerente comercial",
  lider_cotizador: "Líder cotizador",
  gerente_tecnico: "Gerente técnico",
  cotizador: "Cotizador",
};

const TASK_LABEL: Record<TaskType, string> = {
  recibir_solicitud: "Recibir solicitud",
  distribuir_solicitud: "Distribuir solicitud",
  revisar_solicitud: "Revisar solicitud",
  revisar_tdr: "Revisar TDR",
  consultar_gerencia_tecnica: "Consultar gerencia técnica",
  solicitar_informacion: "Solicitar información",
  solicitar_visita_tecnica: "Solicitar visita técnica",
  evaluar_gerencia_tecnica: "Evaluar gerencia técnica",
  cotizar: "Cotizar",
  revisar_cotizacion_lider: "Revisar cotización (líder)",
  revisar_cotizacion_gerencia: "Revisar cotización (gerencia)",
  enviar_cliente: "Enviar al cliente",
  enviar_no_cotizar: "No cotizar",
};

interface CaseRow {
  id: string;
  code: string;
  title: string;
  description: string | null;
  type: "servicio" | "bien";
  budget_usd: number | null;
  is_express: boolean;
  stage: string;
  outcome: string | null;
  current_task_type: string;
  tume_clients: { name: string } | null;
}

interface TransitionRow {
  id: string;
  from_task_type: string | null;
  to_task_type: string | null;
  reason: string | null;
  created_at: string;
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

  const { data: caso, error: casoError } = await supabase
    .from("tume_cases")
    .select(
      "id, code, title, description, type, budget_usd, is_express, stage, outcome, current_task_type, tume_clients(name)",
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
    .returns<TransitionRow[]>();

  if (transitionsError) {
    throw new Error(
      `No se pudo cargar el historial: ${transitionsError.message}`,
    );
  }

  const currentTaskType = caso.current_task_type as TaskType;
  const currentRole = TASK_ROLE[currentTaskType];
  const uiKind = getTaskUiKind(currentTaskType);

  return (
    <main className="mx-auto max-w-2xl space-y-6 p-8">
      <div className="space-y-4 rounded-lg border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">
            Caso {caso.code} — {caso.title}
          </h1>
        </div>

        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <dt className="text-neutral-500">Tipo</dt>
          <dd>{caso.type === "servicio" ? "Servicio" : "Bien"}</dd>

          <dt className="text-neutral-500">Cliente</dt>
          <dd>{caso.tume_clients?.name ?? "—"}</dd>

          <dt className="text-neutral-500">Presupuesto</dt>
          <dd>
            {caso.budget_usd != null ? `USD ${caso.budget_usd}` : "—"}
          </dd>

          <dt className="text-neutral-500">Express</dt>
          <dd>{caso.is_express ? "Sí" : "No"}</dd>

          <dt className="text-neutral-500">Etapa</dt>
          <dd>{caso.stage}</dd>

          <dt className="text-neutral-500">Resultado</dt>
          <dd>{caso.outcome ?? "En proceso"}</dd>

          <dt className="text-neutral-500">Tarea actual</dt>
          <dd>{TASK_LABEL[currentTaskType]}</dd>

          <dt className="text-neutral-500">Rol asignado</dt>
          <dd>{ROLE_LABEL[currentRole] ?? currentRole}</dd>
        </dl>
      </div>

      <div className="space-y-3 rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold">Historial de transiciones</h2>
        {transitions && transitions.length > 0 ? (
          <ul className="space-y-2 text-sm">
            {transitions.map((t) => (
              <li key={t.id} className="border-b pb-2 last:border-b-0">
                <p>
                  <span className="text-neutral-500">
                    {t.from_task_type ? TASK_LABEL[t.from_task_type as TaskType] : "—"}
                  </span>{" "}
                  →{" "}
                  <span className="font-medium">
                    {t.to_task_type ? TASK_LABEL[t.to_task_type as TaskType] : "—"}
                  </span>
                </p>
                <p className="text-neutral-500">
                  {t.tume_profiles?.full_name ?? "Actor desconocido"} —{" "}
                  {new Date(t.created_at).toLocaleString()}
                  {t.reason ? ` — "${t.reason}"` : ""}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-neutral-500">Sin transiciones aún.</p>
        )}
      </div>

      <div className="space-y-4 rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold">Acción</h2>

        {error && (
          <p className="text-sm text-red-600" role="alert">
            {decodeURIComponent(error)}
          </p>
        )}

        {uiKind === "terminal" && (
          <p className="text-sm text-neutral-500">
            Este caso está cerrado. No hay más acciones disponibles.
          </p>
        )}

        {uiKind === "automatic" && (
          <form action={advanceCase} className="space-y-3">
            <input type="hidden" name="caseId" value={caso.id} />
            <input
              type="hidden"
              name="currentTaskType"
              value={currentTaskType}
            />
            <div className="space-y-1">
              <label htmlFor="reason" className="text-sm font-medium">
                Motivo (opcional)
              </label>
              <textarea
                id="reason"
                name="reason"
                rows={2}
                className="w-full rounded-md border px-3 py-2 text-sm"
              />
            </div>
            <Button type="submit" className="w-full">
              Continuar
            </Button>
          </form>
        )}

        {uiKind === "simple-gateway" && (
          <form action={advanceCase} className="space-y-3">
            <input type="hidden" name="caseId" value={caso.id} />
            <input
              type="hidden"
              name="currentTaskType"
              value={currentTaskType}
            />
            <fieldset className="space-y-1">
              <legend className="text-sm font-medium">Respuesta</legend>
              <div className="flex items-center gap-2">
                <input
                  id="answer-si"
                  type="radio"
                  name="answer"
                  value="si"
                  defaultChecked
                  className="size-4"
                />
                <label htmlFor="answer-si" className="text-sm">
                  Sí
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="answer-no"
                  type="radio"
                  name="answer"
                  value="no"
                  className="size-4"
                />
                <label htmlFor="answer-no" className="text-sm">
                  No
                </label>
              </div>
            </fieldset>
            <div className="space-y-1">
              <label htmlFor="reason" className="text-sm font-medium">
                Motivo (opcional)
              </label>
              <textarea
                id="reason"
                name="reason"
                rows={2}
                className="w-full rounded-md border px-3 py-2 text-sm"
              />
            </div>
            <Button type="submit" className="w-full">
              Confirmar
            </Button>
          </form>
        )}

        {uiKind === "revisar-solicitud" && (
          <form action={advanceCase} className="space-y-3">
            <input type="hidden" name="caseId" value={caso.id} />
            <input
              type="hidden"
              name="currentTaskType"
              value={currentTaskType}
            />
            <fieldset className="space-y-1">
              <legend className="text-sm font-medium">¿Se cotiza?</legend>
              <div className="flex items-center gap-2">
                <input
                  id="answer-si"
                  type="radio"
                  name="answer"
                  value="si"
                  defaultChecked
                  className="size-4"
                />
                <label htmlFor="answer-si" className="text-sm">
                  Sí
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="answer-no"
                  type="radio"
                  name="answer"
                  value="no"
                  className="size-4"
                />
                <label htmlFor="answer-no" className="text-sm">
                  No
                </label>
              </div>
            </fieldset>

            <div className="flex items-center gap-2 rounded-md border border-dashed p-2">
              <input
                id="tieneTdr"
                type="checkbox"
                name="tieneTdr"
                className="size-4 rounded border"
              />
              <label htmlFor="tieneTdr" className="text-sm">
                Tiene TDR (Términos de Referencia) — solo aplica si
                contestaste &quot;Sí&quot; arriba
              </label>
            </div>

            <div className="space-y-1">
              <label htmlFor="reason" className="text-sm font-medium">
                Motivo (opcional)
              </label>
              <textarea
                id="reason"
                name="reason"
                rows={2}
                className="w-full rounded-md border px-3 py-2 text-sm"
              />
            </div>
            <Button type="submit" className="w-full">
              Confirmar
            </Button>
          </form>
        )}
      </div>
    </main>
  );
}
