"use client";

import { useState } from "react";
import ComparadorBonos from "@/components/bonos/ComparadorBonos";
import TablaFlujosCaja from "@/components/bonos/TablaFlujosCaja";
import ProtectedRoute from "@/components/auth/RouteGuard";
import { Card } from "@/components/ui/card";
import type { BonoData } from "@/lib/bonoUtils";
import Link from "next/link";
import {
  Calculator,
  TrendingUp,
  BookOpen,
  Target,
  Lightbulb,
  BarChart3,
  DollarSign,
  Clock,
  PieChart,
  Activity,
  Sigma,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export default function AnalisisBonosPage() {
  const [selectedBonos, setSelectedBonos] = useState<
    (BonoData & { id: string })[]
  >([]); // Estado para controlar qué tarjetas están expandidas
  const [expandedCards, setExpandedCards] = useState<{
    [key: string]: boolean;
  }>({
    metodo: true,
    formulas: false,
    conceptos: false,
    valoracion: false,
  }); // Función para toggle del estado de expansión
  const toggleCard = (cardId: string) => {
    setExpandedCards((prev) => ({
      ...prev,
      [cardId]: !prev[cardId],
    }));
  };

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
        {/* Contenido Principal */}{" "}
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Columna Principal - Análisis */}
            <div className="lg:col-span-3 space-y-6">
              {/* Sección de Análisis Integrada */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200">
                {/* Header de la sección */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-xl">
                  <div className="flex items-center gap-3">
                    <BarChart3 className="w-7 h-7" />
                    <div>
                      {" "}
                      <h2 className="text-2xl font-bold">Análisis de Bono</h2>
                      <p className="text-blue-100 text-sm mt-1">
                        Selecciona un bono para ver su tabla de amortización con
                        el método francés
                      </p>
                    </div>
                  </div>
                </div>
                {/* Selector de Bonos */}
                <div className="p-6 border-b border-gray-200">
                  <ComparadorBonos onBonosSeleccionados={setSelectedBonos} />
                </div>{" "}
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

            {/* Sidebar - Conceptos y Fórmulas */}
            <div className="lg:col-span-1 space-y-6">
              {" "}
              {/* Información del Método Francés */}
              <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => toggleCard("metodo")}
                >
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-blue-900">
                      Método Francés
                    </h3>
                  </div>
                  {expandedCards.metodo ? (
                    <ChevronUp className="w-5 h-5 text-blue-600" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-blue-600" />
                  )}
                </div>
                {expandedCards.metodo && (
                  <div className="space-y-4 mt-4">
                    <div>
                      <h4 className="font-medium text-blue-800 mb-2">
                        ¿Qué es?
                      </h4>
                      <p className="text-sm text-blue-700">
                        Sistema de amortización donde las{" "}
                        <strong>cuotas son constantes</strong>, pero varían los
                        intereses y la amortización del capital.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-blue-800 mb-2">
                        Característica Principal
                      </h4>
                      <p className="text-sm text-blue-700">
                        Al inicio se pagan más intereses y menos capital. Con el
                        tiempo, disminuyen los intereses y aumenta la
                        amortización.
                      </p>
                    </div>
                  </div>
                )}
              </Card>{" "}
              {/* Fórmulas Principales */}
              <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => toggleCard("formulas")}
                >
                  <div className="flex items-center gap-3">
                    <Target className="w-5 h-5 text-green-600" />
                    <h3 className="text-lg font-semibold text-green-900">
                      Fórmulas Clave
                    </h3>
                  </div>
                  {expandedCards.formulas ? (
                    <ChevronUp className="w-5 h-5 text-green-600" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-green-600" />
                  )}
                </div>
                {expandedCards.formulas && (
                  <div className="space-y-4 mt-4">
                    <div>
                      {" "}
                      <h4 className="font-medium text-green-800 mb-2">
                        Cuota Constante (C)
                      </h4>
                      <div className="bg-white p-3 rounded-lg border border-green-200 hover:bg-green-25 transition-colors duration-200">
                        <code className="text-sm text-green-700">
                          C = VN × [i × (1+i)ⁿ] / [(1+i)ⁿ - 1]
                        </code>
                      </div>
                      <p className="text-xs text-green-600 mt-1">
                        VN: Valor Nominal, i: Tasa periodo, n: Número periodos
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-green-800 mb-2">
                        Interés Periodo (I)
                      </h4>
                      <div className="bg-white p-3 rounded-lg border border-green-200">
                        <code className="text-sm text-green-700">
                          I = Saldo × i
                        </code>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-green-800 mb-2">
                        Amortización (A)
                      </h4>
                      <div className="bg-white p-3 rounded-lg border border-green-200">
                        <code className="text-sm text-green-700">
                          A = C - I
                        </code>
                      </div>
                    </div>
                  </div>
                )}{" "}
              </Card>{" "}
              {/* Conceptos Financieros Adicionales */}
              <Card className="p-6 bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-200 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => toggleCard("conceptos")}
                >
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-5 h-5 text-indigo-600" />
                    <h3 className="text-lg font-semibold text-indigo-900">
                      Conceptos Clave
                    </h3>
                  </div>
                  {expandedCards.conceptos ? (
                    <ChevronUp className="w-5 h-5 text-indigo-600" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-indigo-600" />
                  )}
                </div>
                {expandedCards.conceptos && (
                  <div className="space-y-4 mt-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-4 h-4 text-indigo-600" />
                        <h4 className="font-medium text-indigo-800">
                          Valor Presente Neto (VPN)
                        </h4>
                      </div>
                      <p className="text-sm text-indigo-700 ml-6">
                        Suma de todos los flujos futuros descontados al presente
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <PieChart className="w-4 h-4 text-indigo-600" />
                        <h4 className="font-medium text-indigo-800">TIR</h4>
                      </div>
                      <p className="text-sm text-indigo-700 ml-6">
                        Tasa Interna de Retorno del bono
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Activity className="w-4 h-4 text-indigo-600" />
                        <h4 className="font-medium text-indigo-800">
                          Duración
                        </h4>
                      </div>
                      <p className="text-sm text-indigo-700 ml-6">
                        Sensibilidad del precio ante cambios en tasas
                      </p>
                    </div>
                  </div>
                )}
              </Card>
              {/* Valoración y Precio del Bono */}
              <Card className="p-6 bg-gradient-to-br from-cyan-50 to-blue-50 border-cyan-200 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => toggleCard("valoracion")}
                >
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-5 h-5 text-cyan-600" />
                    <h3 className="text-lg font-semibold text-cyan-900">
                      💰 Valoración y Precio
                    </h3>
                  </div>
                  {expandedCards.valoracion ? (
                    <ChevronUp className="w-5 h-5 text-cyan-600" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-cyan-600" />
                  )}
                </div>
                {expandedCards.valoracion && (
                  <div className="space-y-4 mt-4">
                    <div>
                      <h4 className="font-medium text-cyan-800 mb-2">
                        Precio del Bono
                      </h4>
                      <div className="bg-white p-3 rounded-lg border border-cyan-200">
                        <p className="text-sm text-cyan-700 mb-2">
                          <strong>Fórmula:</strong> Precio = Σ[FC_t / (1+r)^t]
                        </p>
                        <p className="text-xs text-cyan-600">
                          FC_t: Flujo de caja en período t, r: Tasa de descuento
                        </p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-cyan-800 mb-2">
                        Tipos de Obligaciones
                      </h4>
                      <div className="space-y-2">
                        <div className="bg-green-50 p-3 rounded border border-green-200">
                          <p className="text-sm font-semibold text-green-800">
                            Premium (Prima)
                          </p>
                          <p className="text-xs text-green-700">
                            Precio mayor a Valor Nominal. Tasa cupón mayor a
                            Tasa mercado
                          </p>
                        </div>
                        <div className="bg-orange-50 p-3 rounded border border-orange-200">
                          <p className="text-sm font-semibold text-orange-800">
                            Descuento
                          </p>
                          <p className="text-xs text-orange-700">
                            Precio menor a Valor Nominal. Tasa cupón menor a
                            Tasa mercado
                          </p>
                        </div>
                        <div className="bg-blue-50 p-3 rounded border border-blue-200">
                          <p className="text-sm font-semibold text-blue-800">
                            A la Par
                          </p>
                          <p className="text-xs text-blue-700">
                            Precio igual a Valor Nominal. Tasa cupón igual a
                            Tasa mercado
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-cyan-800 mb-2">
                        Convexidad Avanzada
                      </h4>
                      <div className="bg-white p-3 rounded-lg border border-cyan-200">
                        <p className="text-sm text-cyan-700 mb-2">
                          <strong>Definición:</strong> Mide la curvatura en la
                          relación precio-rendimiento
                        </p>
                        <div className="text-xs text-cyan-600 space-y-1">
                          <div>• Mayor convexidad = Menor riesgo de precio</div>
                          <div>
                            • Mejora la aproximación de duración modificada
                          </div>
                          <div>
                            • Especialmente útil para grandes cambios de tasa
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-cyan-800 mb-2">
                        Rendimiento al Vencimiento (YTM)
                      </h4>
                      <div className="bg-white p-3 rounded-lg border border-cyan-200">
                        <p className="text-sm text-cyan-700 mb-2">
                          <strong>Concepto:</strong> Tasa que iguala el precio
                          actual con el valor presente de flujos
                        </p>
                        <p className="text-xs text-cyan-600">
                          Se calcula usando métodos numéricos como
                          Newton-Raphson
                        </p>
                      </div>
                    </div>
                  </div>
                )}{" "}
              </Card>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
