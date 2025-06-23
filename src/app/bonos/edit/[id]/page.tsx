"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { BonoData } from "@/lib/bonoUtils";
import { calcularTREABono } from "@/lib/bonoUtils";

export default function EditarBonoPage() {
  const { firebaseUser } = useCurrentUser();
  const { id } = useParams();
  const router = useRouter();
  const [form, setForm] = useState<Partial<BonoData>>({});
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    if (!firebaseUser || !id) return;
    const ref = doc(db, "bonds", String(id));
    getDoc(ref).then((snap) => {
      if (!snap.exists() || snap.data().userId !== firebaseUser.uid) {
        router.replace("/bonos/list");
      } else {
        const data = snap.data() as Partial<BonoData>;
        setForm(data);
      }
    });
  }, [firebaseUser, id, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSelect = (name: keyof BonoData, value: string) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser || !id) return;

    // Preparar los datos actualizados
    const updatedData = {
      ...form,
      valorNominal: parseFloat(String(form.valorNominal)),
      tasaAnual: parseFloat(String(form.tasaAnual)),
      frecuenciaPago: parseInt(String(form.frecuenciaPago)),
      plazo: parseInt(String(form.plazo)),
      nGracia: form.nGracia ? parseInt(String(form.nGracia)) : undefined,
      comisionEmisor: parseFloat(String(form.comisionEmisor)),
      comisionBonista: parseFloat(String(form.comisionBonista)),
    } as BonoData;

    // Calcular automáticamente la tasa de rendimiento exigida (TREA)
    try {
      updatedData.tasaMercado = calcularTREABono(updatedData);
    } catch (error) {
      console.error("Error calculando TREA:", error);
      updatedData.tasaMercado = 0;
    }
    const ref = doc(db, "bonds", String(id));
    await updateDoc(ref, {
      ...updatedData,
    });
    setMensaje(
      "✅ Bono actualizado correctamente. TREA recalculado automáticamente."
    );
  };

  if (!firebaseUser)
    return <p className="p-6 text-center">Cargando sesión...</p>;
  if (!form.nombre) return <p className="p-6 text-center">Cargando bono...</p>;

  return (
    <main className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Editar Bono</h1>

      {mensaje && (
        <div className="mb-4 p-4 bg-green-100 text-green-800 rounded-md border border-green-300">
          {mensaje}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label>Nombre del Bono</Label>
            <Input
              name="nombre"
              value={form.nombre ?? ""}
              onChange={handleChange}
            />
          </div>
          <div>
            <Label>Valor Nominal</Label>
            <Input
              name="valorNominal"
              type="number"
              value={form.valorNominal ?? ""}
              onChange={handleChange}
            />
          </div>
          <div>
            <Label>Moneda</Label>
            <Select
              value={form.moneda ?? ""}
              onValueChange={(val) => handleSelect("moneda", val)}
            >
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
          <div>
            <Label>Tipo de Tasa</Label>
            <Select
              value={form.tipoTasa ?? ""}
              onValueChange={(val) => handleSelect("tipoTasa", val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tipo de tasa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Efectiva">Efectiva</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Tasa Anual</Label>
            <Input
              name="tasaAnual"
              type="number"
              value={form.tasaAnual ?? ""}
              onChange={handleChange}
            />
          </div>
          <div>
            <Label>Frecuencia de Pago</Label>
            <Select
              value={form.frecuenciaPago ? String(form.frecuenciaPago) : ""}
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
          <div>
            <Label>Plazo (años)</Label>
            <Input
              name="plazo"
              type="number"
              value={form.plazo ?? ""}
              onChange={handleChange}
            />
          </div>
          <div>
            <Label>Tipo de Gracia</Label>
            <Select
              value={form.tipoGracia ?? ""}
              onValueChange={(val) => handleSelect("tipoGracia", val)}
            >
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
                value={form.nGracia ?? ""}
                onChange={handleChange}
              />
            </div>
          )}
          <div>
            <Label>Fecha de Emisión</Label>
            <Input
              name="fechaEmision"
              type="date"
              value={
                typeof form.fechaEmision === "object" &&
                form.fechaEmision !== null &&
                "seconds" in form.fechaEmision
                  ? new Date(form.fechaEmision.seconds * 1000)
                      .toISOString()
                      .slice(0, 10)
                  : form.fechaEmision ?? ""
              }
              onChange={handleChange}
            />
          </div>
          <div>
            <Label>Comisión del Emisor</Label>
            <Input
              name="comisionEmisor"
              type="number"
              value={form.comisionEmisor ?? ""}
              onChange={handleChange}
            />
          </div>
          <div>
            <Label>Comisión del Bonista</Label>
            <Input
              name="comisionBonista"
              type="number"
              value={form.comisionBonista ?? ""}
              onChange={handleChange}
            />{" "}
          </div>{" "}
          <div>
            <Label>Tasa de Rendimiento Exigida (%)</Label>
            <div className="space-y-2">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-700 font-medium">
                  📊 Valor actual: {form.tasaMercado?.toFixed(4) || "0.0000"}%
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Se recalculará automáticamente al guardar cambios (TREA)
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-4 justify-end">
          <Button variant="outline" type="button" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button type="submit">Guardar Cambios</Button>
        </div>
      </form>
    </main>
  );
}
