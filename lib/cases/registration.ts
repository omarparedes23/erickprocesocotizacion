import type { createClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

/**
 * Genera el código correlativo del próximo caso a partir del conteo de filas
 * existentes en `tume_cases`. No hay secuencia dedicada en la base de datos,
 * así que el código es simplemente `count + 1` (sin prefijo).
 */
export async function generateNextCaseCode(
  supabase: SupabaseServerClient,
): Promise<string> {
  const { count, error } = await supabase
    .from("tume_cases")
    .select("*", { count: "exact", head: true });

  if (error) {
    throw new Error(`No se pudo generar el código del caso: ${error.message}`);
  }

  return String((count ?? 0) + 1);
}

/**
 * Busca un cliente existente por nombre (case-insensitive). Si no existe, lo
 * crea. El formulario de registro no tiene selector de clientes: el usuario
 * escribe el nombre libremente y esta función resuelve el `client_id`.
 */
export async function findOrCreateClient(
  supabase: SupabaseServerClient,
  name: string,
  ruc?: string | null,
): Promise<string> {
  const { data: existing, error: findError } = await supabase
    .from("tume_clients")
    .select("id")
    .ilike("name", name)
    .maybeSingle();

  if (findError) {
    throw new Error(`No se pudo buscar el cliente: ${findError.message}`);
  }

  if (existing) {
    return existing.id as string;
  }

  const { data: created, error: insertError } = await supabase
    .from("tume_clients")
    .insert({ name, ruc: ruc ?? null })
    .select("id")
    .single();

  if (insertError || !created) {
    throw new Error(
      `No se pudo crear el cliente: ${insertError?.message ?? "sin datos"}`,
    );
  }

  return created.id as string;
}
