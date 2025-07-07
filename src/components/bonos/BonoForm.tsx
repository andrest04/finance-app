"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { saveBono, BonoData, calcularTREABono } from "@/lib/bono/bonoUtils";
import { useCurrentUser } from "@/lib/firebase/useCurrentUser";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

// Importar componentes y utilidades modularizadas
import {
  bonoFormSchema,
  type BonoFormData,
  DatosBonoSection,
  CondicionesFinancierasSection,
  CostosEmisorSection,
  GraciaSection,
  ResultadosSection,
  RealTimeCalculationsPanel,
  FrenchMethodPreview,
  DynamicGracePreview,
  ExportAnalysisButton,
  useDynamicGracePeriods,
  useRealTimeCalculations,
  useUserSettings,
} from "./form";

export default function BonoFormEnhanced() {
  const { firebaseUser, profile } = useCurrentUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [esGraciaDinamica, setEsGraciaDinamica] = useState(false);
  const router = useRouter();

  // Form setup
  const form = useForm<BonoFormData>({
    resolver: zodResolver(bonoFormSchema),
    defaultValues: {
      nombre: "",
      valorNominal: "",
      moneda: "PEN",
      tipoTasa: "Efectiva",
      tasaAnual: "",
      frecuenciaPago: "1",
      plazo: "",
      tipoGracia: "Sin Gracia",
      esGraciaDinamica: false,
      nGracia: "0",
      fechaEmision: new Date().toISOString().split("T")[0],
      comisionEmisor: "0",
      comisionBonista: "0",
      tasaMercadoCOK: "",
    },
  });

  // Watch form values for real-time updates
  const watchedValues = form.watch();
  const tipoGracia = form.watch("tipoGracia");

  // Custom hooks for modular functionality
  useUserSettings(firebaseUser, form);

  const {
    graciasPeriodo,
    setGraciasPeriodo,
    agregarGraciaPeriodo,
    eliminarGraciaPeriodo,
    actualizarGraciaPeriodo,
    validarGraciaContraTotalPeriodos,
    generarVistaGraciaPeriodos,
  } = useDynamicGracePeriods(watchedValues, esGraciaDinamica);

  const calculatedMetrics = useRealTimeCalculations(
    watchedValues,
    firebaseUser,
    esGraciaDinamica,
    graciasPeriodo
  );

  // Auto-manage nGracia based on tipoGracia
  useEffect(() => {
    if (tipoGracia === "Sin Gracia") {
      form.setValue("nGracia", "0");
    } else if (tipoGracia === "Parcial" || tipoGracia === "Total") {
      // Si se selecciona gracia pero no hay valor, sugerir un valor por defecto
      const currentValue = form.getValues("nGracia");
      if (!currentValue || currentValue === "0") {
        form.setValue("nGracia", "1");
      }
    }
  }, [tipoGracia, form]);

  const onSubmit = async (data: BonoFormData) => {
    if (!firebaseUser) {
      toast.error("Debes iniciar sesión para registrar un bono.");
      return;
    }

    // Validate dynamic grace if enabled
    if (esGraciaDinamica) {
      const hasValidGrace = graciasPeriodo.some(
        (periodo) => periodo.desde > 0 && periodo.hasta > 0
      );
      if (!hasValidGrace) {
        toast.error("Debe configurar al menos un rango de gracia válido.");
        return;
      }

      // Validar que los períodos de gracia no excedan el total
      for (const gracia of graciasPeriodo) {
        const errorValidacion = validarGraciaContraTotalPeriodos(gracia);
        if (errorValidacion) {
          toast.error(`Error en período de gracia: ${errorValidacion}`);
          return;
        }
      }

      // Validar que no haya solapamientos en los rangos
      for (let i = 0; i < graciasPeriodo.length; i++) {
        for (let j = i + 1; j < graciasPeriodo.length; j++) {
          const gracia1 = graciasPeriodo[i];
          const gracia2 = graciasPeriodo[j];

          if (
            (gracia1.desde <= gracia2.hasta &&
              gracia1.hasta >= gracia2.desde) ||
            (gracia2.desde <= gracia1.hasta && gracia2.hasta >= gracia1.desde)
          ) {
            toast.error(
              `Los rangos de gracia se solapan: Rango ${i + 1} (${
                gracia1.desde
              }-${gracia1.hasta}) y Rango ${j + 1} (${gracia2.desde}-${
                gracia2.hasta
              })`
            );
            return;
          }
        }
      }
    }

    setIsSubmitting(true);
    try {
      const emisorNombre = profile
        ? `${profile.firstName} ${profile.lastName}`
        : "";
      const transformedData: BonoData = {
        nombre: data.nombre,
        valorNominal: parseFloat(data.valorNominal),
        moneda: data.moneda,
        tipoTasa: data.tipoTasa,
        tasaAnual: parseFloat(data.tasaAnual),
        frecuenciaPago: parseInt(data.frecuenciaPago),
        plazo: parseInt(data.plazo),
        tipoGracia: esGraciaDinamica ? "Sin Gracia" : data.tipoGracia,
        fechaEmision: data.fechaEmision,
        comisionEmisor: parseFloat(data.comisionEmisor),
        comisionBonista: parseFloat(data.comisionBonista),
        tasaMercadoCOK: parseFloat(data.tasaMercadoCOK),
        tasaMercado: 0, // Will be calculated automatically
        userId: firebaseUser.uid,
        emisorNombre,
      };

      // Add optional fields for dynamic grace
      if (esGraciaDinamica) {
        transformedData.esGraciaDinamica = true;
        transformedData.graciasPorPeriodo = graciasPeriodo.map((g) => ({
          desde: g.desde,
          hasta: g.hasta,
          tipoGracia: g.tipoGracia,
        }));
      }

      // Calculate TREA automatically
      transformedData.tasaMercado = calcularTREABono(transformedData);

      // Add optional fields
      if (data.nGracia) {
        transformedData.nGracia = parseInt(data.nGracia);
      }

      await saveBono(firebaseUser, transformedData);

      const successMessage = esGraciaDinamica
        ? "¡Bono registrado exitosamente con períodos de gracia dinámicos!"
        : "¡Bono registrado exitosamente con el método francés!";

      toast.success(successMessage);
      form.reset();

      await new Promise((resolve) => setTimeout(resolve, 1000));
      router.push("/bonos/list");
      router.refresh();
    } catch (error) {
      console.error("Error al guardar:", error);
      toast.error("Ocurrió un error al registrar el bono.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {" "}
            {/* DATOS DEL BONO */}
            <DatosBonoSection form={form} watchedValues={watchedValues} />
            {/* CONDICIONES FINANCIERAS */}
            <CondicionesFinancierasSection
              form={form}
              watchedValues={watchedValues}
            />
            {/* CONDICIONES DE GRACIA */}
            <GraciaSection
              form={form}
              watchedValues={watchedValues}
              esGraciaDinamica={esGraciaDinamica}
              setEsGraciaDinamica={setEsGraciaDinamica}
              graciasPeriodo={graciasPeriodo}
              setGraciasPeriodo={setGraciasPeriodo}
              agregarGraciaPeriodo={agregarGraciaPeriodo}
              eliminarGraciaPeriodo={eliminarGraciaPeriodo}
              actualizarGraciaPeriodo={actualizarGraciaPeriodo}
            />
            {/* COSTOS DEL EMISOR */}
            <CostosEmisorSection form={form} watchedValues={watchedValues} />
            {/* RESULTADOS */}
            <ResultadosSection calculatedMetrics={calculatedMetrics} />
            {/* EXPORTAR ANÁLISIS */}
            <ExportAnalysisButton
              calculatedMetrics={calculatedMetrics}
              watchedValues={watchedValues}
            />
            {/* VALIDATION SUMMARY */}
            {Object.keys(form.formState.errors).length > 0 && (
              <Card className="p-4 border-red-200 bg-red-50">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-semibold text-red-800 mb-2">
                      Por favor, corrige los siguientes errores:
                    </h3>
                    <ul className="text-sm text-red-700 space-y-1">
                      {Object.entries(form.formState.errors).map(
                        ([field, error]) => (
                          <li key={field} className="flex items-center gap-2">
                            <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                            {error?.message || `Error en ${field}`}
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                </div>
              </Card>
            )}
            {/* SUBMIT BUTTON */}
            <div className="flex justify-end pt-6">
              <Button
                type="submit"
                disabled={
                  isSubmitting || Object.keys(form.formState.errors).length > 0
                }
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-lg shadow-lg transform transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Registrando Bono...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-5 w-5" />
                    Registrar Bono Corporativo
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>

        {/* REAL-TIME CALCULATIONS PANEL */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 space-y-4">
            <RealTimeCalculationsPanel
              calculatedMetrics={calculatedMetrics}
              watchedValues={watchedValues}
            />

            {/* VISTA PREVIA DEL MÉTODO FRANCÉS */}
            <FrenchMethodPreview
              calculatedMetrics={calculatedMetrics}
              watchedValues={watchedValues}
            />
          </div>
        </div>
      </div>

      {/* VISTA PREVIA DE PERÍODOS PARA GRACIA DINÁMICA */}
      <DynamicGracePreview
        esGraciaDinamica={esGraciaDinamica}
        generarVistaGraciaPeriodos={generarVistaGraciaPeriodos}
      />
    </div>
  );
}
