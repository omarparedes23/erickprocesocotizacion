import Link from "next/link";
import { redirect } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/actions/auth";
import { filterAndSortInbox, type InboxCaseRow } from "@/lib/cases/inbox";
import { ROLE_LABEL, TASK_LABEL } from "@/lib/workflow/labels";
import type { Role } from "@/lib/workflow/transitions";

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

  const [
    { data: openCases, error: openCasesError },
    { count: total, error: totalError },
    { count: adjudicados, error: adjudicadosError },
    { count: enEspera, error: enEsperaError },
    { count: rfp, error: rfpError },
  ] = await Promise.all([
    supabase
      .from("tume_cases")
      .select(
        "id, code, title, budget_usd, is_express, current_task_type, created_at, tume_clients(name)",
      )
      .neq("stage", "cerrado")
      .returns<InboxCaseRow[]>(),
    supabase.from("tume_cases").select("*", { count: "exact", head: true }),
    supabase
      .from("tume_cases")
      .select("*", { count: "exact", head: true })
      .eq("outcome", "adjudicado"),
    supabase
      .from("tume_cases")
      .select("*", { count: "exact", head: true })
      .eq("outcome", "en_proceso"),
    supabase
      .from("tume_cases")
      .select("*", { count: "exact", head: true })
      .is("outcome", null),
  ]);

  if (openCasesError) {
    throw new Error(`No se pudo cargar la bandeja: ${openCasesError.message}`);
  }

  const firstCountError =
    totalError ?? adjudicadosError ?? enEsperaError ?? rfpError;
  if (firstCountError) {
    throw new Error(
      `No se pudieron calcular los contadores: ${firstCountError.message}`,
    );
  }

  const inbox = filterAndSortInbox(openCases ?? [], profile.role);

  const counters = [
    { label: "Total", value: total ?? 0 },
    { label: "Adjudicados", value: adjudicados ?? 0 },
    { label: "En Espera", value: enEspera ?? 0 },
    { label: "RFP", value: rfp ?? 0 },
  ];

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Dashboard</h1>
          <p className="text-sm text-neutral-500">
            Sesión iniciada como{" "}
            <span className="font-medium">{user.email}</span> —{" "}
            {ROLE_LABEL[profile.role] ?? profile.role}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/casos"
            className={buttonVariants({ variant: "outline" })}
          >
            Todos los casos
          </Link>
          <Link href="/casos/nuevo" className={buttonVariants()}>
            Nuevo caso
          </Link>
          <form action={logout}>
            <Button type="submit" variant="outline">
              Cerrar sesión
            </Button>
          </form>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {counters.map((counter) => (
          <div
            key={counter.label}
            className="space-y-1 rounded-lg border bg-white p-4 shadow-sm"
          >
            <p className="text-sm text-neutral-500">{counter.label}</p>
            <p className="text-2xl font-semibold">{counter.value}</p>
          </div>
        ))}
      </div>

      <div className="space-y-3 rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold">
          Tu bandeja ({ROLE_LABEL[profile.role] ?? profile.role})
        </h2>

        {inbox.length === 0 ? (
          <p className="text-sm text-neutral-500">
            No tenés casos pendientes en tu bandeja.
          </p>
        ) : (
          <ul className="divide-y">
            {inbox.map((caso) => (
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
                        caso.current_task_type}
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
