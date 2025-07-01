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
        <header className="bg-white shadow border-b border-blue-100 sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-sm">
                <Calculator className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
                  Análisis de Bonos <span className="text-blue-600">- Método Francés</span>
                </h1>
                <p className="text-gray-500 text-sm sm:text-base mt-1">
                  Flujos de caja con cuotas constantes
                </p>
              </div>
            </div>
            <div className="hidden sm:block mt-2">
              <Link
                href="/formulas"
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 border border-blue-100 text-sm transition-colors"
              >
                <Sigma className="w-4 h-4" />
                Ver Fórmulas
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </header>

        {/* Contenido Principal */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Selector de Bonos - Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow border border-gray-100 lg:sticky lg:top-[6.5rem] lg:max-h-[calc(100vh-7.5rem)] lg:overflow-auto">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-t-xl">
                  <div className="flex items-center gap-3">
                    <BarChart3 className="w-5 h-5" />
                    <div>
                      <h3 className="font-semibold text-sm">Seleccionar Bono</h3>
                      <p className="text-blue-100 text-xs mt-1">
                        Elige un bono para analizar
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <SelectorBonos onBonoSeleccionado={setSelectedBonos} />
                </div>
              </div>
            </div>

            {/* Área Principal - Tabla de Flujos */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-2xl shadow border border-gray-100">
                {/* Header de la Tabla */}
                <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-2xl">
                  <Calculator className="w-6 h-6 text-green-600" />
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 leading-tight">Tabla de Flujos de Caja</h2>
                    <p className="text-green-700 text-xs mt-0.5">Método Francés - Cuotas Constantes</p>
                  </div>
                  {selectedBonos.length > 0 && (
                    <div className="ml-auto flex items-center gap-2 px-3 py-1 bg-green-500/10 rounded-full">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-xs font-medium text-green-700">
                        {selectedBonos.length} bono seleccionado
                      </span>
                    </div>
                  )}
                </div>

                {/* Contenido de la Tabla */}
                <div className="p-6">
                  {selectedBonos.length > 0 ? (
                    selectedBonos.map((bono) => (
                      <div
                        key={bono.id}
                        className="animate-in slide-in-from-bottom duration-500"
                      >
                        <TablaFlujosCaja bono={bono} />
                      </div>
                    ))
                  ) : (
                    /* Estado Vacío Mejorado */
                    <div className="text-center py-20">
                      <div className="flex flex-col items-center gap-6">
                        <div className="relative">
                          <div className="p-10 bg-gradient-to-br from-green-100 to-emerald-200 rounded-full shadow-lg">
                            <Calculator className="w-20 h-20 text-green-600" />
                          </div>
                          <div className="absolute -top-4 -right-4 p-4 bg-yellow-400 rounded-full shadow-md">
                            <Lightbulb className="w-7 h-7 text-yellow-800" />
                          </div>
                        </div>
                        <div className="max-w-md">
                          <h3 className="text-2xl font-bold text-gray-800 mb-3">
                            ¡Selecciona un bono para analizar!
                          </h3>
                          <p className="text-gray-600 leading-relaxed mb-6">
                            Usa el selector de la izquierda para elegir un bono y ver
                            inmediatamente su tabla de amortización detallada.
                          </p>
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <p className="text-sm text-blue-700">
                              <strong>💡 Tip:</strong> La tabla mostrará todos los períodos, 
                              intereses, amortizaciones y saldos del bono seleccionado.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
} 