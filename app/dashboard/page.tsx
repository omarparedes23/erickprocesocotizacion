import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Inbox,
  ShieldAlert,
  AlertTriangle,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AppLayout } from "@/components/layout/app-layout";
import { AnalyticsCharts, type AnalyticsData } from "@/components/analytics/analytics-charts";
import { SlaBadge } from "@/components/cases/sla-badge";
import { calculateSla } from "@/lib/cases/sla";
import { filterAndSortInbox, type InboxCaseRow } from "@/lib/cases/inbox";
import { ROLE_LABEL, TASK_LABEL } from "@/lib/workflow/labels";
import type { Role, CaseStage, CaseOutcome, TaskType } from "@/lib/workflow/transitions";

interface CaseFullRow {
  id: string;
  code: string;
  title: string;
  budget_usd: number | null;
  is_express: boolean;
  stage: CaseStage;
  outcome: CaseOutcome | null;
  current_task_type: TaskType;
  created_at: string;
  delivery_due_at: string | null;
  tume_clients: { name: string } | null;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("tume_profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle<{ role: Role }>();

  if (profileError) {
    throw new Error(`No se pudo cargar el perfil: ${profileError.message}`);
  }

  if (!profile) {
    throw new Error("El usuario no tiene un perfil asociado.");
  }

  const { data: allCases, error: allCasesError } = await supabase
    .from("tume_cases")
    .select(
      "id, code, title, budget_usd, is_express, stage, outcome, current_task_type, created_at, delivery_due_at, tume_clients(name)",
    )
    .order("created_at", { ascending: false })
    .returns<CaseFullRow[]>();

  if (allCasesError) {
    throw new Error(`No se pudieron cargar los casos: ${allCasesError.message}`);
  }

  const cases = allCases ?? [];

  // Open cases for inbox
  const openCases = cases.filter((c) => c.stage !== "cerrado");
  const inbox = filterAndSortInbox(openCases as InboxCaseRow[], profile.role);

  // Compute SLA Alerts
  const expiredCases = cases.filter(
    (c) => calculateSla(c.delivery_due_at, c.stage).status === "expired",
  );
  const warningCases = cases.filter(
    (c) => calculateSla(c.delivery_due_at, c.stage).status === "warning",
  );

  // Compute Analytics Data
  const totalCount = cases.length;
  const adjudicadosCases = cases.filter((c) => c.outcome === "adjudicado");
  const adjudicadosCount = adjudicadosCases.length;
  const noAdjudicadosCount = cases.filter(
    (c) => c.outcome === "no_adjudicado" || c.outcome === "desestimado",
  ).length;
  const enProcesoCount = cases.filter(
    (c) => c.stage !== "cerrado" && (!c.outcome || c.outcome === "en_proceso"),
  ).length;

  const cerradosCount = adjudicadosCount + noAdjudicadosCount;
  const winRate =
    cerradosCount > 0
      ? Math.round((adjudicadosCount / cerradosCount) * 100)
      : 0;

  const montoTotalUsd = cases.reduce((acc, c) => acc + (c.budget_usd ?? 0), 0);
  const montoAdjudicadoUsd = adjudicadosCases.reduce(
    (acc, c) => acc + (c.budget_usd ?? 0),
    0,
  );
  const ticketPromedioUsd =
    totalCount > 0 ? Math.round(montoTotalUsd / totalCount) : 0;

  // Funnel breakdown
  const stageLabels: Record<CaseStage, string> = {
    solicitud: "1. Solicitud",
    revision: "2. Revisión",
    cotizacion: "3. Cotización",
    cerrado: "4. Cierre",
  };

  const stageFunnel: AnalyticsData["stageFunnel"] = (
    ["solicitud", "revision", "cotizacion", "cerrado"] as CaseStage[]
  ).map((stg) => {
    const stageCases = cases.filter((c) => c.stage === stg);
    const totalBudgetUsd = stageCases.reduce(
      (acc, c) => acc + (c.budget_usd ?? 0),
      0,
    );
    return {
      stageId: stg,
      label: stageLabels[stg],
      count: stageCases.length,
      totalBudgetUsd,
    };
  });

  // Top Clients
  const clientMap = new Map<string, { count: number; totalBudgetUsd: number }>();
  cases.forEach((c) => {
    const name = c.tume_clients?.name ?? "Sin cliente";
    const curr = clientMap.get(name) ?? { count: 0, totalBudgetUsd: 0 };
    clientMap.set(name, {
      count: curr.count + 1,
      totalBudgetUsd: curr.totalBudgetUsd + (c.budget_usd ?? 0),
    });
  });

  const topClients = Array.from(clientMap.entries())
    .map(([name, val]) => ({ name, ...val }))
    .sort((a, b) => b.totalBudgetUsd - a.totalBudgetUsd)
    .slice(0, 5);

  const analyticsData: AnalyticsData = {
    totalCount,
    adjudicadosCount,
    enProcesoCount,
    noAdjudicadosCount,
    winRate,
    montoTotalUsd,
    montoAdjudicadoUsd,
    ticketPromedioUsd,
    stageFunnel,
    topClients,
  };

  return (
    <AppLayout
      userEmail={user.email}
      userRole={profile.role}
      title="Dashboard General & KPIs"
      description={`Métricas de rendimiento comercial y bandeja de tareas para ${ROLE_LABEL[profile.role] ?? profile.role}`}
    >
      {/* SLA Alert Banner if any cases are expired or warning */}
      {(expiredCases.length > 0 || warningCases.length > 0) && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-4 shadow-2xs space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-rose-900">
            <ShieldAlert className="size-4 text-rose-600 shrink-0" />
            <span>Alerta de Semáforo SLA (Atención Requerida)</span>
          </div>
          <div className="flex flex-wrap gap-4 text-xs font-semibold">
            {expiredCases.length > 0 && (
              <span className="flex items-center gap-1.5 text-rose-800 bg-white px-3 py-1 rounded-xl border border-rose-200 shadow-2xs">
                <ShieldAlert className="size-3.5 text-rose-600" />
                {expiredCases.length} caso(s) vencidos fuera de tiempo
              </span>
            )}
            {warningCases.length > 0 && (
              <span className="flex items-center gap-1.5 text-amber-800 bg-white px-3 py-1 rounded-xl border border-amber-200 shadow-2xs">
                <AlertTriangle className="size-3.5 text-amber-600" />
                {warningCases.length} caso(s) por vencer en menos de 48h
              </span>
            )}
          </div>
        </div>
      )}

      {/* Analytics KPIs and Charts Component */}
      <AnalyticsCharts data={analyticsData} />

      {/* User Inbox Component */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Inbox className="size-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Tu Bandeja de Tareas ({inbox.length})
              </h2>
              <p className="text-xs text-slate-500">
                Casos asignados a tu rol ({ROLE_LABEL[profile.role] ?? profile.role})
              </p>
            </div>
          </div>
        </div>

        {inbox.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <p className="text-sm font-semibold text-slate-900">
              ¡No tienes tareas pendientes en tu bandeja!
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {inbox.map((caso) => (
              <div
                key={caso.id}
                className="group flex items-center justify-between py-3.5 transition-colors hover:bg-slate-50/80 rounded-xl px-3"
              >
                <Link
                  href={`/casos/${caso.id}`}
                  className="flex-1 flex items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                        Caso {caso.code} — {caso.title}
                      </span>
                      {caso.is_express && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                          <Sparkles className="size-3" />
                          Express
                        </span>
                      )}
                      <SlaBadge deliveryDueAt={caso.created_at} />
                    </div>
                    <p className="text-xs text-slate-500">
                      Cliente:{" "}
                      <span className="font-semibold text-slate-700">
                        {caso.tume_clients?.name ?? "—"}
                      </span>{" "}
                      • Tarea Pendiente:{" "}
                      <span className="font-semibold text-blue-700">
                        {TASK_LABEL[caso.current_task_type] ??
                          caso.current_task_type}
                      </span>
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                      {caso.budget_usd != null
                        ? `USD ${caso.budget_usd.toLocaleString()}`
                        : "Sin monto"}
                    </span>
                    <ArrowUpRight className="size-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
