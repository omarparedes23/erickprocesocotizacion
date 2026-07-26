import Link from "next/link";
import { redirect } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

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

  const { data: clients, error: clientsError } = await supabase
    .from("tume_clients")
    .select("name, ruc, created_at")
    .order("name")
    .returns<ClientRow[]>();

  if (clientsError) {
    throw new Error(`No se pudieron cargar los clientes: ${clientsError.message}`);
  }

  return (
    <main className="mx-auto max-w-2xl space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Clientes</h1>
          <p className="text-sm text-neutral-500">
            Listado completo de clientes registrados.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard" className="text-sm text-neutral-500 hover:underline">
            Volver al dashboard
          </Link>
          <Link href="/clientes/nuevo" className={buttonVariants()}>
            Nuevo cliente
          </Link>
        </div>
      </div>

      <div className="space-y-3 rounded-lg border bg-white p-6 shadow-sm">
        {!clients || clients.length === 0 ? (
          <p className="text-sm text-neutral-500">
            No hay clientes registrados.
          </p>
        ) : (
          <ul className="divide-y">
            {clients.map((client) => (
              <li
                key={client.name}
                className="flex items-center justify-between gap-4 py-3"
              >
                <span className="font-medium">{client.name}</span>
                <span className="text-sm text-neutral-500">
                  {client.ruc ?? "—"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
