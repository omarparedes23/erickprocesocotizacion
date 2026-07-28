"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Filter } from "lucide-react";
import {
  CASE_STATUS_FILTER_OPTIONS,
  type CaseStatusFilter,
} from "@/lib/cases/status";

interface CaseStatusFilterSelectProps {
  current: CaseStatusFilter;
}

/** Combobox que filtra /casos por estado vía query param ?estado=..., preservando ?view. */
export function CaseStatusFilterSelect({ current }: CaseStatusFilterSelectProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams.toString());
    const value = event.target.value;
    if (value === "todos") {
      params.delete("estado");
    } else {
      params.set("estado", value);
    }
    router.push(`/casos?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 shadow-2xs">
      <Filter className="size-3.5 text-slate-400 shrink-0" />
      <select
        id="estado-filter"
        value={current}
        onChange={handleChange}
        className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-hidden"
      >
        {CASE_STATUS_FILTER_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
