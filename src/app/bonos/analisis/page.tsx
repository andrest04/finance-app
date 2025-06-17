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
  Info,
  BookOpen,
  Target,
  Lightbulb,
  BarChart3,
  DollarSign,
  Clock,
  PieChart,
  Activity,
  Zap,
  Award,
  Sigma,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export default function AnalisisBonosPage() {
  const [selectedBonos, setSelectedBonos] = useState<
    (BonoData & { id: string })[]
  >([]);
  // Estado para controlar qué tarjetas están expandidas
  const [expandedCards, setExpandedCards] = useState<{
    [key: string]: boolean;
  }>({
    metodo: true,
    formulas: false,
    ventajas: false,
    consejos: false,
    conceptos: false,
    calculadora: false,
    valoracion: false, // Nueva tarjeta de valoración
    compendio: false,
    practicas: false,
  });
  // Función para toggle del estado de expansión
  const toggleCard = (cardId: string) => {
    setExpandedCards((prev) => ({
      ...prev,
      [cardId]: !prev[cardId],
    }));
  };

  // Función para calcular valores totales por moneda
  const calcularValoresPorMoneda = () => {
    const valoresPorMoneda = selectedBonos.reduce((acc, bono) => {
      const moneda = bono.moneda || "USD";
      acc[moneda] = (acc[moneda] || 0) + bono.valorNominal;
      return acc;
    }, {} as Record<string, number>);

    return valoresPorMoneda;
  };

  const valoresPorMoneda = calcularValoresPorMoneda();

  return (
    <ProtectedRoute requiredRole={undefined}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        {" "}
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
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Columna Principal - Análisis */}
            <div className="lg:col-span-3 space-y-8">
              {/* Selector de Bonos */}
              <div>
                <ComparadorBonos onBonosSeleccionados={setSelectedBonos} />
              </div>{" "}
              {/* Tablas de Flujos de Caja */}
              {selectedBonos.length > 0 && (
                <div className="space-y-8">
                  {" "}
                  {/* Indicadores de Rendimiento */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <Card className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 hover:shadow-md transition-all duration-200 hover:scale-[1.01]">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <BarChart3 className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm text-blue-600 font-medium">
                            Bonos Analizados
                          </p>
                          <p className="text-2xl font-bold text-blue-800">
                            {selectedBonos.length}
                          </p>
                        </div>
                      </div>
                    </Card>{" "}
                    <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 hover:shadow-md transition-all duration-200 hover:scale-[1.01]">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <TrendingUp className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-green-600 font-medium mb-2">
                            Valor Total por Moneda
                          </p>
                          <div className="space-y-2">
                            {Object.entries(valoresPorMoneda).map(
                              ([moneda, valor]) => (
                                <div
                                  key={moneda}
                                  className="flex items-center justify-between bg-white p-2 rounded border border-green-200"
                                >
                                  <span className="text-lg font-bold text-green-800">
                                    {moneda === "PEN"
                                      ? "S/"
                                      : moneda === "USD"
                                      ? "$"
                                      : moneda + " "}{" "}
                                    {valor.toLocaleString()}
                                  </span>
                                  <span className="text-xs text-green-600 font-medium bg-green-100 px-2 py-1 rounded">
                                    {moneda}
                                  </span>
                                </div>
                              )
                            )}
                            {Object.keys(valoresPorMoneda).length === 0 && (
                              <div className="flex items-center justify-center bg-white p-2 rounded border border-green-200">
                                <span className="text-lg font-bold text-green-800">
                                  $ 0
                                </span>
                              </div>
                            )}
                            {Object.keys(valoresPorMoneda).length > 1 && (
                              <div className="text-xs text-green-600 text-center pt-1 border-t border-green-200">
                                {Object.keys(valoresPorMoneda).length} monedas
                                diferentes
                              </div>
                            )}
                          </div>
                        </div>
                      </div>{" "}
                    </Card>
                  </div>
                  <div className="flex items-center gap-3 mb-6">
                    <BarChart3 className="w-6 h-6 text-blue-600" />
                    <h2 className="text-2xl font-bold text-gray-800">
                      Tablas de Amortización
                    </h2>
                  </div>
                  {selectedBonos.map((bono) => (
                    <div
                      key={bono.id}
                      className="animate-in slide-in-from-bottom duration-500"
                    >
                      <TablaFlujosCaja bono={bono} />
                    </div>
                  ))}
                </div>
              )}{" "}
              {/* Estado Vacío Mejorado */}
              {selectedBonos.length === 0 && (
                <div className="space-y-6">
                  <Card className="p-12 text-center bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
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
                          ¡Comienza tu análisis financiero!
                        </h3>
                        <p className="text-gray-600 max-w-md leading-relaxed">
                          Selecciona uno o más bonos para ver sus tablas de
                          amortización calculadas con el método francés de
                          cuotas constantes.
                        </p>
                      </div>
                    </div>
                  </Card>

                  {/* Tutorial Visual */}
                  <Card className="p-6 bg-gradient-to-br from-gray-50 to-slate-50 border-gray-200">
                    <div className="flex items-center gap-3 mb-4">
                      <BookOpen className="w-5 h-5 text-gray-600" />
                      <h3 className="text-lg font-semibold text-gray-800">
                        ¿Cómo funciona el análisis?
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="p-3 bg-blue-100 rounded-lg mb-3 mx-auto w-fit">
                          <span className="text-blue-600 font-bold text-lg">
                            1
                          </span>
                        </div>
                        <h4 className="font-medium text-gray-800 mb-2">
                          Selecciona Bonos
                        </h4>
                        <p className="text-sm text-gray-600">
                          Elige uno o más bonos de tu lista para comparar
                        </p>
                      </div>
                      <div className="text-center">
                        <div className="p-3 bg-green-100 rounded-lg mb-3 mx-auto w-fit">
                          <span className="text-green-600 font-bold text-lg">
                            2
                          </span>
                        </div>
                        <h4 className="font-medium text-gray-800 mb-2">
                          Revisa Cálculos
                        </h4>
                        <p className="text-sm text-gray-600">
                          Analiza las tablas de amortización generadas
                          automáticamente
                        </p>
                      </div>
                      <div className="text-center">
                        <div className="p-3 bg-purple-100 rounded-lg mb-3 mx-auto w-fit">
                          <span className="text-purple-600 font-bold text-lg">
                            3
                          </span>
                        </div>
                        <h4 className="font-medium text-gray-800 mb-2">
                          Toma Decisiones
                        </h4>
                        <p className="text-sm text-gray-600">
                          Compara resultados y elige la mejor opción de
                          inversión
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>
              )}
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
                )}
              </Card>{" "}
              {/* Ventajas del Método */}
              <Card className="p-6 bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => toggleCard("ventajas")}
                >
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                    <h3 className="text-lg font-semibold text-purple-900">
                      Ventajas
                    </h3>
                  </div>
                  {expandedCards.ventajas ? (
                    <ChevronUp className="w-5 h-5 text-purple-600" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-purple-600" />
                  )}
                </div>
                {expandedCards.ventajas && (
                  <div className="space-y-3 mt-4">
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                      <p className="text-sm text-purple-700">
                        <strong>Predictibilidad:</strong> Cuotas fijas facilitan
                        la planificación
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                      <p className="text-sm text-purple-700">
                        <strong>Simplicidad:</strong> Fácil de entender y
                        calcular
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                      <p className="text-sm text-purple-700">
                        <strong>Estándar:</strong> Método más utilizado en el
                        mercado
                      </p>
                    </div>
                  </div>
                )}
              </Card>{" "}
              {/* Consejos de Análisis */}
              <Card className="p-6 bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => toggleCard("consejos")}
                >
                  <div className="flex items-center gap-3">
                    <Info className="w-5 h-5 text-orange-600" />
                    <h3 className="text-lg font-semibold text-orange-900">
                      Consejos de Análisis
                    </h3>
                  </div>
                  {expandedCards.consejos ? (
                    <ChevronUp className="w-5 h-5 text-orange-600" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-orange-600" />
                  )}
                </div>
                {expandedCards.consejos && (
                  <div className="space-y-3 mt-4">
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                      <p className="text-sm text-orange-700">
                        Observe cómo disminuyen los intereses período a período
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                      <p className="text-sm text-orange-700">
                        Compare las cuotas entre bonos de diferentes
                        características
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                      <p className="text-sm text-orange-700">
                        Considere los períodos de gracia si existen
                      </p>
                    </div>
                  </div>
                )}
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
              </Card>{" "}
              {/* Calculadora Rápida */}
              <Card className="p-6 bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => toggleCard("calculadora")}
                >
                  <div className="flex items-center gap-3">
                    <Zap className="w-5 h-5 text-emerald-600" />
                    <h3 className="text-lg font-semibold text-emerald-900">
                      Cálculo Rápido
                    </h3>
                  </div>
                  {expandedCards.calculadora ? (
                    <ChevronUp className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-emerald-600" />
                  )}
                </div>
                {expandedCards.calculadora && (
                  <div className="space-y-3 mt-4">
                    <div className="bg-white p-3 rounded-lg border border-emerald-200 hover:bg-emerald-25 transition-colors duration-200">
                      <p className="text-sm text-emerald-700 mb-2">
                        <strong>Ejemplo:</strong> Bono $100,000, 12% anual, 5
                        años
                      </p>
                      <div className="text-xs text-emerald-600 space-y-1">
                        <div>• Cuota mensual: $2,224.44</div>
                        <div>• Total intereses: $33,466.40</div>
                        <div>• Costo total: $133,466.40</div>
                      </div>
                    </div>
                    <p className="text-xs text-emerald-600">
                      * Valores aproximados para referencia
                    </p>
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
                )}
              </Card>
              {/* Compendio Completo de Fórmulas */}
              <Card className="p-6 bg-gradient-to-br from-slate-50 to-gray-50 border-slate-200 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => toggleCard("compendio")}
                >
                  <div className="flex items-center gap-3">
                    <Sigma className="w-5 h-5 text-slate-600" />
                    <h3 className="text-lg font-semibold text-slate-900">
                      📐 Compendio de Fórmulas
                    </h3>
                  </div>
                  {expandedCards.compendio ? (
                    <ChevronUp className="w-5 h-5 text-slate-600" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-600" />
                  )}
                </div>

                {expandedCards.compendio && (
                  <div className="space-y-6 mt-6">
                    {/* Método Francés */}
                    <div>
                      <h4 className="font-semibold text-slate-800 mb-3 text-sm uppercase tracking-wide">
                        🏛️ Método Francés
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs font-medium text-slate-700 mb-1">
                            Cuota Constante (C):
                          </p>
                          <div className="bg-white p-3 rounded border border-slate-200 font-mono text-xs text-slate-700">
                            C = VN × [i × (1+i)ⁿ] / [(1+i)ⁿ - 1]
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-700 mb-1">
                            Interés por Período (I):
                          </p>
                          <div className="bg-white p-3 rounded border border-slate-200 font-mono text-xs text-slate-700">
                            I = Saldo × i
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-700 mb-1">
                            Amortización (A):
                          </p>
                          <div className="bg-white p-3 rounded border border-slate-200 font-mono text-xs text-slate-700">
                            A = C - I
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-700 mb-1">
                            Saldo Restante:
                          </p>
                          <div className="bg-white p-3 rounded border border-slate-200 font-mono text-xs text-slate-700">
                            Saldo = Saldo_anterior - A
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* TCEA y TREA */}
                    <div>
                      <h4 className="font-semibold text-slate-800 mb-3 text-sm uppercase tracking-wide">
                        💰 Tasas Efectivas
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs font-medium text-slate-700 mb-1">
                            TCEA (Emisor):
                          </p>
                          <div className="bg-white p-3 rounded border border-slate-200 font-mono text-xs text-slate-700">
                            VPN = Σ[FC_t / (1+TCEA/m)^t] = 0
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            FC_t: Flujo de caja neto del emisor en período t
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-700 mb-1">
                            TREA (Inversionista):
                          </p>
                          <div className="bg-white p-3 rounded border border-slate-200 font-mono text-xs text-slate-700">
                            VPN = Σ[FC_t / (1+TREA/m)^t] = 0
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            FC_t: Flujo de caja neto del inversionista en
                            período t
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-700 mb-1">
                            Ingreso Neto Emisor:
                          </p>
                          <div className="bg-white p-3 rounded border border-slate-200 font-mono text-xs text-slate-700">
                            Ingreso_Neto = VN - (VN × Comisión_Emisor %)
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-700 mb-1">
                            Inversión Total Bonista:
                          </p>
                          <div className="bg-white p-3 rounded border border-slate-200 font-mono text-xs text-slate-700">
                            Inversión_Total = VN + (VN × Comisión_Bonista %)
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Indicadores de Riesgo */}
                    <div>
                      <h4 className="font-semibold text-slate-800 mb-3 text-sm uppercase tracking-wide">
                        ⚖️ Indicadores de Riesgo
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs font-medium text-slate-700 mb-1">
                            Duración (D):
                          </p>
                          <div className="bg-white p-3 rounded border border-slate-200 font-mono text-xs text-slate-700">
                            D = Σ[t × FC_t / (1+r)^t] / Σ[FC_t / (1+r)^t]
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-700 mb-1">
                            Duración Modificada (DM):
                          </p>
                          <div className="bg-white p-3 rounded border border-slate-200 font-mono text-xs text-slate-700">
                            DM = D / (1 + r)
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-700 mb-1">
                            Convexidad (C):
                          </p>
                          <div className="bg-white p-3 rounded border border-slate-200 font-mono text-xs text-slate-700">
                            C = Σ[FC_t × t × (t+1) / (1+r)^t] / [P × (1+r)²]
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Conversión de Tasas */}
                    <div>
                      <h4 className="font-semibold text-slate-800 mb-3 text-sm uppercase tracking-wide">
                        🔄 Conversión de Tasas
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs font-medium text-slate-700 mb-1">
                            TEA a TES (Efectiva):
                          </p>
                          <div className="bg-white p-3 rounded border border-slate-200 font-mono text-xs text-slate-700">
                            TES = (1 + TEA)^(1/m) - 1
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-700 mb-1">
                            Nominal a Efectiva por Período:
                          </p>
                          <div className="bg-white p-3 rounded border border-slate-200 font-mono text-xs text-slate-700">
                            i = TNM / m
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-700 mb-1">
                            Anualización de Tasa:
                          </p>
                          <div className="bg-white p-3 rounded border border-slate-200 font-mono text-xs text-slate-700">
                            Tasa_Anual = ((1 + tasa_período)^m - 1) × 100
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Valor Presente */}
                    <div>
                      <h4 className="font-semibold text-slate-800 mb-3 text-sm uppercase tracking-wide">
                        💎 Valoración
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs font-medium text-slate-700 mb-1">
                            Valor Presente Neto (VPN):
                          </p>
                          <div className="bg-white p-3 rounded border border-slate-200 font-mono text-xs text-slate-700">
                            VPN = Σ[FC_t / (1+r)^t] - Inversión_Inicial
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-700 mb-1">
                            Valor Presente de Flujo:
                          </p>
                          <div className="bg-white p-3 rounded border border-slate-200 font-mono text-xs text-slate-700">
                            VP = FC / (1+r)^t
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-700 mb-1">
                            Sensibilidad del Precio:
                          </p>
                          <div className="bg-white p-3 rounded border border-slate-200 font-mono text-xs text-slate-700">
                            ΔP ≈ -DM × Δr × P
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Método Newton-Raphson */}
                    <div>
                      <h4 className="font-semibold text-slate-800 mb-3 text-sm uppercase tracking-wide">
                        🔬 Algoritmos Numéricos
                      </h4>
                      <div className="space-y-3">
                        {" "}
                        <div>
                          <p className="text-xs font-medium text-slate-700 mb-1">
                            Newton-Raphson para TIR:
                          </p>
                          <div className="bg-white p-3 rounded border border-slate-200 font-mono text-xs text-slate-700">
                            r_n+1 = r_n - f(r_n) / f&apos;(r_n)
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-700 mb-1">
                            Derivada del VPN:
                          </p>
                          <div className="bg-white p-3 rounded border border-slate-200 font-mono text-xs text-slate-700">
                            f&apos;(r) = -Σ[t × FC_t / (1+r)^(t+1)]
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Leyenda */}
                    <div className="mt-4 pt-4 border-t border-slate-200">
                      <h5 className="text-xs font-semibold text-slate-700 mb-2">
                        📖 Leyenda:
                      </h5>
                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                        <div>• VN: Valor Nominal</div>
                        <div>• i: Tasa por período</div>
                        <div>• n: Número de períodos</div>
                        <div>• m: Frecuencia de pago</div>
                        <div>• t: Período específico</div>
                        <div>• r: Tasa de descuento</div>
                        <div>• FC: Flujo de Caja</div>
                        <div>• P: Precio del bono</div>
                        <div>• TEA: Tasa Efectiva Anual</div>
                        <div>• TES: Tasa Efectiva Sub-período</div>
                        <div>• TNM: Tasa Nominal Mensual</div>
                        <div>• Σ: Sumatoria</div>
                      </div>
                    </div>
                  </div>
                )}
              </Card>{" "}
              {/* Mejores Prácticas */}
              <Card className="p-6 bg-gradient-to-br from-rose-50 to-pink-50 border-rose-200 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => toggleCard("practicas")}
                >
                  <div className="flex items-center gap-3">
                    <Award className="w-5 h-5 text-rose-600" />
                    <h3 className="text-lg font-semibold text-rose-900">
                      Mejores Prácticas
                    </h3>
                  </div>
                  {expandedCards.practicas ? (
                    <ChevronUp className="w-5 h-5 text-rose-600" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-rose-600" />
                  )}
                </div>
                {expandedCards.practicas && (
                  <div className="space-y-3 mt-4">
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-rose-500 rounded-full mt-2"></div>
                      <p className="text-sm text-rose-700">
                        <strong>Diversifique:</strong> No invierta todo en un
                        solo bono
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-rose-500 rounded-full mt-2"></div>
                      <p className="text-sm text-rose-700">
                        <strong>Analice el riesgo:</strong> Considere la
                        calificación crediticia
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-rose-500 rounded-full mt-2"></div>
                      <p className="text-sm text-rose-700">
                        <strong>Plazo adecuado:</strong> Alinee con sus
                        objetivos financieros
                      </p>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
