import { z } from "zod";

// Schema de validación del formulario de bono
export const bonoFormSchema = z
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
    tasaMercadoCOK: z
      .string()
      .min(1, "La tasa de mercado (COK) es requerida")
      .refine((val) => {
        const num = parseFloat(val);
        return !isNaN(num) && num >= 3 && num <= 20;
      }, "La tasa de mercado (COK) debe estar entre 3% y 20%"),
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

export type BonoFormData = z.infer<typeof bonoFormSchema>;

export interface GraciaPeriodoBono {
  id: string;
  desde: number;
  hasta: number;
  tipoGracia: "Sin Gracia" | "Parcial" | "Total";
}

export interface CalculatedMetrics {
  // Tasas tradicionales
  tcea: number;
  trea: number;
  tes?: number; // Tasa Efectiva Semestral

  // Métricas del método francés
  totalPeriodos: number;
  cuotaConstante: number;
  totalIntereses: number;
  totalPagado: number;
  duracion: number;
  convexidad: number;

  // Nuevas métricas del análisis semestral (cuando aplique)
  analisisSemestral?: {
    // Tasas convertidas
    tesMercado: number;

    // Flujos del bono
    cuponSemestral: number;
    numeroSemestres: number;

    // Precios del bono
    precio: number;
    precioMaximoMercado: number;

    // Costos y flujos netos
    montoNetoRecibidoEmisor: number;
    inversionTotalInversionista: number;

    // Tasas de rendimiento específicas
    tceaEmisor: number;
    treaInversionista: number;
    treaSinSAB: number; // TREA sin incluir SAB (comisiones)

    // Indicadores de riesgo mejorados
    duracionMacaulay: number; // en años
    duracionModificada: number;
    convexidadSemestral: number;

    // Clasificación del bono
    esPremium: boolean;
    esDescuento: boolean;
    esParidad: boolean;
  };
}

export interface ValidationResult {
  esValido: boolean;
  mensaje: string;
  tipo: "error" | "success" | "info";
}
