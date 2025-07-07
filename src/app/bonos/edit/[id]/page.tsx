"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/firebase";
import { useCurrentUser } from "@/lib/firebase/useCurrentUser";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import type { BonoData } from "@/lib/bono/bonoUtils";
import {
  calcularTCEABono,
  checkBonoNameExistsForEdit,
} from "@/lib/bono/bonoUtils";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Loader2,
  Info,
  Calculator,
  AlertCircle,
  Save,
  ArrowLeft,
  Plus,
  Trash2,
} from "lucide-react";

// Schema de validación igual al BonoFormEnhanced
const bonoFormSchema = z
  .object({
    nombre: z
      .string()
      .min(1, "El nombre es requerido")
      .min(3, "El nombre debe tener al menos 3 caracteres")
      .max(100, "El nombre no puede exceder 100 caracteres"),
    valorNominal: z
      .string()
      .min(1, "El valor nominal es requerido")
      .refine((val) => {
        const num = parseFloat(val);
        return !isNaN(num) && num > 0 && num % 1000 === 0;
      }, "El valor nominal debe ser un múltiplo de 1000"),
    moneda: z
      .string()
      .min(1, "La moneda es requerida")
      .refine((val) => ["PEN", "USD", "EUR"].includes(val), "Moneda no válida"),
    tipoTasa: z
      .string()
      .min(1, "El tipo de tasa es requerido")
      .refine((val) => ["Efectiva"].includes(val), "Tipo de tasa no válido"),
    tasaAnual: z
      .string()
      .min(1, "La tasa anual es requerida")
      .refine((val) => {
        const num = parseFloat(val);
        return !isNaN(num) && num >= 2 && num <= 10;
      }, "La tasa debe estar entre 2% y 10%"),
    frecuenciaPago: z
      .string()
      .min(1, "La frecuencia de pago es requerida")
      .refine(
        (val) => ["1", "2"].includes(val),
        "Solo se permite frecuencia anual (1) o semestral (2)"
      ),
    plazo: z
      .string()
      .min(1, "El plazo es requerido")
      .refine((val) => {
        const num = parseInt(val);
        return !isNaN(num) && num >= 3 && num <= 10;
      }, "El plazo debe estar entre 3 y 10 años"),
    tipoGracia: z
      .string()
      .min(1, "El tipo de gracia es requerido")
      .refine(
        (val) => ["Sin Gracia", "Ninguno", "Parcial", "Total"].includes(val),
        "Tipo de gracia no válido"
      ),
    esGraciaDinamica: z.boolean().optional(),
    nGracia: z.string().optional(),
    fechaEmision: z
      .string()
      .min(1, "La fecha de emisión es requerida")
      .refine((val) => {
        const fecha = new Date(val);
        const hoy = new Date();
        const futuroLimite = new Date();
        futuroLimite.setFullYear(hoy.getFullYear() + 2);

        return fecha <= futuroLimite && fecha >= new Date("2000-01-01");
      }, "La fecha debe ser válida y no muy lejana en el futuro"),
    comisionEmisor: z
      .string()
      .min(1, "La comisión del emisor es requerida")
      .refine((val) => {
        const num = parseFloat(val);
        return !isNaN(num) && num >= 0 && num <= 10;
      }, "La comisión del emisor debe estar entre 0% y 10%"),
    comisionBonista: z
      .string()
      .min(1, "La comisión del bonista es requerida")
      .refine((val) => {
        const num = parseFloat(val);
        return !isNaN(num) && num >= 0 && num <= 10;
      }, "La comisión del bonista debe estar entre 0% y 10%"),
    tasaMercadoCOK: z
      .string()
      .min(1, "La tasa de mercado (COK) es requerida")
      .refine((val) => {
        const num = parseFloat(val);
        return !isNaN(num) && num >= 3 && num <= 20;
      }, "La tasa de mercado (COK) debe estar entre 3% y 20%"),
  })
  .superRefine((data, ctx) => {
    // Validar nGracia
    const nGracia = parseInt(data.nGracia || "0");
    const plazo = parseInt(data.plazo || "0");
    const frecuencia = parseInt(data.frecuenciaPago || "1");

    if (isNaN(nGracia) || nGracia < 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["nGracia"],
        message:
          "Los períodos de gracia deben ser un número válido y no negativo",
      });
    }

    if (
      (data.tipoGracia === "Sin Gracia" || data.tipoGracia === "Ninguno") &&
      nGracia > 0
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["nGracia"],
        message: "Los períodos de gracia deben ser 0 cuando no hay gracia",
      });
    }

    if (plazo > 0 && frecuencia > 0) {
      const totalPeriodos = plazo * frecuencia;
      if (nGracia > totalPeriodos) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["nGracia"],
          message: `Los períodos de gracia no pueden exceder ${totalPeriodos} (total de períodos)`,
        });
      }
    }
  });

type BonoFormData = z.infer<typeof bonoFormSchema>;

interface GraciaPeriodoBono {
  id: string;
  desde: number;
  hasta: number;
  tipoGracia: "Sin Gracia" | "Parcial" | "Total";
}

export default function EditarBonoPage() {
  const { firebaseUser } = useCurrentUser();
  const { id } = useParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [graciasPorPeriodo, setGraciasPorPeriodo] = useState<
    GraciaPeriodoBono[]
  >([]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<BonoFormData>({
    resolver: zodResolver(bonoFormSchema),
    defaultValues: {
      nombre: "",
      valorNominal: "",
      moneda: "",
      tipoTasa: "Efectiva",
      tasaAnual: "",
      frecuenciaPago: "",
      plazo: "",
      tipoGracia: "Sin Gracia",
      esGraciaDinamica: false,
      nGracia: "0",
      fechaEmision: "",
      comisionEmisor: "",
      comisionBonista: "",
      tasaMercadoCOK: "",
    },
  });

  const watchedFields = watch();
  const tipoGracia = watch("tipoGracia");
  const esGraciaDinamica = watch("esGraciaDinamica");

  useEffect(() => {
    if (!firebaseUser || !id) return;

    setIsLoading(true);
    const ref = doc(db, "bonds", String(id));

    getDoc(ref)
      .then((snap) => {
        if (!snap.exists() || snap.data().userId !== firebaseUser.uid) {
          toast.error("Bono no encontrado o sin permisos");
          router.replace("/bonos/list");
        } else {
          const data = snap.data() as BonoData;

          // Convertir fecha si es Timestamp
          let fechaEmision = "";
          if (data.fechaEmision) {
            if (
              typeof data.fechaEmision === "object" &&
              "seconds" in data.fechaEmision
            ) {
              fechaEmision = new Date(data.fechaEmision.seconds * 1000)
                .toISOString()
                .slice(0, 10);
            } else {
              fechaEmision = String(data.fechaEmision);
            }
          }

          // Resetear el formulario con los datos del bono
          reset({
            nombre: data.nombre || "",
            valorNominal: String(data.valorNominal || ""),
            moneda: data.moneda || "",
            tipoTasa: data.tipoTasa || "Efectiva",
            tasaAnual: String(data.tasaAnual || ""),
            frecuenciaPago: String(data.frecuenciaPago || ""),
            plazo: String(data.plazo || ""),
            tipoGracia: data.tipoGracia || "Sin Gracia",
            esGraciaDinamica: data.esGraciaDinamica || false,
            nGracia: String(data.nGracia || 0),
            fechaEmision,
            comisionEmisor: String(data.comisionEmisor || ""),
            comisionBonista: String(data.comisionBonista || ""),
            tasaMercadoCOK: String(data.tasaMercadoCOK || ""),
          });

          // Cargar períodos de gracia dinámicos si existen
          if (data.graciasPorPeriodo) {
            setGraciasPorPeriodo(
              data.graciasPorPeriodo.map((g, index) => ({
                id: `gracia-${index}`,
                desde: g.desde,
                hasta: g.hasta,
                tipoGracia: g.tipoGracia,
              }))
            );
          }

          // Mostrar sección avanzada si tiene configuración avanzada
          if (
            data.esGraciaDinamica ||
            (data.graciasPorPeriodo && data.graciasPorPeriodo.length > 0)
          ) {
            setShowAdvanced(true);
          }
        }
      })
      .catch((error) => {
        console.error("Error cargando bono:", error);
        toast.error("Error al cargar el bono");
        router.replace("/bonos/list");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [firebaseUser, id, router, reset]);

  const addGraciaPeriodo = () => {
    const newPeriodo: GraciaPeriodoBono = {
      id: `gracia-${Date.now()}`,
      desde: 1,
      hasta: 1,
      tipoGracia: "Parcial",
    };
    setGraciasPorPeriodo([...graciasPorPeriodo, newPeriodo]);
  };

  const removeGraciaPeriodo = (id: string) => {
    setGraciasPorPeriodo(graciasPorPeriodo.filter((g) => g.id !== id));
  };

  const updateGraciaPeriodo = (
    id: string,
    field: string,
    value: string | number
  ) => {
    setGraciasPorPeriodo(
      graciasPorPeriodo.map((g) => (g.id === id ? { ...g, [field]: value } : g))
    );
  };

  const onSubmit = async (data: BonoFormData) => {
    if (!firebaseUser || !id) return;

    try {
      // Verificar si ya existe un bono con el mismo nombre (excluyendo el actual)
      const nameExists = await checkBonoNameExistsForEdit(
        firebaseUser.uid,
        data.nombre,
        String(id)
      );
      if (nameExists) {
        toast.error(
          `Ya existe otro bono con el nombre "${data.nombre}". Por favor, elige un nombre diferente.`
        );
        return;
      }

      // Preparar los datos actualizados
      const updatedData: Partial<BonoData> = {
        nombre: data.nombre,
        valorNominal: parseFloat(data.valorNominal),
        moneda: data.moneda,
        tipoTasa: data.tipoTasa,
        tasaAnual: parseFloat(data.tasaAnual),
        frecuenciaPago: parseInt(data.frecuenciaPago),
        plazo: parseInt(data.plazo),
        tipoGracia: data.tipoGracia,
        esGraciaDinamica: data.esGraciaDinamica || false,
        nGracia: parseInt(data.nGracia || "0"),
        fechaEmision: data.fechaEmision,
        comisionEmisor: parseFloat(data.comisionEmisor),
        comisionBonista: parseFloat(data.comisionBonista),
        tasaMercadoCOK: parseFloat(data.tasaMercadoCOK),
      };

      // Agregar períodos de gracia dinámicos si existen
      if (data.esGraciaDinamica && graciasPorPeriodo.length > 0) {
        updatedData.graciasPorPeriodo = graciasPorPeriodo.map((g) => ({
          desde: g.desde,
          hasta: g.hasta,
          tipoGracia: g.tipoGracia,
        }));
      } else {
        updatedData.graciasPorPeriodo = [];
      } // Calcular automáticamente la TCEA (ya no usamos TREA)
      try {
        const bonoCompleto = updatedData as BonoData;
        const tcea = calcularTCEABono(bonoCompleto);
        updatedData.tasaMercado = tcea;
      } catch (error) {
        console.error("Error calculando TCEA:", error);
        updatedData.tasaMercado = 0;
      }

      const ref = doc(db, "bonds", String(id));
      await updateDoc(ref, updatedData);

      toast.success("✅ Bono actualizado correctamente");
      router.push("/bonos/list");
    } catch (error) {
      console.error("Error actualizando bono:", error);
      toast.error("Error al actualizar el bono");
    }
  };

  if (!firebaseUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin" />
          <p>Cargando sesión...</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin" />
          <p>Cargando bono...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Editar Bono</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Modifica los parámetros del bono. La TCEA se recalculará
          automáticamente.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Información Básica */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Info className="h-5 w-5" />
            Información Básica
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nombre">
                Nombre del Bono <span className="text-red-500">*</span>
              </Label>
              <Input
                id="nombre"
                {...register("nombre")}
                placeholder="Ej: Bono Corporativo 2024"
              />
              {errors.nombre && (
                <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.nombre.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="valorNominal">
                Valor Nominal <span className="text-red-500">*</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 inline-block ml-1 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Debe ser múltiplo de 1000</p>
                  </TooltipContent>
                </Tooltip>
              </Label>
              <Input
                id="valorNominal"
                type="number"
                step="1000"
                {...register("valorNominal")}
                placeholder="10000"
              />
              {errors.valorNominal && (
                <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.valorNominal.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="moneda">
                Moneda <span className="text-red-500">*</span>
              </Label>
              <Select
                value={watchedFields.moneda}
                onValueChange={(val) => setValue("moneda", val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona moneda" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PEN">PEN (Soles)</SelectItem>
                  <SelectItem value="USD">USD (Dólares)</SelectItem>
                  <SelectItem value="EUR">EUR (Euros)</SelectItem>
                </SelectContent>
              </Select>
              {errors.moneda && (
                <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.moneda.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="fechaEmision">
                Fecha de Emisión <span className="text-red-500">*</span>
              </Label>
              <Input
                id="fechaEmision"
                type="date"
                {...register("fechaEmision")}
              />
              {errors.fechaEmision && (
                <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.fechaEmision.message}
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* Parámetros Financieros */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Parámetros Financieros
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="tipoTasa">
                Tipo de Tasa <span className="text-red-500">*</span>
              </Label>
              <Select
                value={watchedFields.tipoTasa}
                onValueChange={(val) => setValue("tipoTasa", val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tipo de tasa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Efectiva">Efectiva</SelectItem>
                </SelectContent>
              </Select>
              {errors.tipoTasa && (
                <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.tipoTasa.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="tasaAnual">
                Tasa Anual (%) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="tasaAnual"
                type="number"
                step="0.01"
                min="2"
                max="10"
                {...register("tasaAnual")}
                placeholder="8.50"
              />
              {errors.tasaAnual && (
                <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.tasaAnual.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="frecuenciaPago">
                Frecuencia de Pago <span className="text-red-500">*</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 inline-block ml-1 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Solo se permiten pagos anuales o semestrales</p>
                  </TooltipContent>
                </Tooltip>
              </Label>
              <Select
                value={watchedFields.frecuenciaPago}
                onValueChange={(val) => setValue("frecuenciaPago", val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Frecuencia" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">Semestral</SelectItem>
                  <SelectItem value="1">Anual</SelectItem>
                </SelectContent>
              </Select>
              {errors.frecuenciaPago && (
                <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.frecuenciaPago.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="plazo">
                Plazo (años) <span className="text-red-500">*</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 inline-block ml-1 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Entre 3 y 10 años</p>
                  </TooltipContent>
                </Tooltip>
              </Label>
              <Input
                id="plazo"
                type="number"
                min="3"
                max="10"
                {...register("plazo")}
                placeholder="5"
              />
              {errors.plazo && (
                <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.plazo.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="comisionEmisor">
                Comisión del Emisor (%) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="comisionEmisor"
                type="number"
                step="0.01"
                min="0"
                max="10"
                {...register("comisionEmisor")}
                placeholder="1.50"
              />
              {errors.comisionEmisor && (
                <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.comisionEmisor.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="comisionBonista">
                Comisión del Bonista (%) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="comisionBonista"
                type="number"
                step="0.01"
                min="0"
                max="10"
                {...register("comisionBonista")}
                placeholder="0.75"
              />
              {errors.comisionBonista && (
                <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.comisionBonista.message}
                </p>
              )}
            </div>

            <div>
              <Label
                htmlFor="tasaMercadoCOK"
                className="flex items-center gap-2"
              >
                Tasa de Mercado (COK) % <span className="text-red-500">*</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 text-gray-400 cursor-pointer" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Costo de Oportunidad del Capital. Entre 3% y 20%</p>
                  </TooltipContent>
                </Tooltip>
              </Label>
              <Input
                id="tasaMercadoCOK"
                type="number"
                step="0.01"
                min="3"
                max="20"
                {...register("tasaMercadoCOK")}
                placeholder="8.50"
              />
              {errors.tasaMercadoCOK && (
                <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.tasaMercadoCOK.message}
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* Configuración de Gracia */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">
            Configuración de Gracia
          </h2>

          <div className="space-y-4">
            <div>
              <Label htmlFor="tipoGracia">
                Tipo de Gracia <span className="text-red-500">*</span>
              </Label>
              <Select
                value={tipoGracia}
                onValueChange={(val) => {
                  setValue("tipoGracia", val);
                  if (val === "Sin Gracia" || val === "Ninguno") {
                    setValue("nGracia", "0");
                    setValue("esGraciaDinamica", false);
                  }
                }}
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
              {errors.tipoGracia && (
                <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.tipoGracia.message}
                </p>
              )}
            </div>

            {(tipoGracia === "Parcial" || tipoGracia === "Total") && (
              <>
                <div>
                  <Label htmlFor="nGracia">N° Períodos de Gracia</Label>
                  <Input
                    id="nGracia"
                    type="number"
                    min="0"
                    {...register("nGracia")}
                    placeholder="2"
                  />
                  {errors.nGracia && (
                    <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.nGracia.message}
                    </p>
                  )}
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Configuración Avanzada</Label>
                      <p className="text-sm text-muted-foreground">
                        Configurar períodos de gracia específicos por período
                      </p>
                    </div>
                    <Switch
                      checked={showAdvanced}
                      onCheckedChange={setShowAdvanced}
                    />
                  </div>

                  {showAdvanced && (
                    <div className="mt-4 space-y-4">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={esGraciaDinamica}
                          onCheckedChange={(checked) => {
                            setValue("esGraciaDinamica", checked);
                            if (!checked) {
                              setGraciasPorPeriodo([]);
                            }
                          }}
                        />
                        <Label>Habilitar gracia dinámica por períodos</Label>
                      </div>

                      {esGraciaDinamica && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">Períodos de Gracia</h4>
                            <Button
                              type="button"
                              size="sm"
                              onClick={addGraciaPeriodo}
                              className="flex items-center gap-2"
                            >
                              <Plus className="h-4 w-4" />
                              Agregar Período
                            </Button>
                          </div>

                          {graciasPorPeriodo.map((gracia) => (
                            <div
                              key={gracia.id}
                              className="p-4 border rounded-lg space-y-3"
                            >
                              <div className="flex justify-between items-center">
                                <h5 className="font-medium">
                                  Período de Gracia
                                </h5>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeGraciaPeriodo(gracia.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>

                              <div className="grid grid-cols-3 gap-3">
                                <div>
                                  <Label>Desde Período</Label>
                                  <Input
                                    type="number"
                                    min="1"
                                    value={gracia.desde}
                                    onChange={(e) =>
                                      updateGraciaPeriodo(
                                        gracia.id,
                                        "desde",
                                        parseInt(e.target.value)
                                      )
                                    }
                                  />
                                </div>
                                <div>
                                  <Label>Hasta Período</Label>
                                  <Input
                                    type="number"
                                    min="1"
                                    value={gracia.hasta}
                                    onChange={(e) =>
                                      updateGraciaPeriodo(
                                        gracia.id,
                                        "hasta",
                                        parseInt(e.target.value)
                                      )
                                    }
                                  />
                                </div>
                                <div>
                                  <Label>Tipo</Label>
                                  <Select
                                    value={gracia.tipoGracia}
                                    onValueChange={(val) =>
                                      updateGraciaPeriodo(
                                        gracia.id,
                                        "tipoGracia",
                                        val
                                      )
                                    }
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="Sin Gracia">
                                        Sin Gracia
                                      </SelectItem>
                                      <SelectItem value="Parcial">
                                        Parcial
                                      </SelectItem>
                                      <SelectItem value="Total">
                                        Total
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </Card>

        {/* Botones de acción */}
        <div className="flex gap-4 justify-end">
          <Button
            variant="outline"
            type="button"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isSubmitting ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </div>
      </form>
    </main>
  );
}
