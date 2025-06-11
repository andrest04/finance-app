"use client";

import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  saveBono,
  BonoData,
  calcularTCEABono,
  calcularTREABono,
} from "@/lib/bonoUtils";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Loader2,
  Info,
  Calculator,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  BarChart3,
} from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { calcularFlujoFrances } from "@/lib/francesMetod";

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
});

type BonoFormData = z.infer<typeof bonoFormSchema>;

interface CalculatedMetrics {
  tcea: number;
  trea: number;
  totalPeriodos: number;
  cuotaConstante: number;
  totalIntereses: number;
  totalPagado: number;
  duracion: number;
  convexidad: number;
}

export default function BonoFormEnhanced() {
  const { firebaseUser, profile } = useCurrentUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userCurrency, setUserCurrency] = useState("PEN");
  const [showCalculations, setShowCalculations] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const router = useRouter();

  // Form setup
  const form = useForm<BonoFormData>({
    resolver: zodResolver(bonoFormSchema),
    defaultValues: {
      nombre: "",
      valorNominal: "",
      moneda: userCurrency,
      tipoTasa: "",
      tasaAnual: "",
      frecuenciaPago: "1",
      frecuenciaCapitalizacion: "",
      plazo: "",
      tipoGracia: "Sin Gracia",
      nGracia: "0",
      fechaEmision: new Date().toISOString().split("T")[0],
      comisionEmisor: "0",
      comisionBonista: "0",
    },
  });

  // Watch form values for real-time updates
  const watchedValues = form.watch();
  const tipoTasa = form.watch("tipoTasa");
  const tipoGracia = form.watch("tipoGracia");

  // Calculate completion percentage
  const completionPercentage = useMemo(() => {
    const requiredFields = [
      "nombre",
      "valorNominal",
      "moneda",
      "tipoTasa",
      "tasaAnual",
      "frecuenciaPago",
      "plazo",
      "tipoGracia",
      "fechaEmision",
      "comisionEmisor",
      "comisionBonista",
    ];

    const completedFields = requiredFields.filter((field) => {
      const value = watchedValues[field as keyof BonoFormData];
      return value && value.trim() !== "";
    }).length;

    return Math.round((completedFields / requiredFields.length) * 100);
  }, [watchedValues]);

  // Real-time calculations
  const calculatedMetrics = useMemo((): CalculatedMetrics | null => {
    const {
      valorNominal,
      tasaAnual,
      frecuenciaPago,
      plazo,
      tipoGracia,
      nGracia,
      comisionEmisor,
      comisionBonista,
    } = watchedValues;

    if (!valorNominal || !tasaAnual || !frecuenciaPago || !plazo) {
      return null;
    }

    try {
      const bonoData: BonoData = {
        nombre: watchedValues.nombre || "Bono Temporal",
        valorNominal: parseFloat(valorNominal),
        moneda: watchedValues.moneda || "PEN",
        tipoTasa: watchedValues.tipoTasa || "Efectiva",
        tasaAnual: parseFloat(tasaAnual),
        frecuenciaPago: parseInt(frecuenciaPago),
        plazo: parseInt(plazo),
        tipoGracia: tipoGracia || "Sin Gracia",
        nGracia: parseInt(nGracia || "0"),
        fechaEmision:
          watchedValues.fechaEmision || new Date().toISOString().split("T")[0],
        comisionEmisor: parseFloat(comisionEmisor || "0"),
        comisionBonista: parseFloat(comisionBonista || "0"),
        tasaMercado: 0, // Will be calculated
        userId: firebaseUser?.uid || "",
        emisorNombre: "",
        frecuenciaCapitalizacion: watchedValues.frecuenciaCapitalizacion
          ? parseInt(watchedValues.frecuenciaCapitalizacion)
          : undefined,
      };

      // Calculate TCEA and TREA
      const tcea = calcularTCEABono(bonoData);
      const trea = calcularTREABono(bonoData);

      // Calculate cash flows using French method
      const mapGracia = (tipo: string): "Ninguno" | "Total" | "Parcial" => {
        if (tipo === "Sin Gracia") return "Ninguno";
        if (tipo === "Total") return "Total";
        if (tipo === "Parcial") return "Parcial";
        return "Ninguno";
      };

      const flujos = calcularFlujoFrances({
        valorNominal: bonoData.valorNominal,
        tasaAnual: bonoData.tasaAnual,
        frecuenciaPago: bonoData.frecuenciaPago,
        plazo: bonoData.plazo,
        gracia: mapGracia(bonoData.tipoGracia),
        numPeriodosGracia: bonoData.nGracia || 0,
      });

      const totalPeriodos = flujos.length;
      const cuotaConstante = flujos.length > 0 ? flujos[0].cuota : 0;
      const totalIntereses = flujos.reduce((sum, f) => sum + f.interes, 0);
      const totalPagado = flujos.reduce((sum, f) => sum + f.cuota, 0);

      // Basic duration calculation (simplified)
      const duracion = totalPeriodos / 2; // Simplified calculation
      const convexidad = duracion * 1.5; // Simplified calculation

      return {
        tcea,
        trea,
        totalPeriodos,
        cuotaConstante,
        totalIntereses,
        totalPagado,
        duracion,
        convexidad,
      };
    } catch (error) {
      console.error("Error calculating metrics:", error);
      return null;
    }
  }, [watchedValues, firebaseUser]);

  // Load user settings
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
          const currency = settings.currency || "PEN";
          setUserCurrency(currency);
          form.setValue("moneda", currency);
        }
      } catch (error) {
        console.error("Error loading user settings:", error);
      }
    };

    loadUserSettings();
  }, [firebaseUser, form]);

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
        tasaMercado: 0, // Will be calculated automatically
        userId: firebaseUser.uid,
        emisorNombre,
      };

      // Calculate TREA automatically
      transformedData.tasaMercado = calcularTREABono(transformedData);

      // Add optional fields
      if (data.frecuenciaCapitalizacion) {
        transformedData.frecuenciaCapitalizacion = parseInt(
          data.frecuenciaCapitalizacion
        );
      }
      if (data.nGracia) {
        transformedData.nGracia = parseInt(data.nGracia);
      }

      await saveBono(firebaseUser, transformedData);
      toast.success("¡Bono registrado exitosamente con el método francés!");
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

  const frequencyLabels: { [key: string]: string } = {
    "12": "Mensual (12 pagos/año)",
    "6": "Bimestral (6 pagos/año)",
    "4": "Trimestral (4 pagos/año)",
    "3": "Cuatrimestral (3 pagos/año)",
    "2": "Semestral (2 pagos/año)",
    "1": "Anual (1 pago/año)",
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Progress Bar */}
      <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-blue-900">
              Progreso del Formulario
            </span>
          </div>
          <div className="flex-1">
            <div className="w-full bg-blue-100 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
          <span className="text-sm font-medium text-blue-700">
            {completionPercentage}%
          </span>
        </div>
        {completionPercentage === 100 && (
          <div className="mt-2 flex items-center gap-2 text-green-700">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm font-medium">
              ¡Formulario completo! Listo para registrar.
            </span>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* DATOS BÁSICOS */}
            <Card className="p-6 border-blue-300 bg-white shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <Info className="w-5 h-5 text-blue-600" />
                <h3 className="text-xl font-bold text-blue-900">
                  Datos Básicos del Bono
                </h3>
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
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">
                    Valor Nominal (VN) *
                  </Label>
                  <div className="relative">
                    <Input
                      {...form.register("valorNominal")}
                      type="number"
                      step="0.01"
                      placeholder="1000.00"
                      className="border-gray-300 focus:border-blue-500 pr-12"
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                      {watchedValues.moneda || "PEN"}
                    </span>
                  </div>
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
                        Valor nominal válido
                      </div>
                    )}
                  {watchedValues.valorNominal &&
                    parseFloat(watchedValues.valorNominal) > 1000000 && (
                      <div className="mt-2 text-xs text-orange-600 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Valor alto - Verifique el monto
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
                      <SelectItem value="PEN">
                        🇵🇪 Soles Peruanos (PEN)
                      </SelectItem>
                      <SelectItem value="USD">
                        🇺🇸 Dólares Americanos (USD)
                      </SelectItem>
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

            {/* CONDICIONES FINANCIERAS */}
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
                      <SelectItem value="Nominal">📊 Tasa Nominal</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.tipoTasa && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {form.formState.errors.tipoTasa.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">
                    Tasa Anual *
                  </Label>
                  <div className="relative">
                    <Input
                      {...form.register("tasaAnual")}
                      type="number"
                      step="0.01"
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
                    parseFloat(watchedValues.tasaAnual) > 0 && (
                      <div className="mt-2 text-xs text-green-600 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Tasa válida para método francés
                      </div>
                    )}
                  {watchedValues.tasaAnual &&
                    parseFloat(watchedValues.tasaAnual) > 25 && (
                      <div className="mt-2 text-xs text-orange-600 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Tasa muy alta - Verifique el valor
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
                        <p>
                          Método francés: cuotas constantes en cada período.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </Label>
                  <Select
                    value={form.watch("frecuenciaPago")}
                    onValueChange={(value) =>
                      form.setValue("frecuenciaPago", value)
                    }
                  >
                    <SelectTrigger className="border-gray-300 focus:border-blue-500">
                      <SelectValue placeholder="Frecuencia" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="12">
                        📅 Mensual (12 pagos/año)
                      </SelectItem>
                      <SelectItem value="6">
                        📅 Bimestral (6 pagos/año)
                      </SelectItem>
                      <SelectItem value="4">
                        📅 Trimestral (4 pagos/año)
                      </SelectItem>
                      <SelectItem value="3">
                        📅 Cuatrimestral (3 pagos/año)
                      </SelectItem>
                      <SelectItem value="2">
                        📅 Semestral (2 pagos/año)
                      </SelectItem>
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

                {tipoTasa === "Nominal" && (
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">
                      Frecuencia de Capitalización
                    </Label>
                    <Select
                      value={form.watch("frecuenciaCapitalizacion") || ""}
                      onValueChange={(value) =>
                        form.setValue("frecuenciaCapitalizacion", value)
                      }
                    >
                      <SelectTrigger className="border-gray-300 focus:border-blue-500">
                        <SelectValue placeholder="Capitalización" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="360">🔄 Diaria</SelectItem>
                        <SelectItem value="12">🔄 Mensual</SelectItem>
                        <SelectItem value="6">🔄 Bimestral</SelectItem>
                        <SelectItem value="4">🔄 Trimestral</SelectItem>
                        <SelectItem value="3">🔄 Cuatrimestral</SelectItem>
                        <SelectItem value="2">🔄 Semestral</SelectItem>
                        <SelectItem value="1">🔄 Anual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">
                    Plazo (años) *
                  </Label>
                  <Input
                    {...form.register("plazo")}
                    type="number"
                    min="1"
                    max="30"
                    placeholder="5"
                    className="border-gray-300 focus:border-blue-500"
                  />
                  {form.formState.errors.plazo && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {form.formState.errors.plazo.message}
                    </p>
                  )}
                </div>
              </div>
            </Card>

            {/* CONDICIONES DE GRACIA */}
            <Card className="p-6 border-orange-300 bg-white shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <AlertCircle className="w-5 h-5 text-orange-600" />
                <h3 className="text-xl font-bold text-orange-900">
                  Período de Gracia
                </h3>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-4 h-4 text-orange-400 cursor-pointer" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Período inicial donde se pueden diferir pagos.</p>
                    <p>Total: sin pagos | Parcial: solo intereses</p>
                  </TooltipContent>
                </Tooltip>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">
                    Tipo de Gracia *
                  </Label>
                  <Select
                    value={form.watch("tipoGracia")}
                    onValueChange={(value) =>
                      form.setValue("tipoGracia", value)
                    }
                  >
                    <SelectTrigger className="border-gray-300 focus:border-blue-500">
                      <SelectValue placeholder="Tipo de gracia" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sin Gracia">🚫 Sin Gracia</SelectItem>
                      <SelectItem value="Total">⏸️ Gracia Total</SelectItem>
                      <SelectItem value="Parcial">⏯️ Gracia Parcial</SelectItem>
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
                      placeholder="2"
                      className="border-gray-300 focus:border-blue-500"
                    />
                    {form.formState.errors.nGracia && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {form.formState.errors.nGracia.message}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </Card>

            {/* COMISIONES */}
            <Card className="p-6 border-purple-300 bg-white shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <Calculator className="w-5 h-5 text-purple-600" />
                <h3 className="text-xl font-bold text-purple-900">
                  Comisiones y Costos
                </h3>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">
                    Comisión del Emisor (%) *
                  </Label>
                  <div className="relative">
                    <Input
                      {...form.register("comisionEmisor")}
                      type="number"
                      step="0.01"
                      min="0"
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
                  <Label className="text-sm font-semibold text-gray-700">
                    Comisión del Bonista (%) *
                  </Label>
                  <div className="relative">
                    <Input
                      {...form.register("comisionBonista")}
                      type="number"
                      step="0.01"
                      min="0"
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
              </div>
            </Card>

            {/* SUBMIT BUTTON */}
            <div className="flex justify-end pt-6">
              <Button
                type="submit"
                disabled={isSubmitting || completionPercentage < 100}
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
            {/* Toggle Button */}
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCalculations(!showCalculations)}
              className="w-full"
            >
              {showCalculations ? (
                <>
                  <EyeOff className="mr-2 h-4 w-4" />
                  Ocultar Cálculos
                </>
              ) : (
                <>
                  <Eye className="mr-2 h-4 w-4" />
                  Mostrar Cálculos
                </>
              )}
            </Button>

            {showCalculations && (
              <Card className="p-6 bg-gradient-to-br from-gray-50 to-blue-50 border-blue-200">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  <h4 className="font-bold text-blue-900">
                    Cálculos en Tiempo Real
                  </h4>
                </div>

                {calculatedMetrics ? (
                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-lg border border-blue-200">
                      <h5 className="font-semibold text-gray-800 mb-3">
                        Tasas Calculadas
                      </h5>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">TCEA:</span>
                          <span className="font-mono text-sm font-semibold text-green-700">
                            {calculatedMetrics.tcea.toFixed(4)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">TREA:</span>
                          <span className="font-mono text-sm font-semibold text-blue-700">
                            {calculatedMetrics.trea.toFixed(4)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg border border-blue-200">
                      <h5 className="font-semibold text-gray-800 mb-3">
                        Método Francés
                      </h5>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">
                            Total Períodos:
                          </span>
                          <span className="font-mono text-sm font-semibold">
                            {calculatedMetrics.totalPeriodos}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">
                            Cuota Constante:
                          </span>
                          <span className="font-mono text-sm font-semibold text-purple-700">
                            {watchedValues.moneda}{" "}
                            {calculatedMetrics.cuotaConstante.toLocaleString(
                              "es-PE",
                              { minimumFractionDigits: 2 }
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">
                            Total Intereses:
                          </span>
                          <span className="font-mono text-sm font-semibold text-orange-700">
                            {watchedValues.moneda}{" "}
                            {calculatedMetrics.totalIntereses.toLocaleString(
                              "es-PE",
                              { minimumFractionDigits: 2 }
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">
                            Total a Pagar:
                          </span>
                          <span className="font-mono text-sm font-semibold text-red-700">
                            {watchedValues.moneda}{" "}
                            {calculatedMetrics.totalPagado.toLocaleString(
                              "es-PE",
                              { minimumFractionDigits: 2 }
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg border border-blue-200">
                      <h5 className="font-semibold text-gray-800 mb-3">
                        Frecuencia Seleccionada
                      </h5>
                      <p className="text-sm text-gray-600">
                        {frequencyLabels[watchedValues.frecuenciaPago] ||
                          "No seleccionada"}
                      </p>
                    </div>

                    {/* Recommendations */}
                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                      <h5 className="font-semibold text-yellow-800 mb-2">
                        💡 Recomendaciones
                      </h5>
                      <div className="space-y-1 text-xs text-yellow-700">
                        {calculatedMetrics.trea > 15 && (
                          <p>• TREA alta: Considere reducir comisiones</p>
                        )}
                        {calculatedMetrics.totalPeriodos > 60 && (
                          <p>• Muchos períodos: Evalúe impacto en flujo</p>
                        )}
                        {watchedValues.frecuenciaPago === "12" && (
                          <p>• Pagos mensuales: Mayor control de flujo</p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calculator className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">
                      Complete los campos principales para ver los cálculos en
                      tiempo real
                    </p>
                  </div>
                )}
              </Card>
            )}

            {/* PREVIEW DE FLUJOS DE CAJA */}
            {calculatedMetrics && completionPercentage > 80 && (
              <Card className="p-6 border-indigo-300 bg-gradient-to-br from-indigo-50 to-purple-50 shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                  <BarChart3 className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-xl font-bold text-indigo-900">
                    Vista Previa - Método Francés
                  </h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPreview(!showPreview)}
                  >
                    {showPreview ? "Ocultar" : "Mostrar"} Detalles
                  </Button>
                </div>

                <div className="grid md:grid-cols-3 gap-4 mb-4">
                  <div className="bg-white p-4 rounded-lg border border-indigo-200">
                    <div className="text-sm text-gray-600 mb-1">
                      Cuotas Constantes
                    </div>
                    <div className="text-lg font-bold text-indigo-700">
                      {watchedValues.moneda}{" "}
                      {calculatedMetrics.cuotaConstante.toLocaleString(
                        "es-PE",
                        { minimumFractionDigits: 2 }
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      Durante {calculatedMetrics.totalPeriodos} períodos
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-lg border border-indigo-200">
                    <div className="text-sm text-gray-600 mb-1">
                      Total Intereses
                    </div>
                    <div className="text-lg font-bold text-orange-700">
                      {watchedValues.moneda}{" "}
                      {calculatedMetrics.totalIntereses.toLocaleString(
                        "es-PE",
                        { minimumFractionDigits: 2 }
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      {(
                        (calculatedMetrics.totalIntereses /
                          parseFloat(watchedValues.valorNominal || "1")) *
                        100
                      ).toFixed(1)}
                      % del VN
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-lg border border-indigo-200">
                    <div className="text-sm text-gray-600 mb-1">TREA Final</div>
                    <div className="text-lg font-bold text-blue-700">
                      {calculatedMetrics.trea.toFixed(4)}%
                    </div>
                    <div className="text-xs text-gray-500">
                      Rendimiento efectivo anual
                    </div>
                  </div>
                </div>

                {showPreview && (
                  <div className="bg-white p-4 rounded-lg border border-indigo-200">
                    <h5 className="font-semibold text-gray-800 mb-3">
                      Características del Método Francés
                    </h5>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <h6 className="font-medium text-gray-700 mb-2">
                          ✅ Ventajas:
                        </h6>
                        <ul className="space-y-1 text-gray-600">
                          <li>• Cuotas constantes fáciles de planificar</li>
                          <li>• Flujo de caja predecible</li>
                          <li>• Ideal para presupuestos fijos</li>
                        </ul>
                      </div>
                      <div>
                        <h6 className="font-medium text-gray-700 mb-2">
                          ⚠️ Consideraciones:
                        </h6>
                        <ul className="space-y-1 text-gray-600">
                          <li>• Mayor pago de intereses al inicio</li>
                          <li>• Amortización creciente en el tiempo</li>
                          <li>• TREA incluye todas las comisiones</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Información educativa sobre frecuencia */}
      {watchedValues.frecuenciaPago && (
        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-xs text-blue-800">
            <strong>Método Francés:</strong> Con{" "}
            {frequencyLabels[watchedValues.frecuenciaPago]?.toLowerCase()},
            tendrás{" "}
            {parseInt(watchedValues.frecuenciaPago) *
              parseInt(watchedValues.plazo || "1")}{" "}
            cuotas constantes de{" "}
            {calculatedMetrics ? (
              <span className="font-mono font-semibold">
                {watchedValues.moneda}{" "}
                {calculatedMetrics.cuotaConstante.toLocaleString("es-PE", {
                  minimumFractionDigits: 2,
                })}
              </span>
            ) : (
              "cantidad a calcular"
            )}
          </div>
        </div>
      )}

      {/* INFORMACIÓN MÉTODO FRANCÉS */}
      <Card className="p-6 border-emerald-300 bg-gradient-to-br from-emerald-50 to-green-50 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Calculator className="w-5 h-5 text-emerald-600" />
          <h3 className="text-xl font-bold text-emerald-900">
            Método Francés - Cuotas Constantes
          </h3>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h4 className="font-semibold text-emerald-800">
              ✅ Características Principales:
            </h4>
            <ul className="space-y-2 text-sm text-emerald-700">
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-1">•</span>
                <span>
                  <strong>Cuotas constantes:</strong> Mismo monto en cada
                  período
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-1">•</span>
                <span>
                  <strong>Interés decreciente:</strong> Más interés al inicio
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-1">•</span>
                <span>
                  <strong>Amortización creciente:</strong> Más capital al final
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-1">•</span>
                <span>
                  <strong>TREA automática:</strong> Incluye todas las comisiones
                </span>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-emerald-800">
              💡 Beneficios para:
            </h4>
            <ul className="space-y-2 text-sm text-emerald-700">
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-1">•</span>
                <span>
                  <strong>Emisores:</strong> Flujo de caja predecible
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-1">•</span>
                <span>
                  <strong>Inversionistas:</strong> Fácil planificación
                  financiera
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-1">•</span>
                <span>
                  <strong>Presupuesto:</strong> Cuotas iguales = fácil control
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-1">•</span>
                <span>
                  <strong>Transparencia:</strong> Cálculos automáticos
                </span>
              </li>
            </ul>
          </div>
        </div>

        {calculatedMetrics && (
          <div className="mt-4 p-4 bg-white rounded-lg border border-emerald-200">
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-700 mb-1">
                {calculatedMetrics.totalPeriodos} cuotas
              </div>
              <div className="text-sm text-emerald-600">
                de {watchedValues.moneda}{" "}
                {calculatedMetrics.cuotaConstante.toLocaleString("es-PE", {
                  minimumFractionDigits: 2,
                })}{" "}
                cada una
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
