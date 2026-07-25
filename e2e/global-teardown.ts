import path from "node:path";
import { createClient } from "@supabase/supabase-js";

/**
 * Global teardown de Playwright: borra TODOS los datos [E2E] creados durante
 * la suite contra el proyecto Supabase compartido (axcrubvtpqcyscizgoee).
 * Corre como proceso Node aparte (fuera del contexto de Next), así que
 * `.env.local` no se carga automáticamente: hay que leerlo a mano acá.
 *
 * Orden de borrado por las FKs: tume_case_transitions -> tume_tasks ->
 * tume_cases, y por separado tume_clients. RLS es permisiva para cualquier
 * usuario autenticado (ver supabase/migrations/0001_init.sql), así que
 * cualquiera de los 4 usuarios de prueba puede borrar.
 */
async function main(): Promise<void> {
  const envPath = path.resolve(__dirname, "..", ".env.local");
  try {
    process.loadEnvFile(envPath);
  } catch (err) {
    console.warn(
      `[e2e:teardown] No se pudo cargar ${envPath} (${(err as Error).message}). ` +
        "Se usarán las variables de entorno del proceso, si están seteadas.",
    );
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    console.error(
      "[e2e:teardown] Faltan NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY " +
        "(ni en .env.local ni en el entorno del proceso). NO se limpiaron los datos " +
        "[E2E] de esta corrida — hacelo manualmente contra axcrubvtpqcyscizgoee.",
    );
    return;
  }

  const supabase = createClient(url, anonKey);

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: "tume.comercial@example.com",
    password: "TumeTest2026!",
  });

  if (signInError) {
    console.error(
      `[e2e:teardown] No se pudo autenticar para limpiar datos [E2E]: ${signInError.message}. ` +
        "NO se limpiaron los datos de esta corrida.",
    );
    return;
  }

  const { data: cases, error: findCasesError } = await supabase
    .from("tume_cases")
    .select("id")
    .ilike("title", "[E2E]%");

  if (findCasesError) {
    console.error(
      `[e2e:teardown] Error buscando casos [E2E]: ${findCasesError.message}`,
    );
  }

  const caseIds = (cases ?? []).map((c) => c.id as string);

  if (caseIds.length > 0) {
    const { error: transitionsError, count: transitionsCount } = await supabase
      .from("tume_case_transitions")
      .delete({ count: "exact" })
      .in("case_id", caseIds);
    if (transitionsError) {
      console.error(
        `[e2e:teardown] Error borrando tume_case_transitions: ${transitionsError.message}`,
      );
    } else {
      console.log(
        `[e2e:teardown] tume_case_transitions: ${transitionsCount ?? 0} filas borradas.`,
      );
    }

    const { error: tasksError, count: tasksCount } = await supabase
      .from("tume_tasks")
      .delete({ count: "exact" })
      .in("case_id", caseIds);
    if (tasksError) {
      console.error(`[e2e:teardown] Error borrando tume_tasks: ${tasksError.message}`);
    } else {
      console.log(`[e2e:teardown] tume_tasks: ${tasksCount ?? 0} filas borradas.`);
    }

    const { error: casesError, count: casesCount } = await supabase
      .from("tume_cases")
      .delete({ count: "exact" })
      .in("id", caseIds);
    if (casesError) {
      console.error(`[e2e:teardown] Error borrando tume_cases: ${casesError.message}`);
    } else {
      console.log(`[e2e:teardown] tume_cases: ${casesCount ?? 0} filas borradas.`);
    }
  } else {
    console.log("[e2e:teardown] No se encontraron casos [E2E] para borrar.");
  }

  const { error: clientsError, count: clientsCount } = await supabase
    .from("tume_clients")
    .delete({ count: "exact" })
    .ilike("name", "[E2E]%");

  if (clientsError) {
    console.error(
      `[e2e:teardown] Error borrando tume_clients: ${clientsError.message}`,
    );
  } else {
    console.log(`[e2e:teardown] tume_clients: ${clientsCount ?? 0} filas borradas.`);
  }

  await supabase.auth.signOut();
}

export default main;
