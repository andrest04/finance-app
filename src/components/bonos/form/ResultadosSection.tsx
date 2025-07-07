"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TrendingUp, BarChart3, AlertCircle } from "lucide-react";
import { type CalculatedMetrics } from "./types";

interface ResultadosSectionProps {
  calculatedMetrics: CalculatedMetrics | null;
}

export function ResultadosSection({
  calculatedMetrics,
}: ResultadosSectionProps) {
  // Si hay análisis semestral disponible, mostrar solo esos resultados (más precisos)
  // Si no, mostrar los resultados tradicionales
  const usarAnalisisSemestral = calculatedMetrics?.analisisSemestral;

  return (
    <>
      {/* Información explicativa cuando hay análisis semestral */}
      {usarAnalisisSemestral && (
        <Card className="p-4 border-blue-200 bg-blue-50">
          <div className="text-sm text-blue-800">
            <div className="font-medium mb-1">💡 Análisis Semestral Activo</div>
            <p>
              Se han detectado pagos semestrales. Los valores de TCEA y TREA que
              se muestran a continuación son calculados usando las fórmulas
              específicas para bonos semestrales con conversión exacta de TIR
              semestral a tasa anual: <code>(1 + TIR_sem)^2 - 1</code>
            </p>
          </div>
        </Card>
      )}

      {/* RESULTADOS DEL EMISOR */}
      <Card className="p-6 border-green-300 bg-white shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="w-5 h-5 text-green-600" />
          <h3 className="text-xl font-bold text-green-900">
            Resultados del Emisor
          </h3>
          <Tooltip>
            <TooltipTrigger asChild>
              <AlertCircle className="w-4 h-4 text-green-400 cursor-pointer" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Tasa de Costo Efectiva Anual que asume el emisor</p>
              {usarAnalisisSemestral && (
                <p>Calculada con análisis semestral específico</p>
              )}
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="text-center">
            <div className="text-sm text-green-600 mb-1">
              TCEA (Emisor)
              {usarAnalisisSemestral && (
                <span className="ml-2 text-xs bg-green-100 px-2 py-1 rounded">
                  Análisis Semestral
                </span>
              )}
            </div>
            <div className="text-2xl font-bold text-green-700">
              {calculatedMetrics
                ? usarAnalisisSemestral
                  ? `${calculatedMetrics.analisisSemestral!.tceaEmisor.toFixed(
                      4
                    )}%`
                  : `${calculatedMetrics.tcea.toFixed(4)}%`
                : "--.--%"}
            </div>
            <div className="text-xs text-green-600 mt-1">
              {usarAnalisisSemestral
                ? "Incluye todos los costos con TIR semestral exacta"
                : "Incluye todos los costos del emisor"}
            </div>
          </div>
        </div>
      </Card>

      {/* RESULTADOS DEL BONISTA */}
      <Card className="p-6 border-indigo-300 bg-white shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 className="w-5 h-5 text-indigo-600" />
          <h3 className="text-xl font-bold text-indigo-900">
            Resultados del Bonista
          </h3>
          <Tooltip>
            <TooltipTrigger asChild>
              <AlertCircle className="w-4 h-4 text-indigo-400 cursor-pointer" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Métricas de rentabilidad y riesgo para el inversionista</p>
              {usarAnalisisSemestral && (
                <p>Calculadas con análisis semestral específico</p>
              )}
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
            <div className="text-center">
              <div className="text-sm text-indigo-600 mb-1">
                TREA
                {usarAnalisisSemestral && (
                  <span className="ml-2 text-xs bg-indigo-100 px-2 py-1 rounded">
                    Análisis Semestral
                  </span>
                )}
              </div>
              <div className="text-xl font-bold text-indigo-700">
                {calculatedMetrics
                  ? usarAnalisisSemestral
                    ? `${calculatedMetrics.analisisSemestral!.treaInversionista.toFixed(
                        4
                      )}%`
                    : `${calculatedMetrics.trea.toFixed(4)}%`
                  : "--.--%"}
              </div>
              <div className="text-xs text-indigo-600 mt-1">
                {usarAnalisisSemestral
                  ? "Tasa efectiva con TIR semestral exacta"
                  : "Tasa Efectiva"}
              </div>
            </div>
          </div>

          {calculatedMetrics?.tes !== undefined && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="text-center">
                <div className="text-sm text-blue-600 mb-1">TES</div>
                <div className="text-xl font-bold text-blue-700">
                  {calculatedMetrics.tes.toFixed(4)}%
                </div>
                <div className="text-xs text-blue-600 mt-1">Tasa Semestral</div>
              </div>
            </div>
          )}

          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <div className="text-center">
              <div className="text-sm text-purple-600 mb-1">
                {calculatedMetrics?.analisisSemestral
                  ? "Duración Macaulay"
                  : "Duración"}
              </div>
              <div className="text-xl font-bold text-purple-700">
                {calculatedMetrics?.analisisSemestral
                  ? `${calculatedMetrics.analisisSemestral.duracionMacaulay.toFixed(
                      2
                    )} años`
                  : calculatedMetrics
                  ? calculatedMetrics.duracion.toFixed(2)
                  : "--"}
              </div>
              <div className="text-xs text-purple-600 mt-1">
                {calculatedMetrics?.analisisSemestral ? "Años" : "Períodos"}
              </div>
            </div>
          </div>
        </div>

        {/* Análisis Semestral Completo (solo para frecuencia semestral) */}
        {calculatedMetrics?.analisisSemestral && (
          <div className="mt-6 space-y-4">
            <h4 className="font-semibold text-indigo-800 border-b border-indigo-200 pb-2">
              📊 Información Adicional del Análisis Semestral
            </h4>

            {/* Precio Máximo del Bono */}
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h5 className="font-medium text-green-800 mb-3">
                Precio del Bono
              </h5>
              <div className="text-center">
                <div className="text-sm text-green-600 mb-1">
                  Precio Máximo (COK)
                </div>
                <div className="text-2xl font-bold text-green-700">
                  {calculatedMetrics.analisisSemestral.precioMaximoMercado.toLocaleString(
                    "es-PE",
                    {
                      style: "currency",
                      currency: "PEN",
                      minimumFractionDigits: 2,
                    }
                  )}
                </div>
                <div className="text-xs text-green-600 mt-1">
                  Basado en la tasa COK de mercado
                </div>
              </div>
            </div>

            {/* Indicadores de Riesgo */}
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <h5 className="font-medium text-purple-800 mb-3">
                Indicadores de Riesgo
              </h5>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-sm text-purple-600 mb-1">
                    Duración Modificada
                  </div>
                  <div className="text-lg font-bold text-purple-700">
                    {calculatedMetrics.analisisSemestral.duracionModificada.toFixed(
                      4
                    )}
                  </div>
                  <div className="text-xs text-purple-600">Años</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-purple-600 mb-1">Convexidad</div>
                  <div className="text-lg font-bold text-purple-700">
                    {calculatedMetrics.analisisSemestral.convexidadSemestral.toFixed(
                      4
                    )}
                  </div>
                  <div className="text-xs text-purple-600">Base anual</div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-4">
          <div className="bg-gray-50 p-3 rounded border text-center">
            <div className="text-sm text-gray-600">Total Períodos</div>
            <div className="text-lg font-semibold text-gray-800">
              {calculatedMetrics ? calculatedMetrics.totalPeriodos : "--"}
            </div>
          </div>
        </div>
      </Card>
    </>
  );
}
