import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Calculator,
  Plus,
  Trash2,
  TrendingUp,
  Info,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
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

export default function CalculadoraPrestamosVariablesMejorada() {
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
    <div className="container mx-auto p-6 space-y-8">
      {/* Header Principal Mejorado */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-full shadow-lg">
          <Calculator className="w-6 h-6" />
          <h1 className="text-xl font-bold">
            Calculadora de Préstamos Variables
          </h1>
        </div>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
          Herramienta financiera para análisis de préstamos con tasas variables,
          períodos de gracia y estructuras complejas
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {" "}
        {/* Panel de Configuración Ultra Mejorado */}
        <div className="lg:col-span-1 space-y-6">
          {/* Parámetros Básicos con mejor diseño */}
          <Card className="p-6 bg-gradient-to-br from-white to-blue-50 border-0 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-3 rounded-xl shadow-lg">
                <Info className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  Configuración del Préstamo
                </h2>
                <p className="text-sm text-gray-600">
                  Defina los parámetros principales
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Monto y Cuota Inicial - Layout mejorado */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="precioVenta"
                    className="text-sm font-semibold text-gray-700 flex items-center gap-2"
                  >
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    Precio de Venta
                  </Label>
                  <div className="relative group">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                      S/.
                    </span>
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
                      placeholder="1,000,000"
                      className="pl-12 h-12 bg-white border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg transition-all duration-200"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="cuotaInicial"
                    className="text-sm font-semibold text-gray-700 flex items-center gap-2"
                  >
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Cuota Inicial
                  </Label>
                  <div className="relative group">
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
                      placeholder="20"
                      className="pr-12 h-12 bg-white border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-lg transition-all duration-200"
                    />
                    <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                      %
                    </span>
                  </div>
                </div>
              </div>

              {/* Visualización del monto financiado */}
              {params.precioVenta && (
                <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-emerald-700">
                      Monto a Financiar:
                    </span>
                    <span className="text-lg font-bold text-emerald-800">
                      S/.{" "}
                      {(
                        (params.precioVenta || 0) -
                        (params.precioVenta || 0) *
                          ((params.cuotaInicialPorcentaje || 0) / 100)
                      ).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              {/* Frecuencia con mejor diseño */}
              <div className="space-y-2">
                <Label
                  htmlFor="frecuencia"
                  className="text-sm font-semibold text-gray-700 flex items-center gap-2"
                >
                  {" "}
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  Frecuencia de Pagos
                </Label>
                <select
                  id="frecuencia"
                  className="w-full h-12 p-4 border-2 border-gray-200 rounded-lg bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200 font-medium"
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
                  {" "}
                  <option value="">Seleccionar frecuencia de pagos</option>
                  <option value="12">📅 Mensual (12 pagos por año)</option>
                  <option value="4">📊 Trimestral (4 pagos por año)</option>
                  <option value="3">📈 Cuatrimestral (3 pagos por año)</option>
                  <option value="2">📋 Semestral (2 pagos por año)</option>
                  <option value="1">📆 Anual (1 pago por año)</option>
                </select>
              </div>

              {/* Plazo y Períodos de Gracia en cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white rounded-lg border-2 border-gray-200 p-4 hover:border-blue-300 transition-colors">
                  <Label
                    htmlFor="plazo"
                    className="text-xs font-semibold text-gray-600 mb-2 block"
                  >
                    Plazo Total
                  </Label>
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
                    placeholder="5"
                    className="h-10 text-center font-bold text-lg border-0 bg-transparent"
                  />
                  <p className="text-xs text-gray-500 text-center mt-1">años</p>
                </div>

                <div className="bg-white rounded-lg border-2 border-red-200 p-4 hover:border-red-300 transition-colors">
                  <Label
                    htmlFor="graciaTotal"
                    className="text-xs font-semibold text-red-600 mb-2 block"
                  >
                    Gracia Total
                  </Label>
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
                    placeholder="0"
                    className="h-10 text-center font-bold text-lg border-0 bg-transparent"
                  />
                  <p className="text-xs text-red-500 text-center mt-1">
                    períodos
                  </p>
                </div>

                <div className="bg-white rounded-lg border-2 border-yellow-200 p-4 hover:border-yellow-300 transition-colors">
                  <Label
                    htmlFor="graciaParcial"
                    className="text-xs font-semibold text-yellow-600 mb-2 block"
                  >
                    Gracia Parcial
                  </Label>
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
                    placeholder="0"
                    className="h-10 text-center font-bold text-lg border-0 bg-transparent"
                  />
                  <p className="text-xs text-yellow-500 text-center mt-1">
                    períodos
                  </p>
                </div>
              </div>

              {/* Ayuda visual para períodos de gracia */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div className="space-y-2 text-sm">
                    <h4 className="font-semibold text-amber-800">
                      Períodos de Gracia
                    </h4>
                    <div className="space-y-1 text-amber-700">
                      <p>
                        🔴 <strong>Gracia Total:</strong> No se paga nada, el
                        saldo crece con intereses
                      </p>
                      <p>
                        🟡 <strong>Gracia Parcial:</strong> Solo se pagan
                        intereses, el saldo se mantiene
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>{" "}
          {/* Configuración de Tasas Variables Ultra Mejorada */}
          <Card className="p-6 bg-gradient-to-br from-white to-green-50 border-0 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-3 rounded-xl shadow-lg">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">
                    Tasas Variables por Período
                  </h3>
                  <p className="text-sm text-gray-600">
                    Configure las TEA por rangos de tiempo
                  </p>
                </div>
              </div>
              <Button
                onClick={agregarTasaPeriodo}
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                size="sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Agregar Rango
              </Button>
            </div>

            <div className="space-y-4">
              {tasasPeriodo.map((tasa, index) => (
                <div
                  key={tasa.id}
                  className="bg-white rounded-xl border-2 border-gray-100 hover:border-green-200 p-5 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <span className="text-sm font-bold text-gray-800">
                          Rango #{index + 1}
                        </span>
                        <p className="text-xs text-gray-500">
                          Configuración de tasa por período
                        </p>
                      </div>
                    </div>
                    {tasasPeriodo.length > 1 && (
                      <Button
                        onClick={() => eliminarTasaPeriodo(tasa.id)}
                        size="sm"
                        variant="ghost"
                        className="text-red-500 hover:text-white hover:bg-red-500 transition-all duration-200 rounded-full"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-gray-600 flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        Período Desde
                      </Label>
                      <div className="relative">
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
                          className="h-11 text-center font-bold bg-blue-50 border-2 border-blue-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                          min="1"
                          placeholder="1"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-gray-600 flex items-center gap-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        Período Hasta
                      </Label>
                      <div className="relative">
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
                          className="h-11 text-center font-bold bg-purple-50 border-2 border-purple-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
                          min="1"
                          placeholder="12"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-gray-600 flex items-center gap-2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                        TEA (%)
                      </Label>
                      <div className="relative">
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
                          className="h-11 text-center font-bold text-lg bg-emerald-50 border-2 border-emerald-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                          min="0"
                          placeholder="12.50"
                        />
                        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-emerald-600 font-bold">
                          %
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Visualización del rango */}
                  <div className="mt-3 p-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-700 text-center">
                      <span className="font-semibold">
                        Períodos {tasa.desde} al {tasa.hasta}:
                      </span>
                      <span className="text-emerald-600 font-bold ml-2">
                        {tasa.tasa}% TEA
                      </span>{" "}
                      {params.frecuenciaPago && (
                        <span className="text-gray-500 ml-2">
                          (≈{" "}
                          {(
                            (Math.pow(
                              1 + tasa.tasa / 100,
                              1 / params.frecuenciaPago
                            ) -
                              1) *
                            100
                          ).toFixed(2)}
                          % {getTasaPeriodicoLabel()})
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Información adicional */}
            <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="space-y-2 text-sm">
                  <h4 className="font-semibold text-blue-800">
                    Configuración de Tasas Variables
                  </h4>
                  <div className="space-y-1 text-blue-700">
                    <p>
                      • Las tasas se aplicarán por rangos de períodos
                      consecutivos
                    </p>
                    <p>
                      • Asegúrese de que los rangos cubran todo el plazo sin
                      traslapes
                    </p>
                    <p>
                      • Las cuotas se recalcularán automáticamente cuando cambie
                      la tasa
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>{" "}
          {/* Botones de Acción Mejorados */}
          <div className="space-y-4">
            {/* Indicadores de validación */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div
                className={`flex items-center gap-2 p-2 rounded-lg transition-all ${
                  params.precioVenta &&
                  params.frecuenciaPago &&
                  params.plazoAnos
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                <CheckCircle className="w-4 h-4" />
                <span className="font-medium">Datos básicos</span>
              </div>
              <div
                className={`flex items-center gap-2 p-2 rounded-lg transition-all ${
                  tasasPeriodo.some((t) => t.tasa > 0)
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                <span className="font-medium">Tasas configuradas</span>
              </div>
            </div>

            {/* Botón principal de cálculo */}
            <Button
              onClick={calcular}
              disabled={
                !params.precioVenta ||
                !params.frecuenciaPago ||
                !params.plazoAnos
              }
              className="w-full h-14 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold text-lg rounded-xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200"
              size="lg"
            >
              <Calculator className="w-6 h-6 mr-3" />
              {!params.precioVenta ||
              !params.frecuenciaPago ||
              !params.plazoAnos
                ? "Complete los datos requeridos"
                : "✨ Generar Cronograma Completo"}
            </Button>
          </div>
        </div>
        {/* Tabla de Resultados Mejorada */}
        <div className="lg:col-span-2">
          {resultado && (
            <Card className="p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-purple-100 p-2 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-800">
                  Cronograma de Pagos Detallado
                </h3>
              </div>

              {/* Resumen Ejecutivo */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 mb-8 border border-blue-200">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">
                  Resumen Ejecutivo del Préstamo
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <p className="text-sm text-blue-600 font-medium">
                      Precio de Venta
                    </p>
                    <p className="text-xl font-bold text-gray-800">
                      {formatCurrency(params.precioVenta || 0)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-green-600 font-medium">
                      Cuota Inicial
                    </p>
                    <p className="text-xl font-bold text-gray-800">
                      {formatCurrency(
                        (params.precioVenta || 0) *
                          ((params.cuotaInicialPorcentaje || 0) / 100)
                      )}
                    </p>
                    <p className="text-xs text-gray-500">
                      ({params.cuotaInicialPorcentaje || 0}%)
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-purple-600 font-medium">
                      Monto Financiado
                    </p>
                    <p className="text-xl font-bold text-gray-800">
                      {formatCurrency(
                        (params.precioVenta || 0) -
                          (params.precioVenta || 0) *
                            ((params.cuotaInicialPorcentaje || 0) / 100)
                      )}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-orange-600 font-medium">
                      Frecuencia de Pago
                    </p>
                    <p className="text-lg font-bold text-gray-800">
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
                  <div className="border-t border-blue-200 pt-4 mt-4">
                    <p className="text-sm text-blue-700 font-medium mb-3">
                      Configuración de Períodos de Gracia:
                    </p>
                    <div className="flex gap-6 text-sm">
                      {(params.plazoGraciaTotal || 0) > 0 && (
                        <div className="flex items-center gap-2 bg-red-100 px-3 py-2 rounded-lg">
                          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                          <span className="font-medium text-red-800">
                            {params.plazoGraciaTotal} período(s) de gracia total
                          </span>
                        </div>
                      )}
                      {(params.plazoGraciaParcial || 0) > 0 && (
                        <div className="flex items-center gap-2 bg-yellow-100 px-3 py-2 rounded-lg">
                          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                          <span className="font-medium text-yellow-800">
                            {params.plazoGraciaParcial} período(s) de gracia
                            parcial
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Tabla Mejorada */}
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-gray-800 to-gray-700 text-white">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">
                        Período
                      </th>
                      <th className="px-4 py-3 text-left font-semibold">TEA</th>
                      <th className="px-4 py-3 text-left font-semibold">
                        {getTasaPeriodicoLabel()}
                      </th>
                      <th className="px-4 py-3 text-center font-semibold">
                        Gracia
                      </th>
                      <th className="px-4 py-3 text-right font-semibold">
                        Saldo Inicial
                      </th>
                      <th className="px-4 py-3 text-right font-semibold">
                        Interés
                      </th>
                      <th className="px-4 py-3 text-right font-semibold">
                        Cuota
                      </th>
                      <th className="px-4 py-3 text-right font-semibold">
                        Amortización
                      </th>
                      <th className="px-4 py-3 text-right font-semibold">
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
                              ? "bg-red-50 border-l-4 border-l-red-400"
                              : fila.plazoGracia === "P"
                              ? "bg-yellow-50 border-l-4 border-l-yellow-400"
                              : "bg-white border-l-4 border-l-green-400"
                          }
                          hover:bg-opacity-75 transition-colors border-b border-gray-100
                        `}
                      >
                        <td className="px-4 py-3 font-bold text-gray-800">
                          {fila.periodo}
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-700">
                          {fila.tea.toFixed(2)}%
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {formatPercent(fila.tes)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`
                              px-3 py-1 rounded-full text-xs font-bold
                              ${
                                fila.plazoGracia === "T"
                                  ? "bg-red-200 text-red-800"
                                  : fila.plazoGracia === "P"
                                  ? "bg-yellow-200 text-yellow-800"
                                  : "bg-green-200 text-green-800"
                              }
                            `}
                          >
                            {getTipoGraciaLabel(fila.plazoGracia)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-gray-700">
                          {formatCurrency(fila.saldoInicial)}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-blue-700">
                          {formatCurrency(fila.interes)}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-purple-700">
                          {formatCurrency(fila.cuota)}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-green-700">
                          {formatCurrency(fila.amortizacion)}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-gray-800">
                          {formatCurrency(fila.saldoFinal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Leyenda Mejorada */}
              <div className="mt-6 bg-gray-50 rounded-lg p-4">
                <h5 className="font-semibold text-gray-800 mb-3">
                  Leyenda de Períodos de Gracia:
                </h5>
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-200 border-2 border-red-400 rounded"></div>
                    <span className="font-medium">
                      Gracia Total: Sin pagos (saldo crece)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-yellow-200 border-2 border-yellow-400 rounded"></div>
                    <span className="font-medium">
                      Gracia Parcial: Solo intereses
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-200 border-2 border-green-400 rounded"></div>
                    <span className="font-medium">
                      Sin Gracia: Cuota completa
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Panel de Ayuda cuando no hay resultados */}
          {!resultado && (
            <Card className="p-8 text-center border-2 border-dashed border-gray-300">
              <div className="bg-gray-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Calculator className="w-8 h-8 text-gray-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                Configure los parámetros y calcule
              </h3>{" "}
              <p className="text-gray-500 mb-4">
                Complete todos los campos requeridos en el panel izquierdo y
                presione &quot;Calcular&quot; para generar el cronograma de
                pagos detallado.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 inline-block">
                {" "}
                <p className="text-sm text-blue-700">
                  <strong>Campos requeridos:</strong> Precio de venta,
                  Frecuencia de pago, Plazo en años, y al menos un rango de
                  tasas.
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>{" "}
    </div>
  );
}
