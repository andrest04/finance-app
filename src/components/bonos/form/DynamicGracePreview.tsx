"use client";

import { Card } from "@/components/ui/card";
import { TrendingUp, Info } from "lucide-react";

interface PeriodoGraciaPreview {
  periodo: number;
  tipoGracia: "Sin Gracia" | "Parcial" | "Total";
}

interface DynamicGracePreviewProps {
  esGraciaDinamica: boolean;
  generarVistaGraciaPeriodos: PeriodoGraciaPreview[];
}

export function DynamicGracePreview({
  esGraciaDinamica,
  generarVistaGraciaPeriodos,
}: DynamicGracePreviewProps) {
  if (!esGraciaDinamica || generarVistaGraciaPeriodos.length === 0) {
    return null;
  }

  return (
    <Card className="p-6 bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-orange-600" />
        <h4 className="font-bold text-orange-900">
          Vista Previa - Períodos con Gracia Dinámica
        </h4>
      </div>

      <div className="max-h-64 overflow-y-auto bg-white rounded-lg border border-orange-200">
        <table className="w-full text-sm">
          <thead className="bg-orange-100 sticky top-0">
            <tr>
              <th className="px-3 py-2 text-left font-semibold text-orange-800">
                Período
              </th>
              <th className="px-3 py-2 text-center font-semibold text-orange-800">
                Tipo de Gracia
              </th>
            </tr>
          </thead>
          <tbody>
            {generarVistaGraciaPeriodos.map((periodo, index) => (
              <tr
                key={periodo.periodo}
                className={`border-b border-orange-100 ${
                  index % 2 === 0 ? "bg-white" : "bg-orange-25"
                } hover:bg-orange-50 transition-colors`}
              >
                <td className="px-3 py-2 font-medium text-gray-700">
                  {periodo.periodo}
                </td>
                <td className="px-3 py-2 text-center">
                  {periodo.tipoGracia === "Sin Gracia" && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      🚫 Sin Gracia
                    </span>
                  )}
                  {periodo.tipoGracia === "Parcial" && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                      ⏯️ Gracia Parcial
                    </span>
                  )}
                  {periodo.tipoGracia === "Total" && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                      ⏸️ Gracia Total
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 p-3 bg-orange-100 rounded-lg">
        <div className="flex items-center gap-2 text-sm text-orange-800">
          <Info className="w-4 h-4" />
          <span className="font-medium">
            Total de períodos: {generarVistaGraciaPeriodos.length}
          </span>
        </div>
        <div className="text-xs text-orange-700 mt-1">
          Los tipos de gracia varían según los rangos configurados. Cada período
          tendrá el tipo de gracia correspondiente al rango al que pertenece.
        </div>
      </div>
    </Card>
  );
}
