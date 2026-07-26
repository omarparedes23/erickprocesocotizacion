"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { findOrCreateClient } from "@/lib/cases/registration";

export async function createClientAction(formData: FormData) {
  const name = ((formData.get("name") as string) ?? "").trim();
  const rucRaw = ((formData.get("ruc") as string) ?? "").trim();
  const ruc = rucRaw || null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("No autenticado");
  }

  try {
    await findOrCreateClient(supabase, name, ruc);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    redirect(`/clientes/nuevo?error=${encodeURIComponent(message)}`);
  }

  redirect("/clientes");
}
