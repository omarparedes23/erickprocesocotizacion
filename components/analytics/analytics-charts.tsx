"use client";

import { Trophy, TrendingUp, DollarSign, Target, PieChart, Layers, Building } from "lucide-react";

export interface AnalyticsData {
  totalCount: number;
  adjudicadosCount: number;
  enProcesoCount: number;
  noAdjudicadosCount: number;
  winRate: number;
  montoTotalUsd: number;
  montoAdjudicadoUsd: number;
  ticketPromedioUsd: number;
  stageFunnel: Array<{
    stageId: string;
    label: string;
    count: number;
    totalBudgetUsd: number;
  }>;
  topClients: Array<{
    name: string;
    count: number;
    totalBudgetUsd: number;
  }>;
}

interface AnalyticsChartsProps {
  data: AnalyticsData;
}

export function AnalyticsCharts({ data }: AnalyticsChartsProps) {
  // Helper to format currency
  const formatUsd = (amount: number) =>
    `$${amount.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

  const maxStageCount = Math.max(...data.stageFunnel.map((s) => s.count), 1);
  const maxClientBudget = Math.max(...data.topClients.map((c) => c.totalBudgetUsd), 1);

  return (
    <div className="space-y-6">
      {/* 4 Commercial Executive Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Win Rate */}
        <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/50 to-white p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
              Win Rate (Tasa Éxito)
            </span>
            <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <Trophy className="size-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {data.winRate}%
            </span>
            <span className="text-xs font-medium text-emerald-700">
              ({data.adjudicadosCount} adjudicados)
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            Ratio de cotizaciones ganadas sobre cerradas
          </p>
        </div>

        {/* Monto Adjudicado */}
        <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/50 to-white p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-700">
              Monto Adjudicado
            </span>
            <div className="flex size-9 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
              <DollarSign className="size-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {formatUsd(data.montoAdjudicadoUsd)}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            Total en USD de contratos ganados
          </p>
        </div>

        {/* Monto Total Ofertado */}
        <div className="rounded-2xl border border-purple-100 bg-gradient-to-br from-purple-50/50 to-white p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-purple-700">
              Monto Cotizado Total
            </span>
            <div className="flex size-9 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
              <TrendingUp className="size-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {formatUsd(data.montoTotalUsd)}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            Volumen acumulado en cartera de cotización
          </p>
        </div>

        {/* Ticket Promedio */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Ticket Promedio
            </span>
            <div className="flex size-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
              <Target className="size-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {formatUsd(data.ticketPromedioUsd)}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            Promedio estimado por propuesta
          </p>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Embudo de Ventas (Funnel Chart) */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Layers className="size-4 text-blue-600" />
              <h3 className="text-base font-bold text-slate-900">
                Embudo de Cotización (Pipeline Funnel)
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              Por Etapa del BPMN
            </span>
          </div>

          <div className="space-y-4 pt-2">
            {data.stageFunnel.map((stage, idx) => {
              const widthPct = Math.max(
                Math.round((stage.count / maxStageCount) * 100),
                12,
              );
              const stageColors = [
                "bg-blue-600 text-white",
                "bg-indigo-600 text-white",
                "bg-violet-600 text-white",
                "bg-emerald-600 text-white",
              ];
              const color = stageColors[idx % stageColors.length];

              return (
                <div key={stage.stageId} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-800">{stage.label}</span>
                    <span className="text-slate-600 font-bold">
                      {stage.count} casos ({formatUsd(stage.totalBudgetUsd)})
                    </span>
                  </div>

                  <div className="h-7 w-full rounded-xl bg-slate-100 p-0.5 overflow-hidden">
                    <div
                      className={`h-full rounded-lg ${color} flex items-center justify-end px-3 text-[11px] font-bold transition-all duration-700 shadow-xs`}
                      style={{ width: `${widthPct}%` }}
                    >
                      {stage.count > 0 ? `${stage.count}` : ""}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Col: Donut / Outcome Distribution Chart */}
        <div className="lg:col-span-1 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <PieChart className="size-4 text-purple-600" />
              <h3 className="text-base font-bold text-slate-900">
                Estado de Resultados
              </h3>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center py-2 space-y-4">
            {/* Custom Donut Ring SVG */}
            <div className="relative flex size-36 items-center justify-center">
              <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                {/* Background Ring */}
                <path
                  className="text-slate-100"
                  strokeWidth="3.8"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />

                {/* Adjudicado Arc */}
                {data.totalCount > 0 && (
                  <path
                    className="text-emerald-500 stroke-current"
                    strokeWidth="3.8"
                    strokeDasharray={`${(data.adjudicadosCount / data.totalCount) * 100}, 100`}
                    strokeLinecap="round"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                )}
              </svg>
              <div className="absolute flex flex-col items-center text-center">
                <span className="text-2xl font-extrabold text-slate-900">
                  {data.totalCount}
                </span>
                <span className="text-[10px] font-semibold text-slate-400">
                  Total Casos
                </span>
              </div>
            </div>

            {/* Legend */}
            <div className="w-full space-y-2 text-xs">
              <div className="flex items-center justify-between rounded-lg bg-emerald-50/60 p-2">
                <div className="flex items-center gap-2">
                  <div className="size-2.5 rounded-full bg-emerald-500" />
                  <span className="font-semibold text-slate-800">
                    Adjudicados
                  </span>
                </div>
                <span className="font-bold text-slate-900">
                  {data.adjudicadosCount}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-lg bg-amber-50/60 p-2">
                <div className="flex items-center gap-2">
                  <div className="size-2.5 rounded-full bg-amber-500" />
                  <span className="font-semibold text-slate-800">
                    En Proceso / Espera
                  </span>
                </div>
                <span className="font-bold text-slate-900">
                  {data.enProcesoCount}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-lg bg-rose-50/60 p-2">
                <div className="flex items-center gap-2">
                  <div className="size-2.5 rounded-full bg-rose-500" />
                  <span className="font-semibold text-slate-800">
                    No Adjudicados / Decl.
                  </span>
                </div>
                <span className="font-bold text-slate-900">
                  {data.noAdjudicadosCount}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top 5 Clients Table */}
      {data.topClients.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Building className="size-4 text-slate-700" />
            <h3 className="text-base font-bold text-slate-900">
              Top Clientes por Presupuesto Cotizado
            </h3>
          </div>

          <div className="space-y-3">
            {data.topClients.map((client, idx) => {
              const widthPct = Math.max(
                Math.round((client.totalBudgetUsd / maxClientBudget) * 100),
                8,
              );
              return (
                <div key={client.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900">
                      #{idx + 1} {client.name}
                    </span>
                    <span className="font-semibold text-slate-700">
                      {formatUsd(client.totalBudgetUsd)} ({client.count} solicitudes)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-slate-900 transition-all duration-500"
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
