"use client";

import React from "react";
import { UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { TrendingUp, AlertCircle, CheckCircle, Info } from "lucide-react";
import type { BonoFormData } from "./types";

interface CondicionesFinancierasProps {
  form: UseFormReturn<BonoFormData>;
  watchedValues: BonoFormData;
}

export function CondicionesFinancierasSection({
  form,
  watchedValues,
}: CondicionesFinancierasProps) {
  return (
    <Card className="p-6 border-green-300 bg-white shadow-sm">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="w-5 h-5 text-green-600" />
        <h3 className="text-xl font-bold text-green-900">
          Condiciones Financieras
        </h3>
        <Tooltip>
          <TooltipTrigger asChild>
            <AlertCircle className="w-4 h-4 text-green-400 cursor-pointer" />
          </TooltipTrigger>
          <TooltipContent>
            <p>Parámetros para el cálculo usando el método francés.</p>
            <p>Las cuotas serán constantes a lo largo del tiempo.</p>
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-gray-700">
            Tipo de Tasa *
          </Label>
          <Select
            value={form.watch("tipoTasa")}
            onValueChange={(value) => form.setValue("tipoTasa", value)}
          >
            <SelectTrigger className="border-gray-300 focus:border-blue-500">
              <SelectValue placeholder="Selecciona tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Efectiva">📈 Tasa Efectiva</SelectItem>
            </SelectContent>
          </Select>
          {form.formState.errors.tipoTasa && (
            <p className="text-sm text-red-500 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {form.formState.errors.tipoTasa.message}
            </p>
          )}
        </div>

        {/* Tasa Anual */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            Tasa Anual *
            <Tooltip>
              <TooltipTrigger asChild>
                <span tabIndex={0} className="cursor-help">
                  <Info className="w-3 h-3 text-gray-400" />
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>Tasa de interés anual. Rango válido: 2% - 10%</p>
              </TooltipContent>
            </Tooltip>
          </Label>
          <div className="relative">
            <Input
              {...form.register("tasaAnual")}
              type="number"
              step="0.01"
              min="2"
              max="10"
              placeholder="8.50"
              className="border-gray-300 focus:border-blue-500 pr-8"
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
              %
            </span>
          </div>
          {form.formState.errors.tasaAnual && (
            <p className="text-sm text-red-500 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {form.formState.errors.tasaAnual.message}
            </p>
          )}

          {/* Validación de tasa anual */}
          {watchedValues.tasaAnual &&
            parseFloat(watchedValues.tasaAnual) >= 2 &&
            parseFloat(watchedValues.tasaAnual) <= 10 && (
              <div className="mt-2 text-xs text-green-600 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Tasa válida para método francés
              </div>
            )}
          {watchedValues.tasaAnual &&
            (parseFloat(watchedValues.tasaAnual) > 10 ||
              parseFloat(watchedValues.tasaAnual) < 2) && (
              <div className="mt-2 text-xs text-orange-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                La tasa debe estar entre 2% y 10%
              </div>
            )}
          {watchedValues.tasaAnual &&
            parseFloat(watchedValues.tasaAnual) < 1 &&
            parseFloat(watchedValues.tasaAnual) > 0 && (
              <div className="mt-2 text-xs text-blue-600 flex items-center gap-1">
                <Info className="w-3 h-3" />
                Tasa baja - Confirme si es correcta
              </div>
            )}
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-semibold text-gray-700">
            Frecuencia de Pago *
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="w-3 h-3 text-gray-400 ml-1 cursor-pointer" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Cada cuánto se realizan los pagos de cuotas.</p>
                <p>Método francés: cuotas constantes en cada período.</p>
              </TooltipContent>
            </Tooltip>
          </Label>
          <Select
            value={form.watch("frecuenciaPago")}
            onValueChange={(value) => form.setValue("frecuenciaPago", value)}
          >
            <SelectTrigger className="border-gray-300 focus:border-blue-500">
              <SelectValue placeholder="Frecuencia" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2">📅 Semestral (2 pagos/año)</SelectItem>
              <SelectItem value="1">📅 Anual (1 pago/año)</SelectItem>
            </SelectContent>
          </Select>
          {form.formState.errors.frecuenciaPago && (
            <p className="text-sm text-red-500 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {form.formState.errors.frecuenciaPago.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            Plazo (años) *
            <Tooltip>
              <TooltipTrigger asChild>
                <span tabIndex={0} className="cursor-help">
                  <Info className="w-3 h-3 text-gray-400" />
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>Duración del bono. Rango válido: 3 - 10 años</p>
              </TooltipContent>
            </Tooltip>
          </Label>
          <Input
            {...form.register("plazo")}
            type="number"
            min="3"
            max="10"
            placeholder="5"
            className="border-gray-300 focus:border-blue-500"
          />
          {/* Validación inteligente en tiempo real para plazo */}
          {watchedValues.plazo && (
            <>
              {(() => {
                const plazoNum = parseInt(watchedValues.plazo);
                if (!isNaN(plazoNum) && plazoNum >= 3 && plazoNum <= 10) {
                  return (
                    <div className="mt-2 text-xs text-green-600 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Plazo válido para el bono corporativo
                    </div>
                  );
                } else if (!isNaN(plazoNum)) {
                  return (
                    <div className="mt-2 text-xs text-blue-600 flex items-center gap-1">
                      <Info className="w-3 h-3" />
                      El plazo debe estar entre 3 y 10 años
                    </div>
                  );
                }
                return null;
              })()}
            </>
          )}
          {form.formState.errors.plazo && (
            <p className="text-sm text-red-500 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {form.formState.errors.plazo.message}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
