"use client";

import { Card } from "@/components/ui/card";
import ProtectedRoute from "@/components/auth/RouteGuard";
import {
  Calculator,
  BookOpen,
  Target,
  TrendingUp,
  DollarSign,
  Activity,
  BarChart3,
  Sigma,
  ArrowLeft,
  ExternalLink,
  Copy,
  Check,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function FormulasPage() {
  const [copiedFormula, setCopiedFormula] = useState<string | null>(null);

  const copyToClipboard = (formula: string, id: string) => {
    navigator.clipboard.writeText(formula);
    setCopiedFormula(id);
    setTimeout(() => setCopiedFormula(null), 2000);
  };

  const FormulaCard = ({
    title,
    formula,
    description,
    variables,
    id,
  }: {
    title: string;
    formula: string;
    description: string;
    variables?: string[];
    id: string;
  }) => (
    <div className="bg-white p-4 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <h5 className="font-medium text-slate-800">{title}</h5>
        <button
          onClick={() => copyToClipboard(formula, id)}
          className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
          title="Copiar fórmula"
        >
          {copiedFormula === id ? (
            <Check className="w-4 h-4 text-green-500" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </button>
      </div>
      <div className="bg-slate-50 p-3 rounded border font-mono text-sm text-slate-700 mb-2">
        {formula}
      </div>
      <p className="text-xs text-slate-600 mb-2">{description}</p>
      {variables && variables.length > 0 && (
        <div className="text-xs text-slate-500">
          <strong>Variables:</strong> {variables.join(", ")}
        </div>
      )}
    </div>
  );

  return (
    <ProtectedRoute requiredRole={undefined}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
        {/* Header */}
        <div className="bg-white shadow-lg border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="flex items-center gap-4">
              <Link
                href="/bonos/analisis"
                className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                title="Volver al análisis"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </Link>
              <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                <Sigma className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  📐 Compendio de Fórmulas Matemáticas
                </h1>
                <p className="text-gray-600 mt-2">
                  Referencia completa de todas las fórmulas utilizadas en el
                  análisis de bonos
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Contenido Principal */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Índice de Navegación */}
            <div className="lg:col-span-1">
              <Card className="p-6 sticky top-8">
                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Índice de Contenidos
                </h3>
                <nav className="space-y-2">
                  <a
                    href="#metodo-frances"
                    className="block text-sm text-slate-600 hover:text-blue-600 transition-colors"
                  >
                    🏛️ Método Francés
                  </a>
                  <a
                    href="#tasas-efectivas"
                    className="block text-sm text-slate-600 hover:text-blue-600 transition-colors"
                  >
                    💰 Tasas Efectivas
                  </a>
                  <a
                    href="#indicadores-riesgo"
                    className="block text-sm text-slate-600 hover:text-blue-600 transition-colors"
                  >
                    ⚖️ Indicadores de Riesgo
                  </a>
                  <a
                    href="#conversion-tasas"
                    className="block text-sm text-slate-600 hover:text-blue-600 transition-colors"
                  >
                    🔄 Conversión de Tasas
                  </a>
                  <a
                    href="#valoracion"
                    className="block text-sm text-slate-600 hover:text-blue-600 transition-colors"
                  >
                    💎 Valoración
                  </a>
                  <a
                    href="#algoritmos"
                    className="block text-sm text-slate-600 hover:text-blue-600 transition-colors"
                  >
                    🔬 Algoritmos Numéricos
                  </a>
                  <a
                    href="#leyenda"
                    className="block text-sm text-slate-600 hover:text-blue-600 transition-colors"
                  >
                    📖 Leyenda de Variables
                  </a>
                </nav>
              </Card>
            </div>

            {/* Contenido de Fórmulas */}
            <div className="lg:col-span-3 space-y-8">
              {/* Método Francés */}
              <section id="metodo-frances">
                <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                  <div className="flex items-center gap-3 mb-6">
                    <Target className="w-6 h-6 text-blue-600" />
                    <h2 className="text-2xl font-bold text-blue-900">
                      🏛️ Método Francés
                    </h2>
                  </div>
                  <div className="space-y-4">
                    <FormulaCard
                      id="cuota-constante"
                      title="Cuota Constante (C)"
                      formula="C = VN × [i × (1+i)ⁿ] / [(1+i)ⁿ - 1]"
                      description="Calcula la cuota fija que se paga en cada período durante toda la vida del bono"
                      variables={[
                        "VN: Valor Nominal",
                        "i: Tasa por período",
                        "n: Número total de períodos",
                      ]}
                    />
                    <FormulaCard
                      id="interes-periodo"
                      title="Interés por Período (I)"
                      formula="I = Saldo × i"
                      description="Calcula el interés que se paga en cada período sobre el saldo pendiente"
                      variables={[
                        "Saldo: Saldo pendiente del período",
                        "i: Tasa de interés por período",
                      ]}
                    />
                    <FormulaCard
                      id="amortizacion"
                      title="Amortización (A)"
                      formula="A = C - I"
                      description="Parte de la cuota que se destina a reducir el capital del bono"
                      variables={[
                        "C: Cuota constante",
                        "I: Interés del período",
                      ]}
                    />
                    <FormulaCard
                      id="saldo-restante"
                      title="Saldo Restante"
                      formula="Saldo = Saldo_anterior - A"
                      description="Saldo pendiente después de aplicar la amortización del período"
                      variables={[
                        "Saldo_anterior: Saldo del período anterior",
                        "A: Amortización del período",
                      ]}
                    />
                  </div>
                </Card>
              </section>

              {/* Tasas Efectivas */}
              <section id="tasas-efectivas">
                <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                  <div className="flex items-center gap-3 mb-6">
                    <DollarSign className="w-6 h-6 text-green-600" />
                    <h2 className="text-2xl font-bold text-green-900">
                      💰 Tasas Efectivas (TCEA/TREA)
                    </h2>
                  </div>
                  <div className="space-y-4">
                    <FormulaCard
                      id="tcea-emisor"
                      title="TCEA - Tasa de Costo Efectivo Anual (Emisor)"
                      formula="VPN = Σ[FC_t / (1+TCEA/m)^t] = 0"
                      description="Tasa que iguala el valor presente de los pagos del emisor con el ingreso neto recibido"
                      variables={[
                        "FC_t: Flujo de caja neto del emisor en período t",
                        "m: Frecuencia de pago anual",
                        "t: Período específico",
                      ]}
                    />
                    <FormulaCard
                      id="trea-inversionista"
                      title="TREA - Tasa de Rendimiento Efectivo Anual (Inversionista)"
                      formula="VPN = Σ[FC_t / (1+TREA/m)^t] = 0"
                      description="Tasa que iguala el valor presente de los ingresos del inversionista con su inversión total"
                      variables={[
                        "FC_t: Flujo de caja neto del inversionista en período t",
                        "m: Frecuencia de pago anual",
                      ]}
                    />
                    <FormulaCard
                      id="ingreso-neto-emisor"
                      title="Ingreso Neto del Emisor"
                      formula="Ingreso_Neto = VN - (VN × Comisión_Emisor %)"
                      description="Monto real que recibe el emisor después de descontar las comisiones"
                      variables={[
                        "VN: Valor Nominal",
                        "Comisión_Emisor: Porcentaje de comisión que paga el emisor",
                      ]}
                    />
                    <FormulaCard
                      id="inversion-total-bonista"
                      title="Inversión Total del Bonista"
                      formula="Inversión_Total = VN + (VN × Comisión_Bonista %)"
                      description="Monto total que debe pagar el inversionista incluyendo comisiones"
                      variables={[
                        "VN: Valor Nominal",
                        "Comisión_Bonista: Porcentaje de comisión que paga el bonista",
                      ]}
                    />
                  </div>
                </Card>
              </section>

              {/* Indicadores de Riesgo */}
              <section id="indicadores-riesgo">
                <Card className="p-6 bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
                  <div className="flex items-center gap-3 mb-6">
                    <Activity className="w-6 h-6 text-purple-600" />
                    <h2 className="text-2xl font-bold text-purple-900">
                      ⚖️ Indicadores de Riesgo
                    </h2>
                  </div>
                  <div className="space-y-4">
                    <FormulaCard
                      id="duracion"
                      title="Duración (D)"
                      formula="D = Σ[t × FC_t / (1+r)^t] / Σ[FC_t / (1+r)^t]"
                      description="Promedio ponderado del tiempo hasta recibir los flujos de caja"
                      variables={[
                        "t: Período del flujo",
                        "FC_t: Flujo de caja en período t",
                        "r: Tasa de descuento",
                      ]}
                    />
                    <FormulaCard
                      id="duracion-modificada"
                      title="Duración Modificada (DM)"
                      formula="DM = D / (1 + r)"
                      description="Sensibilidad aproximada del precio del bono ante cambios en la tasa de interés"
                      variables={["D: Duración", "r: Tasa de descuento"]}
                    />
                    <FormulaCard
                      id="convexidad"
                      title="Convexidad (C)"
                      formula="C = Σ[FC_t × t × (t+1) / (1+r)^t] / [P × (1+r)²]"
                      description="Medida de la curvatura de la relación precio-rendimiento"
                      variables={[
                        "FC_t: Flujo de caja en período t",
                        "t: Período",
                        "r: Tasa de descuento",
                        "P: Precio del bono",
                      ]}
                    />
                  </div>
                </Card>
              </section>

              {/* Conversión de Tasas */}
              <section id="conversion-tasas">
                <Card className="p-6 bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
                  <div className="flex items-center gap-3 mb-6">
                    <TrendingUp className="w-6 h-6 text-orange-600" />
                    <h2 className="text-2xl font-bold text-orange-900">
                      🔄 Conversión de Tasas
                    </h2>
                  </div>
                  <div className="space-y-4">
                    <FormulaCard
                      id="tea-tes"
                      title="TEA a TES (Tasa Efectiva)"
                      formula="TES = (1 + TEA)^(1/m) - 1"
                      description="Convierte la tasa efectiva anual a tasa efectiva por sub-período"
                      variables={[
                        "TEA: Tasa Efectiva Anual",
                        "m: Frecuencia de capitalización anual",
                      ]}
                    />
                    <FormulaCard
                      id="anualizacion"
                      title="Anualización de Tasa"
                      formula="Tasa_Anual = ((1 + tasa_período)^m - 1) × 100"
                      description="Convierte una tasa por período a tasa anual equivalente"
                      variables={[
                        "tasa_período: Tasa por período",
                        "m: Número de períodos por año",
                      ]}
                    />
                  </div>
                </Card>
              </section>

              {/* Valoración */}
              <section id="valoracion">
                <Card className="p-6 bg-gradient-to-br from-cyan-50 to-blue-50 border-cyan-200">
                  <div className="flex items-center gap-3 mb-6">
                    <BarChart3 className="w-6 h-6 text-cyan-600" />
                    <h2 className="text-2xl font-bold text-cyan-900">
                      💎 Valoración
                    </h2>
                  </div>
                  <div className="space-y-4">
                    <FormulaCard
                      id="vpn"
                      title="Valor Presente Neto (VPN)"
                      formula="VPN = Σ[FC_t / (1+r)^t] - Inversión_Inicial"
                      description="Valor presente de todos los flujos futuros menos la inversión inicial"
                      variables={[
                        "FC_t: Flujo de caja en período t",
                        "r: Tasa de descuento",
                        "t: Período",
                      ]}
                    />
                    <FormulaCard
                      id="valor-presente"
                      title="Valor Presente de un Flujo"
                      formula="VP = FC / (1+r)^t"
                      description="Valor presente de un flujo de caja futuro específico"
                      variables={[
                        "FC: Flujo de caja futuro",
                        "r: Tasa de descuento",
                        "t: Período en el futuro",
                      ]}
                    />
                    <FormulaCard
                      id="sensibilidad-precio"
                      title="Sensibilidad del Precio"
                      formula="ΔP ≈ -DM × Δr × P"
                      description="Cambio aproximado en el precio ante un cambio en la tasa de interés"
                      variables={[
                        "DM: Duración Modificada",
                        "Δr: Cambio en la tasa",
                        "P: Precio actual",
                      ]}
                    />
                  </div>
                </Card>
              </section>

              {/* Algoritmos Numéricos */}
              <section id="algoritmos">
                <Card className="p-6 bg-gradient-to-br from-red-50 to-rose-50 border-red-200">
                  <div className="flex items-center gap-3 mb-6">
                    <Calculator className="w-6 h-6 text-red-600" />
                    <h2 className="text-2xl font-bold text-red-900">
                      🔬 Algoritmos Numéricos
                    </h2>
                  </div>
                  <div className="space-y-4">
                    <FormulaCard
                      id="newton-raphson"
                      title="Método Newton-Raphson para TIR"
                      formula="r_n+1 = r_n - f(r_n) / f'(r_n)"
                      description="Método iterativo para encontrar la Tasa Interna de Retorno"
                      variables={[
                        "r_n: Tasa en iteración n",
                        "f(r): Función VPN",
                        "f'(r): Derivada de la función VPN",
                      ]}
                    />
                    <FormulaCard
                      id="derivada-vpn"
                      title="Derivada del VPN"
                      formula="f'(r) = -Σ[t × FC_t / (1+r)^(t+1)]"
                      description="Derivada de la función VPN respecto a la tasa de descuento"
                      variables={[
                        "t: Período",
                        "FC_t: Flujo de caja en período t",
                        "r: Tasa de descuento",
                      ]}
                    />
                  </div>
                </Card>
              </section>

              {/* Leyenda */}
              <section id="leyenda">
                <Card className="p-6 bg-gradient-to-br from-slate-50 to-gray-50 border-slate-200">
                  <div className="flex items-center gap-3 mb-6">
                    <BookOpen className="w-6 h-6 text-slate-600" />
                    <h2 className="text-2xl font-bold text-slate-900">
                      📖 Leyenda de Variables
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <h4 className="font-semibold text-slate-800">
                        Variables Básicas
                      </h4>
                      <div className="text-sm text-slate-600 space-y-1">
                        <div>
                          • <strong>VN:</strong> Valor Nominal del bono
                        </div>
                        <div>
                          • <strong>i:</strong> Tasa de interés por período
                        </div>
                        <div>
                          • <strong>n:</strong> Número total de períodos
                        </div>
                        <div>
                          • <strong>m:</strong> Frecuencia de pago anual
                        </div>
                        <div>
                          • <strong>t:</strong> Período específico
                        </div>
                        <div>
                          • <strong>r:</strong> Tasa de descuento
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold text-slate-800">
                        Flujos y Valores
                      </h4>
                      <div className="text-sm text-slate-600 space-y-1">
                        <div>
                          • <strong>FC:</strong> Flujo de Caja
                        </div>
                        <div>
                          • <strong>P:</strong> Precio del bono
                        </div>
                        <div>
                          • <strong>VP:</strong> Valor Presente
                        </div>
                        <div>
                          • <strong>VPN:</strong> Valor Presente Neto
                        </div>
                        <div>
                          • <strong>C:</strong> Cuota constante
                        </div>
                        <div>
                          • <strong>A:</strong> Amortización
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold text-slate-800">
                        Tasas y Medidas
                      </h4>
                      <div className="text-sm text-slate-600 space-y-1">
                        <div>
                          • <strong>TEA:</strong> Tasa Efectiva Anual
                        </div>
                        <div>
                          • <strong>TES:</strong> Tasa Efectiva Sub-período
                        </div>
                        <div>
                          • <strong>TNM:</strong> Tasa Nominal Mensual
                        </div>
                        <div>
                          • <strong>TCEA:</strong> Tasa Costo Efectivo Anual
                        </div>
                        <div>
                          • <strong>TREA:</strong> Tasa Rendimiento Efectivo
                          Anual
                        </div>
                        <div>
                          • <strong>D:</strong> Duración
                        </div>
                        <div>
                          • <strong>DM:</strong> Duración Modificada
                        </div>
                        <div>
                          • <strong>Σ:</strong> Sumatoria
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </section>

              {/* Footer con Links */}
              <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                <div className="text-center space-y-4">
                  <h3 className="text-lg font-semibold text-blue-900">
                    💡 ¿Listo para aplicar estas fórmulas?
                  </h3>
                  <p className="text-blue-700">
                    Todas estas fórmulas están implementadas automáticamente en
                    nuestra plataforma
                  </p>
                  <div className="flex flex-wrap justify-center gap-4">
                    <Link
                      href="/bonos/analisis"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Calculator className="w-4 h-4" />
                      Analizar Bonos
                    </Link>
                    <Link
                      href="/bonos/register"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Target className="w-4 h-4" />
                      Crear Bono
                    </Link>
                    <Link
                      href="/help"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Ayuda General
                    </Link>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
