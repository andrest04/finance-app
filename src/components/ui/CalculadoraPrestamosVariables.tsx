import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calculator, Plus, Trash2 } from "lucide-react";
import {
  calcularPrestamoVariable,
  PrestamoVariableParams,
  FlujoPrestamo,
} from "@/lib/prestamosVariables";

interface TasaPeriodo {
  id: string;
  desde: number;
  hasta: number;
  tasa: number;
}

export default function CalculadoraPrestamosVariables() {
  const [params, setParams] = useState<Partial<PrestamoVariableParams>>({
    precioVenta: undefined,
    cuotaInicialPorcentaje: 0,
    frecuenciaPago: undefined,
    plazoAnos: undefined,
    plazoGraciaTotal: 0,
    plazoGraciaParcial: 0,
  });

  const [tasasPeriodo, setTasasPeriodo] = useState<TasaPeriodo[]>([
    { id: "1", desde: 1, hasta: 1, tasa: 10 },
  ]);

  const [resultado, setResultado] = useState<FlujoPrestamo[] | null>(null);

  const agregarTasaPeriodo = () => {
    const nuevaTasa: TasaPeriodo = {
      id: Date.now().toString(),
      desde: 1,
      hasta: 1,
      tasa: 10,
    };
    setTasasPeriodo([...tasasPeriodo, nuevaTasa]);
  };

  const eliminarTasaPeriodo = (id: string) => {
    setTasasPeriodo(tasasPeriodo.filter((t) => t.id !== id));
  };

  const actualizarTasaPeriodo = (
    id: string,
    campo: keyof Omit<TasaPeriodo, "id">,
    valor: number
  ) => {
    setTasasPeriodo(
      tasasPeriodo.map((t) => (t.id === id ? { ...t, [campo]: valor } : t))
    );
  };

  const calcular = () => {
    if (!params.precioVenta || !params.frecuenciaPago || !params.plazoAnos) {
      alert("Por favor complete todos los campos requeridos");
      return;
    }

    const parametrosCompletos: PrestamoVariableParams = {
      precioVenta: params.precioVenta,
      cuotaInicialPorcentaje: params.cuotaInicialPorcentaje || 0,
      frecuenciaPago: params.frecuenciaPago,
      plazoAnos: params.plazoAnos,
      plazoGraciaTotal: params.plazoGraciaTotal || 0,
      plazoGraciaParcial: params.plazoGraciaParcial || 0,
      tasasPorPeriodo: tasasPeriodo.map((t) => ({
        desde: t.desde,
        hasta: t.hasta,
        tasa: t.tasa,
      })),
    };

    const flujo = calcularPrestamoVariable(parametrosCompletos);
    setResultado(flujo);
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: "PEN",
      minimumFractionDigits: 2,
    }).format(value);
  };
  const formatPercent = (value: number): string => {
    return `${value.toFixed(4)}%`;
  };
  const getTipoGraciaLabel = (tipo: string): string => {
    switch (tipo) {
      case "T":
        return "Total";
      case "P":
        return "Parcial";
      case "S":
        return "Sin Gracia";
      default:
        return "";
    }
  };

  const getTasaPeriodicoLabel = (): string => {
    switch (params.frecuenciaPago) {
      case 1:
        return "TEA";
      case 2:
        return "TES";
      case 3:
        return "TEC";
      case 4:
        return "TET";
      case 12:
        return "TEM";
      default:
        return "TEP";
    }
  };
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Calculadora de Préstamos con Tasas Variables
        </h1>
        <p className="text-gray-600">
          Calcula cronogramas de pago con tasas variables, períodos de gracia y
          cuota inicial
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel de Configuración */}{" "}
        <div className="lg:col-span-1 space-y-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Parámetros del Préstamo</h2>
            </div>
            <div className="space-y-4">
              {" "}
              <div>
                <Label htmlFor="precioVenta">Precio de Venta</Label>
                <Input
                  id="precioVenta"
                  type="number"
                  value={params.precioVenta || ""}
                  onChange={(e) =>
                    setParams({
                      ...params,
                      precioVenta: e.target.value
                        ? parseFloat(e.target.value)
                        : undefined,
                    })
                  }
                  placeholder="Ej: 1000000"
                />
              </div>
              <div>
                <Label htmlFor="cuotaInicial">Cuota Inicial (%)</Label>
                <Input
                  id="cuotaInicial"
                  type="number"
                  value={params.cuotaInicialPorcentaje || ""}
                  onChange={(e) =>
                    setParams({
                      ...params,
                      cuotaInicialPorcentaje: e.target.value
                        ? parseFloat(e.target.value)
                        : 0,
                    })
                  }
                  placeholder="Ej: 20"
                />
              </div>{" "}
              <div>
                <Label htmlFor="frecuencia">Frecuencia de Pago</Label>
                <select
                  id="frecuencia"
                  className="w-full p-2 border rounded"
                  value={params.frecuenciaPago || ""}
                  onChange={(e) =>
                    setParams({
                      ...params,
                      frecuenciaPago: e.target.value
                        ? parseInt(e.target.value)
                        : undefined,
                    })
                  }
                >
                  <option value="">Seleccionar</option>
                  <option value="1">Anual</option>
                  <option value="2">Semestral</option>
                  <option value="3">Cuatrimestral</option>
                  <option value="4">Trimestral</option>
                  <option value="12">Mensual</option>
                </select>
              </div>
              <div>
                <Label htmlFor="plazo">Plazo (años)</Label>
                <Input
                  id="plazo"
                  type="number"
                  value={params.plazoAnos || ""}
                  onChange={(e) =>
                    setParams({
                      ...params,
                      plazoAnos: e.target.value
                        ? parseInt(e.target.value)
                        : undefined,
                    })
                  }
                  placeholder="Ej: 5"
                />
              </div>{" "}
              <div>
                <Label htmlFor="graciaTotal">Períodos Gracia Total</Label>
                <Input
                  id="graciaTotal"
                  type="number"
                  value={params.plazoGraciaTotal || ""}
                  onChange={(e) =>
                    setParams({
                      ...params,
                      plazoGraciaTotal: e.target.value
                        ? parseInt(e.target.value)
                        : 0,
                    })
                  }
                  placeholder="Ej: 0"
                />
              </div>
              <div>
                <Label htmlFor="graciaParcial">Períodos Gracia Parcial</Label>
                <Input
                  id="graciaParcial"
                  type="number"
                  value={params.plazoGraciaParcial || ""}
                  onChange={(e) =>
                    setParams({
                      ...params,
                      plazoGraciaParcial: e.target.value
                        ? parseInt(e.target.value)
                        : 0,
                    })
                  }
                  placeholder="Ej: 0"
                />
              </div>
            </div>
          </Card>

          {/* Tasas por Período */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Tasas por Período</h3>
              <Button onClick={agregarTasaPeriodo} size="sm" variant="outline">
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-3">
              {tasasPeriodo.map((tasa) => (
                <div key={tasa.id} className="border rounded p-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">
                      Rango de Períodos
                    </span>
                    <Button
                      onClick={() => eliminarTasaPeriodo(tasa.id)}
                      size="sm"
                      variant="ghost"
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {" "}
                    <div>
                      <Label className="text-xs">Desde</Label>
                      <Input
                        type="number"
                        value={tasa.desde || ""}
                        onChange={(e) =>
                          actualizarTasaPeriodo(
                            tasa.id,
                            "desde",
                            e.target.value ? parseInt(e.target.value) : 1
                          )
                        }
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Hasta</Label>
                      <Input
                        type="number"
                        value={tasa.hasta || ""}
                        onChange={(e) =>
                          actualizarTasaPeriodo(
                            tasa.id,
                            "hasta",
                            e.target.value ? parseInt(e.target.value) : 1
                          )
                        }
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">TEA (%)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={tasa.tasa || ""}
                        onChange={(e) =>
                          actualizarTasaPeriodo(
                            tasa.id,
                            "tasa",
                            e.target.value ? parseFloat(e.target.value) : 0
                          )
                        }
                        className="text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Button onClick={calcular} className="w-full" size="lg">
            <Calculator className="w-5 h-5 mr-2" />
            Calcular Cronograma
          </Button>
        </div>
        {/* Tabla de Resultados */}
        <div className="lg:col-span-2">
          {resultado && (
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4">
                Cronograma de Pagos
              </h3>
              {/* Resumen */}
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-blue-600">Precio de Venta</p>
                    <p className="font-semibold">
                      {formatCurrency(params.precioVenta || 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-600">Cuota Inicial</p>
                    <p className="font-semibold">
                      {formatCurrency(
                        (params.precioVenta || 0) *
                          ((params.cuotaInicialPorcentaje || 0) / 100)
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-600">Préstamo</p>
                    <p className="font-semibold">
                      {formatCurrency(
                        (params.precioVenta || 0) -
                          (params.precioVenta || 0) *
                            ((params.cuotaInicialPorcentaje || 0) / 100)
                      )}
                    </p>
                  </div>{" "}
                  <div>
                    <p className="text-sm text-blue-600">Frecuencia</p>
                    <p className="font-semibold">
                      {params.frecuenciaPago === 1
                        ? "Anual"
                        : params.frecuenciaPago === 2
                        ? "Semestral"
                        : params.frecuenciaPago === 3
                        ? "Cuatrimestral"
                        : params.frecuenciaPago === 4
                        ? "Trimestral"
                        : "Mensual"}
                    </p>
                  </div>
                </div>

                {/* Información de períodos de gracia */}
                {((params.plazoGraciaTotal || 0) > 0 ||
                  (params.plazoGraciaParcial || 0) > 0) && (
                  <div className="border-t border-blue-200 pt-3">
                    <p className="text-sm text-blue-600 mb-2">
                      Períodos de Gracia:
                    </p>
                    <div className="flex gap-4 text-sm">
                      {(params.plazoGraciaTotal || 0) > 0 && (
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-red-200 border border-red-400 rounded"></div>
                          <span>
                            {params.plazoGraciaTotal} período(s) gracia total
                          </span>
                        </div>
                      )}
                      {(params.plazoGraciaParcial || 0) > 0 && (
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-yellow-200 border border-yellow-400 rounded"></div>
                          <span>
                            {params.plazoGraciaParcial} período(s) gracia
                            parcial
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Tabla */}
              <div className="overflow-x-auto">
                {" "}
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 p-2 text-left">
                        N°
                      </th>
                      <th className="border border-gray-300 p-2 text-left">
                        TEA
                      </th>
                      <th className="border border-gray-300 p-2 text-left">
                        {getTasaPeriodicoLabel()}
                      </th>
                      <th className="border border-gray-300 p-2 text-left">
                        Plazo Gracia
                      </th>
                      <th className="border border-gray-300 p-2 text-right">
                        Saldo Inicial
                      </th>
                      <th className="border border-gray-300 p-2 text-right">
                        Interés
                      </th>
                      <th className="border border-gray-300 p-2 text-right">
                        Cuota
                      </th>
                      <th className="border border-gray-300 p-2 text-right">
                        Amortización
                      </th>
                      <th className="border border-gray-300 p-2 text-right">
                        Saldo Final
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultado.map((fila, index) => (
                      <tr
                        key={index}
                        className={`
                          ${
                            fila.plazoGracia === "T"
                              ? "bg-red-50"
                              : fila.plazoGracia === "P"
                              ? "bg-yellow-50"
                              : "bg-white"
                          }
                          hover:bg-opacity-75
                        `}
                      >
                        <td className="border border-gray-300 p-2 font-medium">
                          {fila.periodo}
                        </td>
                        <td className="border border-gray-300 p-2">
                          {fila.tea.toFixed(2)}%
                        </td>
                        <td className="border border-gray-300 p-2">
                          {formatPercent(fila.tes)}
                        </td>
                        <td className="border border-gray-300 p-2 text-center">
                          <span
                            className={`
                            px-2 py-1 rounded text-xs font-medium
                            ${
                              fila.plazoGracia === "T"
                                ? "bg-red-100 text-red-800"
                                : fila.plazoGracia === "P"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-green-100 text-green-800"
                            }
                          `}
                          >
                            {getTipoGraciaLabel(fila.plazoGracia)}
                          </span>
                        </td>
                        <td className="border border-gray-300 p-2 text-right">
                          {formatCurrency(fila.saldoInicial)}
                        </td>
                        <td className="border border-gray-300 p-2 text-right">
                          {formatCurrency(fila.interes)}
                        </td>
                        <td className="border border-gray-300 p-2 text-right font-medium">
                          {formatCurrency(fila.cuota)}
                        </td>
                        <td className="border border-gray-300 p-2 text-right">
                          {formatCurrency(fila.amortizacion)}
                        </td>
                        <td className="border border-gray-300 p-2 text-right font-medium">
                          {formatCurrency(fila.saldoFinal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Leyenda */}
              <div className="mt-4 flex gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
                  <span>Gracia Total</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-yellow-100 border border-yellow-300 rounded"></div>
                  <span>Gracia Parcial</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
                  <span>Sin Gracia</span>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
