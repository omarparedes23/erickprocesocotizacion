import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { AppLayout } from "@/components/layout/app-layout";
import { createClientAction } from "./actions";
import type { Role } from "@/lib/workflow/transitions";

export default async function NuevoClientePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
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

  return (
    <AppLayout
      userEmail={user.email}
      userRole={profile?.role}
      title="Registrar Nuevo Cliente"
      description="Agrega una nueva empresa o cliente a la base de datos."
      actions={
        <Link
          href="/clientes"
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          <span>Volver a Clientes</span>
        </Link>
      }
    >
      <div className="max-w-lg mx-auto rounded-2xl border border-slate-200 bg-white p-8 shadow-2xs space-y-6">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-base font-bold text-slate-900">
            Datos de la Empresa
          </h2>
          <p className="text-xs text-slate-500">
            Registra la razón social y número RUC del cliente
          </p>
        </div>

        <form action={createClientAction} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="name" className="text-xs font-semibold text-slate-700">
              Nombre de la Empresa / Razón Social
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              placeholder="Ej: Industrias Mineras del Perú S.A."
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium focus:border-blue-500 focus:outline-hidden"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="ruc" className="text-xs font-semibold text-slate-700">
              RUC (opcional)
            </label>
            <input
              id="ruc"
              name="ruc"
              type="text"
              placeholder="20123456789"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium focus:border-blue-500 focus:outline-hidden"
            />
          </div>

          {error && (
            <p className="text-xs font-semibold text-rose-600 bg-rose-50 p-3 rounded-xl border border-rose-200" role="alert">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 font-semibold text-xs py-2.5">
            <UserPlus className="size-4 mr-1.5" />
            Registrar Cliente
          </Button>
        </form>
      </div>
    </AppLayout>
  );
}
