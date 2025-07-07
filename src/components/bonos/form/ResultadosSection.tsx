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
  return (
    <>
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
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="text-center">
            <div className="text-sm text-green-600 mb-1">TCEA (Emisor)</div>
            <div className="text-2xl font-bold text-green-700">
              {calculatedMetrics
                ? `${calculatedMetrics.tcea.toFixed(4)}%`
                : "--.--%"}
            </div>
            <div className="text-xs text-green-600 mt-1">
              Incluye todos los costos del emisor
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
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
            <div className="text-center">
              <div className="text-sm text-indigo-600 mb-1">TREA</div>
              <div className="text-xl font-bold text-indigo-700">
                {calculatedMetrics
                  ? `${calculatedMetrics.trea.toFixed(4)}%`
                  : "--.--%"}
              </div>
              <div className="text-xs text-indigo-600 mt-1">Tasa Efectiva</div>
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
              <div className="text-sm text-purple-600 mb-1">Duración</div>
              <div className="text-xl font-bold text-purple-700">
                {calculatedMetrics
                  ? calculatedMetrics.duracion.toFixed(2)
                  : "--"}
              </div>
              <div className="text-xs text-purple-600 mt-1">Períodos</div>
            </div>
          </div>
        </div>

        <div className="mt-4 grid md:grid-cols-2 gap-4">
          <div className="bg-gray-50 p-3 rounded border">
            <div className="text-sm text-gray-600">Total Períodos</div>
            <div className="text-lg font-semibold text-gray-800">
              {calculatedMetrics ? calculatedMetrics.totalPeriodos : "--"}
            </div>
          </div>
          <div className="bg-gray-50 p-3 rounded border">
            <div className="text-sm text-gray-600">Convexidad</div>
            <div className="text-lg font-semibold text-gray-800">
              {calculatedMetrics
                ? calculatedMetrics.convexidad.toFixed(4)
                : "--"}
            </div>
          </div>
        </div>
      </Card>
    </>
  );
}
