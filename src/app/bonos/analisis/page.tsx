"use client";

import { useState } from "react";
import SelectorBonos from "@/components/bonos/BonoSelector";
import TablaFlujosCaja from "@/components/bonos/FlowTable";
import ProtectedRoute from "@/components/auth/RouteGuard";
import type { BonoData } from "@/lib/bonoUtils";
import Link from "next/link";
import {
  Calculator,
  Lightbulb,
  BarChart3,
  Sigma,
  ExternalLink,
} from "lucide-react";

export default function AnalisisBonosPage() {
  const [selectedBonos, setSelectedBonos] = useState<
    (BonoData & { id: string })[]
  >([]);

  return (
    <ProtectedRoute requiredRole={undefined}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        {/* Header Mejorado */}
        <div className="bg-white shadow-lg border-b border-blue-100 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg transform hover:scale-105 transition-transform duration-200">
                  <Calculator className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    Análisis de Bonos - Método Francés
                  </h1>{" "}
                  <p className="text-gray-600 mt-2">
                    Análisis detallado de flujos de caja con cuotas constantes
                  </p>
                  <div className="mt-4">
                    <Link
                      href="/formulas"
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                    >
                      <Sigma className="w-4 h-4" />
                      Ver Compendio de Fórmulas
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>

              {/* Badge de Estado */}
              {selectedBonos.length > 0 && (
                <div className="animate-in slide-in-from-right duration-500">
                  <div className="px-4 py-2 bg-gradient-to-r from-green-100 to-emerald-100 border border-green-200 rounded-full">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium text-green-700">
                        {selectedBonos.length} bono
                        {selectedBonos.length !== 1 ? "s" : ""} en análisis
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Contenido Principal */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Sección de Análisis Integrada */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200">
            {/* Header de la sección */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-xl">
              <div className="flex items-center gap-3">
                <BarChart3 className="w-7 h-7" />
                <div>
                  <p className="text-blue-100 text-sm">
                    Selecciona un bono para ver su tabla de amortización con
                    el método francés
                  </p>
                </div>
              </div>
            </div>
            {/* Selector de Bonos */}
            <div className="p-6 border-b border-gray-200">
              <SelectorBonos onBonoSeleccionado={setSelectedBonos} />
            </div>
            {/* Tablas de Flujos de Caja */}
            {selectedBonos.length > 0 && (
              <div className="p-6">
                {selectedBonos.map((bono) => (
                  <div
                    key={bono.id}
                    className="animate-in slide-in-from-bottom duration-500"
                  >
                    <TablaFlujosCaja bono={bono} />
                  </div>
                ))}
              </div>
            )}
            {/* Estado Vacío */}
            {selectedBonos.length === 0 && (
              <div className="p-12 text-center">
                <div className="flex flex-col items-center gap-6">
                  <div className="relative">
                    <div className="p-6 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-full shadow-lg">
                      <Calculator className="w-12 h-12 text-blue-600" />
                    </div>
                    <div className="absolute -top-2 -right-2 p-2 bg-yellow-400 rounded-full shadow-md">
                      <Lightbulb className="w-4 h-4 text-yellow-800" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">
                      ¡Selecciona un bono para analizar!
                    </h3>
                    <p className="text-gray-600 max-w-md leading-relaxed">
                      Usa el selector de arriba para elegir un bono y ver
                      inmediatamente su tabla de amortización.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
