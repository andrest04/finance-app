"use client";

import React from "react";
import { UseFormReturn } from "react-hook-form";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AlertCircle, Info, Plus, Trash2, CheckCircle } from "lucide-react";
import { type BonoFormData, type GraciaPeriodoBono } from "./types";
import {
  validarPeriodosGracia,
  validarGraciaContraTotalPeriodos,
  validarSolapamientosGracia,
  obtenerLimitesInput,
} from "./validations";

interface GraciaSectionProps {
  form: UseFormReturn<BonoFormData>;
  watchedValues: BonoFormData;
  esGraciaDinamica: boolean;
  setEsGraciaDinamica: (value: boolean) => void;
  graciasPeriodo: GraciaPeriodoBono[];
  setGraciasPeriodo: (value: GraciaPeriodoBono[]) => void;
  agregarGraciaPeriodo: () => void;
  eliminarGraciaPeriodo: (id: string) => void;
  actualizarGraciaPeriodo: (
    id: string,
    campo: keyof Omit<GraciaPeriodoBono, "id">,
    valor: number | string
  ) => void;
}

export function GraciaSection({
  form,
  watchedValues,
  esGraciaDinamica,
  setEsGraciaDinamica,
  graciasPeriodo,
  setGraciasPeriodo,
  agregarGraciaPeriodo,
  eliminarGraciaPeriodo,
  actualizarGraciaPeriodo,
}: GraciaSectionProps) {
  const tipoGracia = form.watch("tipoGracia");

  return (
    <Card className="p-6 border-orange-300 bg-white shadow-sm">
      <div className="flex items-center gap-2 mb-6">
        <AlertCircle className="w-5 h-5 text-orange-600" />
        <h3 className="text-xl font-bold text-orange-900">Período de Gracia</h3>
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="w-4 h-4 text-orange-400 cursor-pointer" />
          </TooltipTrigger>
          <TooltipContent>
            <p>Períodos donde se pueden diferir pagos.</p>
            <p>
              • Total: sin pagos | • Parcial: solo intereses | • Sin Gracia:
              pagos normales
            </p>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Selector de Modo - Simplificado */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <Label className="text-base font-semibold text-gray-800">
            Configuración de Gracia
          </Label>
          <div className="flex items-center gap-3">
            <span
              className={`text-sm font-medium ${
                !esGraciaDinamica ? "text-blue-600" : "text-gray-500"
              }`}
            >
              Básica
            </span>
            <Switch
              checked={esGraciaDinamica}
              onCheckedChange={(checked) => {
                setEsGraciaDinamica(checked);
                form.setValue("esGraciaDinamica", checked);
                if (!checked) {
                  setGraciasPeriodo([
                    {
                      id: "1",
                      desde: 1,
                      hasta: 1,
                      tipoGracia: "Sin Gracia",
                    },
                  ]);
                }
              }}
            />
            <span
              className={`text-sm font-medium ${
                esGraciaDinamica ? "text-orange-600" : "text-gray-500"
              }`}
            >
              Avanzada
            </span>
          </div>
        </div>
        <p className="text-sm text-gray-600">
          {esGraciaDinamica
            ? "Configure diferentes tipos de gracia para períodos específicos del bono."
            : "Configure un solo tipo de gracia que se aplicará a todos los períodos especificados."}
        </p>
      </div>

      {/* Configuración según el modo seleccionado */}
      {!esGraciaDinamica ? (
        /* MODO BÁSICO - SIMPLIFICADO */
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">
                Tipo de Gracia *
              </Label>
              <Select
                value={form.watch("tipoGracia")}
                onValueChange={(value) => form.setValue("tipoGracia", value)}
              >
                <SelectTrigger className="border-gray-300 focus:border-blue-500">
                  <SelectValue placeholder="Seleccione tipo de gracia" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sin Gracia">Sin Gracia</SelectItem>
                  <SelectItem value="Total">
                    Gracia Total (sin pagos)
                  </SelectItem>
                  <SelectItem value="Parcial">
                    Gracia Parcial (solo intereses)
                  </SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.tipoGracia && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {form.formState.errors.tipoGracia.message}
                </p>
              )}
            </div>

            {tipoGracia !== "Sin Gracia" && (
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">
                  Períodos de Gracia
                </Label>
                <Input
                  {...form.register("nGracia")}
                  type="number"
                  min="0"
                  max={(() => {
                    const plazo = parseInt(watchedValues.plazo || "0");
                    const frecuencia = parseInt(
                      watchedValues.frecuenciaPago || "1"
                    );
                    return plazo > 0 && frecuencia > 0
                      ? plazo * frecuencia
                      : undefined;
                  })()}
                  placeholder="Ej: 2"
                  className="border-gray-300 focus:border-blue-500"
                />
                {form.formState.errors.nGracia && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {form.formState.errors.nGracia.message}
                  </p>
                )}

                {/* Validación en tiempo real simplificada */}
                {(() => {
                  const nGraciaValue = parseInt(watchedValues.nGracia || "0");
                  const plazo = parseInt(watchedValues.plazo || "0");
                  const frecuencia = parseInt(
                    watchedValues.frecuenciaPago || "1"
                  );
                  const totalPeriodos =
                    plazo > 0 && frecuencia > 0 ? plazo * frecuencia : 0;

                  const validacion = validarPeriodosGracia(
                    nGraciaValue,
                    totalPeriodos,
                    tipoGracia
                  );

                  if (!validacion.mensaje) return null;

                  const estilos = {
                    error: "bg-red-50 border-red-200 text-red-700",
                    success: "bg-green-50 border-green-200 text-green-700",
                    info: "bg-blue-50 border-blue-200 text-blue-700",
                  };

                  const iconos = {
                    error: <AlertCircle className="w-4 h-4" />,
                    success: <CheckCircle className="w-4 h-4" />,
                    info: <Info className="w-4 h-4" />,
                  };

                  return (
                    <div
                      className={`p-2 rounded border ${
                        estilos[validacion.tipo]
                      }`}
                    >
                      <p className={`text-xs flex items-center gap-1`}>
                        {iconos[validacion.tipo]}
                        {validacion.mensaje}
                      </p>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* MODO AVANZADO - SIMPLIFICADO */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-base font-semibold text-gray-800">
              Configuración por Períodos
            </h4>
            <Button
              type="button"
              onClick={agregarGraciaPeriodo}
              className="bg-orange-500 hover:bg-orange-600 text-white"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-1" />
              Agregar
            </Button>
          </div>

          <div className="space-y-3">
            {graciasPeriodo.map((gracia, index) => (
              <div key={gracia.id} className="bg-gray-50 rounded-lg border p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">
                    Rango #{index + 1}
                  </span>
                  {graciasPeriodo.length > 1 && (
                    <Button
                      type="button"
                      onClick={() => eliminarGraciaPeriodo(gracia.id)}
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs text-gray-600">Desde</Label>
                    <Input
                      type="number"
                      value={gracia.desde || ""}
                      onChange={(e) =>
                        actualizarGraciaPeriodo(
                          gracia.id,
                          "desde",
                          e.target.value ? parseInt(e.target.value) : 1
                        )
                      }
                      className="h-9 text-center"
                      min={
                        obtenerLimitesInput(
                          gracia,
                          "desde",
                          watchedValues.plazo || "0",
                          watchedValues.frecuenciaPago || "1"
                        ).min
                      }
                      max={
                        obtenerLimitesInput(
                          gracia,
                          "desde",
                          watchedValues.plazo || "0",
                          watchedValues.frecuenciaPago || "1"
                        ).max
                      }
                      placeholder="1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600">Hasta</Label>
                    <Input
                      type="number"
                      value={gracia.hasta || ""}
                      onChange={(e) =>
                        actualizarGraciaPeriodo(
                          gracia.id,
                          "hasta",
                          e.target.value ? parseInt(e.target.value) : 1
                        )
                      }
                      className="h-9 text-center"
                      min={
                        obtenerLimitesInput(
                          gracia,
                          "hasta",
                          watchedValues.plazo || "0",
                          watchedValues.frecuenciaPago || "1"
                        ).min
                      }
                      max={
                        obtenerLimitesInput(
                          gracia,
                          "hasta",
                          watchedValues.plazo || "0",
                          watchedValues.frecuenciaPago || "1"
                        ).max
                      }
                      placeholder="1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600">Tipo</Label>
                    <Select
                      value={gracia.tipoGracia}
                      onValueChange={(value) =>
                        actualizarGraciaPeriodo(gracia.id, "tipoGracia", value)
                      }
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Sin Gracia">Sin Gracia</SelectItem>
                        <SelectItem value="Total">Total</SelectItem>
                        <SelectItem value="Parcial">Parcial</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Validación simplificada */}
                {(() => {
                  const errorValidacion = validarGraciaContraTotalPeriodos(
                    gracia,
                    watchedValues.plazo || "0",
                    watchedValues.frecuenciaPago || "1"
                  );
                  const errorSolapamiento = validarSolapamientosGracia(
                    gracia,
                    graciasPeriodo
                  );
                  const error = errorValidacion || errorSolapamiento;

                  if (error) {
                    return (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                        <p className="text-xs text-red-700 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {error}
                        </p>
                      </div>
                    );
                  }

                  const plazo = parseInt(watchedValues.plazo || "0");
                  const frecuencia = parseInt(
                    watchedValues.frecuenciaPago || "1"
                  );
                  const totalPeriodos =
                    plazo > 0 && frecuencia > 0 ? plazo * frecuencia : 0;

                  if (
                    totalPeriodos > 0 &&
                    gracia.desde > 0 &&
                    gracia.hasta > 0
                  ) {
                    return (
                      <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                        <p className="text-xs text-green-700 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Rango válido: Períodos {gracia.desde} a {gracia.hasta}{" "}
                          con {gracia.tipoGracia}
                        </p>
                      </div>
                    );
                  }
                })()}
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
