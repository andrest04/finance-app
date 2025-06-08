"use client";

import { useState, useEffect } from "react";
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
import { saveBono, BonoData } from "@/lib/bonoUtils";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRouter } from "next/navigation";

const bonoFormSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  valorNominal: z.string().min(1, "El valor nominal es requerido"),
  moneda: z.string().min(1, "La moneda es requerida"),
  tipoTasa: z.string().min(1, "El tipo de tasa es requerido"),
  tasaAnual: z.string().min(1, "La tasa anual es requerida"),
  frecuenciaPago: z.string().min(1, "La frecuencia de pago es requerida"),
  frecuenciaCapitalizacion: z.string().optional(),
  plazo: z.string().min(1, "El plazo es requerido"),
  tipoGracia: z.string().min(1, "El tipo de gracia es requerido"),
  nGracia: z.string().optional(),
  fechaEmision: z.string().min(1, "La fecha de emisión es requerida"),
  comisionEmisor: z.string().min(1, "La comisión del emisor es requerida"),
  comisionBonista: z.string().min(1, "La comisión del bonista es requerida"),
  tasaMercado: z.string().min(1, "La tasa de mercado es requerida"),
});

type BonoFormData = z.infer<typeof bonoFormSchema>;

export default function BonoForm() {
  const { firebaseUser, profile } = useCurrentUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userCurrency, setUserCurrency] = useState("PEN");
  const router = useRouter();

  useEffect(() => {
    const loadUserSettings = async () => {
      if (!firebaseUser) return;

      try {
        const settingsRef = doc(
          db,
          "users",
          firebaseUser.uid,
          "settings",
          "preferences"
        );
        const settingsDoc = await getDoc(settingsRef);

        if (settingsDoc.exists()) {
          const settings = settingsDoc.data();
          setUserCurrency(settings.currency || "PEN");
        }
      } catch (error) {
        console.error("Error loading user settings:", error);
      }
    };

    loadUserSettings();
  }, [firebaseUser]);

  const form = useForm<BonoFormData>({
    resolver: zodResolver(bonoFormSchema),
    defaultValues: {
      nombre: "",
      valorNominal: "",
      moneda: userCurrency,
      tipoTasa: "",
      tasaAnual: "",
      frecuenciaPago: "ANUAL",
      frecuenciaCapitalizacion: "",
      plazo: "",
      tipoGracia: "",
      nGracia: "",
      fechaEmision: new Date().toISOString().split("T")[0],
      comisionEmisor: "",
      comisionBonista: "",
      tasaMercado: "",
    },
  });

  const tipoTasa = form.watch("tipoTasa");
  const tipoGracia = form.watch("tipoGracia");

  const onSubmit = async (data: BonoFormData) => {
    if (!firebaseUser) {
      toast.error("Debes iniciar sesión para registrar un bono.");
      return;
    }

    setIsSubmitting(true);
    try {
      const emisorNombre = profile
        ? `${profile.firstName} ${profile.lastName}`
        : "";

      // Crear el objeto base sin campos undefined
      const transformedData: BonoData = {
        nombre: data.nombre,
        valorNominal: parseFloat(data.valorNominal),
        moneda: data.moneda,
        tipoTasa: data.tipoTasa,
        tasaAnual: parseFloat(data.tasaAnual),
        frecuenciaPago: parseInt(data.frecuenciaPago),
        plazo: parseInt(data.plazo),
        tipoGracia: data.tipoGracia,
        fechaEmision: data.fechaEmision,
        comisionEmisor: parseFloat(data.comisionEmisor),
        comisionBonista: parseFloat(data.comisionBonista),
        tasaMercado: parseFloat(data.tasaMercado),
        userId: firebaseUser.uid,
        emisorNombre,
      };

      // Agregar campos opcionales solo si tienen valor
      if (data.frecuenciaCapitalizacion) {
        transformedData.frecuenciaCapitalizacion = parseInt(
          data.frecuenciaCapitalizacion
        );
      }
      if (data.nGracia) {
        transformedData.nGracia = parseInt(data.nGracia);
      }

      await saveBono(firebaseUser, transformedData);
      toast.success("¡Bono guardado correctamente!");
      form.reset();

      // Esperar un momento para asegurar que el toast se muestre
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Redirigir a la lista de bonos
      router.push("/bonos/list");
      router.refresh(); // Forzar una recarga de la página
    } catch (error) {
      console.error("Error al guardar:", error);
      toast.error("Ocurrió un error al guardar el bono.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-8 max-w-6xl mx-auto"
    >
      {/* DATOS BÁSICOS */}
      <section className="border border-blue-300 rounded-md p-4 space-y-4 bg-white shadow-sm">
        <h3 className="text-blue-700 font-semibold text-lg">Datos Básicos</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Nombre del Bono</Label>
            <Input {...form.register("nombre")} />
            {form.formState.errors.nombre && (
              <p className="text-sm text-red-500">
                {form.formState.errors.nombre.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Valor Nominal (VN)</Label>
            <Input
              {...form.register("valorNominal")}
              type="number"
              step="0.01"
            />
            {form.formState.errors.valorNominal && (
              <p className="text-sm text-red-500">
                {form.formState.errors.valorNominal.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="moneda">Moneda</Label>
            <Select
              value={form.watch("moneda")}
              onValueChange={(value) => form.setValue("moneda", value)}
            >
              <SelectTrigger id="moneda">
                <SelectValue placeholder="Selecciona una moneda" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PEN">Soles (PEN)</SelectItem>
                <SelectItem value="USD">Dólares (USD)</SelectItem>
                <SelectItem value="EUR">Euros (EUR)</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.moneda && (
              <p className="text-sm text-red-500">
                {form.formState.errors.moneda.message}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* TASA Y FRECUENCIA */}
      <section className="border border-blue-300 rounded-md p-4 space-y-4 bg-white shadow-sm">
        <h3 className="text-blue-700 font-semibold text-lg">
          Tasa y Frecuencia
        </h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Tipo de Tasa</Label>
            <Select onValueChange={(val) => form.setValue("tipoTasa", val)}>
              <SelectTrigger>
                <SelectValue placeholder="Nominal o Efectiva" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Nominal">Nominal</SelectItem>
                <SelectItem value="Efectiva">Efectiva</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.tipoTasa && (
              <p className="text-sm text-red-500">
                {form.formState.errors.tipoTasa.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Tasa Anual (%)</Label>
            <Input {...form.register("tasaAnual")} type="number" step="0.01" />
            {form.formState.errors.tasaAnual && (
              <p className="text-sm text-red-500">
                {form.formState.errors.tasaAnual.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Frecuencia de Pago (f)</Label>
            <Select
              onValueChange={(val) => form.setValue("frecuenciaPago", val)}
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
            {form.formState.errors.frecuenciaPago && (
              <p className="text-sm text-red-500">
                {form.formState.errors.frecuenciaPago.message}
              </p>
            )}
          </div>
          {tipoTasa === "Nominal" && (
            <div className="space-y-2">
              <Label>Capitalización</Label>
              <Select
                onValueChange={(val) =>
                  form.setValue("frecuenciaCapitalizacion", val)
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
              {form.formState.errors.frecuenciaCapitalizacion && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.frecuenciaCapitalizacion.message}
                </p>
              )}
            </div>
          )}
        </div>
      </section>

      {/* PLAZO Y GRACIA */}
      <section className="border border-blue-300 rounded-md p-4 space-y-4 bg-white shadow-sm">
        <h3 className="text-blue-700 font-semibold text-lg">Plazo y Gracia</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Plazo (años)</Label>
            <Input {...form.register("plazo")} type="number" />
            {form.formState.errors.plazo && (
              <p className="text-sm text-red-500">
                {form.formState.errors.plazo.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Tipo de Gracia</Label>
            <Select onValueChange={(val) => form.setValue("tipoGracia", val)}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo de gracia" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Sin Gracia">Sin Gracia</SelectItem>
                <SelectItem value="Parcial">Parcial</SelectItem>
                <SelectItem value="Total">Total</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.tipoGracia && (
              <p className="text-sm text-red-500">
                {form.formState.errors.tipoGracia.message}
              </p>
            )}
          </div>
          {(tipoGracia === "Parcial" || tipoGracia === "Total") && (
            <div className="space-y-2">
              <Label>N° Períodos de Gracia</Label>
              <Input {...form.register("nGracia")} type="number" />
              {form.formState.errors.nGracia && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.nGracia.message}
                </p>
              )}
            </div>
          )}
          <div className="space-y-2">
            <Label>Fecha de Emisión</Label>
            <Input {...form.register("fechaEmision")} type="date" />
            {form.formState.errors.fechaEmision && (
              <p className="text-sm text-red-500">
                {form.formState.errors.fechaEmision.message}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* COSTOS Y TASAS DE DESCUENTO */}
      <section className="border border-blue-300 rounded-md p-4 space-y-4 bg-white shadow-sm">
        <h3 className="text-blue-700 font-semibold text-lg">
          Costos y Descuento
        </h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Comisión Emisor (%)</Label>
            <Input
              {...form.register("comisionEmisor")}
              type="number"
              step="0.01"
            />
            {form.formState.errors.comisionEmisor && (
              <p className="text-sm text-red-500">
                {form.formState.errors.comisionEmisor.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Comisión Bonista (%)</Label>
            <Input
              {...form.register("comisionBonista")}
              type="number"
              step="0.01"
            />
            {form.formState.errors.comisionBonista && (
              <p className="text-sm text-red-500">
                {form.formState.errors.comisionBonista.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Tasa Mercado (TREA)</Label>
            <Input
              {...form.register("tasaMercado")}
              type="number"
              step="0.01"
            />
            {form.formState.errors.tasaMercado && (
              <p className="text-sm text-red-500">
                {form.formState.errors.tasaMercado.message}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* BOTONES */}
      <div className="flex justify-end gap-4">
        <Button
          variant="outline"
          type="button"
          onClick={() => form.reset()}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            "Guardar Bono"
          )}
        </Button>
      </div>
    </form>
  );
}
