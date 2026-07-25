"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createCase } from "@/app/actions/cases";
import {
  findOrCreateClient,
  generateNextCaseCode,
} from "@/lib/cases/registration";

export async function registerCase(formData: FormData) {
  const type = formData.get("type") as "servicio" | "bien";
  const title = ((formData.get("title") as string) ?? "").trim();
  const clientName = ((formData.get("clientName") as string) ?? "").trim();
  const budgetUsdRaw = (formData.get("budgetUsd") as string) ?? "";
  const budgetUsd = budgetUsdRaw ? Number(budgetUsdRaw) : null;
  const requestedExpress = formData.get("requestedExpress") === "on";
  const deliveryDueAtRaw = (formData.get("deliveryDueAt") as string) ?? "";
  const deliveryDueAt = deliveryDueAtRaw || null;

  const supabase = await createClient();

  let caseId: string;
  try {
    const code = await generateNextCaseCode(supabase);
    const clientId = clientName
      ? await findOrCreateClient(supabase, clientName)
      : null;

    const caso = await createCase({
      code,
      clientId,
      title,
      type,
      budgetUsd,
      requestedExpress,
      deliveryDueAt,
    });

    caseId = caso.id;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    redirect(`/casos/nuevo?error=${encodeURIComponent(message)}`);
  }

  redirect(`/casos/${caseId}`);
}
