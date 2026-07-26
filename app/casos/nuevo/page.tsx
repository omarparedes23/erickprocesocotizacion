import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { AppLayout } from "@/components/layout/app-layout";
import { registerCase } from "./actions";
import type { Role } from "@/lib/workflow/transitions";

export default async function NuevoCasoPage({
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

  const { data: clients } = await supabase
    .from("tume_clients")
    .select("name")
    .order("name")
    .returns<{ name: string }[]>();

  return (
    <AppLayout
      userEmail={user.email}
      userRole={profile?.role}
      title="Registrar Nuevo Caso"
      description="Inicia un nuevo flujo de cotización en el sistema."
      actions={
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          <span>Volver al Dashboard</span>
        </Link>
      }
    >
      <div className="max-w-2xl mx-auto rounded-2xl border border-slate-200 bg-white p-8 shadow-2xs space-y-6">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-base font-bold text-slate-900">
            Formulario de Solicitud
          </h2>
          <p className="text-xs text-slate-500">
            Ingresa los datos iniciales para la solicitud de cotización
          </p>
        </div>

        <form action={registerCase} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="type" className="text-xs font-semibold text-slate-700">
                Tipo de Requerimiento
              </label>
              <select
                id="type"
                name="type"
                required
                defaultValue="servicio"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium focus:border-blue-500 focus:outline-hidden"
              >
                <option value="servicio">Servicio</option>
                <option value="bien">Bien</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="clientName" className="text-xs font-semibold text-slate-700">
                Cliente
              </label>
              <input
                id="clientName"
                name="clientName"
                type="text"
                list="clientes-existentes"
                autoComplete="off"
                placeholder="Nombre de cliente..."
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium focus:border-blue-500 focus:outline-hidden"
              />
              <datalist id="clientes-existentes">
                {clients?.map((c) => <option key={c.name} value={c.name} />)}
              </datalist>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="title" className="text-xs font-semibold text-slate-700">
              Nombre / Título de la Solicitud
            </label>
            <input
              id="title"
              name="title"
              type="text"
              required
              placeholder="Ej: Mantenimiento eléctrico preventivo - Planta Norte"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium focus:border-blue-500 focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="budgetUsd" className="text-xs font-semibold text-slate-700">
                Presupuesto Estimado (USD)
              </label>
              <input
                id="budgetUsd"
                name="budgetUsd"
                type="number"
                min="0"
                step="0.01"
                placeholder="3000"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="deliveryDueAt" className="text-xs font-semibold text-slate-700">
                Fecha Límite de Entrega
              </label>
              <input
                id="deliveryDueAt"
                name="deliveryDueAt"
                type="date"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium focus:border-blue-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="flex items-center gap-2.5 rounded-xl border border-amber-200 bg-amber-50/60 p-3.5">
            <input
              id="requestedExpress"
              name="requestedExpress"
              type="checkbox"
              className="size-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
            />
            <label htmlFor="requestedExpress" className="text-xs font-medium text-amber-900 cursor-pointer">
              Solicitar prioridad Express (aplica si el presupuesto es menor a $5,000 USD)
            </label>
          </div>

          {error && (
            <p className="text-xs font-semibold text-rose-600 bg-rose-50 p-3 rounded-xl border border-rose-200" role="alert">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 font-semibold text-xs py-2.5">
            <PlusCircle className="size-4 mr-1.5" />
            Registrar Solicitud
          </Button>
        </form>
      </div>
    </AppLayout>
  );
}
