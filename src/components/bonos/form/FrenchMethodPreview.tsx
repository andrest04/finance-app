"use client";

import { Card } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import { type CalculatedMetrics, type BonoFormData } from "./types";

interface FrenchMethodPreviewProps {
  calculatedMetrics: CalculatedMetrics | null;
  watchedValues: BonoFormData;
}

export function FrenchMethodPreview({
  calculatedMetrics,
  watchedValues,
}: FrenchMethodPreviewProps) {
  if (!calculatedMetrics) {
    return null;
  }

  return (
    <Card className="p-6 border-indigo-300 bg-gradient-to-br from-indigo-50 to-purple-50 shadow-sm">
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 className="w-5 h-5 text-indigo-600" />
        <h3 className="text-xl font-bold text-indigo-900">
          Vista Previa - Método Francés
        </h3>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border border-indigo-200">
          <div className="text-sm text-gray-600 mb-1">Cuotas Constantes</div>
          <div className="text-lg font-bold text-indigo-700">
            {watchedValues.moneda}{" "}
            {calculatedMetrics.cuotaConstante.toLocaleString("es-PE", {
              minimumFractionDigits: 2,
            })}
          </div>
          <div className="text-xs text-gray-500">
            Durante {calculatedMetrics.totalPeriodos} períodos
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-indigo-200">
          <div className="text-sm text-gray-600 mb-1">Total Intereses</div>
          <div className="text-lg font-bold text-orange-700">
            {watchedValues.moneda}{" "}
            {calculatedMetrics.totalIntereses.toLocaleString("es-PE", {
              minimumFractionDigits: 2,
            })}
          </div>
          <div className="text-xs text-gray-500">
            {(
              (calculatedMetrics.totalIntereses /
                parseFloat(watchedValues.valorNominal || "1")) *
              100
            ).toFixed(1)}
            % del VN
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-indigo-200">
          <div className="text-sm text-gray-600 mb-1">TREA Final</div>
          <div className="text-lg font-bold text-blue-700">
            {calculatedMetrics.trea.toFixed(4)}%
          </div>
          <div className="text-xs text-gray-500">
            Rendimiento efectivo anual
          </div>
        </div>
      </div>
    </Card>
  );
}
