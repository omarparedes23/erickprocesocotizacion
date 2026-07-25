import { Button } from "@/components/ui/button";
import { registerCase } from "./actions";

export default async function NuevoCasoPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 py-8">
      <form
        action={registerCase}
        className="w-full max-w-lg space-y-4 rounded-lg border bg-white p-8 shadow-sm"
      >
        <div className="space-y-1">
          <h1 className="text-xl font-semibold">Nuevo caso</h1>
          <p className="text-sm text-neutral-500">
            Registrá una nueva solicitud de cotización.
          </p>
        </div>

        <div className="space-y-1">
          <label htmlFor="type" className="text-sm font-medium">
            Tipo
          </label>
          <select
            id="type"
            name="type"
            required
            defaultValue="servicio"
            className="w-full rounded-md border px-3 py-2 text-sm"
          >
            <option value="servicio">Servicio</option>
            <option value="bien">Bien</option>
          </select>
        </div>

        <div className="space-y-1">
          <label htmlFor="title" className="text-sm font-medium">
            Nombre / título
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="clientName" className="text-sm font-medium">
            Cliente
          </label>
          <input
            id="clientName"
            name="clientName"
            type="text"
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="budgetUsd" className="text-sm font-medium">
            Presupuesto (USD)
          </label>
          <input
            id="budgetUsd"
            name="budgetUsd"
            type="number"
            min="0"
            step="0.01"
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            id="requestedExpress"
            name="requestedExpress"
            type="checkbox"
            className="size-4 rounded border"
          />
          <label htmlFor="requestedExpress" className="text-sm font-medium">
            Marcar como urgente/express (solo aplica si el presupuesto es
            menor a $5000)
          </label>
        </div>

        <div className="space-y-1">
          <label htmlFor="deliveryDueAt" className="text-sm font-medium">
            Fecha de entrega
          </label>
          <input
            id="deliveryDueAt"
            name="deliveryDueAt"
            type="date"
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        <Button type="submit" className="w-full">
          Registrar caso
        </Button>
      </form>
    </main>
  );
}
