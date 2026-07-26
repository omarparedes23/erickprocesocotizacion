import Link from "next/link";
import { redirect } from "next/navigation";
import { Users, PlusCircle, Building2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AppLayout } from "@/components/layout/app-layout";
import type { Role } from "@/lib/workflow/transitions";

interface ClientRow {
  name: string;
  ruc: string | null;
  created_at: string;
}

export default async function ClientesPage() {
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

  const { data: clients, error: clientsError } = await supabase
    .from("tume_clients")
    .select("name, ruc, created_at")
    .order("name")
    .returns<ClientRow[]>();

  if (clientsError) {
    throw new Error(`No se pudieron cargar los clientes: ${clientsError.message}`);
  }

  return (
    <AppLayout
      userEmail={user.email}
      userRole={profile?.role}
      title="Gestión de Clientes"
      description="Listado completo de clientes corporativos registrados en la plataforma."
      actions={
        <Link
          href="/clientes/nuevo"
          className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-slate-800 transition-colors"
        >
          <PlusCircle className="size-3.5" />
          <span>Nuevo Cliente</span>
        </Link>
      }
    >
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Users className="size-4 text-slate-700" />
            <h2 className="text-base font-bold text-slate-900">
              Clientes Registrados ({clients?.length ?? 0})
            </h2>
          </div>
        </div>

        {!clients || clients.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">
            No hay clientes registrados en la base de datos.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {clients.map((client) => (
              <div
                key={client.name}
                className="flex items-center justify-between py-3.5 px-3 rounded-xl hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700 font-bold text-xs">
                    <Building2 className="size-4 text-slate-500" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 block text-sm">
                      {client.name}
                    </span>
                    <span className="text-xs text-slate-400">
                      Registrado: {new Date(client.created_at).toLocaleDateString("es-PE")}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                    RUC: {client.ruc ?? "—"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
