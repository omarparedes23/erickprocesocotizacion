import Link from "next/link";
import { redirect } from "next/navigation";
import { PlusCircle, ArrowUpRight, FolderKanban, Sparkles, LayoutGrid, List } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AppLayout } from "@/components/layout/app-layout";
import { KanbanBoard, type KanbanCaseItem } from "@/components/cases/kanban-board";
import { SlaBadge } from "@/components/cases/sla-badge";
import { CaseStatusFilterSelect } from "@/components/cases/case-status-filter";
import { TASK_LABEL, ROLE_LABEL } from "@/lib/workflow/labels";
import { TASK_ROLE, type CaseOutcome, type CaseStage, type TaskType, type Role } from "@/lib/workflow/transitions";
import { matchesStatusFilter, parseCaseStatusFilter } from "@/lib/cases/status";
import { canCreateCase } from "@/lib/permissions";

interface CaseListRow {
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
  enviado_at: string | null;
  tume_clients: { name: string } | null;
}

export default async function CasosPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; estado?: string }>;
}) {
  const { view, estado } = await searchParams;
  const isKanban = view === "kanban";
  const statusFilter = parseCaseStatusFilter(estado);

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

  const { data: cases, error: casesError } = await supabase
    .from("tume_cases")
    .select(
      "id, code, title, budget_usd, is_express, stage, outcome, current_task_type, created_at, delivery_due_at, enviado_at, tume_clients(name)",
    )
    .order("created_at", { ascending: false })
    .returns<CaseListRow[]>();

  if (casesError) {
    throw new Error(`No se pudieron cargar los casos: ${casesError.message}`);
  }

  const caseItems = (cases ?? []).filter((caso) =>
    matchesStatusFilter(caso, statusFilter),
  );

  // Preserva ?estado al cambiar entre vista Lista/Kanban.
  const estadoQuery = estado ? `&estado=${estado}` : "";

  return (
    <AppLayout
      userEmail={user.email}
      userRole={profile?.role}
      title="Gestión de Casos"
      description="Seguimiento y flujo de trabajo de cotizaciones en tiempo real."
      actions={
        <div className="flex items-center gap-2">
          {/* Status Filter Combobox */}
          <CaseStatusFilterSelect current={statusFilter} />

          {/* View Switcher Toggle */}
          <div className="flex items-center rounded-xl border border-slate-200 bg-slate-100 p-0.5 shadow-2xs">
            <Link
              href={`/casos?view=list${estadoQuery}`}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-semibold transition-all ${
                !isKanban
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <List className="size-3.5" />
              <span>Lista</span>
            </Link>
            <Link
              href={`/casos?view=kanban${estadoQuery}`}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-semibold transition-all ${
                isKanban
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <LayoutGrid className="size-3.5" />
              <span>Kanban</span>
            </Link>
          </div>

          {canCreateCase(profile?.role) && (
            <Link
              href="/casos/nuevo"
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-slate-800 transition-colors"
            >
              <PlusCircle className="size-3.5" />
              <span>Nuevo Caso</span>
            </Link>
          )}
        </div>
      }
    >
      {isKanban ? (
        /* Kanban View Component */
        <KanbanBoard cases={caseItems as KanbanCaseItem[]} />
      ) : (
        /* List View Component */
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <FolderKanban className="size-4 text-slate-700" />
              <h2 className="text-base font-bold text-slate-900">
                Lista de Casos ({caseItems.length})
              </h2>
            </div>
          </div>

          {caseItems.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              {statusFilter === "todos"
                ? "No hay casos registrados actualmente."
                : "No hay casos que coincidan con este filtro."}
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {caseItems.map((caso) => {
                const currentRole = TASK_ROLE[caso.current_task_type];
                return (
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
                          <SlaBadge
                            deliveryDueAt={caso.delivery_due_at}
                            stage={caso.stage}
                          />
                        </div>
                        <p className="text-xs text-slate-500">
                          Cliente:{" "}
                          <span className="font-semibold text-slate-700">
                            {caso.tume_clients?.name ?? "—"}
                          </span>{" "}
                          • Tarea Actual:{" "}
                          <span className="font-semibold text-blue-700">
                            {TASK_LABEL[caso.current_task_type] ??
                              caso.current_task_type}
                          </span>{" "}
                          • Responsable:{" "}
                          <span className="font-medium text-slate-700">
                            {ROLE_LABEL[currentRole] ?? currentRole}
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
                );
              })}
            </div>
          )}
        </div>
      )}
    </AppLayout>
  );
}
