import { Button } from "@/components/ui/button";
import { createClientAction } from "./actions";

export default async function NuevoClientePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 py-8">
      <form
        action={createClientAction}
        className="w-full max-w-lg space-y-4 rounded-lg border bg-white p-8 shadow-sm"
      >
        <div className="space-y-1">
          <h1 className="text-xl font-semibold">Nuevo cliente</h1>
          <p className="text-sm text-neutral-500">
            Registrá un cliente nuevo.
          </p>
        </div>

        <div className="space-y-1">
          <label htmlFor="name" className="text-sm font-medium">
            Nombre
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="ruc" className="text-sm font-medium">
            RUC (opcional)
          </label>
          <input
            id="ruc"
            name="ruc"
            type="text"
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        <Button type="submit" className="w-full">
          Registrar cliente
        </Button>
      </form>
    </main>
  );
}
