import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Calculator,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  FileText,
} from "lucide-react";

interface EjemploAcademico {
  id: number;
  titulo: string;
  descripcion: string;
  parametros: {
    precioVenta: number;
    cuotaInicialPorcentaje: number;
    frecuenciaPago: number;
    plazoAnos: number;
    plazoGraciaTotal: number;
    plazoGraciaParcial: number;
    tasasPorPeriodo: Array<{
      desde: number;
      hasta: number;
      tasa: number;
    }>;
  };
  conceptosAplicados: string[];
  relevanciaAcademica: string;
}

const ejemplosAcademicos: EjemploAcademico[] = [
  {
    id: 1,
    titulo: "Préstamo Hipotecario con Tasa Variable Escalonada",
    descripcion:
      "Préstamo para vivienda con tasa promocional los primeros 2 años, luego incremento gradual. Incluye período de gracia parcial inicial.",
    parametros: {
      precioVenta: 500000,
      cuotaInicialPorcentaje: 20,
      frecuenciaPago: 12,
      plazoAnos: 20,
      plazoGraciaTotal: 0,
      plazoGraciaParcial: 6,
      tasasPorPeriodo: [
        { desde: 1, hasta: 24, tasa: 8.5 },
        { desde: 25, hasta: 60, tasa: 10.0 },
        { desde: 61, hasta: 240, tasa: 12.0 },
      ],
    },
    conceptosAplicados: [
      "Tasa variable por períodos",
      "Gracia parcial inicial",
      "Método francés por segmentos",
      "Capitalización mensual",
    ],
    relevanciaAcademica:
      "Demuestra el impacto de las tasas promocionales en la decisión de financiamiento y la gestión del riesgo de tasa de interés.",
  },
  {
    id: 2,
    titulo: "Financiamiento Empresarial con Gracia Total",
    descripcion:
      "Préstamo para capital de trabajo con período de gracia total para permitir la generación de flujos antes del inicio de pagos.",
    parametros: {
      precioVenta: 1000000,
      cuotaInicialPorcentaje: 0,
      frecuenciaPago: 4,
      plazoAnos: 8,
      plazoGraciaTotal: 4,
      plazoGraciaParcial: 2,
      tasasPorPeriodo: [
        { desde: 1, hasta: 12, tasa: 15.0 },
        { desde: 13, hasta: 32, tasa: 18.0 },
      ],
    },
    conceptosAplicados: [
      "Gracia total y parcial combinadas",
      "Capitalización trimestral",
      "Recalculación de cuotas post-gracia",
      "Análisis de flujo empresarial",
    ],
    relevanciaAcademica:
      "Ilustra la importancia de los períodos de gracia en el financiamiento empresarial y su impacto en la viabilidad del proyecto.",
  },
  {
    id: 3,
    titulo: "Crédito Vehicular con Tasa Decreciente",
    descripcion:
      "Financiamiento automotriz con tasa alta inicial que decrece conforme se reduce el riesgo crediticio percibido.",
    parametros: {
      precioVenta: 80000,
      cuotaInicialPorcentaje: 30,
      frecuenciaPago: 12,
      plazoAnos: 5,
      plazoGraciaTotal: 0,
      plazoGraciaParcial: 0,
      tasasPorPeriodo: [
        { desde: 1, hasta: 12, tasa: 20.0 },
        { desde: 13, hasta: 36, tasa: 16.0 },
        { desde: 37, hasta: 60, tasa: 14.0 },
      ],
    },
    conceptosAplicados: [
      "Tasa decreciente por riesgo",
      "Cuota inicial significativa",
      "Amortización acelerada",
      "Gestión de garantías",
    ],
    relevanciaAcademica:
      "Examina cómo la percepción del riesgo crediticio afecta la estructura de tasas y el costo total del financiamiento.",
  },
  {
    id: 4,
    titulo: "Microcrédito con Estructura Flexible",
    descripcion:
      "Préstamo para pequeña empresa con estructura adaptada a ciclos de negocio estacionales.",
    parametros: {
      precioVenta: 25000,
      cuotaInicialPorcentaje: 10,
      frecuenciaPago: 2,
      plazoAnos: 3,
      plazoGraciaTotal: 1,
      plazoGraciaParcial: 1,
      tasasPorPeriodo: [{ desde: 1, hasta: 6, tasa: 25.0 }],
    },
    conceptosAplicados: [
      "Microfinanzas estructuradas",
      "Capitalización semestral",
      "Gracia adaptada a ciclos",
      "Análisis de sostenibilidad",
    ],
    relevanciaAcademica:
      "Demuestra la aplicación de principios financieros en el segmento de microfinanzas y su impacto social.",
  },
  {
    id: 5,
    titulo: "Financiamiento Inmobiliario Corporativo",
    descripcion:
      "Préstamo para desarrollo inmobiliario con estructura compleja de tasas variables según fases del proyecto.",
    parametros: {
      precioVenta: 2000000,
      cuotaInicialPorcentaje: 25,
      frecuenciaPago: 3,
      plazoAnos: 10,
      plazoGraciaTotal: 2,
      plazoGraciaParcial: 4,
      tasasPorPeriodo: [
        { desde: 1, hasta: 6, tasa: 12.0 },
        { desde: 7, hasta: 18, tasa: 14.0 },
        { desde: 19, hasta: 30, tasa: 16.0 },
      ],
    },
    conceptosAplicados: [
      "Financiamiento por fases",
      "Capitalización cuatrimestral",
      "Gestión de riesgo constructivo",
      "Evaluación de proyectos complejos",
    ],
    relevanciaAcademica:
      "Integra conceptos avanzados de evaluación de proyectos con estructuras de financiamiento sofisticadas.",
  },
];

interface EjemplosAcademicosProps {
  onCargarEjemplo?: (ejemplo: EjemploAcademico) => void;
}

export default function EjemplosAcademicos({
  onCargarEjemplo,
}: EjemplosAcademicosProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200">
        <div className="flex items-start gap-4">
          <div className="bg-purple-100 p-3 rounded-full">
            <BookOpen className="w-6 h-6 text-purple-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-purple-900 mb-2">
              Ejemplos Académicos - Casos de Estudio
            </h2>
            <p className="text-purple-700 leading-relaxed">
              Estos ejemplos demuestran la aplicación práctica de los conceptos
              financieros avanzados en diferentes escenarios reales del mercado
              financiero peruano e internacional.
            </p>
            <div className="mt-4 bg-white rounded-lg p-4 border border-purple-100">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <span className="font-semibold text-gray-800">
                  Valor Académico
                </span>
              </div>
              <p className="text-sm text-gray-700">
                Cada ejemplo incluye análisis de conceptos aplicados y
                relevancia académica, conectando la teoría financiera con casos
                prácticos del trabajo final.
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Grid de Ejemplos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {ejemplosAcademicos.map((ejemplo) => (
          <Card
            key={ejemplo.id}
            className="p-6 shadow-lg hover:shadow-xl transition-shadow border-l-4 border-l-blue-500"
          >
            {/* Header del Ejemplo */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Calculator className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">
                    {ejemplo.titulo}
                  </h3>
                  <span className="text-sm text-blue-600 font-medium">
                    Ejemplo {ejemplo.id}
                  </span>
                </div>
              </div>
            </div>

            {/* Descripción */}
            <p className="text-gray-700 mb-4 leading-relaxed text-sm">
              {ejemplo.descripcion}
            </p>

            {/* Parámetros Principales */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                Parámetros Principales
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-600">Monto:</span>
                  <span className="font-semibold ml-2">
                    S/. {ejemplo.parametros.precioVenta.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Cuota inicial:</span>
                  <span className="font-semibold ml-2">
                    {ejemplo.parametros.cuotaInicialPorcentaje}%
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Plazo:</span>
                  <span className="font-semibold ml-2">
                    {ejemplo.parametros.plazoAnos} años
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Frecuencia:</span>
                  <span className="font-semibold ml-2">
                    {ejemplo.parametros.frecuenciaPago === 12
                      ? "Mensual"
                      : ejemplo.parametros.frecuenciaPago === 4
                      ? "Trimestral"
                      : ejemplo.parametros.frecuenciaPago === 3
                      ? "Cuatrimestral"
                      : ejemplo.parametros.frecuenciaPago === 2
                      ? "Semestral"
                      : "Anual"}
                  </span>
                </div>
              </div>

              {/* Períodos de Gracia */}
              {(ejemplo.parametros.plazoGraciaTotal > 0 ||
                ejemplo.parametros.plazoGraciaParcial > 0) && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="flex gap-4 text-sm">
                    {ejemplo.parametros.plazoGraciaTotal > 0 && (
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                        <span>
                          Gracia total: {ejemplo.parametros.plazoGraciaTotal}
                        </span>
                      </div>
                    )}
                    {ejemplo.parametros.plazoGraciaParcial > 0 && (
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                        <span>
                          Gracia parcial:{" "}
                          {ejemplo.parametros.plazoGraciaParcial}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tasas */}
              <div className="mt-3 pt-3 border-t border-gray-200">
                <span className="text-gray-600 text-sm">
                  Tasas por período:
                </span>
                <div className="mt-1 space-y-1">
                  {ejemplo.parametros.tasasPorPeriodo.map((tasa, index) => (
                    <div key={index} className="text-xs text-gray-700">
                      Períodos {tasa.desde}-{tasa.hasta}:{" "}
                      <span className="font-semibold">{tasa.tasa}% TEA</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Conceptos Aplicados */}
            <div className="mb-4">
              <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                Conceptos Aplicados
              </h4>
              <div className="flex flex-wrap gap-2">
                {ejemplo.conceptosAplicados.map((concepto, index) => (
                  <span
                    key={index}
                    className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium"
                  >
                    {concepto}
                  </span>
                ))}
              </div>
            </div>

            {/* Relevancia Académica */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
              <h4 className="font-semibold text-amber-800 mb-1 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Relevancia Académica
              </h4>
              <p className="text-sm text-amber-700 leading-relaxed">
                {ejemplo.relevanciaAcademica}
              </p>
            </div>

            {/* Botón de Acción */}
            {onCargarEjemplo && (
              <Button
                onClick={() => onCargarEjemplo(ejemplo)}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              >
                <Calculator className="w-4 h-4 mr-2" />
                Cargar en Calculadora
              </Button>
            )}
          </Card>
        ))}
      </div>

      {/* Footer Académico */}
      <Card className="p-6 bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-200">
        <div className="text-center">
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            Integración con el Trabajo Final
          </h3>
          <p className="text-gray-700 leading-relaxed max-w-4xl mx-auto">
            Estos ejemplos forman parte integral del sistema de análisis
            financiero desarrollado para el trabajo final, demostrando la
            aplicación práctica de conceptos teóricos en escenarios reales del
            mercado financiero. Cada caso ilustra diferentes aspectos de la
            evaluación de instrumentos financieros complejos y la toma de
            decisiones basada en análisis cuantitativo riguroso.
          </p>
        </div>
      </Card>
    </div>
  );
}
