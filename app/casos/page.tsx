import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TASK_LABEL } from "@/lib/workflow/labels";
import type {
  CaseOutcome,
  CaseStage,
  TaskType,
} from "@/lib/workflow/transitions";

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
  tume_clients: { name: string } | null;
}

export default async function CasosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: cases, error: casesError } = await supabase
    .from("tume_cases")
    .select(
      "id, code, title, budget_usd, is_express, stage, outcome, current_task_type, created_at, tume_clients(name)",
    )
    .order("created_at", { ascending: false })
    .returns<CaseListRow[]>();

  if (casesError) {
    throw new Error(`No se pudieron cargar los casos: ${casesError.message}`);
  }

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Todos los casos</h1>
          <p className="text-sm text-neutral-500">
            Listado completo, incluye casos cerrados.
          </p>
        </div>
        <Link href="/dashboard" className="text-sm text-neutral-500 hover:underline">
          Volver al dashboard
        </Link>
      </div>

      <div className="space-y-3 rounded-lg border bg-white p-6 shadow-sm">
        {!cases || cases.length === 0 ? (
          <p className="text-sm text-neutral-500">
            No hay casos registrados.
          </p>
        ) : (
          <ul className="divide-y">
            {cases.map((caso) => (
              <li key={caso.id} className="py-3">
                <Link
                  href={`/casos/${caso.id}`}
                  className="flex items-center justify-between gap-4 hover:underline"
                >
                  <span>
                    <span className="font-medium">
                      Caso {caso.code} — {caso.title}
                    </span>
                    {caso.is_express && (
                      <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                        Express
                      </span>
                    )}
                    <span className="block text-sm text-neutral-500">
                      {caso.tume_clients?.name ?? "—"} —{" "}
                      {TASK_LABEL[caso.current_task_type] ??
                        caso.current_task_type}{" "}
                      — {caso.stage}
                      {caso.outcome ? ` — ${caso.outcome}` : ""}
                    </span>
                  </span>
                  <span className="text-sm text-neutral-500">
                    {caso.budget_usd != null ? `USD ${caso.budget_usd}` : "—"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
