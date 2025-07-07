"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Eye, EyeOff, BarChart3, Info, Calculator } from "lucide-react";
import { type CalculatedMetrics, type BonoFormData } from "./types";

interface RealTimeCalculationsPanelProps {
  calculatedMetrics: CalculatedMetrics | null;
  watchedValues: BonoFormData;
}

export function RealTimeCalculationsPanel({
  calculatedMetrics,
  watchedValues,
}: RealTimeCalculationsPanelProps) {
  const [showCalculations, setShowCalculations] = useState(true);

  const frequencyLabels: { [key: string]: string } = {
    "12": "Mensual (12 pagos/año)",
    "6": "Bimestral (6 pagos/año)",
    "4": "Trimestral (4 pagos/año)",
    "3": "Cuatrimestral (3 pagos/año)",
    "2": "Semestral (2 pagos/año)",
    "1": "Anual (1 pago/año)",
  };

  return (
    <div className="space-y-4">
      {/* Toggle Button */}
      <Button
        type="button"
        variant="outline"
        onClick={() => setShowCalculations(!showCalculations)}
        className="w-full"
      >
        {showCalculations ? (
          <>
            <EyeOff className="mr-2 h-4 w-4" />
            Ocultar Cálculos
          </>
        ) : (
          <>
            <Eye className="mr-2 h-4 w-4" />
            Mostrar Cálculos
          </>
        )}
      </Button>

      {showCalculations && (
        <Card className="p-6 bg-gradient-to-br from-gray-50 to-blue-50 border-blue-200">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <h4 className="font-bold text-blue-900">Cálculos en Tiempo Real</h4>
          </div>

          {calculatedMetrics ? (
            <div className="space-y-4">
              {/* Tasas Calculadas */}
              <div className="bg-white p-4 rounded-lg border border-blue-200">
                <h5 className="font-semibold text-gray-800 mb-3">
                  Tasas Calculadas
                </h5>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">TCEA:</span>
                    <span className="font-mono text-sm font-semibold text-green-700">
                      {calculatedMetrics.tcea.toFixed(4)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">TREA:</span>
                    <span className="font-mono text-sm font-semibold text-blue-700">
                      {calculatedMetrics.trea.toFixed(4)}%
                    </span>
                  </div>
                  {/* Mostrar TES solo cuando la frecuencia es semestral */}
                  {calculatedMetrics.tes !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 flex items-center gap-1">
                        TES:
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="w-3 h-3 text-gray-400 cursor-pointer" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Tasa Efectiva Semestral</p>
                            <p>Calculada para frecuencia semestral</p>
                          </TooltipContent>
                        </Tooltip>
                      </span>
                      <span className="font-mono text-sm font-semibold text-purple-700">
                        {calculatedMetrics.tes.toFixed(4)}%
                      </span>
                    </div>
                  )}
                  {/* Métricas adicionales del análisis semestral */}
                  {calculatedMetrics.analisisSemestral && (
                    <>
                      <div className="border-t pt-2 mt-3">
                        <div className="text-xs text-gray-500 mb-2 font-medium">
                          Análisis Semestral:
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-gray-600">
                            Precio Máximo:
                          </span>
                          <span className="font-mono text-xs font-semibold text-orange-700">
                            {watchedValues.moneda}{" "}
                            {calculatedMetrics.analisisSemestral.precioMaximoMercado.toFixed(
                              2
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-gray-600">
                            TES Mercado:
                          </span>
                          <span className="font-mono text-xs font-semibold text-indigo-700">
                            {calculatedMetrics.analisisSemestral.tesMercado.toFixed(
                              4
                            )}
                            %
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Método Francés */}
              <div className="bg-white p-4 rounded-lg border border-blue-200">
                <h5 className="font-semibold text-gray-800 mb-3">
                  Método Francés
                </h5>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">
                      Total Períodos:
                    </span>
                    <span className="font-mono text-sm font-semibold">
                      {calculatedMetrics.totalPeriodos}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">
                      Cuota Constante:
                    </span>
                    <span className="font-mono text-sm font-semibold text-purple-700">
                      {watchedValues.moneda}{" "}
                      {calculatedMetrics.cuotaConstante.toLocaleString(
                        "es-PE",
                        { minimumFractionDigits: 2 }
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">
                      Total Intereses:
                    </span>
                    <span className="font-mono text-sm font-semibold text-orange-700">
                      {watchedValues.moneda}{" "}
                      {calculatedMetrics.totalIntereses.toLocaleString(
                        "es-PE",
                        { minimumFractionDigits: 2 }
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">
                      Total a Pagar:
                    </span>
                    <span className="font-mono text-sm font-semibold text-red-700">
                      {watchedValues.moneda}{" "}
                      {calculatedMetrics.totalPagado.toLocaleString("es-PE", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Frecuencia Seleccionada */}
              <div className="bg-white p-4 rounded-lg border border-blue-200">
                <h5 className="font-semibold text-gray-800 mb-3">
                  Frecuencia Seleccionada
                </h5>
                <p className="text-sm text-gray-600">
                  {frequencyLabels[watchedValues.frecuenciaPago] ||
                    "No seleccionada"}
                </p>
              </div>

              {/* Recommendations */}
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <h5 className="font-semibold text-yellow-800 mb-2">
                  💡 Recomendaciones
                </h5>
                <div className="space-y-1 text-xs text-yellow-700">
                  {calculatedMetrics.trea > 15 && (
                    <p>• TREA alta: Considere reducir comisiones</p>
                  )}
                  {calculatedMetrics.totalPeriodos > 20 && (
                    <p>• Muchos períodos: Evalúe impacto en flujo</p>
                  )}
                  {watchedValues.frecuenciaPago === "2" && (
                    <p>• Pagos semestrales: Mayor control de liquidez</p>
                  )}
                  {calculatedMetrics.tes && calculatedMetrics.tes > 8 && (
                    <p>• TES elevada: Considere ajustar la tasa anual</p>
                  )}
                  {calculatedMetrics.cuotaConstante >
                    parseFloat(watchedValues.valorNominal || "0") * 0.2 && (
                    <p>• Cuota alta: Verifique capacidad de pago</p>
                  )}
                  {/* Recomendaciones específicas del análisis semestral */}
                  {calculatedMetrics.analisisSemestral && (
                    <>
                      {calculatedMetrics.analisisSemestral.duracionModificada >
                        5 && (
                        <p>
                          • Alta duración modificada: Sensible a cambios de tasa
                        </p>
                      )}
                      {calculatedMetrics.analisisSemestral.convexidadSemestral >
                        50 && (
                        <p>• Alta convexidad: Buena protección contra riesgo</p>
                      )}
                      {calculatedMetrics.analisisSemestral.precioMaximoMercado >
                        parseFloat(watchedValues.valorNominal || "0") * 1.1 && (
                        <p>
                          • Precio máximo alto: Buen potencial de valorización
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Calculator className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">
                Complete los campos principales para ver los cálculos en tiempo
                real
              </p>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
