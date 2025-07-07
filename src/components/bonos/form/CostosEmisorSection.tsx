"use client";

import React from "react";
import { UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { Calculator, AlertCircle, CheckCircle, Info } from "lucide-react";
import type { BonoFormData } from "./types";

interface CostosEmisorSectionProps {
  form: UseFormReturn<BonoFormData>;
  watchedValues: BonoFormData;
}

export function CostosEmisorSection({
  form,
  watchedValues,
}: CostosEmisorSectionProps) {
  return (
    <Card className="p-6 border-purple-300 bg-white shadow-sm">
      <div className="flex items-center gap-2 mb-6">
        <Calculator className="w-5 h-5 text-purple-600" />
        <h3 className="text-xl font-bold text-purple-900">Costos del Emisor</h3>
        <Tooltip>
          <TooltipTrigger asChild>
            <AlertCircle className="w-4 h-4 text-purple-400 cursor-pointer" />
          </TooltipTrigger>
          <TooltipContent>
            <p>
              Costos asociados con la estructuración, colocación y
              administración del bono
            </p>
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            Estructuración (%) *
            <Tooltip>
              <TooltipTrigger asChild>
                <span tabIndex={0} className="cursor-help">
                  <Info className="w-3 h-3 text-gray-400" />
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>Comisión del emisor. Rango válido: 0% - 10%</p>
              </TooltipContent>
            </Tooltip>
          </Label>
          <div className="relative">
            <Input
              {...form.register("comisionEmisor")}
              type="number"
              step="0.01"
              min="0"
              max="10"
              placeholder="0.50"
              className="border-gray-300 focus:border-blue-500 pr-8"
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
              %
            </span>
          </div>
          {form.formState.errors.comisionEmisor && (
            <p className="text-sm text-red-500 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {form.formState.errors.comisionEmisor.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            Colocación (%) *
            <Tooltip>
              <TooltipTrigger asChild>
                <span tabIndex={0} className="cursor-help">
                  <Info className="w-3 h-3 text-gray-400" />
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>Comisión del bonista. Rango válido: 0% - 10%</p>
              </TooltipContent>
            </Tooltip>
          </Label>
          <div className="relative">
            <Input
              {...form.register("comisionBonista")}
              type="number"
              step="0.01"
              min="0"
              max="10"
              placeholder="0.25"
              className="border-gray-300 focus:border-blue-500 pr-8"
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
              %
            </span>
          </div>
          {form.formState.errors.comisionBonista && (
            <p className="text-sm text-red-500 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {form.formState.errors.comisionBonista.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            Tasa de Mercado (COK) % *
            <Tooltip>
              <TooltipTrigger asChild>
                <span tabIndex={0} className="cursor-help">
                  <Info className="w-3 h-3 text-gray-400" />
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>Costo de Oportunidad del Capital. Rango válido: 3% - 20%</p>
              </TooltipContent>
            </Tooltip>
          </Label>
          <div className="relative">
            <Input
              {...form.register("tasaMercadoCOK")}
              type="number"
              step="0.01"
              min="3"
              max="20"
              placeholder="8.50"
              className="border-gray-300 focus:border-blue-500 pr-8"
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
              %
            </span>
          </div>
          {form.formState.errors.tasaMercadoCOK && (
            <p className="text-sm text-red-500 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {form.formState.errors.tasaMercadoCOK.message}
            </p>
          )}

          {/* Validación inteligente en tiempo real */}
          {watchedValues.tasaMercadoCOK && (
            <>
              {(() => {
                const tasa = parseFloat(watchedValues.tasaMercadoCOK);
                if (!isNaN(tasa) && tasa >= 3 && tasa <= 20) {
                  return (
                    <div className="mt-2 text-xs text-green-600 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Tasa COK válida para análisis de rentabilidad
                    </div>
                  );
                } else if (!isNaN(tasa)) {
                  return (
                    <div className="mt-2 text-xs text-orange-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      La tasa COK debe estar entre 3% y 20%
                    </div>
                  );
                }
                return null;
              })()}
            </>
          )}
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-semibold text-gray-700">
            CAVALI (%)
          </Label>
          <div className="relative">
            <Input
              defaultValue="0.50"
              disabled
              className="bg-gray-100 text-gray-600 border-gray-300 pr-8"
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
              %
            </span>
          </div>
          <p className="text-xs text-gray-500">
            Valor fijo establecido por CAVALI
          </p>
        </div>
      </div>
    </Card>
  );
}
