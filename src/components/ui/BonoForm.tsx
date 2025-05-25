"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { saveBono } from "@/lib/bonoUtils";
import { useCurrentUser } from "@/lib/useCurrentUser";

export default function BonoForm() {
  const { firebaseUser } = useCurrentUser();
  const [form, setForm] = useState({
    nombre: "",
    valorNominal: "",
    moneda: "",
    tipoTasa: "",
    tasaAnual: "",
    frecuenciaPago: "",
    frecuenciaCapitalizacion: "",
    plazo: "",
    tipoGracia: "",
    nGracia: "",
    fechaEmision: "",
    comisionEmisor: "",
    comisionBonista: "",
    tasaMercado: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSelect = (name: string, value: string) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser) {
      alert("Debes iniciar sesión para registrar un bono.");
      return;
    }

    try {
      const formNum = {
        ...form,
        valorNominal: parseFloat(form.valorNominal),
        tasaAnual: parseFloat(form.tasaAnual),
        frecuenciaPago: parseInt(form.frecuenciaPago),
        frecuenciaCapitalizacion: form.frecuenciaCapitalizacion
          ? parseInt(form.frecuenciaCapitalizacion)
          : undefined,
        plazo: parseInt(form.plazo),
        nGracia: form.nGracia ? parseInt(form.nGracia) : undefined,
        comisionEmisor: parseFloat(form.comisionEmisor),
        comisionBonista: parseFloat(form.comisionBonista),
        tasaMercado: parseFloat(form.tasaMercado),
      };

      await saveBono(firebaseUser, formNum);
      alert("¡Bono guardado correctamente!");
    } catch (error) {
      console.error("Error al guardar:", error);
      alert("Ocurrió un error al guardar el bono.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-6xl mx-auto">
      {/* DATOS BÁSICOS */}
      <section className="border border-blue-300 rounded-md p-4 space-y-4">
        <h3 className="text-blue-700 font-semibold">Datos Básicos</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <Label>Nombre del Bono</Label>
            <Input name="nombre" value={form.nombre} onChange={handleChange} />
          </div>
          <div>
            <Label>Valor Nominal (VN)</Label>
            <Input
              name="valorNominal"
              type="number"
              value={form.valorNominal}
              onChange={handleChange}
            />
          </div>
          <div>
            <Label>Moneda</Label>
            <Select onValueChange={(val) => handleSelect("moneda", val)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona moneda" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PEN">PEN</SelectItem>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* TASA Y FRECUENCIA */}
      <section className="border border-blue-300 rounded-md p-4 space-y-4">
        <h3 className="text-blue-700 font-semibold">Tasa y Frecuencia</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <Label>Tipo de Tasa</Label>
            <Select onValueChange={(val) => handleSelect("tipoTasa", val)}>
              <SelectTrigger>
                <SelectValue placeholder="Nominal o Efectiva" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Nominal">Nominal</SelectItem>
                <SelectItem value="Efectiva">Efectiva</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Tasa Anual (%)</Label>
            <Input
              name="tasaAnual"
              type="number"
              value={form.tasaAnual}
              onChange={handleChange}
            />
          </div>
          <div>
            <Label>Frecuencia de Pago (f)</Label>
            <Select
              onValueChange={(val) => handleSelect("frecuenciaPago", val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Frecuencia" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="12">Mensual</SelectItem>
                <SelectItem value="6">Bimestral</SelectItem>
                <SelectItem value="4">Trimestral</SelectItem>
                <SelectItem value="3">Cuatrimestral</SelectItem>
                <SelectItem value="2">Semestral</SelectItem>
                <SelectItem value="1">Anual</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {form.tipoTasa === "Nominal" && (
            <div className="md:col-span-1">
              <Label>Capitalización</Label>
              <Select
                onValueChange={(val) =>
                  handleSelect("frecuenciaCapitalizacion", val)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Capitalización" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="360">Diaria</SelectItem>
                  <SelectItem value="12">Mensual</SelectItem>
                  <SelectItem value="6">Bimestral</SelectItem>
                  <SelectItem value="4">Trimestral</SelectItem>
                  <SelectItem value="3">Cuatrimestral</SelectItem>
                  <SelectItem value="2">Semestral</SelectItem>
                  <SelectItem value="1">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </section>

      {/* PLAZO Y GRACIA */}
      <section className="border border-blue-300 rounded-md p-4 space-y-4">
        <h3 className="text-blue-700 font-semibold">Plazo y Gracia</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <Label>Plazo (años)</Label>
            <Input
              name="plazo"
              type="number"
              value={form.plazo}
              onChange={handleChange}
            />
          </div>
          <div>
            <Label>Tipo de Gracia</Label>
            <Select onValueChange={(val) => handleSelect("tipoGracia", val)}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo de gracia" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Sin Gracia">Sin Gracia</SelectItem>
                <SelectItem value="Parcial">Parcial</SelectItem>
                <SelectItem value="Total">Total</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {(form.tipoGracia === "Parcial" || form.tipoGracia === "Total") && (
            <div>
              <Label>N° Períodos de Gracia</Label>
              <Input
                name="nGracia"
                type="number"
                value={form.nGracia}
                onChange={handleChange}
              />
            </div>
          )}
          <div>
            <Label>Fecha de Emisión</Label>
            <Input
              name="fechaEmision"
              type="date"
              value={form.fechaEmision}
              onChange={handleChange}
            />
          </div>
        </div>
      </section>

      {/* COSTOS Y TASAS DE DESCUENTO */}
      <section className="border border-blue-300 rounded-md p-4 space-y-4">
        <h3 className="text-blue-700 font-semibold">Costos y Descuento</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <Label>Comisión Emisor (%)</Label>
            <Input
              name="comisionEmisor"
              type="number"
              value={form.comisionEmisor}
              onChange={handleChange}
            />
          </div>
          <div>
            <Label>Comisión Bonista (%)</Label>
            <Input
              name="comisionBonista"
              type="number"
              value={form.comisionBonista}
              onChange={handleChange}
            />
          </div>
          <div>
            <Label>Tasa Mercado (TREA)</Label>
            <Input
              name="tasaMercado"
              type="number"
              value={form.tasaMercado}
              onChange={handleChange}
            />
          </div>
        </div>
      </section>

      {/* BOTONES */}
      <div className="flex justify-end gap-4">
        <Button
          variant="outline"
          type="button"
          onClick={() => console.log("Cancelado")}
        >
          Cancelar
        </Button>
        <Button type="submit">Guardar Bono</Button>
      </div>
    </form>
  );
}
