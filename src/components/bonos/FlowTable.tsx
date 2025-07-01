"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, Eye, EyeOff, Calculator, TrendingUp } from "lucide-react";
import type { BonoData } from "@/lib/bonoUtils";
import {
  calcularFlujoFrances,
  calcularFlujoFrancesDinamico,
  FlujoPeriodo,
} from "@/lib/francesMetod";

interface TablaFlujosCajaProps {
  bono: BonoData & { id: string };
}

interface FlujoExtendido extends FlujoPeriodo {
  tea: number;
  tes: number;
  plazoGracia: number;
}

export default function TablaFlujosCaja({ bono }: TablaFlujosCajaProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Función para mapear tipo de gracia
  const mapGracia = (tipo: string): "Ninguno" | "Total" | "Parcial" => {
    if (tipo === "Sin Gracia") return "Ninguno";
    if (tipo === "Total") return "Total";
    if (tipo === "Parcial") return "Parcial";
    return "Ninguno";
  };

  // Calcular TEA y TES
  const calcularTasas = () => {
    const tea = bono.tasaAnual; // TEA (Tasa Efectiva Anual)
    // Calcular TES basado en la frecuencia de pago
    const tes = Math.pow(1 + tea / 100, 1 / bono.frecuenciaPago) - 1;
    return { tea, tes: tes * 100 };
  };

  // Preparar parámetros para calcular flujos
  const parametrosFlujo = {
    valorNominal: bono.valorNominal,
    tasaAnual: bono.tasaAnual,
    frecuenciaPago: bono.frecuenciaPago,
    plazo: bono.plazo,
    gracia: mapGracia(bono.tipoGracia),
    numPeriodosGracia: bono.nGracia || 0,
  };

  // Calcular flujos de caja
  let flujos: FlujoPeriodo[];

  // Verificar si el bono tiene gracia dinámica
  if (
    bono.esGraciaDinamica &&
    bono.graciasPorPeriodo &&
    bono.graciasPorPeriodo.length > 0
  ) {
    // Usar función de gracia dinámica
    const parametrosDinamicos = {
      valorNominal: bono.valorNominal,
      tasaAnual: bono.tasaAnual,
      frecuenciaPago: bono.frecuenciaPago,
      plazo: bono.plazo,
      graciasPorPeriodo: bono.graciasPorPeriodo,
    };
    flujos = calcularFlujoFrancesDinamico(parametrosDinamicos);
  } else {
    // Usar función tradicional
    flujos = calcularFlujoFrances(parametrosFlujo);
  }
  const { tea, tes } = calcularTasas();

  // Función para obtener el tipo de gracia de un período específico
  const getTipoGraciaPorPeriodo = (periodo: number): string => {
    if (!bono.esGraciaDinamica || !bono.graciasPorPeriodo) {
      return bono.tipoGracia;
    }

    // Buscar en los rangos de gracia dinámica
    for (const rango of bono.graciasPorPeriodo) {
      if (periodo >= rango.desde && periodo <= rango.hasta) {
        return rango.tipoGracia;
      }
    }

    return "Sin Gracia";
  };

  // Extender flujos con información adicional
  const flujosExtendidos: FlujoExtendido[] = flujos.map((flujo, index) => ({
    ...flujo,
    tea,
    tes,
    plazoGracia: index < (bono.nGracia || 0) ? (bono.nGracia || 0) - index : 0,
  }));

  // Función para obtener el nombre de la frecuencia
  const getNombreFrecuencia = (frecuencia: number) => {
    const frecuencias: { [key: number]: string } = {
      12: "Mensual",
      6: "Bimestral",
      4: "Trimestral",
      3: "Cuatrimestral",
      2: "Semestral",
      1: "Anual",
    };
    return frecuencias[frecuencia] || `${frecuencia} veces/año`;
  };

  // Calcular totales
  const totalIntereses = flujosExtendidos.reduce(
    (sum, f) => sum + f.interes,
    0
  );
  const totalAmortizacion = flujosExtendidos.reduce(
    (sum, f) => sum + f.amortizacion,
    0
  );
  const totalCuotas = flujosExtendidos.reduce((sum, f) => sum + f.cuota, 0);

  return (
    <Card className="border-blue-300 bg-blue-50 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Table className="w-5 h-5 text-blue-600" />
          <div>
            <h3 className="text-blue-900 font-semibold text-lg">
              Tabla de Flujos de Caja - {bono.nombre}
            </h3>
            <p className="text-blue-700 text-sm">
              Método Francés • {getNombreFrecuencia(bono.frecuenciaPago)} •{" "}
              {flujos.length} períodos
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-blue-700 border-blue-300 hover:bg-blue-100"
        >
          {isExpanded ? (
            <>
              <EyeOff className="w-4 h-4 mr-2" />
              Ocultar Tabla
            </>
          ) : (
            <>
              <Eye className="w-4 h-4 mr-2" />
              Ver Tabla Completa
            </>
          )}
        </Button>
      </div>

      {/* Información del Bono */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-white rounded-lg border border-blue-200">
        {" "}
        <div className="text-center">
          <p className="text-xs text-blue-600 mb-1">Valor Nominal</p>
          <p className="font-bold text-blue-900">
            {bono.moneda}{" "}
            {bono.valorNominal.toLocaleString("es-PE", {
              minimumFractionDigits: 2,
            })}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-blue-600 mb-1">TEA</p>
          <p className="font-bold text-blue-900">{tea.toFixed(2)}%</p>
        </div>
        {bono.frecuenciaPago === 2 && (
          <div className="text-center">
            <p className="text-xs text-blue-600 mb-1">TES (Semestral)</p>
            <p className="font-bold text-blue-900">{tes.toFixed(6)}%</p>
          </div>
        )}
        {bono.frecuenciaPago !== 2 && bono.frecuenciaPago !== 1 && (
          <div className="text-center">
            <p className="text-xs text-blue-600 mb-1">
              Tasa {getNombreFrecuencia(bono.frecuenciaPago)}
            </p>
            <p className="font-bold text-blue-900">{tes.toFixed(6)}%</p>
          </div>
        )}
        <div className="text-center">
          <p className="text-xs text-blue-600 mb-1">Tipo de Gracia</p>
          <p className="font-bold text-blue-900">
            {bono.esGraciaDinamica ? "Gracia Dinámica" : bono.tipoGracia}
          </p>
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-6">
          {/* Tabla de Flujos */}
          <div className="bg-white rounded-xl border border-blue-200 overflow-hidden">
            <div className="overflow-x-auto max-h-96 scrollbar-thin scrollbar-thumb-blue-200 scrollbar-track-blue-50">
              <table className="w-full text-sm">
                <thead className="bg-blue-100 sticky top-0 shadow z-10">
                  <tr>
                    <th className="px-3 py-3 text-left text-blue-900 font-semibold">N°</th>
                    <th className="px-3 py-3 text-center text-blue-900 font-semibold">TEA</th>
                    <th className="px-3 py-3 text-center text-blue-900 font-semibold">
                      {bono.frecuenciaPago === 2 ? "TES" : `Tasa ${getNombreFrecuencia(bono.frecuenciaPago)}`}
                    </th>
                    <th className="px-3 py-3 text-center text-blue-900 font-semibold">
                      {bono.esGraciaDinamica ? "Tipo Gracia" : "Plazo Gracia"}
                    </th>
                    <th className="px-3 py-3 text-right text-blue-900 font-semibold">Saldo Inicial</th>
                    <th className="px-3 py-3 text-right text-blue-900 font-semibold">Interés</th>
                    <th className="px-3 py-3 text-right text-blue-900 font-semibold">Cuota</th>
                    <th className="px-3 py-3 text-right text-blue-900 font-semibold">Amortización</th>
                    <th className="px-3 py-3 text-right text-blue-900 font-semibold">Saldo Final</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-50">
                  {flujosExtendidos.map((flujo, index) => (
                    <tr
                      key={index}
                      className={`transition-colors hover:bg-blue-50 ${
                        index % 2 === 0 ? "bg-white" : "bg-blue-50"
                      } ${
                        bono.esGraciaDinamica
                          ? getTipoGraciaPorPeriodo(flujo.periodo) !== "Sin Gracia"
                            ? "bg-yellow-50"
                            : ""
                          : flujo.plazoGracia > 0
                          ? "bg-yellow-50"
                          : ""
                      }`}
                    >
                      <td className="px-3 py-2 font-medium text-blue-900">{flujo.periodo}</td>
                      <td className="px-3 py-2 text-center text-blue-800">{flujo.tea.toFixed(2)}%</td>
                      <td className="px-3 py-2 text-center text-blue-800">{flujo.tes.toFixed(4)}%</td>
                      <td className="px-3 py-2 text-center text-blue-800">
                        {bono.esGraciaDinamica
                          ? getTipoGraciaPorPeriodo(flujo.periodo)
                          : flujo.plazoGracia > 0
                          ? flujo.plazoGracia
                          : "-"}
                      </td>
                      <td className="px-3 py-2 text-right text-blue-800">
                        {(index === 0
                          ? bono.valorNominal
                          : flujosExtendidos[index - 1]?.saldo || 0
                        ).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-3 py-2 text-right text-blue-800">
                        {flujo.interes.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-3 py-2 text-right text-blue-800 font-medium">
                        {flujo.cuota.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-3 py-2 text-right text-blue-800">
                        {flujo.amortizacion.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-3 py-2 text-right text-blue-800 font-medium">
                        {flujo.saldo.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-blue-100 font-semibold">
                  <tr>
                    <td className="px-3 py-3 text-blue-900" colSpan={5}>TOTALES</td>
                    <td className="px-3 py-3 text-right text-blue-900">
                      {totalIntereses.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-3 py-3 text-right text-blue-900">
                      {totalCuotas.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-3 py-3 text-right text-blue-900">
                      {totalAmortizacion.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-3 py-3 text-right text-blue-900">-</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Resumen */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <Calculator className="w-4 h-4 text-green-600" />
                <h4 className="font-medium text-green-800">Método Francés</h4>
              </div>
              <p className="text-sm text-green-700">
                Cuotas constantes de {flujosExtendidos[0]?.cuota.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-purple-600" />
                <h4 className="font-medium text-purple-800">Total Intereses</h4>
              </div>
              <p className="text-sm text-purple-700">
                {totalIntereses.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-orange-600" />
                <h4 className="font-medium text-orange-800">Total Pagado</h4>
              </div>
              <p className="text-sm text-orange-700">
                {totalCuotas.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          {/* Nota sobre períodos de gracia */}
          {(bono.nGracia || 0) > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
              <p className="text-sm text-yellow-800">
                <strong>Nota:</strong> Las filas marcadas en amarillo
                corresponden a períodos de gracia ({bono.tipoGracia.toLowerCase()}). {bono.tipoGracia === "Total"
                  ? "No se realizan pagos durante estos períodos."
                  : "Solo se pagan intereses durante estos períodos."}
              </p>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
