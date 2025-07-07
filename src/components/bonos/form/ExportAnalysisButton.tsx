"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Download,
  FileText,
  FileSpreadsheet,
  FileCode,
  ChevronDown,
  ChevronUp,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import {
  prepararDatosExportacion,
  exportarAJSON,
  exportarACSV,
  exportarReporteTexto,
} from "@/lib/bono/exportAnalisis";
import { type CalculatedMetrics, type BonoFormData } from "./types";

interface ExportAnalysisButtonProps {
  calculatedMetrics: CalculatedMetrics | null;
  watchedValues: BonoFormData;
}

export function ExportAnalysisButton({
  calculatedMetrics,
  watchedValues,
}: ExportAnalysisButtonProps) {
  const [showExportOptions, setShowExportOptions] = useState(false);

  const handleExport = (formato: "json" | "csv" | "txt") => {
    if (!calculatedMetrics) {
      toast.error("No hay datos calculados para exportar");
      return;
    }

    try {
      const datosExportacion = prepararDatosExportacion(
        watchedValues,
        calculatedMetrics
      );

      switch (formato) {
        case "json":
          exportarAJSON(datosExportacion);
          toast.success("Análisis exportado en formato JSON");
          break;
        case "csv":
          exportarACSV(datosExportacion);
          toast.success("Análisis exportado en formato CSV");
          break;
        case "txt":
          exportarReporteTexto(datosExportacion);
          toast.success("Reporte exportado en formato texto");
          break;
      }
    } catch (error) {
      console.error("Error al exportar:", error);
      toast.error("Error al exportar el análisis");
    }
  };

  const isDisabled = !calculatedMetrics;

  return (
    <Card className="p-4 border-gray-300 bg-gradient-to-br from-gray-50 to-slate-50">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Download className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-800">Exportar Análisis</h3>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="w-4 h-4 text-gray-400 cursor-pointer" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Exporta todos los resultados del análisis</p>
              <p>en diferentes formatos para uso externo</p>
            </TooltipContent>
          </Tooltip>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowExportOptions(!showExportOptions)}
          disabled={isDisabled}
          className="text-sm"
        >
          {showExportOptions ? (
            <>
              <ChevronUp className="mr-1 h-3 w-3" />
              Ocultar
            </>
          ) : (
            <>
              <ChevronDown className="mr-1 h-3 w-3" />
              Opciones
            </>
          )}
        </Button>
      </div>

      {isDisabled && (
        <div className="text-center py-4">
          <p className="text-sm text-gray-500">
            Complete el formulario para habilitar la exportación
          </p>
        </div>
      )}

      {showExportOptions && !isDisabled && (
        <div className="space-y-3">
          <div className="text-xs text-gray-600 mb-3">
            Seleccione el formato de exportación:
          </div>

          <div className="grid grid-cols-1 gap-2">
            {/* Reporte de Texto */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleExport("txt")}
              className="flex items-center justify-start gap-2 h-auto p-3 text-left"
            >
              <FileText className="w-4 h-4 text-blue-600" />
              <div>
                <div className="font-medium text-sm">
                  Reporte Completo (.txt)
                </div>
                <div className="text-xs text-gray-500">
                  Formato legible con todas las métricas
                  {calculatedMetrics?.analisisSemestral &&
                    " + análisis semestral"}
                </div>
              </div>
            </Button>

            {/* CSV */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleExport("csv")}
              className="flex items-center justify-start gap-2 h-auto p-3 text-left"
            >
              <FileSpreadsheet className="w-4 h-4 text-green-600" />
              <div>
                <div className="font-medium text-sm">
                  Datos Estructurados (.csv)
                </div>
                <div className="text-xs text-gray-500">
                  Compatible con Excel y hojas de cálculo
                </div>
              </div>
            </Button>

            {/* JSON */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleExport("json")}
              className="flex items-center justify-start gap-2 h-auto p-3 text-left"
            >
              <FileCode className="w-4 h-4 text-purple-600" />
              <div>
                <div className="font-medium text-sm">
                  Datos Técnicos (.json)
                </div>
                <div className="text-xs text-gray-500">
                  Formato para desarrolladores y APIs
                </div>
              </div>
            </Button>
          </div>

          {/* Información adicional sobre el análisis semestral */}
          {calculatedMetrics?.analisisSemestral && (
            <div className="mt-3 p-2 bg-blue-50 rounded border border-blue-200">
              <div className="text-xs text-blue-800 font-medium mb-1">
                ✨ Análisis Semestral Incluido
              </div>
              <div className="text-xs text-blue-700">
                Este bono incluye análisis específico para pagos semestrales
                con:
              </div>
              <ul className="text-xs text-blue-600 mt-1 ml-2 space-y-0.5">
                <li>• Conversión TEA → TES con fórmulas específicas</li>
                <li>• Precio del bono descontado al TES de mercado</li>
                <li>• TCEA/TREA calculadas desde TIR semestral</li>
                <li>• Duración Macaulay y modificada en años</li>
                <li>• Convexidad ajustada para flujos semestrales</li>
                <li>• Precio máximo basado en COK</li>
              </ul>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
