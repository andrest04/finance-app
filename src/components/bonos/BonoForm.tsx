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
} from "@/lib/bonos/bonoUtils";
import { useCurrentUser } from "@/lib/firebase/useCurrentUser";
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
  Plus,
  Trash2,
} from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import {
  calcularFlujoFrances,
  calcularFlujoFrancesDinamico,
} from "@/lib/bonos/metodoFrances";
import {
  calcularDuracion,
  calcularConvexidad,
  type FlujoBono,
} from "@/lib/bonos/indicadoresBono";

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
        return !isNaN(num) && num > 0 && num <= 100;
      }, "La tasa debe estar entre 0% y 100%"),
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
        futuroLimite.setFullYear(hoy.getFullYear() + 2); // Max 2 years in future

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
    tasaMercado: z
      .string()
      .optional()
      .refine((val) => {
        if (!val) return true; // Optional field, will be calculated
        const num = parseFloat(val);
        return !isNaN(num) && num >= 0 && num <= 100;
      }, "La tasa de mercado debe estar entre 0% y 100%"),
  })
  .superRefine((data, ctx) => {
    // Validate nGracia
    const nGracia = parseInt(data.nGracia || "0");
    const plazo = parseInt(data.plazo || "0");
    const frecuencia = parseInt(data.frecuenciaPago || "1");

    // Validar que nGracia sea un número válido
    if (data.nGracia && (isNaN(nGracia) || nGracia < 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["nGracia"],
        message:
          "Los períodos de gracia deben ser un número válido y mayor o igual a 0",
      });
    }

    // Validar coherencia con tipo de gracia
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

    // Validar que no exceda el total de períodos
    if (plazo > 0 && frecuencia > 0) {
      const totalPeriodos = plazo * frecuencia;
      if (nGracia > totalPeriodos) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["nGracia"],
          message: `Los períodos de gracia (${nGracia}) no pueden exceder el total de períodos (${totalPeriodos})`,
        });
      }
    }

    // Validar coherencia con tipo de gracia cuando se requiere gracia
    if (
      (data.tipoGracia === "Parcial" || data.tipoGracia === "Total") &&
      nGracia === 0
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["nGracia"],
        message: `Debe especificar al menos 1 período de gracia para el tipo "${data.tipoGracia}"`,
      });
    }
  });

type BonoFormData = z.infer<typeof bonoFormSchema>;

interface GraciaPeriodoBono {
  id: string;
  desde: number;
  hasta: number;
  tipoGracia: "Sin Gracia" | "Parcial" | "Total";
}

interface CalculatedMetrics {
  tcea: number;
  trea: number;
  tes?: number; // Tasa Efectiva Semestral
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
  const [esGraciaDinamica, setEsGraciaDinamica] = useState(false);
  const [graciasPeriodo, setGraciasPeriodo] = useState<GraciaPeriodoBono[]>([
    { id: "1", desde: 1, hasta: 1, tipoGracia: "Sin Gracia" },
  ]);
  const router = useRouter();

  // Utility function for validating grace periods
  const validarPeriodosGracia = (
    periodos: number,
    totalPeriodos: number,
    tipoGracia?: string
  ): {
    esValido: boolean;
    mensaje: string;
    tipo: "error" | "success" | "info";
  } => {
    if (totalPeriodos === 0) {
      return {
        esValido: false,
        mensaje: "Complete plazo y frecuencia para validar períodos de gracia",
        tipo: "info",
      };
    }

    if (isNaN(periodos) || periodos < 0) {
      return {
        esValido: false,
        mensaje:
          "Los períodos de gracia deben ser un número válido y mayor o igual a 0",
        tipo: "error",
      };
    }

    if (tipoGracia === "Sin Gracia" && periodos > 0) {
      return {
        esValido: false,
        mensaje: "Los períodos de gracia deben ser 0 cuando no hay gracia",
        tipo: "error",
      };
    }

    if (
      (tipoGracia === "Parcial" || tipoGracia === "Total") &&
      periodos === 0
    ) {
      return {
        esValido: false,
        mensaje: `Debe especificar al menos 1 período de gracia para el tipo "${tipoGracia}"`,
        tipo: "error",
      };
    }

    if (periodos > totalPeriodos) {
      return {
        esValido: false,
        mensaje: `Los períodos de gracia (${periodos}) no pueden exceder el total de períodos (${totalPeriodos})`,
        tipo: "error",
      };
    }

    if (periodos > 0 && periodos <= totalPeriodos) {
      return {
        esValido: true,
        mensaje: `Períodos de gracia válidos: ${periodos} de ${totalPeriodos} períodos totales`,
        tipo: "success",
      };
    }

    return {
      esValido: true,
      mensaje: "",
      tipo: "info",
    };
  }; // Form setup
  const form = useForm<BonoFormData>({
    resolver: zodResolver(bonoFormSchema),
    defaultValues: {
      nombre: "",
      valorNominal: "",
      moneda: userCurrency,
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
      tasaMercado: "",
    },
  });

  // Functions for dynamic grace periods
  const agregarGraciaPeriodo = () => {
    // Encontrar el siguiente rango disponible
    const plazo = parseInt(watchedValues.plazo || "0");
    const frecuencia = parseInt(watchedValues.frecuenciaPago || "1");
    const totalPeriodos = plazo > 0 && frecuencia > 0 ? plazo * frecuencia : 0;

    let siguienteDesde = 1;
    let siguienteHasta = 1;

    if (totalPeriodos > 0) {
      // Obtener todos los períodos ocupados
      const periodosOcupados = new Set<number>();
      graciasPeriodo.forEach((rango) => {
        for (let i = rango.desde; i <= rango.hasta; i++) {
          periodosOcupados.add(i);
        }
      });

      // Encontrar el primer período libre
      for (let i = 1; i <= totalPeriodos; i++) {
        if (!periodosOcupados.has(i)) {
          siguienteDesde = i;
          siguienteHasta = i;
          break;
        }
      }
    }

    const nuevaGracia: GraciaPeriodoBono = {
      id: Date.now().toString(),
      desde: siguienteDesde,
      hasta: siguienteHasta,
      tipoGracia: "Sin Gracia",
    };
    setGraciasPeriodo([...graciasPeriodo, nuevaGracia]);
  };

  const eliminarGraciaPeriodo = (id: string) => {
    setGraciasPeriodo(graciasPeriodo.filter((g) => g.id !== id));
  };

  const actualizarGraciaPeriodo = (
    id: string,
    campo: keyof Omit<GraciaPeriodoBono, "id">,
    valor: number | string
  ) => {
    setGraciasPeriodo(
      graciasPeriodo.map((g) => (g.id === id ? { ...g, [campo]: valor } : g))
    );
  };

  // Validar períodos de gracia contra total de períodos
  const validarGraciaContraTotalPeriodos = (
    gracia: GraciaPeriodoBono
  ): string | null => {
    const plazo = parseInt(watchedValues.plazo || "0");
    const frecuencia = parseInt(watchedValues.frecuenciaPago || "1");

    if (plazo > 0 && frecuencia > 0) {
      const totalPeriodos = plazo * frecuencia;

      if (gracia.desde > totalPeriodos) {
        return `Período 'desde' (${gracia.desde}) no puede exceder el total de períodos (${totalPeriodos})`;
      }

      if (gracia.hasta > totalPeriodos) {
        return `Período 'hasta' (${gracia.hasta}) no puede exceder el total de períodos (${totalPeriodos})`;
      }

      if (gracia.desde > gracia.hasta) {
        return `Período 'desde' (${gracia.desde}) no puede ser mayor que 'hasta' (${gracia.hasta})`;
      }
    }

    return null;
  };

  // Validar solapamientos entre rangos de gracia dinámica
  const validarSolapamientosGracia = (
    graciaActual: GraciaPeriodoBono,
    todosLosRangos: GraciaPeriodoBono[]
  ): string | null => {
    // Filtrar otros rangos (excluyendo el actual)
    const otrosRangos = todosLosRangos.filter((g) => g.id !== graciaActual.id);

    for (const otroRango of otrosRangos) {
      // Verificar si hay solapamiento
      const hayConflicto =
        (graciaActual.desde >= otroRango.desde &&
          graciaActual.desde <= otroRango.hasta) ||
        (graciaActual.hasta >= otroRango.desde &&
          graciaActual.hasta <= otroRango.hasta) ||
        (graciaActual.desde <= otroRango.desde &&
          graciaActual.hasta >= otroRango.hasta);

      if (hayConflicto) {
        return `El rango ${graciaActual.desde}-${graciaActual.hasta} se solapa con el rango ${otroRango.desde}-${otroRango.hasta}`;
      }
    }

    return null;
  };

  // Obtener valores mínimos y máximos permitidos para evitar solapamientos
  const obtenerLimitesInput = (
    graciaActual: GraciaPeriodoBono,
    campo: "desde" | "hasta"
  ) => {
    const plazo = parseInt(watchedValues.plazo || "0");
    const frecuencia = parseInt(watchedValues.frecuenciaPago || "1");
    const totalPeriodos = plazo > 0 && frecuencia > 0 ? plazo * frecuencia : 0;

    if (totalPeriodos === 0) return { min: 1, max: undefined };

    if (campo === "desde") {
      // Para "desde": no puede empezar en un período ya ocupado
      const min = 1;
      let max = totalPeriodos;

      // Si hay un "hasta" definido, el "desde" no puede ser mayor
      if (graciaActual.hasta > 0) {
        max = Math.min(max, graciaActual.hasta);
      }

      return { min, max };
    } else {
      // Para "hasta": debe ser >= desde
      const min = Math.max(1, graciaActual.desde || 1);
      const max = totalPeriodos;

      return { min, max };
    }
  };

  // Watch form values for real-time updates
  const watchedValues = form.watch();
  const tipoGracia = form.watch("tipoGracia");

  // Generate preview of periods for dynamic grace
  const generarVistaGraciaPeriodos = useMemo(() => {
    if (
      !esGraciaDinamica ||
      !watchedValues.plazo ||
      !watchedValues.frecuenciaPago
    ) {
      return [];
    }

    const plazo = parseInt(watchedValues.plazo);
    const frecuencia = parseInt(watchedValues.frecuenciaPago);
    const totalPeriodos = plazo * frecuencia;

    const periodos = [];
    for (let i = 1; i <= totalPeriodos; i++) {
      // Find the grace type for this period
      let graciaAplicable: "Sin Gracia" | "Parcial" | "Total" = "Sin Gracia";
      for (const rango of graciasPeriodo) {
        if (i >= rango.desde && i <= rango.hasta) {
          graciaAplicable = rango.tipoGracia;
          break;
        }
      }

      periodos.push({
        periodo: i,
        tipoGracia: graciaAplicable,
      });
    }

    return periodos;
  }, [
    esGraciaDinamica,
    graciasPeriodo,
    watchedValues.plazo,
    watchedValues.frecuenciaPago,
  ]);

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
      }; // Calculate TCEA and TREA
      const tcea = calcularTCEABono(bonoData);
      const trea = calcularTREABono(bonoData);
      // Calculate TES (Tasa Efectiva Semestral) if frequency is semestral
      let tes: number | undefined;
      if (parseInt(frecuenciaPago) === 2) {
        // For semestral frequency, calculate TES from annual rate
        // TES = (1 + TEA)^(1/2) - 1
        const tasaAnualDecimal = parseFloat(tasaAnual) / 100;
        tes = (Math.pow(1 + tasaAnualDecimal, 1 / 2) - 1) * 100;
      }

      // Calculate cash flows using French method
      const mapGracia = (tipo: string): "Ninguno" | "Total" | "Parcial" => {
        if (tipo === "Sin Gracia") return "Ninguno";
        if (tipo === "Total") return "Total";
        if (tipo === "Parcial") return "Parcial";
        return "Ninguno";
      };

      let flujos;
      // Check if dynamic grace is enabled and has grace periods configured
      if (
        esGraciaDinamica &&
        graciasPeriodo.length > 0 &&
        graciasPeriodo.some((g) => g.desde > 0 && g.hasta > 0)
      ) {
        // Use dynamic grace calculation
        flujos = calcularFlujoFrancesDinamico({
          valorNominal: bonoData.valorNominal,
          tasaAnual: bonoData.tasaAnual,
          frecuenciaPago: bonoData.frecuenciaPago,
          plazo: bonoData.plazo,
          graciasPorPeriodo: graciasPeriodo.map((g) => ({
            desde: g.desde,
            hasta: g.hasta,
            tipoGracia: g.tipoGracia,
          })),
        });
      } else {
        // Use traditional static grace calculation
        flujos = calcularFlujoFrances({
          valorNominal: bonoData.valorNominal,
          tasaAnual: bonoData.tasaAnual,
          frecuenciaPago: bonoData.frecuenciaPago,
          plazo: bonoData.plazo,
          gracia: mapGracia(bonoData.tipoGracia),
          numPeriodosGracia: bonoData.nGracia || 0,
        });
      }
      const totalPeriodos = flujos.length;
      const cuotaConstante = flujos.length > 0 ? flujos[0].cuota : 0;
      const totalIntereses = flujos.reduce((sum, f) => sum + f.interes, 0);
      const totalPagado = flujos.reduce((sum, f) => sum + f.cuota, 0);

      // Calculate duration and convexity using actual financial formulas
      const tasaPeriodo = bonoData.tasaAnual / 100 / bonoData.frecuenciaPago;

      // Convert cash flows to the format expected by indicadoresBono functions
      const flujosBono: FlujoBono[] = flujos.map((f) => ({
        periodo: f.periodo,
        flujo: f.cuota,
      }));

      // Calculate actual duration and convexity using proper financial formulas
      const duracion = calcularDuracion(flujosBono, tasaPeriodo);
      const convexidad = calcularConvexidad(flujosBono, tasaPeriodo);

      return {
        tcea,
        trea,
        tes,
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
  }, [watchedValues, firebaseUser, esGraciaDinamica, graciasPeriodo]);

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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {" "}
            {/* DATOS DEL BONO */}
            <Card className="p-6 border-blue-300 bg-white shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <Info className="w-5 h-5 text-blue-600" />
                <h3 className="text-xl font-bold text-blue-900">
                  Datos del Bono
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
                </div>{" "}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">
                    Valor Nominal (VN) *
                  </Label>
                  <Select
                    value={form.watch("valorNominal")}
                    onValueChange={(value) =>
                      form.setValue("valorNominal", value)
                    }
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
                    </SelectContent>
                  </Select>
                  {form.formState.errors.tipoTasa && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {form.formState.errors.tipoTasa.message}
                    </p>
                  )}{" "}
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
                        <p>Tasa de interés anual. Rango válido: 0% - 100%</p>
                      </TooltipContent>
                    </Tooltip>
                  </Label>
                  <div className="relative">
                    <Input
                      {...form.register("tasaAnual")}
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
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
                    </SelectTrigger>{" "}
                    <SelectContent>
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
                </div>{" "}
                <div className="space-y-2">
                  {" "}
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
                        if (
                          !isNaN(plazoNum) &&
                          plazoNum >= 3 &&
                          plazoNum <= 10
                        ) {
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
            </Card>{" "}
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
                    <p>Períodos donde se pueden diferir pagos.</p>
                    <p>
                      • Total: sin pagos | • Parcial: solo intereses | • Sin
                      Gracia: pagos normales
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
                        onValueChange={(value) =>
                          form.setValue("tipoGracia", value)
                        }
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
                          const nGraciaValue = parseInt(
                            watchedValues.nGracia || "0"
                          );
                          const plazo = parseInt(watchedValues.plazo || "0");
                          const frecuencia = parseInt(
                            watchedValues.frecuenciaPago || "1"
                          );
                          const totalPeriodos =
                            plazo > 0 && frecuencia > 0
                              ? plazo * frecuencia
                              : 0;

                          const validacion = validarPeriodosGracia(
                            nGraciaValue,
                            totalPeriodos,
                            tipoGracia
                          );

                          if (!validacion.mensaje) return null;

                          const estilos = {
                            error: "bg-red-50 border-red-200 text-red-700",
                            success:
                              "bg-green-50 border-green-200 text-green-700",
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
                      <div
                        key={gracia.id}
                        className="bg-gray-50 rounded-lg border p-4"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium text-gray-700">
                            Rango #{index + 1}
                          </span>
                          {graciasPeriodo.length > 1 && (
                            <Button
                              type="button"
                              onClick={() => eliminarGraciaPeriodo(gracia.id)}
                              size="sm"
                              variant="ghost"
                              className="text-red-500 hover:text-white hover:bg-red-500 h-8 w-8 p-0"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <Label className="text-xs text-gray-600 mb-1 block">
                              Desde
                            </Label>
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
                              min={obtenerLimitesInput(gracia, "desde").min}
                              max={obtenerLimitesInput(gracia, "desde").max}
                              placeholder="1"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-gray-600 mb-1 block">
                              Hasta
                            </Label>
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
                              min={obtenerLimitesInput(gracia, "hasta").min}
                              max={obtenerLimitesInput(gracia, "hasta").max}
                              placeholder="1"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-gray-600 mb-1 block">
                              Tipo
                            </Label>
                            <Select
                              value={gracia.tipoGracia}
                              onValueChange={(value) =>
                                actualizarGraciaPeriodo(
                                  gracia.id,
                                  "tipoGracia",
                                  value as "Sin Gracia" | "Parcial" | "Total"
                                )
                              }
                            >
                              <SelectTrigger className="h-9">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Sin Gracia">
                                  Sin Gracia
                                </SelectItem>
                                <SelectItem value="Parcial">Parcial</SelectItem>
                                <SelectItem value="Total">Total</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* Validación simplificada */}
                        {(() => {
                          const errorValidacion =
                            validarGraciaContraTotalPeriodos(gracia);
                          const errorSolapamiento = validarSolapamientosGracia(
                            gracia,
                            graciasPeriodo
                          );
                          const error = errorValidacion || errorSolapamiento;

                          if (error) {
                            return (
                              <div className="mt-2 p-2 bg-red-50 rounded border border-red-200">
                                <p className="text-xs text-red-600 flex items-center gap-1">
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
                            plazo > 0 && frecuencia > 0
                              ? plazo * frecuencia
                              : 0;

                          if (
                            totalPeriodos > 0 &&
                            gracia.desde > 0 &&
                            gracia.hasta > 0
                          ) {
                            return (
                              <div className="mt-2 p-2 bg-green-50 rounded border border-green-200">
                                <p className="text-xs text-green-600 flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" />
                                  Períodos {gracia.desde}-{gracia.hasta}:{" "}
                                  {gracia.tipoGracia}
                                </p>
                              </div>
                            );
                          }

                          return null;
                        })()}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
            {/* COSTOS DEL EMISOR */}
            <Card className="p-6 border-purple-300 bg-white shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <Calculator className="w-5 h-5 text-purple-600" />
                <h3 className="text-xl font-bold text-purple-900">
                  Costos del Emisor
                </h3>
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

              <div className="grid md:grid-cols-3 gap-6">
                {" "}
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
                    {" "}
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
                  </div>{" "}
                  <p className="text-xs text-gray-500">
                    Valor fijo establecido por CAVALI
                  </p>
                </div>
              </div>
            </Card>
            {/* RESULTADOS DEL EMISOR */}
            <Card className="p-6 border-green-300 bg-white shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <h3 className="text-xl font-bold text-green-900">
                  Resultados del Emisor
                </h3>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <AlertCircle className="w-4 h-4 text-green-400 cursor-pointer" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Tasa de Costo Efectiva Anual que asume el emisor</p>
                  </TooltipContent>
                </Tooltip>
              </div>

              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="text-center">
                  <div className="text-sm text-green-600 mb-1">
                    TCEA (Emisor)
                  </div>
                  <div className="text-2xl font-bold text-green-700">
                    {calculatedMetrics
                      ? `${calculatedMetrics.tcea.toFixed(4)}%`
                      : "--.--%"}
                  </div>
                  <div className="text-xs text-green-600 mt-1">
                    Incluye todos los costos del emisor
                  </div>
                </div>
              </div>
            </Card>
            {/* RESULTADOS DEL BONISTA */}
            <Card className="p-6 border-indigo-300 bg-white shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <BarChart3 className="w-5 h-5 text-indigo-600" />
                <h3 className="text-xl font-bold text-indigo-900">
                  Resultados del Bonista
                </h3>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <AlertCircle className="w-4 h-4 text-indigo-400 cursor-pointer" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Tasas de rendimiento efectivo para el inversionista</p>
                  </TooltipContent>
                </Tooltip>
              </div>{" "}
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                  <div className="text-center">
                    <div className="text-sm text-indigo-600 mb-1">
                      TREA (Bonista)
                    </div>
                    <div className="text-2xl font-bold text-indigo-700">
                      {calculatedMetrics
                        ? `${calculatedMetrics.trea.toFixed(4)}%`
                        : "--.--%"}
                    </div>
                    <div className="text-xs text-indigo-600 mt-1">
                      Rendimiento efectivo anual
                    </div>
                  </div>
                </div>

                {/* Mostrar TES solo cuando la frecuencia es semestral */}
                {calculatedMetrics?.tes !== undefined && (
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <div className="text-center">
                      <div className="text-sm text-purple-600 mb-1 flex items-center justify-center gap-1">
                        TES (Bonista)
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="w-3 h-3 text-purple-400 cursor-pointer" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Tasa Efectiva Semestral</p>
                            <p>Para frecuencia de pago semestral</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <div className="text-2xl font-bold text-purple-700">
                        {`${calculatedMetrics.tes.toFixed(4)}%`}
                      </div>
                      <div className="text-xs text-purple-600 mt-1">
                        Rendimiento semestral
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <div className="text-center">
                    <div className="text-sm text-yellow-600 mb-1">CAVALI</div>
                    <div className="text-xl font-bold text-yellow-700">
                      0.50%
                    </div>
                    <div className="text-xs text-yellow-600 mt-1">
                      Comisión fija de registro
                    </div>
                  </div>
                </div>
              </div>{" "}
            </Card>
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
                    {" "}
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
                        </div>{" "}
                        {/* Mostrar TES solo cuando la frecuencia es semestral */}
                        {calculatedMetrics.tes !== undefined && (
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600 flex items-center gap-1">
                              TES:
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info className="w-3 h-3 text-gray-400 cursor-pointer" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Tasa Efectiva Semestral</p>
                                  <p>Calculada para frecuencia semestral</p>
                                </TooltipContent>
                              </Tooltip>
                            </span>
                            <span className="font-mono text-sm font-semibold text-purple-700">
                              {calculatedMetrics.tes.toFixed(4)}%
                            </span>
                          </div>
                        )}
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
                    </div>{" "}
                    {/* Recommendations */}
                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                      <h5 className="font-semibold text-yellow-800 mb-2">
                        💡 Recomendaciones
                      </h5>
                      <div className="space-y-1 text-xs text-yellow-700">
                        {calculatedMetrics.trea > 15 && (
                          <p>• TREA alta: Considere reducir comisiones</p>
                        )}
                        {calculatedMetrics.totalPeriodos > 20 && (
                          <p>• Muchos períodos: Evalúe impacto en flujo</p>
                        )}
                        {watchedValues.frecuenciaPago === "2" && (
                          <p>• Pagos semestrales: Mayor control de liquidez</p>
                        )}
                        {calculatedMetrics.tes && calculatedMetrics.tes > 8 && (
                          <p>• TES elevada: Considere ajustar la tasa anual</p>
                        )}
                        {calculatedMetrics.cuotaConstante >
                          parseFloat(watchedValues.valorNominal || "0") *
                            0.2 && (
                          <p>• Cuota alta: Verifique capacidad de pago</p>
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
                )}{" "}
              </Card>
            )}

            {/* PREVIEW DE FLUJOS DE CAJA */}
            {calculatedMetrics && (
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
          </div>{" "}
        </div>
      </div>

      {/* VISTA PREVIA DE PERÍODOS PARA GRACIA DINÁMICA */}
      {esGraciaDinamica && generarVistaGraciaPeriodos.length > 0 && (
        <Card className="p-6 bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-orange-600" />
            <h4 className="font-bold text-orange-900">
              Vista Previa - Períodos con Gracia Dinámica
            </h4>
          </div>

          <div className="max-h-64 overflow-y-auto bg-white rounded-lg border border-orange-200">
            <table className="w-full text-sm">
              <thead className="bg-orange-100 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-orange-800">
                    Período
                  </th>
                  <th className="px-3 py-2 text-center font-semibold text-orange-800">
                    Tipo de Gracia
                  </th>
                </tr>
              </thead>
              <tbody>
                {generarVistaGraciaPeriodos.map((periodo, index) => (
                  <tr
                    key={periodo.periodo}
                    className={`border-b border-orange-100 ${
                      index % 2 === 0 ? "bg-white" : "bg-orange-25"
                    } hover:bg-orange-50 transition-colors`}
                  >
                    <td className="px-3 py-2 font-medium text-gray-700">
                      {periodo.periodo}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {periodo.tipoGracia === "Sin Gracia" && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          🚫 Sin Gracia
                        </span>
                      )}
                      {periodo.tipoGracia === "Parcial" && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                          ⏯️ Gracia Parcial
                        </span>
                      )}
                      {periodo.tipoGracia === "Total" && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          ⏸️ Gracia Total
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-3 p-3 bg-orange-100 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-orange-800">
              <Info className="w-4 h-4" />
              <span className="font-medium">
                Total de períodos: {generarVistaGraciaPeriodos.length}
              </span>
            </div>
            <div className="text-xs text-orange-700 mt-1">
              Los tipos de gracia varían según los rangos configurados. Cada
              período tendrá el tipo de gracia correspondiente al rango al que
              pertenece.
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
