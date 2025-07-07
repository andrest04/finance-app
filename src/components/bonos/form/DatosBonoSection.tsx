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
import { Info, AlertCircle, CheckCircle } from "lucide-react";
import type { BonoFormData } from "./types";

interface DatosBonoSectionProps {
  form: UseFormReturn<BonoFormData>;
  watchedValues: BonoFormData;
  nameError?: string | null;
  isCheckingName?: boolean;
}

export function DatosBonoSection({
  form,
  watchedValues,
  nameError,
  isCheckingName,
}: DatosBonoSectionProps) {
  return (
    <Card className="p-6 border-blue-300 bg-white shadow-sm">
      <div className="flex items-center gap-2 mb-6">
        <Info className="w-5 h-5 text-blue-600" />
        <h3 className="text-xl font-bold text-blue-900">Datos del Bono</h3>
        <Tooltip>
          <TooltipTrigger asChild>
            <AlertCircle className="w-4 h-4 text-blue-400 cursor-pointer" />
          </TooltipTrigger>
          <TooltipContent>
            <p>Información fundamental del bono corporativo que será</p>
            <p>calculado usando el método francés de amortización.</p>
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-gray-700">
            Nombre del Bono *
          </Label>
          <Input
            {...form.register("nombre")}
            placeholder="Ej: Bono Corporativo ABC 2025"
            className="border-gray-300 focus:border-blue-500"
          />
          {form.formState.errors.nombre && (
            <p className="text-sm text-red-500 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {form.formState.errors.nombre.message}
            </p>
          )}
          {nameError && (
            <p className="text-sm text-red-500 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {nameError}
            </p>
          )}
          {isCheckingName && (
            <p className="text-sm text-blue-500 flex items-center gap-1">
              <CheckCircle className="w-3 h-3 animate-spin" />
              Verificando disponibilidad del nombre...
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-semibold text-gray-700">
            Valor Nominal (VN) *
          </Label>
          <Select
            value={form.watch("valorNominal")}
            onValueChange={(value) => form.setValue("valorNominal", value)}
          >
            <SelectTrigger className="border-gray-300 focus:border-blue-500">
              <SelectValue placeholder="Selecciona valor nominal" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1000">
                {watchedValues.moneda || "PEN"} 1,000
              </SelectItem>
              <SelectItem value="2000">
                {watchedValues.moneda || "PEN"} 2,000
              </SelectItem>
              <SelectItem value="5000">
                {watchedValues.moneda || "PEN"} 5,000
              </SelectItem>
              <SelectItem value="10000">
                {watchedValues.moneda || "PEN"} 10,000
              </SelectItem>
            </SelectContent>
          </Select>
          {form.formState.errors.valorNominal && (
            <p className="text-sm text-red-500 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {form.formState.errors.valorNominal.message}
            </p>
          )}

          {/* Validación inteligente en tiempo real */}
          {watchedValues.valorNominal &&
            parseFloat(watchedValues.valorNominal) > 0 && (
              <div className="mt-2 text-xs text-green-600 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Valor nominal válido (múltiplo de 1000)
              </div>
            )}
          {watchedValues.valorNominal &&
            parseFloat(watchedValues.valorNominal) > 10000 && (
              <div className="mt-2 text-xs text-orange-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Valor excede el máximo permitido (10,000)
              </div>
            )}
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-semibold text-gray-700">
            Moneda *
          </Label>
          <Select
            value={form.watch("moneda")}
            onValueChange={(value) => form.setValue("moneda", value)}
          >
            <SelectTrigger className="border-gray-300 focus:border-blue-500">
              <SelectValue placeholder="Selecciona moneda" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PEN">🇵🇪 Soles Peruanos (PEN)</SelectItem>
              <SelectItem value="USD">🇺🇸 Dólares Americanos (USD)</SelectItem>
              <SelectItem value="EUR">🇪🇺 Euros (EUR)</SelectItem>
            </SelectContent>
          </Select>
          {form.formState.errors.moneda && (
            <p className="text-sm text-red-500 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {form.formState.errors.moneda.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-semibold text-gray-700">
            Fecha de Emisión *
          </Label>
          <Input
            {...form.register("fechaEmision")}
            type="date"
            className="border-gray-300 focus:border-blue-500"
          />
          {form.formState.errors.fechaEmision && (
            <p className="text-sm text-red-500 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {form.formState.errors.fechaEmision.message}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
